# Architecture and code map

The seven-view application retains its original measurement architecture with an upgraded visual system. `app.js` owns navigation, dictionary localization, accessibility, clinic search, read-aloud and encrypted notes. `js/care/ui.js` owns the optional AI conversation and explicitly labeled offline guide. `js/measurement/ui.js` connects the measurement core to Overview, Photon and My trends. `arteria-language` and `arteria-view` events synchronize language/visible-view rendering.

```text
Simulation / mock device / recorded replay / future hardware adapter
   → bounded framing/decoder → validation → accepted raw samples
   → incremental engineering processing → live views
   → incremental IndexedDB checkpoint journal
   → stop/completion → final session + atomic journal removal
   → history / notes / comparison / CSV / JSON / offline HTML report
   → recorded replay through the same decoder/validation/controller path
```

## Core

- `schema.js`: version, numeric/channel/source constraints and resource limits. This is the app interchange schema, not an assumed device protocol.
- `parser.js`: split/batched UTF-8 JSON frames, bounded buffering, malformed/truncated-byte recovery. A real adapter can supply another decoder.
- `validator.js`: complete declared raw channels, safe finite values, documented ranges if present, increasing sequence/device time and optional supplied battery.
- `processing.js`: incremental Welford statistics and engineering flags in O(channels) per sample. `processSamples` uses the same processor for history/reports. No medical score.
- `controller.js`: one acquisition, source lifecycle, monotonically timed progress/staleness, generation guards, callback cleanup, checkpoint scheduling and unsaved-data handling. Wall-clock receipt dates are distinct from device time and are clamped nondecreasing.
- `session-store.js`: IndexedDB v2 migration retains existing v1 final sessions. Separate metadata and append-only checkpoint chunks commit atomically. Finalization waits for pending checkpoints; saving final data removes the journal in the same transaction. Recovery revalidates data and uses Web Locks to exclude live owners. Unsupported lock APIs require explicit manual recovery after other tabs close.
- `export.js`: compact versioned JSON with validated import, original replay receipt timestamps and notes; CSV with units/provenance and separate clocks. Text formula prefixes are neutralized without corrupting negative numeric values.
- `chart-data.js`: pure min/max-bin geometry retaining extrema and missing-sample discontinuities. `chart.js` renders it accessibly at the visible viewport width; `report.js` uses the same geometry in an offline, script-free HTML report.

## Sources

- `adapters/simulation.js`: synthetic 25 Hz arbitrary-unit optical-like signal with clean/dropout/flatline/clipping/malformed scenarios. Deliberately fragmented app frames exercise the parser.
- `adapters/replay.js`: 1×/2×/4× playback with original acquisition timing, origin and receipt dates retained separately from current browser receipt.
- `adapters/mock-device.js`: explicitly synthetic lifecycle double: connect delay, stream, duplicate/malformed frames, error/disconnect and a new-session restart. No firmware assumptions.

`descriptor.origin` (`simulated` or `hardware`) and session `mode` (`stream` or `replay`) are separate. A real communication link does not make synthetic samples real. Imported origin claims are not cryptographic attestation.

## Interface and existing services

History filters actual session dates, offers channel-specific graphs, notes, reports and side-by-side comparison; different units are never overlaid or silently normalized. Notes and reports are unencrypted and explicitly disclosed.

Clinic searches are consent-driven, cancellable/bounded, validate returned coordinates, filter type/access/radius, and render names as text. Location is not persisted. Encrypted notes use the existing PBKDF2/AES-GCM format, with local download independent from optional allowlisted email. Aria sends opt-in messages and explicitly reviewed recording summaries through the server-only `/api/care-chat` endpoint. The offline app guide and safety guidance are labeled separately from actual provider replies; live inference requires configured credentials and remains unverified in this release.

The source-status popup shows actual controller state. Demo identity is explicitly not an account. Dialog focus returns to its opener and navigation supports back/forward. Errors/empty/loading states are localized.

## Release boundary

`npm run build` publishes only the allowlisted static application to `dist/`; Netlify builds that folder and keeps server functions separate. No accounts, server measurement database, telemetry, new runtime framework, or clinical model was introduced. `_headers` is used by both production configuration and the isolated static preview.

## Local profile and preferences

`js/profile/preferences.js` validates the local guest/measurement preference record; `js/profile/ui.js` renders the seventh screen. Language/accessibility controls delegate to the existing handlers and storage keys. The profile reads the existing controller/store through `measurementInfo`, `historyJSON` and `clearRecordings`, rather than creating a second measurement pipeline. Recording defaults apply without changing an active acquisition; chart-only preferences affect display geometry, not stored measurements. See `profile-settings.md` for storage, reset and export boundaries.

## Optional AI boundary

`js/care/session-summary.js` constructs and revalidates a whitelist of aggregate statistics. `js/care/request.js` trims whole conversation pairs to the UTF-8 request budget. `js/care/safety.js` provides limited deterministic escalation/output guards. The client requires message consent and a separate session-summary checkbox, retains context only in memory, and clears context on revocation. The server accepts no caller-selected endpoint/model/system role, embeds untrusted summary labels only in user data, and calls the administrator-configured provider. No tools or direct browser provider keys exist. See `ai-companion.md` for limits and hosted verification.

`js/measurement/filters.js` supplies date/source filtering without changing recorded samples. Reports share the existing geometry; the preview uses a script-free sandboxed iframe and native modal focus. `js/product.js` translates new screen copy using the existing language event, without duplicating preferences.
