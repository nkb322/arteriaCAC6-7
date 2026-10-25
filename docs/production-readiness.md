# Final software readiness

Historical release note: this document describes the prior verification pass. See `completed-workflows.md` for subsequent local chat history, comparison and PWA implementation; the latest release handoff records current results.

Updated 2026-10-25. This is a deployable release candidate, not a claim of verified public operation or clinical validation.

## Completed in this pass

The existing provider integration was inspected against the official OpenAI text-generation API documentation. It uses the documented Responses HTTP API directly through server-side fetch; no SDK/runtime dependency is needed. Credentials remain server-side. Existing context, consent, summary minimization, bilingual behavior, bounds, generic errors, rate/concurrency guards and source labeling are preserved.

Added an explicit bilingual **Retry last message** control after request failure/cancellation. Retries require the current consent state and a deliberate click; they do not duplicate the user's bubble, run automatically or bypass server limits. Clearing/changing shared context removes retry content. Concurrent submissions are blocked during availability checks; clearing/stopping that pending operation prevents a later message transmission.

Added `npm run check:hosted -- https://YOUR-PREVIEW.netlify.app/`: a read-only deployment smoke checker for release HTML, security headers, referenced local assets, `/api/care-chat` routing, status schema and no-store caching. It sends no conversation, session or credentials. It does not prove successful inference or email delivery. Errors omit response bodies and the supplied URL to avoid printing sensitive material.

## Credential and deployment status

No `ARTERIA_AI_API_KEY` or `OPENAI_API_KEY` was configured in the authorized shell, and no local `.env` was present. Live inference was therefore not attempted. Mocked tests exercise browser → actual server handler → mocked upstream → browser, including failures. No mock is shown as a real provider in demonstration screenshots.

No Netlify token, linked project, CLI login or signed-in browser session was available. The Netlify browser showed the login screen. A hosted deployment cannot be created or verified until the project owner signs in. This is an account-access blocker, not an application availability test. No existing public deployment/settings were changed.

GitHub authentication was available outside the restricted network sandbox. The authorized normal development-branch push is attempted only after checks pass; exact remote verification is recorded in the final release handoff, not assumed here.

## Exact owner steps

1. Sign in to Netlify. Create a **separate new project**, importing `nkb322/arteriaCAC6-7`. Choose branch `codex/measurement-pipeline`, build command `npm run build`, publish `dist`, Functions `netlify/functions`, Node 24. Do not change the existing site's repository, branch, domain or deployment settings.
2. Add server-side variables scoped to Functions and the intended deployment context: `ARTERIA_AI_ENABLED=true`, `ARTERIA_AI_PROVIDER=groq`, `ARTERIA_AI_MODEL=openai/gpt-oss-20b`, and `GROQ_API_KEY` from Groq Console. Groq free-plan quotas apply. Optional OpenAI uses `ARTERIA_AI_PROVIDER=openai`, its enabled model (default `gpt-6-luna`), and `OPENAI_API_KEY` or `ARTERIA_AI_API_KEY`. Never paste keys into source or chat.
3. For an explicitly chosen compatible provider, set `ARTERIA_AI_PROVIDER=compatible`, `ARTERIA_AI_BASE_URL` and exact comma-separated `ARTERIA_AI_ALLOWED_HOSTS` in addition to its own key/model. See `ai-companion.md` for compatibility/security limits. Configure spending caps in the provider account.
4. Build/deploy the separate project; inspect Functions and logs without logging user messages. Run the hosted checker above. Then use the actual preview URL for English/Spanish app questions, follow-up, explicit summary review/sharing/removal, retry, cancel, errors and the offline guide. GET availability only proves configured variables, not successful credentials.
5. Verify recording → stop/save → history/reload → comparison → report preview/export; guest preferences and deletion; encryption/decryption; clinic service success/failure; mobile/keyboard navigation. Check console/network failures. Verify native Netlify rate limiting and absence of keys in client assets.
6. Email is optional and still unverified: it requires `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and explicitly authorized `ARTERIA_ALLOWED_RECIPIENTS`. Local encrypted download does not require email credentials. Do not send to others without authorization.
7. Approve production publication only after the hosted version passes. No production publication is authorized by these instructions alone. Static Netlify Drop can demonstrate local features but does not deploy AI/email Functions; use a full project build for the complete app.

## Remaining limits

Physical device firmware/protocol, channels/units/ranges, timestamps and sampling frequency are still required before implementing a real adapter. Imported hardware origin is declared, not independently verified. No diagnostic model is present. Medical safeguards are limited and not clinical certification. Browser automation used installed Chrome with desktop/tablet/mobile viewports, not physical mobile/Safari/Firefox or a formal screen-reader audit. PWA/service-worker support remains deferred to preserve privacy and avoid stale cached releases; the local offline guide is not a claim that an uncached site loads offline. Clinic/provider/Netlify availability requires external verification.

## CAC demonstration checklist (2–3 minutes)

- 0:00–0:20: purpose, local guest profile, nonclinical prototype and visible demo-data disclosure.
- 0:20–0:55: 10-second Photon recording, waveform, source and engineering quality explanation; stop/save.
- 0:55–1:25: saved history, date/source filters, notes, comparison, report preview and CSV/JSON export.
- 1:25–2:05: Aria. If live verified, consent to a non-sensitive question and follow-up; explicitly review and share a summary. Otherwise show the honest unavailable/offline guide state and explain the missing configuration. Never portray mocked output as live AI.
- 2:05–2:35: Spanish, local settings and privacy; encrypted local attachment; sourced clinic lookup if the service is available.
- 2:35–2:55: software architecture, hardware interface boundary, what was tested and what remains unverified. Disclose student and AI contributions accurately. Record this current UI rather than reusing the older rehearsal.

References: [OpenAI text generation](https://developers.openai.com/api/docs/guides/text), [Netlify function configuration](https://docs.netlify.com/build/functions/configuration/), [Netlify deployment documentation](https://docs.netlify.com/deploy/overview/).
