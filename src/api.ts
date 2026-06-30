const BASE = 'http://localhost:3001'

function token() {
  return localStorage.getItem('ft_token')
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export const api = {
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  get: <T>(path: string) => request<T>('GET', path),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthPayload { token: string; user: User }
export interface User { id: number; name: string; email: string; role: 'leader' | 'manager'; districtId: number }

export const authApi = {
  register: (body: { name: string; email: string; password: string; role: 'leader' | 'manager'; districtId: number }) =>
    api.post<AuthPayload>('/auth/register', body),
  login: (body: { email: string; password: string }) =>
    api.post<AuthPayload>('/auth/login', body),
}

// ── Days ──────────────────────────────────────────────────────────────────────
export interface Commitment { id: number; text: string; outcome: 'hit' | 'partial' | 'miss' | null }
export interface DayEntry {
  id: number
  date: string          // YYYY-MM-DD
  dailyNumber: number | null
  status: 'open' | 'paced' | 'closed'
  streak: number
  commitments: Commitment[]
  paceNote: string | null
  overallOutcome: 'hit' | 'partial' | 'miss' | null
  scorePoints: number | null
}

export const daysApi = {
  today: () => api.get<DayEntry>('/days/today'),
  history: () => api.get<DayEntry[]>('/days/history'),
  open: (body: { dailyNumber: number; commitments: string[] }) =>
    api.post<DayEntry>('/days', body),
  pace: (id: number, body: { note?: string; commitmentUpdates?: { id: number; outcome: Commitment['outcome'] }[] }) =>
    api.patch<DayEntry>(`/days/${id}/pace`, body),
  close: (id: number, body: { overallOutcome: 'hit' | 'partial' | 'miss'; commitmentUpdates?: { id: number; outcome: Commitment['outcome'] }[] }) =>
    api.patch<DayEntry>(`/days/${id}/close`, body),
}

// ── Team ──────────────────────────────────────────────────────────────────────
export interface TeamMember {
  userId: number
  name: string
  streak: number
  sevenDayScore: number
  todayStatus: 'open' | 'paced' | 'closed' | 'none'
  todayOutcome: 'hit' | 'partial' | 'miss' | null
}

export const teamApi = {
  board: () => api.get<TeamMember[]>('/team'),
}
