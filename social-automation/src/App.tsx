import { useEffect, useState } from 'react'
import type { ConnectionMap, Platform, Post } from './types'
import { generateSeedPosts } from './data'
import { loadPosts, savePosts, loadConnections, saveConnections } from './storage'
import { PUBLISHERS } from './platforms'
import { Nav, type Tab } from './components/Nav'
import { Dashboard } from './components/Dashboard'
import { Composer } from './components/Composer'
import { Calendar } from './components/Calendar'
import { Queue } from './components/Queue'
import { Settings } from './components/Settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [posts, setPosts] = useState<Post[]>(() => loadPosts() ?? generateSeedPosts())
  const [connections, setConnections] = useState<ConnectionMap>(() => loadConnections())

  useEffect(() => { savePosts(posts) }, [posts])
  useEffect(() => { saveConnections(connections) }, [connections])

  const runPublish = async (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'publishing', error: undefined } : p))
    const target = posts.find(p => p.id === id)
    if (!target) return
    const result = await PUBLISHERS[target.platform](target)
    setPosts(prev => prev.map(p => {
      if (p.id !== id) return p
      if (result.ok) {
        return {
          ...p,
          status: 'posted',
          engagement: p.engagement ?? {
            likes: Math.floor(Math.random() * 500),
            comments: Math.floor(Math.random() * 40),
            shares: Math.floor(Math.random() * 20),
          },
        }
      }
      return { ...p, status: 'failed', error: result.error }
    }))
  }

  // Scheduler: while this tab is open, check for due posts every few seconds
  // and fire them through the simulated platform adapters. A production
  // deployment would replace this with a server-side cron/worker so posts
  // still go out when no browser tab is open.
  useEffect(() => {
    const interval = setInterval(() => {
      const due = posts.filter(p => p.status === 'scheduled' && new Date(p.scheduledFor).getTime() <= Date.now())
      due.forEach(p => runPublish(p.id))
    }, 5000)
    return () => clearInterval(interval)
  }, [posts])

  const handleCreate = (newPosts: Post[]) => {
    setPosts(prev => [...newPosts, ...prev])
  }

  const handleDelete = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
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
          </div>
          <Nav active={tab} onChange={setTab} />
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {tab === 'dashboard' && <Dashboard posts={posts} />}
        {tab === 'composer' && <Composer onCreate={handleCreate} />}
        {tab === 'calendar' && <Calendar posts={posts} />}
        {tab === 'queue' && <Queue posts={posts} onDelete={handleDelete} onPublishNow={runPublish} />}
        {tab === 'settings' && <Settings connections={connections} onChange={handleConnectionChange} />}
      </main>
    </div>
  )
}
