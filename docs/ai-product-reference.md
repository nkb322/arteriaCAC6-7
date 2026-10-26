# Verified Arteria product facts for AI

Product reference version: `1.0.0`. The machine-readable source of truth is [`js/care/product-knowledge.js`](../js/care/product-knowledge.js); the server includes it as structured JSON in [`netlify/lib/care-prompt.mjs`](../netlify/lib/care-prompt.mjs). App-use and privacy questions that match verified topics receive deterministic local replies before any provider request. Session-specific questions without a separately consented summary receive a local consent explanation.

## What the current interface supports

| Screen | Verified route and behavior |
|---|---|
| Overview | **Overview** shows saved recording context, engineering checks and navigation actions. There is no wellness or DVT score. |
| Acquisition | **Photon acquisition** starts with **Simulation**, a visibly synthetic source. **Stop & save** ends a recording; a configured duration also completes it. **Recording replay** accepts Arteria session JSON, not CSV. No physical sensor adapter is connected or verified. |
| History | **My trends** contains dated sessions, filters, charts, per-sample inspection, comparisons, session notes, report preview, print/PDF and CSV/JSON export. The graphs show declared units and sources; they do not establish medical trends. |
| Clinic search | **Find care** searches public listings by city/ZIP or with explicit approximate-location consent. Arteria does not guarantee facility type, services, open hours or appointments. |
| Encrypted note | **Share securely** creates/decrypts a separate passphrase-encrypted note attachment. Optional email needs server configuration. Ordinary recordings, notes, profiles and reports remain unencrypted. |
| Assistant | **AI Companion** requires message consent before provider requests and separate consent for a reviewed aggregate recording summary. A/B comparison is supported. Raw samples, notes, profile, dates and identifiers are excluded. Conversation context is bounded and held in memory. Optional transcript saving is off by default, local, unencrypted and never restored into AI context. |
| Profile | **Profile & Settings** stores guest profile, language, accessibility, recording duration, chart window/grid and local-data controls in browser storage. There is no cloud account or sync. |

## Storage and transmission

Recordings and analysis reports use browser IndexedDB. Notes, guest profile and preferences use local browser storage. Optional transcript history uses local storage only when enabled. These are local to that browser/device and are not encrypted. Exported files are not encrypted. Only the separate encrypted-note attachment is protected by its passphrase. Clearing local data cannot erase downloaded exports or information already received by an AI or email provider.

After message consent, the user’s message and recent in-memory conversation are sent from the server function to the configured external AI provider. A recording’s reviewed aggregate summary is sent only with separate summary consent. GroqCloud is the configured default in this environment; OpenAI is an optional server-side provider. Arteria does not promise provider retention or deletion. The function never exposes provider keys in browser assets.

## Signal and clinical limits

The built-in simulator emits synthetic optical channel values at 25 Hz in arbitrary units. They are demonstration values, not physiological measurements. Timing gaps and missing sequence counts are computed engineering checks; their cause is unknown. Flatline, clipping and range checks are engineering rules, not clinical quality metrics. Imported provenance is declared and not authenticated. The hardware microcontroller, sensors, firmware, calibration, placement and transport protocol are not supplied. Arteria is not clinically validated and does not detect, diagnose or rule out DVT/PE, calculate medical risk, or recommend treatment.

## Reliability behavior

The product classifier handles verified navigation, storage/privacy, export, deletion, clinic, hardware, accessibility and signal-check questions locally. For allowed model requests, the system prompt provides the product reference plus a strict feature inventory; the function rejects unsupported session numbers, missing analysis sections, and selected unsafe medical claims. These checks reduce known failure modes but cannot guarantee every free-form answer is factually correct. When Groq returns a rate limit, the user sees a wait-and-retry message and can still use the deterministic local engineering summary.
