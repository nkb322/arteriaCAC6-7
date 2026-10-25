# Arteria — software release candidate

The existing six-screen application now has a shared measurement pipeline, recovery checkpoints, simulation, recording replay, live acquisition charts, local history, session comparison, notes, offline reports and encrypted-note downloads. **No physical hardware, clinical ML model, diagnostic score, or thrombosis detection has been implemented or verified.**

## Start

Node.js 20+ is required; the release is tested on Node 24 and 26. There are no runtime package dependencies or application frameworks.

```sh
npm start
```

Open http://127.0.0.1:8766. Use an HTTP localhost origin, not `file://`.

For the isolated production-like preview:

```sh
npm run build
npm run preview
```

`PORT=8769 npm run preview` uses another port if a development server is already running. `build` writes an explicit public-file allowlist to `dist/`; it excludes tests, backend source, environment files, Git metadata and the obsolete React bundle. No cloud deployment is performed.

## Demonstrate the complete workflow

1. In **Photon acquisition**, choose Simulation and a 10-second recording. Start acquisition; Overview and the waveform follow accepted samples.
2. Choose **Missing samples / pause** for a second recording. It pauses after 3 seconds, becomes stale, resumes at 6 seconds, and records the sequence gap. Labels remain SIMULATED.
3. Stop/save, or let recording finish. In **My trends**, select a dated session/channel, export CSV/JSON, add and save a note, and download an HTML report. Reports contain graphs, statistics, units, provenance and saved notes; open them offline or print from your browser.
4. Choose another saved session under **Compare**. Graphs remain side by side with separate units/source labels; compare values only when acquisition conditions, units and channel meanings match.
5. Replay a selected session at 1×/2×/4×, or load `fixtures/simulated-session.json`. Simulated recordings remain simulated. Imported hardware origin is a declaration, not verified provenance.
6. Test recovery: record for a few seconds, observe **Recovery checkpoint saved**, then refresh and confirm navigation. The available checkpoint returns as an interrupted session with its original timestamps. An unexpected closure can lose samples after the most recent committed checkpoint.
7. Choose **Mock device (synthetic)** to exercise connection delay, streaming, duplicate/malformed frames and an intentional disconnection after about 4 seconds. Starting again creates a fresh session. This uses the application interchange format, not Nina's unknown wire protocol.
8. **Share securely** can encrypt and download a note without email configuration or email consent. Unlock it using its passphrase. Email is optional and separately configured. **Care guide** is an informational rule-based companion and links to preparing an appointment note.

English/Spanish controls, accessibility preferences, keyboard navigation and the clinic locator remain available. New charts and comparison views resize without changing the existing design/palette.

## Tests

```sh
npm test
npm ci
npm run test:browser
npm run test:release
```

`npm test` uses Node's built-in runner. `npm ci` installs only the pinned browser-test development dependency, Playwright. Browser tests use installed Google Chrome by default; set `CHROME_EXECUTABLE` if needed. An existing Playwright installation can be selected using `PLAYWRIGHT_MODULE_PATH`.

The browser suites start disposable loopback servers on ports 8767 and 8768 and isolated profiles. They use synthetic recordings, fixture clinic responses and intercepted email delivery. No real email or physical device is used. Results/screenshots go to ignored `test-results/`. `test:release` builds the production allowlist first, then verifies restart/refresh recovery, cross-tab exclusion, mock failure/restart, comparison, notes, offline report safety, encrypted downloads, deletion, localization and security headers.

## Recovery, storage and privacy

- Accepted samples are buffered in memory; the first sample and approximately one-second batches are checkpointed transactionally in IndexedDB. Finalization waits for the pending checkpoint before saving the final session and removing its journal.
- On startup, available interrupted drafts are revalidated and restored as interrupted sessions. Web Locks prevent another tab from stealing an actively recorded session. Without Web Locks, automatic cross-tab recovery is disabled: close other recording tabs and use **Check interrupted recordings** manually.
- The UI shows how many samples reached a checkpoint. Crash/power failure can lose the latest uncommitted tail; page-close events are only a best-effort extra checkpoint. Browser data deletion/eviction can remove local records. Export backups.
- Measurement history, checkpoints, session notes, CSV/JSON and HTML reports are **unencrypted**. The separate encrypted-note feature does not protect those records. Other users of the same browser profile can access them.
- Delete one session or all sessions/checkpoints explicitly in My trends. Erasure does not remove downloaded files. A Chrome tab holding a recording lock blocks bulk erase. Clear the encrypted-note form separately if it contains private text.
- Arteria uploads no measurement sessions. Clinic searches send the selected city or consented rounded coordinates to Nominatim/Photon. Remote Google Fonts are requested for the original visual identity. Chat uses fixed replies locally; browser read-aloud uses the browser's speech facility.
- Parser/import bounds: 16 KiB internal UTF-8 frames, 24 MiB JSON imports, up to 8 channels and 100,000 accepted samples, and 300 seconds in the controller. The UI offers 10/20/60 seconds. A conservative serialized-size budget stops acquisition before an app-produced compact JSON recording would exceed its replay-import limit.
- Samples need increasing sequence and device-relative time. Host receipt times are separate and nondecreasing. Duration/staleness use a monotonic clock so wall-clock changes do not extend a recording. A reconnect/device clock reset requires a new session.
- Signal checks are nonclinical: missing sequences, timing gaps, flatline, declared-limit counts and adjacent steps above 20% of a declared range. The last heuristic is an explicit engineering threshold, not physiological validation. No range is invented for unknown sensors. Mean/min/max/standard deviation are descriptive, not a clinical conclusion.
- Chrome is the validated browser. Other browsers have not received full end-to-end verification. Device API availability must be tested later on the hardware's target platform.

## Netlify and optional email

`netlify.toml` builds `dist/` with Node 24 and uses `netlify/functions` for the existing email function. `_headers` applies CSP, no-referrer, anti-framing, MIME-sniffing protection and a restricted permissions policy. The local production preview uses the same header file. The public site has not been modified.

Email requires **server-side** Netlify variables:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (verified sender)
- `ARTERIA_ALLOWED_RECIPIENTS` (comma-separated explicitly authorized recipients)

Without all three, email safely returns a setup error and local encrypted downloads remain available. See `.env.example`; never put real keys in frontend source. The function validates streamed body size/format, restricts recipients, bounds provider requests, uses idempotency and applies a best-effort per-instance rate cap. This cap is not a distributed anti-abuse service; retain provider spending/rate limits when configuring public email. Origin checks are not authentication.

Local static servers do not execute Netlify functions. Server-function tests intercept provider calls; actual configured delivery and production hosting behavior require a separately approved deployment/delivery check.

## Hardware and CAC handoff

- [Architecture and code map](docs/architecture.md)
- [Nina's exact hardware requirements and adapter contract](docs/hardware-connection.md)
- [Features, tests and remaining limits](docs/verification.md)
- [2–3 minute demonstration plan](docs/demo-plan.md)
- [Student understanding and truthful AI disclosure](docs/student-guide.md)

AI assisted implementation and testing of this branch. The team must review, understand and personally verify the code, identify its actual contributions, and disclose AI assistance accurately. Original project attribution and MIT license are retained. No patient data, private research firmware, hardware protocol or clinical model was supplied or published.
