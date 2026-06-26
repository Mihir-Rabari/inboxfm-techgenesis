import { prepare, layout } from '@chenglou/pretext'

// Use { whiteSpace: 'pre-wrap' } for textarea-like text where
// ordinary spaces, \t tabs, and \n hard breaks stay visible.
// Tabs follow default browser-style tab-size: 8 stops.
const textareaValue = "Multi-line\ntextarea content\twith tabs\ngoes here"
const textareaWidth = 300

const prepared = prepare(textareaValue, '16px Inter', { whiteSpace: 'pre-wrap' })
const { height, lineCount } = layout(prepared, textareaWidth, 24)

// Auto-size the textarea element
// textarea.style.height = `${height}px`
console.log(`Textarea height: ${height}px, Lines: ${lineCount}`)
