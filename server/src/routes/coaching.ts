import { Router } from 'express'
import { db } from '../db'
import { coachingNotes, days, users } from '../db/schema'
import { eq, and, desc, isNotNull, ne } from 'drizzle-orm'
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

// GET /coaching/follow-ups — manager: all district follow-ups (overdue + today + upcoming)
router.get('/follow-ups', requireManager, (req, res) => {
  const today = new Date().toISOString().slice(0, 10)

  // All notes with a follow-up date in the manager's district
  const leaderIds = db.select({ id: users.id }).from(users)
    .where(and(eq(users.role, 'leader'), eq(users.districtId, req.jwtPayload.districtId)))
    .all().map(u => u.id)

  if (!leaderIds.length) { res.json([]); return }

  const allNotes = db.select().from(coachingNotes)
    .where(and(isNotNull(coachingNotes.followUpDate), ne(coachingNotes.followUpStatus, 'complete')))
    .all()
    .filter(n => leaderIds.includes(n.leaderId))

  const enriched = allNotes.map(n => {
    const leader = db.select().from(users).where(eq(users.id, n.leaderId)).get()
    const day = db.select().from(days).where(eq(days.id, n.dayId)).get()
    const followUpDate = n.followUpDate!
    const urgency: 'overdue' | 'today' | 'upcoming' =
      followUpDate < today ? 'overdue' : followUpDate === today ? 'today' : 'upcoming'
    return {
      ...formatNote(n),
      leaderName: leader?.name ?? 'Unknown',
      dayDate: day?.date ?? null,
      dayOutcome: day?.overallOutcome ?? null,
      urgency,
    }
  })

  // Sort: overdue first, then today, then upcoming; within each group by date asc
  const ORDER = { overdue: 0, today: 1, upcoming: 2 }
  enriched.sort((a, b) =>
    ORDER[a.urgency] - ORDER[b.urgency] || (a.followUpDate ?? '').localeCompare(b.followUpDate ?? '')
  )

  res.json(enriched)
})

// GET /coaching/my-follow-ups — leader: their own pending follow-ups (overdue + today)
router.get('/my-follow-ups', (req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  const { userId, role } = req.jwtPayload
  if (role !== 'leader') { res.json([]); return }

  const pending = db.select().from(coachingNotes)
    .where(and(
      eq(coachingNotes.leaderId, userId),
      isNotNull(coachingNotes.followUpDate),
      ne(coachingNotes.followUpStatus, 'complete'),
    ))
    .all()
    .filter(n => n.followUpDate! <= today)

  const enriched = pending.map(n => {
    const day = db.select().from(days).where(eq(days.id, n.dayId)).get()
    const urgency: 'overdue' | 'today' = n.followUpDate! < today ? 'overdue' : 'today'
    return { ...formatNote(n), dayDate: day?.date ?? null, urgency }
  })

  enriched.sort((a, b) => (a.followUpDate ?? '').localeCompare(b.followUpDate ?? ''))
  res.json(enriched)
})

// PATCH /coaching/:id/resolve — manager marks follow-up complete
router.patch('/:id/resolve', requireManager, (req, res) => {
  const id = Number(req.params.id)
  const { resolution } = req.body ?? {}
  if (!resolution?.trim()) {
    res.status(400).json({ error: 'resolution is required' })
    return
  }

  const note = db.select().from(coachingNotes).where(eq(coachingNotes.id, id)).get()
  if (!note) { res.status(404).json({ error: 'Not found' }); return }

  const leader = db.select().from(users).where(eq(users.id, note.leaderId)).get()
  if (!leader || leader.districtId !== req.jwtPayload.districtId) {
    res.status(403).json({ error: 'Forbidden' }); return
  }

  const [updated] = db.update(coachingNotes)
    .set({ followUpStatus: 'complete', followUpResolution: resolution, resolvedAt: new Date() })
    .where(eq(coachingNotes.id, id))
    .returning().all()

  res.json(formatNote(updated))
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
    followUpStatus: n.followUpStatus,
    followUpResolution: n.followUpResolution,
    resolvedAt: n.resolvedAt,
    createdAt: n.createdAt,
  }
}

export default router
