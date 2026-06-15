// 依存なしで PWA 用 PNG アイコンを生成する（zlib のみ使用）。
// 紺色背景に水色のダンベル風モチーフを描いた単純な正方形アイコン。
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const BG = [15, 23, 42, 255]      // #0f172a
const FG = [56, 189, 248, 255]    // #38bdf8

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
  }
  return ~c >>> 0
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

// 0..1 の正規化座標で前景に塗るかどうか（ダンベル風）
function isForeground(nx, ny) {
  const inBand = ny > 0.44 && ny < 0.56
  const bar = inBand && nx > 0.34 && nx < 0.66
  const plateInner = ny > 0.36 && ny < 0.64
  const plateOuter = ny > 0.30 && ny < 0.70
  const lInner = plateInner && nx > 0.24 && nx < 0.30
  const rInner = plateInner && nx > 0.70 && nx < 0.76
  const lOuter = plateOuter && nx > 0.16 && nx < 0.22
  const rOuter = plateOuter && nx > 0.78 && nx < 0.84
  return bar || lInner || rInner || lOuter || rOuter
}

function makePng(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  let p = 0
  for (let y = 0; y < size; y++) {
    raw[p++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const c = isForeground(x / size, y / size) ? FG : BG
      raw[p++] = c[0]; raw[p++] = c[1]; raw[p++] = c[2]; raw[p++] = c[3]
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), makePng(size))
  console.log(`wrote icons/icon-${size}.png`)
}
