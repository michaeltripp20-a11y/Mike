const AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization'
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const USERINFO_URL = 'https://api.linkedin.com/v2/userinfo'
const UGC_POSTS_URL = 'https://api.linkedin.com/v2/ugcPosts'

export function getLinkedInConfig() {
  const { LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI } = process.env
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET || !LINKEDIN_REDIRECT_URI) return null
  return {
    clientId: LINKEDIN_CLIENT_ID,
    clientSecret: LINKEDIN_CLIENT_SECRET,
    redirectUri: LINKEDIN_REDIRECT_URI,
  }
}

export function buildAuthUrl(config, state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'openid profile w_member_social',
    state,
  })
  return `${AUTH_URL}?${params}`
}

export async function exchangeCodeForToken(config, code) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  if (!res.ok) throw new Error(`LinkedIn token exchange failed: ${await res.text()}`)
  return res.json()
}

export async function fetchMember(accessToken) {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`LinkedIn userinfo lookup failed: ${await res.text()}`)
  const info = await res.json()
  return { id: info.sub, name: info.name }
}

export async function publishPost(accessToken, memberId, text) {
  const res = await fetch(UGC_POSTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: `urn:li:person:${memberId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  })
  if (!res.ok) throw new Error(`LinkedIn publish failed: ${await res.text()}`)
  return { id: res.headers.get('x-restli-id') }
}
