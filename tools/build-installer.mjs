/**
 * Builds the Visual Studio Installer style setup executable.
 *
 *  1. packages the IDE (electron-packager) into Release/visual-studio-clone-win32-x64
 *  2. copies that build into installer/payload/app
 *  3. packages installer/ as a single portable .exe with electron-builder
 *
 * Output: Release/installer-ui/VisualStudioClone-Installer-1.0.0.exe
 */
import { execFileSync } from "node:child_process";
import { cpSync, copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const payloadRoot = path.join(root, "installer", "payload");
const payloadApp = path.join(payloadRoot, "app");
const packaged = path.join(root, "Release", "visual-studio-clone-win32-x64");

function run(command, args, cwd = root) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  execFileSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
}

if (!existsSync(path.join(packaged, "visual-studio-clone.exe"))) {
  console.log("Packaging the IDE first…");
  run("npm", ["run", "package"]);
}

console.log("Copying IDE into installer payload…");
rmSync(payloadRoot, { recursive: true, force: true });
mkdirSync(payloadRoot, { recursive: true });
cpSync(packaged, payloadApp, { recursive: true });

// The installer expects the executable to be named after the product.
const srcExe = path.join(payloadApp, "visual-studio-clone.exe");
const dstExe = path.join(payloadApp, "Visual Studio Clone.exe");
if (existsSync(srcExe) && !existsSync(dstExe)) {
  renameSync(srcExe, dstExe);
}

const payloadExes = readdirSync(payloadApp).filter((name) => name.toLowerCase().endsWith(".exe"));
if (payloadExes.length === 0) {
  console.error(`\n❌ The packaged IDE at ${packaged} has no .exe, so the installer payload is empty.`);
  console.error('Run "npm run package" and then "npm run build:installer" again.');
  process.exit(1);
}
console.log(`Payload executable: ${payloadExes.join(", ")}`);

copyFileSync(path.join(root, "public", "vs-icon.ico"), path.join(root, "installer", "icon.ico"));

const bytes = (() => {
  let total = 0;
  const stack = [payloadApp];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else total += statSync(full).size;
    }
  }
  return total;
})();
console.log(`Payload size: ${(bytes / 1048576).toFixed(1)} MB`);

console.log("Building the installer executable…");
run("npx", ["electron-builder", "--projectDir", "installer", "--win", "portable", "--x64"]);

const output = path.join(root, "Release", "installer-ui", "VisualStudioClone-Installer-1.0.0.exe");
if (existsSync(output)) {
  const mb = (statSync(output).size / 1048576).toFixed(1);
  console.log(`\n✅ Installer: ${output} (${mb} MB)`);
} else {
  console.error("\n⚠ Installer executable was not produced.");
  process.exitCode = 1;
}
