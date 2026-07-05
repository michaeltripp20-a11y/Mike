import { useState, useEffect } from 'react'
import {
  coachingApi, FOCUS_AREA_LABELS,
  type FocusArea, type CoachingNote, type LeaderDay, type CoachingNoteWithDay,
} from '../api'

const FOCUS_OPTIONS = Object.entries(FOCUS_AREA_LABELS) as [FocusArea, string][]

const OUTCOME_COLOR: Record<string, string> = {
  hit: 'text-blue-400', partial: 'text-amber-400', miss: 'text-red-400',
}
const OUTCOME_DOT: Record<string, string> = {
  hit: 'bg-blue-400', partial: 'bg-amber-400', miss: 'bg-red-500',
}

interface Props {
  leaderId: number
  leaderName: string
  onClose: () => void
}

type Tab = 'log' | 'history'

export default function CoachingPanel({ leaderId, leaderName, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('log')
  const [leaderDays, setLeaderDays] = useState<LeaderDay[]>([])
  const [history, setHistory] = useState<CoachingNoteWithDay[]>([])
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null)
  const [existingNote, setExistingNote] = useState<CoachingNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    focusArea: '' as FocusArea | '',
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
      .catch(() => {}) // 404 is fine — no note yet
  }, [selectedDayId])

  async function save() {
    if (!selectedDayId || !form.focusArea || !form.observation || !form.agreedActions) {
      setError('Focus area, observation, and agreed actions are required')
      return
    }
    setError('')
    setSaving(true)
    try {
      const note = await coachingApi.create({
        dayId: selectedDayId,
        leaderId,
        focusArea: form.focusArea,
        observation: form.observation,
        agreedActions: form.agreedActions,
        followUpDate: form.followUpDate || undefined,
      })
      setExistingNote(note)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      // Refresh history and mark day as coached
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

  const selectedDay = leaderDays.find(d => d.id === selectedDayId)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-zinc-950 border-l border-zinc-800 z-50
        flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div>
            <p className="label">Coaching</p>
            <h2 className="font-bold text-white text-lg mt-0.5">{leaderName}</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center
              text-zinc-500 hover:text-zinc-200 transition-colors text-lg">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 px-6">
          {(['log', 'history'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative pb-3 pt-3 mr-6 text-sm font-medium transition-colors capitalize
                ${tab === t ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {t === 'log' ? 'Log coaching' : `History (${history.length})`}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 rounded-full" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-5 h-5 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
            </div>
          ) : tab === 'log' ? (
            <div className="p-6 space-y-5">

              {/* Day picker */}
              <div>
                <label className="label mb-2 block">Select a day to coach</label>
                {leaderDays.length === 0 ? (
                  <p className="text-zinc-600 text-sm">No days logged yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {leaderDays.map(d => (
                      <button key={d.id} onClick={() => setSelectedDayId(d.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border
                          text-sm transition-colors text-left
                          ${selectedDayId === d.id
                            ? 'border-indigo-600/60 bg-indigo-950/30 text-white'
                            : 'border-zinc-800 hover:border-zinc-700 text-zinc-400'}`}>
                        <div className="flex items-center gap-3">
                          {d.overallOutcome ? (
                            <span className={`w-2 h-2 rounded-full shrink-0 ${OUTCOME_DOT[d.overallOutcome]}`} />
                          ) : (
                            <span className="w-2 h-2 rounded-full shrink-0 bg-zinc-700" />
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
                            <span className="text-xs text-zinc-600 capitalize">{d.status}</span>
                          )}
                        </div>
                        {d.hasCoaching && (
                          <span className="text-[10px] bg-indigo-950/60 border border-indigo-800/50
                            text-indigo-400 px-2 py-0.5 rounded-full font-semibold">
                            Coached
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedDayId && (
                <>
                  {existingNote && (
                    <div className="flex items-center gap-2 bg-indigo-950/30 border border-indigo-800/40
                      text-indigo-400 text-xs px-3 py-2.5 rounded-xl">
                      <span>✓</span> Coaching note exists — editing will update it.
                    </div>
                  )}

                  {/* Focus area */}
                  <div>
                    <label className="label mb-2 block">Focus area</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FOCUS_OPTIONS.map(([value, label]) => (
                        <button key={value} onClick={() => setForm(f => ({ ...f, focusArea: value }))}
                          className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-colors
                            ${form.focusArea === value
                              ? 'border-indigo-600/60 bg-indigo-950/30 text-indigo-300'
                              : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Observation */}
                  <div>
                    <label className="label mb-2 block">Observation</label>
                    <p className="text-zinc-600 text-xs mb-2">What specific behavior or outcome did you observe?</p>
                    <textarea
                      rows={3}
                      value={form.observation}
                      onChange={e => setForm(f => ({ ...f, observation: e.target.value }))}
                      placeholder="Describe what you saw on the floor today…"
                      className="input resize-none leading-relaxed"
                    />
                  </div>

                  {/* Agreed actions */}
                  <div>
                    <label className="label mb-2 block">Agreed actions</label>
                    <p className="text-zinc-600 text-xs mb-2">What did you both commit to going forward?</p>
                    <textarea
                      rows={3}
                      value={form.agreedActions}
                      onChange={e => setForm(f => ({ ...f, agreedActions: e.target.value }))}
                      placeholder="e.g. Leader will run a 5-minute team huddle each morning…"
                      className="input resize-none leading-relaxed"
                    />
                  </div>

                  {/* Follow-up date */}
                  <div>
                    <label className="label mb-2 block">Follow-up date <span className="text-zinc-700 normal-case font-normal">(optional)</span></label>
                    <input
                      type="date"
                      value={form.followUpDate}
                      onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))}
                      className="input"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/60
                      text-red-400 text-xs px-3 py-2.5 rounded-xl">
                      <span>⚠</span> {error}
                    </div>
                  )}

                  <button onClick={save} disabled={saving}
                    className={`btn-primary transition-all ${saved ? '!bg-blue-700' : ''}`}>
                    {saving ? 'Saving…' : saved ? '✓ Saved' : existingNote ? 'Update coaching note' : 'Save coaching note'}
                  </button>
                </>
              )}
            </div>
          ) : (
            // History tab
            <div className="p-6 space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-zinc-500 text-sm">No coaching notes yet for {leaderName}.</p>
                </div>
              ) : history.map(n => (
                <div key={n.id} className="card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-indigo-300">
                        {FOCUS_AREA_LABELS[n.focusArea]}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
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
                      <span className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400
                        px-2 py-0.5 rounded-full shrink-0">
                        Follow-up: {new Date(n.followUpDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <p className="label mb-1">Observation</p>
                      <p className="text-sm text-zinc-300 leading-relaxed">{n.observation}</p>
                    </div>
                    <div>
                      <p className="label mb-1">Agreed actions</p>
                      <p className="text-sm text-zinc-300 leading-relaxed">{n.agreedActions}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
