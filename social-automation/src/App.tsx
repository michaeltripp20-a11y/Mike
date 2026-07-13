import { useCallback, useEffect, useState } from 'react'
import type { ConnectionMap, Platform, Post } from './types'
import { generateSeedPosts } from './data'
import { fetchPosts, createPosts, updatePost, deletePost, loadConnections, saveConnections } from './storage'
import { PUBLISHERS } from './platforms'
import { Nav, type Tab } from './components/Nav'
import { Dashboard } from './components/Dashboard'
import { Composer } from './components/Composer'
import { Calendar } from './components/Calendar'
import { Queue } from './components/Queue'
import { Settings } from './components/Settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [posts, setPosts] = useState<Post[]>([])
  const [connections, setConnections] = useState<ConnectionMap>(() => loadConnections())
  const [live, setLive] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const result = await fetchPosts()
    if (result.error) {
      setLive(false)
      setBanner(`Preview mode (not connected to the live queue): ${result.error}`)
      setPosts(prev => (prev.length ? prev : generateSeedPosts()))
    } else {
      setLive(true)
      setBanner(null)
      setPosts(result.posts)
    }
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => { saveConnections(connections) }, [connections])

  // Live mode: the real scheduler is api/cron/publish-due.ts running on
  // Vercel Cron, independent of this tab. Poll periodically just to pick
  // up whatever it changed.
  useEffect(() => {
    if (!live) return
    const interval = setInterval(refresh, 6000)
    return () => clearInterval(interval)
  }, [live, refresh])

  // Preview mode fallback: there is no server cron to rely on, so
  // simulate one client-side purely so the demo stays interactive
  // without requiring a deployment.
  useEffect(() => {
    if (live) return
    const interval = setInterval(() => {
      const due = posts.filter(p => p.status === 'scheduled' && new Date(p.scheduledFor).getTime() <= Date.now())
      due.forEach(p => runPublish(p.id))
    }, 5000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, posts])

  const runPublish = async (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'publishing', error: undefined } : p))
    if (live) await updatePost(id, { status: 'publishing', error: undefined })

    const target = posts.find(p => p.id === id)
    if (!target) return
    const result = await PUBLISHERS[target.platform](target)

    const patch: Partial<Post> = result.ok
      ? {
          status: 'posted',
          error: undefined,
          engagement: target.engagement ?? {
            likes: Math.floor(Math.random() * 500),
            comments: Math.floor(Math.random() * 40),
            shares: Math.floor(Math.random() * 20),
          },
        }
      : { status: 'failed', error: result.error }

    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
    if (live) await updatePost(id, patch)
  }

  const handleCreate = async (newPosts: Post[]) => {
    if (live) {
      const created = await createPosts(newPosts)
      setPosts(prev => [...created, ...prev])
    } else {
      setPosts(prev => [...newPosts, ...prev])
    }
  }

  const handleDelete = async (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
    if (live) await deletePost(id)
  }

  const handleConnectionChange = (platform: Platform, patch: Partial<ConnectionMap[Platform]>) => {
    setConnections(prev => ({ ...prev, [platform]: { ...prev[platform], ...patch } }))
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8L14 8M14 8L9 3M14 8L9 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">SocialIQ</span>
            <span className={`text-[10px] uppercase tracking-wider font-semibold rounded-full px-2 py-0.5 ${live ? 'bg-emerald-900/50 text-emerald-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
              {live ? 'Live queue' : 'Preview'}
            </span>
          </div>
          <Nav active={tab} onChange={setTab} />
        </div>
        {banner && (
          <div className="bg-yellow-900/30 border-t border-yellow-800/50 px-6 py-1.5 text-center">
            <span className="text-yellow-400 text-xs">{banner}</span>
          </div>
        )}
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-gray-500 text-sm py-16 text-center">Loading…</div>
        ) : (
          <>
            {tab === 'dashboard' && <Dashboard posts={posts} />}
            {tab === 'composer' && <Composer onCreate={handleCreate} />}
            {tab === 'calendar' && <Calendar posts={posts} />}
            {tab === 'queue' && <Queue posts={posts} onDelete={handleDelete} onPublishNow={runPublish} />}
            {tab === 'settings' && <Settings connections={connections} onChange={handleConnectionChange} />}
          </>
        )}
      </main>
    </div>
  )
}
