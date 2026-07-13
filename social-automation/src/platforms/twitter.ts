import type { Post } from '../types'
import { delay, type PublishResult } from './types'

// SIMULATED ADAPTER — no live network call is made.
//
// To publish for real: the X (Twitter) API v2 requires an OAuth2
// user-context access token and cannot be called directly from a browser
// (the required client secret can't be exposed client-side, and the API
// has no permissive CORS policy). Stand up a small backend endpoint
// (e.g. POST /api/publish/twitter) that holds the token server-side and
// forwards to POST https://api.twitter.com/2/tweets with
// { text: post.content } and, for media, an upload via the v1.1 media
// endpoint first to get a media_id to attach.
export async function publish(post: Post): Promise<PublishResult> {
  await delay(500 + Math.random() * 800)
  if (post.content.length > 280) {
    return { ok: false, error: 'Tweet exceeds 280 characters' }
  }
  if (Math.random() < 0.08) {
    return { ok: false, error: 'Rate limited by X API (simulated)' }
  }
  return { ok: true }
}
