/**
 * Builds a runnable Linux (x64) release from any host OS.
 *
 *  1. builds the Vite frontend
 *  2. packs the Electron app for Linux (`electron-builder --linux dir`)
 *  3. writes a .tar.gz with correct Unix permission bits
 *
 * AppImage / .deb installers are built by `npm run dist:linux` on a Linux host
 * (or by the GitHub Actions workflow in .github/workflows/linux.yml).
 *
 * Output: Release/VisualStudioClone-<version>-linux-x64.tar.gz
 */
import { execFileSync } from "node:child_process";

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  execFileSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
}

run("npm", ["run", "build"]);
run("npx", [
  "electron-builder",
  "--linux",
  "dir",
  "--x64",
  "--config.directories.output=Release/linux",
]);
run("node", ["tools/pack-linux-tar.mjs"]);
