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

The current tested app artifact is revision `cdb3d53`, deployed directly at
`https://7cccc5c9.peterlingo.pages.dev` and promoted to the custom production domain.

## GoCube and iOS

PeterLingo imports `@beacio/core/auto` before the React application or any Bluetooth capability
check. Capability detection uses Beacio's real API detector, so the SDK's installation stub is not
mistaken for an active Safari extension. `@beacio/core` is pinned at **2.1.1**, aligned with the
current extension line; the GoCube protocol remains pinned to reviewed
`smartcube-web-bluetooth` commit `44f1f091c6e980d9cc31e6d2863c4437eca3ab3c`.

All calibration and notation teaching uses one fixed, WCA-compatible reference orientation: white/GO upward and green toward the learner. In that grip, `U` is white, `R` red, `F` green, `D` yellow, `L` orange, and `B` blue. Keep that grip unless the app explicitly introduces a whole-cube rotation.

Beacio is only needed for Safari on iPhone/iPad. On Mac, do not install Beacio; open PeterLingo in a current Chrome or Edge browser, which supplies Web Bluetooth directly. Desktop Safari and Firefox are not supported for this path.

On iPhone/iPad:

1. Install Beacio.
2. Enable its Safari extension under **Indstillinger → Apps → Safari → Udvidelser**.
3. Allow it for the PeterLingo site and reload the page.
4. Open **Roux**.
5. Tap **Tilslut**. PeterLingo calls `requestDevice()` directly from that tap and sends only the
   GoCube/Rubik's Connected name filters `GoCube_…`, `GoCube…`, and `Rubiks…` plus the protocol's
   UART service permission. The chooser remains controlled by Safari/Beacio.

Beacio is a Safari extension and is not injected into PeterLingo when iPadOS launches it as an
installed standalone Home Screen web app. Keep the installed PWA for ordinary learning and offline
practice, but open `https://peterlingo.petergpt.dk/fag/roux` directly in Safari for GoCube. On
iPadOS versions that offer **Open as Web App** while adding a Home Screen icon, leaving that option
off creates a Safari-opening shortcut instead of the standalone PeterLingo window.

On desktop Chrome/Edge, PeterLingo makes a quiet startup attempt to reconnect a remembered cube
without opening the chooser. Entering Roux permits one additional quiet retry. Direct reconnection
is used only when native Web Bluetooth exposes `getDevices()` and returns exactly one compatible
approved cube; zero or multiple matches fall back to the chooser on the next **Tilslut** tap. Beacio
on iPhone/iPad does not persist pairing across a page load, so iOS Safari never enters this
remembered-device path and requires a new tap after reopening the page.

Connection feedback distinguishes a missing/inactive Beacio extension, a missing Bluetooth API,
typed chooser cancellation, no matching device, a granted device that cannot be reached, and a
GATT connection that produces no valid full color state. Native browsers expose some of these
conditions through the same `NotFoundError` or `NetworkError`; where the browser does not reveal
more, PeterLingo says so instead of claiming a single cause. A discreet disclosure on the Roux
workbench shows the active API path, reconnect support, Beacio version, and actual name filters.

See [GOCUBE_TESTING.md](GOCUBE_TESTING.md) for the complete manual verification. Desktop pairing,
ordinary outer-turn tracking, state comparison, and one complete recovery have succeeded
physically. M-move normalization and the remaining iPhone/iPad device matrix are still under
verification.

Choosing **Roux** opens one workbench: the interactive live 3D cube and hardware controls are on the
left, and the four phase choices are on the right. **Kalibrer 3D** adopts the current gyro reading
as the display reference and restores a square-on camera—green directly in front with white/GO
above—without changing any facelets. **Synkronisér farver** requests a fresh full facelet state from
GoCube; it does not turn or reset the physical cube, alter 3D calibration, or mark a mixed state as
solved. The app no longer exposes GoCube's solved-state reset command.
**Ret farver manuelt** opens the existing validated six-face editor in the right side of the same
workbench. A saved correction is kept as an explicit local override and is not silently replaced by
later hardware snapshots; choosing **Synkronisér farver** deliberately returns authority to the
hardware. **Løs hurtigt** replaces the phase list in place with a verified recovery route that
advances from live moves or uses manual step controls for a corrected state. The former
**Opsætning** URL redirects to this workbench. The physical
cube's state and relative orientation also drive the 3D cube on the home-page Roux card. The old
guided capture protocol, timed grip quiz, environment/state diagnostics, and unfolded facelet net
are not part of the learner interface.

The first real Roux teaching slice lives at **Roux → First Block**. The interactive physical cube
remains visible on the left while a fixed 3D target on the right first isolates the three-piece
front square and then the complete orange-yellow 1×2×3 block. It watches all five target cubies live
and advances automatically when a synchronized GoCube is connected. Manual completion remains an
explicitly self-reported offline fallback. This first slice uses only outer turns until M/M′
normalization has been physically confirmed.

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
