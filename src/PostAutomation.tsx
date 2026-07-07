import { useEffect, useState } from 'react'
import type { KPI, ProductStat, RegionStat } from './data'

interface PlatformStatus {
  connected: boolean
  pageName?: string
  name?: string
}

interface StatusResponse {
  facebook: PlatformStatus
  linkedin: PlatformStatus
}

type PublishResult = { ok: boolean; postId?: string; error?: string }

export default function PostAutomation({
  kpi, products, regions,
}: {
  kpi: KPI; products: ProductStat[]; regions: RegionStat[]
}) {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [text, setText] = useState('')
  const [platforms, setPlatforms] = useState({ facebook: false, linkedin: false })
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [results, setResults] = useState<Record<string, PublishResult> | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refreshStatus() {
    try {
      const res = await fetch('/api/status')
      if (!res.ok) throw new Error('Failed to load connection status')
      const data: StatusResponse = await res.json()
      setStatus(data)
      setPlatforms({ facebook: data.facebook.connected, linkedin: data.linkedin.connected })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status')
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') || params.get('connect_error')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
    refreshStatus()
  }, [])

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kpi, products, regions }),
      })
      if (!res.ok) throw new Error('Failed to generate post')
      const data = await res.json()
      setText(data.text)
      setResults(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate post')
    } finally {
      setGenerating(false)
    }
  }

  async function publish() {
    setPublishing(true)
    setError(null)
    setResults(null)
    try {
      const selected = Object.entries(platforms).filter(([, on]) => on).map(([k]) => k)
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, platforms: selected }),
      })
      if (!res.ok) throw new Error('Failed to publish')
      setResults(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish')
    } finally {
      setPublishing(false)
    }
  }

  async function disconnect(platform: 'facebook' | 'linkedin') {
    await fetch('/api/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    })
    refreshStatus()
  }

  const canPublish = text.trim().length > 0 && (platforms.facebook || platforms.linkedin)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="mb-4">
        <h2 className="text-white font-semibold text-lg">Post Automation</h2>
        <p className="text-gray-500 text-sm">Auto-generate a recap from live data and publish it to Facebook &amp; LinkedIn</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <ConnectionPill
          label="Facebook"
          status={status?.facebook}
          onConnect={() => { window.location.href = '/auth/facebook' }}
          onDisconnect={() => disconnect('facebook')}
        />
        <ConnectionPill
          label="LinkedIn"
          status={status?.linkedin}
          onConnect={() => { window.location.href = '/auth/linkedin' }}
          onDisconnect={() => disconnect('linkedin')}
        />
      </div>

      <button
        onClick={generate}
        disabled={generating}
        className="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-800 text-gray-100 hover:bg-gray-700 disabled:opacity-50 mb-3"
      >
        {generating ? 'Generating…' : 'Generate from live data'}
      </button>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={6}
        placeholder='Click "Generate from live data" to draft a post, or write your own…'
        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm text-gray-100 placeholder-gray-600 resize-none focus:outline-none focus:border-emerald-600"
      />

      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-4 text-sm text-gray-300">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={platforms.facebook}
              disabled={!status?.facebook.connected}
              onChange={e => setPlatforms(p => ({ ...p, facebook: e.target.checked }))}
            />
            Facebook
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={platforms.linkedin}
              disabled={!status?.linkedin.connected}
              onChange={e => setPlatforms(p => ({ ...p, linkedin: e.target.checked }))}
            />
            LinkedIn
          </label>
        </div>
        <button
          onClick={publish}
          disabled={publishing || !canPublish}
          className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {publishing ? 'Publishing…' : 'Publish Now'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

      {results && (
        <div className="mt-3 space-y-1 text-sm">
          {Object.entries(results).map(([platform, result]) => (
            <div key={platform} className={result.ok ? 'text-emerald-400' : 'text-red-400'}>
              {platform}: {result.ok ? `published (${result.postId})` : result.error}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ConnectionPill({
  label, status, onConnect, onDisconnect,
}: {
  label: string
  status?: PlatformStatus
  onConnect: () => void
  onDisconnect: () => void
}) {
  const connected = status?.connected
  return (
    <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-full pl-3 pr-1.5 py-1">
      <span className={`w-2 h-2 rounded-full inline-block ${connected ? 'bg-emerald-400' : 'bg-gray-600'}`} />
      <span className="text-sm text-gray-200">{label}</span>
      {connected && (
        <span className="text-xs text-gray-500 truncate max-w-[120px]">{status?.pageName || status?.name}</span>
      )}
      <button
        onClick={connected ? onDisconnect : onConnect}
        className="text-xs font-medium px-2 py-1 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-200"
      >
        {connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  )
}
