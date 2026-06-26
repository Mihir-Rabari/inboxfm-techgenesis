import { prepareWithSegments, walkLineRanges, layoutWithLines } from '@chenglou/pretext'

// Chat bubble shrink-wrap: find the tightest bubble width for each message,
// then render lines at that width. This is the pattern from the bubbles demo.

interface Bubble {
  text: string
  maxWidth: number   // max bubble width (e.g. 70% of container)
  lineHeight: number
}

function layoutBubble(bubble: Bubble) {
  const prepared = prepareWithSegments(bubble.text, '15px Inter')

  // Step 1: find the widest line — that's the shrink-wrap width
  let shrinkWidth = 0
  walkLineRanges(prepared, bubble.maxWidth, line => {
    if (line.width > shrinkWidth) shrinkWidth = line.width
  })

  // Round up to avoid sub-pixel rounding issues in CSS
  shrinkWidth = Math.ceil(shrinkWidth)

  // Step 2: lay out at the shrink-wrapped width for rendering
  const { lines, height } = layoutWithLines(prepared, shrinkWidth, bubble.lineHeight)

  return { shrinkWidth, height, lines }
}

const messages = [
  { text: 'Hey!', maxWidth: 280, lineHeight: 22 },
  { text: 'Did you see the new release? It has support for CJK, Arabic, Thai, emoji 🚀, and more.', maxWidth: 280, lineHeight: 22 },
  { text: 'Short', maxWidth: 280, lineHeight: 22 },
]

for (const msg of messages) {
  const { shrinkWidth, height, lines } = layoutBubble(msg)
  console.log(`Bubble: ${shrinkWidth}px x ${height}px, ${lines.length} line(s)`)
  for (const line of lines) {
    console.log(`  "${line.text}"`)
  }
}
