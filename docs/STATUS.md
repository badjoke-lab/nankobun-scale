# NANKOBUN SCALE — Development Status

Last updated: 2026-08-19

## Current position

Current gate: **Gate 6 — Results, export, and history**

Current branch: `gate-6-results-export-history`

Current work:
- confirmed measurement snapshot storage
- explicit history save
- immutable saved measurement records
- history list/detail/delete
- presentation-only result adjustments
- PNG / JPEG export
- native share where supported
- remeasure-from-history remains to be completed

## Completed

- Gate 0 — Specification freeze
- Gate 1 — UI specification
- Gate 2 — App foundation
- Gate 3 — Photographed-unit creation
- Gate 4 — Length measurement
- Gate 5 — Area measurement

Gate 2 merged through PR #1 after CI build passed on the exact PR head.
Gate 3 merged through PR #2 after CI build passed on the exact PR head and after a public-spec audit removed internal gate wording from the UI and restored explicit **「これで測る」** behavior.
Gate 4 merged through PR #3 after CI build passed on the exact PR head. Before merge, the public-spec audit restored the explicit length/area choice after target capture and added draggable endpoints plus pre-confirmation unit movement.
Gate 5 merged through PR #4 after repeated spec audits fixed target-image aspect handling, length display/calculation alignment, rotated zero-spacing area tiling, effective alpha-area accounting, and multiple clipped boundary contributions.

## In progress

- Gate 6 — Results, export, and history

Gate 6 must preserve these already-established behaviors:
- saving a confirmed measurement is explicit, never automatic
- saved measurements keep their own immutable unit/target/geometry snapshot
- presentation-only changes must not alter the measured value or measurement geometry
- PNG/JPEG output must match the confirmed measurement and may only apply presentation changes
- deleting or editing a saved unit must not rewrite historical measurements
- history remeasurement must create a new measurement instead of mutating the saved result

## Next

Finish remeasure-from-history, run the Gate 6 public-spec/diff audit, pass CI on the exact PR head, then merge and proceed to Gate 7 — language, accessibility, and failure handling.

## Reference rule

Every implementation step must begin by checking:

- `docs/PRODUCT_SPEC.md`
- `docs/ROADMAP.md`
- this file

When a gate is completed or the current implementation position changes, update this file in the same PR or immediately following maintenance commit.

Do not use this status file to publish internal business, monetization, infrastructure-cost, competitive, or unpublished planning.
