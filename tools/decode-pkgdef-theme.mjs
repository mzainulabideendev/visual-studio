// Decodes Visual Studio *.pkgdef theme color blobs (hex "Data" values) into JSON.
// Entry layout (little endian): int32 nameLen, UTF8 name, byte kind(1=color), B,G,R,A
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const [, , input, output] = process.argv;

const text = readFileSync(input, "utf8");
const lines = text.split(/\r?\n/);

const result = {}; // category -> { name: "#RRGGBBAA" }
let current = null;

for (const line of lines) {
  const section = line.match(/^\[(.+)\]\s*$/);
  if (section) {
    const m = section[1].match(/Themes\\\{[^}]+\}\\(.+)$/i);
    current = m ? m[1] : section[1];
    if (!result[current]) result[current] = {};
    continue;
  }
  const data = line.match(/^\s*"Data"\s*=\s*hex:(.+)$/i);
  if (!data || !current) continue;

  const bytes = Buffer.from(data[1].replace(/[^0-9a-f]/gi, ""), "hex");
  let off = 0;
  const u32 = () => {
    const v = bytes.readUInt32LE(off);
    off += 4;
    return v;
  };
  u32(); // total block size
  u32(); // format word
  u32(); // format version
  off += 16; // category guid
  const count = u32();
  const parsed = [];
  while (off < bytes.length && parsed.length < count) {
    const nameLen = u32();
    if (nameLen <= 0 || nameLen > 512 || off + nameLen > bytes.length) break;
    const name = bytes.subarray(off, off + nameLen).toString("utf8");
    off += nameLen;
    const kind = bytes[off++];
    if (kind !== 1) break;
    const b = bytes[off++], g = bytes[off++], r = bytes[off++], a = bytes[off++];
    const hasAlt = bytes[off++];
    if (hasAlt === 1) off += 4; // secondary (high-contrast) color, not used here
    parsed.push([name, r, g, b, a]);
  }
  for (const [name, r, g, b, a] of parsed) {
    result[current][name] = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("") +
      (a === 0xff ? "" : a.toString(16).padStart(2, "0"));
  }
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(result, null, 1));
console.log(
  "categories:", Object.keys(result).length,
  "colors:", Object.values(result).reduce((n, o) => n + Object.keys(o).length, 0),
);
