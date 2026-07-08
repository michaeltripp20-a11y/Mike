import { useState, useEffect } from 'react'
import { daysApi, type DayEntry } from '../api'
import StreakBadge from '../components/StreakBadge'
import FollowUpBanner from '../components/FollowUpBanner'

type Outcome = 'hit' | 'partial' | 'miss'

const OUTCOME_CONFIG: Record<Outcome, { icon: string; active: string; label: string }> = {
  hit:     { icon: '✓', active: 'bg-blue-600 border-blue-500 text-white',     label: 'Hit' },
  partial: { icon: '~', active: 'bg-amber-500 border-amber-400 text-white',   label: 'Partial' },
  miss:    { icon: '✕', active: 'bg-red-600 border-red-500 text-white',        label: 'Miss' },
}

function OutcomePicker({ value, onChange, size = 'sm' }: {
  value: Outcome | null
  onChange: (o: Outcome) => void
  size?: 'sm' | 'md'
}) {
  return (
    <div className="flex gap-1.5">
      {(Object.entries(OUTCOME_CONFIG) as [Outcome, typeof OUTCOME_CONFIG[Outcome]][]).map(([o, cfg]) => (
        <button key={o} onClick={() => onChange(o)}
          className={`border rounded-lg font-medium transition-all active:scale-95
            ${size === 'md' ? 'px-4 py-2 text-sm' : 'px-2.5 py-1 text-xs'}
            ${value === o
              ? cfg.active
              : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 bg-white'
            }`}>
          <span className="mr-1 opacity-70">{cfg.icon}</span>{cfg.label}
        </button>
      ))}
    </div>
  )
}

function Section({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode
}) {
  return (
    <div className="card p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export default function Today() {
  const [day, setDay] = useState<DayEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [paceNote, setPaceNote] = useState('')
  const [commitOutcomes, setCommitOutcomes] = useState<Record<number, Outcome | null>>({})
  const [overallOutcome, setOverallOutcome] = useState<Outcome | null>(null)

  useEffect(() => {
    daysApi.today()
      .then(setDay)
      .catch(err => { if (err.message !== 'Not found') setError(err.message) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (day?.commitments) {
      const init: Record<number, Outcome | null> = {}
      day.commitments.forEach(c => { init[c.id] = c.outcome })
      setCommitOutcomes(init)
    }
  }, [day])

  async function paceDay() {
    if (!day) return
    const updates = Object.entries(commitOutcomes)
      .filter(([, o]) => o !== null).map(([id, outcome]) => ({ id: Number(id), outcome }))
    try { setDay(await daysApi.pace(day.id, { note: paceNote || undefined, commitmentUpdates: updates })) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error') }
  }

  async function closeDay() {
    if (!day || !overallOutcome) return setError('Select an overall outcome')
    setError('')
    const updates = Object.entries(commitOutcomes)
      .filter(([, o]) => o !== null).map(([id, outcome]) => ({ id: Number(id), outcome }))
    try { setDay(await daysApi.close(day.id, { overallOutcome, commitmentUpdates: updates })) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error') }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Today</h1>
          <p className="text-gray-500 text-sm mt-0.5">{today}</p>
        </div>
        {day && <StreakBadge streak={day.streak} />}
      </div>

      <FollowUpBanner />

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          <span>⚠</span> {error}
        </div>
      )}

      {/* ── No day yet ── */}
      {!day && (
        <div className="card p-8 text-center text-gray-400 text-sm">
          No entry for today yet.
        </div>
      )}

      {/* ── Active day ── */}
      {day && day.status !== 'closed' && (
        <>
          {/* Commitments */}
          <Section
            title="Commitments"
            subtitle={day.dailyNumber ? `Target: ${day.dailyNumber.toLocaleString()}` : undefined}>
            <div className="space-y-4">
              {day.commitments.map(c => (
                <div key={c.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 shrink-0" />
                    <span className="text-sm text-gray-700 leading-snug">{c.text}</span>
                  </div>
                  <div className="pl-3">
                    <OutcomePicker value={commitOutcomes[c.id] ?? null}
                      onChange={o => setCommitOutcomes(prev => ({ ...prev, [c.id]: o }))} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Pace check */}
          {day.status === 'open' && (
            <Section title="3 PM Pace Check" subtitle="How are you tracking against your number?">
              <textarea value={paceNote} onChange={e => setPaceNote(e.target.value)} rows={2}
                placeholder="Quick note — ahead, behind, or on pace…"
                className="input resize-none leading-relaxed" />
              <button onClick={paceDay} className="btn-secondary">Mark pace check done</button>
            </Section>
          )}

          {/* Close */}
          {day.status === 'paced' && (
            <Section title="End-of-Day Close" subtitle="Wrap up and log your overall outcome">
              {day.paceNote && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 italic">
                  "{day.paceNote}"
                </div>
              )}
              <div>
                <label className="label mb-2 block">Overall outcome</label>
                <OutcomePicker value={overallOutcome} onChange={setOverallOutcome} size="md" />
              </div>
              <button onClick={closeDay} className="btn-primary">Close day</button>
            </Section>
          )}
        </>
      )}

      {/* ── Closed ── */}
      {day?.status === 'closed' && (
        <div className="card overflow-hidden">
          {/* Outcome banner */}
          <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between
            ${day.overallOutcome === 'hit'
              ? 'bg-blue-50'
              : day.overallOutcome === 'partial'
              ? 'bg-amber-50'
              : 'bg-red-50'}`}>
            <div>
              <p className="label mb-0.5">Today's result</p>
              <p className={`text-lg font-bold capitalize
                ${day.overallOutcome === 'hit' ? 'text-blue-700'
                  : day.overallOutcome === 'partial' ? 'text-amber-700'
                  : 'text-red-600'}`}>
                {OUTCOME_CONFIG[day.overallOutcome!]?.icon} {day.overallOutcome}
              </p>
            </div>
            <StreakBadge streak={day.streak} />
          </div>

          {/* Commitments */}
          <div className="p-6 space-y-3">
            <p className="label">Commitments</p>
            {day.commitments.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0
                    ${c.outcome === 'hit' ? 'bg-blue-500'
                      : c.outcome === 'partial' ? 'bg-amber-500'
                      : c.outcome === 'miss' ? 'bg-red-500'
                      : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-700 truncate">{c.text}</span>
                </div>
                <span className={`text-xs font-semibold capitalize shrink-0
                  ${c.outcome === 'hit' ? 'text-blue-600'
                    : c.outcome === 'partial' ? 'text-amber-600'
                    : c.outcome === 'miss' ? 'text-red-500'
                    : 'text-gray-400'}`}>
                  {c.outcome ?? '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 flex items-center gap-4">
            <span className="text-xs text-gray-400">+{day.scorePoints} pts this day</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">Target: {day.dailyNumber?.toLocaleString()}</span>
          </div>
        </div>
      )}
    </main>
  )
}
