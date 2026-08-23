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
- Pi starts from a user-declared 30-decimal working boundary. A prefix diagnostic, contiguous
  five-digit chunk mastery, and `piLearningProfile` advance that boundary without opening distant
  random windows. The local verified dataset currently contains 500 decimals; 100 is only a
  milestone. Chunks, bridges, gaps, random access, and before/after recall retain distinct IDs.

The four PeterLingo stages—teaching, assisted, unassisted, and fluent—are domain concepts outside FSRS.

## Scheduling boundary

`FsrsScheduler` is the only application class that imports `ts-fsrs`. It accepts PeterLingo grades (`again`, `hard`, `good`, `easy`) and serializes dates/state into storage-safe records. Modules do not depend on the third-party API.

`DefaultGradingPolicy` centrally combines correctness, reveal state, number of hints, teaching stage, and configurable fluency threshold. One small hint during teaching is intentionally less punitive than revealed or incorrect recall.

## Sessions and attempts

The daily selector ranks due cards, weak mastery, limited new work, focus weights, and recent sessions. It has a time budget and a cap on new units, but no fixed 20% subject quota.

Every recorded attempt includes the stable unit, generated parameters, correctness, response time, hints used, answer reveal, timestamp, and scheduler grade.

Hørelære gemmer hvert af de fire første intervaller separat for melodisk opad, melodisk
nedad og harmonisk præsentation. En dagsrunde fryser tre genererede opgaver ved start — én af
hver præsentation — og vælger det svageste interval i hver gruppe ud fra den hidtil registrerede
styrke.

Daily stars are a derived view over attempts, not additional persistent currency. Each local-day
attempt contributes one effort star to its discipline up to three. Correctness and hints do not
affect the star, so the motivation layer cannot punish teaching-mode work.

## Persistence and future sync

`LearningRepository` is the domain-facing port. `IndexedDbLearningRepository` is the browser adapter and `InMemoryLearningRepository` supports deterministic tests. The IndexedDB schema is versioned; export/import validates the same snapshot contract.

IndexedDB is an offline cache, not an adequate sole source for Peter's planned use across Mac,
PC, iPhone, and iPad. The next persistence phase should add an authenticated Pages Function and
Cloudflare D1 as the durable shared source while keeping exercises usable offline. Immutable
attempts should merge by stable ID and timestamp; scheduled state and mastery should be rebuilt
from the merged attempt history rather than allowing one device's complete snapshot to overwrite
another. Settings and session metadata need explicit version/conflict rules.

Cloudflare Access is the preferred authentication boundary for this single-user app. Its token
must be verified by the server-side Function; a client-supplied email header is not sufficient.
The custom domain should remain gated until authentication, initial local-to-cloud migration,
multi-device convergence, export/recovery, and offline replay have been tested.

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

`AudioEngine` hides Tone.js. Audio context start/resume happens from the user's tap. Intervaler
afspilles enten sekventielt eller samtidigt gennem en langsomt anslået, lavpasfiltreret synth med
diskret rumklang. `VirtualPiano` supports simultaneous pointer capture, while guitar and bass
share a fretted engine and cello uses a fretless presentation with optional chromatic guide
targets. Pitch logic is MIDI/pitch-class based; Danish/German versus international names are
display policy. Real samples can later be added behind the same audio port without changing the
learning model.

VexFlow renders short conventional notation fragments. PeterLingo is not a notation editor.

## Privacy, offline, and accessibility

- All card art and application assets are local; no runtime CDN is required.
- No external font request is made.
- Semantic buttons, labels, focus indication, non-color text, sufficient contrast, keyboard navigation, responsive layouts, and reduced-motion rules are part of the design system.
- BLE data is handled locally by the browser/Beacio path. PeterLingo sends no learning or cube data to a server.
