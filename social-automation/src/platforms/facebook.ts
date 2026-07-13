import type { Post } from '../types'
import { delay, type PublishResult } from './types'

// SIMULATED ADAPTER — no live network call is made.
//
// To publish for real: use the Facebook Graph API against a Page access
// token (not a personal user token — personal profile posting is not
// supported for apps). Server-side, POST /{page-id}/feed with
// { message: post.content, link } for text/link posts, or
// /{page-id}/photos / /{page-id}/videos for media posts.
export async function publish(post: Post): Promise<PublishResult> {
  await delay(500 + Math.random() * 600)
  if (Math.random() < 0.05) {
    return { ok: false, error: 'Page token invalid (simulated)' }
  }
  return { ok: true }
}
