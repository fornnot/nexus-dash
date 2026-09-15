// Generates public/icons/icon-192.png, icon-512.png and public/favicon.svg
// with zero dependencies: draws a rounded-square glyph to a canvas and
// encodes PNGs manually (zlib via node:zlib, chunks via CRC32).
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* ---------------------------------- PNG ---------------------------------- */

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([len, typeBytes, data, crc]);
}

/** Encode RGBA pixel data (w*h*4) as a PNG buffer. */
function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------- Glyph art ------------------------------- */

function hexToRgb(hex) {
  const v = hex.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function blend(base, top, alpha) {
  return Math.round(base + (top - base) * alpha);
}

/**
 * Draw the logo into rgba buffers. `pad` is the fraction of the tile kept as
 * transparent margin; maskable icons need a big safe zone (~20%).
 */
function drawIcon(size, { pad = 0.08 } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const bg = hexToRgb('#09090b');
  const accent = hexToRgb('#22d3ee'); // cyan-400
  const accent2 = hexToRgb('#a78bfa'); // violet-400
  const inner = size * (1 - 2 * pad);
  const r = inner * 0.24; // rounded-square radius
  const cx = size / 2;
  const cy = size / 2;
  const half = inner / 2;

  const insideRoundedSquare = (x, y) => {
    const dx = Math.abs(x - cx) - (half - r);
    const dy = Math.abs(y - cy) - (half - r);
    const ox = Math.max(dx, 0);
    const oy = Math.max(dy, 0);
    return Math.hypot(ox, oy) <= r;
  };

  // "N" glyph made of two verticals + diagonal, drawn with anti-aliased strokes.
  const strokeW = inner * 0.14;
  const nTop = cy - inner * 0.26;
  const nBot = cy + inner * 0.26;
  const nLeft = cx - inner * 0.22;
  const nRight = cx + inner * 0.22;

  const distToSegment = (x, y, x1, y1, x2, y2) => {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const wx = x - x1;
    const wy = y - y1;
    const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));
    return Math.hypot(x - (x1 + t * vx), y - (y1 + t * vy));
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      if (!insideRoundedSquare(x + 0.5, y + 0.5)) {
        px[idx] = 0;
        px[idx + 1] = 0;
        px[idx + 2] = 0;
        px[idx + 3] = 0;
        continue;
      }
      // Subtle vertical gradient background: #18181b -> #09090b.
      const t = y / size;
      px[idx] = blend(0x18, 0x09, t);
      px[idx + 1] = blend(0x18, 0x09, t);
      px[idx + 2] = blend(0x1b, 0x09, t);
      px[idx + 3] = 255;

      const d1 = distToSegment(x + 0.5, y + 0.5, nLeft, nBot, nLeft, nTop);
      const d2 = distToSegment(x + 0.5, y + 0.5, nRight, nBot, nRight, nTop);
      const d3 = distToSegment(x + 0.5, y + 0.5, nLeft, nBot, nRight, nTop);
      const d = Math.min(d1, d2, d3);
      const a = Math.max(0, Math.min(1, strokeW / 2 - d + 0.5));
      if (a <= 0) continue;
      // Horizontal gradient across the glyph: cyan -> violet.
      const gx = (x / size - 0.28) / 0.44;
      const g = Math.max(0, Math.min(1, gx));
      px[idx] = blend(px[idx], blend(accent[0], accent2[0], g), a);
      px[idx + 1] = blend(px[idx + 1], blend(accent[1], accent2[1], g), a);
      px[idx + 2] = blend(px[idx + 2], blend(accent[2], accent2[2], g), a);
    }
  }
  return px;
}

mkdirSync(resolve(root, 'public/icons'), { recursive: true });
writeFileSync(resolve(root, 'public/icons/icon-192.png'), encodePng(192, 192, drawIcon(192)));
writeFileSync(resolve(root, 'public/icons/icon-512.png'), encodePng(512, 512, drawIcon(512)));
writeFileSync(
  resolve(root, 'public/favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22d3ee"/>
      <stop offset="1" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="#09090b"/>
  <g stroke="url(#g)" stroke-width="7" stroke-linecap="round" fill="none">
    <line x1="22" y1="46" x2="22" y2="18"/>
    <line x1="42" y1="46" x2="42" y2="18"/>
    <line x1="22" y1="46" x2="42" y2="18"/>
  </g>
</svg>
`,
);
console.log('✔ icons generated: public/icons/icon-192.png, icon-512.png, public/favicon.svg');
