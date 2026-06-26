import { prepareRichInline, walkRichInlineLineRanges, materializeRichInlineLineRange, measureRichInlineStats } from '@chenglou/pretext/rich-inline'

// Rich-text inline flow: mixed fonts, atomic chips/mentions, boundary whitespace collapse.
// Intentionally narrow — inline-only, white-space: normal only.
const prepared = prepareRichInline([
  { text: 'Ship ', font: '500 17px Inter' },
  { text: '@maya', font: '700 12px Inter', break: 'never', extraWidth: 22 }, // atomic chip
  { text: "'s rich-note with ", font: '500 17px Inter' },
  { text: 'inline code', font: '14px "Fira Code"', extraWidth: 12 },
  { text: ' and more text', font: '500 17px Inter' },
])

// Quick stats without materialization
const { lineCount, maxLineWidth } = measureRichInlineStats(prepared, 320)
console.log(`${lineCount} lines, widest = ${maxLineWidth}px`)

// Walk lines and materialize fragments for rendering
walkRichInlineLineRanges(prepared, 320, range => {
  const line = materializeRichInlineLineRange(prepared, range)
  for (const frag of line.fragments) {
    // frag.itemIndex — which source item this came from
    // frag.text — the text slice for this fragment
    // frag.gapBefore — collapsed boundary gap before this fragment
    // frag.occupiedWidth — text width + extraWidth
    console.log(`  [item ${frag.itemIndex}] "${frag.text}" (${frag.occupiedWidth}px)`)
  }
})
