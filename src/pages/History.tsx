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

const OUTCOME_LABEL: Record<string, string> = {
  hit: 'Hit',
  partial: 'Partial',
  miss: 'Miss',
}

export default function History() {
  const [days, setDays] = useState<DayEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    daysApi.history().then(setDays).finally(() => setLoading(false))
  }, [])

  const closed = days.filter(d => d.status === 'closed')
  const sevenDay = closed.slice(0, 7)
  const score = sevenDay.reduce((s, d) => s + (d.scorePoints ?? 0), 0)
  const streak = days[0]?.streak ?? 0

  const chartData = [...sevenDay].reverse().map(d => ({
    date: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    pts: d.scorePoints ?? 0,
    outcome: d.overallOutcome ?? 'miss',
  }))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-zinc-700 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-xl font-bold text-white">History</h1>
        <StreakBadge streak={streak} />
      </div>

      {/* 7-day score card */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">7-Day Score</h2>
            <p className="text-zinc-500 text-xs mt-0.5">hit = 2 pts · partial = 1 · miss = 0</p>
          </div>
          <span className={`text-2xl font-bold tabular-nums
            ${score >= 10 ? 'text-emerald-400' : score >= 6 ? 'text-amber-400' : 'text-red-400'}`}>
            {score}<span className="text-zinc-700 text-base">/14</span>
          </span>
        </div>
        <ScoreBar score={score} max={14} />

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barSize={28}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 2]} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '10px', fontSize: '12px', color: '#e4e4e7' }}
                formatter={(v, _, props) => [`${v} pt${v !== 1 ? 's' : ''} — ${OUTCOME_LABEL[props.payload.outcome] ?? ''}`, '']}
                labelStyle={{ color: '#71717a', marginBottom: 2 }}
              />
              <Bar dataKey="pts" radius={[5, 5, 0, 0]} isAnimationActive={false}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={OUTCOME_COLOR[d.outcome] ?? '#3f3f46'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartData.length === 0 && (
          <p className="text-center text-zinc-600 text-sm py-4">No closed days yet</p>
        )}
      </div>

      {/* Day list */}
      <div className="space-y-2.5">
        {days.map(d => {
          const dateLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
          })
          return (
            <div key={d.id} className="card-hover p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-semibold text-zinc-200">{dateLabel}</span>
                <div className="flex items-center gap-2">
                  {d.status === 'closed' && d.overallOutcome ? (
                    <>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                        ${d.overallOutcome === 'hit'
                          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                          : d.overallOutcome === 'partial'
                          ? 'bg-amber-950/70 text-amber-400 border border-amber-800/50'
                          : 'bg-red-950/70 text-red-400 border border-red-800/50'}`}>
                        {OUTCOME_LABEL[d.overallOutcome]}
                      </span>
                      <span className="text-[11px] text-zinc-600 tabular-nums">+{d.scorePoints} pts</span>
                    </>
                  ) : (
                    <span className="text-xs text-zinc-600 capitalize">{d.status}</span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                {d.commitments.map(c => (
                  <div key={c.id} className="flex items-center gap-2.5 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0
                      ${c.outcome === 'hit' ? 'bg-emerald-500'
                        : c.outcome === 'partial' ? 'bg-amber-500'
                        : c.outcome === 'miss' ? 'bg-red-500'
                        : 'bg-zinc-700'}`} />
                    <span className="text-zinc-400">{c.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {days.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-zinc-500 text-sm">No days logged yet.</p>
            <p className="text-zinc-600 text-xs mt-1">Head to Today to start your first day.</p>
          </div>
        )}
      </div>
    </main>
  )
}
