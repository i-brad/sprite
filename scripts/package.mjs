// Build the extension and zip dist/ into a versioned, store-ready archive.
// Usage: npm run package  ->  sprite-v<version>.zip at the repo root.
import { execSync } from 'node:child_process'
import { readFileSync, rmSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const zipName = `sprite-v${pkg.version}.zip`
const zipPath = join(root, zipName)

const run = (cmd, opts = {}) =>
  execSync(cmd, { stdio: 'inherit', cwd: root, ...opts })

console.log('▸ Building…')
run('npm run build')

if (existsSync(zipPath)) rmSync(zipPath)

console.log(`▸ Zipping dist/ -> ${zipName}`)
// Zip the *contents* of dist/ so manifest.json sits at the archive root, which
// is what the Chrome Web Store requires. Exclude macOS cruft.
run(`zip -r -X "${zipPath}" . -x "*.DS_Store" "__MACOSX/*"`, {
  cwd: join(root, 'dist'),
})

console.log(`\n✓ ${zipName} ready — upload this at chrome.google.com/webstore/devconsole`)
