# NANKOBUN SCALE — Device QA Matrix

Gate 9 is a real-device verification gate. Browser emulation may supplement this matrix but does not replace the iPhone Safari / Android Chrome checks below.

## Required device/browser rows

| ID | Device / browser | Required result |
|---|---|---|
| IOS-SAFARI | Current iPhone / current Safari | photographed-unit core completes end to end |
| ANDROID-CHROME | Current Android / current Chrome | photographed-unit core completes end to end |
| AR-SUPPORTED | Android/browser combination that successfully starts the required WebXR immersive-AR hit-test path | ordinary cm/inch path can place two points and return one physical distance in both units |
| AR-UNSUPPORTED | iPhone Safari or any browser without the required immersive-AR hit-test path | ordinary cm/inch fails closed while photographed-unit measurement remains available |

## Photographed-unit core checklist

Run every item on IOS-SAFARI and ANDROID-CHROME.

1. Home loads with the approved white / black / yellow visual baseline.
2. Browser-language default is correct on first use.
3. 日本語 / EN switch changes the UI and persists locally after reload.
4. **撮ったもので測る** opens the photographed-unit source choice.
5. **撮影する** can acquire a new unit image.
6. **写真から選ぶ** can acquire an existing device image.
7. Unit selection can be drawn with at least three points.
8. Undo / reset / review behave correctly on touch.
9. **この部分を使いますか？** review shows the selected cutout.
10. **これで測る** enters measurement without saving the unit first.
11. **保存する** saves without forcing immediate measurement.
12. Optional name can be blank or user-defined; no semantic name is invented.
13. Saved unit appears under **また使う** after returning home.
14. Saved-unit **これで測る** is an explicit action; merely opening/editing a card does not start measurement.
15. Saved-unit rename works without altering older measurement history.
16. Saved-unit delete does not alter older measurement history.

## Target source and length checklist

Run with at least one newly captured target and one existing target image.

1. Target source offers **撮影する** and **写真から選ぶ** separately.
2. User chooses **長さ** or **面積** after target acquisition.
3. Length mode accepts two explicit endpoints.
4. Both endpoint handles are draggable on touch.
5. The unit can be moved before confirmation.
6. Unit size and rotation can be changed before confirmation.
7. **並べる** repeats the unit along the selected segment.
8. A non-integer result shows the final unit clipped at the endpoint, not scaled down.
9. Result changes when the measurement conditions change before confirmation.
10. **この測定で決定** locks measurement-changing controls.
11. Saving the confirmed measurement is explicit.

## Area checklist

1. Freehand outline works on touch.
2. Polygon-point outline works on touch.
3. Too-small and self-crossing regions cannot continue and show localized recovery text.
4. Unit size, rotation, and tiling origin can be changed before confirmation.
5. **敷きつめる** visually covers the selected region without intentional measurement spacing.
6. Units outside the selected region are clipped.
7. Multiple boundary fragments contribute to one result.
8. **この測定で決定** locks measurement-changing controls.
9. Saving the confirmed measurement is explicit.

## Result / history checklist

1. Saved result appears in **履歴**.
2. History detail uses its immutable saved target/unit snapshot.
3. Presentation controls can change unit opacity and permitted visibility options without changing the numeric result.
4. Presentation controls do not expose scale, rotation, endpoints, area, or tiling-origin edits.
5. PNG export succeeds.
6. JPEG export succeeds.
7. Native share succeeds where the browser exposes it; otherwise a localized unavailable state is shown.
8. Deleting a history entry asks for confirmation and removes only that entry.
9. **この条件から測り直す** starts a new measurement from the saved conditions.
10. Remeasurement save creates a new history entry and does not rewrite the source entry.

## Failure and recovery checklist

1. Cancelled/failed image selection does not crash the app.
2. Unreadable unit/target image gives localized recovery UI with no raw technical details.
3. IndexedDB save/list failure gives localized recovery UI where implemented.
4. Export/render failure gives localized recovery UI.
5. Empty saved-unit and history states are understandable.
6. Back/close actions leave the app in a recoverable state.

## Ordinary cm / inch checklist

### AR-SUPPORTED

1. Home **cm・inchで測る** opens the secondary route.
2. Capability check reports support only after the browser reports immersive-AR support.
3. **AR測定を開始** requests the required spatial session.
4. Hit-test target appears only when the spatial session is active.
5. Start point can be placed only when a current hit is available.
6. End point can be placed only when a current hit is available.
7. The result shows the same 3D distance in centimeters and inches.
8. **やり直す** clears both points.
9. **AR測定を終了** ends the session cleanly.

### AR-UNSUPPORTED / START-FAILURE

1. No physical cm/inch value is fabricated from an ordinary photo.
2. Unsupported browser/device shows the localized unavailable state.
3. Session-start failure shows the localized start-failure state.
4. **撮ったもので測る** remains fully usable.

## Pass rule

Gate 9 is complete only after every photographed-unit core item has an explicit pass/fail result on both IOS-SAFARI and ANDROID-CHROME, and ordinary cm/inch has been checked on at least one supported path when available plus one unsupported/fail-closed path. Any reproducible product defect found during the run is fixed through a PR and exact-head CI before Gate 10 starts.
