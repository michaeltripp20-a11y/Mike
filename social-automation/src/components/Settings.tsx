import { useEffect, useState } from 'react'
import type { ConnectionMap, Platform } from '../types'
import { PLATFORMS } from '../data'
import { Card } from './shared'

interface SettingsProps {
  connections: ConnectionMap
  onChange: (platform: Platform, patch: Partial<ConnectionMap[Platform]>) => void
}

interface LiveStatus {
  connected: boolean
  name?: string
  error?: string
  checking: boolean
}

function LivePlatformCard({ label, color }: { label: string; color: string }) {
  const [status, setStatus] = useState<LiveStatus>({ connected: false, checking: true })

  const check = async () => {
    setStatus(s => ({ ...s, checking: true }))
    try {
      const res = await fetch('/api/publish/linkedin')
      const data = await res.json()
      setStatus({ connected: Boolean(data.connected), name: data.name, error: data.error, checking: false })
    } catch {
      setStatus({
        connected: false,
        error: 'No /api routes available here — run with "vercel dev" or deploy to Vercel.',
        checking: false,
      })
    }
  }

  useEffect(() => { check() }, [])

  return (
    <div className="border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
          {label}
          <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-900/40 rounded-full px-1.5 py-0.5">Live</span>
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.connected ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
          {status.checking ? 'Checking…' : status.connected ? `Connected as ${status.name}` : 'Not connected'}
        </span>
      </div>
      {status.error && <p className="text-red-400 text-xs mb-2">{status.error}</p>}
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-xs">
          Credentials are set server-side via environment variables, not here — see{' '}
          <code className="text-gray-400">scripts/linkedin-auth.mjs</code> in the repo.
        </p>
        <button
          onClick={check}
          className="text-xs px-2.5 py-1 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 shrink-0 ml-3"
        >
          Recheck
        </button>
      </div>
    </div>
  )
}

export function Settings({ connections, onChange }: SettingsProps) {
  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <h2 className="text-white font-semibold text-lg mb-1">Platform Connections</h2>
        <p className="text-gray-500 text-sm mb-4">
          Tokens entered below are stored only in this browser's local storage for demo purposes — they
          are not sent anywhere and don't actually publish. Platforms marked "Live" post for real using
          credentials held server-side instead.
        </p>
        <div className="space-y-3">
          {PLATFORMS.map(pl => {
            if (pl.live) {
              return <LivePlatformCard key={pl.id} label={pl.label} color={pl.color} />
            }
            const conn = connections[pl.id]
            return (
              <div key={pl.id} className="border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: pl.color }} />
                    {pl.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conn.connected ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
                    {conn.connected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={conn.token}
                    onChange={e => onChange(pl.id, { token: e.target.value })}
                    placeholder="Access token / API key"
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    onClick={() => onChange(pl.id, { connected: !conn.connected && conn.token.trim().length > 0 ? true : !conn.connected })}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${conn.connected ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-emerald-500 text-white hover:bg-emerald-400'}`}
                  >
                    {conn.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-white font-semibold text-lg mb-2">How auto-posting works here</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          LinkedIn now publishes for real through <code className="text-gray-300">api/publish/linkedin.ts</code>.
          Every other platform is still a simulated adapter (see <code className="text-gray-300">src/platforms/</code>)
          for content planning and UI testing. While the Queue tab is open, the app checks every few
          seconds for posts whose scheduled time has passed and fires them through whichever adapter —
          real or simulated — that platform has. Unattended scheduling (posts firing with no browser tab
          open) still needs a server-side cron and a shared datastore for posts; see README.md.
        </p>
      </Card>
    </div>
  )
}
