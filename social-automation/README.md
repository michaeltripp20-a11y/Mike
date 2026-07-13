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

Posts live in a shared Upstash Redis store via `api/posts/*` so scheduled
posts can fire from a real cron job with no browser open — see "Persistent
scheduling" below. If that backend isn't reachable (plain `vite dev`, or
Upstash isn't configured yet), the app falls back to a local-only
**Preview** mode — a yellow banner and header badge make it obvious which
mode you're in. Platform connection tokens for the still-simulated
platforms stay in `localStorage` either way (demo only, never sent
anywhere).

## What's real vs. simulated

**LinkedIn is live.** `src/platforms/linkedin.ts` (browser) and
`api/_lib/linkedin.ts` (server, used by the cron job) both call LinkedIn's
real API using a real OAuth token — see "LinkedIn setup" below.

Every other platform (`twitter.ts`, `instagram.ts`, `tiktok.ts`,
`facebook.ts` in `src/platforms/`) is still a simulated adapter: each
`publish(post)` fakes latency and occasional failure instead of calling a
real API, with a comment describing exactly what the real integration
would require (endpoint, auth flow, gotchas) so any of them can be wired
up the same way LinkedIn was.

In **live** mode, `api/cron/publish-due.ts` — triggered by Vercel Cron,
not this browser tab — checks for posts whose `scheduledFor` time has
passed and fires them through the matching adapter (real for LinkedIn,
simulated for the rest), independent of whether anyone has the app open.
In **preview** mode there is no cron, so `App.tsx` simulates one
client-side every 5 seconds purely to keep the demo interactive.

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

## Persistent scheduling (Upstash + Vercel Cron)

1. Create a free Redis database at https://console.upstash.com, then copy
   its REST URL and token from the dashboard into `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=...
   UPSTASH_REDIS_REST_TOKEN=...
   ```
2. Generate a random `CRON_SECRET` (a command for this is in
   `.env.local.example`) and add it to `.env.local` too. This stops
   strangers from hitting `/api/cron/publish-due` and firing your queue.
3. Add all of `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and
   `CRON_SECRET` to your Vercel project's Environment Variables (same
   values as `.env.local`) before deploying.
4. `vercel.json` already defines the cron schedule
   (`/api/cron/publish-due` every 5 minutes). **Vercel's free Hobby plan
   only runs cron jobs once a day**, regardless of what the schedule
   says — 5-minute granularity needs a Pro plan. If you're on Hobby and
   want tighter timing, point an external pinger (e.g. cron-job.org or a
   scheduled GitHub Actions workflow) at
   `https://<your-app>.vercel.app/api/cron/publish-due` with header
   `Authorization: Bearer <CRON_SECRET>` instead of relying on
   `vercel.json`.
5. Once deployed, the header badge switches from "Preview" to "Live
   queue" and posts persist across devices/browsers, not just this one.

## Turning the rest into something that actually posts

Twitter/Instagram/TikTok/Facebook still need real OAuth credentials with
the right scopes (see the comments in each `src/platforms/*.ts` file for
specifics), held server-side only. Follow the LinkedIn pattern above:
add an `api/_lib/<platform>.ts` with the real API call, an
`api/publish/<platform>.ts` HTTP wrapper for the browser's manual
"Publish now" button, wire it into `api/_lib/publishers.ts`'s switch
statement for the cron job, and flip that platform's `live` flag to
`true` in `src/data.ts`.

## Content generation

The Composer's media field currently takes a URL directly. Higgsfield
(available as an MCP connector in Claude sessions with access to this
account) can generate the images/video for that field — that wiring isn't
built into the running app yet since it would also require a backend to
call the Higgsfield API on the app's behalf.
