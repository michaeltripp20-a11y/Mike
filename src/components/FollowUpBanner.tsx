import { useState, useEffect } from 'react'
import { coachingApi, FOCUS_AREA_LABELS, type MyFollowUpItem } from '../api'

export default function FollowUpBanner() {
  const [items, setItems] = useState<MyFollowUpItem[]>([])

  useEffect(() => {
    coachingApi.myFollowUps().then(setItems).catch(() => {})
  }, [])

  if (items.length === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-amber-500">⏰</span>
        <p className="text-amber-800 font-semibold text-sm">
          {items.length === 1 ? 'Coaching follow-up due' : `${items.length} coaching follow-ups due`}
        </p>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id}
            className="bg-white border border-amber-100 rounded-xl px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-800">
                  {FOCUS_AREA_LABELS[item.focusArea]}
                  {item.urgency === 'overdue' && (
                    <span className="ml-2 text-red-500 font-normal">overdue</span>
                  )}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{item.agreedActions}</p>
              </div>
              <p className="text-[10px] text-amber-400 shrink-0">
                {item.followUpDate
                  ? new Date(item.followUpDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-amber-500">Your manager will check in on these during your next coaching session.</p>
    </div>
  )
}
