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

**LinkedIn is live.** `src/platforms/linkedin.ts` calls a real serverless
function (`api/publish/linkedin.ts`) that posts to LinkedIn's API using a
real OAuth token — see "LinkedIn setup" below.

Every other platform (`twitter.ts`, `instagram.ts`, `tiktok.ts`,
`facebook.ts` in `src/platforms/`) is still a simulated adapter: each
`publish(post)` fakes latency and occasional failure instead of calling a
real API, with a comment describing exactly what the real integration
would require (endpoint, auth flow, gotchas) so any of them can be wired
up the same way LinkedIn was.

While the app is open, `App.tsx` polls every 5 seconds for posts whose
`scheduledFor` time has passed and fires them through the matching
adapter — real for LinkedIn, simulated for the rest.

## LinkedIn setup

1. Create an app at https://www.linkedin.com/developers/apps, associated
   with a LinkedIn Page you administer (LinkedIn requires this even for
   personal-profile posting).
2. Under "Products", request **Sign In with LinkedIn using OpenID
   Connect** and **Share on LinkedIn** — both are self-serve and approve
   instantly.
3. Under "Auth", add `http://localhost:8765/callback` as an authorized
   redirect URL.
4. Copy the app's Client ID/Secret into a local `.env.local`
   (see `.env.local.example`; this file is gitignored — never commit it
   or paste real secrets into chat).
5. Run the one-time auth helper:
   ```bash
   cd social-automation
   node --env-file=.env.local scripts/linkedin-auth.mjs
   ```
   It opens a local callback server, prints a LinkedIn consent URL to
   visit in a browser, and on approval prints `LINKEDIN_ACCESS_TOKEN` and
   `LINKEDIN_AUTHOR_URN`.
6. Put those two values in `.env.local` for local testing, **and** in
   your Vercel project's Environment Variables for the real deployment.
   The token expires in ~60 days — rerun step 5 to refresh it.
7. Test locally with `vercel dev` (not plain `vite dev` — that doesn't
   serve `/api` routes) or deploy to Vercel, then use Composer/Queue as
   normal. LinkedIn posts for real; every other platform still simulates.

## Turning the rest into something that actually posts

The same two things that were missing before are still missing for
Twitter/Instagram/TikTok/Facebook, by design (a static frontend can't do
either safely):

1. **Real credentials** per platform — OAuth tokens with the right scopes
   (see the comments in each `src/platforms/*.ts` file for specifics),
   held server-side only, following the LinkedIn pattern above.
2. **A server-side scheduler.** Posts currently only fire while this
   browser tab is open. Unattended scheduling needs a real datastore
   (not `localStorage`, which only the browser can see) plus a cron
   trigger — e.g. Vercel Cron calling a scheduled function that reads due
   posts from a database and calls each platform's `publish()` logic
   server-side. `src/storage.ts` would move from `localStorage` calls to
   calls against that API.

## Content generation

The Composer's media field currently takes a URL directly. Higgsfield
(available as an MCP connector in Claude sessions with access to this
account) can generate the images/video for that field — that wiring isn't
built into the running app yet since it would also require a backend to
call the Higgsfield API on the app's behalf.
