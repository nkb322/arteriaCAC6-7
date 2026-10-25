# Student review and AI disclosure

This branch is AI-assisted implementation, debugging and testing. Do not describe generated changes as entirely student-written. The repository's earlier inline comments also acknowledge AI assistance. This document does not independently establish who authored earlier work.

Before submitting, each team member should record the work they actually did: original concept/interface, hardware work, protocol design, personally written code, test execution, bug fixes, analysis, and demonstration preparation. Fill in names and concrete examples from real work; do not invent contributions to satisfy a rubric.

A factual disclosure can say: “We used an AI coding assistant to help implement and test the measurement pipeline, recovery, exports, reports and reliability improvements. We reviewed [specific modules], personally verified [specific workflows], and contributed [actual work]. Physical hardware and clinical validation are described separately.” Replace bracketed sections with truthful, demonstrated contributions.

## Explain the software in your own words

1. **What is a sample?** An increasing sequence number, a device-relative acquisition timestamp and a dictionary of declared raw channels with units. Browser receipt time is added separately.
2. **Why frame parsing?** USB or BLE can split a message across packets or deliver several together. The adapter decodes the actual protocol; the common validator rejects bad values/order before they affect history or statistics.
3. **Why separate clocks?** Packet arrival includes communication delay. Replaying at 4× changes arrival time but must not change original sample timing. Wall-clock adjustments must not extend a 20-second recording.
4. **How do gaps appear?** A sequence jump counts missing samples. A device-time jump flags irregular timing and creates a visible break, rather than drawing a continuous line over absent data.
5. **How is recovery safe?** One-second batches and metadata commit together; other tabs cannot claim an actively locked recording. Recovery revalidates committed chunks and labels the result interrupted. The last uncommitted tail can still be lost.
6. **Why incremental statistics?** Each accepted sample updates count, mean and variance without rescanning all earlier samples. Reports replay the same calculations over the saved data.
7. **What is not medical?** Flatline, limit and large-step checks are engineering observations. A clean synthetic waveform does not prove sensor contact, a thrombosis biomarker or a diagnosis.
8. **What is private?** Encrypted-note attachments require a passphrase. Measurement history, notes and reports are unencrypted browser data. Location searches and optional email have external-service boundaries.
9. **What makes comparisons valid?** Matching meanings, units and acquisition conditions. The UI keeps source labels and separate axes so unlike channels are not silently combined.
10. **What remains?** Nina's documented protocol, a tested physical adapter, sensor/calibration verification and any future clinical evidence. No validated ML model has been supplied.

## Personally verify before recording

Run the documented tests, then manually record a gap scenario, recover a checkpoint, compare two sessions, save a note, open an offline report and unlock an encrypted note. Explain one real failure and its fix. Confirm the final video uses SIMULATED/REPLAY labels and makes no biomedical-performance claim beyond the evidence.
