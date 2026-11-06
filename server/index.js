import express from 'express'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(express.json())

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.')
}

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' })
})

app.post('/api/simplify', (request, response) => {
  const { text } = request.body ?? {}

  if (typeof text !== 'string' || text.trim().length === 0) {
    return response.status(400).json({ error: 'Text must not be empty.' })
  }

  if (text.length > 5000) {
    return response.status(400).json({ error: 'Text must not exceed 5000 characters.' })
  }

  return response.status(200).json({
    summary: 'This document explains an important update and what you need to do.',
    whoItAffects: 'People or organizations named in the document.',
    deadlines: 'Check the document for any dates that apply to you.',
    actionSteps: ['Review the document', 'Confirm whether it applies to you', 'Act before any stated deadline'],
  })
})

app.listen(port, '127.0.0.1', () => {
  console.log(`BridgeAI API listening at http://127.0.0.1:${port}`)
})
