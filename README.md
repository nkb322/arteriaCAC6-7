# Arteria — product release candidate

A local-first wearable research companion with Photon recording/replay, live charts, signal checks, recovery, saved sessions, comparisons, offline reports, encrypted notes, real clinic search and Profile & Settings. The optional Aria AI companion explains the app and explicitly shared recording summaries through a server-side provider endpoint.

**Physical hardware and clinical/diagnostic performance are unverified. Sample data is always labeled. Live AI is unverified without configured provider credentials; mocked tests are not a live model demonstration.**

## Run locally

Use Node 24 (Node 20+ supported by package engines):

```sh
npm start
```

Open http://127.0.0.1:8766. For production-like files/headers:

```sh
npm run build
PORT=8769 npm run preview
```

Static local servers do not execute Netlify Functions. Aria honestly shows unavailable and offers the local app guide; encrypted-note downloads work without email. Use Netlify's local function tooling or a separately approved hosted preview to test configured AI/email.

## Core workflow

1. Start a short Photon sample recording. Missing samples / pause demonstrates stale/resume and gaps through the common pipeline. Mock device is explicitly synthetic; no protocol is assumed.
2. Overview follows accepted samples; it has no medical wellness score. Stop saves a recording and recovery batches persist during acquisition.
3. My trends filters dates/source and compares sessions. Save notes, preview/download a report, export CSV/JSON or replay a session. Report previews are sandboxed and script-free.
4. Ask Aria about a recording opens a summary for review. Nothing leaves the device until both message and separate summary consent are checked and the user sends a request.
5. Profile & Settings saves a local guest name/avatar, recording/chart preferences and shared language/accessibility settings. Data controls export history, confirm deletion or clear local Arteria data.

## Tests

```sh
npm ci
npm test
npm run test:browser
npm run test:release
npm run test:profile
npm run test:product
```

There are no runtime npm dependencies. Playwright is pinned as a development dependency; browser suites use installed Chrome. Set `CHROME_EXECUTABLE` if needed. `PLAYWRIGHT_MODULE_PATH` can select an existing Playwright installation. Test results/screenshots are saved under ignored `test-results/`; ports 8767/8768/8770/8773 are disposable loopback previews.

The product server under tests uses an explicitly labeled mocked provider and the real handler. It is excluded from the public build. All service calls in automated tests are fixtures/intercepted mocks; no real AI inference, email send or physical device is claimed.

## AI configuration and privacy

[AI setup and security](docs/ai-companion.md) explains the server-only variables, provider adapter, limits, consent and live acceptance checks. `.env.example` contains blank placeholders only. `ARTERIA_AI_ENABLED` defaults to disabled. Set an explicit provider/model/key on the server; never put keys in browser code. OpenAI Responses is supported, plus explicitly allowlisted HTTPS providers implementing the documented compatible Chat Completions format.

Profile, preferences, recordings, checkpoints, notes, CSV/JSON and reports are **unencrypted local browser data**. Only the separate passphrase-encrypted note attachment is encrypted. AI sends user-approved messages/recent context and an optional reviewed aggregate summary to the configured provider; it does not automatically upload recordings, notes, identity or location. Clear/revoke removes local AI context but cannot remove data already sent externally. Clinic searches use Nominatim/Photon with city or consented approximate location. Google Fonts supports the existing visual identity.

Crash recovery restores committed batches; the newest uncommitted tail may be lost. Browser eviction/clearing can remove records. Without Web Locks, recovery is manual after other recording tabs are closed. Keep exports as backups. The parser/import/controller bounds and physical integration contract remain documented in `hardware-connection.md` and `architecture.md`.

## Netlify

`netlify.toml` builds with Node 24, command `npm run build`, publish directory `dist`, Functions directory `netlify/functions`. The build explicitly excludes tests, environment files, Git metadata and backend source from public files. `_headers` supplies CSP and related security headers.

For the full app deploy Functions as well as dist. Static-only drag/drop publishes local features but omits AI/email functions. Optional encrypted email additionally needs `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `ARTERIA_ALLOWED_RECIPIENTS` in server-side configuration. Existing recipient restrictions and provider safeguards remain. No push, main merge or public deployment was performed.

## Handoff

- [Product changes and limits](docs/product-upgrade.md)
- [AI setup and security](docs/ai-companion.md)
- [Architecture](docs/architecture.md)
- [Hardware specifications still needed](docs/hardware-connection.md)
- [Profile settings and privacy](docs/profile-settings.md)
- [Demo plan](docs/demo-plan.md)
- [Student review and AI disclosure](docs/student-guide.md)

AI assisted implementation, debugging, testing and documentation. Students must review the code, personally verify the app and accurately document their significant technical contributions. No clinical model, patient dataset, confidential firmware or biomedical prediction was fabricated.
