# Manufacturing documentation assistant

A demo for floor supervisors: upload plant documents, route questions with Cloudflare Clef, retrieve category-filtered evidence, and return guarded answers with exact source citations. Human-selected categories are **Safety, Maintenance, Quality, and Operations**.

Demo only. Documents and numerical limits are fictional, not approved for plant operations. Browser workspaces are isolated by signed cookies, not authenticated plant-wide accounts.

## Run locally

Requires Bun and the credentials/model IDs in `.env.example`. Copy that template to `.env` only if `.env` does not already exist. Never commit credentials.

```sh
bun install --frozen-lockfile
bun run setup:vectors
bun run dev
```

Upload UTF-8 TXT/Markdown files, choose their category, then ask a question. Limit: 1 MB/file, 16 documents/workspace. Vector setup is explicit; startup never recreates a collection. See [BUILD_PLAN.md](BUILD_PLAN.md) for boundaries and deployment details.

## Fictional company documents

[Corpus guide](evals/README.md): Northstar Precision Components, Cedar Falls Plant, producing AX-210 aluminum mounting brackets. `public/demo/{category}/` contains **12 controlled-document examples**, three per category, approximately **800–975 words each**. They include owners, approvals, revision history, procedures, measurable limits, escalation, and records.

Upload each document with its directory's category. The older short `public/demo/*.md` examples are retained for compatibility; evaluations use the new category directories exclusively.

## Evaluation

```sh
bun test                # deterministic unit tests, no credentials required
bun run typecheck
bun run eval            # corpus and gold-fixture checks, no provider calls
bun run eval:decisions  # live Clef routing + input/output safety cases
bun run eval:live       # real embeddings/chat/Clef; local exact COSINE retrieval
bun run eval:api        # running app + Zilliz HTTP journey; seeds disposable workspace
bun run check:providers # provider and collection smoke checks
```

Live runs spend provider credits. JSON reports go to ignored `evals/results/`. `eval:api` leaves its fictional documents in a new remote workspace; local evaluation does not persist remote vectors. See [evaluation protocol](evals/README.md) for gold recall, offline answer judging, human review, and release gates. The local vector store is not a Zilliz ANN benchmark.

Production checks validate citation IDs/quotes and require input/output safety decisions. **They do not prove factual correctness.** Evaluate factual support offline before changing models, prompts, chunking, or retrieval. No runtime factual judge or separate reranking model is added.

## Railway

`railway.json` selects Railpack, Bun install/build/start, and `/api/health`. Set `.env.example` variables in Railway, plus `RAILPACK_BUN_VERSION=1.4.2` and `NODE_ENV=production`. Use an independent production Zilliz collection, `APP_ORIGIN`, and signing secret. Railway supplies `PORT`; the service binds to `0.0.0.0`. Local `.env` is not imported automatically. Run vector setup separately; no Railway volume is needed.
