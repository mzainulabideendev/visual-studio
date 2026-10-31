// Starts the API server and the Vite dev server, then opens the browser.
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const isWindows = process.platform === "win32";
const npm = isWindows ? "npm.cmd" : "npm";

const api = spawn(process.execPath, ["server/index.mjs"], { stdio: "inherit" });
const vite = spawn(npm, ["exec", "vite"], { stdio: "inherit", shell: isWindows });

async function open() {
  await sleep(1800);
  const url = "http://127.0.0.1:5180";
  const cmd = isWindows ? "cmd" : process.platform === "darwin" ? "open" : "xdg-open";
  const args = isWindows ? ["/c", "start", "", url] : [url];
  spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
}
void open();

function shutdown() {
  api.kill();
  vite.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
api.on("exit", (code) => {
  if (code) {
    console.error(`API server exited with code ${code}`);
    shutdown();
  }
});
vite.on("exit", shutdown);
