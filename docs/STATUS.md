# NANKOBUN SCALE — Development Status

Last updated: 2026-08-19

## Current position

Current gate: **Gate 5 — Area measurement**

Current branch: `main`

Current work:
- freehand and polygon target areas
- photographed-unit transform and tiling origin
- zero-spacing tiling
- boundary clipping
- multiple fractional boundary contributions
- live recalculation
- measurement confirmation lock

## Completed

- Gate 0 — Specification freeze
- Gate 1 — UI specification
- Gate 2 — App foundation
- Gate 3 — Photographed-unit creation
- Gate 4 — Length measurement

Gate 2 merged through PR #1 after CI build passed on the exact PR head.
Gate 3 merged through PR #2 after CI build passed on the exact PR head and after a public-spec audit removed internal gate wording from the UI and restored explicit **「これで測る」** behavior.
Gate 4 merged through PR #3 after CI build passed on the exact PR head. Before merge, the public-spec audit restored the explicit length/area choice after target capture and added draggable endpoints plus pre-confirmation unit movement.

## In progress

- Gate 5 — Area measurement

Gate 5 must preserve these already-established behaviors:
- the user explicitly defines the target area
- the photographed unit may be moved, uniformly scaled, and rotated before confirmation
- the first positioned unit defines the tiling origin
- measurement spacing is zero
- portions outside the selected area are clipped
- multiple boundary fragments contribute by their in-region effective-area ratio
- **「この測定で決定」** locks measurement-changing conditions

## Next

After Gate 5 passes its exit conditions, proceed to Gate 6 — results, export, and history.

## Reference rule

Every implementation step must begin by checking:

- `docs/PRODUCT_SPEC.md`
- `docs/ROADMAP.md`
- this file

When a gate is completed or the current implementation position changes, update this file in the same PR or immediately following maintenance commit.

Do not use this status file to publish internal business, monetization, infrastructure-cost, competitive, or unpublished planning.
