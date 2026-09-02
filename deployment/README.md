# Deployment

PeterLingo is a PWA with a Pages Function and D1 binding. `npm run build` produces `dist/`, and
Wrangler deploys those exact assets together with `functions/` to the root-hosted Cloudflare Pages
project at `peterlingo.petergpt.dk`.

## Current state

The Direct Upload project `peterlingo` was created on 2026-08-23. Revision `0d2c337` is deployed
with its Pages Function and D1 binding. The production alias rejects unauthenticated API requests,
and the unique deployment is `https://c2d805e4.peterlingo.pages.dev`.

`https://peterlingo.petergpt.dk` is active and is the canonical production origin. Cloudflare
Access redirects unauthenticated requests and permits only Peter's approved identity through the
account's Cloudflare identity provider; email one-time PIN is not enabled for this application.
Root, deep routes, manifest, and service worker are protected by the same application. Physical
signed-in access and shared progress between iPad and Mac Mini were confirmed by Peter on
2026-08-23. PC/iPhone, offline-conflict, origin-migration, and clean-browser recovery checks remain
as operational hardening.

`/api/login` is the cache-proof login recovery route: Access authenticates the request before the
Function redirects to `/`. It remains reachable through an old app shell because service workers
exclude `/api/`. New app versions also reload once when a replacement service worker takes control.

The discreet production-only `Log ud` link uses `/cdn-cgi/access/logout`. Cloudflare Access does
not support end-user logout from only one application, so PeterLingo asks for confirmation and
warns that the action also ends other Access sessions in the same browser.

## Cloud bindings

`wrangler.toml` is the non-secret Pages configuration. D1 is bound as `DB`. The following values
must be configured as Pages secrets and never committed:

- `ACCESS_TEAM_DOMAIN`
- `ACCESS_AUD`
- `ALLOWED_EMAIL`

`migrations/0001_create_attempts.sql` was applied locally and to the production `peterlingo` D1
database in the EEUR region on 2026-08-23. The Function rejects requests when any binding is
absent and validates the Access token itself, even though Access also protects the hostname at
Cloudflare's edge.

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
