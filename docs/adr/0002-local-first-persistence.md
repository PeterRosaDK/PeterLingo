# ADR 0002: Local-first, versioned persistence

- Status: Accepted
- Date: 2026-08-23

## Decision

All progress is stored in IndexedDB through the `LearningRepository` interface. The UI and domains do not access IndexedDB directly. JSON backup uses the same validated snapshot shape. Schema migrations run at the repository boundary.

No backend, authentication, analytics, or microphone access exists in Milestone 0.
