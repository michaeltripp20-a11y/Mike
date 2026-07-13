import type { Post } from '../types'
import type { PublishResult } from './types'

// REAL ADAPTER. Calls the serverless function in api/publish/linkedin.ts,
// which holds the actual LinkedIn OAuth token server-side (see
// scripts/linkedin-auth.mjs and README.md for one-time setup).
//
// This only works when the app's /api routes are actually running:
// `vercel dev` locally, or a real Vercel deployment. Plain `vite dev`
// serves the frontend only, so calls here will fail with a clear error
// explaining why rather than silently pretending to succeed.
export async function publish(post: Post): Promise<PublishResult> {
  if (post.content.length > 3000) {
    return { ok: false, error: 'Post exceeds LinkedIn 3,000 character limit' }
  }

  let res: Response
  try {
    res = await fetch('/api/publish/linkedin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: post.content }),
    })
  } catch {
    return { ok: false, error: 'Could not reach the publish API. Run with "vercel dev" or deploy to Vercel.' }
  }

  if (res.status === 404) {
    return { ok: false, error: 'No /api routes available in this environment — run with "vercel dev" or deploy to Vercel to publish for real.' }
  }

  const data = await res.json()
  return { ok: Boolean(data.ok), error: data.error }
}
