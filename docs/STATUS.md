# NANKOBUN SCALE — Development Status

Last updated: 2026-08-20

## Current position

Current gate: **Gate 9 — Device QA**

Current branch: `gate-9-device-qa`

Current work:
- verify the full photographed-unit flow on current iPhone Safari and Android Chrome
- verify capture and existing-image selection on both unit and target sides
- verify fractional length and area presentation on real touch devices
- verify confirmation lock, presentation-only adjustments, export, history, and remeasurement
- verify Japanese / English switching and recovery states on device
- verify ordinary cm / inch behavior only on devices/browsers that successfully expose the required immersive-AR hit-test path

## Completed

- Gate 0 — Specification freeze
- Gate 1 — UI specification
- Gate 2 — App foundation
- Gate 3 — Photographed-unit creation
- Gate 4 — Length measurement
- Gate 5 — Area measurement
- Gate 6 — Results, export, and history
- Gate 7 — Language, accessibility, and failure handling
- Gate 8 — Ordinary cm / inch measurement

Gate 2 merged through PR #1 after CI build passed on the exact PR head.
Gate 3 merged through PR #2 after CI build passed on the exact PR head and after a public-spec audit removed internal gate wording from the UI and restored explicit **「これで測る」** behavior.
Gate 4 merged through PR #3 after CI build passed on the exact PR head. Before merge, the public-spec audit restored the explicit length/area choice after target capture and added draggable endpoints plus pre-confirmation unit movement.
Gate 5 merged through PR #4 after repeated spec audits fixed target-image aspect handling, length display/calculation alignment, rotated zero-spacing area tiling, effective alpha-area accounting, and multiple clipped boundary contributions.
Gate 6 merged through PR #5 after CI passed on exact head `92bea42625255189d46b1d36687a51098caf31ab`. It added explicit confirmed-result saving, immutable measurement snapshots, history list/detail/delete, presentation-only result adjustments, PNG/JPEG export, native share where supported, and remeasurement from an immutable history snapshot into a new measurement.
Gate 7 merged through PR #6 after CI #52 passed on exact head `d2877e0b495263578c150f26d09de48824a4bc66`. It completed the Japanese/English, touch-target, accessibility, image-acquisition failure, invalid-area, history/export recovery, and remeasurement accessibility pass.
Gate 8 merged through PR #7 after CI #54 passed on exact head `9eda641cd416ea15d8a61717c840193538e9911f`. It added the secondary capability-detected WebXR ordinary-measurement route, real-world hit-test start/end placement, cm/inch output, and fail-closed unsupported/start-failure states without changing the photographed-unit core.

## In progress

- Gate 9 — Device QA

Gate 9 must preserve these established boundaries:
- arbitrary photographed-unit measurement remains the primary product
- both unit and target sides continue to support new capture and existing device images
- saved historical measurements remain immutable
- confirmed measurement conditions stay locked unless the user explicitly starts a new measurement
- presentation-only result controls must not change the underlying measurement
- ordinary cm/inch must fail closed when the required spatial capability cannot start; no uncalibrated-photo physical estimate is allowed

## Next

Run the documented end-to-end device matrix, record failures by flow and device/browser, fix only reproducible product defects, pass CI on each resulting exact PR head, then proceed to Gate 10 — publication audit.

## Reference rule

Every implementation step must begin by checking:

- `docs/PRODUCT_SPEC.md`
- `docs/ROADMAP.md`
- this file

When a gate is completed or the current implementation position changes, update this file in the same PR or immediately following maintenance commit.

Do not use this status file to publish internal business, monetization, infrastructure-cost, competitive, or unpublished planning.
