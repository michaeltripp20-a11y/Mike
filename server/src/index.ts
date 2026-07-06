import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'
import daysRouter from './routes/days'
import teamRouter from './routes/team'
import coachingRouter from './routes/coaching'

// Initialize DB on startup
import './db'

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

const allowedOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173').split(',').map(s => s.trim())
console.log('CORS allowedOrigins:', allowedOrigins)
app.use(cors({ origin: true }))
app.use(express.json())

app.use('/auth', authRouter)
app.use('/days', daysRouter)
app.use('/team', teamRouter)
app.use('/coaching', coachingRouter)

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`FloorTracker API running on http://localhost:${PORT}`)
})
