# AI Care Companion: audit, setup and verification

Updated 2026-10-26. Scope: AI grounding and verification; no push, merge or deployment.

## Audit and implementation

At the audited starting commit `98e2e10`, the app already had real OpenAI Responses and optional compatible Chat Completions requests, message and separate summary consent, comparisons, bounded context, cancellation/retry, unavailable guidance and opt-in local transcripts. No provider SDK dependency was missing: Node's built-in fetch implements the HTTP API.

Current entry point: `netlify/functions/care-chat.mjs`, exported route `/api/care-chat`. Frontend: `js/care/ui.js` checks GET availability, then requires message consent before POST. The summary selector builds only whitelisted aggregates; a second checkbox authorizes A and optional B. `js/care/request.js` trims whole conversation pairs to its UTF-8 budget. Saved transcripts are separate read-only localStorage history, never restored into request context. Browser requests go only to the same-origin Function; the server sends only the bounded prompt/messages/approved summaries to the provider.

**Provider: GroqCloud by default. Model: `openai/gpt-oss-20b` by default**, via Groq's OpenAI-compatible Chat Completions endpoint. Groq documents this as a text model with multilingual capability and currently offers a free plan subject to account/model quotas and 429 rate limits. This does not guarantee unlimited or permanent free access. English/Spanish output quality, account eligibility and live availability require a real-key check. `ARTERIA_AI_MODEL` can override the default. OpenAI remains available by setting `ARTERIA_AI_PROVIDER=openai` (default model `gpt-6-luna`); compatible providers still require their own model, trusted HTTPS base and hostname allowlist.

The system prompt is a server-only module, `netlify/lib/care-prompt.mjs`. It includes the versioned reference in `js/care/product-knowledge.js`, which records current routes, storage, privacy and capabilities. App-use/privacy topics are answered deterministically before provider calls. Individual recording interpretation without separate consent is answered locally; consented session output must meet measurement headings and numeric allowlists. Unknown data, safety and device limitations are explicit. No sensor wavelengths, calibration, clinical performance, diagnosis or treatment capabilities are invented.

A single 20-second deadline now spans provider connection **and** response body. Client request abort is forwarded upstream; stalled operations release concurrency slots and late responses are suppressed. Provider error bodies are cancelled without logging their content. Timeout gets a distinct 504/code and bilingual message; connection loss is distinguished from explicit stopping. Manual Retry remains deliberate, preserves the failed question and avoids duplicate bubbles; no automatic potentially billable retry is added. Rate responses include conservative Retry-After guidance.

Direct personal diagnosis requests and urgent red flags return clearly labeled deterministic safety guidance without provider calls. General questions such as “What is DVT?” remain eligible for real educational model responses. Prompt/output guards are limited; tests do not certify medical safety or guarantee every model response.

## Exact server variables

| Variable | Purpose |
|---|---|
| `ARTERIA_AI_ENABLED=true` | Required explicit enable flag |
| `GROQ_API_KEY` | GroqCloud server-only API key; preferred with default provider |
| `ARTERIA_AI_PROVIDER=groq` | Default; `openai` and `compatible` are optional |
| `ARTERIA_AI_MODEL=openai/gpt-oss-20b` | Default Groq model; OpenAI defaults to `gpt-6-luna` |
| `ARTERIA_AI_API_KEY` | Optional generic server-side key for selected provider |
| `OPENAI_API_KEY` | Optional key fallback only for OpenAI |
| `ARTERIA_AI_BASE_URL` | Compatible provider's trusted documented HTTPS API base only |
| `ARTERIA_AI_ALLOWED_HOSTS` | Exact comma-separated compatible-provider hostnames only |

The local test environment now has server-side Groq configuration. Its secret values were not displayed or committed. See [`ai-live-evaluation.md`](ai-live-evaluation.md) for actual Groq responses, the observed 429 rate limit and the analysis-format rejection. That live check verifies a working provider response for general English/Spanish conversation, not reliably formatted measurement analysis or clinical safety.

## Copy-paste local test (Node 24)

From the repository root:

```sh
npm ci
cp -n .env.example .env
chmod 600 .env
```

Edit the ignored `.env` privately. Keep the defaults `ARTERIA_AI_PROVIDER=groq` and `ARTERIA_AI_MODEL=openai/gpt-oss-20b`, set `ARTERIA_AI_ENABLED=true`, and add your real `GROQ_API_KEY` from the [Groq Console](https://console.groq.com/keys). Keep the key only in `.env` or a server-side Netlify environment setting. Never put it in browser code, a terminal command, GitHub, screenshots or chat. For optional OpenAI use `ARTERIA_AI_PROVIDER=openai`, `ARTERIA_AI_MODEL=gpt-6-luna`, and `OPENAI_API_KEY` (or `ARTERIA_AI_API_KEY`).

```sh
npm run ai:local -- --port=8781
```

Open `http://127.0.0.1:8781/#care`. This serves prebuilt public files and executes the **exact actual Function handler** on a loopback-only Node HTTP bridge, with streaming request validation and disconnect cancellation. It is not a mock server and does not log requests/messages/keys. Host/origin checks prevent accepting arbitrary remote browser origins. It does not emulate every Netlify platform behavior or send email. Restart after changing `.env`.

In another terminal in the same repository, run the focused live evaluation:

```sh
node scripts/evaluate-ai.mjs --url=http://127.0.0.1:8781/ --confirm-provider-call
```

The evaluation deliberately uses only public educational questions and the repository's synthetic session fixture, with explicit summary consent for the latter. It requires `--confirm-provider-call`, verifies the configured provider is GroqCloud, prints each actual response, and records rate-limit/contract failures per case. `--from=english`, `spanish`, `analysis`, `product` or `safety` selects a focused group. It reads no user recording/profile/transcript. Review actual responses and your provider usage dashboard; live response quality is not clinical validation.

To use a different local port:

```sh
npm run ai:local -- --port=8781
node scripts/evaluate-ai.mjs --url=http://127.0.0.1:8781/ --confirm-provider-call
```

No key needs to be in the second terminal: it talks only to the local Function. Static servers (`npm start`/plain Netlify Drop) do not execute Functions. For Netlify-specific local emulation, the official CLI can run `netlify dev` after a production build; this environment verified the loopback bridge, not the CLI/platform runtime.

## Netlify activation (requires later approval to deploy)

Add the server variables in Netlify Project configuration → Environment variables, scoped to Functions and the intended context. Build `npm run build`, publish `dist`, Functions `netlify/functions`, Node 24. Both the handler and imported server-only prompt must be bundled. Do not copy `.env` into `dist` or use frontend-prefixed variables. Deploying/pushing this commit requires separate approval.

On an authorized HTTPS preview, check GET `/api/care-chat`, then use non-sensitive consented questions. Availability means configured values, **not** successful inference. Run `node scripts/evaluate-ai.mjs --url=https://YOUR-PREVIEW.netlify.app/ --confirm-provider-call` only when you intend the model calls and synthetic fixture transmission. Confirm actual provider usage, English/Spanish quality, consent/revocation, retry, cancellation and errors. Verify native platform limits and secret exclusion before public enablement.

## Privacy, abuse controls and remaining limits

The request budget is 24 KiB, provider JSON 128 KiB and returned text 4,000 characters. Context is at most five prior pairs plus the latest user message. There are per-instance 10 requests/minute and two concurrent requests, plus declared Netlify native 15/IP/domain/minute. Origin checks are not authentication; no cloud account exists. Set provider spending caps, verify hosted limits, and do not treat per-instance limits as a distributed hard budget. `store:false` is not a zero-retention guarantee; provider policies apply.

Local message consent gates sending; summary consent separately gates data fields and is enforced by server schema too. Do not include identifiers in free text/channel labels. Summary A/B excludes raw samples, private notes, IDs, dates and profile. Selecting/removing summaries or revoking consent clears AI context. Local transcript saving is off by default, unencrypted and optional; clear/delete controls work. Cancelling cannot undo a request already received or billed by a provider. Browser late-response suppression and local upstream abort are tested; hosted disconnect propagation remains unverified. The service worker does not cache API responses.

Automated tests use explicitly labeled mocked upstreams. They cover English/Spanish app flow, context, quality instructions, single summaries and A/B comparisons, missing keys, timeouts, provider limits, network loss, cancellation/clear, consent, diagnosis requests, general education, urgent symptoms, privacy and secret exclusion. They do not guarantee real-model behavior, medical accuracy or live latency. The recent live evaluation is summarized in `ai-live-evaluation.md`; session-analysis formatting was rejected and quota limits prevented a successful real analysis check.

References: [OpenAI GPT-6 Luna model](https://developers.openai.com/api/docs/models/gpt-6-luna), [Responses/text generation](https://developers.openai.com/api/docs/guides/text), [CDC DVT/PE education](https://www.cdc.gov/blood-clots/about/index.html).
