# NANKOBUN SCALE — Development Status

Last updated: 2026-08-19

## Current position

Current gate: **Gate 6 — Results, export, and history**

Current branch: `main`

Current work:
- confirmed-result screen
- presentation-only adjustments
- **「測り直す」** flow
- PNG / JPEG export
- explicit history save
- immutable historical result display

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
Gate 5 merged through PR #4 after exact-head CI passed. Before merge, the implementation was corrected to support explicit **「撮影する」 / 「写真から選ぶ」** on both image-source sides, target-image aspect-correct length geometry, zero-spacing rotated area tiling, clipping to the selected region, and effective-alpha boundary contribution calculation.

## In progress

- Gate 6 — Results, export, and history

Gate 6 must preserve these already-established behaviors:
- **「この測定で決定」** locks measurement-changing conditions
- presentation-only adjustments must never change the numeric result
- **「測り直す」** creates a new calculation path rather than rewriting the confirmed result
- history save is explicit, not automatic
- historical confirmed results are immutable
- exported visualization must match the confirmed measurement

## Next

After Gate 6 passes its exit conditions, proceed to Gate 7 — language, accessibility, and failure handling.

## Reference rule

Every implementation step must begin by checking:

- `docs/PRODUCT_SPEC.md`
- `docs/ROADMAP.md`
- this file

When a gate is completed or the current implementation position changes, update this file in the same PR or immediately following maintenance commit.

Do not use this status file to publish internal business, monetization, infrastructure-cost, competitive, or unpublished planning.
