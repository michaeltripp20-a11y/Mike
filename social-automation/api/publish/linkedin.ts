import type { VercelRequest, VercelResponse } from '@vercel/node'

// Real LinkedIn integration. Requires LINKEDIN_ACCESS_TOKEN and
// LINKEDIN_AUTHOR_URN as server-side environment variables — see
// scripts/linkedin-auth.mjs to obtain them. This function is the only
// place those values are read; they must never reach the browser bundle.
//
// GET  -> connection status (calls LinkedIn's userinfo endpoint)
// POST -> publish { content: string } as a real LinkedIn post
//
// LINKEDIN_API_VERSION must be a version LinkedIn currently accepts
// (they publish monthly version strings, e.g. "202405", and only honor
// the last ~12 months). Check
// https://learn.microsoft.com/en-us/linkedin/marketing/versioning for
// the current value and set it as an env var if the default here has
// gone stale — a version mismatch comes back as a clear 400 from
// LinkedIn, not a silent failure.
const LINKEDIN_VERSION = process.env.LINKEDIN_API_VERSION || '202405'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN

  if (!accessToken || !authorUrn) {
    res.status(500).json({
      ok: false,
      connected: false,
      error: 'LINKEDIN_ACCESS_TOKEN / LINKEDIN_AUTHOR_URN are not set on the server. Run scripts/linkedin-auth.mjs and add the printed values as environment variables.',
    })
    return
  }

  if (req.method === 'GET') {
    try {
      const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!meRes.ok) {
        res.status(200).json({
          connected: false,
          error: `LinkedIn rejected the stored token (HTTP ${meRes.status}). It likely expired — rerun scripts/linkedin-auth.mjs.`,
        })
        return
      }
      const me = await meRes.json()
      res.status(200).json({ connected: true, name: me.name })
    } catch (err) {
      res.status(200).json({ connected: false, error: err instanceof Error ? err.message : 'Could not reach LinkedIn' })
    }
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
  if (content.length > 3000) {
    res.status(400).json({ ok: false, error: "Content exceeds LinkedIn's 3,000 character limit" })
    return
  }

  try {
    const postRes = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': LINKEDIN_VERSION,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: authorUrn,
        commentary: content,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    })

    if (!postRes.ok) {
      const errText = await postRes.text()
      res.status(200).json({ ok: false, error: `LinkedIn API error (HTTP ${postRes.status}): ${errText.slice(0, 300)}` })
      return
    }

    const postUrn = postRes.headers.get('x-restli-id') ?? undefined
    res.status(200).json({ ok: true, postUrn })
  } catch (err) {
    res.status(200).json({ ok: false, error: err instanceof Error ? err.message : 'Unknown error calling LinkedIn' })
  }
}
