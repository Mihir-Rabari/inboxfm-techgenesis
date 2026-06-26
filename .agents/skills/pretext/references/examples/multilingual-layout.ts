import { prepare, layout, setLocale } from '@chenglou/pretext'

// Locale-aware measurement for multilingual apps.
// setLocale() retargets the Intl.Segmenter word segmenter and clears caches.
// Existing prepared handles are NOT affected — only future prepare() calls use the new locale.

const japaneseText = '吾輩は猫である。名前はまだ無い。どこで生れたかとんと見当がつかぬ。'
const arabicText = 'بدأت الرحلة في يوم مشمس، حيث كان الجميع متحمسين للمغامرة الجديدة.'
const thaiText = 'ภาษาไทยเป็นภาษาที่มีวรรณยุกต์และมีระบบการเขียนที่เป็นเอกลักษณ์'

const FONT = '16px Inter'
const LINE_HEIGHT = 24
const WIDTH = 300

// Japanese
setLocale('ja')
const jaPrepared = prepare(japaneseText, FONT)
const jaResult = layout(jaPrepared, WIDTH, LINE_HEIGHT)
console.log(`Japanese: ${jaResult.height}px, ${jaResult.lineCount} lines`)

// Arabic
setLocale('ar')
const arPrepared = prepare(arabicText, FONT)
const arResult = layout(arPrepared, WIDTH, LINE_HEIGHT)
console.log(`Arabic: ${arResult.height}px, ${arResult.lineCount} lines`)

// Thai
setLocale('th')
const thPrepared = prepare(thaiText, FONT)
const thResult = layout(thPrepared, WIDTH, LINE_HEIGHT)
console.log(`Thai: ${thResult.height}px, ${thResult.lineCount} lines`)

// Reset to default locale
setLocale()
