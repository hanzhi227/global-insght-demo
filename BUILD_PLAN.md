# Manufacturing documentation assistant — build contract

Implementation approved. User-confirmed additions: decision-model category routing; human-designated categories during document upload; embedding and persistence in Zilliz; Railway + Railpack hosting; OpenRouter for decisions, embeddings, and chat. This supersedes the curated-corpus-only draft.

## Q&A-only browser history amendment

The main screen is Q&A only, with no document catalog/upload panel or unauthenticated admin toggle. Completed questions, guarded answers and citations persist in browser localStorage (last 30 turns), with a confirmed Clear history action and visible corruption/quota/unavailable-storage errors. No new chat database or server file writes are used. The ask and health routes do not depend on server history; the legacy history endpoint returns 410 and existing files are not deleted. Questions remain independent, saved history is not model context, and shared-browser/stale-answer caveats are displayed. A local operator may explicitly use `seed:corpus --use-runtime-token` if the existing runtime token has write permission; default seeding still requires a separate operator token, and production runtime credentials must be query-only. HTTPS Zilliz endpoints use explicit port 443. After observing duplicate imports from overlapping seed runs, corpus namespace version 2 uses deterministic document/passage IDs and upserts. Partial writes resume in place and overlapping runs converge without deletion; old namespaces remain untouched. This supersedes the single-writer seeding limitation below.

## Curated read-only corpus amendment

The user approved replacing public uploads with operator seeding. All visitors now list/search the same content-versioned namespace; cookies remain only for spending limits. `POST /api/documents` is disabled, the upload UI/client/validator are removed, and old workspace vectors are never selected. Source Markdown, operator-designated directory categories, and chunk boundaries determine the corpus version. Explicit `seed:corpus` uses only `ZILLIZ_SEED_TOKEN`; runtime `ZILLIZ_TOKEN` must have query/search/inspection permissions only, and the operator token must not be deployed. Schema creation also requires the operator token. Corpus seeding is idempotent/resumable, preserves unrelated and old-version vectors, and must run one process at a time. Health/list/ask fail closed until the whole expected corpus is complete. The HTTP evaluation is now read-only and checks shared visibility and upload rejection. This supersedes the upload journey, upload UI, tenant-only document retrieval, and runtime ingestion interfaces below; they describe the historical implementation.

## Corpus/evaluation amendment

User-requested update: four human-designated categories (Safety, Maintenance, Quality, Operations), three substantial fictional documents per category, and a 16-document workspace limit so the full corpus fits. The upload spending allowance also supports that limit. Drafts may cite four passages to cover four-category questions. Local evaluations separate routing, guards, gold evidence recall, and answer support; factual judging remains offline, not a production requirement. Decision-model reranking is optional and should be added only if baseline recall demonstrates a need. These amendments supersede the three-category/five-document wording below.

## Required journey

1. Operator uploads a UTF-8 TXT/Markdown document and explicitly chooses Safety, Maintenance, or Quality.
2. Server validates upload, preserves source line ranges, embeds chunks through OpenRouter, and stores category metadata and vectors in Zilliz.
3. Document becomes selectable/searchable only after complete ingestion.
4. Supervisor asks a question. Clef checks appropriateness, then Clef decides the source category set (including multi-category cases), clarification, or out-of-scope.
5. Server retrieves only completed documents in the signed browser workspace and selected categories. LangChain chat generates an evidence-backed structured answer.
6. Server validates citations and runs the required output decision guard before sending any draft text to the browser.

Decision routing is mandatory, not a chat-model classifier or a keyword fallback. Human upload categories remain authoritative; the system does not relabel documents automatically. Safety and factual accuracy are separate: Clef is not an accuracy certificate.

## Scope and limits

One Next.js App Router/TypeScript service on Bun. Adapt the LangChain Next.js template's server-side model/retrieval patterns, not its unrelated example pages, Supabase, or chat streaming. Upstream source inspected: `langchain-ai/langchain-nextjs-template`, `app/api/chat/retrieval/route.ts`.

Initial formats: `.txt`, `.md`, strict UTF-8, 1 MB/file, five documents/workspace, maximum 256 chunks/document. No PDF/OCR yet. Browser workspaces use server-issued HMAC-signed HTTP-only cookies, seven-day expiry, with tenant filters on every store operation. No login/roles yet; never present this as authenticated plant-wide knowledge management. Uploaded vectors persist beyond cookie expiry; retention cleanup is an operational follow-up. Use fictional/non-sensitive documents for this demo.

No machine-control tools, web search, open-ended agent loops, persistent chat history, document deletion/revision-management UI, or mandatory runtime validator. The optional validator is deferred until the core path passes. Conflicting equipment/revisions require clarification/abstention, not invention.

## Data and providers

- OpenRouter `/api/alpha/decisions` for `cloudflare/clef` guardrails and category decisions.
- LangChain OpenAI-compatible chat and embeddings through OpenRouter `/api/v1`.
- Zilliz SDK for explicit collection schema, tenant/category filters, source text, and completion metadata.
- Vector setup is an explicit script, not a request/startup/build migration. Determine dimensions from live embeddings; never drop/recreate unknown collections. Track embedding model identity as well as dimensions. Use a separate production collection.
- Chunk metadata includes workspace ID, document ID, chunk ID, category, filename, source text, line spans, expected chunk count, and readiness. Partial inserts are cleaned up where possible; incomplete documents must never be retrieved.
- Dense category-filtered retrieval first, up to six passages total with multi-category coverage. Hybrid ranking only after evals demonstrate a need.
- Required guards fail closed on errors, malformed decisions, or oversize state. Clef's truncation behavior must be checked live; conservatively limit decision state to 1,500 UTF-8 bytes and never silently truncate input or claim independent chunk decisions establish whole-text semantics.
- Bound source context, answer length, provider calls, and end-to-end deadlines. No response streaming before the output check. All displayed model text and cited excerpts pass the output guard.
- Cite only retrieved IDs; metadata is resolved on the server. Do not claim citation-ID validation establishes entailment.

## Frozen contracts and ownership

`src/contracts/index.ts` owns categories, limits, request/response schemas, document metadata, passages, routing results, and drafts. Parent owns contracts, dependencies, provider adapters, routes, session validation, configuration, integration, and publication.

Endpoints:

- `GET /api/documents` -> `{ documents: DocumentSummary[] }`; establishes/uses signed workspace.
- `POST /api/documents` -> multipart `file` and mandatory `category`; returns `201 { document: DocumentSummary }` after indexing.
- `POST /api/ask` -> `{ question }`; returns checked `AskResponse` or controlled `ApiError`.
- `GET /api/health` -> configuration/collection readiness without secrets or embedding/chat calls.

Service signatures are in foundation stubs:

- `ingestDocument({workspaceId, name, category, text}, signal?)`.
- `listDocuments(workspaceId, signal?)`.
- `retrievePassages({workspaceId, categories, question}, signal?)`.
- `checkVectorReadiness()`; `setupCollection(verifyOnly)`.
- `answerQuestion(question, workspaceId, signal?)`.
- Provider adapter: `decisionChoice({state, instructions, criteria, signal})`, `embedTexts(texts, signal?)`, `generateDraft(question, context, signal?)`.

No lane changes these interfaces without parent approval. Provider keys never appear in `NEXT_PUBLIC_` variables. Same-origin mutation checks, real request-size limits, and bounded per-workspace/global request limits apply before provider spending. One Railway replica while locks/limits are process-local.

## Parent-approved UI

One operational workspace: document onboarding panel and primary question/answer area. On mobile, stack panels without hiding upload/source access. Restrained steel/white surface, deep teal primary action, clear headings, system sans, readable source passages, strong visible focus. No hero marketing, invented metrics, neon, gradients, or AI confidence gauges.

Exact copy:

- Title: “Plant documentation assistant”
- Description: “Ask about safety, maintenance, or quality. Answers cite the relevant plant documents.”
- Document panel title: “Plant documents”
- Upload label: “Document”; category label: “Category”; empty option: “Choose a category”
- Upload button: “Upload and index”; hint: “TXT or Markdown · up to 1 MB per file · up to 5 documents”
- Empty document list: “Upload a document and choose its category to get started.”
- Question label: “What do you need to know?”
- Placeholder: “What checks are required before restarting conveyor C-12?”
- Submit: “Ask”; upload loading: “Indexing document…”
- Answer loading: “Checking the question and finding relevant procedures…”
- Sources: “Sources used”; routing: “Routed to”
- Persistent notice: “Demo only. Use fictional documents; answers are not approved for plant operations.”
- Retry: “Try again”

States: empty, uploading, ready, asking, answered, clarification, insufficient evidence, blocked, out of scope, and recoverable error. Preserve inputs on errors; disable duplicate submissions; announce progress/results accessibly. Sources show exact excerpt, category, filename, and lines. Display the returned source categories, not a made-up percentage. No validator badge when the validator has not run.

## Multi-seam lane board

Each lane is independently testable and receives a managed isolated worktree from the shared foundation commit. No concurrent writers in the same cwd; workers cannot add dependencies, redesign, invent copy, change contracts, push, or delegate further.

| Lane | Exclusive ownership | Decision/gate | Durable handoff |
| --- | --- | --- | --- |
| UI | `src/components/`, `src/app/page.tsx`, `src/app/globals.css`, UI-only tests | Render approved layout/copy, uploads and all response states; typecheck | Commit or captured worktree patch plus test evidence |
| Data | `src/server/documents/`, `src/server/retrieval/`, `scripts/setup-vectors.ts`, data-only tests | Zilliz completion-safe ingestion and tenant/category retrieval; unit tests | Commit or captured patch plus tests and live-check limits |
| Workflow | `src/server/workflow/`, `src/server/guardrails/`, workflow-only tests | Clef routing + guards, grounded draft/citations, bounded failures; unit tests | Commit or captured patch plus test evidence |
| Parent | Shared foundation, API/session/config, scripts/evals/fixtures, integration | Inspect each diff, integrate, typecheck/test/build, browser checks, live-provider checks when keys exist | README + implementation status |

Isolation paths are allocated by the managed worktree runner and recorded in its handoff manifests before worker mutation. Integration begins only after durable component handoffs; parent retains architecture, UX, copy, and acceptance authority.

## Acceptance and deployment

Railway root service uses `railway.json` with Railpack, frozen Bun install/build, Bun start binding to `0.0.0.0`, Railway-provided `PORT`, `/api/health`, bounded restart policy. Set `RAILPACK_BUN_VERSION=1.4.2`, `NODE_ENV=production`, `APP_ORIGIN` to the HTTPS app origin, independent `SESSION_SIGNING_SECRET`, and all OpenRouter/Zilliz variables through Railway Variables. Local `.env` is ignored and is not imported by Railway. No volume is necessary.

Commands: `bun install --frozen-lockfile`, `bun run setup:vectors` (create/verify), `bun run setup:vectors --verify` (read-only), `bun run dev`, `bun run typecheck`, `bun test`, `bun run build`, `bun run check:providers`, `bun run eval`.

Tests must cover human category persistence, invalid category/file/UTF-8, partial ingestion, cross-workspace exclusion, multi-category routing/retrieval, absent evidence, fabricated citations, prompt injection, appropriate safety questions versus safeguard bypass/falsified QC, malformed decision output, and guard outages. Report mocked and live results separately. Human-review the small live factual-support set; do not invent accuracy percentages.

Done: upload/index/ask/citation browser journey, negative-path tests, fresh setup docs, required guard behavior, actual Railway HTTPS deployment when access/credentials are available, and redeploy persistence. Missing credentials are explicit blockers, not permission to advertise mock behavior as live integration.

Current foundation check: Bun 1.4.2 and Railway CLI are installed; required provider credentials and chat/embedding model IDs in local `.env` are empty. Actual provider calls and remote deployment cannot be accepted until configured.
