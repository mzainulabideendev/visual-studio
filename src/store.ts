import { create } from "zustand";
import { api, basename, dirname, join, type Entry, type ErrorItem, type GitFile } from "./lib/api";
import { languageFor } from "./lib/lang";
import { terminalShellName } from "./lib/platform";

export type Doc = {
  path: string;
  name: string;
  content: string;
  saved: string;
  language: string;
  preview: boolean;
};

export type TerminalLine = { kind: "cmd" | "out" | "err" | "info"; text: string };
export type SearchHit = { path: string; line: number; text: string };

type Tab = "solution" | "search";
type BottomTab = "errors" | "output" | "terminal" | "git";

const RECENT_KEY = "vsclone.recent";
const THEME_KEY = "vsclone.theme";

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export type State = {
  ready: boolean;
  version: string;
  root: string | null;
  recent: string[];
  tree: Record<string, Entry[]>;
  expanded: Record<string, boolean>;
  loadingDirs: Record<string, boolean>;
  docs: Doc[];
  active: string | null;
  selection: string | null;
  theme: "dark" | "light";
  leftOpen: boolean;
  leftTab: Tab;
  rightOpen: boolean;
  bottomOpen: boolean;
  bottomTab: BottomTab;
  output: string;
  terminal: TerminalLine[];
  terminalCwd: string;
  terminalBusy: boolean;
  problems: ErrorItem[];
  git: { branch: string; files: GitFile[]; isRepo: boolean };
  auth: { login: string; name: string; avatar: string } | null;
  copilot: { open: boolean; messages: Array<{ role: "user" | "assistant"; content: string }>; busy: boolean };
  status: { text: string; kind: "rest" | "building" | "debugging" };
  paletteOpen: boolean;
  dialog: null | "open-folder" | "new-file" | "new-project" | "nuget" | "add-reference" | "github" | "copilot" | "clone" | "open-solution" | "save-as" | "prereq" | "extensions" | "about" | "go-to-line";
  cursor: { line: number; column: number; sel: number };
  reveal: { path: string; line: number } | null;
  search: { query: string; results: SearchHit[]; busy: boolean; done: boolean };
  startVisible: boolean;

  init: () => Promise<void>;
  setTheme: (t: "dark" | "light") => void;
  openFolder: (path: string) => Promise<void>;
  toggleDir: (path: string) => Promise<void>;
  refreshDir: (path: string) => Promise<void>;
  openFile: (path: string, preview?: boolean) => Promise<void>;
  setContent: (path: string, content: string) => void;
  save: (path?: string) => Promise<void>;
  saveAll: () => Promise<void>;
  closeDoc: (path: string, force?: boolean) => void;
  setActive: (path: string) => void;
  setSelection: (path: string | null) => void;
  setCursor: (c: { line: number; column: number; sel: number }) => void;
  revealAt: (path: string, line: number) => void;
  setStatus: (text: string, kind?: "rest" | "building" | "debugging") => void;
  toggleLeft: () => void;
  toggleRight: () => void;
  toggleBottom: (tab?: BottomTab) => void;
  setLeftTab: (t: Tab) => void;
  setBottomTab: (t: BottomTab) => void;
  appendOutput: (s: string) => void;
  clearOutput: () => void;
  runTerminal: (cmd: string) => Promise<void>;
  build: (rebuild?: boolean) => Promise<void>;
  clean: () => Promise<void>;
  runTests: () => Promise<void>;
  openSolution: (filePath: string) => Promise<void>;
  saveAs: (path: string) => Promise<void>;
  run: () => Promise<void>;
  refreshGit: () => Promise<void>;
  initGit: () => Promise<void>;
  commit: (message: string) => Promise<void>;
  push: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
  setCopilot: (open: boolean) => void;
  askCopilot: (text: string) => Promise<void>;
  searchAll: (q: string) => Promise<void>;
  setPalette: (open: boolean) => void;
  setDialog: (d: State["dialog"]) => void;
  setStartVisible: (v: boolean) => void;
  newFile: (path: string) => Promise<void>;
  newProject: (options: {
    root: string;
    name: string;
    template?: string;
    framework?: string;
    solutionName?: string;
    createSolution?: boolean;
    sameDirectory?: boolean;
  }) => Promise<{ path: string; projectPath: string; solutionFile: string }>;
  addNuGet: (project: string, packageId: string, version?: string) => Promise<{ ok: boolean; command: string; stdout: string; stderr: string; code: number }>;
  deletePath: (path: string) => Promise<void>;
};

export const useStore = create<State>((set, get) => ({
  ready: false,
  version: "18.10",
  root: null,
  recent: loadRecent(),
  tree: {},
  expanded: {},
  loadingDirs: {},
  docs: [],
  active: null,
  selection: null,
  theme: (localStorage.getItem(THEME_KEY) as "dark" | "light") ?? "dark",
  leftOpen: true,
  leftTab: "solution",
  rightOpen: false,
  bottomOpen: true,
  bottomTab: "output",
  output: "",
  terminal: [
    { kind: "info", text: `Visual Studio Terminal — ${terminalShellName()}` },
  ],
  terminalCwd: "",
  terminalBusy: false,
  problems: [],
  git: { branch: "", files: [], isRepo: false },
  auth: null,
  copilot: { open: false, messages: [], busy: false },
  status: { text: "Ready", kind: "rest" },
  paletteOpen: false,
  dialog: null,
  cursor: { line: 1, column: 1, sel: 0 },
  reveal: null,
  search: { query: "", results: [], busy: false, done: false },
  startVisible: true,

  init: async () => {
    try {
      const info = await api.info();
      set({ version: info.version.split(" ")[0], terminalCwd: info.home });
    } catch {
      /* server offline */
    }
    const token = localStorage.getItem("vsclone.github");
    if (token) {
      try {
        const u = await api.githubUser(token);
        set({ auth: { login: u.login, name: u.name, avatar: u.avatar } });
      } catch {
        localStorage.removeItem("vsclone.github");
      }
    }
    set({ ready: true });
  },

  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    set({ theme });
  },

  openFolder: async (path) => {
    const clean = path.replace(/[\\/]+$/, "");
    set({ status: { text: "Loading solution…", kind: "rest" } });
    try {
      const { entries } = await api.list(clean);
      const recent = [clean, ...get().recent.filter((r) => r !== clean)].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
      set({
        root: clean,
        tree: { [clean]: entries, ...get().tree },
        expanded: { [clean]: true, ...get().expanded },
        docs: [],
        active: null,
        selection: null,
        startVisible: false,
        recent,
        terminalCwd: clean,
        output:
          `Microsoft Visual Studio Clone ${get().version}\n` +
          `Workspace opened: ${clean}\n` +
          `Ready. Build with Ctrl+Shift+B, run the terminal with Ctrl+\`.\n\n`,
        status: { text: "Ready", kind: "rest" },
      });
      void get().refreshGit();
    } catch (e) {
      set({ status: { text: `Cannot open ${clean}`, kind: "rest" } });
      get().appendOutput(`error: ${(e as Error).message}\n`);
    }
  },

  toggleDir: async (path) => {
    const { expanded, tree } = get();
    if (expanded[path]) {
      set({ expanded: { ...expanded, [path]: false } });
      return;
    }
    set({ expanded: { ...expanded, [path]: true } });
    if (!tree[path]) {
      set({ loadingDirs: { ...get().loadingDirs, [path]: true } });
      try {
        const { entries } = await api.list(path);
        set({ tree: { ...get().tree, [path]: entries } });
      } catch (e) {
        get().appendOutput(`error: ${(e as Error).message}\n`);
      } finally {
        set({ loadingDirs: { ...get().loadingDirs, [path]: false } });
      }
    }
  },

  refreshDir: async (path) => {
    const { entries } = await api.list(path);
    set({ tree: { ...get().tree, [path]: entries } });
  },

  openFile: async (path, preview = false) => {
    const existing = get().docs.find((d) => d.path === path);
    if (existing) {
      if (preview && !existing.preview) {
        set({ active: path, selection: path });
        return;
      }
      set({ active: path, selection: path });
      return;
    }
    try {
      const { content } = await api.read(path);
      const doc: Doc = {
        path,
        name: basename(path),
        content,
        saved: content,
        language: languageFor(path),
        preview,
      };
      const docs = [...get().docs, doc];
      set({ docs, active: path, selection: path });
    } catch (e) {
      get().appendOutput(`error: ${(e as Error).message}\n`);
      set({ bottomOpen: true, bottomTab: "output" });
    }
  },

  setContent: (path, content) => {
    set({
      docs: get().docs.map((d) => (d.path === path ? { ...d, content, preview: false } : d)),
    });
  },

  save: async (path) => {
    const target = path ?? get().active;
    const doc = get().docs.find((d) => d.path === target);
    if (!doc) return;
    if (doc.content === doc.saved) return;
    await api.write(doc.path, doc.content);
    set({
      docs: get().docs.map((d) => (d.path === doc.path ? { ...d, saved: d.content } : d)),
      status: { text: `Saved ${doc.name}`, kind: "rest" },
    });
    setTimeout(() => {
      if (get().status.text.startsWith("Saved")) set({ status: { text: "Ready", kind: "rest" } });
    }, 1800);
  },

  saveAll: async () => {
    for (const doc of get().docs) {
      if (doc.content !== doc.saved) await get().save(doc.path);
    }
    set({ status: { text: "All files saved", kind: "rest" } });
  },

  closeDoc: (path, force = false) => {
    const doc = get().docs.find((d) => d.path === path);
    if (!doc) return;
    if (!force && doc.content !== doc.saved) {
      const ok = window.confirm(`Save changes to ${doc.name}?`);
      if (ok) void get().save(path);
    }
    const docs = get().docs.filter((d) => d.path !== path);
    const active =
      get().active === path ? docs.length ? docs[docs.length - 1].path : null : get().active;
    set({ docs, active, selection: active });
  },

  setActive: (path) => set({ active: path, selection: path }),
  setSelection: (selection) => set({ selection }),
  setCursor: (cursor) => set({ cursor }),
  revealAt: (path, line) => set({ reveal: { path, line } }),
  setStatus: (text, kind = "rest") => set({ status: { text, kind } }),

  toggleLeft: () => set({ leftOpen: !get().leftOpen }),
  toggleRight: () => set({ rightOpen: !get().rightOpen }),
  toggleBottom: (tab) =>
    set({
      bottomOpen: tab ? true : !get().bottomOpen,
      bottomTab: tab ?? get().bottomTab,
    }),
  setLeftTab: (leftTab) => set({ leftTab, leftOpen: true }),
  setBottomTab: (bottomTab) => set({ bottomTab, bottomOpen: true }),

  appendOutput: (s) => set({ output: get().output + s }),
  clearOutput: () => set({ output: "" }),

  runTerminal: async (cmd) => {
    const cwd = get().terminalCwd || get().root || "";
    set({
      terminal: [...get().terminal, { kind: "cmd", text: `${terminalShellName()} ${cwd}> ${cmd}` }],
      terminalBusy: true,
    });
    try {
      const res = await api.exec(cmd, cwd);
      const lines: TerminalLine[] = [];
      if (res.stdout) lines.push({ kind: "out", text: res.stdout.replace(/\s+$/, "") });
      if (res.stderr) lines.push({ kind: "err", text: res.stderr.replace(/\s+$/, "") });
      if (res.code !== 0) lines.push({ kind: "err", text: `exit code ${res.code}` });
      set({
        terminal: [...get().terminal, ...lines],
        terminalBusy: false,
        terminalCwd: res.cwd || cwd,
      });
    } catch (e) {
      set({
        terminal: [...get().terminal, { kind: "err", text: (e as Error).message }],
        terminalBusy: false,
      });
    }
  },

  build: async (rebuild = false) => {
    const root = get().root;
    if (!root) return;
    set({
      status: { text: rebuild ? "Rebuild started…" : "Build started…", kind: "building" },
      bottomOpen: true,
      bottomTab: "output",
    });
    const header = `\n========== ${rebuild ? "Rebuild" : "Build"} started: ${new Date().toLocaleTimeString()} ==========\n`;
    set({ output: get().output + header });
    try {
      const res = await api.build(root, rebuild);
      const label = rebuild ? "Rebuild" : "Build";
      set({
        problems: res.errors,
        output:
          get().output +
          `> ${res.command}\n` +
          res.stdout +
          res.stderr +
          `\n========== ${label} ${res.code === 0 ? "succeeded" : "failed"} ` +
          `(${(res.durationMs / 1000).toFixed(1)}s) ==========\n`,
        status: {
          text:
            res.code === 0
              ? `${label} succeeded`
              : `${label} failed — ${res.errors.filter((e) => e.severity === "error").length} error(s)`,
          kind: "rest",
        },
      });
      if (res.code !== 0) set({ bottomTab: "errors" });
    } catch (e) {
      set({
        output: get().output + `error: ${(e as Error).message}\n`,
        status: { text: "Build failed", kind: "rest" },
      });
    }
  },

  clean: async () => {
    const root = get().root;
    if (!root) return;
    set({ status: { text: "Clean started…", kind: "building" }, bottomOpen: true, bottomTab: "output" });
    set({ output: get().output + `\n========== Clean started: ${new Date().toLocaleTimeString()} ==========\n` });
    try {
      const res = await api.clean(root);
      set({
        output: get().output + `> ${res.command}\n${res.stdout}${res.stderr}\n========== Clean ${res.code === 0 ? "completed" : "failed"} ==========\n`,
        status: { text: res.code === 0 ? "Clean completed" : "Clean failed", kind: "rest" },
      });
    } catch (e) {
      set({ output: get().output + `error: ${(e as Error).message}\n`, status: { text: "Clean failed", kind: "rest" } });
    }
  },

  runTests: async () => {
    const root = get().root;
    if (!root) return;
    set({
      status: { text: "Running tests…", kind: "building" },
      bottomOpen: true,
      bottomTab: "output",
    });
    set({ output: get().output + `\n========== Test run started: ${new Date().toLocaleTimeString()} ==========\n` });
    try {
      const res = await api.test(root);
      set({
        output: get().output + `> ${res.command}\n${res.stdout}${res.stderr}\n========== Tests ${res.code === 0 ? "passed" : "failed"} ==========\n`,
        status: { text: res.code === 0 ? "Tests passed" : "Tests failed", kind: "rest" },
      });
    } catch (e) {
      set({ output: get().output + `error: ${(e as Error).message}\n`, status: { text: "Test run failed", kind: "rest" } });
    }
  },

  openSolution: async (filePath) => {    const clean = filePath.replace(/[\\/]+$/, "");
    const isProject = /\.(cs|fs|vb)proj$/i.test(clean);
    const isSolution = /\.slnx?$/i.test(clean);
    const dir = isProject || isSolution ? dirname(clean) : clean;
    await get().openFolder(dir);
    if (isProject) await get().openFile(clean);
    if (isSolution) {
      set({ status: { text: `Solution ${basename(clean)} opened`, kind: "rest" } });
    }
  },

  saveAs: async (path) => {
    const doc = get().docs.find((d) => d.path === get().active);
    if (!doc) return;
    await api.write(path, doc.content);
    const parent = dirname(path);
    if (get().tree[parent]) await get().refreshDir(parent);
    set({ docs: get().docs.filter((d) => d.path !== doc.path), active: null });
    await get().openFile(path);
    set({ status: { text: `Saved as ${basename(path)}`, kind: "rest" } });
  },

  refreshGit: async () => {
    const root = get().root;
    if (!root) return;
    try {
      const git = await api.git(root);
      set({ git });
    } catch {
      /* not a repo */
    }
  },

  run: async () => {
    const root = get().root;
    if (!root) return;
    set({
      status: { text: "Running project…", kind: "debugging" },
      bottomOpen: true,
      bottomTab: "output",
    });
    set({
      output: get().output + `\n========== Run started: ${new Date().toLocaleTimeString()} ==========\n`,
    });
    try {
      const res = await api.runProject(root);
      set({
        output:
          get().output +
          `> ${res.command}\n` +
          res.stdout +
          res.stderr +
          `\n========== Run ${res.code === 0 ? "completed" : "failed"} (${(res.durationMs / 1000).toFixed(1)}s) ==========\n`,
        status: { text: res.code === 0 ? "Run completed" : "Run failed", kind: "rest" },
      });
    } catch (e) {
      set({
        output: get().output + `error: ${(e as Error).message}\n`,
        status: { text: "Run failed", kind: "rest" },
      });
    }
  },

  initGit: async () => {
    const root = get().root;
    if (!root) return;
    try {
      const res = await api.gitInit(root);
      get().appendOutput(`> git init\n${res.stdout}${res.stderr}`);
      await get().refreshGit();
      set({ status: { text: res.ok ? "Git repository initialized" : "git init failed", kind: "rest" } });
    } catch (e) {
      get().appendOutput(`error: ${(e as Error).message}\n`);
    }
  },

  commit: async (message) => {
    const root = get().root;
    if (!root) return;
    try {
      const res = await api.gitCommit(root, message);
      get().appendOutput(`> git commit -m "${message}"\n${res.stdout}${res.stderr}`);
      await get().refreshGit();
      set({ status: { text: res.ok ? "Commit created" : "Commit failed", kind: "rest" } });
    } catch (e) {
      get().appendOutput(`error: ${(e as Error).message}\n`);
      set({ status: { text: "Commit failed", kind: "rest" } });
    }
  },

  push: async () => {
    const root = get().root;
    if (!root) return;
    set({ status: { text: "Pushing…", kind: "rest" } });
    try {
      const res = await api.gitPush(root);
      get().appendOutput(`> git push\n${res.stdout}${res.stderr}`);
      set({ status: { text: res.ok ? "Pushed to remote" : "Push failed", kind: "rest" } });
    } catch (e) {
      get().appendOutput(`error: ${(e as Error).message}\n`);
      set({ status: { text: "Push failed", kind: "rest" } });
    }
  },

  signIn: async (token) => {
    const u = await api.githubUser(token);
    localStorage.setItem("vsclone.github", token);
    set({
      auth: { login: u.login, name: u.name, avatar: u.avatar },
      status: { text: `Signed in as ${u.login}`, kind: "rest" },
    });
  },

  signOut: () => {
    localStorage.removeItem("vsclone.github");
    set({ auth: null, status: { text: "Signed out of GitHub", kind: "rest" } });
  },

  setCopilot: (open) => set({ copilot: { ...get().copilot, open } }),

  askCopilot: async (text) => {
    const history: Array<{ role: "user" | "assistant"; content: string }> = [
      ...get().copilot.messages,
      { role: "user", content: text },
    ];
    set({ copilot: { ...get().copilot, messages: history, busy: true } });
    try {
      const res = await api.copilot(history);
      set({
        copilot: {
          ...get().copilot,
          messages: [...history, { role: "assistant", content: res.content }],
          busy: false,
        },
      });
    } catch (e) {
      set({
        copilot: {
          ...get().copilot,
          messages: [...history, { role: "assistant", content: `Error: ${(e as Error).message}` }],
          busy: false,
        },
      });
    }
  },

  searchAll: async (q) => {
    const root = get().root;
    if (!root || !q.trim()) {
      set({ search: { query: q, results: [], busy: false, done: false } });
      return;
    }
    set({ search: { query: q, results: [], busy: true, done: false }, leftOpen: true, leftTab: "search" });
    try {
      const { hits } = await api.search(root, q);
      set({ search: { query: q, results: hits, busy: false, done: true } });
    } catch (e) {
      get().appendOutput(`search error: ${(e as Error).message}\n`);
      set({ search: { query: q, results: [], busy: false, done: true } });
    }
  },

  setPalette: (paletteOpen) => set({ paletteOpen }),
  setDialog: (dialog) => set({ dialog }),
  setStartVisible: (startVisible) => set({ startVisible }),

  newFile: async (path) => {
    await api.create(path, false);
    if (get().root) {
      const parent = dirname(path);
      if (get().tree[parent]) await get().refreshDir(parent);
    }
    await get().openFile(path);
  },

  newProject: async (options) => {
    const res = await api.newProject(options);
    await get().openFolder(res.path);
    return { path: res.path, projectPath: res.projectPath, solutionFile: res.solutionFile };
  },

  addNuGet: async (project, packageId, version = "") => {
    const res = await api.nuget(project, packageId, version);
    get().appendOutput(`> ${res.command}\n${res.stdout}${res.stderr}`);
    get().setStatus(res.ok ? `Added NuGet package ${packageId}` : `NuGet add failed: ${packageId}`, "rest");
    return res;
  },

  deletePath: async (path) => {
    await api.remove(path);
    const parent = dirname(path);
    if (get().tree[parent]) await get().refreshDir(parent);
  },
}));

export function useActiveDoc() {
  return useStore((s) => s.docs.find((d) => d.path === s.active) ?? null);
}

export function dirty(d: Doc) {
  return d.content !== d.saved;
}

export { join, dirname, basename };
