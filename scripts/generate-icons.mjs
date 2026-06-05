// Dependency-free icon generator: rasterizes the Sprite mascot (a neon
// ghost-blob with dark eyes) into valid PNGs at 16/48/128. No build deps.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'icons')
mkdirSync(OUT, { recursive: true })

const CLEAR = [0, 0, 0, 0] // transparent
const NEON = [198, 255, 0, 255] // #c6ff00 — body
const DARK = [5, 5, 5, 255] // #050505 — eyes + antenna
const NEON_DIM = [155, 204, 0, 255] // soft edge

// CRC32 (PNG chunk checksums).
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

// Mascot silhouette in normalized [0,1] coords — rounded head, straight sides,
// scalloped ghost bottom, two eyes, and an antenna dot.
function mascotColor(nx, ny) {
  const cx = 0.5
  const left = 0.18
  const right = 0.82
  const top = 0.16
  const radius = (right - left) / 2
  const headY = top + radius
  const baseBottom = 0.84

  // antenna dot (top-right)
  if (dist(nx, ny, 0.66, 0.1) < 0.06) return DARK

  // scalloped bottom edge
  const t = (nx - left) / (right - left)
  const scallop = 0.06 * Math.abs(Math.sin(t * Math.PI * 3))
  const bottom = baseBottom - scallop

  let inside = nx >= left && nx <= right && ny >= top && ny <= bottom
  if (inside && ny < headY) {
    // round the top
    inside = dist(nx, ny, cx, headY) <= radius
  }
  if (!inside) return CLEAR

  // eyes
  if (dist(nx, ny, 0.39, 0.5) < 0.08 || dist(nx, ny, 0.61, 0.5) < 0.08) return DARK

  // soft 1px-ish neon edge near the silhouette boundary
  const edgeBand =
    nx < left + 0.03 || nx > right - 0.03 || ny < top + 0.03 || ny > bottom - 0.03
  return edgeBand ? NEON_DIM : NEON
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by)
}

function png(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  let p = 0
  for (let y = 0; y < size; y++) {
    raw[p++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      // sample at pixel centre
      const c = mascotColor((x + 0.5) / size, (y + 0.5) / size)
      raw[p++] = c[0]
      raw[p++] = c[1]
      raw[p++] = c[2]
      raw[p++] = c[3]
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [16, 48, 128]) {
  writeFileSync(join(OUT, `icon-${size}.png`), png(size))
  console.log(`wrote icon-${size}.png`)
}
