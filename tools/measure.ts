/**
 * Measure a rendered page. `bun tools/measure.ts <url> <width> '<expression>'`
 *
 * Screenshots answer "does it look right"; this answers "is it the number it is supposed to
 * be". Both are needed, and this repository has already been wrong in the gap between them:
 * a wide figure whose negative margins had been zeroed rendered as a picture that was simply
 * not wide, and nothing in a screenshot says so.
 *
 * Drives a headless Chrome over the DevTools protocol. Same origin rule as tools/shot.sh —
 * Ghost writes its asset URLs against its configured origin, and on any other host CORS takes
 * every script and every font.
 */
import { $ } from 'bun'

const [url, widthArg, expr] = process.argv.slice(2)
if (!url || !expr) {
  console.error("usage: bun tools/measure.ts <url> <width> '<expression>'")
  process.exit(2)
}
const width = Number(widthArg ?? 1440)
const ORIGIN = process.env.QUIREINK_ORIGIN ?? 'http://localhost:2368'
if (!url.startsWith(ORIGIN)) {
  console.error(`measure: ${url} is not on ${ORIGIN}; every script and font would be refused`)
  process.exit(2)
}

const CHROME = process.env.CHROME
  ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const port = 9222 + Math.floor(Math.random() * 500)
const proc = Bun.spawn([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${port}`, `--window-size=${width},1200`,
  '--user-data-dir=' + (await $`mktemp -d`.text()).trim(), 'about:blank'],
  { stdout: 'ignore', stderr: 'ignore' })

async function targets(): Promise<any[]> {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/list`)
      if (r.ok) return await r.json() as any[]
    } catch { /* not up yet */ }
    await Bun.sleep(200)
  }
  throw new Error('measure: Chrome never opened a debugging port')
}

const page = (await targets()).find((t: any) => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const waiting = new Map<number, (v: any) => void>()
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(String(e.data))
  if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)!(msg); waiting.delete(msg.id) }
})
await new Promise((r) => ws.addEventListener('open', r))
const send = (method: string, params: any = {}) => new Promise<any>((resolve) => {
  const n = ++id
  waiting.set(n, resolve)
  ws.send(JSON.stringify({ id: n, method, params }))
})

await send('Page.enable')
// DEVICE METRICS, not a window size. `--headless=new` opens a real window and the window has
// an OS minimum around 500px, so asking for 390 gets a 500px layout — and a phone measurement
// taken that way says the page does not overflow when it is not the page that was measured.
// `Emulation.setDeviceMetricsOverride` sets the viewport the page actually lays out against
// and has no such floor. `tools/shot.sh` solves the same problem with an iframe.
await send('Emulation.setDeviceMetricsOverride', {
  width, height: 1200, deviceScaleFactor: 1, mobile: width < 768,
})
await send('Page.navigate', { url })
// Long enough for the fonts, the inline passes and the deferred bundles.
await Bun.sleep(3500)
const out = await send('Runtime.evaluate', {
  expression: `JSON.stringify((() => (${expr}))())`,
  returnByValue: true,
  awaitPromise: true,
})
ws.close()
proc.kill()

if (out.result?.exceptionDetails || out.result?.result?.subtype === 'error') {
  console.error('measure:', JSON.stringify(out.result, null, 2))
  process.exit(1)
}
console.log(JSON.stringify(JSON.parse(out.result.result.value), null, 2))
