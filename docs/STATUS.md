# NANKOBUN SCALE — Development Status

Last updated: 2026-08-20

## Current position

Current gate: **Gate 7 — Language, accessibility, and failure handling**

Current branch: `gate-7-language-accessibility-failures`

Current work:
- complete Japanese / English UI coverage
- accessibility and touch-target review
- camera/image acquisition failure recovery
- invalid selection / invalid area recovery
- local save and export failure recovery
- empty states

## Completed

- Gate 0 — Specification freeze
- Gate 1 — UI specification
- Gate 2 — App foundation
- Gate 3 — Photographed-unit creation
- Gate 4 — Length measurement
- Gate 5 — Area measurement
- Gate 6 — Results, export, and history

Gate 2 merged through PR #1 after CI build passed on the exact PR head.
Gate 3 merged through PR #2 after CI build passed on the exact PR head and after a public-spec audit removed internal gate wording from the UI and restored explicit **「これで測る」** behavior.
Gate 4 merged through PR #3 after CI build passed on the exact PR head. Before merge, the public-spec audit restored the explicit length/area choice after target capture and added draggable endpoints plus pre-confirmation unit movement.
Gate 5 merged through PR #4 after repeated spec audits fixed target-image aspect handling, length display/calculation alignment, rotated zero-spacing area tiling, effective alpha-area accounting, and multiple clipped boundary contributions.
Gate 6 merged through PR #5 after CI passed on exact head `92bea42625255189d46b1d36687a51098caf31ab`. It added explicit confirmed-result saving, immutable measurement snapshots, history list/detail/delete, presentation-only result adjustments, PNG/JPEG export, native share where supported, and remeasurement from an immutable history snapshot into a new measurement.

## In progress

- Gate 7 — Language, accessibility, and failure handling

Implemented in the current Gate 7 branch so far:
- photographed-unit image read failures now produce localized user-facing recovery text
- selection errors are announced through alert semantics
- camera/library and back/close controls have explicit accessible labels
- selection review cannot continue before a valid minimum point count exists
- undo/reset controls disable when they cannot act
- the photographed-unit selection stage has an accessible label

Gate 7 must preserve these established boundaries:
- no measurement-changing control is allowed in presentation-only result editing
- error messages must be user-facing and must not expose raw technical or infrastructure details
- photographed-unit creation and target selection must continue to support both new capture and existing device images
- saved historical results remain immutable
- unsupported secondary capabilities must not block the photographed-unit core

## Next

Continue the Gate 7 audit across target measurement, history/export, keyboard/touch targets, and empty/error states; pass CI on an exact PR head; then proceed to Gate 8 — ordinary cm / inch measurement.

## Reference rule

Every implementation step must begin by checking:

- `docs/PRODUCT_SPEC.md`
- `docs/ROADMAP.md`
- this file

When a gate is completed or the current implementation position changes, update this file in the same PR or immediately following maintenance commit.

Do not use this status file to publish internal business, monetization, infrastructure-cost, competitive, or unpublished planning.
