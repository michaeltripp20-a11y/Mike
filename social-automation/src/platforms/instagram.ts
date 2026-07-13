import type { Post } from '../types'
import { delay, type PublishResult } from './types'

// SIMULATED ADAPTER — no live network call is made.
//
// To publish for real: use the Instagram Graph API against a Business or
// Creator account linked to a Facebook Page. This is a two-step,
// server-side flow: (1) POST /{ig-user-id}/media with image_url (or
// video_url) + caption to create a media container, then (2) POST
// /{ig-user-id}/media_publish with the returned creation_id. The media
// URL must already be publicly hosted (e.g. uploaded to your own CDN or
// S3 bucket) before step 1 — Instagram fetches it, it isn't uploaded
// as bytes.
export async function publish(post: Post): Promise<PublishResult> {
  await delay(700 + Math.random() * 1000)
  if (!post.mediaUrl) {
    return { ok: false, error: 'Instagram requires an image or video' }
  }
  if (Math.random() < 0.06) {
    return { ok: false, error: 'Media container creation failed (simulated)' }
  }
  return { ok: true }
}
