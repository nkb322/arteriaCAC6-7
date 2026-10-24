# Connecting real hardware

No physical hardware has been connected or tested. The application currently exposes only simulation and validated Arteria JSON replay. The example JSON format is an **application interchange format**, not a specification of the future device's firmware.

## Information needed

Provide the board/microcontroller and sensor part numbers; firmware version/source or the relevant communications portion; target OS/browser; and several consecutive de-identified packets exactly as transmitted (including framing/newlines or a binary hex dump).

For each channel provide raw versus firmware-derived meaning, units/scaling, documented range, calibration, ADC resolution if relevant, sampling rate, batching and timestamp/sequence semantics. Say whether the firmware reports battery and any validity/contact flags. Include start/stop commands, acknowledgments, reset behavior, reconnect behavior and any packet checksum.

Transport-specific details:

- **USB serial:** whether a serial port is exposed, baud rate, encoding, framing, data/parity/stop bits, flow control, USB identifiers if known, and whether opening the port resets the board.
- **BLE:** advertised name/service UUIDs, read/write/notification characteristic UUIDs, notification layout, byte order, units, packet/MTU fragmentation, pairing requirements, and command semantics.
- **Wi-Fi:** HTTP/WebSocket or other protocol, endpoint/network setup, message schema, authentication mechanism (do not publish secrets), TLS support, CORS and browser local-network requirements.

If ML exists separately, provide model format, preprocessing, input window/rate/order/units, outputs, dataset provenance and held-out evaluation. No model has been invented here.

## Adapter contract

A source adapter has:

```js
{
  descriptor: {
    schemaVersion: 1,
    origin: 'hardware', // only for a real acquisition source
    deviceId: hardwareSpec.deviceId,
    deviceName: hardwareSpec.deviceName,
    sampleRateHz: hardwareSpec.sampleRateHz,
    channels: hardwareSpec.channels // IDs, meaning, units and optional ranges
  },
  mode: 'stream',
  async start({onChunk, onEnd, onError}) { /* open source with explicit user action */ },
  async stop() { /* cancel reads, remove listeners, release locks, close connection */ }
}
```

`hardwareSpec` must be populated from confirmed specifications. The adapter translates actual firmware messages into canonical samples (`mapped` below denotes that translation):

```js
{
  sequence: mapped.sequence, // increasing nonnegative safe integer
  deviceTimeMs: mapped.deviceTimeMs, // increasing, acquisition-relative milliseconds
  raw: mapped.raw, // every declared channel ID: numeric value in declared units
  // batteryPercent: optional supplied value, 0–100
}
```

By default `onChunk()` receives newline-delimited JSON samples or UTF-8 byte chunks. `FrameParser` handles fragmented/multiple app frames. A hardware adapter can provide `createParser(onSample, onReject)` returning `{push(chunk), finish()}` to decode another wire protocol and map it to canonical samples. It must bound its buffers and validate checksums/framing as applicable. `finish()` must report a partial final frame. The common validator still runs after decoding.

`start()` may resolve after the connection opens; it must not wait for the entire recording. `onEnd()` reports normal source completion. `onError()` reports source failure; accepted samples are retained and the session is marked interrupted. The controller invalidates callbacks on stop, preventing late data from contaminating another session. An adapter must also clean up its own in-flight connect attempt on cancellation; test that with the actual transport. A reconnect creates a new session.

Hardware clock conversion belongs in the adapter. Preserve acquisition timing for batches. Never substitute browser packet-arrival intervals for acquisition timing without labeling the limitation. Any firmware-computed metric needs separately documented meaning and units; do not silently insert it into raw optical channels. The current processor derives engineering statistics into `session.derived` and never modifies raw samples.

## Integration steps after specifications arrive

1. Implement one confirmed adapter under `js/measurement/adapters/` and a decoder fixture test from real packets.
2. Add an explicit hardware source option in `ui.js`; map its connection action to `controller.start(adapter, options)`. Keep simulation/replay available and labeled.
3. Determine whether Start means “start recording an existing stream” or sends a documented acquisition command.
4. On the target computer verify permission denial, connection, channel units/ranges, acquisition timestamps, unplug/disconnect, stale/resume, reset, export and stop/release. Confirm battery absence is shown as unavailable.
5. Record a short de-identified hardware session and replay it. Compare decoded/exported values against the firmware log.
6. Only after those checks call this adapter hardware-verified. Unit tests using fake hardware callbacks establish software behavior, not a physical connection or clinical accuracy.

The Netlify app can communicate directly with a supported browser's USB/BLE APIs; neither requires a cloud ingest server. Wi-Fi requires separate endpoint/browser compatibility checks. Do not disable browser security or invent a protocol to bypass missing specifications.
