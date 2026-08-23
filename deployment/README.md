# Deployment

PeterLingo is a static PWA. `npm run build` produces `dist/`, suitable for a root-hosted Cloudflare Pages project at `peterlingo.petergpt.dk`.

## Current state

The Direct Upload project `peterlingo` was created on 2026-08-23 and revision `f770430`
was deployed to `https://peterlingo.pages.dev`. The root route, Hørelære deep route,
manifest, and service worker returned HTTP 200.

The custom domain is deliberately not active yet. Progress is currently stored only in
origin-scoped IndexedDB, so different browsers and devices do not share it. Treat the
`pages.dev` deployment as technical verification, not the canonical home for real
multi-device sessions, until authenticated cloud sync and migration are implemented.

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
