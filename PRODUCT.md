# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
User-confirmed: LangChain, Next.js, Bun; Railway hosting with Railpack; Zilliz vectors; OpenRouter decision, embedding, and chat models.

## Users
Plant operators onboard documents. Floor supervisors ask questions about manufacturing documentation.

## Product Purpose
Route questions to the correct safety procedures, maintenance manuals, or quality control standards and answer with inspectable supporting evidence.

## Operating Context
The user approved implementation after reviewing the plan. Humans designate the category during document upload; embedding/indexing preserves that designation. The decision model routes questions to these bins. Both input and output appropriateness checks are required.

## Capabilities and Constraints
Three categories: Safety, Maintenance, Quality. Upload and embedding are required. A validator agent is optional after the main workflow works. Real hosting/provider access has not been verified. Initial format/size limits and isolated browser workspaces are implementation defaults from the parent, not claims about the user's plant systems.

## Evidence on Hand
A sibling repository contains Zilliz/OpenRouter/Clef integration examples. No real plant manuals, brand assets, or accuracy benchmark have been supplied. Any demo procedures must be explicitly fictional.

## Product Principles
- Human-assigned document categories are authoritative metadata.
- Decision routing selects sources; it does not invent procedures.
- Inspectable citations and honest abstention outrank fluent answers.
- Never show unguarded answer drafts.
