/**
 * Visual Studio Clone Installer
 * ------------------------------------------------------------------
 * A standalone setup experience modelled on the Visual Studio Installer:
 * workload / component selection, prerequisites, install location and a
 * progress page. It copies the packaged app out of `resources/payload/app`
 * to the chosen folder, writes workload configuration, creates shortcuts
 * and registers an uninstall entry.
 */
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const fsp = fs.promises;
const os = require("node:os");
const { execFile, spawn } = require("node:child_process");

const APP_NAME = "Visual Studio Clone";
const APP_VERSION = "1.0.0";
const PUBLISHER = "Visual Studio Clone";

let win = null;

const PAYLOAD_EXE_NAMES = [`${APP_NAME}.exe`, `${APP_NAME.toLowerCase().replace(/\s+/g, "-")}.exe`];

/**
 * Where the packaged IDE may live, in priority order.
 *
 * Packaged installer: <resources>/payload/app (extraResources).
 * Dev (`electron installer`): ./payload/app next to main.cjs. In dev,
 * process.resourcesPath points inside node_modules/electron, so that path is
 * only a last resort and never reported as the "real" payload location.
 */
const payloadCandidates = () => {
  const devPayload = path.join(__dirname, "payload", "app");
  const packagedPayload = path.join(process.resourcesPath, "payload", "app");
  if (app.isPackaged) return [packagedPayload];
  // Dev fallback: the electron-packager output, if it has been built already.
  const packagedBuild = path.join(__dirname, "..", "Release", "visual-studio-clone-win32-x64");
  return [devPayload, packagedPayload, packagedBuild];
};

const payloadDir = () => {
  const candidates = payloadCandidates();
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
};

/** Locate the IDE executable inside a payload directory (name varies by build). */
function findPayloadExe(dir) {
  for (const name of PAYLOAD_EXE_NAMES) {
    const candidate = path.join(dir, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  try {
    const entry = fs
      .readdirSync(dir, { withFileTypes: true })
      .find((item) => item.isFile() && /\.exe$/i.test(item.name));
    if (entry) return path.join(dir, entry.name);
  } catch {
    /* directory missing or unreadable */
  }
  return null;
}

/** Human-readable report of every place the payload was looked for. */
function describePayloadSearch() {
  return payloadCandidates()
    .map((dir) => `  - ${dir}${fs.existsSync(dir) ? " (present, but no application .exe found)" : " (missing)"}`)
    .join("\n");
}
const defaultInstallDir = () =>
  path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "Programs", APP_NAME);

function exec(cmd, args, timeout = 10000) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout, windowsHide: true }, (err, stdout) => {
      if (err) return resolve(null);
      resolve(String(stdout || "").trim().split(/\r?\n/)[0]);
    });
  });
}

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

async function dirSize(dir) {
  let total = 0;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = await fsp.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) {
        const st = await fsp.stat(full).catch(() => null);
        if (st) total += st.size;
      }
    }
  }
  return total;
}

async function collectFiles(dir) {
  const files = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = await fsp.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) {
        const st = await fsp.stat(full).catch(() => null);
        if (st) files.push({ full, rel: path.relative(dir, full), size: st.size });
      }
    }
  }
  return files;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1020,
    height: 690,
    minWidth: 940,
    minHeight: 620,
    frame: false,
    show: false,
    backgroundColor: "#1b1b1f",
    title: "Visual Studio Installer",
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  win.once("ready-to-show", () => win.show());
}

ipcMain.handle("sys:info", async () => {
  const [dotnet, git, node] = await Promise.all([
    exec("dotnet", ["--version"]),
    exec("git", ["--version"]),
    exec("node", ["--version"]),
  ]);
  const installDir = defaultInstallDir();
  const exePath = path.join(installDir, `${APP_NAME}.exe`);
  let payloadBytes = 0;
  try {
    payloadBytes = await dirSize(payloadDir());
  } catch {
    payloadBytes = 0;
  }
  return {
    appVersion: APP_VERSION,
    defaultDir: installDir,
    installed: fs.existsSync(exePath),
    installedVersion: fs.existsSync(path.join(installDir, "resources", "app", "package.json"))
      ? APP_VERSION
      : null,
    payloadBytes,
    payloadDir: payloadDir(),
    home: os.homedir(),
    platform: `${os.platform()} ${os.release()}`,
    prereqs: {
      dotnet: dotnet ? { found: true, version: dotnet } : { found: false, version: "" },
      git: git ? { found: true, version: git.replace(/^git version\s*/i, "") } : { found: false, version: "" },
      node: node ? { found: true, version: node } : { found: false, version: "" },
    },
  };
});

ipcMain.handle("dialog:pickDir", async () => {
  const result = await dialog.showOpenDialog(win, {
    title: "Select installation folder",
    properties: ["openDirectory", "createDirectory"],
    defaultPath: defaultInstallDir(),
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle("open:url", (_event, url) => {
  if (typeof url === "string" && /^https?:\/\//i.test(url)) shell.openExternal(url);
});

ipcMain.on("win:minimize", () => win?.minimize());
ipcMain.on("win:close", () => app.quit());

async function createShortcut(targetExe, workingDir, linkPath) {
  const script = [
    "$ws = New-Object -ComObject WScript.Shell",
    `$sc = $ws.CreateShortcut(${JSON.stringify(linkPath)})`,
    `$sc.TargetPath = ${JSON.stringify(targetExe)}`,
    `$sc.WorkingDirectory = ${JSON.stringify(workingDir)}`,
    `$sc.IconLocation = ${JSON.stringify(targetExe + ",0")}`,
    "$sc.Description = 'Visual Studio Clone'",
    "$sc.Save()",
  ].join("; ");
  await new Promise((resolve) => {
    execFile("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script], { windowsHide: true }, () => resolve());
  });
}

async function registerUninstall(installDir) {
  const exe = path.join(installDir, `${APP_NAME}.exe`);
  const uninstallCmd = path.join(installDir, "Uninstall.cmd");
  const script = [
    "@echo off",
    "cd /d \"%TEMP%\"",
    `taskkill /f /im "${APP_NAME}.exe" >nul 2>&1`,
    'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VisualStudioClone" /f >nul 2>&1',
    'del /q "%USERPROFILE%\\Desktop\\Visual Studio Clone.lnk" >nul 2>&1',
    'del /q "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Visual Studio Clone.lnk" >nul 2>&1',
    `start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 1; Remove-Item -LiteralPath '${installDir}' -Recurse -Force -ErrorAction SilentlyContinue"`,
    "",
  ].join("\r\n");
  await fsp.writeFile(uninstallCmd, script, "utf8");

  const args = [
    "add",
    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VisualStudioClone",
    "/v", "DisplayName", "/t", "REG_SZ", "/d", APP_NAME, "/f",
  ];
  await new Promise((resolve) => execFile("reg", args, { windowsHide: true }, () => resolve()));
  const add = (name, value) =>
    new Promise((resolve) =>
      execFile("reg", ["add", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VisualStudioClone", "/v", name, "/t", "REG_SZ", "/d", value, "/f"], { windowsHide: true }, () => resolve()),
    );
  await add("DisplayVersion", APP_VERSION);
  await add("Publisher", PUBLISHER);
  await add("InstallLocation", installDir);
  await add("DisplayIcon", exe);
  await add("UninstallString", `"${uninstallCmd}"`);
  await add("NoModify", "1");
  await add("NoRepair", "1");
}

ipcMain.handle("install:start", async (_event, options) => {
  const installDir = path.resolve(String(options.installDir || defaultInstallDir()));
  const workloads = Array.isArray(options.workloads) ? options.workloads : [];
  const components = Array.isArray(options.components) ? options.components : [];
  const source = payloadDir();

  try {
    const appExe = findPayloadExe(source);
    if (!appExe) {
      throw new Error(
        `Installer payload not found.\nSearched for ${PAYLOAD_EXE_NAMES[0]} in:\n${describePayloadSearch()}\n` +
          'Rebuild the setup with "npm run build:installer" so the packaged IDE is copied into installer/payload/app.',
      );
    }

    send("install:progress", { step: "Preparing installation", detail: installDir, percent: 2 });
    // Close a running copy so files can be replaced (upgrade path).
    await new Promise((resolve) => execFile("taskkill", ["/f", "/im", `${APP_NAME}.exe`], { windowsHide: true }, () => resolve()));
    await fsp.mkdir(installDir, { recursive: true });

    send("install:progress", { step: "Scanning package", detail: "Reading file list", percent: 5 });
    const files = await collectFiles(source);
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0) || 1;
    let copied = 0;
    let lastPercent = 5;

    for (const file of files) {
      const target = path.join(installDir, file.rel);
      await fsp.mkdir(path.dirname(target), { recursive: true });
      await fsp.copyFile(file.full, target);
      copied += file.size;
      const percent = 5 + Math.floor((copied / totalBytes) * 80);
      if (percent !== lastPercent) {
        lastPercent = percent;
        send("install:progress", {
          step: "Copying Visual Studio Clone files",
          detail: `${Math.round(copied / 1048576)} MB of ${Math.round(totalBytes / 1048576)} MB`,
          percent,
        });
      }
    }

    send("install:progress", { step: "Writing workload configuration", detail: "install.json", percent: 88 });
    const configDir = path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "VisualStudioClone");
    await fsp.mkdir(configDir, { recursive: true });
    const config = {
      product: APP_NAME,
      version: APP_VERSION,
      installedAt: new Date().toISOString(),
      installDir,
      workloads,
      components,
    };
    await fsp.writeFile(path.join(configDir, "install.json"), JSON.stringify(config, null, 2), "utf8");
    await fsp.writeFile(path.join(installDir, "install.json"), JSON.stringify(config, null, 2), "utf8");

    // Normalise the executable name so shortcuts, the uninstaller and launches
    // all point at "<Product>.exe" regardless of how the payload was packaged.
    const exe = path.join(installDir, `${APP_NAME}.exe`);
    if (path.basename(appExe) !== path.basename(exe)) {
      const copiedAppExe = path.join(installDir, path.relative(source, appExe));
      if (fs.existsSync(copiedAppExe)) {
        await fsp.rm(exe, { force: true }).catch(() => undefined);
        await fsp.rename(copiedAppExe, exe).catch(() => undefined);
      }
    }

    send("install:progress", { step: "Creating shortcuts", detail: "Desktop and Start menu", percent: 92 });
    if (options.desktopShortcut !== false) {
      const desktop = path.join(os.homedir(), "Desktop", `${APP_NAME}.lnk`);
      await createShortcut(exe, installDir, desktop);
    }
    if (options.startMenuShortcut !== false) {
      const programs = path.join(process.env.APPDATA || "", "Microsoft", "Windows", "Start Menu", "Programs");
      await fsp.mkdir(programs, { recursive: true }).catch(() => undefined);
      await createShortcut(exe, installDir, path.join(programs, `${APP_NAME}.lnk`));
    }

    send("install:progress", { step: "Registering uninstaller", detail: "Add or Remove Programs", percent: 96 });
    await registerUninstall(installDir);

    send("install:progress", { step: "Finishing up", detail: "Installation complete", percent: 100 });
    return { ok: true, installDir, exe };
  } catch (error) {
    return { ok: false, error: String(error && error.message ? error.message : error) };
  }
});

ipcMain.handle("install:launch", async (_event, installDir) => {
  const exe = path.join(installDir, `${APP_NAME}.exe`);
  if (!fs.existsSync(exe)) return { ok: false, error: "Installed executable was not found." };
  const child = spawn(exe, [], {
    cwd: installDir,
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  child.unref();
  return { ok: true };
});

ipcMain.handle("install:uninstall", async (_event, installDir) => {
  const dir = path.resolve(String(installDir || defaultInstallDir()));
  await new Promise((resolve) => execFile("taskkill", ["/f", "/im", `${APP_NAME}.exe`], { windowsHide: true }, () => resolve()));
  await new Promise((resolve) => execFile("reg", ["delete", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VisualStudioClone", "/f"], { windowsHide: true }, () => resolve()));
  try {
    await fsp.rm(path.join(os.homedir(), "Desktop", `${APP_NAME}.lnk`), { force: true });
    await fsp.rm(path.join(process.env.APPDATA || "", "Microsoft", "Windows", "Start Menu", "Programs", `${APP_NAME}.lnk`), { force: true });
  } catch {
    /* ignore */
  }
  try {
    await fsp.rm(dir, { recursive: true, force: true });
  } catch (error) {
    return { ok: false, error: String(error.message || error) };
  }
  return { ok: true };
});

app.whenReady().then(async () => {
  createWindow();
});

app.on("window-all-closed", () => app.quit());
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
