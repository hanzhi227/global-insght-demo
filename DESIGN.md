---
name: Plant documentation assistant
description: A shadow board of painted category outlines on pale perforated board, with white reading sheets in ink.
colors:
  board: "#eceee9"
  board-perforation: "#d3d8d0"
  sheet: "#ffffff"
  wash: "#f5f6f3"
  rule: "#c9cec5"
  control-line: "#6f7985"
  ink: "#1b1f24"
  ink-muted: "#4a525c"
  ink-deep: "#000000"
  focus-blue: "#0b5cad"
  brand-navy: "#00283d"
  safety-red: "#b3261e"
  maintenance-blue: "#1d4f91"
  quality-green: "#1f6b43"
  operations-graphite: "#3d4650"
  warn-ink: "#6b4300"
  warn-wash: "#fbf3dc"
  warn-line: "#b88a1f"
  danger-ink: "#8a1c1c"
  danger-wash: "#f8e4e2"
  danger-line: "#c76a6a"
typography:
  display:
    fontFamily: "'Barlow Semi Condensed', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
    fontSize: "clamp(1.875rem, 1.5rem + 1.6vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.005em"
  title:
    fontFamily: "'Barlow Semi Condensed', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  heading:
    fontFamily: "'Barlow Semi Condensed', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
  chip-label:
    fontFamily: "'Barlow Semi Condensed', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "normal"
  status-label:
    fontFamily: "'Barlow Semi Condensed', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "normal"
  body:
    fontFamily: "'Atkinson Hyperlegible', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  answer:
    fontFamily: "'Atkinson Hyperlegible', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  field-label:
    fontFamily: "'Atkinson Hyperlegible', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "normal"
  meta:
    fontFamily: "'Atkinson Hyperlegible', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  caption:
    fontFamily: "'Atkinson Hyperlegible', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  line-number:
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
rounded:
  xs: "2px"
  sm: "3px"
  md: "4px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.ink-deep}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-disabled:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  notice-danger:
    backgroundColor: "{colors.danger-wash}"
    textColor: "{colors.danger-ink}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  demo-notice:
    backgroundColor: "{colors.warn-wash}"
    textColor: "{colors.warn-ink}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  status-neutral:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
  status-warn:
    backgroundColor: "{colors.warn-wash}"
    textColor: "{colors.warn-ink}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
---

# Design System: Plant Documentation Assistant

## Q&A-only amendment

The current user-approved main surface is one centered reading sheet, up to 960px wide, with Q&A and browser-saved turns. Document downloads live behind a 44px menu-icon trigger at the top right of the brand bar, never below the chat. Its category-grouped popover is right-aligned, viewport-bounded and scrollable, starts closed, closes on outside pointer/Escape, and returns keyboard focus to the trigger on Escape. Mobile keeps the document icon beside the logo while the example-question menu moves to the next row. The document catalog/upload column is deprecated and absent from the main page. Preserve the existing brand bar, fonts, ink controls, source excerpts, category chips, and solid/dashed answer rules. The composer stays first, with saved history newest-first beneath it; each question stays paired with its response and has collapsible source citations. Clear history is secondary and confirmed, loading/storage errors are visible, and programmatically focused results retain a visible focus ring. This supersedes the historical two-column layout below, not the incumbent visual world. Admin upload UI is deferred until real authentication exists.

## Overview

**Creative North Star: "The Shadow Board"**

The workspace is a shadow board. Each document category is a painted outline on a pale perforated ground; sources hang inside their category as solid tools, and an empty category is a dashed outline, so the gap is visible. Answers are read on white sheets, in ink, at reading size. The system serves plant floor supervisors who need the right procedure fast and need to check cited lines against their source.

Density is controlled: two columns on desktop, a 360px board beside a fluid reading sheet, stacking below 860px. Nothing decorates. Color carries category and state only, and the dark-ink primary action is the only ink-filled control. The layout refuses the sidebar-and-cards dashboard default, and there is no hero.

**Key Characteristics:**
- Pale perforated board ground with white reading sheets
- Painted 2px category outlines; dashed when the category is empty
- Solid category-colored tiles for documents, with white text
- One dark-ink primary action; secondary is an ink outline; disabled is a hollow mark
- Corners at most 4px; no shadows
- Body text at 17px or larger; the display face is for titles and labels only

## Colors

A near-white board and sheet with ink-dark text, and four category colors that are the only saturated values on the workspace.

### Ground and Surface
- **Board Ground** (#eceee9, `--board`): page background, carrying the dot pattern below.
- **Board Perforation** (#d3d8d0, `--board-hole`): the 1.1px dots on a 16px grid across the board.
- **Sheet White** (#ffffff, `--sheet`): panels, the upload sheet, inputs, passage cards, and the excerpt field. Also the text color on dark fills.
- **Sheet Wash** (#f5f6f3, `--wash`): the file-selector button, the progress track, and the passage header.

### Ink and Lines
- **Ink** (#1b1f24, `--ink`): body text, primary button fill, secondary button stroke, status and chip default stroke, the answer rule, and the progress sweep.
- **Muted Ink** (#4a525c, `--ink-muted`): lede, hint, empty-state text, passage meta, excerpt line numbers, and disabled text.
- **Control Line** (#6f7985, `--control-line`): strokes on selects, textareas, the file button, and disabled buttons.
- **Hairline Rule** (#c9cec5, `--rule`): 1px panel and passage edges, the passage divider, the 2px gutter divider, and the dashed loader. Decorative only; it sits below 3:1 on sheet and board.
- **Ink Deep** (#000000): primary button hover fill. A literal in the stylesheet, not a custom property.

### Categories
Each category color appears in the same four places: the 2px outline stroke, the outline title, the solid tile fill (with white text), and the routed chip stroke and text.
- **Safety Red** (#b3261e, `--red`): Safety.
- **Maintenance Blue** (#1d4f91, `--blue`): Maintenance.
- **Quality Green** (#1f6b43, `--green`): Quality.
- **Operations Graphite** (#3d4650, `--graphite`): Operations, and the fallback outline color when no category class applies.

### State and Brand
- **Focus Blue** (#0b5cad, `--focus`): the focus-visible ring.
- **Warning** (Ink #6b4300 `--warn-ink`, Wash #fbf3dc `--warn-wash`, Line #b88a1f `--warn-line`): the demo notice and the warning status tone.
- **Danger** (Ink #8a1c1c `--danger-ink`, Wash #f8e4e2 `--danger-wash`, Line #c76a6a `--danger-line`): failure notices and the blocked status tone.
- **Logo Navy** (#00283d, `--brand`): the field behind the Insight Global logo only. It is the logo's own ground, not a system accent.

### Measured Contrast (WCAG 2.x)
- Ink on Sheet 16.56:1; on Board 14.17:1
- Muted Ink on Sheet 7.92:1; on Board 6.78:1; on Wash 7.30:1
- Category text on Sheet: Safety 6.54:1, Maintenance 8.14:1, Quality 6.48:1, Operations 9.59:1
- Category text on Board (outline titles, empty outlines): Safety 5.59:1, Maintenance 6.97:1, Quality 5.54:1, Operations 8.21:1
- White on each tile fill: Safety 6.54:1, Maintenance 8.14:1, Quality 6.48:1, Operations 9.59:1
- Tile meta (white at 0.92 opacity) on each fill: Safety 5.75:1, Maintenance 7.18:1, Quality 5.76:1, Operations 8.40:1
- White on Ink 16.56:1; white on Ink Deep 21.00:1
- Warning Ink on Warning Wash 7.81:1; Danger Ink on Danger Wash 7.59:1
- Control Line on Sheet 4.42:1 (meets the 3:1 non-text bar for the hollow disabled stroke and input edges)
- Focus Blue on Sheet 6.67:1; on Board 5.71:1
- Hairline Rule on Sheet 1.60:1; on Board 1.37:1 (decorative only)

### Named Rules
**The Painted Outline Rule.** Category color lives only in outlines, outline titles, tile fills, and routed chips. Color carries category and state, and nothing is decorated with it.

## Typography

**Display Font:** Barlow Semi Condensed (with system sans fallback), loaded at 600 and 700. Only 700 is used.
**Body Font:** Atkinson Hyperlegible (with system sans fallback), loaded at 400 and 700.
**Label/Mono Font:** the system monospace stack, used only for excerpt line numbers.

**Character:** A condensed industrial grotesk carries the headings and status labels, set against a body face designed for legibility at reading size, because answers and cited excerpts are read closely.

### Hierarchy
- **Display** (Barlow 700, clamp(1.875rem, 1.5rem + 1.6vw, 2.75rem), line-height 1.05, tracking 0.005em): the masthead title only.
- **Title** (Barlow 700, 1.375rem, line-height 1.2): panel titles, such as "Plant documents".
- **Heading** (Barlow 700, 1.1875rem, line-height 1.2, tracking 0.02em): category outline titles. "Sources used" uses the same size at normal tracking.
- **Chip Label** (Barlow 700, 0.9375rem): routed category chips.
- **Status Label** (Barlow 700, 1rem): the answer status.
- **Body** (Atkinson 400, 1.0625rem, line-height 1.5): base text, the lede, notices, and empty-state text. Lede measure is capped at 60ch.
- **Answer** (Atkinson 400, 1.125rem, line-height 1.6, max 66ch): the answer text.
- **Excerpt** (Atkinson 400, 1.0625rem, line-height 1.6): cited source lines.
- **Field Label** (Atkinson 700, 1rem): form labels and the question prompt.
- **Meta** (Atkinson 400, 0.9375rem, tabular numerals): tile passage counts, passage source lines, and progress text. Routed-to labels use this size at 700.
- **Caption** (Atkinson 400, 0.875rem, tabular numerals): the upload hint.
- **Line Number** (monospace 400, 0.875rem, line-height 1.6): excerpt gutter only.

Weight note: buttons, tile names, and the file-selector button request 600. Atkinson is loaded at 400 and 700 only, so those requests render at 700.

### Named Rules
**The Display Is Not Body Rule.** Barlow carries titles, outline titles, chip labels, and status labels. Atkinson carries all running text, including document names and excerpts.

**The Reading Size Rule.** Answers and excerpts are set at 1.0625rem or larger. Helper text steps down to 0.875rem and never carries answer content.

## Layout

- **Container:** width min(1180px, 100% minus 48px), centered. That is a 24px side gutter on desktop, narrowing to 16px per side below 480px.
- **Brand bar:** 18px vertical padding; logo width clamp(168px, 22vw, 244px).
- **Masthead:** 40px top and 24px bottom padding; title and lede only.
- **Workspace:** two columns, minmax(0, 360px) for the board and minmax(0, 1fr) for the reading sheet, with a 32px gap, top-aligned, and 56px bottom padding.
- **Reading sheet offset:** the question panel starts 2.35rem below the workspace top on desktop, level with the upload sheet under the board title.
- **Below 860px:** one column in reading order, board above sheet, with a 24px gap.
- **Below 480px:** panel and upload-sheet padding drops to 18px 16px, the reading-sheet offset is removed, and the excerpt gutter insets to 8px.
- **Spacing rhythm:** the reused steps are 8, 12, 16, 24, and 32px. Panel padding is 24px, the upload sheet 20px, outline gap 16px, tile gap 8px, passage gap 14px.
- **Off-scale values in use:** 4, 6, 10, 14, 18, and 20px, and the 2.35rem offset. These are one-off values and are not part of the rhythm.

## Elevation & Depth

Flat. The system has no shadows. Depth comes from the layers of the board: a patterned ground (Board Ground with Board Perforation dots), white sheets set off by color and a 1px Hairline Rule edge, and painted 2px category outlines. Nothing elevates on hover or focus.

### Named Rules
**The Flat Board Rule.** Surfaces do not cast shadows. Sheets separate from the board by color and a hairline, never by blur.

## Shapes

Square-cornered with a small radius. Panels, sheets, controls, outlines, passage cards, and buttons use 4px. Tiles, chips, and status labels use 3px. The progress track uses 2px.

Lines carry the form: 2px painted category outlines; 1px Hairline Rule edges; a 2px ink rule above each answer sheet; and 2px dashed rules where a category is empty, the answer has no evidence, or content is loading.

### Named Rules
**The Four-Pixel Rule.** No corner exceeds 4px.

## Components

### Buttons
- **Shape:** 4px radius, 44px minimum height, padding 10px 18px.
- **Primary:** Ink fill, white text, 1px ink border. One per surface. Hover moves to Ink Deep.
- **Secondary:** Sheet White fill, ink text, 1px ink border. Hover moves to Sheet Wash. Used for "Try again" on failures.
- **Disabled:** a hollow mark: Sheet White fill, Control Line border, Muted Ink text, not-allowed cursor. Never a grey fill.
- **Focus:** a 3px Focus Blue outline with a 3px offset. Hover changes color immediately; there is no transition.

### Inputs
- **File input:** the file-selector button uses Sheet Wash fill, a 1px Control Line border, a 4px radius, and a 36px minimum height.
- **Select:** Sheet White fill, 1px Control Line border, 4px radius, 44px minimum height, 1rem text.
- **Textarea:** same border and fill, 7rem minimum height, vertical resize only.
- **Disabled:** Muted Ink text and not-allowed cursor.

### Category Outline
- **Shape:** 2px painted stroke in the category color, 4px radius, padding 12px 14px 14px. The title uses the Heading style in the category color.
- **Empty:** the same stroke, dashed. An empty category shows its gap rather than a placeholder.
- **Contents:** solid tiles in an 8px-gapped list, 10px below the title.

### Tool Tile
- **Shape:** 3px radius, padding 10px 12px. Solid category fill with white text. The name is 600 requested, rendering 700; the passage count is Meta size at 92% opacity.
- **Motion:** enters with the hang animation (see Motion).

### Routed Chip
- **Style:** Sheet White fill, 2px stroke and text in the category color, Chip Label type, 3px radius, 30px minimum height, nowrap.
- **Placement:** after a "Routed to" label, in the answer sheet.

### Status Label
- **Style:** Status Label type, 2px stroke, 3px radius, 30px minimum height.
- **Tones:** neutral uses an ink stroke on Sheet White. Warning uses the warning stroke and wash. Danger uses the danger stroke and wash.
- **Mapping:** answered and out-of-scope are neutral; needs-clarification and insufficient-evidence are warning; blocked is danger.

### Answer Sheet
- **Structure:** 24px top margin, 20px padding above the content, a 2px ink top rule, then the status label, the answer text, the routed chips, and "Sources used" with its passages.
- **Solid rule:** the status is answered.
- **Dashed rule:** insufficient-evidence, needs-clarification, blocked, out-of-scope, and failed.
- **Focus:** the sheet takes programmatic focus after an answer and has no outline. This is a build gap, not a pattern to copy.

### Excerpt Passage
- **Disclosure:** “Sources used” remains collapsed by default, with a chevron and exact excerpt count. The full-width summary has a 48px minimum height, hairline rules, wash hover, and the shared keyboard focus ring.
- **Card:** Sheet White, 1px Hairline Rule edge, 4px radius, clipped. Excerpts are spaced 16px apart.
- **Header:** Sheet Wash fill, 1px Hairline Rule divider, 12px 16px padding. A numbered source label precedes the bold document name and stacked category/line metadata. Below 480px, the label stacks above the document information, with 12px padding.
- **Excerpt:** a keyboard-focusable scrollable field, 16rem maximum height, 16px vertical padding, 1.0625rem type at 1.6 line-height. Exact text and blank lines are preserved.
- **Gutter:** a minimum 3.5rem column of right-aligned monospace line numbers in Muted Ink, unselectable, with a 2px Hairline Rule divider. Numbers share the excerpt’s line height. The text column is capped at 72ch and preserves line breaks.

### Notices and Progress
- **Failure notice:** Danger Wash fill, 1px Danger Line border, Danger Ink text, 4px radius, 12px 14px padding. Actions wrap to the right.
- **Demo notice:** Warning Wash fill, 1px Warning Line border, Warning Ink text at 1rem, 4px radius, 10px 14px padding.
- **Progress:** a 4px Sheet Wash track with a 2px radius and an ink sweep 30% wide.
- **Loader:** two 56px dashed 2px Hairline Rule boxes, decorative only.

### Motion
- **Tile hang:** tiles enter from translateY(-6px) and opacity 0 to rest, over 220ms with cubic-bezier(0.2, 0.8, 0.2, 1), filled in both directions. Each tile plays it once on mount.
- **Progress sweep:** the ink bar moves from left -30% to 100%, over 1.3s, ease-in-out, repeating while a request runs.
- **Reduced motion:** the tile animation is removed. The progress bar becomes a static full-width bar at 40% opacity.

### Named Rules
**The Printed Mark Rule.** A control state is drawn, not shaded. Primary is a filled ink mark; disabled is a hollow mark with a Control Line stroke. Grey fills are not used for state.

**The Solid-or-Dashed Rule.** The answer rule is solid when the status is answered and dashed for the five statuses that do not answer: insufficient-evidence, needs-clarification, blocked, out-of-scope, and failed.

### Deliberate Omissions
These are part of the design. They are not drift:
- **Struck control state:** the direction contract names filled, hollow, and struck. No control uses the struck state.
- **First-viewport Ask:** the Ask button is hollow until a question is typed, and it stays hollow while a request runs. The direction contract was amended for this, and it is the standard disabled state.
- **Populated tiles and answer sheets:** these were verified from the code only, not by screenshot.

## Do's and Don'ts

### Do:
- **Do** paint each category as a 2px outline in its own color, and make it dashed when the category holds no documents.
- **Do** use one ink-filled primary action per surface; use the ink-outline secondary for everything else.
- **Do** draw disabled controls as hollow marks with a Control Line stroke.
- **Do** set answers and excerpts at 1.0625rem or larger.
- **Do** reserve the display face for titles, outline titles, chip labels, and status labels.
- **Do** draw the answer rule solid when the status is answered, and dashed for the five non-answer statuses.
- **Do** keep every corner at 4px or below.

### Don't:
- **Don't** fill a disabled control with grey; use the hollow mark.
- **Don't** use dashed lines for anything beyond empty categories, non-answer statuses, and the loader.
- **Don't** add a second ink-filled action to a surface.
- **Don't** apply category colors outside outlines, outline titles, tile fills, and routed chips.
- **Don't** add shadows. The world has none.
- **Don't** set running text in the display face, or use the monospace face for anything but line numbers.
- **Don't** copy the 2.35rem reading-sheet offset, the 14px helper text, or the off-scale padding values as system values. They are one-offs.
