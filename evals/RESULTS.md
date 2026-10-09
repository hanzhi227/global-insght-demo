# Live evaluation snapshot

## Latest follow-up — 2026-10-09T19:24:00Z

Same configured models as the earlier baseline. Fresh provider runs, not rechecks of saved answers:

| Check | Latest observed result |
| --- | --- |
| Deterministic tests during eval changes | 51 passed |
| Typecheck / production build during eval changes | Passed |
| Latest checkout after concurrent history changes | 73 tests passed, 1 failed; typecheck/build fail in the stale server-history route test |
| Live Clef routing / standalone guards | 18/18 and 16/16 passed |
| Gold-span recall@6, oracle and routed | Full coverage on 14/14 cases |
| Oracle MRR | 0.821 |
| Required facts / offline support judge | 14/14 passed both |
| Coding-agent inspection of displayed factual support | 12/14 supported; see [case review](REVIEW.md) |
| Unsafe-query workflow rejection | 8/9 blocked before retrieval/chat |
| Unknown equipment | Abstained |
| Malicious-source injection | Failed with `INVALID_MODEL_OUTPUT`; no draft exposed |
| Combined automated local suite | **23/25; release gate fails** |
| HTTP/Zilliz suite | Blocked at health check (503); 0 question cases completed |

Changes: requested JSON-format chat output, strengthened mandatory-qualification and exact-support instructions, clarified energized-intervention blocking, accepted an equivalent spill-rubric paraphrase with a regression test, added required-fact checks and persisted reports to the HTTP suite, and made malicious-source errors explicit in the local report. This eval follow-up added no runtime factual judge, reranker, retry loop, or dependency. Concurrent workflow work added `checkInput` and a separate runtime `verifyAnswer` call using the same configured chat model; that is not an independent-model accuracy guarantee.

The inspection/container answer now includes zero acceptance on the latest run, but an intermediate run still omitted it. Dispatch still adds an escalation absent from its displayed quote; spill adds qualifications absent from its displayed quote. Both passed the model judge. Prompt changes are **not a reliable fix** for this support gap.

Repeated live runs also exposed unstable guard decisions and model-output validation failures. Diagnostic calls returned valid JSON with quotes exceeding the 600-character schema limit; `INVALID_MODEL_OUTPUT` does not necessarily mean malformed JSON. A prior run incorrectly abstained on the HP-4 pressure test despite retrieved evidence. Intermediate reports are retained in ignored `evals/results/`; the final run is reported even though it is not green.

Read-only `seed:corpus --verify` returned `CORPUS_NOT_READY`. `ZILLIZ_SEED_TOKEN` is absent, so operator seeding and full HTTP acceptance are blocked. The runtime token was not reused for writes. No stored vectors were inserted, changed, or deleted during this follow-up.

The checkout changed concurrently during this task. The latest validation fails in `src/server/history/routes.test.ts`: it still expects cookie-backed server history, but the endpoint is now retired and takes no request argument. Do not interpret the earlier passing test/build checks as acceptance of the latest checkout. Reports currently identify corpus/model versions but do not fingerprint application source, which limits baseline attribution during concurrent edits.

**Do not release on these results.** Resolve the guard miss and displayed-support failures, obtain independent human review, and seed/verify a test collection before HTTP/Zilliz acceptance. This remains a small, development-used synthetic set, not a production accuracy estimate.

## Earlier baseline

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
