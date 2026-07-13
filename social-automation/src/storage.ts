import type { Post, ConnectionMap, Platform } from './types'
import { PLATFORMS } from './data'

const POSTS_KEY = 'socialiq.posts.v1'
const CONNECTIONS_KEY = 'socialiq.connections.v1'

export function loadPosts(): Post[] | null {
  const raw = localStorage.getItem(POSTS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Post[]
  } catch {
    return null
  }
}

export function savePosts(posts: Post[]) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts))
}

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
