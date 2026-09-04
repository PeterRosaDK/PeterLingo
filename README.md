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

The production build is served at `/` on the active, Access-protected custom domain
`https://peterlingo.petergpt.dk`. Cloudflare Pages hosts the PWA and Function, while D1 stores the
shared attempt history. The app shell remains available offline; when the Access session has
expired, the shell shows **Log ind** and sends a network navigation through `/login` before
returning to the app.

## GoCube and iOS

PeterLingo imports `@beacio/core/auto` before the React application or any Bluetooth capability check. The real adapter uses the generic API from `smartcube-web-bluetooth`, pinned to a reviewed commit supporting GoCube/Rubik's Connected.

All calibration and notation teaching uses one fixed, WCA-compatible reference orientation: white/GO upward and green toward the learner. In that grip, `U` is white, `R` red, `F` green, `D` yellow, `L` orange, and `B` blue. Keep that grip unless the app explicitly introduces a whole-cube rotation.

Beacio is only needed for Safari on iPhone/iPad. On Mac, do not install Beacio; open PeterLingo in a current Chrome or Edge browser, which supplies Web Bluetooth directly. Desktop Safari and Firefox are not supported for this path.

On iPhone/iPad:

1. Install Beacio.
2. Enable its Safari extension under **Indstillinger → Apps → Safari → Udvidelser**.
3. Allow it for the PeterLingo site and reload the page.
4. Open **Roux → Opsætning**.
5. Tap **Find og forbind GoCube**. The device chooser is intentionally opened only by this direct tap.

After that first approval, PeterLingo makes a quiet startup attempt to reconnect the remembered
cube without opening the chooser. Entering Roux permits one additional quiet retry, which helps
when the cube has only just been woken. This depends on browser support for `getDevices()` and can
still fail when the cube is asleep, out of range, or already used by another app; Opsætning keeps
both a remembered-device button and the explicit chooser as fallbacks.

See [GOCUBE_TESTING.md](GOCUBE_TESTING.md) for the complete manual verification. Desktop pairing
has succeeded physically; state accuracy, move mapping, and the remaining device matrix are still
under verification.

Choosing **Roux** opens directly on the live 3D cube and the four-phase training path. A connected
cube can be calibrated there only after confirming that it is physically solved and held with
white/GO up and green forward; that action resets the reported solved state and adopts the current
gyro reading as the 3D reference. **Opsætning** remains the secondary route for explicit connection,
synchronization, and quick recovery solving. The physical cube's state and relative orientation
also drive the 3D cube on the home-page Roux card. The old guided capture protocol, timed grip quiz,
and unfolded diagnostic facelet net are not part of the learner interface.

The first real Roux teaching slice lives at **Roux → First Block**. It teaches the fixed
orange-yellow left block as a front square plus a back pair, records the lesson unit, and watches
the five target cubies live when a synchronized GoCube is connected. Manual
completion remains available as an explicitly self-reported offline fallback. This first slice
uses only outer turns until M/M′ normalization has been physically confirmed.

**Roux → Second Block** continues with the fixed red-yellow right block while requiring the orange
First Block to remain intact. The beginner repertoire is deliberately limited to `R`/`U` moves and
the two short insertion tools `R U R'` and `R U' R'`. Each selectable exercise setup preserves First
Block, and synchronized GoCube facelets track the five new pieces, the DR edge, the first square,
and both completed blocks. Wide `r` insertions and M-based shortcuts remain later algorithm-ladder
steps instead of being mixed into the first training round.

**Roux → Begynder-CMLL** is phase three of four. With both fixed blocks complete, it solves only
the four white U-layer corners in two looks: Sune orients all four white stickers upward, then
T-perm places the corners relative to their centers. Live GoCube progress reports intact blocks,
oriented corners, detected headlights, and fully solved corners. The course has exactly these two
algorithms; the full 42-case CMLL set is explicitly a much later optional rung.

**Roux → Last Six Edges** completes the fixed-color beginner course. It splits LSE into edge
orientation, left/right-edge placement relative to the solved corners, and the final four edges.
The initial repertoire is not a list of cases: it reuses two `M`–`U`–undo-`M` patterns, with a
quarter `U` for the arrow and `U2` for an orientation-preserving swap. Live GoCube progress guards
the completed blocks and corner ring, counts all six oriented edges, recognizes both relative
left/right edges, and completes only when all six faces are solved.

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
