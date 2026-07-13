import { useState } from 'react'
import type { Platform, Post, PostStatus } from '../types'
import { PLATFORMS } from '../data'
import { Card, PlatformTag, StatusBadge, fmtDateTime } from './shared'

interface QueueProps {
  posts: Post[]
  onDelete: (id: string) => void
  onPublishNow: (id: string) => void
}

const STATUS_FILTERS: (PostStatus | 'all')[] = ['all', 'draft', 'scheduled', 'publishing', 'posted', 'failed']

export function Queue({ posts, onDelete, onPublishNow }: QueueProps) {
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all')
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all')

  const filtered = posts
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => platformFilter === 'all' || p.platform === platformFilter)
    .sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime())

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as PostStatus | 'all')}
            className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-emerald-600"
          >
            {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
          </select>
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value as Platform | 'all')}
            className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-emerald-600"
          >
            <option value="all">All platforms</option>
            {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <span className="text-gray-500 text-xs ml-auto">{filtered.length} post{filtered.length === 1 ? '' : 's'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left pb-3 font-medium">Platform</th>
                <th className="text-left pb-3 font-medium">Content</th>
                <th className="text-left pb-3 font-medium">When</th>
                <th className="text-left pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium w-40"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(p => (
                <tr key={p.id}>
                  <td className="py-3"><PlatformTag platform={p.platform} /></td>
                  <td className="py-3 max-w-xs">
                    <div className="text-gray-200 truncate">{p.content}</div>
                    {p.error && <div className="text-red-400 text-xs mt-0.5 truncate">{p.error}</div>}
                  </td>
                  <td className="py-3 text-gray-400 whitespace-nowrap">{fmtDateTime(p.scheduledFor)}</td>
                  <td className="py-3"><StatusBadge status={p.status} /></td>
                  <td className="py-3">
                    <div className="flex gap-2 justify-end">
                      {(p.status === 'scheduled' || p.status === 'failed' || p.status === 'draft') && (
                        <button
                          onClick={() => onPublishNow(p.id)}
                          className="text-xs px-2.5 py-1 rounded-md bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900"
                        >
                          {p.status === 'failed' ? 'Retry' : 'Publish now'}
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(p.id)}
                        className="text-xs px-2.5 py-1 rounded-md bg-gray-800 text-gray-400 hover:bg-red-900/50 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">No posts match these filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
