# NANKOBUN SCALE — Development Status

Last updated: 2026-08-19

## Current position

Current gate: **Gate 4 — Length measurement**

Current branch: `main`

Current work:
- target photography
- two-point endpoint selection
- photographed-unit move / uniform scale / rotation
- repeated placement with **「並べる」**
- live recalculation
- fractional final-unit clipping
- measurement confirmation lock

## Completed

- Gate 0 — Specification freeze
- Gate 1 — UI specification
- Gate 2 — App foundation
- Gate 3 — Photographed-unit creation

Gate 2 merged through PR #1 after CI build passed on the exact PR head.
Gate 3 merged through PR #2 after CI build passed on the exact PR head and after a public-spec audit removed internal gate wording from the UI and restored explicit **「これで測る」** behavior.

## In progress

- Gate 4 — Length measurement

Gate 4 must preserve these already-established behaviors:
- the user explicitly chooses the two length endpoints
- the photographed unit may be moved, uniformly scaled, and rotated before confirmation
- **「並べる」** repeats identical units along the selected line
- a fractional final unit is clipped at the endpoint and never shrunk
- **「この測定で決定」** locks measurement-changing conditions

## Next

After Gate 4 passes its exit conditions, proceed to Gate 5 — area measurement.

## Reference rule

Every implementation step must begin by checking:

- `docs/PRODUCT_SPEC.md`
- `docs/ROADMAP.md`
- this file

When a gate is completed or the current implementation position changes, update this file in the same PR or immediately following maintenance commit.

Do not use this status file to publish internal business, monetization, infrastructure-cost, competitive, or unpublished planning.
