import { useState, useEffect } from 'react'
import { teamApi, type TeamMember } from '../api'
import { useAuth } from '../auth'
import { Navigate, useNavigate } from 'react-router-dom'
import ScoreBar from '../components/ScoreBar'
import FollowUpDashboard from '../components/FollowUpDashboard'

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  closed: { label: 'Closed',   color: 'text-blue-600',   dot: 'bg-blue-500' },
  paced:  { label: 'Paced',    color: 'text-indigo-600', dot: 'bg-indigo-500' },
  open:   { label: 'Open',     color: 'text-gray-600',   dot: 'bg-gray-400' },
  none:   { label: 'No entry', color: 'text-gray-400',   dot: 'bg-gray-300' },
}

const OUTCOME_COLOR: Record<string, string> = {
  hit: 'text-blue-600',
  partial: 'text-amber-600',
  miss: 'text-red-500',
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
      style={{ background: `hsl(${hue} 45% 55%)` }}>
      {initials}
    </div>
  )
}

export default function TeamBoard() {
  const { user } = useAuth()
  const navigate = useNavigate()
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
      <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Store Team Board</h1>
          <p className="text-gray-400 text-xs mt-0.5">{members.length} leader{members.length !== 1 ? 's' : ''} · Store {user?.storeId}</p>
        </div>
        <div className="flex gap-3 text-xs text-gray-500">
          <span><span className="text-blue-600 font-semibold">{on_track.length}</span> on track</span>
          {slipping.length > 0 && <span><span className="text-red-500 font-semibold">{slipping.length}</span> need attention</span>}
        </div>
      </div>

      {/* Slipping alert */}
      {slipping.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-red-500 mt-0.5">⚠</span>
          <div>
            <p className="text-red-700 font-semibold text-sm">Needs attention</p>
            <p className="text-red-400 text-xs mt-0.5 mb-2">Streak broken or 7-day score below 6</p>
            <div className="flex flex-wrap gap-1.5">
              {slipping.map(m => (
                <span key={m.userId}
                  className="bg-red-100 border border-red-200 text-red-600 text-xs px-2.5 py-0.5 rounded-full">
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
            <p className="text-gray-400 text-sm">No leaders in your store yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3.5 label">Leader</th>
                <th className="text-left px-5 py-3.5 label hidden sm:table-cell">7-day score</th>
                <th className="text-center px-4 py-3.5 label">Streak</th>
                <th className="text-right px-5 py-3.5 label">Today</th>
                <th className="px-5 py-3.5 label"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => {
                const sc = STATUS_CONFIG[m.todayStatus] ?? STATUS_CONFIG.none
                const isSlipping = m.streak === 0 || m.sevenDayScore < 6
                return (
                  <tr key={m.userId}
                    className={`border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50
                      ${isSlipping ? 'bg-red-50/60' : i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>

                    {/* Leader */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} />
                        <div>
                          <p className="font-medium text-gray-900">{m.name}</p>
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
                        ? <span className="text-amber-600 font-bold text-sm">🔥 {m.streak}</span>
                        : <span className="text-gray-300 text-sm">—</span>}
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

                    {/* Coach button */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => navigate(`/coach/${m.userId}`, { state: { leaderName: m.name } })}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200
                          bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300
                          transition-colors whitespace-nowrap">
                        Coach →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <FollowUpDashboard />
    </main>
  )
}
