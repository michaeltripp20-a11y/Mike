import { useState, useEffect } from 'react'
import { daysApi, type DayEntry } from '../api'
import StreakBadge from '../components/StreakBadge'
import ScoreBar from '../components/ScoreBar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const OUTCOME_COLOR: Record<string, string> = {
  hit: '#10b981',
  partial: '#f59e0b',
  miss: '#ef4444',
}

export default function History() {
  const [days, setDays] = useState<DayEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    daysApi.history()
      .then(setDays)
      .finally(() => setLoading(false))
  }, [])

  const sevenDay = days.filter(d => d.status === 'closed').slice(0, 7)
  const score = sevenDay.reduce((s, d) => s + (d.scorePoints ?? 0), 0)
  const streak = days[0]?.streak ?? 0

  const chartData = [...sevenDay].reverse().map(d => ({
    date: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    pts: d.scorePoints ?? 0,
    outcome: d.overallOutcome ?? 'miss',
  }))

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-white">History</h1>
        <StreakBadge streak={streak} />
      </div>

      {/* 7-day score */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">7-Day Score</h2>
          <span className="text-xs text-gray-400">hit=2 · partial=1 · miss=0</span>
        </div>
        <ScoreBar score={score} max={14} />
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 2]} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v) => [`${v} pt${v !== 1 ? 's' : ''}`, 'Score']}
              />
              <Bar dataKey="pts" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={OUTCOME_COLOR[d.outcome] ?? '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Day list */}
      <div className="space-y-3">
        {days.map(d => (
          <div key={d.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">
                {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <div className="flex items-center gap-2">
                {d.status === 'closed' && d.overallOutcome && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize
                    ${d.overallOutcome === 'hit' ? 'bg-emerald-900/50 text-emerald-400' :
                      d.overallOutcome === 'partial' ? 'bg-amber-900/50 text-amber-400' :
                      'bg-red-900/50 text-red-400'}`}>
                    {d.overallOutcome}
                  </span>
                )}
                {d.status !== 'closed' && (
                  <span className="text-xs text-gray-500 capitalize">{d.status}</span>
                )}
                {d.scorePoints !== null && (
                  <span className="text-xs text-gray-400">+{d.scorePoints} pts</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              {d.commitments.map(c => (
                <div key={c.id} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    c.outcome === 'hit' ? 'bg-emerald-500' :
                    c.outcome === 'partial' ? 'bg-amber-500' :
                    c.outcome === 'miss' ? 'bg-red-500' : 'bg-gray-600'}`} />
                  <span className="text-gray-400">{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {days.length === 0 && (
          <p className="text-center text-gray-500 py-8">No days logged yet. Start today!</p>
        )}
      </div>
    </main>
  )
}
