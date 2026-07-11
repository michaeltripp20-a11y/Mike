import { Router } from 'express'
import { db } from '../db'
import { users, days, commitments } from '../db/schema'
import { eq, and, desc, gte } from 'drizzle-orm'
import { requireAuth, requireManager } from '../middleware/auth'

const router = Router()
router.use(requireAuth, requireManager)

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function sevenDaysAgoStr() {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return d.toISOString().slice(0, 10)
}

router.get('/', (req, res) => {
  const leaders = db.select().from(users)
    .where(and(eq(users.role, 'leader'), eq(users.storeId, req.jwtPayload.storeId)))
    .all()

  const today = todayStr()
  const weekStart = sevenDaysAgoStr()

  const board = leaders.map(leader => {
    const todayDay = db.select().from(days)
      .where(and(eq(days.userId, leader.id), eq(days.date, today)))
      .get()

    const recentClosed = db.select().from(days)
      .where(and(eq(days.userId, leader.id), eq(days.status, 'closed'), gte(days.date, weekStart)))
      .orderBy(desc(days.date))
      .all()

    const sevenDayScore = recentClosed.reduce((s, d) => s + (d.scorePoints ?? 0), 0)

    // Most recent streak
    const lastClosed = db.select().from(days)
      .where(and(eq(days.userId, leader.id), eq(days.status, 'closed')))
      .orderBy(desc(days.date))
      .get()

    return {
      userId: leader.id,
      name: leader.name,
      leaderType: leader.leaderType ?? null,
      streak: lastClosed?.streak ?? 0,
      sevenDayScore,
      todayStatus: (todayDay?.status ?? 'none') as 'open' | 'paced' | 'closed' | 'none',
      todayOutcome: todayDay?.overallOutcome ?? null,
    }
  })

  // Sort: slipping first (streak=0 or low score), then by score desc
  board.sort((a, b) => {
    const aSlip = a.streak === 0 ? 0 : 1
    const bSlip = b.streak === 0 ? 0 : 1
    if (aSlip !== bSlip) return aSlip - bSlip
    return b.sevenDayScore - a.sevenDayScore
  })

  res.json(board)
})

export default router
