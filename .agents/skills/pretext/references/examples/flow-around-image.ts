import { prepareWithSegments, layoutNextLineRange, materializeLineRange, type LayoutCursor } from '@chenglou/pretext'

const text = 'Long article text that needs to flow around an embedded image. 春天到了 🚀 بدأت الرحلة...'
const prepared = prepareWithSegments(text, '16px Inter')

const imageBottom = 150
const imageWidth = 120
const columnWidth = 400
const lineHeight = 24

let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
let y = 0

// layoutNextLineRange() streams one line at a time with varying width.
// Use materializeLineRange() only when you need the actual text string.
while (true) {
  const width = y < imageBottom ? columnWidth - imageWidth : columnWidth
  const range = layoutNextLineRange(prepared, cursor, width)
  if (range === null) break

  const line = materializeLineRange(prepared, range)
  const x = y < imageBottom ? imageWidth : 0
  console.log(`Line at (${x}, ${y}), width=${width}: "${line.text}"`)
  cursor = range.end
  y += lineHeight
}
