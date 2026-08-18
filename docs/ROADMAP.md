# NANKOBUN SCALE — Development Roadmap

This roadmap tracks the public implementation sequence. It describes product work only and does not include internal business, infrastructure-cost, monetization, competitive, or unpublished planning.

## Gate 0 — Specification freeze

Status: **Complete**

Scope:
- product behavior defined
- length and area behavior defined
- fractional visualization defined
- saved-unit and confirmed-result behavior defined
- screen/state responsibilities defined

Outcome:
Implementation can proceed without inventing the core measurement behavior.

## Gate 1 — UI specification

Status: **Complete**

Scope:
- approved visual baseline
- per-screen UI responsibilities
- Japanese / English UI copy
- normal, empty, permission, invalid-selection, save-failure, and unsupported-capability states

Outcome:
Implementation can build the agreed user flow without redesigning it during unrelated work.

## Gate 2 — App foundation

Status: **Complete**

Scope:
- React + TypeScript + Vite application shell
- PWA foundation
- navigation foundation
- Japanese / English switching foundation
- local persistence foundation
- camera acquisition foundation
- shared UI components using the approved visual baseline

Exit condition:
The app shell loads reliably and the core screens can be reached with language switching, local state, and camera acquisition foundations in place.

## Gate 3 — Photographed-unit creation

Status: **In progress**

Scope:
- photograph what to measure with
- manually select the usable region
- optional boundary assistance without making it mandatory
- confirm selected region
- optional naming
- explicit use-now / save-for-later branch
- saved-unit reuse and editing

Exit condition:
A user can create a photographed unit, save it without being forced into measurement, and later reuse it through **「これで測る」**.

## Gate 4 — Length measurement

Status: **Not started**

Scope:
- target photography
- two-point endpoint selection
- photographed-unit move / uniform scale / rotation
- repeated placement with **「並べる」**
- live recalculation
- fractional final-unit clipping
- measurement confirmation lock

Exit condition:
Integer and fractional length results render consistently and confirmed measurement conditions cannot be silently changed.

## Gate 5 — Area measurement

Status: **Not started**

Scope:
- freehand and polygon target areas
- photographed-unit transform and tiling origin
- zero-spacing tiling
- boundary clipping
- multiple fractional boundary contributions
- live recalculation
- measurement confirmation lock

Exit condition:
Area results remain visually consistent with the selected area and confirmed measurement state.

## Gate 6 — Results, export, and history

Status: **Not started**

Scope:
- confirmed-result screen
- presentation-only adjustments
- **「測り直す」** flow
- PNG / JPEG export
- explicit history save
- immutable historical result display

Exit condition:
A confirmed result can be made easier to read, exported, saved, reopened, and remeasured without rewriting the original measurement.

## Gate 7 — Language, accessibility, and failure handling

Status: **Not started**

Scope:
- full Japanese / English coverage
- touch-target and accessibility review
- camera permission failure
- invalid selection / invalid area handling
- local save / export failure handling
- empty states

Exit condition:
Core flows remain understandable and recoverable on supported mobile browsers.

## Gate 8 — Ordinary cm / inch measurement

Status: **Not started**

Scope:
- capability detection
- supported ordinary measurement flow
- unavailable-state handling

Rule:
This secondary feature must not block or destabilize the photographed-unit core.

## Gate 9 — Device QA

Status: **Not started**

Target end-to-end flows on current iPhone Safari and Android Chrome:

capture → select → use/save branch → reuse → length fraction → area fractions → confirmation lock → display adjustment → export → save → reopen → language switch

## Gate 10 — Publication audit

Status: **Not started**

Scope:
- verify public documentation matches actual behavior
- verify privacy and compatibility statements against the implementation
- verify user-facing errors contain no raw technical details
- final public copy and launch readiness review

## Development rule

Before starting or changing work in a gate, re-read:

1. `docs/PRODUCT_SPEC.md`
2. this `docs/ROADMAP.md`
3. `docs/STATUS.md`

A change that intentionally alters established public behavior must update the relevant public specification in the same development step. Do not let code silently diverge from these documents.
