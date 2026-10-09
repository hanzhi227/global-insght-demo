---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/document-panel.tsx","src/components/question-panel.tsx","src/app/globals.css"]
---

## Scope and visitor mode

Mode: Operate. Surface: the single workspace at `src/app/page.tsx`, rebuilt from the same components. Audience: plant floor supervisors. Job: find the right safety, maintenance, or quality procedure fast and check the cited lines against their source. Copy and behavior stay as they are.

## Direction contract

THESIS: The workspace is a shadow board. Each category is a painted outline, each source is a tool hung inside its outline, and a missing answer is an empty outline. It refuses the category-default sidebar-and-cards dashboard.

OWN-WORLD: Pale perforated-board ground. Painted 2px outlines in safety red (Safety), blue (Maintenance), green (Quality), and graphite (Operations); dashed outlines for empty categories. White reading sheets, ink text, a single dark-ink primary action. Corners at most 4px. Raise from the reference-setting page: control states as printed marks (filled, hollow, struck), and body text at 17px or larger.

STORY: The supervisor sees which categories hold documents, uploads into the right outline, asks a question, sees which outlines the answer was routed to, and checks the cited lines against the excerpt.

FIRST VIEWPORT: Left column about 360px: the upload form, then four category outlines stacked, each listing its documents as solid tiles in its color, or a dashed empty outline. Right column: the question label, the textarea, and the Ask action directly beneath it (dark ink once a question is typed; hollow until then, as the standard disabled state), then the answer sheet. Masthead title and lede only. No hero.

FORM: Shadow board, the lead of the direction roll (seed key f873f89f, operate mode), chosen by the user.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved decisions

- None on direction. Code-led build: no image generation is available here, so the direction contract is the build spec.
