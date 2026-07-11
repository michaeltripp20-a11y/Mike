import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type User } from './api'

interface AuthCtx {
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (u: User) => void
}

const Ctx = createContext<AuthCtx>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('ft_user')
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  })

  function login(token: string, u: User) {
    localStorage.setItem('ft_token', token)
    localStorage.setItem('ft_user', JSON.stringify(u))
    setUser(u)
  }

  function logout() {
    localStorage.removeItem('ft_token')
    localStorage.removeItem('ft_user')
    setUser(null)
  }

  function updateUser(u: User) {
    localStorage.setItem('ft_user', JSON.stringify(u))
    setUser(u)
  }

  return <Ctx.Provider value={{ user, login, logout, updateUser }}>{children}</Ctx.Provider>
}

export function useAuth() {
  return useContext(Ctx)
}
