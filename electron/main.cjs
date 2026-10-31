/**
 * Visual Studio Clone — Electron shell.
 *
 * Boots the Express backend (server/index.mjs) as a child process and loads the
 * UI from the local API. In production that API also serves dist/, so run
 * `npm run build` before launching via Electron.
 */
const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const { existsSync } = require("node:fs");

const API_PORT = 5179;
const API_URL = `http://127.0.0.1:${API_PORT}/`;

let serverProc = null;
let windowRef = null;

function waitForServer(timeoutMs = 30000) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const timer = setInterval(async () => {
      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(timer);
        resolve(false);
        return;
      }
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2000);
        const r = await fetch(`${API_URL}api/info`, { signal: ctrl.signal });
        clearTimeout(t);
        if (r.ok) {
          clearInterval(timer);
          resolve(true);
        }
      } catch {
        /* not up yet */
      }
    }, 250);
  });
}

function getServerEntry() {
  const candidates = [
    // Production (electron-packager layout): <pkg>\resources\app\server\index.mjs
    path.join(process.resourcesPath, "app", "server", "index.mjs"),
    // Development: <project root>\server\index.mjs
    path.join(app.getAppPath(), "server", "index.mjs"),
  ];
  return candidates.find((p) => existsSync(p)) ?? candidates[0];
}

/**
 * Write to a console stream without ever throwing. When the app is launched
 * from Explorer there is no attached console, so stdout/stderr can be a broken
 * pipe and `write()` throws EPIPE — which previously surfaced as an "A
 * JavaScript error occurred in the main process" dialog on startup.
 */
function safeWrite(stream, chunk) {
  try {
    if (!stream || stream.destroyed || stream.writableEnded) return;
    stream.write(chunk);
  } catch (err) {
    if (err && err.code !== "EPIPE") return;
  }
}

function startServer() {
  const entry = getServerEntry();
  const appRoot = path.dirname(path.dirname(entry));
  serverProc = spawn(process.execPath, [entry], {
    cwd: appRoot,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  serverProc.stdout?.on("data", (d) => safeWrite(process.stdout, d));
  serverProc.stderr?.on("data", (d) => safeWrite(process.stderr, d));
  serverProc.stdout?.on("error", () => undefined);
  serverProc.stderr?.on("error", () => undefined);
  serverProc.on("error", () => undefined);
  serverProc.on("exit", (code) => {
    serverProc = null;
    if (code === 0) app.quit();
  });
}

// A closed stdout/stderr must never take the whole app down.
process.stdout?.on("error", () => undefined);
process.stderr?.on("error", () => undefined);
process.on("uncaughtException", (err) => {
  if (err && err.code === "EPIPE") return;
  // Keep the default Electron behaviour for everything else.
  throw err;
});

function createWindow() {
  const win = new BrowserWindow({
    title: "Visual Studio 2026 (Clone)",
    width: 1600,
    height: 1000,
    minWidth: 1024,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: "#1f1f1f",
    webPreferences: {},
  });
  win.loadURL(API_URL);
  windowRef = win;
  win.on("closed", () => {
    if (windowRef === win) windowRef = null;
  });
}

function quit() {
  try {
    serverProc?.kill();
  } catch {
    /* noop */
  }
  app.quit();
}

app.whenReady().then(async () => {
  startServer();
  const up = await waitForServer();
  if (!up) {
    const { dialog } = require("electron");
    dialog.showErrorBox(
      "Visual Studio Clone",
      "The local backend did not start in time. Make sure the API server can run (node server/index.mjs) and that port 5179 is free.",
    );
    app.quit();
    return;
  }
  createWindow();
});

app.on("will-quit", quit);
app.on("window-all-closed", () => {
  // Keep running until the user quits the app explicitly (like VS does).
  if (process.platform === "darwin") return;
  quit();
});

app.on("activate", () => {
  if (windowRef === null || !app.isReady()) return;
  createWindow();
});

app.commandLine.appendSwitch("no-sandbox");
