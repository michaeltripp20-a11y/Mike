import { useState } from 'react'
import type { Platform, Post, PostStatus } from '../types'
import { PLATFORMS, platformMeta } from '../data'
import { Card } from './shared'

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

export function Composer({ onCreate }: { onCreate: (posts: Post[]) => void }) {
  const [selected, setSelected] = useState<Platform[]>(['twitter'])
  const [content, setContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const togglePlatform = (id: Platform) => {
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const minLimit = selected.length
    ? Math.min(...selected.map(id => platformMeta(id).charLimit))
    : Infinity
  const overLimit = content.length > minLimit

  const submit = (status: PostStatus) => {
    if (!content.trim() || selected.length === 0) return
    const scheduledIso = scheduledFor ? new Date(scheduledFor).toISOString() : new Date().toISOString()
    const posts: Post[] = selected.map(platform => ({
      id: makeId(),
      platform,
      content,
      mediaUrl: mediaUrl.trim() || undefined,
      scheduledFor: scheduledIso,
      status: status === 'scheduled' && !scheduledFor ? 'draft' : status,
      createdAt: new Date().toISOString(),
    }))
    onCreate(posts)
    setConfirmation(`${posts.length} post${posts.length > 1 ? 's' : ''} ${status === 'draft' ? 'saved as draft' : 'scheduled'}.`)
    setContent('')
    setMediaUrl('')
    setScheduledFor('')
    setTimeout(() => setConfirmation(''), 3000)
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <h2 className="text-white font-semibold text-lg mb-1">New Post</h2>
        <p className="text-gray-500 text-sm mb-4">Draft once, cross-post to as many platforms as you like.</p>

        <div className="mb-4">
          <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-2">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(pl => {
              const active = selected.includes(pl.id)
              return (
                <button
                  key={pl.id}
                  onClick={() => togglePlatform(pl.id)}
                  className="text-sm font-medium px-3 py-1.5 rounded-full border transition-colors"
                  style={active
                    ? { background: `${pl.color}22`, borderColor: pl.color, color: pl.color }
                    : { background: 'transparent', borderColor: '#374151', color: '#9ca3af' }}
                >
                  {pl.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">Caption</label>
            <span className={`text-xs ${overLimit ? 'text-red-400' : 'text-gray-500'}`}>
              {content.length} / {minLimit === Infinity ? '—' : minLimit}
            </span>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={5}
            placeholder="What do you want to say?"
            className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-600 resize-none"
          />
          {overLimit && <p className="text-red-400 text-xs mt-1">Exceeds the character limit of the shortest-limit platform selected.</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-2">Media URL (optional)</label>
            <input
              value={mediaUrl}
              onChange={e => setMediaUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            />
            <p className="text-gray-600 text-xs mt-1">Required by Instagram &amp; TikTok. In production this would come from an AI content-generation step.</p>
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-2">Schedule for</label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={e => setScheduledFor(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => submit('draft')}
            disabled={!content.trim() || selected.length === 0}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Draft
          </button>
          <button
            onClick={() => submit('scheduled')}
            disabled={!content.trim() || selected.length === 0 || overLimit || !scheduledFor}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Schedule Post
          </button>
          {confirmation && <span className="text-emerald-400 text-sm">{confirmation}</span>}
        </div>
      </Card>
    </div>
  )
}
