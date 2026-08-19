# NANKOBUN SCALE — Development Status

Last updated: 2026-08-20

## Current position

Current gate: **Gate 8 — Ordinary cm / inch measurement**

Current branch: `gate-8-ordinary-measurement`

Current work:
- capability-detect WebXR immersive AR
- provide a supported-device ordinary measurement flow using real-world hit-test coordinates
- place explicit start and end points from the camera-centered hit target
- display the same physical distance in cm and inch
- provide a clear unavailable/failure state without blocking arbitrary photographed-unit measurement

## Completed

- Gate 0 — Specification freeze
- Gate 1 — UI specification
- Gate 2 — App foundation
- Gate 3 — Photographed-unit creation
- Gate 4 — Length measurement
- Gate 5 — Area measurement
- Gate 6 — Results, export, and history
- Gate 7 — Language, accessibility, and failure handling

Gate 2 merged through PR #1 after CI build passed on the exact PR head.
Gate 3 merged through PR #2 after CI build passed on the exact PR head and after a public-spec audit removed internal gate wording from the UI and restored explicit **「これで測る」** behavior.
Gate 4 merged through PR #3 after CI build passed on the exact PR head. Before merge, the public-spec audit restored the explicit length/area choice after target capture and added draggable endpoints plus pre-confirmation unit movement.
Gate 5 merged through PR #4 after repeated spec audits fixed target-image aspect handling, length display/calculation alignment, rotated zero-spacing area tiling, effective alpha-area accounting, and multiple clipped boundary contributions.
Gate 6 merged through PR #5 after CI passed on exact head `92bea42625255189d46b1d36687a51098caf31ab`. It added explicit confirmed-result saving, immutable measurement snapshots, history list/detail/delete, presentation-only result adjustments, PNG/JPEG export, native share where supported, and remeasurement from an immutable history snapshot into a new measurement.
Gate 7 merged through PR #6 after CI #52 passed on exact head `d2877e0b495263578c150f26d09de48824a4bc66`. It completed the Japanese/English, touch-target, accessibility, image-acquisition failure, invalid-area, history/export recovery, and remeasurement accessibility pass.

## In progress

- Gate 8 — Ordinary cm / inch measurement

Implemented in the current Gate 8 branch so far:
- the home `cm・inchで測る` action is enabled as a secondary route
- WebXR `immersive-ar` support is capability-detected
- unsupported devices/browsers receive a localized unavailable state while **「撮ったもので測る」** remains usable
- supported sessions request real-world hit testing and DOM overlay controls
- the user explicitly places a start point and end point at the center hit target
- the 3D distance is displayed in centimeters and inches
- AR-session start failures remain user-facing and do not expose raw technical details

Gate 8 must preserve these established boundaries:
- ordinary measurement is secondary; it must never become a prerequisite for arbitrary-unit measurement
- no fake cm/inch result may be produced when spatial tracking/hit testing is unavailable
- unsupported devices must fail closed into an unavailable state, not silently estimate scale from a normal photo
- arbitrary-unit measurement remains fully usable without WebXR

## Next

Run CI and a Gate 8 diff/spec audit on the supported and unsupported paths. If the exact head is green and the capability boundary is preserved, merge Gate 8 and proceed to Gate 9 device QA.

## Reference rule

Every implementation step must begin by checking:

- `docs/PRODUCT_SPEC.md`
- `docs/ROADMAP.md`
- this file

When a gate is completed or the current implementation position changes, update this file in the same PR or immediately following maintenance commit.

Do not use this status file to publish internal business, monetization, infrastructure-cost, competitive, or unpublished planning.
