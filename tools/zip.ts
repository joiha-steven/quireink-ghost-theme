/**
 * The uploadable theme. `bun run zip` → `.tmp/quire-ink-<version>.zip`
 *
 * Runs the checks first, because a zip that fails `gscan` is a zip Ghost refuses on upload and
 * the person holding it is usually not the person who can fix it.
 *
 * The zip's ROOT FOLDER has to be `quire-ink`, matching `package.json`'s name: Ghost takes the
 * folder name as the theme id, and a zip whose root is `theme/` installs a theme called
 * `theme` whose `package.json` says something else.
 */
import { $ } from 'bun'
import { join } from 'node:path'
import { mkdir, rm } from 'node:fs/promises'

const ROOT = join(import.meta.dir, '..')
const pkg = await Bun.file(join(ROOT, 'quire-ink', 'package.json')).json()
const out = join(ROOT, '.tmp', `quire-ink-${pkg.version}.zip`)

const checks = await $`bun run check:all`.cwd(ROOT).nothrow()
if (checks.exitCode !== 0) {
  console.error(checks.stdout.toString() + checks.stderr.toString())
  console.error('\nzip: the checks are red. Not packaging.')
  process.exit(1)
}

await mkdir(join(ROOT, '.tmp'), { recursive: true })
await rm(out, { force: true })
// -x excludes the OS noise that otherwise rides along and shows up in a theme review.
await $`zip -r -q ${out} quire-ink -x '*.DS_Store' -x '__MACOSX/*'`.cwd(ROOT)

const size = Bun.file(out).size
console.log(`zip: ${out}  ${(size / 1024).toFixed(0)} KB  (quire-ink ${pkg.version})`)
console.log('     Ghost → Settings → Design → Change theme → Upload theme')
