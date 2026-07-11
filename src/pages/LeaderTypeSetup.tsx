import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LEADER_TYPES } from '../constants/leaderTypes'
import { authApi } from '../api'
import { useAuth } from '../auth'

export default function LeaderTypeSetup() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    if (!selected) return
    setSaving(true)
    setError('')
    try {
      const updated = await authApi.updateProfile({ leaderType: selected })
      updateUser(updated)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving')
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-2xl">

        <div className="mb-8">
          <p className="label mb-2">Welcome, {user?.name}</p>
          <h1 className="text-2xl font-bold text-gray-900">What kind of leader are you?</h1>
          <p className="text-gray-500 text-sm mt-2">
            Choose the style that best fits how you lead. This sets your core values for coaching.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {Object.entries(LEADER_TYPES).map(([key, type]) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`text-left p-5 rounded-2xl border-2 transition-all
                ${selected === key
                  ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{type.emoji}</span>
                <div>
                  <p className={`font-semibold text-sm ${selected === key ? 'text-indigo-700' : 'text-gray-900'}`}>
                    {type.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{type.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.values(type.values).map(v => (
                  <span key={v}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
                      ${selected === key
                        ? 'bg-indigo-100 border-indigo-200 text-indigo-600'
                        : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                    {v}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={confirm}
          disabled={!selected || saving}
          className="btn-primary max-w-xs">
          {saving ? 'Saving…' : 'Get started →'}
        </button>
      </div>
    </main>
  )
}
