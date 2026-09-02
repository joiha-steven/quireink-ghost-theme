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
// NAMED FOR THE THEME, NOT FOR THE RELEASE. Ghost takes the theme's id from the ZIP'S
// FILENAME, not from package.json — measured on Ghost 6.62 by uploading through the real admin
// endpoint: `quire-ink-0.1.0.zip` installed a theme called `quire-ink-0.1.0` sitting BESIDE the
// existing `quire-ink`, both reporting `package.name: quire-ink`.
//
// So a version in the filename turns every upgrade into a second theme the owner has to
// activate and then delete, with the old one still on disk. `quire-ink.zip` replaces what is
// there, which is what an upgrade is. The version lives in package.json, which is where Ghost
// reads the one it displays.
const out = join(ROOT, '.tmp', `${pkg.name}.zip`)

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
console.log(`zip: ${out}  ${(size / 1024).toFixed(0)} KB  (${pkg.name} ${pkg.version})`)
console.log('     Ghost → Settings → Design → Change theme → Upload theme')
