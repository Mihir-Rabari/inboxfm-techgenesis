import { prepare, layout } from '@chenglou/pretext'

// Development-time verification that labels on buttons, badges, or tabs
// don't overflow to the next line. Useful for CI checks and AI-assisted
// layout validation — no browser needed.

interface UIElement {
  label: string
  font: string
  maxWidth: number  // available width for the label
  lineHeight: number
}

const elements: UIElement[] = [
  { label: 'Submit Order', font: '600 14px Inter', maxWidth: 120, lineHeight: 20 },
  { label: 'Cancel', font: '600 14px Inter', maxWidth: 120, lineHeight: 20 },
  { label: 'Supercalifragilisticexpialidocious', font: '600 14px Inter', maxWidth: 120, lineHeight: 20 },
  { label: '注文を送信', font: '600 14px Inter', maxWidth: 120, lineHeight: 20 },
  { label: 'إرسال', font: '600 14px Inter', maxWidth: 120, lineHeight: 20 },
]

let hasOverflow = false

for (const el of elements) {
  const prepared = prepare(el.label, el.font)
  const { lineCount } = layout(prepared, el.maxWidth, el.lineHeight)

  if (lineCount > 1) {
    console.error(`OVERFLOW: "${el.label}" wraps to ${lineCount} lines at ${el.maxWidth}px`)
    hasOverflow = true
  } else {
    console.log(`OK: "${el.label}" fits in 1 line`)
  }
}

if (hasOverflow) {
  console.error('\nSome labels overflow — widen the container or shorten the text.')
  process.exit(1)
}
