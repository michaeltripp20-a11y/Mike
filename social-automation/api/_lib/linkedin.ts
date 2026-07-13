// Real LinkedIn integration, callable directly from server code (used by
// both api/publish/linkedin.ts for manual "publish now" clicks and
// api/cron/publish-due.ts for unattended scheduled firing). Requires
// LINKEDIN_ACCESS_TOKEN and LINKEDIN_AUTHOR_URN as server-side
// environment variables — see scripts/linkedin-auth.mjs to obtain them.
// These values must never reach the browser bundle.
//
// LINKEDIN_API_VERSION must be a version LinkedIn currently accepts
// (they publish monthly version strings, e.g. "202405", and only honor
// the last ~12 months). Check
// https://learn.microsoft.com/en-us/linkedin/marketing/versioning for
// the current value and set it as an env var if the default here has
// gone stale — a version mismatch comes back as a clear 400 from
// LinkedIn, not a silent failure.
const LINKEDIN_VERSION = process.env.LINKEDIN_API_VERSION || '202405'

export interface LinkedInPublishResult {
  ok: boolean
  error?: string
  postUrn?: string
}

export interface LinkedInStatus {
  connected: boolean
  name?: string
  error?: string
}

export async function checkLinkedInConnection(): Promise<LinkedInStatus> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
  if (!accessToken) {
    return { connected: false, error: 'LINKEDIN_ACCESS_TOKEN is not set on the server. Run scripts/linkedin-auth.mjs.' }
  }
  try {
    const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!meRes.ok) {
      return { connected: false, error: `LinkedIn rejected the stored token (HTTP ${meRes.status}). It likely expired — rerun scripts/linkedin-auth.mjs.` }
    }
    const me = await meRes.json()
    return { connected: true, name: me.name }
  } catch (err) {
    return { connected: false, error: err instanceof Error ? err.message : 'Could not reach LinkedIn' }
  }
}

export async function publishLinkedIn(content: string): Promise<LinkedInPublishResult> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
  const authorUrn = process.env.LINKEDIN_AUTHOR_URN

  if (!accessToken || !authorUrn) {
    return { ok: false, error: 'LINKEDIN_ACCESS_TOKEN / LINKEDIN_AUTHOR_URN are not set on the server. Run scripts/linkedin-auth.mjs.' }
  }
  if (content.length > 3000) {
    return { ok: false, error: "Content exceeds LinkedIn's 3,000 character limit" }
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
      return { ok: false, error: `LinkedIn API error (HTTP ${postRes.status}): ${errText.slice(0, 300)}` }
    }

    const postUrn = postRes.headers.get('x-restli-id') ?? undefined
    return { ok: true, postUrn }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error calling LinkedIn' }
  }
}
