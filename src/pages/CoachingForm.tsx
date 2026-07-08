import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  coachingApi,
  type CoachingNote, type LeaderDay, type CoachingNoteWithDay,
} from '../api'
import { getValues, LEADER_TYPES } from '../constants/leaderTypes'

const OUTCOME_COLOR: Record<string, string> = {
  hit: 'text-blue-600', partial: 'text-amber-600', miss: 'text-red-500',
}
const OUTCOME_DOT: Record<string, string> = {
  hit: 'bg-blue-500', partial: 'bg-amber-400', miss: 'bg-red-500',
}

type Tab = 'log' | 'history'

export default function CoachingForm() {
  const { leaderId: leaderIdParam } = useParams<{ leaderId: string }>()
  const leaderId = Number(leaderIdParam)
  const navigate = useNavigate()
  const location = useLocation()

  const locationState = location.state as { leaderName?: string; leaderType?: string } | null
  const [leaderName, setLeaderName] = useState<string>(locationState?.leaderName ?? '')
  const leaderType = locationState?.leaderType ?? null
  const focusValues = getValues(leaderType)
  const FOCUS_OPTIONS = Object.entries(focusValues) as [string, string][]
  const [tab, setTab] = useState<Tab>('log')
  const [leaderDays, setLeaderDays] = useState<LeaderDay[]>([])
  const [history, setHistory] = useState<CoachingNoteWithDay[]>([])
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null)
  const [existingNote, setExistingNote] = useState<CoachingNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [resolving, setResolving] = useState<number | null>(null)

  const [form, setForm] = useState({
    focusArea: '' as string,
    observation: '',
    agreedActions: '',
    followUpDate: '',
  })

  useEffect(() => {
    Promise.all([
      coachingApi.leaderDays(leaderId),
      coachingApi.forLeader(leaderId),
    ]).then(([days, notes]) => {
      setLeaderDays(days)
      setHistory(notes)
      if (days.length) setSelectedDayId(days[0].id)
      // Pull leader name from first note or day fetch — derive from history or days
      }).finally(() => setLoading(false))
  }, [leaderId])

  useEffect(() => {
    if (!selectedDayId) return
    setExistingNote(null)
    setForm({ focusArea: '', observation: '', agreedActions: '', followUpDate: '' })
    coachingApi.forDay(selectedDayId)
      .then(note => {
        setExistingNote(note)
        setForm({
          focusArea: note.focusArea,
          observation: note.observation,
          agreedActions: note.agreedActions,
          followUpDate: note.followUpDate ?? '',
        })
      })
      .catch(() => {})
  }, [selectedDayId])

  async function save() {
    if (!form.focusArea || !form.observation || !form.agreedActions) {
      setError('Focus area, observation, and agreed actions are required')
      return
    }
    setError('')
    setSaving(true)
    try {
      const note = await coachingApi.create({
        dayId: selectedDayId ?? undefined,
        leaderId,
        focusArea: form.focusArea,
        observation: form.observation,
        agreedActions: form.agreedActions,
        followUpDate: form.followUpDate || undefined,
      })
      setExistingNote(note)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      const [days, notes] = await Promise.all([
        coachingApi.leaderDays(leaderId),
        coachingApi.forLeader(leaderId),
      ])
      setLeaderDays(days)
      setHistory(notes)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  async function resolveNote(noteId: number, resolution: string) {
    await coachingApi.resolve(noteId, resolution)
    const notes = await coachingApi.forLeader(leaderId)
    setHistory(notes)
    setResolving(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/team')}
          className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50
            flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors shadow-sm">
          ←
        </button>
        <div>
          <p className="label">Sales Rep Coaching</p>
          <h1 className="text-xl font-bold text-gray-900">{leaderName || 'Sales Rep'}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(['log', 'history'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`relative pb-3 pt-1 mr-7 text-sm font-medium transition-colors
              ${tab === t ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
            {t === 'log' ? 'Log coaching' : `History (${history.length})`}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />}
          </button>
        ))}
      </div>

      {tab === 'log' ? (
        <div className="space-y-5">

          {/* Day picker */}
          <div className="card p-5">
            <label className="label mb-3 block">Select a day to review</label>
            {leaderDays.length === 0 ? (
              <p className="text-gray-400 text-sm">No days logged yet.</p>
            ) : (
              <div className="space-y-1.5">
                {leaderDays.map(d => (
                  <button key={d.id} onClick={() => setSelectedDayId(d.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border
                      text-sm transition-colors text-left
                      ${selectedDayId === d.id
                        ? 'border-indigo-300 bg-indigo-50 text-gray-900'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'}`}>
                    <div className="flex items-center gap-3">
                      {d.overallOutcome ? (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${OUTCOME_DOT[d.overallOutcome]}`} />
                      ) : (
                        <span className="w-2 h-2 rounded-full shrink-0 bg-gray-300" />
                      )}
                      <span className="font-medium">
                        {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric',
                        })}
                      </span>
                      {d.overallOutcome && (
                        <span className={`capitalize text-xs ${OUTCOME_COLOR[d.overallOutcome]}`}>
                          {d.overallOutcome}
                        </span>
                      )}
                      {d.status !== 'closed' && (
                        <span className="text-xs text-gray-400 capitalize">{d.status}</span>
                      )}
                    </div>
                    {d.hasCoaching && (
                      <span className="text-[10px] bg-indigo-50 border border-indigo-200
                        text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                        Coached
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5 space-y-5">
            {existingNote && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200
                text-indigo-600 text-xs px-3 py-2.5 rounded-xl">
                <span>✓</span> Coaching note exists — editing will update it.
              </div>
            )}

            {/* Focus area */}
            <div>
              <label className="label mb-2 block">Focus area</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FOCUS_OPTIONS.map(([value, label]) => (
                  <button key={value} onClick={() => setForm(f => ({ ...f, focusArea: value }))}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-colors
                      ${form.focusArea === value
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800 bg-white'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Observation */}
            <div>
              <label className="label mb-1.5 block">Observation</label>
              <p className="text-gray-400 text-xs mb-2">What specific behavior or outcome did you observe?</p>
              <textarea
                rows={4}
                value={form.observation}
                onChange={e => setForm(f => ({ ...f, observation: e.target.value }))}
                placeholder="Describe what you saw on the floor today…"
                className="input resize-none leading-relaxed"
              />
            </div>

            {/* Agreed actions */}
            <div>
              <label className="label mb-1.5 block">Agreed actions</label>
              <p className="text-gray-400 text-xs mb-2">What did you both commit to going forward?</p>
              <textarea
                rows={4}
                value={form.agreedActions}
                onChange={e => setForm(f => ({ ...f, agreedActions: e.target.value }))}
                placeholder="e.g. Rep will run a 5-minute team huddle each morning…"
                className="input resize-none leading-relaxed"
              />
            </div>

            {/* Follow-up date */}
            <div>
              <label className="label mb-1.5 block">
                Follow-up date{' '}
                <span className="text-gray-400 normal-case font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={form.followUpDate}
                onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))}
                className="input max-w-xs"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200
                text-red-600 text-xs px-3 py-2.5 rounded-xl">
                <span>⚠</span> {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={save} disabled={saving}
                className={`btn-primary max-w-xs ${saved ? '!bg-blue-600' : ''}`}>
                {saving ? 'Saving…' : saved ? '✓ Saved' : existingNote ? 'Update note' : 'Save coaching note'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // History tab
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-gray-400 text-sm">No coaching notes yet for {leaderName || 'this rep'}.</p>
            </div>
          ) : history.map(n => (
            <div key={n.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-indigo-600">{focusValues[n.focusArea] ?? n.focusArea}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {n.dayDate
                      ? new Date(n.dayDate + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric',
                        })
                      : ''}
                    {n.dayOutcome && (
                      <span className={`ml-2 capitalize ${OUTCOME_COLOR[n.dayOutcome]}`}>
                        · {n.dayOutcome}
                      </span>
                    )}
                  </p>
                </div>
                {n.followUpDate && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 border
                    ${n.followUpStatus === 'complete'
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                    {n.followUpStatus === 'complete' ? '✓ Resolved' : (
                      <>Follow-up: {new Date(n.followUpDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                    )}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="label mb-1">Observation</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{n.observation}</p>
                </div>
                <div>
                  <p className="label mb-1">Agreed actions</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{n.agreedActions}</p>
                </div>
                {n.followUpStatus === 'complete' && n.followUpResolution && (
                  <div>
                    <p className="label mb-1">Resolution</p>
                    <p className="text-sm text-blue-700 leading-relaxed">{n.followUpResolution}</p>
                  </div>
                )}
              </div>

              {n.followUpDate && n.followUpStatus !== 'complete' && (
                resolving === n.id
                  ? <ResolveInline noteId={n.id} onCancel={() => setResolving(null)} onSave={resolveNote} />
                  : (
                    <button onClick={() => setResolving(n.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200
                        bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                      Resolve →
                    </button>
                  )
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

function ResolveInline({ noteId, onCancel, onSave }: {
  noteId: number
  onCancel: () => void
  onSave: (id: number, text: string) => Promise<void>
}) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) { setError('Add a resolution note'); return }
    setSaving(true)
    setError('')
    try { await onSave(noteId, text) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="pt-3 border-t border-gray-100 space-y-2">
      <label className="label block mb-1">Resolution note</label>
      <textarea rows={2} value={text} onChange={e => setText(e.target.value)}
        placeholder="What was discussed or observed at follow-up?"
        className="input resize-none text-xs leading-relaxed" />
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500
            disabled:opacity-40 text-white transition-colors">
          {saving ? 'Saving…' : 'Mark complete'}
        </button>
        <button type="button" onClick={onCancel}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200
            bg-white text-gray-500 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
