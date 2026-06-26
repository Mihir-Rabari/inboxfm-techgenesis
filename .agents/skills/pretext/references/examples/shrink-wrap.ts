import { prepareWithSegments, walkLineRanges, measureLineStats } from '@chenglou/pretext'

const text = 'Find the tightest container width that still fits this multiline text.'
const prepared = prepareWithSegments(text, '16px Inter')

// Option 1: walkLineRanges — no string materialization, gives you width + cursors per line.
// Great for shrink-wrap, balanced text, or binary-searching an optimal width.
let maxLineWidth = 0
walkLineRanges(prepared, 9999, line => {
  if (line.width > maxLineWidth) maxLineWidth = line.width
})
console.log(`Shrink-wrap width: ${maxLineWidth}px`)

// Option 2: measureLineStats — even cheaper, just line count and widest line.
// No per-line callback, no allocations.
const { lineCount, maxLineWidth: widest } = measureLineStats(prepared, 320)
console.log(`At 320px: ${lineCount} lines, widest = ${widest}px`)
