# ADR 0001: Schedule learning units, generate exercises

- Status: Accepted
- Date: 2026-08-23

## Context

PeterLingo teaches five domains with very different interactions. Scheduling every generated date, pitch, or cube scramble would create meaningless cards and couple subject code to FSRS.

## Decision

The shared engine schedules stable `LearningUnit` identities. A module generates a fresh `Exercise` from a unit when a session begins. Attempts retain the unit ID, generated parameters, timing, hint use, reveal state, and result.

FSRS is isolated behind `Scheduler`; modules never import `ts-fsrs`. Teaching stage and mastery remain PeterLingo concepts so a new item may use help without receiving the same penalty as a mature recall item.

## Consequences

- A weak descending minor sixth can recur with new roots and timbres.
- Doomsday can review a century anchor with new dates.
- Pi chunks may still be fixed units where fixed content is meaningful.
- Future scheduler or sync changes do not alter module logic.
