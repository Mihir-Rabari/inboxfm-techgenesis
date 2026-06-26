import { prepare, layout, type PreparedText } from '@chenglou/pretext'

// Virtualized list with variable row heights — the core use case for Pretext.
// prepare() once per item, layout() on every resize. No DOM reflow, no guesstimates.

interface Message {
  id: string
  text: string
  font: string
}

const messages: Message[] = [
  { id: '1', text: 'Hey, did you see the new release? 🚀', font: '15px Inter' },
  { id: '2', text: 'AGI 春天到了. بدأت الرحلة — this is going to be a long message that wraps across multiple lines in the chat view.', font: '15px Inter' },
  { id: '3', text: 'Short reply', font: '15px Inter' },
]

const LINE_HEIGHT = 22
const PADDING = 16 // vertical padding per bubble

// Cache prepared handles — only re-prepare if text or font changes
const cache = new Map<string, PreparedText>()

function getRowHeight(msg: Message, containerWidth: number): number {
  let prepared = cache.get(msg.id)
  if (!prepared) {
    prepared = prepare(msg.text, msg.font)
    cache.set(msg.id, prepared)
  }
  // layout() is pure arithmetic — safe to call thousands of times on resize
  const { height } = layout(prepared, containerWidth - PADDING * 2, LINE_HEIGHT)
  return height + PADDING
}

// On resize, just re-call layout() through getRowHeight — no re-preparation needed
const containerWidth = 360
for (const msg of messages) {
  const h = getRowHeight(msg, containerWidth)
  console.log(`Message ${msg.id}: ${h}px`)
}
