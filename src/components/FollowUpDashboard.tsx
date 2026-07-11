import { useState, useEffect, useCallback } from 'react'
import { coachingApi, FOCUS_AREA_LABELS, type FollowUpItem } from '../api'

const URGENCY_CONFIG = {
  overdue: {
    label: 'Overdue',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 border-red-200 text-red-600',
    dot: 'bg-red-400',
  },
  today: {
    label: 'Due today',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 border-amber-200 text-amber-700',
    dot: 'bg-amber-400',
  },
  upcoming: {
    label: 'Upcoming',
    bg: 'bg-white border-gray-100',
    badge: 'bg-gray-100 border-gray-200 text-gray-500',
    dot: 'bg-gray-300',
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
    <form onSubmit={submit} className="mt-3 pt-3 border-t border-gray-100 space-y-2">
      <label className="label block mb-1.5">Resolution note</label>
      <textarea
        rows={2}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="What was discussed or observed at follow-up?"
        className="input resize-none text-xs leading-relaxed"
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
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
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900 text-sm">Follow-ups</span>
          <div className="flex gap-1.5">
            {overdue.length > 0 && (
              <span className="text-[11px] font-bold bg-red-100 border border-red-200 text-red-600 px-2 py-0.5 rounded-full">
                {overdue.length} overdue
              </span>
            )}
            {today.length > 0 && (
              <span className="text-[11px] font-bold bg-amber-100 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full">
                {today.length} due today
              </span>
            )}
            {upcoming.length > 0 && (
              <span className="text-[11px] font-bold bg-gray-100 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                {upcoming.length} upcoming
              </span>
            )}
          </div>
        </div>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
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
                        <span className="text-sm font-semibold text-gray-900">{item.leaderName}</span>
                        <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] bg-gray-100 border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">
                          {FOCUS_AREA_LABELS[item.focusArea]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Coaching from {item.dayDate
                          ? new Date(item.dayDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '—'}
                        {' · '}Follow-up: {item.followUpDate
                          ? new Date(item.followUpDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '—'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.agreedActions}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setResolving(isResolving ? null : item.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0 transition-colors
                      ${isResolving
                        ? 'border-gray-300 bg-gray-100 text-gray-600'
                        : 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
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
