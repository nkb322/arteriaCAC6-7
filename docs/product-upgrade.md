# Product upgrade release candidate

Historical release note: this document describes the prior verification pass. See `completed-workflows.md` for subsequent local chat history, comparison and PWA implementation; the latest release handoff records current results.

Pre-upgrade fallback: `e57c7f0`, tagged locally as `arteria-cac-verified-e57c7f0`. No hardware protocol, raw measurement algorithm, main branch or public deployment was changed.

## Product changes

- A coherent typography/spacing/surface system, local line icons, stronger data-card hierarchy, calm optical accents, readable forms, touch targets and large-text mobile navigation.
- First-recording onboarding, state-driven empty/dashboard cards, saved-session count and working report/history/recording quick actions.
- Concise Photon source guidance and plain-language signal-quality explanations while preserving visible sample/replay labels, numerical diagnostics, storage/recovery and acquisition state.
- Trends filters for dates, all/90-day history and declared source/replay, with invalid-range messages and reset. Existing comparisons retain separate units and source labels.
- Sandboxed, script-free report preview with keyboard dismissal/focus restoration; polished offline reports with timezone-bearing dates, source labels, statistics, graphs and saved notes.
- Optional provider-backed Aria with context, loading/cancel controls, suggested questions, clear labels, explicit message and separate recording-summary consent, unavailable/error states and an offline guide. See `ai-companion.md` for security/setup and verified limits.
- Clinic/sharing/profile screens retain their real workflows under the shared responsive visual system. No new accounts, sensitive profile fields, cloud storage or runtime dependencies were added.

## Verification and practical limits

The pre-upgrade 83-check suite was rerun in an isolated fallback checkout. New tests exercise the actual AI handler with mocked upstream responses and browser HTTP requests, not a fabricated model demonstration. Production tests use synthetic measurement fixtures and controlled service responses. Exact final totals are recorded in the release handoff.

During the audit, fixes addressed mobile large-text overflow, a chat subtitle incorrectly inheriting the status-dot width, developer-oriented primary copy, unclear first-use/error states and lack of direct report/session explanation flows. Measurement parser/controller/storage tests remain intact. Model replies are plain text, and imported data/user labels are rendered safely.

No live AI keys, real email delivery, physical device, clinical model or Netlify deployment were verified. The new AI's medical guard is limited and does not establish clinical safety. Do not demonstrate mocked test responses as live AI. Static previews deliberately show AI unavailable. The service is opt-in and disabled by default.

Installable PWA/service-worker caching was deferred to avoid introducing stale medical-data assets, caching private requests or delaying core verification. Other browsers and formal assistive-technology certification remain unverified. Chrome desktop/tablet/mobile plus English/Spanish and text/contrast preferences are the tested target.
