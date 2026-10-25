# Measurement analysis

Arteria calculates a technical analysis after each non-empty acquisition completes. The calculations run locally, without a network request, and are stored on the recording in IndexedDB. Replay uses the same validated-sample pipeline and produces the same metrics with its original source and replay label.

## Data path

`adapter → parser → sample validation → SignalProcessor → technical analysis → IndexedDB`

The calculation module is `js/measurement/analysis.js`. It reuses the deterministic processing layer for accepted/rejected counts, sequence gaps, timing gaps, channel mean, population standard deviation, minimum, maximum, flatline, clipping and large-step checks. Additional fields include device-time duration, declared nominal sampling rate, effective accepted-sample rate `(accepted samples - 1) / duration`, an estimated expected-sample completeness, missing/rejected percentages, range, and first/second-half standard deviations.

Completeness is estimated against the declared nominal frequency and device-time duration. It is a data-coverage estimate, not an overall signal grade. Rejected frames are not necessarily missing device samples, so the two counts stay separate. No SNR is calculated because the prototype does not define a defensible noise component. No physiological unit conversion, clot score, diagnosis, or risk estimate is produced.

## AI explanation and privacy

The offline technical report is immediately available. The optional “Analyze with AI” action opens Care Companion with an aggregate summary. The user must accept both the ordinary AI message consent and the separate reviewed-recording consent before sending. The request contains source/mode, counts, rates, completeness, and per-channel summary statistics. It excludes raw samples, recording notes, profile details, device identity, local timestamps, and waveform images. No analysis is transmitted automatically after a scan.

Analysis mode asks the existing server-side Care Companion provider for five labeled sections in English or Spanish. The function validates the request summary, section headings, medical-claim safety, and all numeric claims against the shared summary. Invalid or ungrounded model output is rejected; the local deterministic summary remains available. This check does not prove factual quality for every non-numeric sentence, so AI text is identified separately from calculated data.

A valid AI explanation is saved locally with the recording, provider label and model identifier when returned, timestamp, analysis version, and comparison session IDs plus their calculated summaries. It is available offline after reload, appears in HTML reports and JSON exports, and can be deleted independently. Deleting the recording also deletes its saved explanation. Session data, reports, and exports remain unencrypted local files; nothing syncs to a cloud account.

## Testing

Run the deterministic and request-validation tests with `npm test`. Run the production build and desktop/mobile browser flow with `npm run test:analysis-browser`. The browser test uses the actual Netlify Function handler with a test-only mocked provider; it does not verify live model quality or a real hardware device.
