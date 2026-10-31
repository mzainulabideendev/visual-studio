/**
 * Local backend for the Visual Studio clone.
 *
 * It exposes just enough of the IDE's plumbing to make the shell usable against a real
 * folder on disk: directory listing, file read/write, workspace search, an MSBuild-aware
 * build command, `git status`, and a PowerShell command runner for the terminal pane.
 */
import express from "express";
import { promises as fs, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 5179);
const SKIP_DIRS = new Set([
  "node_modules", ".git", ".vs", "bin", "obj", "dist", ".next", "packages",
  ".gradle", ".idea", "target", "__pycache__", ".venv",
]);
const MAX_READ = 4 * 1024 * 1024;

const app = express();
app.use(express.json({ limit: "8mb" }));

function assertAbsolute(p) {
  if (typeof p !== "string" || !p || !path.isAbsolute(p)) {
    throw new Error(`An absolute path is required (received: ${String(p)})`);
  }
  return path.normalize(p);
}

function isBinary(buf) {
  const n = Math.min(buf.length, 8192);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

app.get("/api/info", async (_req, res) => {
  const drives = [];
  if (process.platform === "win32") {
    for (const letter of "CDEFGHIJKLMNOPQRSTUVWXYZ") {
      if (existsSync(`${letter}:\\`)) drives.push(`${letter}:\\`);
    }
  } else {
    drives.push("/");
  }
  let version = "18.10";
  try {
    version = readFileSync(path.join(__dirname, "..", "package.json"), "utf8")
      .match(/"version":\s*"([^"]+)"/)?.[1] ?? version;
  } catch {}
  res.json({
    version,
    platform: `${process.platform}-${process.arch}`,
    home: os.homedir(),
    drives,
  });
});

app.get("/api/list", async (req, res) => {
  try {
    const dir = assertAbsolute(String(req.query.dir ?? ""));
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const entries = [];
    for (const d of dirents) {
      if (d.isDirectory() && SKIP_DIRS.has(d.name)) continue;
      const full = path.join(dir, d.name);
      let size = 0;
      let mtime = 0;
      try {
        const st = await fs.stat(full);
        size = st.size;
        mtime = st.mtimeMs;
      } catch {}
      entries.push({ name: d.name, path: full, dir: d.isDirectory(), size, mtime });
    }
    entries.sort((a, b) =>
      a.dir === b.dir ? a.name.localeCompare(b.name, undefined, { numeric: true }) : a.dir ? -1 : 1,
    );
    res.json({ entries });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/read", async (req, res) => {
  try {
    const file = assertAbsolute(String(req.query.path ?? ""));
    const st = await fs.stat(file);
    if (st.size > MAX_READ) throw new Error(`File is larger than ${MAX_READ / 1024 / 1024} MB`);
    const buf = await fs.readFile(file);
    if (isBinary(buf)) {
      res.json({ content: `// ${path.basename(file)} appears to be a binary file (${buf.length} bytes) and cannot be shown in the text editor.`, size: st.size });
      return;
    }
    res.json({ content: buf.toString("utf8"), size: st.size });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/write", async (req, res) => {
  try {
    const file = assertAbsolute(req.body.path);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, String(req.body.content ?? ""), "utf8");
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/create", async (req, res) => {
  try {
    const target = assertAbsolute(req.body.path);
    if (req.body.dir) await fs.mkdir(target, { recursive: true });
    else {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, "", { flag: "wx" });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/remove", async (req, res) => {
  try {
    await fs.rm(assertAbsolute(req.body.path), { recursive: true, force: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/rename", async (req, res) => {
  try {
    await fs.rename(assertAbsolute(req.body.from), assertAbsolute(req.body.to));
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/search", async (req, res) => {
  try {
    const root = assertAbsolute(req.body.root);
    const query = String(req.body.query ?? "");
    if (query.length < 2) return res.json({ hits: [], truncated: false });
    const needle = query.toLowerCase();
    const hits = [];
    let scanned = 0;
    let truncated = false;

    async function walk(dir, depth) {
      if (truncated || hits.length >= 500 || depth > 12) return;
      let dirents;
      try {
        dirents = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const d of dirents) {
        if (truncated) return;
        const full = path.join(dir, d.name);
        if (d.isDirectory()) {
          if (SKIP_DIRS.has(d.name)) continue;
          await walk(full, depth + 1);
          continue;
        }
        if (d.name.endsWith(".min.js") || d.name.endsWith(".map")) continue;
        let buf;
        try {
          const st = await fs.stat(full);
          if (st.size > 1_500_000) continue;
          buf = await fs.readFile(full);
        } catch {
          continue;
        }
        if (isBinary(buf)) continue;
        scanned++;
        const lines = buf.toString("utf8").split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(needle)) {
            hits.push({ path: full, line: i + 1, text: lines[i].slice(0, 240) });
            if (hits.length >= 500) {
              truncated = true;
              break;
            }
          }
        }
        if (scanned > 20000) {
          truncated = true;
          return;
        }
      }
    }

    await walk(root, 0);
    res.json({ hits, truncated });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

function run(cmd, args, cwd, timeoutMs = 180_000) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      windowsHide: true,
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      stderr += `\n[timed out after ${timeoutMs / 1000}s]`;
    }, timeoutMs);
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (e) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: stderr + String(e.message), code: -1 });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code: code ?? 0 });
    });
  });
}

app.post("/api/exec", async (req, res) => {
  try {
    const cwd = assertAbsolute(req.body.cwd || os.homedir());
    const command = String(req.body.command ?? "");
    if (!command.trim()) return res.json({ stdout: "", stderr: "", code: 0, cwd });

    if (process.platform === "win32") {
      const script =
        "[Console]::OutputEncoding=[Text.Encoding]::UTF8; " +
        command +
        '\n; Write-Output ("__REA_CWD__" + (Get-Location).Path)';
      const r = await run("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script], cwd);
      const lines = r.stdout.split(/\r?\n/);
      let nextCwd = cwd;
      const out = [];
      for (const l of lines) {
        if (l.startsWith("__REA_CWD__")) nextCwd = l.slice("__REA_CWD__".length).trim();
        else out.push(l);
      }
      res.json({ stdout: out.join("\n").trimEnd(), stderr: r.stderr.trim(), code: r.code, cwd: nextCwd });
    } else {
      const shell = process.env.SHELL || "/bin/sh";
      const script = `${command}\nprintf '\\n__REA_CWD__%s\\n' "$PWD"`;
      const r = await run(shell, ["-c", script], cwd);
      const lines = r.stdout.split(/\r?\n/);
      let nextCwd = cwd;
      const out = [];
      for (const l of lines) {
        const marker = "__REA_CWD__";
        if (l.startsWith(marker)) nextCwd = l.slice(marker.length).trim() || cwd;
        else out.push(l);
      }
      res.json({ stdout: out.join("\n").trimEnd(), stderr: r.stderr.trim(), code: r.code, cwd: nextCwd });
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

async function findProject(root, depth = 0) {
  const read = (d) => fs.readdir(d, { withFileTypes: true }).catch(() => []);
  const entries = await read(root);
  const direct = entries.find((d) => d.isFile() && /\.(cs|fs|vb)proj$/i.test(d.name));
  if (direct) return path.join(root, direct.name);
  if (depth > 1) return null;
  const skip = new Set(["bin", "obj", "node_modules", ".git", ".vs", "dist"]);
  for (const d of entries) {
    if (!d.isDirectory() || skip.has(d.name.toLowerCase())) continue;
    const found = await findProject(path.join(root, d.name), depth + 1);
    if (found) return found;
  }
  return null;
}

async function detectBuild(root, rebuild = false) {
  const read = (d) => fs.readdir(d, { withFileTypes: true }).catch(() => []);
  const top = await read(root);
  const files = top.filter((d) => d.isFile()).map((d) => d.name);

  // Rebuild maps to MSBuild's Rebuild target; npm has no equivalent, so it falls
  // back to a clean-ish plain build.
  const withTarget = (args) => (rebuild ? [...args, "-t:Rebuild"] : args);

  const sln = files.find((f) => /\.slnx?$/i.test(f));
  if (sln) return { cmd: "dotnet", args: withTarget(["build", path.join(root, sln), "-nologo", "-v:m"]), kind: "dotnet" };

  const proj = files.find((f) => /\.(cs|fs|vb)proj$/i.test(f));
  if (proj) return { cmd: "dotnet", args: withTarget(["build", path.join(root, proj), "-nologo", "-v:m"]), kind: "dotnet" };

  if (files.includes("package.json")) {
    try {
      const pkg = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
      if (pkg.scripts?.build) return { cmd: "npm", args: ["run", "build"], kind: "npm" };
    } catch {}
  }

  for (const d of top) {
    if (!d.isDirectory()) continue;
    const sub = await read(path.join(root, d.name));
    const subSln = sub.find((s) => s.isFile() && /\.slnx?$/i.test(s.name));
    if (subSln) {
      const p = path.join(root, d.name, subSln.name);
      return { cmd: "dotnet", args: withTarget(["build", p, "-nologo", "-v:m"]), kind: "dotnet" };
    }
  }
  return null;
}

const DIAG = /^(.*?\.[A-Za-z0-9]+)\((\d+),(\d+)\):\s+(error|warning)\s+([A-Za-z]+[0-9]+)?\s*:?\s*(.*?)(?:\s+\[[^\]]+\])?$/;

function parseDiagnostics(output, root) {
  const out = [];
  const seen = new Set();
  for (const raw of output.split(/\r?\n/)) {
    const line = raw.trim();
    const m = line.match(DIAG);
    if (!m) continue;
    const [, file, ln, col, sev, code, message] = m;
    const entry = {
      severity: sev === "error" ? "error" : "warning",
      file: path.isAbsolute(file) ? file : path.resolve(root, file),
      line: Number(ln),
      column: Number(col),
      code: code ?? "",
      message: message.replace(/\s+\[[^\]]+\]$/, ""),
    };
    // MSBuild repeats each diagnostic in its end-of-build summary; Visual Studio
    // lists it once, so collapse identical records.
    const key = `${entry.severity}|${entry.file}|${entry.line}|${entry.column}|${entry.code}|${entry.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
    if (out.length >= 400) break;
  }
  return out;
}

app.post("/api/build", async (req, res) => {
  try {
    const root = assertAbsolute(req.body.root);
    const rebuild = req.body.rebuild === true;
    const plan = await detectBuild(root, rebuild);
    if (!plan) {
      return res.json({
        command: "(none)",
        stdout: "",
        stderr:
          "No buildable project was found in this folder.\n" +
          "Looked for: *.sln, *.csproj, *.fsproj, *.vbproj, package.json with a build script.\n",
        code: 1,
        errors: [],
        durationMs: 0,
      });
    }
    const started = Date.now();
    const r = await run(plan.cmd, plan.args, root);
    const combined = r.stdout + "\n" + r.stderr;
    res.json({
      command: [plan.cmd, ...plan.args].join(" "),
      stdout: r.stdout,
      stderr: r.stderr,
      code: r.code,
      errors: parseDiagnostics(combined, root),
      durationMs: Date.now() - started,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/git", async (req, res) => {
  try {
    const root = assertAbsolute(String(req.query.root ?? ""));
    const r = await run("git", ["status", "--porcelain=v1", "-b"], root, 20_000);
    if (r.code !== 0) return res.json({ branch: "", files: [], isRepo: false });
    const lines = r.stdout.split(/\r?\n/).filter(Boolean);
    const branchLine = lines.shift() ?? "";
    const branch = branchLine.replace(/^##\s*/, "").split("...")[0].trim();
    const files = lines.map((l) => ({
      status: l.slice(0, 2),
      staged: l[0] !== " " && l[0] !== "?",
      path: l.slice(3).trim(),
    }));
    res.json({ branch, files, isRepo: true });
  } catch {
    res.json({ branch: "", files: [], isRepo: false });
  }
});

// ------------------------------------------------------------------ new project

app.post("/api/new-project", async (req, res) => {
  try {
    const root = assertAbsolute(String(req.body.root ?? ""));
    const name = String(req.body.name ?? "").trim().replace(/[\\/]+$/, "");
    if (!name) return res.status(400).json({ error: "Project name is required." });
    if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(name)) {
      return res.status(400).json({
        error: "Project name must start with a letter or underscore and contain only letters, digits, '_', '.' or '-'.",
      });
    }

    const template = String(req.body.template ?? "console").trim() || "console";
    const framework = String(req.body.framework ?? "net10.0").trim() || "net10.0";
    const createSolution = req.body.createSolution !== false;
    const sameDirectory = req.body.sameDirectory === true;
    const solutionNameRaw = String(req.body.solutionName ?? "").trim() || name;
    const solutionName = solutionNameRaw.replace(/[^A-Za-z0-9_.-]/g, "_");

    const solutionDir = createSolution ? path.resolve(root, solutionName) : path.resolve(root, name);
    const projectDir = createSolution && !sameDirectory ? path.join(solutionDir, name) : solutionDir;
    for (const dir of [solutionDir, projectDir]) {
      if (dir !== root && !dir.startsWith(root + path.sep)) {
        return res.status(400).json({ error: `Project must live inside ${root}.` });
      }
    }
    if (existsSync(projectDir)) {
      return res.status(400).json({ error: `"${path.basename(projectDir)}" already exists in ${path.dirname(projectDir)}.` });
    }

    await fs.mkdir(projectDir, { recursive: true });

    // `dotnet new` gives us the exact same project content as Visual Studio's
    // templates, including the framework-specific target.
    const newArgs = ["new", template, "-n", name, "-o", projectDir];
    if (framework) newArgs.push("-f", framework);
    const created = await run("dotnet", newArgs, projectDir, 300_000);
    if (created.code !== 0) {
      await fs.rm(projectDir, { recursive: true, force: true }).catch(() => undefined);
      return res.status(400).json({
        error: `dotnet new ${template} failed.\n${(created.stderr || created.stdout || "").trim()}`,
      });
    }

    const projName = name.replace(/\.[^.]*$/, "") || name;
    const csproj = path.join(projectDir, `${projName}.csproj`);

    // Console apps get a friendlier entry point than the stock "Hello, World!".
    if (template === "console") {
      const source = path.join(projectDir, "Program.cs");
      const programBody = [
        "// " + projName + " — created by Visual Studio Clone",
        `Console.WriteLine("Hello from ${projName}");`,
        "",
      ].join("\r\n");
      await fs.writeFile(source, programBody, "utf8");
    }

    let solutionFile = "";
    if (createSolution) {
      await fs.mkdir(solutionDir, { recursive: true });
      const sln = await run(
        "dotnet",
        ["new", "sln", "-n", solutionName, "-o", solutionDir, "--format", "sln"],
        solutionDir,
        120_000,
      );
      if (sln.code !== 0) {
        return res.status(400).json({ error: `Could not create the solution.\n${(sln.stderr || sln.stdout || "").trim()}` });
      }
      solutionFile = path.join(solutionDir, `${solutionName}.sln`);
      if (existsSync(csproj) && existsSync(solutionFile)) {
        await run("dotnet", ["sln", solutionFile, "add", csproj], solutionDir, 120_000);
      }
    }

    res.json({
      ok: true,
      path: createSolution ? solutionDir : projectDir,
      projectPath: projectDir,
      solutionFile,
      template,
      framework,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/nuget", async (req, res) => {
  try {
    const project = String(req.body.project ?? "");
    const packageId = String(req.body.packageId ?? "").trim();
    if (!project || !packageId) {
      return res.status(400).json({ error: "A project path and a package ID are required." });
    }
    const version = String(req.body.version ?? "").trim();
    const args = version
      ? ["add", project, "package", packageId, "--version", version]
      : ["add", project, "package", packageId];
    const r = await run("dotnet", args, path.dirname(project));
    res.json({ ok: r.code === 0, command: ["dotnet", ...args].join(" "), stdout: r.stdout, stderr: r.stderr, code: r.code });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/nuget/list", async (req, res) => {
  try {
    const project = String(req.body.project ?? "");
    if (!project) return res.status(400).json({ error: "A project path is required." });
    const r = await run("dotnet", ["list", project, "package"], path.dirname(project));
    const packages = [];
    for (const raw of (r.stdout + r.stderr).split(/\r?\n/)) {
      const line = raw.replace(/\s+$/, "");
      const m = line.match(/^ {3}(?:> )?(\S+)\s+(\S+)\s+(\S+)\s*$/);
      if (m) packages.push({ id: m[1], version: m[3] });
    }
    res.json({ ok: r.code === 0, packages, stdout: r.stdout, stderr: r.stderr, code: r.code });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/nuget/remove", async (req, res) => {
  try {
    const project = String(req.body.project ?? "");
    const packageId = String(req.body.packageId ?? "").trim();
    if (!project || !packageId) {
      return res.status(400).json({ error: "A project path and a package ID are required." });
    }
    const version = String(req.body.version ?? "").trim();
    const args = version
      ? ["remove", project, "--version", version, "package", packageId]
      : ["remove", project, "package", packageId];
    const r = await run("dotnet", args, path.dirname(project));
    res.json({ ok: r.code === 0, command: ["dotnet", ...args].join(" "), stdout: r.stdout, stderr: r.stderr, code: r.code });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ------------------------------------------------------------------ run

app.post("/api/run", async (req, res) => {
  try {
    const root = assertAbsolute(req.body.root);
    const project = await findProject(root);
    if (!project) return res.status(400).json({ error: "No .NET project was found to run in this folder." });
    const started = Date.now();
    const r = await run("dotnet", ["run", "--project", project], root, 120_000);
    res.json({
      command: `dotnet run --project ${project}`,
      stdout: r.stdout,
      stderr: r.stderr,
      code: r.code,
      durationMs: Date.now() - started,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ------------------------------------------------------------------ nuget search

app.post("/api/nuget/search", async (req, res) => {
  try {
    const q = String(req.body.query ?? "").trim();
    if (!q) return res.json({ ok: true, results: [] });
    const r = await fetch(
      `https://azuresearch-usnc.nuget.org/query?q=${encodeURIComponent(q)}&take=20&prerelease=false`,
      { headers: { "user-agent": "visual-studio-clone" } },
    );
    if (!r.ok) return res.status(400).json({ error: `nuget.org returned ${r.status}` });
    const j = await r.json();
    res.json({
      ok: true,
      results: (j.data ?? []).map((p) => ({
        id: p.id,
        version: p.version,
        description: p.description ?? "",
        authors: Array.isArray(p.authors) ? p.authors.join(", ") : String(p.authors ?? ""),
        downloads: p.totalDownloads ?? 0,
      })),
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ------------------------------------------------------------------ project references

app.post("/api/refs/list", async (req, res) => {
  try {
    const project = String(req.body.project ?? "");
    if (!project) return res.status(400).json({ error: "A project path is required." });
    const r = await run("dotnet", ["list", project, "reference"], path.dirname(project), 60_000);
    const refs = [];
    for (const raw of (r.stdout + r.stderr).split(/\r?\n/)) {
      const line = raw.trim();
      if (line.toLowerCase().endsWith(".csproj")) refs.push(line);
    }
    res.json({ ok: r.code === 0, refs, stdout: r.stdout, stderr: r.stderr, code: r.code });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/refs/add", async (req, res) => {
  try {
    const project = String(req.body.project ?? "");
    const reference = String(req.body.reference ?? "");
    if (!project || !reference) {
      return res.status(400).json({ error: "A project path and a reference project are required." });
    }
    const r = await run("dotnet", ["add", project, "reference", reference], path.dirname(project), 120_000);
    res.json({
      ok: r.code === 0,
      command: `dotnet add ${project} reference ${reference}`,
      stdout: r.stdout,
      stderr: r.stderr,
      code: r.code,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ------------------------------------------------------------------ git actions

app.post("/api/git/init", async (req, res) => {
  try {
    const root = assertAbsolute(req.body.root);
    const r = await run("git", ["init", "-b", "main"], root, 30_000);
    res.json({ ok: r.code === 0, stdout: r.stdout, stderr: r.stderr, code: r.code });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/git/commit", async (req, res) => {
  try {
    const root = assertAbsolute(req.body.root);
    const message = String(req.body.message ?? "").trim() || "Update from Visual Studio Clone";
    const add = await run("git", ["add", "-A"], root, 30_000);
    const r = await run(
      "git",
      ["-c", "user.name=VS Clone", "-c", "user.email=vsclone@localhost", "commit", "-m", message],
      root,
      60_000,
    );
    res.json({ ok: r.code === 0, stdout: add.stdout + r.stdout, stderr: add.stderr + r.stderr, code: r.code });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/git/push", async (req, res) => {
  try {
    const root = assertAbsolute(req.body.root);
    const r = await run("git", ["push"], root, 120_000);
    res.json({ ok: r.code === 0, stdout: r.stdout, stderr: r.stderr, code: r.code });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ------------------------------------------------------------------ github sign-in

app.post("/api/auth/github", async (req, res) => {
  try {
    const token = String(req.body.token ?? "").trim();
    if (!token) return res.status(400).json({ error: "A GitHub token is required." });
    const r = await fetch("https://api.github.com/user", {
      headers: {
        authorization: `Bearer ${token}`,
        "user-agent": "visual-studio-clone",
        accept: "application/vnd.github+json",
      },
    });
    if (!r.ok) return res.status(401).json({ error: `GitHub rejected the token (HTTP ${r.status}).` });
    const u = await r.json();
    res.json({ ok: true, login: u.login, name: u.name ?? u.login, avatar: u.avatar_url ?? "" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ------------------------------------------------------------------ copilot proxy

app.post("/api/copilot", async (req, res) => {
  try {
    const key = process.env.COPILOT_API_KEY || process.env.OPENAI_API_KEY;
    if (!key) {
      return res.status(501).json({
        error:
          "Copilot backend is not configured. Set COPILOT_API_KEY (and optionally COPILOT_BASE_URL / COPILOT_MODEL) before launching the app.",
      });
    }
    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
    const model = String(req.body.model ?? process.env.COPILOT_MODEL ?? "gpt-4o-mini");
    const base = String(process.env.COPILOT_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(400).json({ error: j?.error?.message ?? `AI endpoint returned ${r.status}` });
    res.json({ ok: true, content: j?.choices?.[0]?.message?.content ?? "" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ------------------------------------------------------------------ git clone

app.post("/api/git/clone", async (req, res) => {
  try {
    const url = String(req.body.url ?? "").trim();
    const dir = assertAbsolute(req.body.dir);
    if (!url) return res.status(400).json({ error: "A repository URL is required." });
    await fs.mkdir(path.dirname(dir), { recursive: true });
    if (existsSync(dir) && (await fs.readdir(dir).catch(() => [])).length > 0) {
      return res.status(400).json({ error: `The target folder is not empty: ${dir}` });
    }
    const r = await run("git", ["clone", url, dir], path.dirname(dir), 600_000);
    res.json({ ok: r.code === 0, path: dir, stdout: r.stdout, stderr: r.stderr, code: r.code });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ------------------------------------------------------------------ clean

app.post("/api/clean", async (req, res) => {
  try {
    const root = assertAbsolute(req.body.root);
    const plan = await detectBuild(root);
    if (!plan || plan.kind !== "dotnet") {
      return res.status(400).json({ error: "No .NET solution or project found in this folder." });
    }
    const target = plan.args[1];
    const args = ["clean", target, "-nologo", "-v:m"];
    const r = await run("dotnet", args, root, 300_000);
    res.json({ command: `dotnet ${args.join(" ")}`, stdout: r.stdout, stderr: r.stderr, code: r.code });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ------------------------------------------------------------------ prerequisites

app.get("/api/prereq", async (_req, res) => {
  const check = async (cmd, args) => {
    try {
      const r = await run(cmd, args, os.homedir(), 20_000);
      const text = (r.stdout || r.stderr).trim().split(/\r?\n/)[0] ?? "";
      return { found: r.code === 0 || text.length > 0, version: text };
    } catch {
      return { found: false, version: "" };
    }
  };
  const [dotnet, git] = await Promise.all([check("dotnet", ["--version"]), check("git", ["--version"])]);
  res.json({ dotnet, git, node: { found: true, version: process.versions.node }, platform: process.platform });
});

// ------------------------------------------------------------------ tests

app.post("/api/test", async (req, res) => {
  try {
    const root = assertAbsolute(req.body.root);
    const plan = await detectBuild(root);
    if (!plan || plan.kind !== "dotnet") {
      return res.status(400).json({ error: "No .NET solution or project found in this folder." });
    }
    const args = ["test", plan.args[1], "-nologo", "-v:q"];
    const r = await run("dotnet", args, root, 900_000);
    res.json({ command: `dotnet ${args.join(" ")}`, stdout: r.stdout, stderr: r.stderr, code: r.code });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ------------------------------------------------------------------ extensions

const extDir = path.join(process.env.LOCALAPPDATA || os.homedir(), "VisualStudioClone", "extensions");

app.get("/api/extensions", async (_req, res) => {
  try {
    await fs.mkdir(extDir, { recursive: true });
    const files = await fs.readdir(extDir).catch(() => []);
    const extensions = [];
    for (const file of files) {
      if (!file.toLowerCase().endsWith(".vsix")) continue;
      const stat = await fs.stat(path.join(extDir, file)).catch(() => null);
      extensions.push({ file, size: stat?.size ?? 0 });
    }
    res.json({ ok: true, dir: extDir, extensions });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/extensions/search", async (req, res) => {
  try {
    const query = String(req.body.query ?? "").trim() || "csharp";
    const r = await fetch("https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json;api-version=7.2-preview.1",
        "user-agent": "visual-studio-clone",
      },
      body: JSON.stringify({
        filters: [
          {
            criteria: [{ filterType: 10, value: query }],
            pageNumber: 1,
            pageSize: 20,
            sortBy: 0,
            sortOrder: 0,
          },
        ],
        assetTypes: [],
        flags: 914,
      }),
    });
    if (!r.ok) return res.status(400).json({ error: `Marketplace returned ${r.status}` });
    const j = await r.json();
    const list = j?.results?.[0]?.extensions ?? [];
    res.json({
      ok: true,
      results: list.map((e) => ({
        id: e.extensionName,
        publisher: e.publisher?.publisherName ?? "",
        displayName: e.displayName ?? e.extensionName,
        description: e.shortDescription ?? "",
        version: e.versions?.[0]?.version ?? "",
        installs: e.statistics?.find((s) => s.statisticName === "install")?.value ?? 0,
      })),
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/extensions/install", async (req, res) => {
  try {
    const publisher = String(req.body.publisher ?? "").trim();
    const id = String(req.body.id ?? "").trim();
    const version = String(req.body.version ?? "").trim();
    if (!publisher || !id || !version) {
      return res.status(400).json({ error: "publisher, id and version are required." });
    }
    await fs.mkdir(extDir, { recursive: true });
    const url = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${encodeURIComponent(
      publisher,
    )}/vsextensions/${encodeURIComponent(id)}/${encodeURIComponent(version)}/vspackage`;
    const r = await fetch(url, { headers: { "user-agent": "visual-studio-clone" } });
    if (!r.ok) return res.status(400).json({ error: `Marketplace download failed (${r.status})` });
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 1024) return res.status(400).json({ error: "Downloaded package looks empty." });
    const file = `${publisher}.${id}-${version}.vsix`;
    await fs.writeFile(path.join(extDir, file), buf);
    res.json({ ok: true, file, dir: extDir, bytes: buf.length });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/extensions/remove", async (req, res) => {
  try {
    const file = path.basename(String(req.body.file ?? ""));
    if (!file.toLowerCase().endsWith(".vsix")) return res.status(400).json({ error: "Invalid extension file." });
    await fs.rm(path.join(extDir, file), { force: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ------------------------------------------------------------------ static

const dist = path.join(__dirname, "..", "dist");
if (process.argv.includes("--serve") || process.env.NODE_ENV === "production") {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, "127.0.0.1", () => {
  console.log(`  Visual Studio clone API   http://127.0.0.1:${PORT}`);
});
