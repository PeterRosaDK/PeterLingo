# PeterLingo architecture

## Product boundary

PeterLingo 0.1 is a static, browser-first PWA. It has no backend, authentication, analytics, tracking, AI API, microphone input, deployment credentials, or Mac Mini service. Generated production files can be hosted at the root of `peterlingo.petergpt.dk`.

## Shared learning units

A `LearningUnit` is the stable object Peter is learning. An `Exercise` is a generated presentation of that unit.

```text
LearningUnit → module exercise generator → GeneratedExercise
      ↓                                  ↓
 FSRS schedule                Attempt + generated parameters
      ↓                                  ↓
 daily selector ← mastery / history / hint use / response speed
```

Examples:

- Doomsday uses six separate units from `doomsday:weekday-numbering` through `doomsday:complete-date`, each with generated examples and its own fluency threshold.
- `music-ear:interval:3:descending` can use different roots.
- The cards module implements Richard Osterlind's exact BCS cycle. Foundation, next/previous,
  multi-forward, and cut arithmetic are separate skills; each MBCS association is also stored in
  both directions as `cards:card-to-position:*` and `cards:position-to-card:*`.
- Pi windows can be fixed learning units because exact digits are the content.

The four PeterLingo stages—teaching, assisted, unassisted, and fluent—are domain concepts outside FSRS.

## Scheduling boundary

`FsrsScheduler` is the only application class that imports `ts-fsrs`. It accepts PeterLingo grades (`again`, `hard`, `good`, `easy`) and serializes dates/state into storage-safe records. Modules do not depend on the third-party API.

`DefaultGradingPolicy` centrally combines correctness, reveal state, number of hints, teaching stage, and configurable fluency threshold. One small hint during teaching is intentionally less punitive than revealed or incorrect recall.

## Sessions and attempts

The daily selector ranks due cards, weak mastery, limited new work, focus weights, and recent sessions. It has a time budget and a cap on new units, but no fixed 20% subject quota.

Every recorded attempt includes the stable unit, generated parameters, correctness, response time, hints used, answer reveal, timestamp, and scheduler grade.

## Persistence and future sync

`LearningRepository` is the domain-facing port. `IndexedDbLearningRepository` is the browser adapter and `InMemoryLearningRepository` supports deterministic tests. The IndexedDB schema is versioned; export/import validates the same snapshot contract.

A future cloud adapter can implement the repository/sync boundary without moving teaching logic into networking code. Conflict semantics and encryption must be designed before that adapter exists.

## Module boundaries

```text
src/app                 routing, providers, shared shell
src/design-system       tokens and reusable presentation
src/learning            FSRS, hints, attempts, sessions, mastery
src/persistence         repository port, IndexedDB, migrations, JSON
src/hardware/smartcube  adapter port, real/mock transports, cube state
src/audio               audio port and Tone.js implementation
src/music               pitch, tunings, interval generation, instruments
src/modules/*           domain rules and subject experiences
src/routes              cross-subject product pages
```

React components consume domain services; teaching algorithms do not depend on React.

## Calendar architecture

The Doomsday implementation uses `CalendarSystem`. Milestone 0 supplies a proleptic Gregorian implementation. Julian dates and local adoption transitions require explicit future calendar policies and must not silently reuse modern Gregorian assumptions.

## Smart-cube architecture

`SmartCubeAdapter` isolates Roux UI from transport. `WebBluetoothSmartCubeAdapter` wraps the generic smart-cube connection and consumes move, facelet, battery, hardware, and disconnect events. `MockSmartCubeAdapter` exercises the identical move/state UI without radio access.

`@beacio/core/auto` runs before the application module graph. `requestDevice()` is called immediately from the diagnostics button handler—never from mount, a timer, or retry loop. Missing BLE leaves all non-hardware learning usable.

The fixed-orientation First Block detector checks the DLF, DBL, DL, FL, and BL cubies in URFDLB facelet order. Color-neutral/orientation-independent recognition belongs to Milestone 1.

## Cube visualization

`CubeViewer` owns a `cubing.js` `TwistyPlayer`. Mock and physical move logs update its algorithm. Raw facelets are retained as logical state and surfaced in diagnostics. Milestone 1 must verify device move direction, initial facelet sync, reconnection, and visual/logical agreement on physical hardware.

## Audio and music

`AudioEngine` hides Tone.js. Audio context start/resume happens from the user's tap. `VirtualPiano` supports simultaneous pointer capture, while guitar and bass share a fretted engine and cello uses a fretless presentation with optional chromatic guide targets. Pitch logic is MIDI/pitch-class based; Danish/German versus international names are display policy.

VexFlow renders short conventional notation fragments. PeterLingo is not a notation editor.

## Privacy, offline, and accessibility

- All card art and application assets are local; no runtime CDN is required.
- No external font request is made.
- Semantic buttons, labels, focus indication, non-color text, sufficient contrast, keyboard navigation, responsive layouts, and reduced-motion rules are part of the design system.
- BLE data is handled locally by the browser/Beacio path. PeterLingo sends no learning or cube data to a server.
