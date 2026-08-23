# Deployment

PeterLingo is a PWA with a Pages Function and D1 binding. `npm run build` produces `dist/`, and
Wrangler deploys those exact assets together with `functions/` to the root-hosted Cloudflare Pages
project at `peterlingo.petergpt.dk`.

## Current state

The Direct Upload project `peterlingo` was created on 2026-08-23 and revision `f770430`
was deployed to `https://peterlingo.pages.dev`. The root route, Hørelære deep route,
manifest, and service worker returned HTTP 200.

That deployment predates the cloud-sync implementation. The custom domain is deliberately not
active yet. Treat the `pages.dev` deployment as technical verification, not the canonical home
for real multi-device sessions, until D1, Access, secrets, a new exact deployment, and the
multi-device checks below are complete.

## Cloud bindings

`wrangler.toml` is the non-secret Pages configuration. D1 is bound as `DB`. The following values
must be configured as Pages secrets and never committed:

- `ACCESS_TEAM_DOMAIN`
- `ACCESS_AUD`
- `ALLOWED_EMAIL`

Apply `migrations/0001_create_attempts.sql` to D1 before the first production sync. The Function
rejects requests when any binding is absent and validates the Access token itself, even though
Access also protects the hostname at Cloudflare's edge.

## Direct Upload

Build and test an exact clean revision, then deploy that build with its Git metadata:

```sh
npm ci
npm run check
npm run test:e2e
git status --short --branch
git rev-parse HEAD
wrangler pages deploy dist --project-name peterlingo --branch main \
  --commit-hash <git-sha> --commit-message "<commit-message>" --commit-dirty=false
```

A Git push alone does not deploy this Direct Upload project. After upload, verify the
production alias, deep routes, manifest, service worker, central offline flow, and the
deployment revision shown by `wrangler pages deployment list --project-name peterlingo`.

## Release checks for cloud sync

1. An unauthenticated request to `/` and `/api/sync` is stopped by Access.
2. A signed-in first device can import an old-origin JSON backup and sees `Synkroniseret`.
3. A second device receives those attempts and the same schedule/mastery.
4. Each device can record a different offline attempt; reconnecting either way converges to the
   union without duplicates.
5. JSON export after convergence contains the merged attempts and can recover a clean browser.
