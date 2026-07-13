import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAllPosts, saveAllPosts } from '../_lib/kv'
import { publishForPlatform } from '../_lib/publishers'

// Triggered by Vercel Cron (see vercel.json) so scheduled posts fire even
// when nobody has the app open. If CRON_SECRET is set, requests must
// carry `Authorization: Bearer <CRON_SECRET>` — Vercel adds this header
// automatically for its own cron invocations; set the same value in your
// project's environment variables. Without CRON_SECRET set, the route is
// open to anyone who finds the URL, so set it before deploying.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.authorization
    if (auth !== `Bearer ${secret}`) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
  }

  try {
    const posts = await getAllPosts()
    const now = Date.now()
    const due = posts.filter(p => p.status === 'scheduled' && new Date(p.scheduledFor).getTime() <= now)

    if (due.length === 0) {
      res.status(200).json({ processed: 0 })
      return
    }

    due.forEach(post => { post.status = 'publishing' })
    await saveAllPosts(posts)

    await Promise.all(due.map(async post => {
      const result = await publishForPlatform(post)
      if (result.ok) {
        post.status = 'posted'
        post.engagement = post.engagement ?? {
          likes: Math.floor(Math.random() * 500),
          comments: Math.floor(Math.random() * 40),
          shares: Math.floor(Math.random() * 20),
        }
        post.error = undefined
      } else {
        post.status = 'failed'
        post.error = result.error
      }
    }))

    await saveAllPosts(posts)
    res.status(200).json({ processed: due.length })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
