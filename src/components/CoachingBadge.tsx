import { useState, useEffect } from 'react'
import { coachingApi, FOCUS_AREA_LABELS, type CoachingNote } from '../api'

export default function CoachingBadge({ dayId }: { dayId: number }) {
  const [note, setNote] = useState<CoachingNote | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    coachingApi.forDay(dayId).then(setNote).catch(() => {})
  }, [dayId])

  if (!note) return null

  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 bg-indigo-950/50 border border-indigo-800/50
          text-indigo-400 text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-indigo-950/80 transition-colors">
        <span>💬</span> Coaching note
      </button>

      {open && (
        <div className="mt-3 bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
            {FOCUS_AREA_LABELS[note.focusArea]}
          </p>
          <div className="space-y-2.5">
            <div>
              <p className="label mb-1">Observation</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{note.observation}</p>
            </div>
            <div>
              <p className="label mb-1">Agreed actions</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{note.agreedActions}</p>
            </div>
            {note.followUpDate && (
              <p className="text-xs text-zinc-500">
                Follow-up: {new Date(note.followUpDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
