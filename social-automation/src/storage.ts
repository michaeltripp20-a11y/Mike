import type { Post, ConnectionMap, Platform } from './types'
import { PLATFORMS } from './data'

const CONNECTIONS_KEY = 'socialiq.connections.v1'

export interface FetchPostsResult {
  posts: Post[]
  error?: string
}

// Posts live server-side (api/posts/*, backed by Upstash Redis) so a
// Vercel Cron job can fire scheduled posts even with no browser open.
// If /api isn't running (plain `vite dev`, or Upstash isn't configured
// yet) this returns an error string instead of throwing, so the caller
// can fall back to a local-only preview.
export async function fetchPosts(): Promise<FetchPostsResult> {
  try {
    const res = await fetch('/api/posts')
    if (res.status === 404) {
      return { posts: [], error: 'No /api routes available — run with "vercel dev" or deploy to Vercel to use the live queue.' }
    }
    const data = await res.json()
    if (!res.ok) {
      return { posts: [], error: data.error ?? `HTTP ${res.status}` }
    }
    return { posts: data.posts as Post[] }
  } catch {
    return { posts: [], error: 'Could not reach the posts API. Run with "vercel dev" or deploy to Vercel.' }
  }
}

export async function createPosts(posts: Post[]): Promise<Post[]> {
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ posts }),
  })
  const data = await res.json()
  return (data.posts as Post[]) ?? posts
}

export async function updatePost(id: string, patch: Partial<Post>): Promise<void> {
  await fetch(`/api/posts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

export async function deletePost(id: string): Promise<void> {
  await fetch(`/api/posts/${id}`, { method: 'DELETE' })
}

// Platform connection tokens for the still-simulated platforms stay in
// localStorage — they're demo-only and never sent anywhere.
export function loadConnections(): ConnectionMap {
  const raw = localStorage.getItem(CONNECTIONS_KEY)
  const fallback = Object.fromEntries(
    PLATFORMS.map(p => [p.id, { connected: false, token: '' }])
  ) as ConnectionMap
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw) as ConnectionMap
    return { ...fallback, ...parsed }
  } catch {
    return fallback
  }
}

export function saveConnections(connections: ConnectionMap) {
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections))
}

export function isConnected(connections: ConnectionMap, platform: Platform): boolean {
  return connections[platform]?.connected ?? false
}
