# Changelog

All notable changes follow Keep a Changelog style. PeterLingo uses semantic versioning.

## Unreleased

### Changed

- Rebuilt Pi around a gentle 30-decimal starting boundary, voluntary prefix diagnosis, five-digit
  unlocks, ten-digit landmarks, bridges, gaps, neighbouring digits, and safe random access.
- Pi recall now acknowledges and stores partial accuracy such as four correct digits out of five,
  while keeping the whole block scheduled until it is secure.
- Expanded the verified local Pi source from 100 to 500 decimals while retaining 100 as a milestone.
- Added three daily effort stars per subject; attempts with mistakes or hints count equally, and a
  small mock Roux sequence makes its stars achievable without physical hardware.
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
