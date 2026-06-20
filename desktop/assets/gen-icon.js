// 陣取りテーマの正方形アイコンPNGを純Node（zlib）で生成する補助スクリプト。
// 実行: node assets/gen-icon.js  → assets/icon.png (512x512)
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const SIZE = 512;
const BG = [11, 18, 32];        // #0b1220
const SELF = [14, 165, 233];    // #0ea5e9
const ENEMY = [239, 68, 68];    // #ef4444
const GRID = [30, 41, 59];      // セル境界

// 8x8 の盤面パターン（1=自陣, 2=敵陣, 0=空き）
const board = [
  [1, 1, 1, 0, 0, 2, 2, 2],
  [1, 1, 1, 0, 0, 2, 2, 2],
  [1, 1, 0, 0, 2, 2, 2, 0],
  [0, 1, 0, 0, 0, 2, 0, 0],
  [0, 0, 1, 0, 0, 2, 0, 0],
  [0, 1, 1, 1, 2, 2, 2, 0],
  [1, 1, 1, 0, 0, 2, 2, 2],
  [1, 1, 1, 0, 0, 2, 2, 2]
];

const N = 8;
const cell = SIZE / N;
const pad = 2; // セル間の隙間

function colorAt(x, y) {
  const cx = Math.floor(x / cell);
  const cy = Math.floor(y / cell);
  const ix = x - cx * cell;
  const iy = y - cy * cell;
  if (ix < pad || iy < pad || ix >= cell - pad || iy >= cell - pad) return GRID;
  const v = board[cy][cx];
  if (v === 1) return SELF;
  if (v === 2) return ENEMY;
  return BG;
}

// 生スキャンライン（各行先頭にフィルタバイト0）
const raw = Buffer.alloc((SIZE * 3 + 1) * SIZE);
let p = 0;
for (let y = 0; y < SIZE; y++) {
  raw[p++] = 0;
  for (let x = 0; x < SIZE; x++) {
    const c = colorAt(x, y);
    raw[p++] = c[0];
    raw[p++] = c[1];
    raw[p++] = c[2];
  }
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 2;  // color type: truecolor RGB
const idat = zlib.deflateSync(raw, { level: 9 });
const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0))
]);

const out = path.join(__dirname, 'icon.png');
fs.writeFileSync(out, png);
console.log('wrote', out, png.length, 'bytes');
