---
name: pretext
description: DOM-free multiline text measurement and layout using @chenglou/pretext. Use when the user needs text height calculation, virtualized list row sizing, canvas/SVG text rendering, rich-text inline flow, or any scenario involving text layout without DOM reflow.
---

# Pretext – DOM-Free Text Measurement & Layout

Pretext is a pure-JavaScript/TypeScript library that measures and lays out multiline text without touching the DOM. It uses the browser's own font engine (via canvas `measureText`) as ground truth, then does all line-breaking and height calculation in pure arithmetic. Supports rendering to DOM, Canvas, SVG, and (eventually) server-side.

## Why This Matters

DOM-based text measurement (`getBoundingClientRect`, `offsetHeight`) triggers layout reflow — one of the most expensive operations in a browser. Every call forces the engine to recalculate styles and geometry for potentially the entire document. In a virtualized list with 10,000 rows, that means 10,000 reflows just to get row heights.

Pretext replaces that with a two-phase approach: one `prepare()` call does text analysis, segmentation, glue rules, and canvas measurement (the expensive part, done once), then `layout()` computes height from cached widths using pure math (the cheap part, called on every resize). This is 300-600x faster than DOM measurement, and it eliminates layout thrashing entirely.

The result is pixel-perfect across browsers (7680/7680 on Chrome, Safari, and Firefox accuracy sweeps), supports all languages including emoji, mixed-bidi, CJK, Thai, Arabic, Khmer, Myanmar, Urdu, and more.

## Installation

```sh
npm install @chenglou/pretext
```

## Two Paths: Pick the Simpler One

### Fast Path (90% of cases — you just need the height)

```ts
import { prepare, layout } from '@chenglou/pretext'

const prepared = prepare('AGI 春天到了. بدأت الرحلة 🚀‎', '16px Inter')
const { height, lineCount } = layout(prepared, maxWidth, 20)
```

This covers virtualized lists, dynamic containers, scroll anchoring — anything where you need to know how tall text will be at a given width. The `prepared` handle is reusable: on resize, just call `layout()` again with the new width.

For textarea-like text where spaces, tabs, and `\n` hard breaks stay visible:

```ts
const prepared = prepare(textareaValue, '16px Inter', { whiteSpace: 'pre-wrap' })
const { height } = layout(prepared, textareaWidth, 20)
```

For CJK/Hangul text that should avoid breaking within words:

```ts
const prepared = prepare(text, '16px Inter', { wordBreak: 'keep-all' })
```

### Rich Path (you need the actual lines)

When you need to render text yourself (Canvas, SVG, WebGL) or do variable-width layout (flowing around images), switch to the rich APIs:

```ts
import { prepareWithSegments, layoutWithLines, walkLineRanges, layoutNextLine, layoutNextLineRange, materializeLineRange, measureLineStats, measureNaturalWidth } from '@chenglou/pretext'
```

- **`layoutWithLines()`** — all lines at a fixed width (Canvas/SVG rendering)
- **`walkLineRanges()`** — line ranges without building strings (shrink-wrap, binary search for optimal width, balanced text layout)
- **`measureLineStats()`** — line count and widest line width without any allocations
- **`measureNaturalWidth()`** — widest forced line when width is not the thing causing wraps
- **`layoutNextLine()`** — one line at a time with varying width (text flowing around obstacles), returns full line with text
- **`layoutNextLineRange()`** — same as above but without building the text string; use `materializeLineRange()` to get the text when needed

### Rich-Text Inline Flow (multi-font, chips, mentions)

For rich-text inline flow with mixed fonts, code spans, mentions, chips, and browser-like boundary whitespace collapse:

```ts
import { prepareRichInline, walkRichInlineLineRanges, materializeRichInlineLineRange, measureRichInlineStats } from '@chenglou/pretext/rich-inline'

const prepared = prepareRichInline([
  { text: 'Ship ', font: '500 17px Inter' },
  { text: '@maya', font: '700 12px Inter', break: 'never', extraWidth: 22 },
  { text: "'s rich-note", font: '500 17px Inter' },
])

walkRichInlineLineRanges(prepared, 320, range => {
  const line = materializeRichInlineLineRange(prepared, range)
  // each fragment keeps its source item index, text slice, gapBefore, and cursors
})
```

The rich-inline helper is intentionally narrow:
- Raw inline text in, including boundary spaces
- Caller-owned `extraWidth` for pill chrome (padding + border width)
- `break: 'never'` for atomic items like chips and mentions
- `white-space: normal` only
- Not a nested markup tree and not a general CSS inline formatting engine

## API Reference

### Fast-path APIs

```ts
prepare(text: string, font: string, options?: {
  whiteSpace?: 'normal' | 'pre-wrap',
  wordBreak?: 'normal' | 'keep-all'
}): PreparedText

layout(prepared: PreparedText, maxWidth: number, lineHeight: number): {
  height: number,
  lineCount: number
}
```

### Rich-path APIs

```ts
prepareWithSegments(text: string, font: string, options?: {
  whiteSpace?: 'normal' | 'pre-wrap',
  wordBreak?: 'normal' | 'keep-all'
}): PreparedTextWithSegments

layoutWithLines(prepared: PreparedTextWithSegments, maxWidth: number, lineHeight: number): {
  height: number, lineCount: number, lines: LayoutLine[]
}

walkLineRanges(prepared: PreparedTextWithSegments, maxWidth: number,
  onLine: (line: LayoutLineRange) => void): number

measureLineStats(prepared: PreparedTextWithSegments, maxWidth: number): {
  lineCount: number, maxLineWidth: number
}

measureNaturalWidth(prepared: PreparedTextWithSegments): number

layoutNextLineRange(prepared: PreparedTextWithSegments, start: LayoutCursor, maxWidth: number): LayoutLineRange | null

layoutNextLine(prepared: PreparedTextWithSegments, start: LayoutCursor, maxWidth: number): LayoutLine | null

materializeLineRange(prepared: PreparedTextWithSegments, line: LayoutLineRange): LayoutLine
```

### Rich-inline APIs (`@chenglou/pretext/rich-inline`)

```ts
prepareRichInline(items: RichInlineItem[]): PreparedRichInline

layoutNextRichInlineLineRange(prepared: PreparedRichInline, maxWidth: number, start?: RichInlineCursor): RichInlineLineRange | null

walkRichInlineLineRanges(prepared: PreparedRichInline, maxWidth: number,
  onLine: (line: RichInlineLineRange) => void): number

materializeRichInlineLineRange(prepared: PreparedRichInline, line: RichInlineLineRange): RichInlineLine

measureRichInlineStats(prepared: PreparedRichInline, maxWidth: number): {
  lineCount: number, maxLineWidth: number
}
```

### Utility APIs

```ts
clearCache(): void   // release internal caches used by prepare/prepareWithSegments
setLocale(locale?: string): void  // retarget word segmenter for future prepare() calls; also clears cache
```

### Key Types

```ts
type LayoutLine = {
  text: string         // full text of the line
  width: number        // measured pixel width
  start: LayoutCursor  // inclusive start cursor
  end: LayoutCursor    // exclusive end cursor
}

type LayoutLineRange = {
  width: number
  start: LayoutCursor
  end: LayoutCursor
}

type LayoutCursor = {
  segmentIndex: number   // position in prepared segments
  graphemeIndex: number  // grapheme within that segment
}

type RichInlineItem = {
  text: string            // raw text including boundary spaces
  font: string            // canvas font shorthand
  break?: 'normal' | 'never'  // 'never' = atomic (chips, mentions)
  extraWidth?: number     // horizontal chrome width (padding + border)
}

type RichInlineFragment = {
  itemIndex: number       // index into original items array
  text: string
  gapBefore: number       // collapsed boundary gap
  occupiedWidth: number   // text width + extraWidth
  start: LayoutCursor
  end: LayoutCursor
}

type RichInlineLine = {
  fragments: RichInlineFragment[]
  width: number
  end: RichInlineCursor
}
```

## Key Things to Get Right

- **Cache `prepared` handles.** Same text + same font = reuse the handle. Only call `prepare()` again if the text or font actually changed. On resize, just re-call `layout()`.
- **Match your CSS exactly.** The `font` string must match your CSS `font` shorthand (size, weight, style, family). The `lineHeight` must match your CSS `line-height`. Mismatches produce wrong heights.
- **Use `{ whiteSpace: 'pre-wrap' }` for textareas** where spaces, tabs, and newlines should be preserved. Tabs follow default browser-style `tab-size: 8` stops.
- **Use `{ wordBreak: 'keep-all' }` for CJK/Hangul** when you want to avoid breaking within words.
- **Avoid `system-ui` on macOS** — canvas and DOM can resolve to different fonts (SF Pro Text vs SF Pro Display), breaking accuracy. Use a named font.
- **`clearCache()` is rarely needed** — only when cycling through many different fonts and you want to release memory.
- **`setLocale()` is optional** — by default Pretext uses the current locale. Call it before `prepare()` if you need a specific `Intl.Segmenter` locale.

## Supported CSS Target

- `white-space: normal` (default) and `pre-wrap`
- `word-break: normal` (default) and `keep-all`
- `overflow-wrap: break-word` — narrow widths can break inside words, but only at grapheme boundaries
- `line-break: auto`
- Tabs follow default browser-style `tab-size: 8`

## What Pretext Handles Under the Hood

- **Segmentation**: text analysis, normalization, Unicode-aware word/grapheme segmentation via `Intl.Segmenter`
- **CJK**: astral ideographs, compatibility blocks, extension blocks, kinsoku (line-start/end prohibited punctuation)
- **Arabic/RTL**: no-space punctuation cluster merging, punctuation-plus-mark clusters, bidi metadata on the rich path
- **Emoji**: auto-detected per-font correction for canvas/DOM width discrepancy, ZWJ sequences
- **Soft hyphens**: invisible when unbroken, visible trailing `-` when the break is chosen
- **NBSP/NNBSP/WJ**: preserved as visible content, prevents word-boundary wrapping
- **ZWSP**: preserved as zero-width break opportunity
- **URL-like runs**: modeled as structured breakable units (path + query) to avoid bad mid-path breaks
- **Mixed script**: handles mixed-bidi, CJK-leading no-space runs, contextual ASCII quotes, numeric/time-range expressions

## Ready-to-Use Examples

See the `references/examples/` directory for complete, copy-paste-ready code:

**Fast-path (height measurement):**
- `basic-height.ts` — measure text height for a container, with `wordBreak: 'keep-all'`
- `pre-wrap-textarea.ts` — auto-size a textarea with preserved whitespace and tabs
- `resize-handler.ts` — canonical resize pattern: `prepare()` once, `layout()` on every resize
- `virtualized-list.ts` — variable row heights for virtualized lists with cached handles
- `scroll-anchor.ts` — prevent layout shift by predicting height before DOM insertion
- `label-overflow-check.ts` — CI/dev-time check that labels fit without wrapping
- `multilingual-layout.ts` — locale-aware measurement with `setLocale()` for CJK, Arabic, Thai

**Rich-path (manual line layout):**
- `canvas-manual-layout.ts` — render wrapped text on a canvas with `layoutWithLines`
- `svg-text-render.ts` — render wrapped text into SVG `<tspan>` elements
- `flow-around-image.ts` — route text around a floated image using `layoutNextLineRange`
- `two-column-flow.ts` — continuous two-column editorial flow with `layoutNextLineRange`
- `shrink-wrap.ts` — find tightest container width with `walkLineRanges` and `measureLineStats`
- `balanced-text.ts` — binary-search for balanced line widths to avoid orphan lines
- `natural-width.ts` — tooltip/popover sizing with `measureNaturalWidth`
- `bubble-chat.ts` — chat bubble shrink-wrap: find tightest width, then render lines

**Rich-inline (multi-font):**
- `rich-inline.ts` — multi-font inline flow with atomic chips and mentions

## Deep Reference

- `references/README.md` — Full API surface from the library repo: installation, complete type definitions, all function signatures, usage examples, and caveats.
- `references/AGENTS.md` — Agent-specific guidance: important source files, implementation notes, practical patterns, gotchas, open questions, and decision heuristics for building with Pretext.
- `references/STATUS.md` — Current accuracy dashboard and benchmark snapshot pointers (browser sweep results, corpus canaries).
- `references/RESEARCH.md` — Research log: everything tried, measured, and learned — system-ui discovery, word-sum accuracy, Arabic frontier, soft hyphens, emoji correction, CJK/Thai/Khmer/Myanmar/Japanese/Chinese corpus canaries, and rejected approaches.
- `references/DEVELOPMENT.md` — Development setup, day-to-day commands, packaging/release checks, browser accuracy and benchmarking commands, corpus tooling, and deep profiling workflow.
- `references/CHANGELOG.md` — Version history from 0.0.0 (2026-03-26) through unreleased changes including `keep-all` support and rich-inline APIs.
- `references/TODO.md` — Current priorities: canary maintenance, next engine work, demo direction, and open design questions.
- `references/SECURITY.md` — Security policy and private vulnerability reporting via GitHub advisories.
