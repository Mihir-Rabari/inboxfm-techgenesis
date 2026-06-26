import { prepare, layout, type PreparedText } from '@chenglou/pretext'

// The canonical resize pattern: prepare() once, layout() on every resize.
// layout() is pure arithmetic — no DOM reads, no canvas calls, no allocations.
// Safe to call in a ResizeObserver or requestAnimationFrame loop.

const text = 'This text will be re-measured on every resize without any DOM reflow. The prepared handle caches all segment widths from the one-time canvas measurement pass.'
const FONT = '16px Inter'
const LINE_HEIGHT = 24

// prepare() is the expensive part — do it once
const prepared: PreparedText = prepare(text, FONT)

// Simulate a resize handler
function onResize(containerWidth: number) {
  // layout() is the cheap part — pure math over cached widths
  const { height, lineCount } = layout(prepared, containerWidth, LINE_HEIGHT)
  // container.style.height = `${height}px`
  return { height, lineCount }
}

// Example: responsive breakpoints
const widths = [800, 600, 400, 300, 200]
for (const w of widths) {
  const { height, lineCount } = onResize(w)
  console.log(`${w}px → ${height}px (${lineCount} lines)`)
}

// In a real app:
// const prepared = prepare(text, font)
// new ResizeObserver(([entry]) => {
//   const { height } = layout(prepared, entry.contentRect.width, lineHeight)
//   element.style.height = `${height}px`
// }).observe(container)
