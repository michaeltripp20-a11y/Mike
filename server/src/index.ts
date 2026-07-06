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

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (_req.method === 'OPTIONS') { res.sendStatus(200); return }
  next()
})
app.use(express.json())

app.use('/auth', authRouter)
app.use('/days', daysRouter)
app.use('/team', teamRouter)
app.use('/coaching', coachingRouter)

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`FloorTracker API running on http://localhost:${PORT}`)
})
