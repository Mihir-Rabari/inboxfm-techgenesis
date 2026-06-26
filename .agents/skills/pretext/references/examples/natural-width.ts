import { prepareWithSegments, measureNaturalWidth, layout } from '@chenglou/pretext'

// measureNaturalWidth() returns the widest forced line — the width the text
// would take if only hard breaks (not wrapping) caused line breaks.
// Useful for tooltip sizing, popover width clamping, or intrinsic-width layout.

const shortText = 'Tooltip text'
const longText = 'This is a longer description\nthat has a hard break in the middle'

function tooltipWidth(text: string, font: string, maxAllowed: number): number {
  const prepared = prepareWithSegments(text, font)
  const natural = measureNaturalWidth(prepared)
  // Clamp to maxAllowed — if natural width fits, use it (no wrapping)
  return Math.min(natural, maxAllowed)
}

const font = '14px Inter'

const w1 = tooltipWidth(shortText, font, 300)
console.log(`"${shortText}" → ${Math.ceil(w1)}px (no wrap)`)

const w2 = tooltipWidth(longText, font, 300)
console.log(`Hard-break text → ${Math.ceil(w2)}px`)

// You can then pass this width to layout() for the final height
const prepared = prepareWithSegments(longText, font)
const finalWidth = Math.min(measureNaturalWidth(prepared), 300)
const { height, lineCount } = layout(prepared, finalWidth, 20)
console.log(`Final: ${Math.ceil(finalWidth)}px x ${height}px, ${lineCount} lines`)
