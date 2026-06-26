import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

// Render wrapped text into SVG <text> elements with proper line breaking.
// Pretext handles the layout; you just place <tspan> elements at the right y.

const text = 'SVG has no native text wrapping. Pretext gives you the lines — you render them as <tspan> elements with correct dy offsets.'
const font = '14px Inter'
const maxWidth = 280
const lineHeight = 20

const prepared = prepareWithSegments(text, font)
const { lines, height } = layoutWithLines(prepared, maxWidth, lineHeight)

// Build an SVG string
const tspans = lines.map((line, i) => {
  const y = (i + 1) * lineHeight
  return `  <tspan x="0" y="${y}">${escapeXml(line.text)}</tspan>`
}).join('\n')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${maxWidth}" height="${height}">
  <text font-family="Inter" font-size="14">
${tspans}
  </text>
</svg>`

console.log(svg)

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
