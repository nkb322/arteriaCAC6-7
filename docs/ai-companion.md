# Aria: optional AI companion

## Status and boundaries

Aria has a real server-side provider integration, not a keyword chatbot presented as AI. No live API credentials were available during development. OpenAI and compatible-provider request construction, validation, failures and browser workflows were tested with explicitly labeled mocks; **live provider inference is unverified**. The availability endpoint reports server configuration, not a successful live credential test.

The normal app, recordings, replay, history, profile, reports, encryption and local guide work without AI. AI is disabled unless explicitly configured. Static local servers do not execute Netlify Functions, so Aria shows an unavailable state and offers the separately labeled offline app guide. Safety guidance is deterministic and labeled as non-AI.

## Server configuration

Set these in Netlify **Project configuration → Environment variables**, scoped to Functions and the intended preview/production context. Never paste real values into frontend files, `.env.example`, screenshots or logs.

| Variable | Meaning |
|---|---|
| `ARTERIA_AI_ENABLED` | `true` to allow provider requests; otherwise disabled |
| `ARTERIA_AI_PROVIDER` | `openai` (default) or `compatible` |
| `ARTERIA_AI_MODEL` | A text model actually enabled for your provider account; required, no model/cost assumed |
| `ARTERIA_AI_API_KEY` | Server-only provider key |
| `OPENAI_API_KEY` | Optional fallback only for `provider=openai`; never reused for a compatible provider |
| `ARTERIA_AI_BASE_URL` | Compatible provider's documented HTTPS API base, usually ending `/v1` |
| `ARTERIA_AI_ALLOWED_HOSTS` | Explicit comma-separated hostname allowlist for the compatible base |

OpenAI uses `https://api.openai.com/v1/responses`, an instructions field, a bounded message history, `max_output_tokens:700`, and `store:false`. See the official [text generation guide](https://developers.openai.com/api/docs/guides/text) and [conversation-state guide](https://developers.openai.com/api/docs/guides/conversation-state). The server parses message output text/refusals from the HTTP response rather than relying on an SDK-only convenience field. No provider SDK/runtime dependency is required.

Compatible providers must implement the documented Chat Completions-shaped `/chat/completions` endpoint with system/user/assistant messages, `max_tokens` and `choices[].message.content`. Verify your chosen provider's actual documentation and policies before configuring it. The base URL is administrator configuration, never browser input. It must be HTTPS, match the explicit hostname allowlist and contain no embedded credentials/query/fragment; redirects are rejected. Literal IP/local hostnames are rejected. Administrators must still choose a trusted public provider and avoid private DNS aliases. The UI identifies the compatible destination hostname.

## Privacy and context

Opening Aria checks only same-origin service configuration. It does not send recordings, profile details or chat content to a provider. Sending requires an unchecked-by-default message-consent checkbox. Recent conversation pairs are held in memory and bounded to fit the UTF-8 request budget; they are not written to IndexedDB/localStorage.

Users can select a saved recording or choose **Ask Aria about this recording** in My trends. This opens a local preview; it sends nothing. A second checkbox authorizes that reviewed aggregate summary for this conversation. It includes declared origin/replay mode, duration, counts, channel labels/units, min/max/mean and engineering flags. Raw samples, note text, profile, device IDs, recording IDs and dates are excluded. Labels themselves may still be sensitive; review them. Selecting a different recording or revoking consent clears prior AI context so it cannot silently be resent.

Clear conversation cancels the client request, revokes sharing and clears in-memory context. Cancel/clear suppress late responses; the provider may already have received an in-flight request. Clearing cannot erase data already held by the provider. `store:false` is not a promise of zero provider retention. Review provider data policies before sending anything sensitive. No HIPAA/regulatory/clinical compliance is claimed.

## Endpoint and controls

`netlify/functions/care-chat.mjs` exposes `/api/care-chat`. GET returns configuration availability and provider label. POST accepts only validated language/messages and an optional separately consented summary. Message role/length, request bytes (24 KiB), summary fields/counts/provenance, response bytes and reply length are bounded. Untrusted labels stay in user-message data rather than system instructions. The model has no tools and cannot retrieve sessions or perform app actions.

Server requests have a timeout; errors return generic codes, never provider payloads, keys or user messages. Origin and content-type checks reject cross-origin browser requests, but origin is not authentication. Netlify's declared per-IP/domain limit is 15 requests/60 seconds; a per-instance cap allows 10 provider requests/minute and at most two concurrent provider calls. See [Netlify rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/). These are not an absolute distributed spending limit; set provider spending/usage caps, monitor usage, and verify platform enforcement in the actual hosted preview before public enablement.

System instructions restrict Aria to application/engineering explanations and appointment questions. It must not diagnose DVT, give medication/treatment instructions, predict medical risk, invent values or claim a hardware connection. A limited output guard catches some obvious prohibited claims. It is **not** clinical validation or a comprehensive medical-safety proof. Urgent English/Spanish phrases trigger local emergency-care guidance without a provider call; this is not a symptom assessment. General escalation wording is consistent with [CDC blood-clot warning information](https://www.cdc.gov/blood-clots/about/index.html); the app uses the user's local emergency number rather than guessing a country.

## Deploy and verify

Use Node 24, `npm run build`, publish `dist` and Functions directory `netlify/functions`. A static-only Netlify Drop of `dist` does not deploy the AI/email functions. For the complete product use a separate Netlify project with Git build or CLI upload including Functions. No production deploy or remote push was performed here.

In an approved HTTPS preview: check `/api/care-chat` configuration; send a non-sensitive app question; verify a genuine provider reply and follow-up in English/Spanish; verify consent blocking and explicit summary review; remove the summary and inspect the next request; test cancellation, provider failure/rate limit and offline guide. Confirm no key appears in Network/client bundles and no raw sessions/notes are sent. Check native rate-limit logs and provider spending caps. Only then mark live AI verified.
