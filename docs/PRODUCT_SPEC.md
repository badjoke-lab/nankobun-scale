# NANKOBUN SCALE — Product Specification

## Product

NANKOBUN SCALE is a web app for measuring a photographed target with another photographed image as an arbitrary visual unit.

Primary concept: **好きなものを、ものさしに。**

The arbitrary photographed-unit workflow is the primary product. Ordinary cm/mm/inch measurement is secondary.

## Image sources

Both sides of an arbitrary-unit measurement support either a newly captured photo or an existing image already stored on the user's device.

For the photographed unit, the user can:
- take a new photo
- choose an existing image from the device photo library/files and define the usable region
- reuse a photographed unit previously saved inside NANKOBUN SCALE through **「これで測る」**

For the measurement target, the user can:
- take a new photo
- choose an existing image from the device photo library/files

Taking a new photo is never required merely because the workflow starts from a camera-oriented screen. The source choice must remain explicit and usable on supported devices.

## Core user flow

1. Start with **「撮ったもので測る」**.
2. Choose whether to take a new image for the unit or use an existing image from the device. A unit already saved inside NANKOBUN SCALE can instead be reused through **「これで測る」**.
3. Use **「使いたい部分を囲んでください」** to define the image region to use.
4. Confirm with **「この部分を使いますか？」**.
5. Choose whether to **「これで測る」** now or **「保存する」** for later.
6. Saving never forces the user directly into measurement.
7. To measure, choose whether to take a new target photo or use an existing image from the device, then choose **「長さ」** or **「面積」**.
8. The user explicitly defines the length endpoints or target area. The app does not guess the intended object.
9. The photographed unit may be moved, uniformly scaled, and rotated before measurement confirmation.
10. The result is displayed primarily as `[unit image] × N.N`, with localized supplemental text.

## Saved photographed units

- Saving a photographed unit is optional.
- Naming is optional and user-controlled.
- The app does not automatically assign semantic object names.
- Saved units can be reused later through **「これで測る」**.
- An existing device image can also be newly registered as a photographed unit; taking another photo is not required.
- Editing or deleting a saved unit must not alter already-confirmed historical measurements.

## Length measurement

- The target may come from a new camera capture or an existing device image.
- The user taps the two endpoints of the length to measure.
- The selected photographed unit is placed over the target image.
- Before confirmation, the user may move, uniformly scale, and rotate the unit.
- **「並べる」** repeats identical units along the selected line.
- The result updates while the measurement conditions are being adjusted.
- A fractional final unit is shown by clipping a full-scale unit at the endpoint. It is never shown by shrinking the unit.
- **「この測定で決定」** locks the measurement conditions.

## Area measurement

- The target may come from a new camera capture or an existing device image.
- The user defines the target area by freehand outline or polygon points.
- The photographed unit can be moved, uniformly scaled, and rotated before confirmation.
- **「敷きつめる」** repeats the unit over the selected region with zero measurement spacing.
- Portions outside the selected area are clipped.
- Boundary fragments contribute proportionally to the visible in-region unit area.
- Multiple boundary fragments may contribute to one result.
- **「この測定で決定」** locks the measurement conditions.

## Confirmed results

After confirmation, measurement-changing properties are locked. This includes the photographed unit scale and rotation, measurement endpoints/area, measurement-relevant position/origin, and repetition/tiling geometry.

The user may still change presentation-only properties such as:

- unit opacity
- unit outline on/off
- measurement boundary visibility
- outside-area darkening or blur where applicable
- result text visibility, position, and size
- optional saved name visibility
- unit thumbnail visibility

Changing measurement conditions requires **「測り直す」** and produces a newly calculated result.

## Output and history

- Confirmed results can be exported as PNG or JPEG.
- Exported visualization must match the confirmed measurement.
- Saving a result to history is explicit, not automatic.
- Historical confirmed results are treated as immutable measurements.
- A user can start a new measurement from prior conditions without rewriting the original history entry.

## Language

Launch UI supports Japanese and English.

- Initial language follows the browser language.
- Explicit user choice overrides the default and is retained locally.
- A **「日本語 / EN」** switch is available in the UI.

## Ordinary measurement

**「cm・inchで測る」** is a secondary feature and must not be required for the arbitrary photographed-unit workflow.

Availability is capability-detected. If unavailable on a device/browser, the arbitrary-unit functionality remains usable.

## Accounts and local use

The launch experience does not require an account or login.

Saved photographed units and saved results are local-first.

## UI baseline

The visual baseline is the approved white / black / yellow design language, with image-first measurement screens and restrained controls. Implementation should preserve that visual language unless an explicit design decision changes it.
