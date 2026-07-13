import { Redis } from '@upstash/redis'
import type { Post } from '../../src/types'

// Shared datastore for posts, so scheduled posts can fire from a Vercel
// Cron job even when nobody has the app open in a browser (localStorage
// only the browser that wrote it can see). Requires a free Upstash Redis
// database — create one at https://console.upstash.com, then copy its
// REST URL/token into UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN.
const POSTS_KEY = 'socialiq:posts'

function getClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not configured on the server.')
  }
  return new Redis({ url, token })
}

export async function getAllPosts(): Promise<Post[]> {
  const redis = getClient()
  const posts = await redis.get<Post[]>(POSTS_KEY)
  return posts ?? []
}

export async function saveAllPosts(posts: Post[]): Promise<void> {
  const redis = getClient()
  await redis.set(POSTS_KEY, posts)
}
