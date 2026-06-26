import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')!
const lineHeight = 26

// prepareWithSegments() returns the richer handle needed for manual line layout.
const text = 'Draw this text on a canvas with proper line wrapping and layout. 春天到了 🚀'
const prepared = prepareWithSegments(text, '18px "Helvetica Neue"')
const { lines, height } = layoutWithLines(prepared, 320, lineHeight)

canvas.width = 320
canvas.height = height
ctx.font = '18px "Helvetica Neue"'

// Each line has .text, .width, .start and .end cursors
for (let i = 0; i < lines.length; i++) {
  ctx.fillText(lines[i].text, 0, (i + 1) * lineHeight)
}
