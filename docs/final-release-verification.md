# Final release verification — 24 October 2026

Assessment: **READY WITH LIMITATIONS** for a clearly labeled simulated-data CAC demonstration and preparation for an authorized deployment. No critical software failures were found in this verification. Physical hardware, clinical validity and live external integrations are not established by these tests.

## Reproducible evidence

The application tested was commit `015f4f04547b002d90e11b08cfab50b25affc440` on `codex/measurement-pipeline`. A fresh local Git clone, separate from the development tree, installed the pinned dependencies with `npm ci --ignore-scripts --offline` using the previously populated package cache. Node was 24.22.1; browser tests used installed Google Chrome on macOS and isolated profiles.

| Command | Passing | Failing |
|---|---:|---:|
| `npm test` | 40 | 0 |
| `npm run test:browser` | 14 | 0 |
| `npm run test:release` (includes production build) | 14 | 0 |
| Total | **68** | **0** |

An initial sandboxed browser attempt could not bind its local test ports (`listen EPERM`). The complete browser suites were rerun successfully outside that restriction. This was an execution-environment restriction, not counted as a passing run or an application defect. No new application bug or code fix was necessary. This final commit adds the verification record only; the tested application code is unchanged.

Actual automated browser interactions verified all six navigation screens; acquisition/start/stop/restart; live charts; simulation/replay and source labels; stale/resume and missing samples; final history persistence; refresh and browser-restart recovery; older-history migration; cross-tab recording exclusion; comparison; saved notes; CSV/JSON download and replay; offline report opening; mock disconnection; corrupted-checkpoint isolation; empty history and deletion; encryption/decryption and tampering; controlled clinic results/errors; Spanish controls; keyboard modal focus; mobile layouts at 320/390 px; forced storage failure; and absence of uncaught application errors. Acquisition screenshots were visually reviewed. These checks do not certify every browser, screen reader or physical permission flow.

## Production and integrity review

- `netlify.toml` specifies Node 24, `npm run build`, public directory `dist` and functions directory `netlify/functions`.
- The production browser suite served the generated public-file allowlist and security headers, checked module loading and rejected requests for excluded test/backend files. There are no runtime package dependencies; Playwright is a development test dependency.
- Tracked JavaScript syntax checks passed. A targeted source scan found no common live-key/private-key patterns. The tracked `.env.example` contains blank placeholders only. This is a bounded review, not a third-party security audit.
- Simulation and replay remain explicit in UI, exports and reports. Signal checks are engineering observations, not health scores. There is no clinical DVT model or medical wellness score.
- Local history, checkpoints, session notes and reports are unencrypted. Only the separate encrypted-note attachment uses passphrase encryption. Recovery can lose the uncommitted sample tail.

## Deployment instructions — requires separate approval

Do not push, merge or change the public site as part of this verification. After approval, import/upload the verified source to an isolated Netlify site or deploy-preview branch. Keep the existing production site unchanged until preview acceptance.

1. Use Node 24, build command `npm run build`, publish directory `dist`, and functions directory `netlify/functions`; these are already in `netlify.toml`.
2. Deploy without email credentials to verify the safe disabled-email behavior and local encrypted downloads. If email is authorized, configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `ARTERIA_ALLOWED_RECIPIENTS` as server-side Netlify variables. Never embed keys in browser code.
3. In the HTTPS preview, check all six hash routes, response security headers, module/asset requests, simulation, recovery, exports and reports. Verify clinic-service access and any approved real email delivery separately. A static local preview does not execute Netlify functions.
4. Promote only after the owner approves the preview. This session did not create a cloud deployment, send real email, push or merge.

## Remaining external verification

Physical hardware requires Nina's exact firmware messages, sensor/channel meaning and units, sampling/clock semantics, calibration and confirmed BLE/serial/Wi-Fi communication settings. See `hardware-connection.md`. No protocol was invented. Browser tests use synthetic data, controlled clinic responses and intercepted email transport; real clinic-service uptime/GPS, provider delivery and deployed Netlify behavior remain unverified. Chrome is the tested browser. Clinical validation remains separate.

## CAC walkthrough and authorship

Use `demo-plan.md` for the 2-minute-50-second sequence: acquire a dropout session, show Overview, compare sessions, save notes/open a report, replay, explain recovery and limits. Prepare a clean recording in advance and keep SIMULATED/REPLAY labels visible.

AI assisted the pipeline, recovery, analysis, reports, reliability work, tests and documentation. The user supplied requirements and priorities and approved local development. This record does not verify named students' individual code authorship or physical hardware contributions. Students should document and explain their actual work and personally verify the application using `student-guide.md`; do not present AI-generated implementation as entirely student-written.
