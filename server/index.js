import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import { getToken, setToken, clearToken } from './lib/tokenStore.js'
import { generatePostText } from './lib/postContent.js'
import * as facebook from './lib/facebook.js'
import * as linkedin from './lib/linkedin.js'

const PORT = process.env.PORT || 8787
const FRONTEND_URL = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

const app = express()
app.use(cors({ origin: FRONTEND_URL }))
app.use(express.json())

// Tracks in-flight OAuth `state` values to guard against CSRF; entries are
// single-use and removed as soon as the matching callback arrives.
const pendingStates = new Set()

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/status', (_req, res) => {
  const fb = getToken('facebook')
  const li = getToken('linkedin')
  res.json({
    facebook: fb ? { connected: true, pageName: fb.pageName } : { connected: false },
    linkedin: li ? { connected: true, name: li.name } : { connected: false },
  })
})

app.post('/api/generate-post', (req, res) => {
  const { kpi, products, regions } = req.body || {}
  if (!kpi) return res.status(400).json({ error: 'kpi is required' })
  res.json({ text: generatePostText({ kpi, products, regions }) })
})

app.post('/api/publish', async (req, res) => {
  const { text, platforms } = req.body || {}
  if (!text || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({ error: 'text and platforms[] are required' })
  }

  const results = {}

  if (platforms.includes('facebook')) {
    const fb = getToken('facebook')
    if (!fb) {
      results.facebook = { ok: false, error: 'Facebook is not connected' }
    } else {
      try {
        const post = await facebook.publishToPage({ id: fb.pageId, accessToken: fb.accessToken }, text)
        results.facebook = { ok: true, postId: post.id }
      } catch (err) {
        results.facebook = { ok: false, error: err.message }
      }
    }
  }

  if (platforms.includes('linkedin')) {
    const li = getToken('linkedin')
    if (!li) {
      results.linkedin = { ok: false, error: 'LinkedIn is not connected' }
    } else {
      try {
        const post = await linkedin.publishPost(li.accessToken, li.memberId, text)
        results.linkedin = { ok: true, postId: post.id }
      } catch (err) {
        results.linkedin = { ok: false, error: err.message }
      }
    }
  }

  res.json(results)
})

app.post('/api/disconnect', (req, res) => {
  const { platform } = req.body || {}
  if (platform !== 'facebook' && platform !== 'linkedin') {
    return res.status(400).json({ error: 'platform must be "facebook" or "linkedin"' })
  }
  clearToken(platform)
  res.json({ ok: true })
})

app.get('/auth/facebook', (_req, res) => {
  const config = facebook.getFacebookConfig()
  if (!config) {
    return res.status(500).send('Facebook app is not configured. Set FB_APP_ID, FB_APP_SECRET, FB_REDIRECT_URI.')
  }
  const state = crypto.randomUUID()
  pendingStates.add(state)
  res.redirect(facebook.buildAuthUrl(config, state))
})

app.get('/auth/facebook/callback', async (req, res) => {
  const { code, state, error } = req.query
  if (error) return res.redirect(`${FRONTEND_URL}/?connect_error=facebook`)
  if (!state || !pendingStates.has(state)) return res.status(400).send('Invalid or expired OAuth state')
  pendingStates.delete(state)

  try {
    const config = facebook.getFacebookConfig()
    const short = await facebook.exchangeCodeForToken(config, code)
    const long = await facebook.exchangeForLongLivedToken(config, short.access_token)
    const page = await facebook.fetchManagedPage(long.access_token, process.env.FB_PAGE_ID)
    setToken('facebook', { pageId: page.id, pageName: page.name, accessToken: page.access_token })
    res.redirect(`${FRONTEND_URL}/?connected=facebook`)
  } catch (err) {
    console.error('Facebook OAuth callback failed:', err)
    res.redirect(`${FRONTEND_URL}/?connect_error=facebook`)
  }
})

app.get('/auth/linkedin', (_req, res) => {
  const config = linkedin.getLinkedInConfig()
  if (!config) {
    return res.status(500).send('LinkedIn app is not configured. Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI.')
  }
  const state = crypto.randomUUID()
  pendingStates.add(state)
  res.redirect(linkedin.buildAuthUrl(config, state))
})

app.get('/auth/linkedin/callback', async (req, res) => {
  const { code, state, error } = req.query
  if (error) return res.redirect(`${FRONTEND_URL}/?connect_error=linkedin`)
  if (!state || !pendingStates.has(state)) return res.status(400).send('Invalid or expired OAuth state')
  pendingStates.delete(state)

  try {
    const config = linkedin.getLinkedInConfig()
    const token = await linkedin.exchangeCodeForToken(config, code)
    const member = await linkedin.fetchMember(token.access_token)
    setToken('linkedin', { memberId: member.id, name: member.name, accessToken: token.access_token })
    res.redirect(`${FRONTEND_URL}/?connected=linkedin`)
  } catch (err) {
    console.error('LinkedIn OAuth callback failed:', err)
    res.redirect(`${FRONTEND_URL}/?connect_error=linkedin`)
  }
})

app.listen(PORT, () => {
  console.log(`Post automation server listening on http://localhost:${PORT}`)
})
