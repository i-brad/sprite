// Convert raw screenshots into Chrome Web Store-ready 1280x800 PNGs using the
// built-in macOS `sips`. Each image is scaled to fit (aspect preserved) then
// centre-padded to exactly 1280x800 with a background colour, so letterboxing
// blends into the app's backdrop.
//
// Usage:
//   node scripts/screenshots.mjs <file...>        # explicit files
//   node scripts/screenshots.mjs                  # all ./Screenshot*.png|jpg
//   SHOT_BG=ffffff node scripts/screenshots.mjs … # light-theme padding
//
// Output: screenshots/sprite-shot-01.png, -02.png, …
import { execSync } from 'node:child_process'
import { readdirSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const W = 1280
const H = 800
const BG = process.env.SHOT_BG || '050505'
const OUT = 'screenshots'

const sh = (cmd) => execSync(cmd, { encoding: 'utf8' })
const q = (s) => `"${s.replace(/"/g, '\\"')}"`

let inputs = process.argv.slice(2)
if (inputs.length === 0) {
  inputs = readdirSync('.')
    .filter((f) => /^Screenshot.*\.(png|jpe?g)$/i.test(f))
    .sort()
}
if (inputs.length === 0) {
  console.error('No input images. Pass files or drop Screenshot*.png in the repo root.')
  process.exit(1)
}

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const dim = (file, key) =>
  Number(sh(`sips -g ${key} ${q(file)}`).match(/:\s*(\d+)/)[1])

inputs.forEach((file, i) => {
  const w = dim(file, 'pixelWidth')
  const h = dim(file, 'pixelHeight')
  const scale = Math.min(W / w, H / h)
  const newW = Math.max(1, Math.round(w * scale))
  const newH = Math.max(1, Math.round(h * scale))
  const out = join(OUT, `sprite-shot-${String(i + 1).padStart(2, '0')}.png`)

  // 1) scale to fit, 2) pad to exact 1280x800 with the backdrop colour.
  sh(`sips -s format png --resampleHeightWidth ${newH} ${newW} ${q(file)} --out ${q(out)}`)
  sh(`sips --padToHeightWidth ${H} ${W} --padColor ${BG} ${q(out)} --out ${q(out)}`)

  const fw = dim(out, 'pixelWidth')
  const fh = dim(out, 'pixelHeight')
  console.log(`✓ ${out}  (${w}x${h} -> ${fw}x${fh})  from ${file}`)
})

console.log(`\nDone — ${inputs.length} store-ready screenshot(s) in ${OUT}/`)
