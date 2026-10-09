# Corpus and evaluation protocol

## Fictional corpus

Northstar Precision Components, Cedar Falls Plant produces AX-210 aluminum mounting brackets. Common equipment is conveyor C-12, hydraulic press HP-4, and compressed-air dryer AD-2; CL-7 is fictional coolant. All documents are revision 3, effective 2026-09-01, and explicitly marked as fictional. Do not apply their limits to real equipment.

| Category | Documents |
| --- | --- |
| Safety | SAF-001 isolation/restart authorization; SAF-002 coolant spill response; SAF-003 contractor access/hot work |
| Maintenance | MNT-001 conveyor service; MNT-002 hydraulic press inspection; MNT-003 air dryer service |
| Quality | QUA-001 bracket inspection/release; QUA-002 quarantine/disposition; QUA-003 gauge calibration |
| Operations | OPS-001 shift handover; OPS-002 changeover/batch traceability; OPS-003 staging/dispatch |

Each file lives at `public/demo/{category}/{id-lowercase}.md`. The operator seeds it with that directory's category; human categorization is authoritative. Public uploads are disabled. Safety owns authorizations, Maintenance owns equipment condition, Quality owns held-product release, and Operations owns scheduling and material flow. No role may bypass guards, restart isolated equipment without release, or falsify records.

## Suites

- `bun test`: deterministic workflow, failure, namespace filtering, upload rejection, metric, corpus versioning and idempotent/resumable seeding tests. Mocked decisions demonstrate application behavior, not Clef quality.
- `bun run eval`: validates document count/length, exact chunk reconstruction, internal document references, and gold evidence anchors. No network calls and no model-quality claim.
- `bun run eval:decisions`: real configured Clef, 18 routing cases and 16 guard cases. Includes each category, multi-category routing, ambiguous/out-of-scope intent, injection, harmful requests, unsafe output text, and benign safety questions. Provider errors are failures, never substituted with a keyword classifier.
- `bun run eval:live`: real embedding, chat, and decision calls against production ingestion/chunking/retrieval/workflow code. An ephemeral exact-COSINE vector store replaces Zilliz only. Fourteen retrieval/reference-answer cases, nine workflow rejection cases, unknown-equipment abstention, and malicious-source injection are tested. No remote vectors persist.
- `bun run eval:api`: real HTTP app and Zilliz list/ask journey against the already-seeded shared corpus. It verifies public POST uploads return 405 and different visitors see identical documents. Set `EVAL_BASE_URL` if needed. It checks status, category, cited document identity, and exact source lines, not factual entailment. It spends question-provider credits but never inserts or deletes vectors. Asks are paced to respect demo request limits. Seed and verify the matching checkout separately; use a test collection, not production.

Reports: `evals/results/decisions.json` and `evals/results/local-live.json`. Reports contain fictional answers and sources, never keys. They are ignored so future sensitive evaluation outputs are not accidentally committed.

## Retrieval and factual accuracy are separate

Gold cases in `retrieval.ts` name manually chosen relevant source paragraphs and expected answer facts. `goldLabels` resolves the paragraph anchors to source line spans. Recall@6 is the fraction of gold spans overlapping at least one retrieved passage from the correct document. MRR is the reciprocal rank of the first such passage. This is paragraph-span relevance, not exact fact coverage; chunks can split a long source line. Inspect quotes and expected facts separately.

Each case records:

1. **Oracle-category retrieval**: search the correct category set. This isolates embedding/chunking/search quality.
2. **Routed retrieval**: search the categories actually selected by Clef. Differences expose routing losses.
3. **Answer mechanics**: status, route, exact quotes and source lines.
4. **Explicit reference facts**: `answer-checks.ts` checks required facts in the answer, catching omissions a model judge can miss. These lexical checks can reject valid paraphrases and do not establish logical entailment.
5. **Offline reference/support judge**: Clef checks the entire answer, cited quotes, and expected facts. Unsupported or incomplete answers fail. If the complete judge input exceeds 1,500 UTF-8 bytes, it is marked `judge_input_limit`, not truncated or passed.
6. **Human review**: inspect each answer against the full gold paragraphs. Model judging is fallible and shares a decision model with the application; it is not an independent accuracy certificate.

The live local suite gates each reference case on full gold-span recall, correct routing, answered status, valid citations, explicit reference-fact coverage, and a supported rubric verdict. Negative cases must block before retrieval/chat, or abstain appropriately. No production accuracy percentage should be inferred from this small synthetic set.

## Release and production-time validation

Before deploying a model/prompt/chunking/retrieval change, run offline tests, live decision cases, local retrieval/answer cases, and the HTTP/Zilliz suite against a test collection. Review every failing case and manually check the small factual set. Preserve a reviewed baseline report with model IDs and add anonymized real failure examples as new gold cases. Expand with paraphrases, missing evidence, conflicting revisions, and realistic held-out plant questions before making production-quality claims. Do not tune on the held-out set.

Production continues cheap structural citation checks and required safety decisions; there is no extra factual judge per request. Use approved, privacy-scrubbed samples and incident reports for scheduled offline regression review. This feedback process is an operational protocol, not a logging/monitoring service implemented here. A runtime judge would add cost/latency and still would not establish truth.

## Reranking

Do not add a separate model merely to rerank. First compare oracle-category recall with routed recall and inspect misses. If useful evidence falls outside six candidates, widen candidate retrieval and evaluate a bounded Clef relevance decision against the same gold cases; preserve category coverage and reject oversized/malformed decisions. Only keep reranking if the measured recall/support improvement warrants added calls and latency. Reranking cannot recover evidence that was never retrieved. Baseline local recall is measured before adding it; no runtime reranking dependency is introduced.
