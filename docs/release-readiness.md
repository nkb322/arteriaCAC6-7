# Current release readiness and Netlify setup

Updated 2026-10-25. The complete suite passed **140 checks**: 74 unit, 14 core browser, 14 release, 10 profile, 15 product and 13 completed-workflow browser checks. This includes all prior 118 checks, with the profile schema assertion extended for the added onboarding preference. Run all commands with Node 24:

```sh
npm ci
npm test
npm run test:browser
npm run test:release
npm run test:profile
npm run test:product
npm run test:complete
```

Browser suites require installed Chrome; set `CHROME_EXECUTABLE` if it is not in the default location. `npm run build` creates the deployable public directory and versioned worker. `npm run preview` serves `dist`; a source-only static server does not provide the generated offline worker or server Functions.

## What is genuinely functional

Synthetic acquisition and recorded replay run through the parser/validator/controller, with connection/error/stale states, engineering checks, recovery, IndexedDB history, dated charts and real exports. Replay pause freezes active time without changing original timestamps. Overview uses actual stored records, recent-session links, local-profile greeting and meaningful empty states. Historical charts support sample inspection; date/source filters and activity/quality summaries are computed from stored data. Comparisons, notes, escaped HTML reports and print/PDF invocation use the selected saved data. Local encrypted-note download/decryption is independent of email. Clinic lookup uses the existing real public services with consent and failure handling. Guest profile, avatar, language/accessibility/chart/recording/onboarding preferences persist locally.

Aria has a real server-side provider implementation with session memory, bounded requests/replies, retry/cancel/clear, bilingual UX, separate message and minimal-summary consent, and optional two-recording explanations. Optional saved transcripts are unencrypted and never restored into provider context. Mocks verify these paths; they do not establish live inference.

The manifest/icons/worker and offline tools are implemented and tested in Chrome. Shell caching excludes private data, APIs, Functions, provider responses and recording fixtures. Updates wait and require confirmation while the current app is open; active recording/unsaved acquisition blocks an explicit update. See `completed-workflows.md` for exact limits and installation steps.

## Netlify interface setup

1. Sign in to Netlify and create a **separate new project**. Import GitHub `nkb322/arteriaCAC6-7`, branch `codex/measurement-pipeline`. Do not alter the current public project's branch/domain or settings.
2. Use build command `npm run build`, publish directory `dist`, Functions directory `netlify/functions` and Node 24. These settings are already in `netlify.toml`. Both `care-chat.mjs` and `share-report.mjs` must be present in the Functions list.
3. In Project configuration → Environment variables, set **server-side only**, scoped to Functions and the intended deployment context:
   - `ARTERIA_AI_ENABLED=true`
   - `ARTERIA_AI_PROVIDER=openai`
   - `ARTERIA_AI_MODEL`: an actual text model enabled for your account
   - `ARTERIA_AI_API_KEY`: your provider key
4. Optional OpenAI-only fallback: `OPENAI_API_KEY`. For an explicitly selected compatible provider use its own key/model plus `ARTERIA_AI_PROVIDER=compatible`, `ARTERIA_AI_BASE_URL`, and exact `ARTERIA_AI_ALLOWED_HOSTS`. Review `ai-companion.md`, provider privacy policies and spending caps. Never paste real secrets into source, GitHub, screenshots, logs or chat.
5. Build/deploy the new project and run `npm run check:hosted -- https://YOUR-PREVIEW.netlify.app/`. This sends no chat or session data. Verify security headers, referenced assets, `/api/care-chat` and `/sw.js`. A true availability response means configured variables, not a completed inference test.
6. On the HTTPS preview, consent to a non-sensitive app question; verify an actual provider response and contextual follow-up in English/Spanish. Review and explicitly share two synthetic summaries; inspect Network to confirm raw samples/notes/identity are absent. Test retry, cancellation, clear/revocation, rate limits and failures. Confirm no client API keys and set provider spending caps. Verify native hosted rate enforcement.
7. Verify all seven views, acquisition/recovery/history/filters/comparison/report/export/profile/deletion/clinic failure. Load online once, then test offline reload and local tools; inspect Cache Storage for only public shell URLs. Test installation and update on your actual target phone/browser. PDF destinations depend on OS/browser; use Print / Save PDF or open the downloaded HTML report and print it.
8. Optional email requires `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and an explicitly authorized comma-separated `ARTERIA_ALLOWED_RECIPIENTS` list. Local encrypted download works without these. Do not send email to others without authorization.
9. Only after hosted verification and explicit approval, publish the verified version to the intended public project. This task does not authorize overwriting production. A static Netlify Drop of `dist` can demo local features but **cannot deploy AI/email Functions**; use the complete Git build for full operation.

## Remaining external verification

No provider key or Netlify token/login was supplied, so real inference, hosted Functions/routing, platform limits and production deployment are unverified. Real email and remote clinic availability remain external dependencies. Physical hardware requires Nina's firmware/protocol, packet examples, channels/units/ranges, timestamps/sequence behavior and sampling frequency before a real adapter can be completed. The software's internal schema is not a presumed wire protocol. No physical connection or clinical diagnostic model is claimed.

Automated browser checks used desktop/tablet/mobile viewports in Chrome, not physical phones, OS home-screen installation, all PDF destinations, Safari/Firefox or formal screen-reader certification. No HIPAA, clinical accuracy or regulatory claim is made. The current release is a tested software candidate with these explicit external limits.

## CAC 2–3-minute demonstration

- 0:00–0:20: purpose, nonclinical prototype, guest profile, explicit sample-data disclosure.
- 0:20–0:55: 10-second Photon acquisition, waveform, source/quality checks, stop/save; replay pause if useful.
- 0:55–1:30: recent sessions, interactive sample inspection, activity/date/source filters, comparison and report/PDF/export.
- 1:30–2:05: AI consent and two-recording review; demonstrate genuine provider replies only if hosted live testing passed. Otherwise show honest unavailable/offline app guidance and explain the missing key.
- 2:05–2:35: Spanish, settings/privacy, opt-in transcript and deletion; cached offline reload.
- 2:35–2:55: architecture, hardware boundary, verification and accurate student/AI contribution disclosure. Do not reuse the pre-upgrade rehearsal as this release's final walkthrough.
