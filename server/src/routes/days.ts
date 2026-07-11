import { Router } from 'express'
import { db } from '../db'
import { days, commitments } from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function scoreFor(outcome: 'hit' | 'partial' | 'miss') {
  return outcome === 'hit' ? 2 : outcome === 'partial' ? 1 : 0
}

function computeStreak(userId: number): number {
  const closed = db.select().from(days)
    .where(and(eq(days.userId, userId), eq(days.status, 'closed')))
    .orderBy(desc(days.date))
    .all()
  if (!closed.length) return 0

  let streak = 0
  let expected = new Date(todayStr())

  for (const d of closed) {
    const dDate = new Date(d.date)
    const diff = Math.round((expected.getTime() - dDate.getTime()) / 86400000)
    if (diff > 1) break
    if (d.overallOutcome === 'hit' || d.overallOutcome === 'partial') {
      streak++
      expected = dDate
    } else {
      break
    }
  }
  return streak
}

function buildEntry(day: typeof days.$inferSelect) {
  const cs = db.select().from(commitments).where(eq(commitments.dayId, day.id)).all()
  return { ...day, dailyNumber: day.dailyNumber ?? null, commitments: cs }
}

// GET /days/today
router.get('/today', (req, res) => {
  const day = db.select().from(days)
    .where(and(eq(days.userId, req.jwtPayload.userId), eq(days.date, todayStr())))
    .get()
  if (!day) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json(buildEntry(day))
})

// GET /days/history
router.get('/history', (req, res) => {
  const all = db.select().from(days)
    .where(eq(days.userId, req.jwtPayload.userId))
    .orderBy(desc(days.date))
    .all()
  res.json(all.map(buildEntry))
})

// POST /days — open today
router.post('/', (req, res) => {
  const { dailyNumber, commitments: texts } = req.body ?? {}
  if (!Array.isArray(texts) || texts.length === 0) {
    res.status(400).json({ error: 'At least one commitment required' })
    return
  }

  const existing = db.select().from(days)
    .where(and(eq(days.userId, req.jwtPayload.userId), eq(days.date, todayStr())))
    .get()
  if (existing) {
    res.status(409).json({ error: 'Today already started' })
    return
  }

  const [day] = db.insert(days).values({
    userId: req.jwtPayload.userId,
    date: todayStr(),
    dailyNumber: dailyNumber ?? null,
    status: 'open',
    streak: 0,
    createdAt: new Date(),
  }).returning().all()

  const filtered = (texts as string[]).filter(t => t.trim()).slice(0, 3)
  filtered.forEach(text => db.insert(commitments).values({ dayId: day.id, text }).run())

  res.status(201).json(buildEntry(day))
})

// PATCH /days/:id/pace
router.patch('/:id/pace', (req, res) => {
  const id = Number(req.params.id)
  const day = db.select().from(days).where(eq(days.id, id)).get()
  if (!day || day.userId !== req.jwtPayload.userId) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  if (day.status !== 'open') {
    res.status(400).json({ error: 'Day is not open' })
    return
  }

  const { note, commitmentUpdates } = req.body ?? {}
  if (Array.isArray(commitmentUpdates)) {
    for (const { id: cid, outcome } of commitmentUpdates) {
      db.update(commitments).set({ outcome }).where(eq(commitments.id, cid)).run()
    }
  }

  const [updated] = db.update(days).set({ status: 'paced', paceNote: note ?? null }).where(eq(days.id, id)).returning().all()
  res.json(buildEntry(updated))
})

// PATCH /days/:id/close
router.patch('/:id/close', (req, res) => {
  const id = Number(req.params.id)
  const day = db.select().from(days).where(eq(days.id, id)).get()
  if (!day || day.userId !== req.jwtPayload.userId) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  if (day.status === 'closed') {
    res.status(400).json({ error: 'Already closed' })
    return
  }

  const { overallOutcome, commitmentUpdates } = req.body ?? {}
  if (!overallOutcome) {
    res.status(400).json({ error: 'overallOutcome required' })
    return
  }

  if (Array.isArray(commitmentUpdates)) {
    for (const { id: cid, outcome } of commitmentUpdates) {
      db.update(commitments).set({ outcome }).where(eq(commitments.id, cid)).run()
    }
  }

  const pts = scoreFor(overallOutcome)
  const streak = computeStreak(req.jwtPayload.userId)

  // Update streak accounting for today's close
  const yesterdayStreak = streak
  const newStreak = (overallOutcome === 'hit' || overallOutcome === 'partial') ? yesterdayStreak + 1 : 0

  const [updated] = db.update(days).set({
    status: 'closed',
    overallOutcome,
    scorePoints: pts,
    streak: newStreak,
  }).where(eq(days.id, id)).returning().all()

  res.json(buildEntry(updated))
})

export default router
