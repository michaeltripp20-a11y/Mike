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
    <div className="mt-3">
      <button onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200
          text-indigo-600 text-xs font-semibold px-2.5 py-1 rounded-full hover:bg-indigo-100 transition-colors">
        <span>💬</span> Coaching note
      </button>

      {open && (
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            {FOCUS_AREA_LABELS[note.focusArea]}
          </p>
          <div className="space-y-2.5">
            <div>
              <p className="label mb-1">Observation</p>
              <p className="text-sm text-gray-700 leading-relaxed">{note.observation}</p>
            </div>
            <div>
              <p className="label mb-1">Agreed actions</p>
              <p className="text-sm text-gray-700 leading-relaxed">{note.agreedActions}</p>
            </div>
            {note.followUpDate && (
              <p className="text-xs text-gray-400">
                Follow-up: {new Date(note.followUpDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
                {note.followUpStatus === 'complete' && (
                  <span className="ml-2 text-blue-600 font-semibold">· Resolved</span>
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
