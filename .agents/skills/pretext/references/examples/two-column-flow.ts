import { prepareWithSegments, layoutNextLineRange, materializeLineRange, type LayoutCursor } from '@chenglou/pretext'

// Two-column editorial flow: text streams continuously from one column
// into the next, like a newspaper or magazine layout.
// Uses layoutNextLineRange() to consume lines one at a time.

const article = `Pretext side-steps the need for DOM measurements, which trigger layout reflow, one of the most expensive operations in the browser. It implements its own text measurement logic, using the browsers' own font engine as ground truth. The result is pixel-perfect across Chrome, Safari, and Firefox, supporting all languages including emoji, mixed-bidi, CJK, Thai, Arabic, and more.`

const prepared = prepareWithSegments(article, '15px Georgia')

const COLUMN_WIDTH = 260
const COLUMN_GAP = 24
const LINE_HEIGHT = 22
const MAX_COLUMN_HEIGHT = 200
const linesPerColumn = Math.floor(MAX_COLUMN_HEIGHT / LINE_HEIGHT)

let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
let column = 0

while (true) {
  const x = column * (COLUMN_WIDTH + COLUMN_GAP)
  console.log(`\n--- Column ${column + 1} (x=${x}) ---`)

  let linesInColumn = 0
  while (linesInColumn < linesPerColumn) {
    const range = layoutNextLineRange(prepared, cursor, COLUMN_WIDTH)
    if (range === null) break

    const line = materializeLineRange(prepared, range)
    const y = linesInColumn * LINE_HEIGHT
    console.log(`  (${x}, ${y}) "${line.text}"`)

    cursor = range.end
    linesInColumn++
  }

  // Check if there's more text to flow into the next column
  const nextRange = layoutNextLineRange(prepared, cursor, COLUMN_WIDTH)
  if (nextRange === null) break
  // Put cursor back — we just peeked
  column++
}
