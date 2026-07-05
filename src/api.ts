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
export interface User { id: number; name: string; email: string; role: 'leader' | 'manager'; storeId: number }

export const authApi = {
  register: (body: { name: string; email: string; password: string; role: 'leader' | 'manager'; storeId: number }) =>
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

// ── Coaching ──────────────────────────────────────────────────────────────────
export const FOCUS_AREA_LABELS: Record<string, string> = {
  floor_presence:      'Floor Presence',
  team_development:    'Team Development',
  execution:           'Execution',
  customer_engagement: 'Customer Engagement',
  priority_setting:    'Priority Setting',
}

export type FocusArea = keyof typeof FOCUS_AREA_LABELS

export interface CoachingNote {
  id: number
  dayId: number
  managerId: number
  leaderId: number
  focusArea: FocusArea
  observation: string
  agreedActions: string
  followUpDate: string | null
  followUpStatus: 'pending' | 'complete' | null
  followUpResolution: string | null
  resolvedAt: string | null
  createdAt: string
}

export interface CoachingNoteWithDay extends CoachingNote {
  dayDate: string | null
  dayOutcome: 'hit' | 'partial' | 'miss' | null
}

export type FollowUpUrgency = 'overdue' | 'today' | 'upcoming'

export interface FollowUpItem extends CoachingNote {
  leaderName: string
  dayDate: string | null
  dayOutcome: 'hit' | 'partial' | 'miss' | null
  urgency: FollowUpUrgency
}

export interface MyFollowUpItem extends CoachingNote {
  dayDate: string | null
  urgency: 'overdue' | 'today'
}

export interface LeaderDay {
  id: number
  date: string
  status: 'open' | 'paced' | 'closed'
  overallOutcome: 'hit' | 'partial' | 'miss' | null
  hasCoaching: boolean
}

export const coachingApi = {
  create: (body: {
    dayId: number; leaderId: number; focusArea: FocusArea
    observation: string; agreedActions: string; followUpDate?: string
  }) => api.post<CoachingNote>('/coaching', body),

  forDay: (dayId: number) => api.get<CoachingNote>(`/coaching/day/${dayId}`),

  forLeader: (leaderId: number) => api.get<CoachingNoteWithDay[]>(`/coaching/leader/${leaderId}`),

  leaderDays: (leaderId: number) => api.get<LeaderDay[]>(`/coaching/leader/${leaderId}/days`),

  followUps: () => api.get<FollowUpItem[]>('/coaching/follow-ups'),

  myFollowUps: () => api.get<MyFollowUpItem[]>('/coaching/my-follow-ups'),

  myCategoryTotals: () => api.get<Record<string, number>>('/coaching/my-category-totals'),

  resolve: (id: number, resolution: string) =>
    api.patch<CoachingNote>(`/coaching/${id}/resolve`, { resolution }),
}
