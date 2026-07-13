import type { Post } from '../types'
import { delay, type PublishResult } from './types'

// SIMULATED ADAPTER — no live network call is made.
//
// To publish for real: use the LinkedIn Marketing/Community Management
// API's UGC Posts endpoint. Server-side, POST
// https://api.linkedin.com/v2/ugcPosts with an OAuth2 bearer token that
// has the w_member_social (or w_organization_social) scope, and a body
// specifying the author URN, commentary, and shareMediaCategory
// (NONE / IMAGE / VIDEO). Requires the LinkedIn app to be approved for
// the relevant product.
export async function publish(post: Post): Promise<PublishResult> {
  await delay(600 + Math.random() * 700)
  if (post.content.length > 3000) {
    return { ok: false, error: 'Post exceeds LinkedIn 3,000 character limit' }
  }
  if (Math.random() < 0.05) {
    return { ok: false, error: 'Token expired (simulated)' }
  }
  return { ok: true }
}
