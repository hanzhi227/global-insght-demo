# Manufacturing documentation assistant

A read-only demo for floor supervisors: Cloudflare Clef routes questions to a shared curated corpus, category-filtered retrieval finds evidence, and answers include guarded source citations. Categories are **Safety, Maintenance, Quality, and Operations**.

Demo only. Documents and numerical limits are fictional, not approved for plant operations. There is no login; all visitors see the same public demo corpus. Signed browser cookies support request limits, not document ownership.

## Run locally

Requires Bun and the credentials/model IDs in `.env.example`. Copy the template to `.env` only if `.env` does not already exist. Never commit credentials.

Use separate Zilliz credentials:

- `ZILLIZ_TOKEN`: query/search and collection-inspection permissions only, for the running app.
- `ZILLIZ_SEED_TOKEN`: operator-only write/schema permissions, for explicit setup/seeding. **Do not put this token in the deployed app's Railway Variables.**

```sh
bun install --frozen-lockfile
bun run setup:vectors         # operator token; creates/verifies collection, never drops one
bun run seed:corpus           # operator token; indexes missing curated documents
bun run seed:corpus --verify  # runtime token; read-only corpus verification
bun run dev
```

Ask a question; no uploads are needed or allowed. `POST /api/documents` returns 405 even if called directly. Listing and questions use only the operator's shared corpus, never old browser-uploaded documents. The runtime store exposes read operations only.

Startup/build never seeds documents. `/api/health`, document listing, and questions fail closed until all 12 documents of the expected corpus version are indexed. Existing unrelated vectors are left untouched.

## Source of truth and updates

Northstar Precision Components, Cedar Falls Plant produces fictional AX-210 aluminum mounting brackets. `public/demo/{category}/` contains 12 controlled documents, three per category, roughly 800–975 words each. Directory categories are designated by the operator, not relabeled by the model. See the [corpus guide](evals/README.md).

The shared namespace is derived from the source contents, filenames, categories, and chunk boundaries. Changing these creates a new corpus version instead of overwriting a previous one. Run the seed command once for the new checkout, verify it, and then deploy that same checkout. Repeating the command skips completed documents and repairs incomplete ingestion in that version. **Run one seed command at a time.** Old versions and old browser workspaces are retained; cleanup is a separate operator task.

The earlier short `public/demo/*.md` examples are retained for compatibility but are not seeded or retrieved. Browser visitors can download static Markdown but cannot change the repo or stored corpus through this app.

## Evaluation

```sh
bun test                # deterministic tests, no credentials required
bun run typecheck
bun run eval            # corpus and gold-fixture checks, no provider calls
bun run eval:decisions  # live Clef routing + input/output safety cases
bun run eval:live       # real embeddings/chat/Clef; ephemeral exact COSINE store
bun run eval:api        # read-only HTTP + Zilliz journey against the seeded corpus
bun run check:providers # provider and collection smoke checks
```

Live runs spend provider credits. Reports go to ignored `evals/results/`. `eval:api` verifies uploads are rejected and distinct visitors see identical documents; it does not insert or delete vectors. Use a test collection. See the [evaluation protocol](evals/README.md) and [observed results](evals/RESULTS.md). Local exact-COSINE retrieval is not a Zilliz ANN benchmark.

Production validates citation IDs/quotes and requires input/output safety decisions. **These do not prove factual correctness.** Evaluate factual support offline before changing models, prompts, chunking, or retrieval. No runtime factual judge or separate reranking model is added.

## Railway

`railway.json` selects Railpack, Bun install/build/start, and `/api/health`. Set runtime variables from `.env.example`, **excluding `ZILLIZ_SEED_TOKEN`**, plus `RAILPACK_BUN_VERSION=1.4.2` and `NODE_ENV=production`. Use a separate production collection and a query-only runtime token, with independent `APP_ORIGIN` and signing secret. Run operator setup/seeding against that collection before deploying the matching source revision.

Railway supplies `PORT`; the service binds to `0.0.0.0`. Local `.env` is not imported automatically. Source Markdown ships with the app for version checks; vectors persist in Zilliz, so no Railway volume is needed. See [BUILD_PLAN.md](BUILD_PLAN.md) for historical architecture and the curated-corpus amendment.
