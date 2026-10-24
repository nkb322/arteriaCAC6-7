# Arteria

A biomedical research companion interface with a working measurement-session pipeline. The current source options are **synthetic simulation** and **recorded-session replay**. No physical device adapter, trained ML model, diagnostic score, or thrombosis detection is implemented.

The existing six-screen design, English/Spanish localization, clinic locator, accessibility controls and encrypted-note features are retained. Measurement channels, time, history and exports now come from the same validated session state.

## Run locally

Requires Node.js 20 or newer. There are **no runtime package dependencies** and no frontend build step.

```sh
npm start
```

Open http://127.0.0.1:8766. Do not open the HTML directly using `file://`; ES modules and browser crypto need an appropriate origin.

`npm start` serves static files on loopback only. It does not execute Netlify functions. The encrypted-email request requires the Netlify environment described below. Local encryption and decryption are browser features.

## Try the working demonstration

1. Open **Photon acquisition**.
2. Keep **Simulation** as the source, choose a scenario and duration, then select **Start acquisition**.
3. Observe samples entering the chart and Overview. The source stays **SIMULATED**.
4. **Missing samples / pause** pauses after three seconds, becomes stale, and resumes at six seconds. Sequence gaps are counted and drawn as gaps.
5. Select **Stop & save**, or let the requested duration finish. Open **My trends**. Select a dated session; reload to verify persistence.
6. Export CSV for analysis or JSON for replay. Use **Replay selected**, or select **Recording replay** and load the exported JSON. Replay preserves simulated/hardware origin and original receipt timestamps.
7. A reproducible synthetic recording is included at [`fixtures/simulated-session.json`](fixtures/simulated-session.json). It is not a real optical measurement.

Simulation scenarios: clean periodic synthetic signal, missing samples/pause, flatline, clipping at the declared simulator maximum, and malformed JSON frames. These are engineering test fixtures, not medical findings.

## Tests

Pure pipeline tests use Node's built-in runner:

```sh
npm test
```

For browser regression and real IndexedDB tests, install the single development dependency from the lockfile. The default browser is installed Google Chrome; runtime users need no package installation.

```sh
npm ci
npm run test:browser
```

If Chrome is installed elsewhere, set `CHROME_EXECUTABLE` to its executable path. If using a preinstalled Playwright package instead of `npm ci`, set `PLAYWRIGHT_MODULE_PATH` to that package directory. Browser tests launch an isolated profile and a local server on port 8767. They use synthetic data, fixture clinic responses, and intercepted email transport. They do not send email or contact a physical device. Results/screenshots are written to the ignored `test-results/` directory.

## Netlify

The existing `netlify.toml` remains unchanged: repository root is published, with functions in `netlify/functions`. The new frontend modules are ordinary static `.js` files. No build output or long-running backend is required for simulation, replay, IndexedDB, charts, or exports.

For the existing encrypted email function, configure **server-side** `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in Netlify and verify the sender with the provider. Never place credentials in frontend files. Missing configuration returns a setup error. The function and provider delivery are separate from the measurement pipeline.

Netlify production deployment has not been changed or exercised by this implementation. The automated tests verify local static delivery and existing crypto behavior with email transport intercepted. Authorize deployment separately before production testing. The public app does not upload measurement sessions to a server.

## Hardware integration

There is deliberately no USB baud rate, BLE UUID, Wi-Fi endpoint, sensor interpretation, or firmware command invented in this repository. See [the adapter contract and required hardware details](docs/hardware-connection.md). The controller already supports hardware descriptors, live/stale/disconnected states, and optional supplied battery; those branches have software tests, not physical-device verification.

## Data and privacy limitations

- Sessions persist in IndexedDB **when acquisition stops or completes**. Current acquisition is held in memory; there is no crash recovery or background autosave. Keep the tab open until saving completes. A navigation warning is shown during acquisition or unsaved recovery.
- If saving fails, accepted samples remain available for export/retry. New acquisition is blocked until the session is saved or explicitly discarded. Export a backup before deleting/discarding.
- IndexedDB is local browser storage, not encrypted storage, cloud sync or a clinical record. Clearing browser data removes sessions. Another person using the same browser profile can access them. The existing encrypted-note feature does not automatically encrypt measurement history or CSV/JSON exports.
- Limits: 100,000 accepted samples per session, up to 8 channels, internal frames up to 16 KiB UTF-8, replay import up to 24 MiB, acquisition up to 300 seconds in the controller (UI simulation choices are 10/20/60 seconds). Very large exports may exceed the replay import limit; use short demonstration sessions.
- Raw channel values must be finite numbers within the software's safe numeric magnitude (±`Number.MAX_SAFE_INTEGER`) and any adapter-declared channel range. A declared range is not automatically a clinically normal range.
- Incoming device time must increase with sequence numbers; a device reset/reconnect requires a new session. Device time is relative monotonic milliseconds, not inferred UTC. Browser receipt time is stored separately.
- The stale threshold is the larger of 1.5 seconds or five expected sample intervals. Browser timer throttling can affect simulation/replay arrival and stale detection; record the demonstration in a foreground tab.
- Signal checks are descriptive: sequence gaps, timing gaps, exact flatline in the recent window, declared-limit counts, mean/min/max/standard deviation. They are not validated physiological quality assessment or DVT detection. “No flags” means only that these checks did not flag the data.
- Source metadata in imported files is declared, not cryptographically attested. Replay of simulated data remains simulated; replay of a file claiming hardware origin is labeled as declared hardware, not a verified live device.
- The clinic directory is third-party OpenStreetMap data and can be incomplete. Existing encrypted email delivery still requires real configuration and a separately authorized delivery test.

See [architecture](docs/architecture.md), [implemented features and verification](docs/verification.md), and [the 1–3 minute demo plan](docs/demo-plan.md).

## Attribution and student contribution

Original project: `nkb322/arteriaCAC6-7`, MIT license. This branch adds AI-assisted software implementation and testing. Disclose that assistance in CAC materials and explain the portions you personally designed, implemented and understand. Research ambitions must remain separate from verified engineering behavior.
