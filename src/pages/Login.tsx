import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useAuth } from '../auth'

type Mode = 'login' | 'register'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'leader' as 'leader' | 'manager', districtId: 1 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = mode === 'login'
        ? await authApi.login({ email: form.email, password: form.password })
        : await authApi.register(form)
      login(res.token, res.user)
      nav('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const field = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors'

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-xl font-bold text-white mx-auto mb-3">F</div>
          <h1 className="text-2xl font-bold text-white">FloorTracker</h1>
          <p className="text-gray-400 text-sm mt-1">Daily execution for floor leaders</p>
        </div>

        <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex rounded-lg overflow-hidden border border-gray-700 mb-2">
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium transition-colors capitalize ${mode === m ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {m === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <>
              <input className={field} placeholder="Full name" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <div className="flex gap-2">
                <select className={field} value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as 'leader' | 'manager' }))}>
                  <option value="leader">Floor Leader</option>
                  <option value="manager">District Manager</option>
                </select>
                <input className={field} placeholder="District #" type="number" min={1} value={form.districtId}
                  onChange={e => setForm(f => ({ ...f, districtId: Number(e.target.value) }))} required />
              </div>
            </>
          )}

          <input className={field} placeholder="Email" type="email" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <input className={field} placeholder="Password" type="password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
            {loading ? 'Loading…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
