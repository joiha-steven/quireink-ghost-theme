/**
 * What a reader actually pays, measured rather than assumed.
 *
 * Not the size of the repository and not the size of the theme folder: the bytes that cross
 * a connection when somebody opens an article once. Gzip, because that is what Ghost serves,
 * and only the four font files a Latin or Vietnamese reader's browser actually fetches — each
 * face declares the characters it covers, so twenty-one ship and four are asked for.
 *
 * A ceiling here is a decision, not a limit imposed by anything. It goes red when the theme
 * grows past what it claims, which is the only time anybody re-reads this number.
 */
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

const THEME = join(import.meta.dir, '..', '..', 'quire-ink')
const gz = async (p: string): Promise<number> =>
  Bun.gzipSync(new Uint8Array(await Bun.file(p).arrayBuffer())).length

const css = ['quireink-base.css', 'quireink-ide.css', 'quireink-tokens.css',
  'quireink-alias.css', 'bridge.css']
const js = ['ghost-bridge.js', 'core.js', 'post.js']
// What one reader on a Latin script fetches: the reading face and the chrome face, each in
// its Latin cut. The rest are other scripts and other weights.
const fonts = ['literata-latin.woff2', 'jetbrainsmono-latin.woff2']

let cssBytes = 0
for (const f of css) cssBytes += await gz(join(THEME, 'assets', 'css', f))
let jsBytes = 0
for (const f of js) jsBytes += await gz(join(THEME, 'assets', 'js', f))
// woff2 is already compressed; gzipping it again is not what happens on the wire.
let fontBytes = 0
for (const f of fonts) fontBytes += (await Bun.file(join(THEME, 'assets', 'fonts', f)).arrayBuffer()).byteLength

const total = cssBytes + jsBytes + fontBytes

// The whole folder, for the record. Ghost uploads it as a zip.
let folder = 0
const walk = async (dir: string): Promise<void> => {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) await walk(p)
    else folder += Bun.file(p).size
  }
}
await walk(THEME)

const CEILING = 250 * 1024
const kb = (n: number) => (n / 1024).toFixed(1) + ' KB'

console.log(`filesize: css ${kb(cssBytes)} gz · js ${kb(jsBytes)} gz · fonts ${kb(fontBytes)}`
  + `  =  ${kb(total)} on a first article  (theme folder ${kb(folder)})`)

if (total > CEILING) {
  console.error(`\nfilesize: OVER — ${kb(total)} against a ceiling of ${kb(CEILING)}.`)
  console.error('  Either something got heavier, or the ceiling is now the wrong number.')
  console.error('  Whichever it is, decide it here rather than letting it drift.')
  process.exit(1)
}
