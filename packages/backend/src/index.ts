import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { capabilitiesRouter } from './routes/capabilities.js'
import { runsRouter } from './routes/runs.js'
import { opsRouter } from './routes/ops.js'
import { configRouter } from './routes/config.js'
import { memoryRouter } from './routes/memory.js'
import { securityRouter } from './routes/security.js'
import { authRouter } from './controllers/auth.js'
import { errorHandler } from './middleware/errorHandler.js'
import { ensureDefaultAdmin } from './services/auth.js'
import { queries } from './db/index.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
}))
app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(compression())
app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', async (_req, res) => {
  await ensureDefaultAdmin()
  queries.sessions.deleteExpired.run()
  queries.memories.deleteExpired.run()
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRouter)
app.use('/api/capabilities', capabilitiesRouter)
app.use('/api/runs', runsRouter)
app.use('/api/ops', opsRouter)
app.use('/api/config', configRouter)
app.use('/api/memory', memoryRouter)
app.use('/api/security', securityRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`ClawOps Backend running on http://localhost:${PORT}`)
  ensureDefaultAdmin().then(() => {
    console.log('Default admin user initialized')
  })
})

export default app
