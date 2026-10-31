// Wraps a PNG into a single-image Windows .ico file.
// Windows Vista+ accepts PNG-compressed ICO entries, so no re-encoding is needed.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const src = process.argv[2] ?? "public/vs-icon.png";
const dest = process.argv[3] ?? src.replace(/\.png$/i, ".ico");

if (!existsSync(src)) {
  console.error(`source PNG not found: ${src}`);
  process.exit(1);
}

const png = readFileSync(src);
if (png.readUInt32BE(0) !== 0x89504e47) {
  console.error(`${src} is not a PNG file`);
  process.exit(1);
}

const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // image count

const entry = Buffer.alloc(16);
entry.writeUInt8(width >= 256 ? 0 : width, 0);
entry.writeUInt8(height >= 256 ? 0 : height, 1);
entry.writeUInt8(0, 2); // palette colours
entry.writeUInt8(0, 3); // reserved
entry.writeUInt16LE(1, 4); // colour planes
entry.writeUInt16LE(32, 6); // bits per pixel
entry.writeUInt32LE(png.length, 8);
entry.writeUInt32LE(22, 12); // offset: 6 + 16

writeFileSync(dest, Buffer.concat([header, entry, png]));
console.log(`wrote ${dest} (${width}x${height}, ${png.length} bytes png)`);
console.log(path.resolve(dest));
