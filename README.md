# PeterLingo

PeterLingo is Peter's polished, local-first daily learning PWA. Five subjects share one session engine, progressive hints, attempt model, FSRS scheduler boundary, persistence layer, and visual language:

- Doomsday weekday calculation
- Roux method and smart-cube plumbing
- Richard Osterlind's BCS progressing toward memorized BCS (MBCS)
- pi in five-digit steps from Peter's first 30, with 500 verified decimals currently available
- Hørelære with a four-step interval introduction, adaptive three-question daily test, and
  instrument geography

Milestone 0 is version **0.1.0**. It is a functional foundation, not a claim that every curriculum is complete.

Three daily effort stars per subject provide a deliberately small motivation loop. A completed
attempt counts even when it is wrong or uses hints; the stars are not a mastery score.

## Screenshots

Screenshots will be added after the first device review. The live development build already includes responsive phone and desktop layouts, light/dark themes, and reduced-motion support.

## Requirements

- Node.js 20.19 or newer (Node 22 is used in CI)
- npm
- For real GoCube: HTTPS or localhost and either desktop Chrome/Edge with Web Bluetooth, or iPhone/iPad Safari with the Beacio app and Safari extension enabled

## Install and run

```sh
npm ci
npm run dev
```

Vite prints the local development URL, normally `http://localhost:5173`. Plain Vite development
keeps data local. Pages Function development additionally needs a local D1 binding and the
variables listed in `.dev.vars.example`.

## Quality commands

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run check` runs formatting, lint, types, unit tests, and the production build. Browser tests are separate because Playwright needs a browser binary.

## PWA and offline behavior

`vite-plugin-pwa` precaches the application shell and local assets. After one successful production visit, Doomsday, BCS/MBCS, Pi, virtual Hørelære instruments, and non-hardware Roux practice are designed to work offline. Bluetooth pairing still depends on browser/platform support and a secure context.

The production build assumes it is served at `/`, suitable for `https://peterlingo.petergpt.dk`. Milestone 0 does not create a Cloudflare project or change DNS.

## GoCube and iOS

PeterLingo imports `@beacio/core/auto` before the React application or any Bluetooth capability check. The real adapter uses the generic API from `smartcube-web-bluetooth`, pinned to a reviewed commit supporting GoCube/Rubik's Connected.

Beacio is only needed for Safari on iPhone/iPad. On Mac, do not install Beacio; open PeterLingo in a current Chrome or Edge browser, which supplies Web Bluetooth directly. Desktop Safari and Firefox are not supported for this path.

On iPhone/iPad:

1. Install Beacio.
2. Enable its Safari extension under **Indstillinger → Apps → Safari → Udvidelser**.
3. Allow it for the PeterLingo site and reload the page.
4. Open **Roux → GoCube-diagnostik**.
5. Tap **Fysisk GoCube**, then tap **Forbind GoCube**. The device chooser is intentionally opened only by this direct tap.

See [GOCUBE_TESTING.md](GOCUBE_TESTING.md) for the complete manual verification. The physical path is implemented but not yet hardware-verified.

## Learning data

Substantive data lives first in IndexedDB, behind `LearningRepository`; the UI never accesses the
database directly. Settings, FSRS state, mastery, attempts, response times, hints, sessions,
diagnostics, and hardware preferences can be exported/imported as versioned JSON from
**Indstillinger**.

The cloud-sync implementation sends immutable attempts through an authenticated Pages Function
to D1. Each sync takes the union of server and device UUIDs, then deterministically rebuilds FSRS
and mastery from the merged chronology. A request reloads IndexedDB after its network round trip,
so an attempt made while syncing cannot be overwritten. Offline work remains local and retries at
the next app start, explicit sync, or browser `online` event.

Only learning attempts and their derived progression synchronize in this first version. Settings,
session metadata, diagnostics, and hardware preferences remain device-local but are included in
JSON export. Clearing site data before a successful cloud sync can therefore still remove local
changes. IndexedDB also remains separate for each origin; migrate pre-cloud progress by exporting
JSON on the old origin and importing it on the protected production origin.

There is no analytics, tracking, microphone access, or general PeterGPT account database.

## Architecture and roadmap

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [ROADMAP.md](ROADMAP.md)
- [Shared learning-item ADR](docs/adr/0001-shared-learning-items.md)
- [Local-first persistence ADR](docs/adr/0002-local-first-persistence.md)

## License

PeterLingo is licensed under GPL-3.0. Vendored card art and dependency notices are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
