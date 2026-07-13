import type { VercelRequest, VercelResponse } from '@vercel/node'
import { checkLinkedInConnection, publishLinkedIn } from '../_lib/linkedin'

// HTTP wrapper around api/_lib/linkedin.ts for the browser: Settings uses
// GET to show real connection status, Queue's "Publish now" uses POST.
// The cron job (api/cron/publish-due.ts) calls the _lib functions
// directly instead of going through this route.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const status = await checkLinkedInConnection()
    res.status(200).json(status)
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const content = typeof req.body === 'string' ? JSON.parse(req.body).content : req.body?.content
  if (!content || typeof content !== 'string') {
    res.status(400).json({ ok: false, error: 'Missing "content" string in request body' })
    return
  }

  const result = await publishLinkedIn(content)
  res.status(200).json(result)
}
