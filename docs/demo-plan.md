# CAC recording walkthrough — about 2 minutes 50 seconds

Use Chrome in a foreground tab, a known local preview and synthetic data. Prepare one saved clean session before recording so comparison has a second recording. No step needs real hardware, a clinic API response, email credentials or a cloud deployment.

- **0:00–0:20:** Introduce Arteria, the student team and intended audience. Explain that this demonstration proves the software pipeline using clearly labeled synthetic data; wearable validation is separate.
- **0:20–0:45:** Open Photon acquisition and start a 10-second Missing samples / pause recording. Show changing values, accepted samples, recovery-checkpoint count, stale state, resumed data and the visible gap.
- **0:45–1:05:** Open Overview to show the state-driven summary. State that there is no medical wellness score or DVT inference.
- **1:05–1:30:** In My trends, inspect the dated session and select another recording for comparison. Point out duration, accepted samples, quality flags, available channels, units and distinct source labels. A common source/units does not establish clinical comparability.
- **1:30–1:55:** Save a short appointment/research note and download the HTML session report. Show its graph, provenance, engineering checks and notes. Explain that reports/history are unencrypted, while the separate note-sharing feature encrypts attachments.
- **1:55–2:15:** Replay a session at 4×. Point out that SIMULATED remains attached. Switch to Spanish or demonstrate the keyboard/accessibility dialog.
- **2:15–2:35:** Explain recovery using the checkpoint counter and an already recovered interrupted session. If recording a refresh live, let at least two checkpoint batches commit, then refresh; avoid losing time on the browser's navigation confirmation.
- **2:35–2:50:** State one real coding challenge and how it was tested. Close with limitations: physical adapter awaits Nina's protocol, no clinical model or validated biomarker result, and AI assistance is disclosed with actual student contributions.

The mock source can replace the dropout segment if showing connection failure/restart is more compelling. Keep a saved recording ready if a live timer or external service behaves unexpectedly. Optional clinic search/encrypted-note unlock can be shown briefly if the video remains under 3 minutes; focus on causal programming behavior rather than touring every page.

Rehearse personally and verify the exact submitted commit. Use only genuine student contribution claims; see `student-guide.md`. Nothing in these scripts uploads a video or submits the competition entry.
