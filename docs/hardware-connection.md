# Connecting real hardware

No physical hardware has been connected or tested. The application exposes simulation, an explicitly synthetic lifecycle mock, validated Arteria JSON/CSV import and replay, plus generic Web Bluetooth and Web Serial adapters. The hardware adapters consume the **Arteria reference stream** below; they do not infer or implement Nina's device protocol. The example recording JSON and adapter configuration are application formats, not specifications of the future device firmware.

## Browser reference-stream adapter

Choose **Bluetooth LE (reference stream)** or **USB serial (reference stream)** in Photon, load a local device configuration JSON, and press **Connect device** to invoke the browser's permission chooser. After connection, press **Start acquisition**. The browser APIs require a secure context (localhost qualifies); Bluetooth requires a supported Web Bluetooth browser and notifications, while serial requires Web Serial. A blocked or unsupported API reports an error instead of falling back to simulation.

The configuration declares the confirmed device/channel metadata and transport parameters. Example serial configuration:

```json
{
  "schemaVersion": 1,
  "transport": "serial",
  "descriptor": {
    "schemaVersion": 1,
    "origin": "hardware",
    "deviceId": "board-label-from-firmware-owner",
    "deviceName": "Optical sensor",
    "sampleRateHz": 25,
    "channels": [{"id":"optical","label":"Optical signal","unit":"a.u.","min":0,"max":4095}]
  },
  "serial": {"baudRate": 115200}
}
```

For Bluetooth, set `transport` to `ble` and supply `ble.serviceUUID` and `ble.characteristicUUID` (16-bit or full UUID strings). The selected characteristic must send notifications. For serial, `serial.baudRate` is required. Both transports currently expect UTF-8 newline-delimited JSON matching the canonical sample shape in the Adapter contract; one sample per line. Timestamps are acquisition-relative milliseconds, sequence numbers increase, and `raw` contains every configured channel in its declared unit. Battery percentage is optional. No commands are sent to the board: firmware must begin streaming on connection/notification subscription and implement start/stop behavior externally. This narrow reference protocol is suitable for a software emulator, not a claim about physical hardware.

Arteria CSV import accepts files produced by **Export CSV** (up to 24 MiB). It validates the repeated `descriptor_json` metadata, channel IDs/units, sequence, timestamps, values, and declared ranges before replay. An arbitrary sensor CSV without this metadata is rejected with a format error rather than guessing channel meanings or units.

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

## Mock and physical acceptance checklist

The mock introduces a connection delay, fragmented canonical app frames, duplicates, malformed frames and an intentional source failure, followed by a new-session restart. Its descriptor always says simulated. The independent dropout scenario tests silence, stale state, resumed samples and sequence gaps. Neither specifies Nina's protocol.

Once Nina supplies the communications contract, write fixture tests from her exact packets, then verify permissions, start/stop acknowledgments, real acquisition timing, units/scaling, batching, physical disconnect/reconnect and any battery/contact metadata against a firmware log. A saved de-identified hardware recording should reproduce the decoded values and notes in replay/export/report. Clinical performance remains a separate validation task.

### Optional replay pause (software only)

The controller recognizes optional synchronous `pause()` and `resume()` methods only for replay adapters. `ReplayAdapter` freezes its scheduling clock while retaining sample timestamps and provenance. Stop drains/stores samples normally. Real stream adapters must not advertise these methods until pause semantics are specified and tested; ordinary signal gaps remain gaps rather than user pauses. This does not establish a physical connection.
