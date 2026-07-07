const FB_VERSION = 'v21.0'
const GRAPH_URL = `https://graph.facebook.com/${FB_VERSION}`

export function getFacebookConfig() {
  const { FB_APP_ID, FB_APP_SECRET, FB_REDIRECT_URI } = process.env
  if (!FB_APP_ID || !FB_APP_SECRET || !FB_REDIRECT_URI) return null
  return { appId: FB_APP_ID, appSecret: FB_APP_SECRET, redirectUri: FB_REDIRECT_URI }
}

export function buildAuthUrl(config, state) {
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    scope: 'pages_show_list,pages_manage_posts,pages_read_engagement',
    response_type: 'code',
    state,
  })
  return `https://www.facebook.com/${FB_VERSION}/dialog/oauth?${params}`
}

export async function exchangeCodeForToken(config, code) {
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    client_secret: config.appSecret,
    code,
  })
  const res = await fetch(`${GRAPH_URL}/oauth/access_token?${params}`)
  if (!res.ok) throw new Error(`Facebook token exchange failed: ${await res.text()}`)
  return res.json()
}

export async function exchangeForLongLivedToken(config, shortLivedToken) {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: config.appId,
    client_secret: config.appSecret,
    fb_exchange_token: shortLivedToken,
  })
  const res = await fetch(`${GRAPH_URL}/oauth/access_token?${params}`)
  if (!res.ok) throw new Error(`Facebook long-lived token exchange failed: ${await res.text()}`)
  return res.json()
}

export async function fetchManagedPage(userAccessToken, preferredPageId) {
  const params = new URLSearchParams({ access_token: userAccessToken })
  const res = await fetch(`${GRAPH_URL}/me/accounts?${params}`)
  if (!res.ok) throw new Error(`Facebook pages lookup failed: ${await res.text()}`)
  const { data } = await res.json()
  if (!data || data.length === 0) throw new Error('No managed Facebook Pages found for this account')
  const page = preferredPageId ? data.find(p => p.id === preferredPageId) : data[0]
  if (!page) throw new Error(`Facebook Page ${preferredPageId} not found among managed pages`)
  return page
}

export async function publishToPage(page, message) {
  const res = await fetch(`${GRAPH_URL}/${page.id}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: page.accessToken }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`Facebook publish failed: ${JSON.stringify(body)}`)
  return body
}
