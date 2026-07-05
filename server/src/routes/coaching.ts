import { Router } from 'express'
import { db } from '../db'
import { coachingNotes, days, users } from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requireAuth, requireManager } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

const FOCUS_AREAS = ['floor_presence', 'team_development', 'execution', 'customer_engagement', 'priority_setting']

// POST /coaching — manager creates a coaching note for a leader's day
router.post('/', requireManager, (req, res) => {
  const { dayId, leaderId, focusArea, observation, agreedActions, followUpDate } = req.body ?? {}

  if (!dayId || !leaderId || !focusArea || !observation || !agreedActions) {
    res.status(400).json({ error: 'dayId, leaderId, focusArea, observation, and agreedActions are required' })
    return
  }
  if (!FOCUS_AREAS.includes(focusArea)) {
    res.status(400).json({ error: 'Invalid focusArea' })
    return
  }

  // Verify the day belongs to the leader and both are in the manager's district
  const day = db.select().from(days).where(and(eq(days.id, dayId), eq(days.userId, leaderId))).get()
  if (!day) {
    res.status(404).json({ error: 'Day not found for that leader' })
    return
  }

  const leader = db.select().from(users).where(eq(users.id, leaderId)).get()
  if (!leader || leader.districtId !== req.jwtPayload.districtId) {
    res.status(403).json({ error: 'Leader is not in your district' })
    return
  }

  // Upsert — one coaching note per day
  const existing = db.select().from(coachingNotes).where(eq(coachingNotes.dayId, dayId)).get()
  if (existing) {
    const [updated] = db.update(coachingNotes)
      .set({ focusArea, observation, agreedActions, followUpDate: followUpDate ?? null })
      .where(eq(coachingNotes.id, existing.id))
      .returning().all()
    res.json(formatNote(updated))
    return
  }

  const [note] = db.insert(coachingNotes).values({
    dayId,
    managerId: req.jwtPayload.userId,
    leaderId,
    focusArea,
    observation,
    agreedActions,
    followUpDate: followUpDate ?? null,
    createdAt: new Date(),
  }).returning().all()

  res.status(201).json(formatNote(note))
})

// GET /coaching/day/:dayId — get coaching note for a specific day
router.get('/day/:dayId', (req, res) => {
  const dayId = Number(req.params.dayId)
  const day = db.select().from(days).where(eq(days.id, dayId)).get()
  if (!day) {
    res.status(404).json({ error: 'Day not found' })
    return
  }

  // Leaders can only view their own; managers can view anyone in their district
  const { userId, role, districtId } = req.jwtPayload
  if (role === 'leader' && day.userId !== userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  if (role === 'manager') {
    const leader = db.select().from(users).where(eq(users.id, day.userId)).get()
    if (!leader || leader.districtId !== districtId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
  }

  const note = db.select().from(coachingNotes).where(eq(coachingNotes.dayId, dayId)).get()
  if (!note) {
    res.status(404).json({ error: 'No coaching note for this day' })
    return
  }
  res.json(formatNote(note))
})

// GET /coaching/leader/:leaderId — manager gets all coaching notes for a leader
router.get('/leader/:leaderId', requireManager, (req, res) => {
  const leaderId = Number(req.params.leaderId)
  const leader = db.select().from(users).where(eq(users.id, leaderId)).get()
  if (!leader || leader.districtId !== req.jwtPayload.districtId) {
    res.status(403).json({ error: 'Leader is not in your district' })
    return
  }

  const notes = db.select().from(coachingNotes)
    .where(eq(coachingNotes.leaderId, leaderId))
    .orderBy(desc(coachingNotes.createdAt))
    .all()

  // Attach day date for context
  const enriched = notes.map(n => {
    const day = db.select().from(days).where(eq(days.id, n.dayId)).get()
    return { ...formatNote(n), dayDate: day?.date ?? null, dayOutcome: day?.overallOutcome ?? null }
  })

  res.json(enriched)
})

// GET /coaching/leader/:leaderId/days — leader's recent days available for coaching (manager use)
router.get('/leader/:leaderId/days', requireManager, (req, res) => {
  const leaderId = Number(req.params.leaderId)
  const leader = db.select().from(users).where(eq(users.id, leaderId)).get()
  if (!leader || leader.districtId !== req.jwtPayload.districtId) {
    res.status(403).json({ error: 'Leader is not in your district' })
    return
  }

  const recentDays = db.select().from(days)
    .where(eq(days.userId, leaderId))
    .orderBy(desc(days.date))
    .limit(10)
    .all()

  // Tag which days already have a note
  const tagged = recentDays.map(d => {
    const note = db.select().from(coachingNotes).where(eq(coachingNotes.dayId, d.id)).get()
    return { id: d.id, date: d.date, status: d.status, overallOutcome: d.overallOutcome, hasCoaching: !!note }
  })

  res.json(tagged)
})

function formatNote(n: typeof coachingNotes.$inferSelect) {
  return {
    id: n.id,
    dayId: n.dayId,
    managerId: n.managerId,
    leaderId: n.leaderId,
    focusArea: n.focusArea,
    observation: n.observation,
    agreedActions: n.agreedActions,
    followUpDate: n.followUpDate,
    createdAt: n.createdAt,
  }
}

export default router
