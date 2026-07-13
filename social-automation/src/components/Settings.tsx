import type { ConnectionMap, Platform } from '../types'
import { PLATFORMS } from '../data'
import { Card } from './shared'

interface SettingsProps {
  connections: ConnectionMap
  onChange: (platform: Platform, patch: Partial<ConnectionMap[Platform]>) => void
}

export function Settings({ connections, onChange }: SettingsProps) {
  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <h2 className="text-white font-semibold text-lg mb-1">Platform Connections</h2>
        <p className="text-gray-500 text-sm mb-4">
          Tokens entered here are stored only in this browser's local storage for demo purposes — they
          are not sent anywhere. A real deployment should hold these server-side and never in client code.
        </p>
        <div className="space-y-3">
          {PLATFORMS.map(pl => {
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
          This app is a client-side scheduler and content queue. While the Queue tab is open, it checks
          every few seconds for posts whose scheduled time has passed and "publishes" them through a
          simulated adapter per platform (see <code className="text-gray-300">src/platforms/</code>).
          Real publishing needs two things this static app doesn't have: (1) real OAuth tokens for each
          platform's API, and (2) a server-side worker or cron job to fire scheduled posts even when no
          browser tab is open. See the README for what to add.
        </p>
      </Card>
    </div>
  )
}
