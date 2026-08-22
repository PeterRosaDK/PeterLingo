# Deployment

PeterLingo is a static PWA. `npm run build` produces `dist/`, suitable for a root-hosted Cloudflare Pages project at `peterlingo.petergpt.dk`.

Milestone 0 does not create or mutate Cloudflare projects, DNS, tunnels, Mac Mini services, ports, or launchd state. A future deployment should upload the exact tested revision and then verify the manifest, service worker, offline route fallback, and HTTPS secure context required by Web Bluetooth.
