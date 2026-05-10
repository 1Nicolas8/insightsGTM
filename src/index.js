import 'dotenv/config'
import express from 'express'
import { ZodError } from 'zod'
import { inputSchema } from './schemas.js'
import { analyze } from './analyzer.js'

const app = express()
const PORT = Number(process.env.PORT || 3000)

app.use(express.json({ limit: '10mb' }))

app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} (${ms}ms)`)
  })
  next()
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.post('/analyze', async (req, res) => {
  let parsed
  try {
    parsed = inputSchema.parse(req.body)
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'El payload no cumple con el schema esperado',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      })
    }
    return res.status(400).json({
      error: 'INVALID_INPUT',
      message: err?.message || 'Payload inválido',
    })
  }

  const leads = Array.isArray(parsed.existing_businesses)
    ? parsed.existing_businesses
    : Array.isArray(parsed.businesses)
    ? parsed.businesses
    : []

  if (!leads.length) {
    return res.status(400).json({
      error: 'EMPTY_BUSINESSES',
      message: 'El array existing_businesses (o businesses) está vacío',
    })
  }

  try {
    const report = await analyze(parsed)
    return res.json(report)
  } catch (err) {
    const msg = err?.message || 'Error desconocido'
    if (/deepseek|openai|api_key/i.test(msg)) {
      return res.status(502).json({
        error: 'AI_FAILURE',
        message: msg,
      })
    }
    console.error('[INTERNAL_ERROR]', err)
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: msg,
    })
  }
})

app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
  })
})

app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'INVALID_INPUT',
      message: 'Payload demasiado grande (límite 10mb)',
    })
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'INVALID_INPUT',
      message: 'JSON malformado en el body',
    })
  }
  console.error('[UNHANDLED]', err)
  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: err?.message || 'Error interno del servidor',
  })
})

app.listen(PORT, () => {
  console.log(`[gtm-insights-module] escuchando en puerto ${PORT}`)
})

export default app
