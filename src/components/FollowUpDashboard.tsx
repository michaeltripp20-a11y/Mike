import { useState, useEffect, useCallback } from 'react'
import { coachingApi, FOCUS_AREA_LABELS, type FollowUpItem } from '../api'

const URGENCY_CONFIG = {
  overdue: {
    label: 'Overdue',
    bg: 'bg-red-950/30 border-red-800/40',
    badge: 'bg-red-950/60 border-red-800/50 text-red-300',
    dot: 'bg-red-500',
  },
  today: {
    label: 'Due today',
    bg: 'bg-amber-950/25 border-amber-800/30',
    badge: 'bg-amber-950/60 border-amber-800/50 text-amber-300',
    dot: 'bg-amber-400',
  },
  upcoming: {
    label: 'Upcoming',
    bg: 'bg-zinc-900 border-zinc-800',
    badge: 'bg-zinc-800 border-zinc-700 text-zinc-400',
    dot: 'bg-zinc-500',
  },
}

interface ResolveFormProps {
  noteId: number
  onResolved: () => void
}

function ResolveForm({ noteId, onResolved }: ResolveFormProps) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return setError('Add a resolution note')
    setSaving(true)
    setError('')
    try {
      await coachingApi.resolve(noteId, text)
      onResolved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 pt-3 border-t border-zinc-800/60 space-y-2">
      <label className="label block mb-1.5">Resolution note</label>
      <textarea
        rows={2}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="What was discussed or observed at follow-up?"
        className="input resize-none text-xs leading-relaxed"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button type="submit" disabled={saving}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500
          disabled:opacity-40 text-white transition-colors">
        {saving ? 'Saving…' : 'Mark complete'}
      </button>
    </form>
  )
}

export default function FollowUpDashboard() {
  const [items, setItems] = useState<FollowUpItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(true)
  const [resolving, setResolving] = useState<number | null>(null)

  const load = useCallback(() => {
    coachingApi.followUps()
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function handleResolved() {
    setResolving(null)
    load()
  }

  if (loading) return null
  if (items.length === 0) return null

  const overdue = items.filter(i => i.urgency === 'overdue')
  const today = items.filter(i => i.urgency === 'today')
  const upcoming = items.filter(i => i.urgency === 'upcoming')

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/30 transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white text-sm">Follow-ups</span>
          <div className="flex gap-1.5">
            {overdue.length > 0 && (
              <span className="text-[11px] font-bold bg-red-950/60 border border-red-800/50 text-red-300 px-2 py-0.5 rounded-full">
                {overdue.length} overdue
              </span>
            )}
            {today.length > 0 && (
              <span className="text-[11px] font-bold bg-amber-950/60 border border-amber-800/50 text-amber-300 px-2 py-0.5 rounded-full">
                {today.length} due today
              </span>
            )}
            {upcoming.length > 0 && (
              <span className="text-[11px] font-bold bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">
                {upcoming.length} upcoming
              </span>
            )}
          </div>
        </div>
        <span className={`text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="border-t border-zinc-800 divide-y divide-zinc-800/60">
          {items.map(item => {
            const cfg = URGENCY_CONFIG[item.urgency]
            const isResolving = resolving === item.id
            return (
              <div key={item.id} className={`px-5 py-4 ${item.urgency !== 'upcoming' ? cfg.bg : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold text-white">{item.leaderName}</span>
                        <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 px-1.5 py-0.5 rounded-full">
                          {FOCUS_AREA_LABELS[item.focusArea]}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Coaching from {item.dayDate
                          ? new Date(item.dayDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '—'}
                        {' · '}Follow-up: {item.followUpDate
                          ? new Date(item.followUpDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '—'}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{item.agreedActions}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setResolving(isResolving ? null : item.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 transition-colors
                      ${isResolving
                        ? 'border-zinc-600 bg-zinc-800 text-zinc-300'
                        : 'border-indigo-800/50 bg-indigo-950/30 text-indigo-400 hover:bg-indigo-950/60'}`}>
                    {isResolving ? 'Cancel' : 'Resolve →'}
                  </button>
                </div>

                {isResolving && (
                  <ResolveForm noteId={item.id} onResolved={handleResolved} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
