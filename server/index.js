import { GoogleGenAI } from '@google/genai'
import { config as loadEnv } from 'dotenv'
import express from 'express'
import { fileURLToPath } from 'node:url'

import { SYSTEM_PROMPT } from './prompt.js'

loadEnv({
  path: [
    fileURLToPath(new URL('../.env', import.meta.url)),
    fileURLToPath(new URL('./.env', import.meta.url)),
  ],
})

const app = express()
const port = Number(process.env.PORT ?? 3000)
const defaultModel = 'gemini-3.8-flash'
const geminiTimeoutMs = 30_000
const geminiRetryDelayMs = 2_000
const busyErrorMessage = 'The service is busy. Please try again in a minute.'

app.use(express.json())

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.')
}

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' })
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

app.post('/api/simplify', async (request, response) => {
  const { text } = request.body ?? {}

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
      contents: `Return JSON only with these fields: summary, whoItAffects, deadlines, and actionSteps. Do not include markdown. Simplify this text:\n\n${text}`,
      config: {
        temperature: 0.2,
        systemInstruction: SYSTEM_PROMPT,
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

app.listen(port, '127.0.0.1', () => {
  console.log(`BridgeAI API listening at http://127.0.0.1:${port}`)
})
