import { useState, useEffect } from 'react'
import { teamApi, type TeamMember } from '../api'
import { useAuth } from '../auth'
import { Navigate } from 'react-router-dom'
import ScoreBar from '../components/ScoreBar'

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  closed: { label: 'Closed',   color: 'text-blue-400',   dot: 'bg-blue-400' },
  paced:  { label: 'Paced',    color: 'text-indigo-400', dot: 'bg-indigo-400' },
  open:   { label: 'Open',     color: 'text-zinc-300',   dot: 'bg-zinc-500' },
  none:   { label: 'No entry', color: 'text-zinc-600',   dot: 'bg-zinc-700' },
}

const OUTCOME_COLOR: Record<string, string> = {
  hit: 'text-blue-400',
  partial: 'text-amber-400',
  miss: 'text-red-400',
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
      style={{ background: `hsl(${hue} 50% 30%)`, border: `1px solid hsl(${hue} 50% 40%)` }}>
      {initials}
    </div>
  )
}

export default function TeamBoard() {
  const { user } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  if (user?.role !== 'manager') return <Navigate to="/" replace />

  useEffect(() => {
    teamApi.board().then(setMembers).finally(() => setLoading(false))
  }, [])

  const slipping = members.filter(m => m.streak === 0 || m.sevenDayScore < 6)
  const on_track = members.filter(m => !(m.streak === 0 || m.sevenDayScore < 6))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-zinc-700 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-white">District Team Board</h1>
          <p className="text-zinc-500 text-xs mt-0.5">{members.length} leader{members.length !== 1 ? 's' : ''} · District {user?.districtId}</p>
        </div>
        <div className="flex gap-3 text-xs text-zinc-500">
          <span><span className="text-emerald-400 font-semibold">{on_track.length}</span> on track</span>
          {slipping.length > 0 && <span><span className="text-red-400 font-semibold">{slipping.length}</span> need attention</span>}
        </div>
      </div>

      {/* Slipping alert */}
      {slipping.length > 0 && (
        <div className="bg-red-950/25 border border-red-800/40 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-red-400 mt-0.5">⚠</span>
          <div>
            <p className="text-red-300 font-semibold text-sm">Needs attention</p>
            <p className="text-red-500 text-xs mt-0.5 mb-2">Streak broken or 7-day score below 6</p>
            <div className="flex flex-wrap gap-1.5">
              {slipping.map(m => (
                <span key={m.userId}
                  className="bg-red-950/60 border border-red-800/50 text-red-300 text-xs px-2.5 py-0.5 rounded-full">
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {members.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No leaders in your district yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3.5 label">Leader</th>
                <th className="text-left px-5 py-3.5 label hidden sm:table-cell">7-day score</th>
                <th className="text-center px-4 py-3.5 label">Streak</th>
                <th className="text-right px-5 py-3.5 label">Today</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => {
                const sc = STATUS_CONFIG[m.todayStatus] ?? STATUS_CONFIG.none
                const isSlipping = m.streak === 0 || m.sevenDayScore < 6
                return (
                  <tr key={m.userId}
                    className={`border-b border-zinc-800/50 last:border-0 transition-colors hover:bg-zinc-800/30
                      ${isSlipping ? 'bg-red-950/10' : i % 2 === 0 ? '' : 'bg-zinc-800/10'}`}>

                    {/* Leader */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} />
                        <div>
                          <p className="font-medium text-white">{m.name}</p>
                          {isSlipping && (
                            <p className="text-[10px] text-red-500 font-medium">Needs attention</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 7-day score */}
                    <td className="px-5 py-4 hidden sm:table-cell w-52">
                      <ScoreBar score={m.sevenDayScore} max={14} />
                    </td>

                    {/* Streak */}
                    <td className="px-4 py-4 text-center">
                      {m.streak > 0
                        ? <span className="text-amber-300 font-bold text-sm">🔥 {m.streak}</span>
                        : <span className="text-zinc-700 text-sm">—</span>}
                    </td>

                    {/* Today */}
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`} />
                        <span className={`text-xs font-medium ${sc.color}`}>
                          {sc.label}
                          {m.todayOutcome && (
                            <span className={`ml-1 ${OUTCOME_COLOR[m.todayOutcome] ?? ''}`}>
                              · {m.todayOutcome}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}
