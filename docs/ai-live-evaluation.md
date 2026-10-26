# Live Groq response evaluation

## Final completion probe — 2026-10-25

The loopback-only function was started with the existing local server configuration. Only fixed, non-sensitive education prompts were sent; no session, profile, notes, local history, or raw measurements were included.

| Scenario | Result | Observed behavior |
|---|---|---|
| English DVT/PE education | Live Groq response received (HTTP 200) | Described DVT and PE in general terms and listed common warning signs. It did not claim Arteria can diagnose either condition. |
| English contextual follow-up | Live Groq response received (HTTP 200) | Used a garden-hose analogy to restate the distinction. No application instructions or measurements were requested or returned. |
| Spanish DVT/PE education | Rate limited (HTTP 429) | No model reply was returned. The application reports the provider limit; Spanish live behavior could not be verified in this run. |
| Structured measurement analysis | Not live-verified in this run | Existing tests verify malformed/incomplete analysis, unsupported numbers and rate limits fall back to the unchanged deterministic summary. A successful live structured response remains unverified. |

These are a small provider smoke test, not a clinical, safety, or general factual-reliability evaluation. Free-tier availability can change between requests. The deterministic product-navigation, privacy and urgent-symptom responses remain locally tested and do not depend on Groq.

Run date: 2026-10-26. Environment: local loopback AI function with the server-side key already configured; secrets were not displayed or added to source. Provider: **GroqCloud**. Model: **`openai/gpt-oss-20b`**. Inputs were non-sensitive public health-education questions and the repository’s explicitly synthetic recording fixture. No user recordings, notes, profile or chat history were used.

## Results

| Scenario | Result | Evidence |
|---|---|---|
| English health-education question | Live response received | Explained DVT and PE in plain language; stated an apparently clean recording cannot rule them out. It added an unsolicited **Find care** instruction and said listings could include hospitals, which the product cannot guarantee. The prompt was tightened afterward to avoid unsolicited navigation and unsupported facility promises. |
| English contextual follow-up | Live response received | Used a traffic-jam analogy to distinguish a clot in a deep vein from one lodged in a lung artery. It did not invent an Arteria control or measurement. |
| Spanish health-education question | Live response received after a separate attempt | Explained TVP and EP in Spanish without suggesting an Arteria button or path. |
| Navigation / CSV export | Passed deterministic local answer | Correctly named **My trends**, **Export CSV**, **Export JSON**, and said CSV import was unavailable at that evaluation's product version. Arteria-format CSV import was added in 1.1.0. No provider request was made. |
| Privacy / provider transmission | Passed deterministic local answer | Stated messages and recent chat go to an external provider after consent; aggregate summaries require separate consent; raw samples, notes and profile are excluded; provider retention is outside Arteria’s control. No provider request was made. |
| Medication question | Passed deterministic safety reply | Did not advise aspirin or treatment; directed the user to qualified care. No provider request was made. |
| Urgent breathing difficulty (Spanish) | Passed deterministic safety reply | Directed to immediate local emergency care without waiting for Arteria. No provider request was made. |
| Consented synthetic-session analysis | **Not verified live** | The real handler rejected one generated analysis with HTTP 502 / `analysis` because it did not satisfy the required headings/number validation. A later attempt returned HTTP 429. The invalid answer was not returned to the browser; the production handler intentionally suppresses unvalidated output, so its exact text was not captured. Mocked tests cover successful formatting and rejection of unsupported numbers. |
| Groq quota behavior | Live 429 observed | A later provider request was rate limited. The function returned a retryable rate status; the UI has a clear bilingual wait-and-retry message and deterministic offline technical summary. No automatic provider retry occurs. |

The actual live model replies follow. They are recorded to make review possible; they are not endorsed as clinical guidance.

**English conversation:**

> Deep vein thrombosis (DVT) is a blood clot that forms in a deep vein, usually in the leg. It can feel like a swollen, tender area and may look a little red or warm. If the clot breaks loose, it can travel through the bloodstream.
>
> Pulmonary embolism (PE) happens when a clot that has moved from a DVT (or another source) lodges in a lung artery. This blocks blood flow to part of the lung and can cause sudden chest pain, shortness of breath, or coughing up blood.
>
> Both conditions can be serious, but a clean-looking recording or a single symptom does not rule them out. If you notice swelling, pain, or breathing trouble, it’s safest to seek medical care right away. In Arteria, you can tap **Find care** to search nearby clinics or hospitals for a qualified assessment.

**English contextual follow-up:**

> Think of a DVT like a small traffic jam that starts in a deep road inside your leg. The jam (clot) blocks the flow of cars (blood) there, so the road can swell and feel sore.
>
> Now imagine a piece of that jam breaks off and drives all the way to the city’s main highway—your lung artery. That’s a pulmonary embolism. The jam now blocks a major route, causing a sudden traffic slowdown that can make you feel short-of-breath or chest-tight.
>
> So, DVT is the clot forming in a deep vein, while PE is the clot that travels and lodges in a lung artery, turning a local problem into a potentially life-threatening one.

**Spanish conversation:**

> La trombosis venosa profunda (TVP) es la formación de un coágulo dentro de una vena profunda, normalmente en la pierna o el muslo. El coágulo puede crecer y bloquear parcialmente el flujo sanguíneo, provocando dolor, hinchazón y enrojecimiento en la zona afectada.
>
> Cuando una parte de ese coágulo se desprende, viaja por la sangre hasta los pulmones y queda atrapado en una arteria pulmonar; eso se llama embolia pulmonar (EP). La EP puede reducir el flujo de oxígeno al pulmón y, en casos graves, poner en riesgo la vida.
>
> Aunque la TVP y la EP pueden no presentar síntomas evidentes, es importante buscar atención médica si se nota hinchazón, dolor o calor en una pierna, o si aparecen dificultad para respirar, dolor en el pecho o tos con sangre. La detección temprana y el tratamiento adecuado reducen el riesgo de complicaciones.

The first English reply’s Find care route exists, but promising nearby clinics or hospitals is unsupported. The system instructions now prohibit unsolicited Arteria directions in health-education answers and claims about specific facility types or availability. Because free-tier quota limits intervened, this exact English prompt was **not re-run after that prompt change**. The Spanish reply avoids an application-navigation claim. These replies are general language, not patient-specific interpretations or evidence of clinical validation.

## Reproduce

From the repository root, create a private ignored `.env` from `.env.example`, configure `ARTERIA_AI_ENABLED=true`, `ARTERIA_AI_PROVIDER=groq`, `ARTERIA_AI_MODEL=openai/gpt-oss-20b` and `GROQ_API_KEY` without printing the key. Then run:

```sh
npm run build
npm run ai:local -- --port=8781
```

In a second terminal:

```sh
node scripts/evaluate-ai.mjs --url=http://127.0.0.1:8781/ --confirm-provider-call
```

`--from=english`, `--from=spanish`, `--from=analysis`, `--from=product` and `--from=safety` select focused groups; omit `--from` for the complete sequence. Each provider call is deliberate and may consume free-tier quota. The analysis fixture is synthetic, and its send is explicitly marked as consented. Review actual outputs and Groq usage logs. A successful general conversation does not establish reliable structured measurement analysis or clinical safety.
