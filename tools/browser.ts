/**
 * One headless Chrome, driven over the DevTools protocol, for every tool here that needs a
 * page rather than a file.
 *
 * It exists because three of them do — `measure.ts`, `checks/live.ts` and `checks/a11y.ts` —
 * and three copies of a WebSocket handshake is three places for the same bug. The bug is not
 * hypothetical: the first copy stringified the result before awaiting it, so an `async`
 * expression came back as `{}`, which reads as a page with nothing on it rather than as a
 * broken tool.
 *
 * TWO THINGS IT REFUSES, each because the same picture already lied in the sibling WordPress
 * port:
 *
 *   THE ORIGIN. Ghost writes every asset URL against its configured `url`. Ask for the same
 *   page on another host and CORS refuses every module script and every font: no contents
 *   rail, no timeline, no book mode, and the type falls back to something close enough that
 *   nobody looks twice.
 *
 *   THE WIDTH, which it does not refuse so much as sidestep. `--headless=new` opens a real
 *   window with an OS minimum around 500px, so a 390px request comes back as a 500px layout —
 *   and a phone measurement taken that way says the page does not overflow when it is not the
 *   page that was measured. `Emulation.setDeviceMetricsOverride` has no such floor.
 */
import { $ } from 'bun'

export const ORIGIN = process.env.QUIREINK_ORIGIN ?? 'http://localhost:2368'
const CHROME = process.env.CHROME
  ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

/** Measure `expr` on `url` at `width`. Async expressions are awaited. */
export type At = (url: string, width: number, expr: string) => Promise<any>

export function assertOrigin(url: string): void {
  if (url.startsWith(ORIGIN)) return
  throw new Error(`${url} is not on ${ORIGIN}.\n`
    + '  Ghost writes its asset URLs against that origin; on any other host CORS refuses\n'
    + '  every script and every font, and what you measure is a page with no behaviour.\n'
    + '  Set QUIREINK_ORIGIN to drive a site that really is served elsewhere.')
}

/** True when something is answering on ORIGIN. Every check that needs a page skips without it. */
export async function origins(): Promise<boolean> {
  return fetch(ORIGIN).then((r) => r.ok).catch(() => false)
}

/**
 * Open a browser, hand `run` a measuring function, and close it whatever happens.
 *
 * `settle` is how long to wait after navigation. It has to cover the fonts, the two inline
 * passes and the deferred bundles; 2.5s is measured to be enough on this stack and is not a
 * number worth tuning down to save a second in a check nobody runs in a loop.
 */
export async function withPage<T>(run: (at: At) => Promise<T>, settle = 2500): Promise<T> {
  const port = 9222 + Math.floor(Math.random() * 500)
  const profile = (await $`mktemp -d`.text()).trim()
  const proc = Bun.spawn([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--remote-debugging-port=${port}`, '--window-size=1440,1200',
    `--user-data-dir=${profile}`, 'about:blank'], { stdout: 'ignore', stderr: 'ignore' })

  let ws: WebSocket | undefined
  try {
    let target: any
    for (let i = 0; i < 60 && !target; i++) {
      try {
        const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json() as any[]
        target = list.find((t) => t.type === 'page')
      } catch { await Bun.sleep(200) }
    }
    if (!target) throw new Error('Chrome never opened a debugging port')

    ws = new WebSocket(target.webSocketDebuggerUrl)
    let id = 0
    const waiting = new Map<number, (v: any) => void>()
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(String(e.data))
      if (msg.id && waiting.has(msg.id)) { waiting.get(msg.id)!(msg); waiting.delete(msg.id) }
    })
    await new Promise((r) => ws!.addEventListener('open', r))

    const send = (method: string, params: any = {}) => new Promise<any>((resolve) => {
      const n = ++id
      waiting.set(n, resolve)
      ws!.send(JSON.stringify({ id: n, method, params }))
    })
    await send('Page.enable')

    const at: At = async (url, width, expr) => {
      assertOrigin(url)
      await send('Emulation.setDeviceMetricsOverride',
        { width, height: 1200, deviceScaleFactor: 1, mobile: width < 768 })
      await send('Page.navigate', { url })
      await Bun.sleep(settle)
      const out = await send('Runtime.evaluate', {
        // Promise.resolve so an ASYNC expression works. Stringifying first turned a pending
        // promise into `{}`.
        expression: `Promise.resolve((() => (${expr}))()).then(v => JSON.stringify(v))`,
        returnByValue: true,
        awaitPromise: true,
      })
      const value = out.result?.result?.value
      if (typeof value !== 'string') {
        throw new Error('the expression did not return a value:\n'
          + JSON.stringify(out.result, null, 2).slice(0, 800))
      }
      return JSON.parse(value)
    }

    return await run(at)
  } finally {
    ws?.close()
    proc.kill()
  }
}
