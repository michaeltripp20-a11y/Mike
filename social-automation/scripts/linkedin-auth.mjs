#!/usr/bin/env node
// One-time (well, ~every 60 days) LinkedIn OAuth helper.
//
// Prereqs:
//   1. Create an app at https://www.linkedin.com/developers/apps
//      - LinkedIn requires the app to be associated with a LinkedIn Page
//        you administer (a personal profile alone isn't enough).
//      - Under "Products", request "Sign In with LinkedIn using OpenID
//        Connect" and "Share on LinkedIn" — both are self-serve and
//        approve instantly for a personal-use app.
//      - Under "Auth" -> "OAuth 2.0 settings", add this exact redirect
//        URL: http://localhost:8765/callback
//   2. Copy the app's Client ID and Client Secret into
//      social-automation/.env.local (gitignored, never commit it):
//        LINKEDIN_CLIENT_ID=...
//        LINKEDIN_CLIENT_SECRET=...
//
// Run:
//   cd social-automation
//   node --env-file=.env.local scripts/linkedin-auth.mjs
//
// This opens a local callback server, prints a LinkedIn consent URL for
// you to visit in a browser, exchanges the resulting code for an access
// token, and prints the values to put in your deployment's environment
// (e.g. Vercel project settings -> Environment Variables):
//   LINKEDIN_ACCESS_TOKEN
//   LINKEDIN_AUTHOR_URN
//
// The token LinkedIn issues is short-lived (~60 days) — rerun this
// script when api/publish/linkedin.ts starts reporting an expired token.

import http from 'node:http'
import crypto from 'node:crypto'

const PORT = 8765
const REDIRECT_URI = `http://localhost:${PORT}/callback`
const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    'Missing LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET.\n' +
    'Put them in social-automation/.env.local and run with:\n' +
    '  node --env-file=.env.local scripts/linkedin-auth.mjs'
  )
  process.exit(1)
}

const state = crypto.randomBytes(16).toString('hex')
const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('client_id', CLIENT_ID)
authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
authUrl.searchParams.set('scope', 'openid profile w_member_social')
authUrl.searchParams.set('state', state)

console.log('\nOpen this URL in a browser and approve access:\n')
console.log(authUrl.toString())
console.log(`\nWaiting for LinkedIn to redirect back to ${REDIRECT_URI} ...\n`)

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI)
  if (url.pathname !== '/callback') {
    res.writeHead(404).end()
    return
  }

  const code = url.searchParams.get('code')
  const returnedState = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error || !code || returnedState !== state) {
    res.writeHead(400, { 'Content-Type': 'text/plain' }).end('Authorization failed — check the terminal and try again.')
    console.error('Authorization failed:', error || 'missing code or state mismatch')
    server.close()
    process.exit(1)
    return
  }

  try {
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    })
    const tokenJson = await tokenRes.json()
    if (!tokenRes.ok) throw new Error(JSON.stringify(tokenJson))

    const accessToken = tokenJson.access_token
    const expiresInDays = Math.round(tokenJson.expires_in / 86400)

    const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const me = await meRes.json()
    if (!meRes.ok) throw new Error(JSON.stringify(me))

    const authorUrn = `urn:li:person:${me.sub}`

    res.writeHead(200, { 'Content-Type': 'text/plain' })
      .end('Success — you can close this tab and go back to the terminal.')

    console.log(`Connected as: ${me.name}`)
    console.log(`Token expires in ~${expiresInDays} days.\n`)
    console.log('Add these to your deployment environment (or social-automation/.env.local):\n')
    console.log(`LINKEDIN_ACCESS_TOKEN=${accessToken}`)
    console.log(`LINKEDIN_AUTHOR_URN=${authorUrn}\n`)
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' }).end('Token exchange failed — check the terminal.')
    console.error('Token exchange failed:', err)
  } finally {
    server.close()
  }
})

server.listen(PORT)
