# Profile & Settings

The test totals below describe earlier profile/greeting releases. The current product release also includes the optional AI companion and expanded product tests; see `product-upgrade.md` and the latest handoff for complete results.

Open the header avatar, sidebar guest profile or Profile & Settings link. The page is available directly at `#profile` and works with the existing back/forward navigation. It is a local guest experience, not authentication or a registered account.

## What is saved

`js/profile/preferences.js` normalizes a versioned `arteria-profile-v1` localStorage record: optional display name (60 characters), local initials/leaf/wave/star avatar, default duration (10/20/60 seconds), live chart window (5/10/20/60 seconds) and grid visibility. Avatars use built-in symbols; no images or profile data are uploaded. Invalid/corrupt records fall back to safe defaults. If storage is blocked, edits apply in memory for the current visit and the UI reports that they could not be saved.

English/Spanish and larger-text/high-contrast/reduced-motion switches forward to the existing application handlers. They use the original `arteria-language` and `arteria-accessibility` keys and stay synchronized with the header language selector and accessibility dialog. The settings page does not implement a second accessibility or translation preference store.

## Measurement integration

The default recording duration sets Photon's next simulation/mock duration. Changes during a recording wait until it stops; they never shorten an active acquisition. A chart-only change preserves a duration manually selected in Photon. Replay duration remains derived from the recording and playback speed.

The live chart window selects samples by their acquisition timestamps rather than an assumed sample count. The grid preference applies to in-app charts. Neither changes accepted samples, statistics, acquisition timing or exported reports. Historical charts retain the full session. The pure geometry and preference normalization are tested independently.

The measurement UI exposes bounded UI operations (`measurementInfo`, `historyJSON`, `clearRecordings`) and emits a state-update event; the profile uses these instead of creating a second controller/store. Device status is the actual controller state. Source identity/channels describe the latest/current session and are separate from physical connection status. Battery is displayed only for an active hardware stream that supplied it. No physical adapter has been verified.

## Data controls and privacy

The session count and archive export include all saved sessions, independent of the Trends date filter. The JSON history archive contains `recordings`, each a canonical single-recording JSON wrapper that can be extracted and opened in Photon replay. The complete archive is not a single replay recording; bulk archive restoration is not implemented. Unsaved/in-progress samples are not included as saved history.

Delete recordings clears final sessions and recovery checkpoints through the existing storage/controller cleanup. Clear local Arteria data also resets the guest profile and preferences, note forms, location consent and conversation. Both require confirmation; they are disabled during acquisition/finalization. Storage locks protect another tab's active recording where Web Locks are supported. Downloaded files and other applications' localStorage keys are retained. Storage errors report that changes may be incomplete.

History, checkpoints, preferences, profile and session notes are unencrypted browser data. CSV/JSON/HTML exports are unencrypted. Only the separate passphrase-encrypted note attachment is encrypted. There is no automatic cloud sync/backup. Clearing browser storage can remove this local guest profile and history.

## Verification

`npm test` includes five profile-specific checks for normalization, persistence, unavailable/corrupt storage, Unicode initials and timestamp-based chart windows. `npm run test:profile` builds the production allowlist and runs ten Chrome interaction checks: navigation/guest identity, text-safe persisted name/avatar, shared language/accessibility, real recording/chart effects and source status, archive export and confirmed deletion, responsive/keyboard behavior, clear/reset isolation, corrupted/blocked preference storage and uncaught errors. The existing browser and release suites must also pass.

The new feature adds no runtime dependencies or backend. The About card uses application version 1.0.0, explains the CAC research purpose and states that Arteria is not a clinically validated diagnostic tool.

### Final run — 24 October 2026

All **82 checks passed** on Node 24.22.1 with installed Google Chrome on macOS: 45 Node tests, 14 existing browser checks, 14 production checks and 9 profile checks. All four commands were rerun after the final application changes. JavaScript syntax and whitespace checks also passed. Browser tests use isolated local profiles, synthetic recordings and controlled external-service responses; this does not verify physical hardware, real email delivery or a cloud deployment. Desktop/mobile screenshots were visually reviewed. An initial immediate mobile-width assertion was timing-sensitive during viewport resizing; the final check waits for the responsive layout to settle and still asserts no horizontal page overflow.

The final behavior preserves manually chosen Photon durations during chart-only changes and defers a new recording default until active acquisition stops. No runtime dependencies, account infrastructure, public deployment or remote push was added. Other browsers have not received full end-to-end verification; avatar selection is limited to initials and local symbols.

### Final greeting cleanup

The Overview companion and Care guide use generic English/Spanish greetings; the main greeting/header still use the local guest profile. The new browser regression reproduced the old hardcoded name before the fix and covers a changed profile, refresh, both languages, initial Care greeting, conversation reset and greeting replies. This final suite contains 45 unit tests plus 14 regression, 14 production and 10 profile browser checks: 83 total. The previous 82-check release remains tagged `arteria-cac-verified-4bfae39` as a fallback.
