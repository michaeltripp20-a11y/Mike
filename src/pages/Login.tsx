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
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#09090b]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px]
          bg-indigo-500/6 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-700
            flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-900/40">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 17L8.5 10.5L12.5 14.5L20 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">FloorTracker</h1>
          <p className="text-zinc-500 text-sm mt-1">Daily execution for floor leaders</p>
        </div>

        <div className="card p-6 space-y-4 shadow-2xl shadow-black/40">
          <div className="flex rounded-xl overflow-hidden border border-zinc-800 p-0.5 gap-0.5 bg-zinc-800/40">
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all
                  ${mode === m ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
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
              <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/60 text-red-400 text-xs px-3 py-2.5 rounded-xl">
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
