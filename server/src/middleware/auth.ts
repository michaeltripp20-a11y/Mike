import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface JwtPayload {
  userId: number
  role: 'leader' | 'manager'
  storeId: number
}

declare global {
  namespace Express {
    interface Request {
      jwtPayload: JwtPayload
    }
  }
}

export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-prod'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' })
    return
  }
  try {
    req.jwtPayload = jwt.verify(header.slice(7), JWT_SECRET) as JwtPayload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireManager(req: Request, res: Response, next: NextFunction) {
  if (req.jwtPayload.role !== 'manager') {
    res.status(403).json({ error: 'Manager access required' })
    return
  }
  next()
}
