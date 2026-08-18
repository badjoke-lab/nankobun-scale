# NANKOBUN SCALE — Development Status

Last updated: 2026-08-19

## Current position

Current gate: **Gate 2 — App foundation**

Current branch: `gate-2-app-foundation`

Current work:
- React + TypeScript + Vite shell
- PWA foundation
- Japanese / English switching foundation
- local persistence foundation
- camera acquisition foundation
- public specification / roadmap / status documents

## Completed

- Gate 0 — Specification freeze
- Gate 1 — UI specification

## In progress

- Gate 2 — App foundation

## Next

After Gate 2 passes its exit conditions, proceed to Gate 3 — photographed-unit creation.

Gate 3 must preserve these already-established behaviors:
- the user manually chooses the usable photographed region
- automatic object naming is not required
- naming is optional
- saving does not force immediate measurement
- saved units are reused through an explicit **「これで測る」** action

## Reference rule

Every implementation step must begin by checking:

- `docs/PRODUCT_SPEC.md`
- `docs/ROADMAP.md`
- this file

When a gate is completed or the current implementation position changes, update this file in the same PR or immediately following maintenance commit.

Do not use this status file to publish internal business, monetization, infrastructure-cost, competitive, or unpublished planning.
