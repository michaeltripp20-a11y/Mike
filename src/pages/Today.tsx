import { useState, useEffect } from 'react'
import { daysApi, type DayEntry, type Commitment } from '../api'
import StreakBadge from '../components/StreakBadge'

type Outcome = 'hit' | 'partial' | 'miss'

const OUTCOME_STYLES: Record<Outcome, string> = {
  hit: 'bg-emerald-600 text-white border-emerald-600',
  partial: 'bg-amber-600 text-white border-amber-600',
  miss: 'bg-red-700 text-white border-red-700',
}

function OutcomePicker({ value, onChange }: { value: Outcome | null; onChange: (o: Outcome) => void }) {
  return (
    <div className="flex gap-1">
      {(['hit', 'partial', 'miss'] as Outcome[]).map(o => (
        <button key={o} onClick={() => onChange(o)}
          className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors capitalize
            ${value === o ? OUTCOME_STYLES[o] : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
          {o}
        </button>
      ))}
    </div>
  )
}

export default function Today() {
  const [day, setDay] = useState<DayEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // open form
  const [number, setNumber] = useState('')
  const [texts, setTexts] = useState(['', '', ''])

  // pace/close draft
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
    try {
      const d = await daysApi.open({ dailyNumber: Number(number), commitments: filled })
      setDay(d)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  async function paceDay() {
    if (!day) return
    const updates = Object.entries(commitOutcomes)
      .filter(([, o]) => o !== null)
      .map(([id, outcome]) => ({ id: Number(id), outcome }))
    try {
      const d = await daysApi.pace(day.id, { note: paceNote || undefined, commitmentUpdates: updates })
      setDay(d)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  async function closeDay() {
    if (!day || !overallOutcome) return setError('Select an overall outcome')
    const updates = Object.entries(commitOutcomes)
      .filter(([, o]) => o !== null)
      .map(([id, outcome]) => ({ id: Number(id), outcome }))
    setError('')
    try {
      const d = await daysApi.close(day.id, { overallOutcome, commitmentUpdates: updates })
      setDay(d)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Today</h1>
          <p className="text-gray-400 text-sm mt-0.5">{today}</p>
        </div>
        {day && <StreakBadge streak={day.streak} />}
      </div>

      {error && <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

      {/* ── No day yet: Open form ── */}
      {!day && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-white">Set your day</h2>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Daily number target</label>
            <input type="number" value={number} onChange={e => setNumber(e.target.value)} min={0}
              placeholder="e.g. 12000"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">Commitments (1–3)</label>
            <div className="space-y-2">
              {texts.map((t, i) => (
                <input key={i} value={t} onChange={e => setTexts(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                  placeholder={`Commitment ${i + 1}${i === 0 ? ' (required)' : ' (optional)'}`}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
              ))}
            </div>
          </div>

          <button onClick={openDay}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-colors">
            Start day
          </button>
        </div>
      )}

      {/* ── Day open or paced: show commitments + pace ── */}
      {day && day.status !== 'closed' && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Commitments</h2>
              <span className="text-sm text-gray-400">Target: <span className="text-white font-semibold">{day.dailyNumber?.toLocaleString()}</span></span>
            </div>
            <div className="space-y-3">
              {day.commitments.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-200 flex-1">{c.text}</span>
                  <OutcomePicker value={commitOutcomes[c.id] ?? null}
                    onChange={o => setCommitOutcomes(prev => ({ ...prev, [c.id]: o }))} />
                </div>
              ))}
            </div>
          </div>

          {day.status === 'open' && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-white">3 PM Pace Check</h2>
              <textarea value={paceNote} onChange={e => setPaceNote(e.target.value)} rows={2}
                placeholder="Quick note on where you stand (optional)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none" />
              <button onClick={paceDay}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-colors">
                Mark paced
              </button>
            </div>
          )}

          {day.status === 'paced' && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-white">End-of-Day Close</h2>
              {day.paceNote && <p className="text-sm text-gray-400">3 PM note: {day.paceNote}</p>}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Overall outcome</label>
                <OutcomePicker value={overallOutcome} onChange={setOverallOutcome} />
              </div>
              <button onClick={closeDay}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-colors">
                Close day
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Closed ── */}
      {day?.status === 'closed' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Day closed</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize
              ${day.overallOutcome === 'hit' ? 'bg-emerald-900/50 text-emerald-400' :
                day.overallOutcome === 'partial' ? 'bg-amber-900/50 text-amber-400' :
                'bg-red-900/50 text-red-400'}`}>
              {day.overallOutcome}
            </span>
          </div>
          <div className="space-y-2">
            {day.commitments.map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{c.text}</span>
                <span className={`capitalize font-medium
                  ${c.outcome === 'hit' ? 'text-emerald-400' :
                    c.outcome === 'partial' ? 'text-amber-400' : 'text-red-400'}`}>
                  {c.outcome ?? '—'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">Score +{day.scorePoints} pts · Streak {day.streak} day{day.streak !== 1 ? 's' : ''}</p>
        </div>
      )}
    </main>
  )
}
