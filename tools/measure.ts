/**
 * Measure a rendered page. `bun tools/measure.ts <url> <width> '<expression>'`
 *
 * Screenshots answer "does it look right"; this answers "is it the number it is supposed to
 * be". Both are needed, and this repository has already been wrong in the gap between them
 * twice — a wide figure whose negative margins had been zeroed rendered as a picture that was
 * simply not wide, and the same figure later crossed the contents rail by 18px while every
 * number about it measured symmetric and correct.
 *
 * The browser, the origin rule and the device-metrics emulation are all in `tools/browser.ts`.
 */
import { withPage, ORIGIN } from './browser'

const [url, widthArg, expr] = process.argv.slice(2)
if (!url || !expr) {
  console.error("usage: bun tools/measure.ts <url> <width> '<expression>'")
  console.error(`       origin is ${ORIGIN}; set QUIREINK_ORIGIN to change it`)
  process.exit(2)
}

try {
  const value = await withPage((at) => at(url, Number(widthArg ?? 1440), expr))
  console.log(JSON.stringify(value, null, 2))
} catch (e) {
  console.error('measure: ' + (e as Error).message)
  process.exit(1)
}
