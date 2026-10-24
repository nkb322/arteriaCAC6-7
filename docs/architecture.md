# Measurement architecture

The active application stays static HTML/CSS/JavaScript. `app.js` retains navigation, localization, accessibility, companion, clinic search and note encryption. `js/measurement/ui.js` binds the new measurement modules to the existing six-screen layout. Legacy localization emits `arteria-language` so measurement text can re-render in English or Spanish without losing state.

```text
Simulation / recording / future hardware
                 ↓
  adapter + bounded frame decoder
                 ↓
 canonical sample validation / ordering
                 ↓
 raw session buffer + receipt timestamps
                 ↓
 descriptive processing → Overview + acquisition waveform
                 ↓ stop / completion
 IndexedDB session → dated history → CSV / JSON → replay adapter
```

- `schema.js`: versioned channel/source metadata and resource limits.
- `parser.js`: fragmented/multiple UTF-8 JSON app frames, bounded buffering and bad-frame recovery. Hardware may supply another decoder.
- `validator.js`: finite numeric values, declared ranges, complete channels, optional supplied battery, strictly increasing sequence/time.
- `controller.js`: source lifecycle, generation guards, duration/sample limits, stale state, finalization, persistence errors and unsaved recovery.
- `processing.js`: unchanged raw values plus versioned descriptive statistics; gaps and exact flatline/clipping flags. No disease inference.
- `session-store.js`: IndexedDB transactions resolve only on commit; durable saved sessions, listing and deletion.
- `export.js`: versioned JSON, validated import and quoted CSV with units/provenance/separate clocks. CSV cells protect leading spreadsheet formula markers.
- `adapters/simulation.js`: deterministic 25 Hz synthetic optical-like values in arbitrary units; five test scenarios and deliberately split frames.
- `adapters/replay.js`: recorded acquisition timing with 1×/2×/4× playback, original origin and original receipt timestamps preserved.
- `chart.js`: responsive SVG, units, localized accessible descriptions, elapsed acquisition time and gaps. Visual reduction retains bin extrema and discontinuities; exports retain every accepted sample.
- `i18n.js`: English/Spanish measurement labels, states and error messages.

Two distinct concepts are stored: `descriptor.origin` (`simulated` or `hardware`) and `mode` (`stream` or `replay`). A cable or a replay operation does not change sample origin. Imported origin is declared metadata, not attestation. The controller assigns a fresh session ID and host receipt times; replay also stores original receipt time and `replayOf.startedAt`. Device-relative time remains unchanged.

States: disconnected → connecting → demo / live / replay. No accepted samples for the configured threshold produces stale; another accepted sample restores streaming. Explicit stop/completion closes the source and saves; source failure produces error and an interrupted saved session. Saving failures keep the buffer available and block silent replacement; retry or explicit discard resolves recovery.

Only one recording is active. Every source callback is scoped to a generation, so late packets from a stopped source are ignored. The real adapter must implement transport cleanup during cancellation. IndexedDB saves at session finalization, not every sample. Closing/crashing mid-acquisition may lose unsaved data; the app warns on normal navigation.

The existing email function remains separate. No measurement upload, cloud account, server database, or trained ML service was introduced. Netlify can serve all new modules as static assets with its existing root publish configuration.
