/**
 * Packs Release/linux/linux-unpacked into a Linux-friendly .tar.gz.
 *
 * Windows cannot set Unix permission bits, so a plain zip loses the executable
 * bit on the Electron binary and the app will not start after extraction.
 * This writes the tar headers itself, marking the binaries 0755, so Linux users
 * can extract the archive and run the app directly.
 *
 * Usage: node tools/pack-linux-tar.mjs [--dir <unpacked>] [--out <file>]
 */
import { createReadStream, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const root = path.resolve(arg("--dir") ?? "Release/linux/linux-unpacked");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const out = path.resolve(arg("--out") ?? `Release/VisualStudioClone-${pkg.version}-linux-x64.tar.gz`);

if (!existsSync(path.join(root, "visual-studio-clone"))) {
  console.error(`❌ Linux build not found at ${root}.`);
  console.error('Run "npm run build && npx electron-builder --linux dir --x64 --config.directories.output=Release/linux" first.');
  process.exit(1);
}

const BLOCK = 512;
const chunks = [];
const padTo = (size) => (size % BLOCK === 0 ? 0 : BLOCK - (size % BLOCK));

function octal(value, width) {
  return value.toString(8).padStart(width - 1, "0") + "\0";
}

function header(name, { mode = 0o644, size = 0, type = "0", linkname = "", mtime = 0 } = {}) {
  const buf = Buffer.alloc(BLOCK, 0);
  buf.write(name.slice(0, 100), 0, 100, "utf8");
  buf.write(octal(mode, 8), 100, 8, "ascii");
  buf.write(octal(0, 8), 108, 8, "ascii");
  buf.write(octal(0, 8), 116, 8, "ascii");
  buf.write(octal(size, 12), 124, 12, "ascii");
  buf.write(octal(Math.floor(mtime), 12), 136, 12, "ascii");
  buf.write("        ", 148, 8, "ascii");
  buf.write(type, 156, 1, "ascii");
  buf.write(linkname.slice(0, 100), 157, 100, "utf8");
  buf.write("ustar\0", 257, 6, "ascii");
  buf.write("00", 263, 2, "ascii");
  buf.write("root", 265, 32, "ascii");
  buf.write("root", 297, 32, "ascii");
  buf.write(octal(0, 8), 329, 8, "ascii");
  buf.write(octal(0, 8), 337, 8, "ascii");

  let sum = 0;
  for (const byte of buf) sum += byte;
  buf.write(sum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "ascii");
  return buf;
}

/** GNU long-name entry, used when a path does not fit in the 100-byte field. */
function longNameHeader(fullName, mtime) {
  const body = Buffer.from(fullName + "\0", "utf8");
  return [header("././@LongLink", { mode: 0o644, size: body.length, type: "L", mtime }), body, Buffer.alloc(padTo(body.length))];
}

function addEntry(fullName, { mode, size = 0, type = "0", body = null, mtime = 0 }) {
  const tooLong = Buffer.byteLength(fullName, "utf8") > 100;
  if (tooLong) {
    chunks.push(...longNameHeader(fullName, mtime));
  }
  chunks.push(header(tooLong ? path.basename(fullName) : fullName, { mode, size, type, linkname: "", mtime }));
  if (body) {
    chunks.push(body, Buffer.alloc(padTo(body.length)));
  }
}

const EXECUTABLES = new Set(["visual-studio-clone", "chrome-sandbox", "chrome_crashpad_handler"]);
const rootName = `VisualStudioClone-${pkg.version}-linux-x64`;

function walk(dir, virtual) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = `${virtual}/${entry.name}`;
    const st = statSync(full);
    if (entry.isDirectory()) {
      addEntry(rel + "/", { mode: 0o755, type: "5", mtime: st.mtimeMs / 1000 });
      walk(full, rel);
    } else if (entry.isFile()) {
      const mode = EXECUTABLES.has(entry.name) ? 0o755 : 0o644;
      addEntry(rel, { mode, size: st.size, type: "0", body: readFileSync(full), mtime: st.mtimeMs / 1000 });
    }
  }
}

console.log(`Packing ${root} …`);
addEntry(`${rootName}/`, { mode: 0o755, type: "5", mtime: Date.now() / 1000 });
walk(root, rootName);

const readme = Buffer.from(
  [
    "Visual Studio Clone — Linux (x64)",
    "",
    "Run:",
    "  ./visual-studio-clone",
    "",
    "If the sandbox is unavailable, run with:",
    "  ./visual-studio-clone --no-sandbox",
    "",
    "Requires a desktop session (X11/Wayland) and a modern glibc distribution.",
    "",
  ].join("\n"),
);
addEntry(`${rootName}/RUN.txt`, { mode: 0o644, size: readme.length, type: "0", body: readme, mtime: Date.now() / 1000 });

chunks.push(Buffer.alloc(BLOCK * 2));
const archive = Buffer.concat(chunks);
console.log(`Compressing ${(archive.length / 1048576).toFixed(1)} MB …`);
const gz = zlib.gzipSync(archive, { level: 6 });
writeFileSync(out, gz);
console.log(`✅ ${out} (${(gz.length / 1048576).toFixed(1)} MB)`);
