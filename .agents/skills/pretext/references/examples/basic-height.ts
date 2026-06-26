import { prepare, layout } from '@chenglou/pretext'

// prepare() does one-time text analysis + canvas measurement.
// Reuse the handle — only re-prepare if text or font changes.
const prepared = prepare('AGI 春天到了. بدأت الرحلة 🚀‎', '16px Inter')

// layout() is pure arithmetic over cached widths — no DOM, no canvas calls.
// Call it again on resize with the new width; no need to re-prepare.
const { height, lineCount } = layout(prepared, 400, 24)

// Use the height for virtualized lists, dynamic containers, scroll anchoring
console.log(`Height: ${height}px, Lines: ${lineCount}`)

// For CJK/Hangul text that should avoid breaking within words:
const cjkPrepared = prepare('한글 텍스트 예시', '16px Inter', { wordBreak: 'keep-all' })
const cjkResult = layout(cjkPrepared, 400, 24)
console.log(`CJK height: ${cjkResult.height}px`)
