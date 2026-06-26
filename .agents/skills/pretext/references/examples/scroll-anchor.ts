import { prepare, layout, type PreparedText } from '@chenglou/pretext'

// Prevent layout shift when new content loads above the viewport.
// Predict exact height of incoming items before inserting them into the DOM,
// then offset scroll position by that amount — zero visible jank.

interface ChatItem {
  text: string
  prepared: PreparedText
}

const FONT = '15px Inter'
const LINE_HEIGHT = 22
const BUBBLE_PADDING = 16

function prepareItem(text: string): ChatItem {
  return { text, prepared: prepare(text, FONT) }
}

function itemHeight(item: ChatItem, width: number): number {
  const { height } = layout(item.prepared, width - BUBBLE_PADDING * 2, LINE_HEIGHT)
  return height + BUBBLE_PADDING
}

// Simulate loading older messages at the top
const existingItems = [
  prepareItem('Latest message'),
  prepareItem('Previous message with more text that wraps'),
]

const newItems = [
  prepareItem('Old message loaded from history 📜'),
  prepareItem('Even older message with emoji 春天到了 and mixed scripts بدأت'),
]

const containerWidth = 400

// Calculate total height of new items BEFORE inserting into DOM
let insertedHeight = 0
for (const item of newItems) {
  insertedHeight += itemHeight(item, containerWidth)
}

// Adjust scroll position to keep the viewport anchored
// scrollContainer.scrollTop += insertedHeight
console.log(`Scroll offset adjustment: ${insertedHeight}px`)
