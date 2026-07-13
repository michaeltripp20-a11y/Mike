# SocialIQ — Social Automation Studio

A content queue and scheduler for social media, built the same way as the
`salesiq-dashboard` app one level up (React + TypeScript + Vite + Tailwind
via CDN + Recharts).

Run it independently:

```bash
cd social-automation
npm install
npm run dev
```

## What it does

- **Composer** — draft a post once, pick multiple platforms, and it gets
  split into one `Post` per platform (each has its own character limit).
- **Calendar** — month view of scheduled/published posts.
- **Queue** — table of every post with status (`draft`, `scheduled`,
  `publishing`, `posted`, `failed`), filters, and manual "Publish now" /
  "Retry" actions.
- **Dashboard** — engagement chart, platform mix, upcoming posts.
- **Settings** — per-platform token fields and connection status.

Posts and connection tokens persist to `localStorage` — there's no backend
in this MVP.

## What's real vs. simulated

Everything here is real except the actual network call to each social
platform's API — that part is intentionally stubbed out. `src/platforms/`
has one file per platform (`twitter.ts`, `instagram.ts`, `linkedin.ts`,
`tiktok.ts`, `facebook.ts`), each exporting a `publish(post)` function that
simulates latency and occasional failure instead of calling a real API.
Each file has a comment describing exactly what the real integration
requires (endpoint, auth flow, gotchas).

While the app is open, `App.tsx` polls every 5 seconds for posts whose
`scheduledFor` time has passed and fires them through the matching stub.

## Turning this into something that actually posts

Two things are missing, both by design (a static frontend can't do either
safely):

1. **Real credentials.** Every platform's posting API needs an OAuth token
   with the right scopes (X API v2, Instagram/Facebook Graph API, LinkedIn
   UGC Posts API, TikTok Content Posting API — see the comments in
   `src/platforms/*.ts` for specifics). These tokens must never live in
   client-side code; a browser can't hold a client secret safely, and most
   of these APIs don't allow direct browser calls (no permissive CORS).
2. **A server-side scheduler.** Posts need to fire even when nobody has
   this tab open. That means a small backend (a cron job, a queue worker,
   a serverless scheduled function) that reads due posts from a real
   database and calls each platform's API with the stored token.

The cleanest path: stand up a minimal backend (e.g. a Node/Express service
or serverless functions) that exposes `POST /api/posts`,
`GET /api/posts`, and a scheduled job that replaces the `setInterval` in
`App.tsx` with a real cron trigger calling the same `publish()` logic
server-side. Swap `src/storage.ts` for calls to that API instead of
`localStorage`, and replace each stub in `src/platforms/` with the real
API call using a token read from server-side secrets.

## Content generation

The Composer's media field currently takes a URL directly. Higgsfield
(available as an MCP connector in Claude sessions with access to this
account) can generate the images/video for that field — that wiring isn't
built into the running app yet since it would also require a backend to
call the Higgsfield API on the app's behalf.
