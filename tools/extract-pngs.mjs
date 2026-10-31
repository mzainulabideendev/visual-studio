// Extract embedded PNG icon blobs from a PE file (VS stores the 256px icon as raw PNG).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const src = process.argv[2];
const outDir = process.argv[3];
mkdirSync(outDir, { recursive: true });
const b = readFileSync(src);
const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const iend = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
let off = 0, n = 0;
while ((off = b.indexOf(sig, off)) !== -1) {
  const end = b.indexOf(iend, off);
  if (end === -1) break;
  const stop = end + 8;
  const png = b.subarray(off, stop);
  const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
  const name = `${outDir}/icon-${w}x${h}-${n}.png`;
  writeFileSync(name, png);
  console.log(name, png.length);
  n++;
  off = stop;
}
if (!n) console.log("no png resources");
