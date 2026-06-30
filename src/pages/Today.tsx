import { useState, useEffect } from 'react'
import { daysApi, type DayEntry } from '../api'
import StreakBadge from '../components/StreakBadge'

type Outcome = 'hit' | 'partial' | 'miss'

const OUTCOME_CONFIG: Record<Outcome, { icon: string; active: string; label: string }> = {
  hit:     { icon: '✓', active: 'bg-emerald-600 border-emerald-500 text-white', label: 'Hit' },
  partial: { icon: '~', active: 'bg-amber-600 border-amber-500 text-white',   label: 'Partial' },
  miss:    { icon: '✕', active: 'bg-red-700 border-red-600 text-white',        label: 'Miss' },
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
              : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 bg-zinc-800/40'
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
        <h2 className="font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-zinc-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export default function Today() {
  const [day, setDay] = useState<DayEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [number, setNumber] = useState('')
  const [texts, setTexts] = useState(['', '', ''])
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

  async function openDay() {
    const filled = texts.filter(t => t.trim())
    if (!filled.length) return setError('Add at least one commitment')
    if (!number) return setError('Enter your daily number target')
    setError('')
    try { setDay(await daysApi.open({ dailyNumber: Number(number), commitments: filled })) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error') }
  }

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
      <div className="w-5 h-5 border-2 border-zinc-700 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-white">Today</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{today}</p>
        </div>
        {day && <StreakBadge streak={day.streak} />}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/50 text-red-400 text-sm px-4 py-3 rounded-xl">
          <span>⚠</span> {error}
        </div>
      )}

      {/* ── Open form ── */}
      {!day && (
        <Section title="Set your day" subtitle="Define what you're going after today">
          <div className="space-y-3">
            <div>
              <label className="label mb-2 block">Daily number target</label>
              <input type="number" value={number} onChange={e => setNumber(e.target.value)} min={0}
                placeholder="e.g. 12,000"
                className="input" />
            </div>
            <div>
              <label className="label mb-2 block">Commitments — up to 3</label>
              <div className="space-y-2">
                {texts.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full border border-zinc-700 text-zinc-600 text-xs
                      flex items-center justify-center shrink-0 font-medium">{i + 1}</span>
                    <input value={t}
                      onChange={e => setTexts(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                      placeholder={i === 0 ? 'Your main commitment' : `Commitment ${i + 1} (optional)`}
                      className="input" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button onClick={openDay} className="btn-primary">Start day →</button>
        </Section>
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
                    <span className="w-1 h-1 rounded-full bg-zinc-600 mt-2 shrink-0" />
                    <span className="text-sm text-zinc-200 leading-snug">{c.text}</span>
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
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-zinc-400 italic">
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
          <div className={`px-6 py-4 border-b border-zinc-800 flex items-center justify-between
            ${day.overallOutcome === 'hit'
              ? 'bg-emerald-950/40'
              : day.overallOutcome === 'partial'
              ? 'bg-amber-950/40'
              : 'bg-red-950/30'}`}>
            <div>
              <p className="label mb-0.5">Today's result</p>
              <p className={`text-lg font-bold capitalize
                ${day.overallOutcome === 'hit' ? 'text-emerald-300'
                  : day.overallOutcome === 'partial' ? 'text-amber-300'
                  : 'text-red-400'}`}>
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
                    ${c.outcome === 'hit' ? 'bg-emerald-400'
                      : c.outcome === 'partial' ? 'bg-amber-400'
                      : c.outcome === 'miss' ? 'bg-red-400'
                      : 'bg-zinc-600'}`} />
                  <span className="text-sm text-zinc-300 truncate">{c.text}</span>
                </div>
                <span className={`text-xs font-semibold capitalize shrink-0
                  ${c.outcome === 'hit' ? 'text-emerald-400'
                    : c.outcome === 'partial' ? 'text-amber-400'
                    : c.outcome === 'miss' ? 'text-red-400'
                    : 'text-zinc-600'}`}>
                  {c.outcome ?? '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 flex items-center gap-4">
            <span className="text-xs text-zinc-600">+{day.scorePoints} pts this day</span>
            <span className="text-zinc-800">·</span>
            <span className="text-xs text-zinc-600">Target: {day.dailyNumber?.toLocaleString()}</span>
          </div>
        </div>
      )}
    </main>
  )
}
