import { prepareWithSegments, walkLineRanges, measureLineStats } from '@chenglou/pretext'

// Balanced text layout: binary-search for the narrowest width where
// all lines are roughly equal, avoiding one short orphan line at the end.
// This is the "shrink-wrap + balance" pattern from walkLineRanges docs.

const text = 'This text should be balanced across lines so no single line is awkwardly short compared to the others.'
const prepared = prepareWithSegments(text, '16px Inter')
const lineHeight = 24

// Step 1: find how many lines at a generous width
const maxWidth = 600
const { lineCount: targetLines } = measureLineStats(prepared, maxWidth)

if (targetLines <= 1) {
  // Single line — just use measureLineStats for the width
  const { maxLineWidth } = measureLineStats(prepared, maxWidth)
  console.log(`Single line, width: ${maxLineWidth}px`)
} else {
  // Step 2: binary search for the narrowest width that keeps the same line count
  let lo = 50
  let hi = maxWidth
  while (hi - lo > 1) {
    const mid = (lo + hi) / 2
    const { lineCount } = measureLineStats(prepared, mid)
    if (lineCount <= targetLines) {
      hi = mid
    } else {
      lo = mid
    }
  }

  // Step 3: verify the balanced result
  let maxLineWidth = 0
  let minLineWidth = Infinity
  walkLineRanges(prepared, hi, line => {
    if (line.width > maxLineWidth) maxLineWidth = line.width
    if (line.width < minLineWidth) minLineWidth = line.width
  })

  console.log(`Balanced at ${Math.ceil(hi)}px`)
  console.log(`Line widths: ${Math.round(minLineWidth)}px – ${Math.round(maxLineWidth)}px`)
  console.log(`Variance: ${Math.round(maxLineWidth - minLineWidth)}px`)
}
