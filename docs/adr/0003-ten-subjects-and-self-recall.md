# ADR 0003: Extend the existing learning engine to ten subjects

- Status: Accepted
- Date: 2026-09-07

## Context

The repository already schedules stable LearningUnits and logs generated parameters in immutable
attempts. Its subject metadata, catalog, route entry points and domain-specific UIs are separate,
small typed registries. Replacing these with another module/scheduler abstraction is unnecessary.

Three real inconsistencies matter when adding subjects: IndexedDB load bypasses the JSON migration
boundary; the session selector resurrects every scheduled ID even when its deck is disabled;
local and replayed mastery duplicate policy and never produce the fluent stage. Normal flashcard
reveal also differs pedagogically from requesting a revealing hint.

## Decision

- Extend existing `DisciplineId`, `subjects`, route and `learningCatalog` registrations. Existing
  disciplines retain their IDs, routes, interactions and generators. No parallel scheduler.
- Snapshot schema 2 adds device-local `deckSettings` and default focus weights. `parseSnapshot`
  migrates v1 additively, on IndexedDB load/mutation and JSON import. IndexedDB object-store
  version stays 1: no structural store migration is required. History is not deleted or rewritten.
- The existing session selector accepts an eligibility predicate, applied **after** scheduled-item
  expansion and also during saved-plan resolution. Disabled decks retain their schedule/history.
  Generic LearningUnit prerequisites require 0.68 strength. The new vowel spectrogram tier uses it.
- Normal flashcard flip is logged as `normalCardReveal`; `answerRevealed` remains reserved for
  assistance which preempts recall. Explicit self-ratings map directly through `gradeSelfRecall`:
  Kunne ikke/again, Næsten/hard, Kunne/good, Let/easy. Prior hints cap ratings, and a revealing
  hint forces again. Self-report duration is logged but does not determine rating or appear in
  reaction-time summaries. Good/Easy count as correct; Hard means incomplete recall.
- Both live recording and cloud replay call `masteryForAttempt`. Easy reaches fluent; a correct,
  unhinted and unrevealed answer reaches unassisted. Existing histories adopt this same policy on
  replay; there is no new-subject special case. FSRS retains its existing deterministic wrapper.
- HSK directions and static records are independent items. Generated conversions have four
  direction skills, not per-number items. Generated parameters preserve the actual problem.
- The daily link includes the selected unit ID so the new subject entry points train that exact
  planned item. Pre-existing deep exercise routing remains as before and is a roadmap item.

## Consequences

No runtime network dependency, LLM, second scheduler, separate dashboard store, or destructive
migration is introduced. Settings remain device-local, as already documented by the sync contract.
Deck-specific counts and direction/topic diagnostics derive from the existing attempts/mastery.
The v0 content limitation (small HSK seed and synthetic phonetics fixtures) is explicit in UI and
module READMEs. Full curricula and physical listening calibration remain future work.
