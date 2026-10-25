# Completed local-first workflows

Updated 2026-10-25. Builds on verified fallback `4720f5a` (118 checks); exact final test counts and release hash are in the release handoff.

## AI and local conversation history

The server-side OpenAI Responses / compatible Chat Completions integration is retained, with bounded context, generic errors, limits and separate sharing consent. Aria can now review two recordings: select A and optional B, review both minimal summaries, then separately consent to sharing. My Trends comparison and Overview recent-change actions prepare this review without sending data. Changing either selection clears conversational context and retry data. Notes, raw samples, IDs, profile and dates are omitted. The provider receives labeled A/B summaries with separate units and origins; differences are engineering observations, never medical predictions.

Local transcript saving is **off by default**. Enabling it saves only future chat bubbles, up to 20 bounded entries, to `arteria-chat-v1` in localStorage. It is unencrypted, not a cloud backup, and may contain text/values users choose to discuss. Saved history is displayed separately and **never** used to construct provider requests. Reload restores no message or session-sharing consent. Unchecking saving deletes the local transcript; Delete history, Clear conversation and Profile's full data clear remove saved entries. Profile full clear disables saving. Another tab receives storage-change events. Existing message/retry/cancel and explicit consent controls remain intact. Data already sent to a provider cannot be erased locally.

Live inference still needs a server-side provider key and model. No key was supplied; mocked integration is not a live-model verification.

## Dashboard, charts and trends

Recent recordings open their actual saved session. Activity controls summarize the filtered stored records by local calendar day; clicking a day filters the same history. Quality tables show accepted/missing/rejected/timing-gap counts per recording, preserving synthetic/replay labels. Mixed channel units are never averaged together and there is no health score. Chart inspection uses a keyboard/touch range input to reveal an actual sample index, relative time, value and units; the plot marks that point. Rendering does not modify samples.

First-recording guidance can be enabled/disabled in Profile using the existing preference mechanism. Existing display name, avatar, language, accessibility, recording and chart preferences remain functional.

## Photon replay pause

Replay supports Pause/Resume. Pausing freezes adapter playback and active acquisition duration; it does not invent missing readings or change original device timestamps. Stop & save works while paused. Simulation and pending physical adapters do not expose pause controls. Optional synchronous adapter `pause()` / `resume()` methods are documented, but currently enabled only for replay; no physical-device capability is assumed. Recovery continues to preserve committed samples after interruption. Stopping still saves automatically; there is no decorative second Save action.

## Reports and PDF

Comparison HTML includes the actual two session reports, separate units/source metadata, graphs, quality flags, dates and notes, with an explicit nonclinical comparability caution. Download and preview use the same generator. Report preview permits same-origin parent access and modal printing, but **no scripts, forms, navigation or external resources**. Imported/user text remains escaped. Print / Save PDF calls the browser print dialog; available PDF destinations depend on browser/OS. This avoids an unnecessary PDF dependency. Browser automation checks the generated report and print invocation, not a physical printer or every platform's PDF dialog.

## Installable/offline app

Production build generates `/sw.js` from `scripts/service-worker-template.js`, with a SHA-256 version derived from all public shell bytes. A manifest, PNG/SVG app icons, install prompt and browser home-screen support are included. HTTPS or localhost is required. Installation UI depends on browser support; use browser menu → Install app, or on iOS Safari → Share → Add to Home Screen. Physical OS installation remains unverified.

The worker precaches an explicit allowlist: HTML, application JavaScript/CSS, manifest and icons. No API route, Function, provider URL, import fixture, raw sample, transcript, report or private storage is cached. Only same-origin GET allowlisted shell paths are served from the release cache; all other traffic passes through normally. Saved recordings/preferences/transcripts remain in their original IndexedDB/localStorage. After one successful complete shell install, offline reload can open saved recordings, simulate/replay, inspect charts, export local files and use the labeled offline guide. AI, email and clinic search still need connectivity and explain failures. First use without any cached shell requires a connection.

New workers install a full new shell and wait. The Update button asks confirmation and refuses while acquisition/save/unsaved data is active. Activation removes only older `arteria-shell-*` caches, leaving other applications' caches alone. Explicit update reloads; normal first installation does not reload. Closing all tabs can also allow normal browser activation. No private data is migrated to a cache or automatically sent during updates.

Based on [MDN service-worker guidance](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) and [installability guidance](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

## Preserved integrations and external limits

Clinic city/ZIP and permission-based location, real sourced result details/directions, failure states and encrypted note flows remain in the existing application. They are tested with controlled network responses. Actual provider/clinic availability, real email delivery, Netlify hosted routing/rate enforcement and physical hardware are not established by local tests. No account/authentication or clinical model was added. Do not overwrite the existing public site until approved.
