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

The main screen is Q&A only; document downloads are in the menu icon at the top right. Document administration is CLI-only until authenticated admins exist. Ask a question; no uploads are needed or allowed. `POST /api/documents` returns 405 even if called directly. Listing and questions use only the operator's shared corpus, never old browser-uploaded documents. The runtime store exposes read operations only.

Startup/build never seeds documents. `/api/health`, document listing, and questions fail closed until all 12 documents of the expected corpus version are indexed. Existing unrelated vectors are left untouched.

## Browser chat history

Completed question/answer pairs and citations are saved in `localStorage` on this browser, capped at the latest 30 turns. There is no chat database, server file-history dependency, or account synchronization. Clear history asks for confirmation and removes the browser copy. Corrupt/unavailable storage is reported without overwriting it or losing the current answer. Questions remain independent; saved turns are not sent back as LLM context. Saved answers may become stale after corpus changes. Anyone using the same browser profile can see these chats.

The legacy server history endpoint returns 410 and the ask/health routes do not read or write server history files. Previously created server history files are left untouched.

## Seed token troubleshooting

`CONFIGURATION_MISSING` means the write token is absent; `CORPUS_NOT_READY` means the selected source version has not been completely seeded. Verification does not create documents. Prefer a dedicated `ZILLIZ_SEED_TOKEN`. For a local operator run, if your existing `ZILLIZ_TOKEN` already has write permissions, explicitly opt in:

```sh
bun run seed:corpus --use-runtime-token
bun run seed:corpus --verify
```

This override exists only in the operator CLI. There is no automatic token fallback or public write endpoint. Deploy a query-only runtime token. HTTPS Zilliz endpoints are normalized to explicit port 443 to avoid the SDK's misleading default-port warning.

## Source of truth and updates

Northstar Precision Components, Cedar Falls Plant produces fictional AX-210 aluminum mounting brackets. `public/demo/{category}/` contains 12 controlled documents, three per category, roughly 800–975 words each. Directory categories are designated by the operator, not relabeled by the model. See the [corpus guide](evals/README.md).

The shared namespace is derived from the source contents, filenames, categories, and chunk boundaries. Changing these creates a new corpus version instead of overwriting a previous one. Run the seed command once for the new checkout, verify it, and then deploy that same checkout. Repeating the command skips completed documents and repairs incomplete ingestion in that version. Version 2 uses deterministic document/passage IDs and upserts, so overlapping runs converge instead of creating duplicate imports; prefer one run to avoid duplicate embedding costs. The new namespace leaves old duplicate imports, old versions and old browser workspaces untouched. Cleanup is a separate operator task.

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

Production validates citation IDs/quotes, requires input/output safety decisions, and makes a separate evidence-verification call using the configured chat model before returning answered drafts. **These do not prove factual correctness.** Evaluate factual support offline before changing models, prompts, chunking, or retrieval. No separate reranking model is added.

## Railway

`railway.json` selects Railpack, Bun install/build/start, and `/api/health`. Set runtime variables from `.env.example`, **excluding `ZILLIZ_SEED_TOKEN`**, plus `RAILPACK_BUN_VERSION=1.4.2` and `NODE_ENV=production`. Use a separate production collection and a query-only runtime token, with independent `APP_ORIGIN` and signing secret. Run operator setup/seeding against that collection before deploying the matching source revision.

Railway supplies `PORT`; the service binds to `0.0.0.0`. Local `.env` is not imported automatically. Source Markdown ships with the app for version checks; vectors persist in Zilliz, so no Railway volume is needed. See [BUILD_PLAN.md](BUILD_PLAN.md) for historical architecture and the curated-corpus amendment.
