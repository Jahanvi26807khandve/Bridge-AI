import { GoogleGenAI } from '@google/genai'
import { config as loadEnv } from 'dotenv'
import express from 'express'
import { getAuth } from 'firebase-admin/auth'
import { getApps, initializeApp } from 'firebase-admin/app'
import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import { fileURLToPath } from 'node:url'

import { SYSTEM_PROMPT } from './prompt.js'

loadEnv({
  path: [
    fileURLToPath(new URL('../.env', import.meta.url)),
    fileURLToPath(new URL('./.env', import.meta.url)),
  ],
})

const app = express()
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1)
}
const host = process.env.HOST ?? '127.0.0.1'
const port = Number(process.env.PORT ?? 3000)
const allowedOrigins = (process.env.ALLOWED_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const corsOrigins = allowedOrigins.length
  ? allowedOrigins
  : ['http://localhost:5173']
const defaultModel = 'gemini-3.8-flash'
const geminiTimeoutMs = 30_000
const geminiRetryDelayMs = 2_000
const busyErrorMessage = 'The service is busy. Please try again in a minute.'
const supportedLanguages = ['english', 'hindi', 'marathi']
const supportedLevels = ['simple', 'detailed']
const resultInstructions = {
  english: {
    simple: 'Write the values of summary, whoItAffects, deadlines, and actionSteps in English. Keep the JSON keys exactly in English. Keep dates, times, amounts, names, and numbers exactly as written in the notice. Simple means very short sentences.',
    detailed: 'Write the values of summary, whoItAffects, deadlines, and actionSteps in English. Keep the JSON keys exactly in English. Keep dates, times, amounts, names, and numbers exactly as written in the notice. Detailed means up to 5 sentences in the summary and short explanations of any difficult term.',
  },
  hindi: {
    simple: 'Write the values of summary, whoItAffects, deadlines, and actionSteps in Hindi using Devanagari script. Keep the JSON keys exactly in English. Keep dates, times, amounts, names, and numbers exactly as written in the notice. Simple means very short sentences.',
    detailed: 'Write the values of summary, whoItAffects, deadlines, and actionSteps in Hindi using Devanagari script. Keep the JSON keys exactly in English. Keep dates, times, amounts, names, and numbers exactly as written in the notice. Detailed means up to 5 sentences in the summary and short explanations of any difficult term.',
  },
  marathi: {
    simple: 'Write the values of summary, whoItAffects, deadlines, and actionSteps in Marathi using Devanagari script. Keep the JSON keys exactly in English. Keep dates, times, amounts, names, and numbers exactly as written in the notice. Simple means very short sentences.',
    detailed: 'Write the values of summary, whoItAffects, deadlines, and actionSteps in Marathi using Devanagari script. Keep the JSON keys exactly in English. Keep dates, times, amounts, names, and numbers exactly as written in the notice. Detailed means up to 5 sentences in the summary and short explanations of any difficult term.',
  },
}

app.use((request, response, next) => {
  const origin = request.get('Origin')
  if (origin && corsOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Vary', 'Origin')
    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
      return response.sendStatus(204)
    }
  } else if (request.method === 'OPTIONS') {
    return response.sendStatus(origin ? 403 : 204)
  }
  return next()
})

app.use(express.json({ limit: '20kb' }))

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.')
}

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' })
})

function getFirebaseAdminAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is not configured.')
  }

  const app = getApps().find(({ name }) => name === '[DEFAULT]') ??
    initializeApp({ projectId })
  return getAuth(app)
}

async function authenticateOptionalUser(request, response, next) {
  const authorization = request.get('authorization') ?? ''
  const token = /^Bearer\s+(.+)$/i.exec(authorization)?.[1]?.trim()

  if (!token) {
    return next()
  }

  try {
    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token)
    request.auth = { uid: decodedToken.uid }
    return next()
  } catch (error) {
    console.warn('Firebase token verification failed:', {
      code: error?.code,
      message: error?.message,
    })
    if (['auth/argument-error', 'auth/invalid-id-token', 'auth/id-token-expired'].includes(error?.code)) {
      return response.status(401).json({ error: 'Please sign in again.' })
    }

    return response.status(503).json({ error: 'Unable to verify your sign-in right now.' })
  }
}

const simplifyRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: (request) => request.auth ? 20 : 5,
  keyGenerator: (request) => request.auth
    ? `uid:${request.auth.uid}`
    : `ip:${ipKeyGenerator(request.ip)}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_request, response) => response
    .status(429)
    .json({ error: 'Too many requests. Please try again in a few minutes.' }),
})

function isSimplifyResult(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length === 4 &&
    typeof value.summary === 'string' &&
    typeof value.whoItAffects === 'string' &&
    typeof value.deadlines === 'string' &&
    Array.isArray(value.actionSteps) &&
    value.actionSteps.every((step) => typeof step === 'string')
  )
}

function logGeminiError(error) {
  const apiError = error && typeof error === 'object' ? error : {}
  const message = typeof apiError.message === 'string'
    ? apiError.message.replaceAll(process.env.GEMINI_API_KEY, '[REDACTED]')
    : apiError.message
  console.error('Gemini API request failed:', {
    ...(apiError.status !== undefined ? { status: apiError.status } : {}),
    message,
  })
  return apiError.status
}

app.post('/api/simplify', authenticateOptionalUser, simplifyRateLimit, async (request, response) => {
  const { text, language = 'english', level = 'simple' } = request.body ?? {}

  if (!supportedLanguages.includes(language) || !supportedLevels.includes(level)) {
    return response.status(400).json({ error: 'Unsupported language or reading level.' })
  }

  if (typeof text !== 'string' || text.trim().length === 0) {
    return response.status(400).json({ error: 'Text must not be empty.' })
  }

  if (text.length > 5000) {
    return response.status(400).json({ error: 'Text must not exceed 5000 characters.' })
  }

  if (!process.env.GEMINI_API_KEY) {
    return response.status(502).json({ error: 'Gemini API key is not configured.' })
  }

  let generatedText
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { timeout: geminiTimeoutMs },
    })
    const generateContent = () => ai.models.generateContent({
      model: process.env.GEMINI_MODEL || defaultModel,
      contents: text,
      config: {
        temperature: 0.2,
        systemInstruction: `${SYSTEM_PROMPT}\n\n${resultInstructions[language][level]}`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            summary: { type: 'STRING' },
            whoItAffects: { type: 'STRING' },
            deadlines: { type: 'STRING' },
            actionSteps: { type: 'ARRAY', items: { type: 'STRING' } },
          },
          required: ['summary', 'whoItAffects', 'deadlines', 'actionSteps'],
        },
      },
    })
    let result
    try {
      result = await generateContent()
    } catch (error) {
      const status = logGeminiError(error)
      if (status !== 429 && status !== 503) {
        return response.status(502).json({ error: 'Gemini API request failed.' })
      }

      await new Promise((resolve) => setTimeout(resolve, geminiRetryDelayMs))
      try {
        result = await generateContent()
      } catch (retryError) {
        logGeminiError(retryError)
        return response.status(503).json({ error: busyErrorMessage })
      }
    }
    generatedText = result.text
  } catch (error) {
    logGeminiError(error)
    return response.status(502).json({ error: 'Gemini API request failed.' })
  }

  let simplified
  try {
    simplified = JSON.parse(generatedText)
  } catch {
    return response.status(502).json({ error: 'Gemini returned an invalid JSON response.' })
  }

  if (!isSimplifyResult(simplified)) {
    return response.status(502).json({ error: 'Gemini returned an invalid JSON response.' })
  }

  return response.status(200).json(simplified)
})

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is missing.')
}

if (!process.env.FIREBASE_PROJECT_ID) {
  console.warn('FIREBASE_PROJECT_ID is missing.')
}

app.listen(port, host, () => {
  console.log(`BridgeAI API listening at http://${host}:${port}`)
})
