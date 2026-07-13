import { useMemo, useState } from 'react'
import type { Post } from '../types'
import { platformMeta } from '../data'
import { Card, PlatformTag, StatusBadge, fmtDateTime } from './shared'

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

export function Calendar({ posts }: { posts: Post[] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>()
    for (const p of posts) {
      const key = new Date(p.scheduledFor).toDateString()
      const list = map.get(key) ?? []
      list.push(p)
      map.set(key, list)
    }
    return map
  }, [posts])

  const total = daysInMonth(cursor)
  const firstWeekday = cursor.getDay()
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: total }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
  ]

  const selectedPosts = selectedDay ? (postsByDay.get(selectedDay) ?? []) : []

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">
            {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="px-2.5 py-1 text-sm rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              ←
            </button>
            <button
              onClick={() => setCursor(startOfMonth(new Date()))}
              className="px-2.5 py-1 text-sm rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              Today
            </button>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="px-2.5 py-1 text-sm rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-gray-500 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((date, i) => {
            if (!date) return <div key={i} />
            const key = date.toDateString()
            const dayPosts = postsByDay.get(key) ?? []
            const isToday = key === new Date().toDateString()
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(dayPosts.length ? key : null)}
                className={`aspect-square rounded-lg border p-1.5 flex flex-col items-start text-left transition-colors ${
                  isToday ? 'border-emerald-600' : 'border-gray-800'
                } ${dayPosts.length ? 'bg-gray-950 hover:border-gray-600 cursor-pointer' : 'bg-gray-900/40'}`}
              >
                <span className={`text-xs ${isToday ? 'text-emerald-400 font-semibold' : 'text-gray-500'}`}>{date.getDate()}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {dayPosts.slice(0, 4).map(p => (
                    <span
                      key={p.id}
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ background: platformMeta(p.platform).color }}
                    />
                  ))}
                  {dayPosts.length > 4 && <span className="text-[10px] text-gray-500">+{dayPosts.length - 4}</span>}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {selectedDay && (
        <Card>
          <h3 className="text-white font-semibold mb-3">{selectedDay}</h3>
          <div className="space-y-2">
            {selectedPosts.map(p => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                <PlatformTag platform={p.platform} />
                <div className="flex-1 min-w-0 text-sm text-gray-300 truncate">{p.content}</div>
                <div className="text-xs text-gray-500 shrink-0">{fmtDateTime(p.scheduledFor)}</div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
