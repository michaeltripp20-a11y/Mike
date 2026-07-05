import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useAuth } from '../auth'

type Mode = 'login' | 'register'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'leader' as 'leader' | 'manager',
    districtId: 1,
  })
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600
            flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 17L8.5 10.5L12.5 14.5L20 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">FloorTracker</h1>
          <p className="text-gray-500 text-sm mt-1">Daily execution for floor leaders</p>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex rounded-xl overflow-hidden border border-gray-200 p-0.5 gap-0.5 bg-gray-100">
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all
                  ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {m === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'register' && (
              <>
                <div>
                  <label className="label mb-1.5 block">Full name</label>
                  <input className="input" placeholder="Your name" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="label mb-1.5 block">Role</label>
                    <select className="input" value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value as 'leader' | 'manager' }))}>
                      <option value="leader">Floor Leader</option>
                      <option value="manager">District Manager</option>
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="label mb-1.5 block">District</label>
                    <input className="input" placeholder="1" type="number" min={1} value={form.districtId}
                      onChange={e => setForm(f => ({ ...f, districtId: Number(e.target.value) }))} required />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="label mb-1.5 block">Email</label>
              <input className="input" placeholder="you@example.com" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label mb-1.5 block">Password</label>
              <input className="input" placeholder="••••••••" type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl">
                <span>⚠</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-1">
              {loading ? 'Loading…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
