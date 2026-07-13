export type Platform = 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'facebook'

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'posted' | 'failed'

export interface Engagement {
  likes: number
  comments: number
  shares: number
}

export interface Post {
  id: string
  platform: Platform
  content: string
  mediaUrl?: string
  scheduledFor: string // ISO timestamp
  status: PostStatus
  createdAt: string // ISO timestamp
  error?: string
  engagement?: Engagement
}

export interface PlatformMeta {
  id: Platform
  label: string
  color: string
  charLimit: number
  /** True once this platform's publish() calls a real API instead of simulating. */
  live: boolean
}

export interface PlatformConnection {
  connected: boolean
  token: string
}

export type ConnectionMap = Record<Platform, PlatformConnection>
