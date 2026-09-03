# Changelog

All notable changes follow Keep a Changelog style. PeterLingo uses semantic versioning.

## Unreleased

### Added

- Added phase three, beginner CMLL: a five-part two-look lesson, white-corner orientation, live
  headlights and corner-placement recognition, physically valid practice setups, automatic
  GoCube completion, and an explicitly self-reported fallback.
- Limited the initial CMLL repertoire to two algorithms—Sune and T-perm—with readable chunks and
  an explicit ladder that keeps direct 42-case CMLL out of the beginner course.
- Added the complete fixed-color Second Block teaching slice: five short explanations, a
  red-yellow right-block target, all five target pieces, DR and square subgoals, safe `R`/`U`
  exercise setups, live GoCube completion, and an explicit manual fallback.
- Added a deliberately small beginner repertoire of `R U R'` and `R U' R'`, with wide `r`
  insertions and M-based shortcuts shown as later algorithm-ladder steps rather than immediate
  memorization.
- Added the first complete Roux teaching slice: a short standard-grip check, a four-step First Block
  lesson, an accurate 1×2×3 target visual, the five orange-yellow target pieces, front-square and
  back-pair subgoals, live GoCube progress, automatic completion, and a labelled manual fallback.
- Connected the existing `roux:first-block-intro` and `roux:cube-orientation` daily units to the new
  executable lesson and added a separate `roux:first-block-live` practice unit.
- Added a copyable GoCube calibration report containing every raw R/R′/L/L′/M/M′ event and its
  inter-event timing, while keeping hardware data local until the user explicitly shares it.

### Changed

- Deployed the fixed-color, beginner-repertoire Second Block course as exact revision `8bc3d45`
  at `https://49be95db.peterlingo.pages.dev`.
- Standardized the Roux learning track on real face notation (`U/R/F/D/L/B`, prime, and `2`) while
  retaining color-based one- or two-turn instructions only in the separately labelled emergency
  recovery solver.
- Fixed beginner block colors to orange-left First Block and red-right Second Block over the yellow
  bottom in the white-up, green-front reference grip; color-neutral solving remains a later skill.
- Replaced the abstract M/M′ calibration wording with the visible rule “green middle column down”
  and “green middle column up”; beginners may use whichever finger makes a clean quarter turn.
- Deployed the first complete First Block teaching slice as exact revision `0d2c337` at
  `https://c2d805e4.peterlingo.pages.dev`.
- Removed the dead-end daily-session behavior where the First Block and orientation units could be
  selected but had no matching exercise capable of completing them.
- Made the default IndexedDB repository lazy so injected in-memory repositories can exercise the
  complete learning flow without touching browser persistence.
- Made the connected GoCube authoritative during recovery: correctly registered physical turns now
  advance the guide automatically, half-turns wait for both quarter-turn packets, and an unexpected
  turn triggers recalculation from the next synchronized hardware state. Manual step buttons appear
  only while the cube is disconnected.
- Added one silent startup attempt to reconnect an already browser-approved GoCube. It never opens
  the device chooser; a sleeping cube or unsupported browser falls back to the existing manual
  connection flow.
- Replaced the rotated white-front test grip with the conventional white/GO-up, green-front frame.
  It gives one stable mapping—green F, blue B, red R, orange L, white U, yellow D—shared by standard
  notation, cubing.js, and GoCubens raw outer moves.
- Expanded `U/R/F/D/L/B/M` beside the notation guide and GoCube calibration—for example,
  `B = Back (bag)`—while explicitly labelling hardware events and recovery codes as technical raw
  values instead of misleadingly translating them as hand instructions.
- Revision `88a7ab4` briefly exposed the incorrect color-based R/L calibration wording and was
  superseded after physical correction of the coordinate-system distinction.
- Deployed the corrected hand-relative notation and raw-code separation as exact revision
  `084143a` at `https://16c63cec.peterlingo.pages.dev`.
- Revision `40dbf07` briefly treated `R → B` as a calibration mapping. It was superseded after
  choosing the conventional fixed orientation: outer letters must now match, and a mismatch gives
  an explicit grip correction. Only M/M′ are allowed to produce multi-event hardware evidence.
- Deployed the fixed white-up, green-front reference orientation as exact revision `6e2c10a` at
  `https://983eb27e.peterlingo.pages.dev`.
- Deployed live-confirmed recovery and quiet remembered-device reconnection as exact revision
  `3778a1c` at `https://49f9f481.peterlingo.pages.dev`.
- Promoted the verified live GoCube state to the normal solve flow. A connected, synchronized cube
  now opens **Løs den aflæste cube** and calculates its recovery route automatically; manual colour
  entry and synchronization checking remain clearly labelled fallbacks.
- Deployed direct live GoCube solving as exact revision `4d15634` at
  `https://eb8166d1.peterlingo.pages.dev`.
- Clarified recovery turns: the target centre faces the learner, the neighbouring top colour is
  irrelevant, turn direction is read from that face, and either direction works for a half-turn.
- Deployed the clarified physical orientation guidance as exact revision `18f6e8e` at
  `https://f1d14849.peterlingo.pages.dev`.
- Added a device-local saved manual cube state and a **Gem og lav løsning** action. Manual input is
  now checked for valid pieces, orientations, and permutation parity before solving.
- Added a verified cubing.js two-phase recovery guide that presents one colour-based turn at a
  time, tracks progress, and keeps the technical algorithm optional. It is explicitly labelled as
  a recovery route rather than Roux instruction.
- Deployed the validated manual recovery solver as exact revision `67f1fe6` at
  `https://df1b462b.peterlingo.pages.dev`.
- Removed the internal `U/R/F/D/L/B` labels from manual cube entry. The learner now works only with
  named center colors and plain-language positions; the machine code is hidden in an optional
  technical disclosure.
- Deployed the color-first manual cube entry as exact revision `6fcd15b` at
  `https://01ef16d5.peterlingo.pages.dev`.
- Added remembered-device detection through Web Bluetooth `getDevices()`. Previously approved
  GoCubes now get a direct reconnect action without a new chooser, while separate status text makes
  clear that remembered permission does not prove the physical cube is awake or reachable.
- Split Bluetooth feedback into chooser, advertisement, GATT connection, permission, and failure
  states, with targeted guidance for a sleeping cube, a cancelled chooser, blocked permission, or a
  cube already occupied by another app or browser tab.
- Deployed remembered GoCube reconnection as exact revision `9f248ab` at
  `https://69bfc8c8.peterlingo.pages.dev`.
- Kept **Læs cuben igen** visible beside the physical facelet net even when Bluetooth is
  disconnected, with a clear disabled-state explanation instead of making the action disappear.
- Deployed that GoCube reread correction as exact revision `9ea8842` at
  `https://9f4d76a9.peterlingo.pages.dev`.
- Added a visual Danish cube-notation guide for `R`, `R'`, `R2`, all six outer faces, `M`, and
  short algorithms, including an explicit explanation that prime is not the number one.
- Added a manual six-face state editor as a diagnostic fallback. It starts from GoCubens reported
  facelets, locks the physical centres, checks the six colour counts, reports field-by-field
  differences, and produces a copyable 54-character state without claiming cube legality.
- Deployed the notation guide and manual GoCube comparison as exact revision `3a5f9c0` at
  `https://7271ae56.peterlingo.pages.dev`; the Access-protected custom domain points at the same
  production deployment.
- Deployed the physical GoCube calibration flow as exact revision `03ac51a` at
  `https://3bcfbf4f.peterlingo.pages.dev`; the Access-protected custom domain points at the same
  production deployment.
- Resumed physical GoCube validation after a successful desktop connection; diagnostics now
  separates re-reading physical state, clearing only the local move log, and explicitly confirmed
  solved-state calibration. The physical facelet net no longer pretends a solved-start 3D history
  is the authoritative state.
- Replaced user-facing mock-cube controls with a physical GoCube reference grip. The initial
  white-front test frame was later superseded by the conventional white-up, green-front standard.
  Raw move timing supports an evidence-based `M`/`M'` mapping; the mock adapter remains available
  only as an automated test seam.
- Added a guided six-step GoCube capture flow for `R`, `R'`, `L`, `L'`, `M`, and `M'` that records
  the exact raw move names and millisecond gaps before any slice-move normalization is introduced.
- Kept an approved GoCube connection alive while navigating between PeterLingo routes, avoiding a
  new browser chooser merely because the diagnostics page was temporarily left.
- Documented the actual state stream in the diagnostics: full 54-facelet hardware snapshots at
  connection/re-read, with move-by-move state advancement between snapshots.
- Split the planned Roux engine into “Solve for me,” using the best verified route found, and
  “Teach me Roux,” which starts with a minimal algorithm repertoire and unlocks shortcuts only
  after demonstrated fluency.
- Made the home greeting follow the device's local time: Godnat before 07, Godmorgen until 11,
  Goddag until 18, and Godaften for the rest of the evening.
- Started Milestone 6 daily intelligence with response-time-calibrated duration estimates, a clear
  reason for every selected learning unit, resumable daily progress, and a non-punitive completion
  summary.
- Corrected the home-page storage note to describe offline IndexedDB plus the protected shared
  cloud history instead of the obsolete local-only Milestone 0 model.
- Added a service-worker update guard that reloads an already installed PWA when a new version
  takes control, plus a cache-proof `/api/login` recovery route for stale app shells.
- Locked the active Doomsday and BCS/MBCS step during an exercise, reset answer selection between
  questions, highlighted both the chosen and correct answers, and explained whether the adaptive
  recommendation is due review, the next new step, or the weakest known step.
- Added an original three-tone correct-answer cue, animated visual confirmation, and a per-device
  sound toggle; Pi recall now focuses and selects its numeric field automatically.
- Made the `Cloudlogin kræves` status itself open the login route and added the server-confirmed
  cloud attempt count to Settings after successful synchronization.
- Added offline-first multi-device progress sync: immutable attempts merge through an
  Access-protected Pages Function and D1, while deterministic FSRS/mastery replay prevents one
  device from overwriting another.
- Provisioned the production D1 database in Cloudflare's European region, activated
  `peterlingo.petergpt.dk`, restricted it to Peter's approved Access identity, and deployed exact
  revision `455b555`; iPad-to-Mac Mini convergence is confirmed, while the remaining physical
  hardening matrix is still open.
- Added a discreet production logout link with an explicit warning that Cloudflare Access cannot
  log an end user out of only one protected application; logout now returns to PeterLingo instead
  of leaving the user on Cloudflare's technical response page.
- Added a visible login action when cloud authentication expires, a dedicated `/login` return
  route, and PWA exclusions that prevent the cached app shell from swallowing Access navigation.
- Added visible sync/offline/auth states, automatic retry, explicit manual sync, request limits,
  same-origin mutation checks, and tests for duplicate delivery, two-device union, deterministic
  replay, malformed cloud data, and attempts created during an active request.
- Updated Vite to 7.3.6 and added pinned Cloudflare tooling; the dependency audit now reports no
  known vulnerabilities.
- Documented the verified `peterlingo.pages.dev` Direct Upload and made authenticated D1 sync a
  release gate before custom-domain, multi-device use; IndexedDB remains the offline cache.
- Expanded Hørelære with a four-step introduction and adaptive daily recognition of little/major
  thirds, perfect fourths, and perfect fifths in ascending, descending, and harmonic form.
- Revoiced Tone.js playback with a gentler attack, lower level, low-pass warmth, and restrained
  room sound; local instrument samples remain an optional later quality upgrade.
- Rebuilt Pi around a gentle 30-decimal starting boundary, voluntary prefix diagnosis, five-digit
  unlocks, ten-digit landmarks, bridges, gaps, neighbouring digits, and safe random access.
- Pi recall now acknowledges and stores partial accuracy such as four correct digits out of five,
  while keeping the whole block scheduled until it is secure.
- Expanded the verified local Pi source from 100 to 500 decimals while retaining 100 as a milestone.
- Added three daily effort stars per subject; attempts with mistakes or hints count equally, and a
  notation-based Roux hand drill makes its stars achievable without physical hardware.
- Expanded Richard Osterlind's BCS into ten adaptive BCS/MBCS skills, including independent
  card-to-position and position-to-card recall, cyclic cuts, and removed-card handling.
- Corrected the teaching sequence to Osterlind's own two-stage value calculation and removed an
  unrelated performer reference from the roadmap.
- Expanded the Doomsday and BCS introductions with plain-language, worked walkthroughs.
- Replaced the cube viewer's isolated fullscreen control with a Roux-stage fullscreen mode that keeps move controls visible.
- Hid the complete Pi reference by default and added an unassisted prefix run that stops at the first wrong digit.
- Renamed the user-facing subject Musikøre to Hørelære while retaining stable internal learning IDs.
- Clarified that Beacio is required on iPhone/iPad Safari, not on Mac Chrome/Edge.
- Documented the planned FSRS evaluation, non-punitive motivation layer, subject-module registry, and five candidate expansion subjects.
- Marked physical GoCube/Roux work as paused pending manufacturer support and promoted Doomsday to the next active milestone.
- Expanded Doomsday into six adaptive learning steps with 1975–2000 date practice, added the complete physical BCS stack overview, and improved several literal Danish UI translations.

## [0.1.0] - 2026-08-23

### Added

- React/TypeScript/Vite installable PWA with responsive light/dark/reduced-motion design.
- Shared learning-unit, progressive-hint, timing, grading, FSRS, mastery, and daily-session foundations.
- Versioned IndexedDB repository plus JSON export, import, and confirmed reset.
- Five subject home experience and direct practice routes.
- Gregorian Doomsday implementation and guided generated date drill.
- Algorithmic 52-card BCS cycle and CC0 OpenDecks visual assets.
- Validated 100-digit Pi source, arbitrary-position continuation, gaps, and diagnostic scaffold.
- Interactive cubing.js viewer, real/mock smart-cube adapters, Beacio-first bootstrap, diagnostics, move logs, and fixed-orientation First Block detector.
- Tone.js interval playback, VexFlow fragment, touch piano, guitar, bass, and fretless cello.
- Domain, component, persistence, and Playwright smoke-test foundations plus GitHub Actions CI.

### Not verified

- Physical GoCube behavior on Peter's hardware and devices.
