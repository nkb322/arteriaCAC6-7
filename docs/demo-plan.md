# Demonstration plan — approximately 2 minutes 30 seconds

Use a foreground Chrome tab. Start from a fresh local browser profile or clear only disposable demonstration sessions. Use synthetic data and the included synthetic recording; never describe these as a real sensor or a clinical finding.

- **0:00–0:20:** State the app name, participants, target audience and problem. Explain that this build implements measurement acquisition infrastructure; biomedical hardware and clinical research are separate work.
- **0:20–0:40:** Open Photon acquisition, choose Simulation / Missing samples / 10 seconds, and start. Point out source, arbitrary units, changing raw values and timestamped samples. Explain that this uses the same validation/controller path planned for hardware.
- **0:40–1:00:** Let the stream pause. Show stale status, recovery, the chart gap and missing-sequence count. These are engineering checks, not a medical score.
- **1:00–1:25:** Open Overview and My trends. Inspect a saved dated session and reload to show IndexedDB persistence. Export CSV and JSON.
- **1:25–1:50:** Replay the selected JSON at 4×. Show that SIMULATED remains visible and original sample timing is preserved separately from browser receipt time.
- **1:50–2:10:** Switch to Spanish and demonstrate larger text/keyboard controls. Briefly show the retained clinic locator and encrypted-note screen. Do not rely on live clinic API availability or email delivery in the recording.
- **2:10–2:30:** Explain one coding challenge: fragmented frames, invalid input, stale source state, or preserving provenance across replay. State limitations: real adapter pending firmware, no clinical ML, local history is not encrypted/cloud-backed.

If verified hardware is later connected, replace the simulation opening with the real permission/connect/recording flow and show an unplug event. Distinguish a real optical waveform from any claim to measure thrombosis biomarkers. Keep a labeled recorded-data fallback ready.

The submission should accurately disclose AI assistance and student contributions. The existing interface and original MIT attribution remain in the repository. No submission materials are uploaded by these scripts.
