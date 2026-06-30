import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { JWT_SECRET } from '../middleware/auth'

const router = Router()

function makeToken(userId: number, role: 'leader' | 'manager', districtId: number) {
  return jwt.sign({ userId, role, districtId }, JWT_SECRET, { expiresIn: '30d' })
}

router.post('/register', async (req, res) => {
  const { name, email, password, role = 'leader', districtId = 1 } = req.body ?? {}
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
  const [user] = db.insert(users).values({ name, email, passwordHash, role, districtId, createdAt: new Date() }).returning().all()
  const token = makeToken(user.id, user.role, user.districtId)
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, districtId: user.districtId } })
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
  const token = makeToken(user.id, user.role, user.districtId)
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, districtId: user.districtId } })
})

export default router
