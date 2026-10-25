# Release-candidate verification

Branch: `codex/measurement-pipeline`. See [final independent verification](final-release-verification.md) for the tested application commit, exact totals and release assessment. Main/public Netlify were not changed. All test data is synthetic or deliberately adversarial test text; no physical sensor, patient data or confidential research was supplied.

## Screen assessment

| Screen | Working software | Qualification |
|---|---|---|
| Overview | Latest/current validated channel values, counts, source, duration, quality and waveform | No fabricated wellness/steps/wear-time metrics; demo profile is not an account |
| Photon | Simulation, replay, lifecycle mock, live charts, progress, stop/save, gaps, errors, checkpoint status | Physical hardware source is not configured |
| My trends | IndexedDB final/recovered history, actual date ranges, channels, comparison, saved notes, CSV/JSON, offline HTML report, explicit deletion | All these records and exports are unencrypted; compare matching units/meanings/conditions |
| Find care | City search, opt-in location flow, radius/type/access filters, cancellation, timeouts and safe result rendering | External listings may be incomplete/outdated; physical GPS permissions are not verified |
| Share securely | Local encrypted download, unlock/decrypt, wrong-key/tamper rejection, clear form and optional allowlisted email path | Actual provider delivery needs authorized server configuration and a real delivery check |
| Aria companion | Optional server-side AI, bounded in-memory context, separate summary consent, clear/cancel, labeled offline guide, read-aloud | Provider requests tested with mocks; live AI unverified. No diagnostic model or clinical triage |

## Product upgrade coverage

See `product-upgrade.md` and `ai-companion.md` for the current added features and verified limits. The previous 83-check release remains tagged as a fallback. New coverage exercises provider request schemas, request/output bounds, consent, provenance, summaries, rates/concurrency, failure redaction, context trimming, filters, and integrated browser workflows. Exact final counts are in the release handoff.

## Automated suites

- **Node tests:** shared parser/schema/validator; incremental and batch processing; provenance; duplicate/order/missing samples; clock rollback; controller cancellation and source cleanup; checkpoint batching/finalization ordering; storage errors; replay/import/export; negative numeric CSV/formula safety; report source/notes/HTML escaping; shared graph gaps; email request guards, mandatory allowlist, idempotency, limits and provider failure handling.
- **Existing browser regression suite:** six-screen navigation, real IndexedDB transactions, acquisition/stale/resume, exports, reload/history/date ranges, replay consistency, invalid imports, bilingual controls, accessibility, controlled clinic results, actual browser crypto, injection-as-text, 320/390 px layouts, forced storage failure and no uncaught errors.
- **Production-preview suite:** build allowlist/headers/modules; v1 IndexedDB migration; incremental checkpoint persistence; active-tab exclusion; browser-close/restart and refresh recovery; preserved timestamps/origin; recovered replay; mock disconnection/restart; saved notes, session comparison and offline report; local encrypted download/tampering; care actions/back navigation; clinic empty/failure/access/injection cases; Spanish/modal/mobile behavior; corrupt-checkpoint isolation; explicit deletion of sessions and journal; no uncaught errors.

`npm run test:release` creates an isolated production-like preview, not a Netlify cloud deployment. Test results/screenshots are in ignored `test-results/`. A clean source checkout and pinned dependency install are checked separately before handoff. Static JS and the server function receive syntax checks. The generated public directory excludes tests, function source, environment files, Git metadata and obsolete bundles.

The incremental processor was exercised with 100,000 synthetic samples under a generous five-second budget; this does not establish an actual physical-device throughput guarantee. Hardware sample rates, batching and platform behavior still need measurement.

## Failures encountered and corrected

- A pending-connection cancellation test initially assumed source connection began synchronously after introducing async acquisition locks. The controller avoids late-lock contamination; the current lifecycle tests pass.
- A mock restart browser assertion could see the previous session's sample count before UI reset. Acquisition now renders the new state immediately, and the test waits for samples from the new recording.
- Earlier development assertions incorrectly called DOM `textContent` as a function. These were test defects, corrected before the release run.
- Raw negative numeric CSV cells were originally prefixed as if textual spreadsheet formulas. Numbers now remain numeric; potentially executable text cells are protected.
- Initial recovery lacked journal persistence; it now restores committed batches and does not claim an active tab's lock. Corrupted drafts remain isolated rather than deleting them silently.

No failing test is treated as a pass. Final exact totals and clean-checkout evidence are recorded in the release handoff and machine-readable test files.

## Remaining limits and external checks

- **Hardware:** no physical USB/BLE/Wi-Fi acquisition or real hardware recording was tested. Nina must supply the documented transport/payload/timing/units contract before the adapter is implemented and verified.
- **Clinical:** there is no validated thrombosis assay, clinical dataset/model, diagnostic score, heart-rate or SpO₂ computation. Engineering checks do not establish physiological accuracy.
- **Persistence:** committed checkpoints recover; the newest uncommitted tail can be lost after crash/power failure. Browser eviction/clearing removes local storage. Without Web Locks, recovery is explicitly manual after other recording tabs close.
- **Privacy:** local history, recovery chunks, session notes and reports are unencrypted. Deletion does not remove exported files. The encrypted-note feature protects only its own attachment, not measurement storage or email metadata.
- **Email:** configured recipients are mandatory and provider calls are bounded/idempotent. The rate cap is per running function instance, not distributed authentication/rate control. Retain provider-level safeguards. Real delivery was not sent.
- **Browsers:** Chrome is end-to-end verified. Other browsers and physical permission flows need platform checks; unsupported Web Locks has an explicit manual recovery path. Full assistive-technology certification is not claimed.
- **Deployment:** local production configuration/modules/headers are verified. Public hosting, deployed secrets and provider permissions remain unverified until a separately approved deployment. No push, merge or public publication was performed.

Custom Netlify headers follow the [_headers configuration format](https://docs.netlify.com/manage/routing/headers/). Closing-page events are only best-effort; recovery relies on prior committed checkpoints, consistent with the browser [page lifecycle limitations](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event).
