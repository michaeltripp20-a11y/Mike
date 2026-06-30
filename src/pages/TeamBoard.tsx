import { useState, useEffect } from 'react'
import { teamApi, type TeamMember } from '../api'
import { useAuth } from '../auth'
import { Navigate } from 'react-router-dom'
import ScoreBar from '../components/ScoreBar'

const STATUS_LABEL: Record<string, string> = {
  closed: 'Closed',
  paced: 'Paced',
  open: 'Open',
  none: 'No entry',
}

const STATUS_COLOR: Record<string, string> = {
  closed: 'text-emerald-400',
  paced: 'text-indigo-400',
  open: 'text-gray-300',
  none: 'text-gray-600',
}

export default function TeamBoard() {
  const { user } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  if (user?.role !== 'manager') return <Navigate to="/" replace />

  useEffect(() => {
    teamApi.board()
      .then(setMembers)
      .finally(() => setLoading(false))
  }, [])

  const slipping = members.filter(m => m.streak === 0 || m.sevenDayScore < 6)

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading…</div>

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">District Team Board</h1>

      {slipping.length > 0 && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-2xl p-4">
          <h2 className="text-red-400 font-semibold text-sm mb-2">Needs attention ({slipping.length})</h2>
          <div className="flex flex-wrap gap-2">
            {slipping.map(m => (
              <span key={m.userId} className="bg-red-900/40 text-red-300 text-xs px-2.5 py-1 rounded-full">{m.name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-medium">Leader</th>
              <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">7-Day Score</th>
              <th className="text-center px-4 py-3 font-medium">Streak</th>
              <th className="text-center px-4 py-3 font-medium">Today</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {members.map(m => (
              <tr key={m.userId} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-200 shrink-0">
                      {m.name[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-white">{m.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 hidden sm:table-cell w-48">
                  <ScoreBar score={m.sevenDayScore} max={14} />
                </td>
                <td className="px-4 py-4 text-center">
                  {m.streak > 0
                    ? <span className="text-amber-400 font-semibold">🔥 {m.streak}</span>
                    : <span className="text-gray-600">—</span>}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`font-medium ${STATUS_COLOR[m.todayStatus]}`}>
                    {STATUS_LABEL[m.todayStatus]}
                    {m.todayOutcome && ` · ${m.todayOutcome}`}
                  </span>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-gray-500">
                  No leaders in your district yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
