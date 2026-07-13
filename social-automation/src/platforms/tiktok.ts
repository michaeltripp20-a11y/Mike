import type { Post } from '../types'
import { delay, type PublishResult } from './types'

// SIMULATED ADAPTER — no live network call is made.
//
// To publish for real: use TikTok's Content Posting API
// (POST /v2/post/publish/video/init/ to start an upload session, then
// upload the video bytes, then poll status). This requires your TikTok
// developer app to pass TikTok's app review for the "Content Posting
// API" scope before it can publish to accounts other than the
// developer's own — budget review time before relying on this in
// production.
export async function publish(post: Post): Promise<PublishResult> {
  await delay(900 + Math.random() * 1200)
  if (!post.mediaUrl) {
    return { ok: false, error: 'TikTok requires a video' }
  }
  if (Math.random() < 0.1) {
    return { ok: false, error: 'App not yet approved for Content Posting API (simulated)' }
  }
  return { ok: true }
}
