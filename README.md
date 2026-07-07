# SalesIQ Dashboard

A live sales dashboard (React + Vite + Recharts) with a client-generated data
feed, plus a **Post Automation** panel that drafts a sales recap from the
current dashboard numbers and publishes it to a connected Facebook Page and/or
LinkedIn profile.

## Running locally

```bash
npm install
cp .env.example .env   # fill in Facebook/LinkedIn app credentials
npm run dev:all        # runs the Vite frontend (5173) and the API (8787) together
```

Or run them separately: `npm run dev` and `npm run server`.

Open http://localhost:5173. The dashboard's animated data is purely
client-side; the Post Automation panel talks to the backend in `server/`.

## Post Automation

The panel lets you:
1. **Connect** a Facebook Page and/or LinkedIn profile via OAuth.
2. **Generate** a post from the dashboard's current KPIs, top product, and
   leading region.
3. Edit the draft if you want, then **Publish Now** to the selected
   platform(s).

Connections and generated posts are on-demand — nothing is scheduled or
posted automatically without you clicking Publish.

### Setting up Facebook

1. Create an app at https://developers.facebook.com/apps (type: "Business").
2. Add the **Facebook Login** product.
3. Under Facebook Login settings, add a Valid OAuth Redirect URI matching
   `FB_REDIRECT_URI` (default `http://localhost:8787/auth/facebook/callback`).
4. Request the `pages_show_list`, `pages_manage_posts`, and
   `pages_read_engagement` permissions (in dev mode these work immediately
   for admins/testers of the app; public use requires App Review).
5. Put the App ID/Secret in `.env` as `FB_APP_ID` / `FB_APP_SECRET`.
6. If the connecting account manages more than one Page, set `FB_PAGE_ID` to
   pick which one to post to (otherwise the first one is used).

### Setting up LinkedIn

1. Create an app at https://www.linkedin.com/developers/apps.
2. Under Products, request **"Sign In with LinkedIn using OpenID Connect"**
   and **"Share on LinkedIn"** (grants the `openid`, `profile`, and
   `w_member_social` scopes).
3. Under Auth settings, add an Authorized redirect URL matching
   `LINKEDIN_REDIRECT_URI` (default
   `http://localhost:8787/auth/linkedin/callback`).
4. Put the Client ID/Secret in `.env` as `LINKEDIN_CLIENT_ID` /
   `LINKEDIN_CLIENT_SECRET`.

Posting is to the connected member's own LinkedIn profile. Posting to a
LinkedIn Company Page requires LinkedIn's partner-gated Community Management
API and is not wired up here.

### Notes on the backend

`server/` is a small Express app whose only job is to hold the OAuth
client secrets and access tokens (which must never live in browser code) and
make the actual Graph API / LinkedIn API calls. Tokens are stored in
`server/data/tokens.json`, which is gitignored — that's fine for local/dev
use, but swap it for a real secrets store (encrypted DB, KMS-backed vault,
etc.) before running this anywhere multi-user or internet-facing.

## Build

```bash
npm run build
```
