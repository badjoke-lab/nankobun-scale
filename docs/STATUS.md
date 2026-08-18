# NANKOBUN SCALE — Development Status

Last updated: 2026-08-19

## Current position

Current gate: **Gate 3 — Photographed-unit creation**

Current branch: `main`

Current work:
- photograph what to measure with
- manual usable-region selection
- confirmation of selected region
- optional naming
- explicit use-now / save-for-later branch
- saved-unit reuse and editing

## Completed

- Gate 0 — Specification freeze
- Gate 1 — UI specification
- Gate 2 — App foundation

Gate 2 merged through PR #1 after CI build passed on the exact PR head.

## In progress

- Gate 3 — Photographed-unit creation

Gate 3 must preserve these already-established behaviors:
- the user manually chooses the usable photographed region
- automatic object naming is not required
- naming is optional
- saving does not force immediate measurement
- saved units are reused through an explicit **「これで測る」** action

## Next

After Gate 3 passes its exit conditions, proceed to Gate 4 — length measurement.

## Reference rule

Every implementation step must begin by checking:

- `docs/PRODUCT_SPEC.md`
- `docs/ROADMAP.md`
- this file

When a gate is completed or the current implementation position changes, update this file in the same PR or immediately following maintenance commit.

Do not use this status file to publish internal business, monetization, infrastructure-cost, competitive, or unpublished planning.
