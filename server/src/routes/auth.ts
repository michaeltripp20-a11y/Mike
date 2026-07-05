import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { JWT_SECRET, requireAuth } from '../middleware/auth'

const router = Router()

function makeToken(userId: number, role: 'leader' | 'manager', storeId: number) {
  return jwt.sign({ userId, role, storeId }, JWT_SECRET, { expiresIn: '30d' })
}

function formatUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    storeId: user.storeId,
    leaderType: user.leaderType ?? null,
  }
}

router.post('/register', async (req, res) => {
  const { name, email, password, role = 'leader', storeId = 1 } = req.body ?? {}
  if (!name || !email || !password) {
    res.status(400).json({ error: 'name, email, and password are required' })
    return
  }
  const existing = db.select().from(users).where(eq(users.email, email)).get()
  if (existing) {
    res.status(409).json({ error: 'Email already registered' })
    return
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const [user] = db.insert(users).values({ name, email, passwordHash, role, storeId, createdAt: new Date() }).returning().all()
  const token = makeToken(user.id, user.role, user.storeId)
  res.status(201).json({ token, user: formatUser(user) })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {}
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' })
    return
  }
  const user = db.select().from(users).where(eq(users.email, email)).get()
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }
  const token = makeToken(user.id, user.role, user.storeId)
  res.json({ token, user: formatUser(user) })
})

router.patch('/profile', requireAuth, (req, res) => {
  const { leaderType } = req.body ?? {}
  if (!leaderType) {
    res.status(400).json({ error: 'leaderType is required' })
    return
  }
  const [updated] = db.update(users)
    .set({ leaderType })
    .where(eq(users.id, req.jwtPayload.userId))
    .returning().all()
  res.json(formatUser(updated))
})

export default router
