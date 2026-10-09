# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
User-confirmed: LangChain, Next.js, Bun; Railway hosting with Railpack; Zilliz vectors; OpenRouter decision, embedding, and chat models.

## Users
Demo operators seed curated documents from the repository. Floor supervisors ask questions about manufacturing documentation.

## Product Purpose
Route questions to the correct safety procedures, maintenance manuals, or quality control standards and answer with inspectable supporting evidence.

## Operating Context
The user approved a shared read-only corpus. Operators designate categories by source directory and explicitly seed Zilliz using separate write credentials; the runtime uses query-only credentials. Visitors cannot upload documents. The decision model routes questions to these bins. Both input and output appropriateness checks are required.

## Capabilities and Constraints
Four categories: Safety, Maintenance, Quality, Operations, with three fictional documents each. Operator-side embedding and versioned seeding are explicit, never run on startup. All visitors read the same complete corpus; signed cookies support request limits only. The main UI is Q&A, with completed chats and citations saved only in browser localStorage (last 30 turns), a confirmed clear action, and no server chat storage or admin upload controls. Accuracy evaluation remains offline. Live provider checks have run; deployment and independent factual review remain separate acceptance steps.

## Evidence on Hand
A sibling repository contains Zilliz/OpenRouter/Clef integration examples. No real plant manuals, brand assets, or accuracy benchmark have been supplied. Any demo procedures must be explicitly fictional.

## Product Principles
- Human-assigned document categories are authoritative metadata.
- Decision routing selects sources; it does not invent procedures.
- Inspectable citations and honest abstention outrank fluent answers.
- Never show unguarded answer drafts.
