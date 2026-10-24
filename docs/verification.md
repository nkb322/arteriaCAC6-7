# Implementation and verification

Development branch: `codex/measurement-pipeline`, based on repository commit `48a1e60` (the prior audit's application code plus README formatting). Implementation date: October 24, 2026. Changes are local; main and the Netlify deployment were not changed.

## Implemented

- Shared, versioned measurement/source/channel schema and bounded UTF-8 frame decoder.
- Channel, range, numeric, battery, timestamp and sequence validation; rejection counts and reasons.
- Source lifecycle with generation guards, cancellation, duration/sample limits, explicit live/demo/replay/stale/disconnected/error states.
- Simulation and JSON-recording replay through the same parser/validator/controller/storage path as future hardware.
- Acquisition controls and responsive live SVG charts, with gaps, units, elapsed device time and source labels.
- Overview from current/latest recorded samples; no unsupported wellness score, steps, wear time, or battery placeholders.
- IndexedDB session persistence after stop/completion; dated 7/30-day history, selected-channel waveform, replay and deletion.
- CSV/JSON exports; validated JSON import; original receipt timestamps retained on replay.
- Descriptive channel statistics, sequence/timing gaps, recent exact flatline and declared-limit clipping counts. No clinical prediction.
- Save-failure recovery with export/retry/discard; no silent overwrite of unsaved data.
- English/Spanish measurement controls, errors and state; existing navigation, clinic search, crypto and accessibility retained.
- Hardware adapter contract, sample fixture, architecture, startup and demonstration documentation.

## Automated checks

Run `npm test` for Node's built-in tests. They exercise descriptors, sample validation/order, fragmented/batched/invalid/oversized/truncated UTF-8 frames, processing flags, connection lifecycle, stale/resume, source failure, late callbacks, custom decoder failure, pending-connect cancellation, persistence failure, JSON validation/replay and CSV safety/units/provenance.

Run `npm run test:browser` with installed Chrome and the development dependency. It starts its own loopback server and isolated browser profile. The browser suite verifies:

1. Honest empty state and all six navigation views.
2. Real IndexedDB commit/read/delete across independent connections.
3. Simulation → accepted samples → charts/Overview → stale pause → recovery and gaps.
4. CSV/JSON downloads containing the expected data and units.
5. Session persistence across reload, Overview restoration and actual 7/30-day filtering.
6. Exported-session replay preserving values, original timestamps and simulated origin.
7. Invalid recording rejection and valid file loading.
8. Spanish measurement state, chart descriptions, accessibility switches and keyboard dismissal.
9. Clinic search with controlled Nominatim/Photon fixtures.
10. Actual browser encryption/decryption round trip and wrong-key rejection; email POST is intercepted.
11. Companion insertion-as-text regression.
12. All views at 320 and 390 px without document-level horizontal overflow in tested states.
13. Forced unavailable IndexedDB: accepted samples stay exportable and new acquisition is blocked.
14. No uncaught application exceptions in the primary test run.

No email is sent by the browser suite. Screenshots and JSON results go to ignored `test-results/`. JavaScript syntax checks also pass for legacy `app.js`, the measurement UI and the existing server function. Screenshots were visually reviewed for acquisition and Overview. Existing Netlify publish/functions configuration is unchanged; all frontend assets remain static, without a build step.

## Explicitly unverified / excluded

- No physical microcontroller, optical sensor, USB, BLE or Wi-Fi measurement connection was tested. The hardware state branches have software tests with artificial callbacks only.
- No real hardware recording was supplied. The included example and current demonstrations are synthetic.
- No trained ML artifact, clinical dataset, validated thrombosis assay, diagnostic algorithm, heart-rate estimator or oxygen-saturation calculation was introduced.
- No Netlify deployment, real Resend delivery, production permissions, Safari/Firefox compatibility, full screen-reader audit or clinical performance test was performed.
- Sessions are local and unencrypted, saved at finalization; there is no crash autosave, login or cloud synchronization. Export backups explicitly. Plaintext exports are not protected by the separate encrypted-note feature.
- Imported source claims cannot be independently verified. Engineering quality flags do not establish physiological validity or clinical safety.

See `hardware-connection.md` for exactly what is required before implementing and testing the real adapter.
