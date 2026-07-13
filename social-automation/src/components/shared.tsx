import type { PostStatus } from '../types'
import { platformMeta } from '../data'
import type { Platform } from '../types'

export function PlatformTag({ platform }: { platform: Platform }) {
  const meta = platformMeta(platform)
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5"
      style={{ background: `${meta.color}22`, color: meta.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: meta.color }} />
      {meta.label}
    </span>
  )
}

const STATUS_STYLES: Record<PostStatus, string> = {
  draft: 'bg-gray-800 text-gray-400',
  scheduled: 'bg-indigo-900/50 text-indigo-400',
  publishing: 'bg-yellow-900/50 text-yellow-400',
  posted: 'bg-emerald-900/50 text-emerald-400',
  failed: 'bg-red-900/50 text-red-400',
}

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-5 ${className}`}>
      {children}
    </div>
  )
}

export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}
