import { useState, useEffect } from 'react'
import { daysApi, coachingApi, type DayEntry } from '../api'
import { getValues, LEADER_TYPES } from '../constants/leaderTypes'
import { useAuth } from '../auth'
import StreakBadge from '../components/StreakBadge'
import CoachingBadge from '../components/CoachingBadge'

const OUTCOME_LABEL: Record<string, string> = {
  hit: 'Hit',
  partial: 'Partial',
  miss: 'Miss',
}

export default function History() {
  const { user } = useAuth()
  const focusValues = getValues(user?.leaderType)
  const [days, setDays] = useState<DayEntry[]>([])
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      daysApi.history(),
      coachingApi.myCategoryTotals(),
    ]).then(([d, c]) => {
      setDays(d)
      setCategoryTotals(c)
    }).finally(() => setLoading(false))
  }, [])

  const streak = days[0]?.streak ?? 0
  const totalCoaching = Object.values(categoryTotals).reduce((s, n) => s + n, 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">History</h1>
          {user?.leaderType && LEADER_TYPES[user.leaderType] && (
            <p className="text-xs text-gray-400 mt-0.5">
              {LEADER_TYPES[user.leaderType].emoji} {LEADER_TYPES[user.leaderType].label}
            </p>
          )}
        </div>
        <StreakBadge streak={streak} />
      </div>

      {/* Coaching category totals */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Coaching Focus Areas</h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {totalCoaching === 0 ? 'No coaching sessions yet' : `${totalCoaching} total session${totalCoaching !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {totalCoaching === 0 ? (
          <p className="text-gray-400 text-sm text-center py-2">No coaching notes logged yet.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(focusValues).map(([key, label]) => {
              const count = categoryTotals[key] ?? 0
              const pct = totalCoaching > 0 ? (count / totalCoaching) * 100 : 0
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-36 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 tabular-nums w-4 text-right">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Day list */}
      <div className="space-y-2.5">
        {days.map(d => {
          const dateLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
          })
          return (
            <div key={d.id} className="card-hover p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-semibold text-gray-800">{dateLabel}</span>
                <div className="flex items-center gap-2">
                  {d.status === 'closed' && d.overallOutcome ? (
                    <>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
                        ${d.overallOutcome === 'hit'
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                          : d.overallOutcome === 'partial'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-red-50 text-red-500 border-red-200'}`}>
                        {OUTCOME_LABEL[d.overallOutcome]}
                      </span>
                      <span className="text-[11px] text-gray-400 tabular-nums">+{d.scorePoints} pts</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 capitalize">{d.status}</span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                {d.commitments.map(c => (
                  <div key={c.id} className="flex items-center gap-2.5 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0
                      ${c.outcome === 'hit' ? 'bg-indigo-500'
                        : c.outcome === 'partial' ? 'bg-amber-500'
                        : c.outcome === 'miss' ? 'bg-red-500'
                        : 'bg-gray-300'}`} />
                    <span className="text-gray-500">{c.text}</span>
                  </div>
                ))}
              </div>
              <CoachingBadge dayId={d.id} />
            </div>
          )
        })}
        {days.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-gray-500 text-sm">No days logged yet.</p>
            <p className="text-gray-400 text-xs mt-1">Head to Today to start your first day.</p>
          </div>
        )}
      </div>
    </main>
  )
}
