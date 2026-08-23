# PeterLingo roadmap

## Milestone 0 — Foundation (0.1.0)

Shared architecture and five functional thin slices: PWA shell, IndexedDB/JSON portability, FSRS boundary, adaptive session seed, Doomsday lesson, BCS drill with full local deck, Pi windows/diagnostic scaffold, cubing.js + real/mock smart-cube diagnostics, and Hørelære audio/touch instruments.

Physical GoCube validation is deliberately still open.

## Milestone 1 — Hardware & Roux

Status: paused pending the manufacturer's response to the deeply discharged GoCube battery. Do not bypass the charger's battery-safety protection. Roux remains a permanent PeterLingo subject; if this GoCube cannot be restored, physical work resumes with a replacement cube. Until then, retain the existing mock diagnostics and let the other subjects progress.

- Run and document the physical matrix on iPhone Safari + Beacio, iPad Safari + Beacio, and desktop Chrome/Edge.
- Verify pairing, initial facelets, move direction, battery, disconnect/reconnect, background behavior, and visual/logical synchronization.
- Add orientation-independent First Block and Second Block detection.
- Build guided First Square/First Block/Second Block exercises and stage timing.
- Inspect GPL-compatible Roux solver code only if it improves concrete pedagogy; isolate any reused code and record exact provenance.

## Milestone 2 — Doomsday curriculum

Status: implemented and locally verified on 2026-08-23 while Milestone 1 is externally blocked.

- Complete weekday numbering, century anchors, year arithmetic, month anchors, leap years, and arbitrary-date progression.
- Give generated date practice an initial 1975–2000 focus, matching the birth dates people are most likely to ask Peter about, while keeping the algorithm Gregorian and general.
- Add generated weak-step drills and configurable fluency thresholds.
- Keep modern Gregorian as the explicit default.

## Milestone 3 — BCS to MBCS

Status: implemented and locally verified on 2026-08-23. The subject follows Richard Osterlind's
Breakthrough Card System and its memorized form; unrelated performers and routines are outside
this curriculum.

- Separate suit values, rank reduction, suit relationship, full next/previous card, and multi-card-forward units.
- Introduce independent `card-to-position:*` and `position-to-card:*` units.
- Add cuts, cyclic offsets, target location, and removed top cards while preserving Osterlind's
  exact 52-card order and the distinction between calculated BCS recall and direct MBCS recall.

## Milestone 4 — Pi 100

Status: next active milestone.

- Turn the short scaffold into a scored adaptive diagnostic.
- Teach five-digit chunks, ten-digit landmarks, cross-boundary bridges, previous/next, gaps, and random-access prompts.
- Visualize robust territory and weak transitions from actual attempts.

## Milestone 5 — Hørelære

- Intervals ascending, descending, harmonic, recognition, and construction across generated roots/timbres.
- Scale degrees, triads, seventh chords, melodic memory, notation, and instrument-specific geography.
- Bass-clef and later tenor-clef cello work; grand-staff piano.
- Consider MIDI through a separate adapter. Microphone input remains out of scope until explicitly designed.

## Milestone 6 — Daily intelligence

- Calibrate session duration from observed response times.
- Improve mixed-session sequencing, skill-specific mastery, streak calculation, confusion matrices, and weak-area explanations.
- Calibrate FSRS retention and grading from sufficient longitudinal outcomes; compare it with half-life regression only when there is enough local data for a meaningful evaluation.
- Add an optional, non-punitive motivation layer with completed-session feedback, mastery milestones, and streak grace. Hints and teaching mode must never be punished.
- Add session continuation/completion across routes.

## Milestone 7 — Advanced subjects

- Julian calendar and local calendar-reform history
- full CMLL after beginner/two-look proficiency
- stronger Roux optimal hints
- harmonic dictation and chorale-harmony refreshers
- optional MIDI input
- carefully designed cloud sync

## Milestone 8 — Subject expansion and module registry

Before scaling from five to ten subjects, make subject registration explicit without forcing very different exercises into one generic interface:

- Introduce a typed subject-module registry for identity, title, route, visual metadata, learning-unit catalogue, and exercise entry points.
- Replace hard-coded subject routing and focus-weight defaults while retaining stable learning-unit IDs and the shared FSRS, attempt, mastery, and session contracts.
- Add a versioned persistence migration and backward-compatibility tests for existing IndexedDB data and JSON exports.
- Keep interaction surfaces subject-specific: flashcards, maps, equations, chessboards, and code questions can share the learning engine without sharing one exercise UI.
- Prove the extension boundary with one new subject end to end before adding the remaining four.

Candidate subject tracks:

- Chinese flashcards: character, meaning, pronunciation, and recognition/production as distinct learning units.
- Geography tests: countries, capitals, flags, regions, and map placement in both directions.
- Mathematics problems: concept-based generated exercises with step diagnostics rather than one card per set of numbers.
- Chess openings: position-to-move and move-to-plan units with legal-move validation and a board-specific interface.
- Python programming questions: concepts, output prediction, code reading, and debugging; arbitrary code execution remains out of scope until separately sandboxed and designed.
