# Live evaluation snapshot

Run on 2026-10-09 with `cloudflare/clef`, `qwen/qwen3-embedding-8b`, and `deepseek/deepseek-v4.1-flash`. Raw fictional responses are in ignored `evals/results/`.

| Check | Observed result |
| --- | --- |
| Deterministic tests | 46 passed |
| Typecheck / production build | Passed |
| Live Clef routing | 18/18 passed |
| Live Clef input/output guards | 16/16 passed |
| Live unsafe-query workflow rejection | 9/9 blocked before retrieval/chat |
| Unknown-equipment / malicious-source cases | Both abstained |
| Oracle-category gold-span recall@6 | Full coverage on 14/14 cases |
| Actual-routed gold-span recall@6 | Full coverage on 14/14 cases |
| Oracle-category MRR | 0.786 |
| Offline model support judge | Passed 14/14 answers, but inspection found false positives |
| Explicit reference facts, applied to saved live answers | 13/14 passed |
| Combined automated local suite after reference-fact recheck | 24/25 passed |

## Findings and changes

- Early chat responses exhausted their token budget in reasoning and returned no JSON. The adapter now requests reasoning disabled, with a bounded 1,000-token completion budget. All 14 reference answers returned valid structured output in the subsequent run.
- Early quotes omitted evidence for qualifications included in answers. Quotes now allow up to 600 characters and the prompt requests minimal contiguous evidence covering every substantive claim. The complete output still must fit the unchanged 1,500-byte fail-closed safety decision limit.
- The model judge passed the multi-category inspection/container answer although it omitted the reference rubric's zero-failure acceptance rule. An explicit required-fact regression check now catches that omission. This recheck used saved live answers; it was not another model run.
- Parent inspection also found that the dispatch answer added an escalation instruction not supported by its displayed quote. The instruction appears in the full OPS-003 document, but the quote is incomplete support. The probabilistic judge missed this. This is a separate review finding, not counted as an automated test failure.

Full paragraph-span recall is not full factual accuracy. Required-fact regex checks can reject valid paraphrases, and the decision judge can miss omissions or incomplete citation support. Independent human review remains outstanding; these results are not production certification.

## Not checked

The provider smoke check confirmed real Clef, embeddings, structured chat, and compatible Zilliz collection readiness. The full HTTP/Zilliz corpus evaluation was not run; local recall uses exact COSINE search, not Zilliz approximate nearest-neighbor search. No Railway deployment or browser acceptance run was performed for this task.

No reranker was added: the baseline retrieved all labeled spans within six passages. Keep the gold cases and compare support/recall before adding bounded Clef reranking. No runtime factual judge was introduced.

## Subsequent read-only corpus change

After replacing public uploads with a shared versioned corpus: 50 deterministic tests, typecheck, fixture checks, and production build passed. Tests cover direct upload rejection, identical shared documents across visitors, shared namespace selection for questions, incomplete-corpus fail-closed behavior, idempotent/resumable seeding, and exclusion/preservation of old workspace data. The UI detector reported no findings on the read-only document panel.

Actual operator seeding was blocked because `ZILLIZ_SEED_TOKEN` is not configured. A read-only `seed:corpus --verify` attempt hit a Zilliz connection timeout. No live vectors were inserted, changed, or deleted by this task. Read-only credential permissions, full live HTTP acceptance, browser screenshots, and deployment remain unverified. Configure a query-only runtime token and separate operator token, seed and verify the matching checkout, then run the HTTP evaluation.
