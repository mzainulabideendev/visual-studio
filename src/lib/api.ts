export type Entry = {
  name: string;
  path: string;
  dir: boolean;
  size: number;
  mtime: number;
};

export type ErrorItem = {
  severity: "error" | "warning" | "info";
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
  project?: string;
};

export type GitFile = { path: string; status: string; staged: boolean };

const base = "/api";

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(base + url, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return (await res.json()) as T;
}

export const api = {
  info: () => json<{ version: string; platform: string; home: string; drives: string[] }>("/info"),
  list: (dir: string) => json<{ entries: Entry[] }>(`/list?dir=${encodeURIComponent(dir)}`),
  read: (path: string) => json<{ content: string; size: number }>(`/read?path=${encodeURIComponent(path)}`),
  write: (path: string, content: string) =>
    json<{ ok: true }>("/write", { method: "POST", body: JSON.stringify({ path, content }) }),
  create: (path: string, dir: boolean) =>
    json<{ ok: true }>("/create", { method: "POST", body: JSON.stringify({ path, dir }) }),
  remove: (path: string) =>
    json<{ ok: true }>("/remove", { method: "POST", body: JSON.stringify({ path }) }),
  rename: (from: string, to: string) =>
    json<{ ok: true }>("/rename", { method: "POST", body: JSON.stringify({ from, to }) }),
  search: (root: string, query: string) =>
    json<{ hits: { path: string; line: number; text: string }[]; truncated: boolean }>("/search", {
      method: "POST",
      body: JSON.stringify({ root, query }),
    }),
  exec: (command: string, cwd: string) =>
    json<{ stdout: string; stderr: string; code: number; cwd: string }>("/exec", {
      method: "POST",
      body: JSON.stringify({ command, cwd }),
    }),
  build: (root: string, rebuild = false) =>
    json<{
      command: string;
      stdout: string;
      stderr: string;
      code: number;
      errors: ErrorItem[];
      durationMs: number;
    }>("/build", { method: "POST", body: JSON.stringify({ root, rebuild }) }),
  git: (root: string) =>
    json<{ branch: string; files: GitFile[]; isRepo: boolean }>(
      `/git?root=${encodeURIComponent(root)}`,
    ),
  newProject: (options: {
    root: string;
    name: string;
    template?: string;
    framework?: string;
    solutionName?: string;
    createSolution?: boolean;
    sameDirectory?: boolean;
  }) =>
    json<{ ok: true; path: string; projectPath: string; solutionFile: string; template: string; framework: string }>(
      "/new-project",
      { method: "POST", body: JSON.stringify(options) },
    ),
  nuget: (project: string, packageId: string, version = "") =>
    json<{
      ok: boolean;
      command: string;
      stdout: string;
      stderr: string;
      code: number;
    }>("/nuget", { method: "POST", body: JSON.stringify({ project, packageId, version }) }),
  nugetList: (project: string) =>
    json<{
      ok: boolean;
      packages: { id: string; version: string }[];
      stdout: string;
      stderr: string;
      code: number;
    }>("/nuget/list", { method: "POST", body: JSON.stringify({ project }) }),
  nugetRemove: (project: string, packageId: string, version = "") =>
    json<{
      ok: boolean;
      command: string;
      stdout: string;
      stderr: string;
      code: number;
    }>("/nuget/remove", { method: "POST", body: JSON.stringify({ project, packageId, version }) }),
  runProject: (root: string) =>
    json<{ command: string; stdout: string; stderr: string; code: number; durationMs: number }>("/run", {
      method: "POST",
      body: JSON.stringify({ root }),
    }),
  nugetSearch: (query: string) =>
    json<{
      ok: boolean;
      results: Array<{ id: string; version: string; description: string; authors: string; downloads: number }>;
    }>("/nuget/search", { method: "POST", body: JSON.stringify({ query }) }),
  refsList: (project: string) =>
    json<{ ok: boolean; refs: string[]; stdout: string; stderr: string; code: number }>("/refs/list", {
      method: "POST",
      body: JSON.stringify({ project }),
    }),
  refsAdd: (project: string, reference: string) =>
    json<{ ok: boolean; command: string; stdout: string; stderr: string; code: number }>("/refs/add", {
      method: "POST",
      body: JSON.stringify({ project, reference }),
    }),
  gitInit: (root: string) =>
    json<{ ok: boolean; stdout: string; stderr: string; code: number }>("/git/init", {
      method: "POST",
      body: JSON.stringify({ root }),
    }),
  gitCommit: (root: string, message: string) =>
    json<{ ok: boolean; stdout: string; stderr: string; code: number }>("/git/commit", {
      method: "POST",
      body: JSON.stringify({ root, message }),
    }),
  gitPush: (root: string) =>
    json<{ ok: boolean; stdout: string; stderr: string; code: number }>("/git/push", {
      method: "POST",
      body: JSON.stringify({ root }),
    }),
  githubUser: (token: string) =>
    json<{ ok: boolean; login: string; name: string; avatar: string }>("/auth/github", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  copilot: (messages: Array<{ role: string; content: string }>) =>
    json<{ ok: boolean; content: string }>("/copilot", {
      method: "POST",
      body: JSON.stringify({ messages }),
    }),
  cloneRepo: (url: string, dir: string) =>
    json<{ ok: boolean; path: string; stdout: string; stderr: string; code: number }>("/git/clone", {
      method: "POST",
      body: JSON.stringify({ url, dir }),
    }),
  clean: (root: string) =>
    json<{ command: string; stdout: string; stderr: string; code: number }>("/clean", {
      method: "POST",
      body: JSON.stringify({ root }),
    }),
  prereq: () =>
    json<{
      dotnet: { found: boolean; version: string };
      git: { found: boolean; version: string };
      node: { found: boolean; version: string };
      platform: string;
    }>("/prereq"),
  test: (root: string) =>
    json<{ command: string; stdout: string; stderr: string; code: number }>("/test", {
      method: "POST",
      body: JSON.stringify({ root }),
    }),
  extList: () =>
    json<{ ok: boolean; dir: string; extensions: Array<{ file: string; size: number }> }>("/extensions"),
  extSearch: (query: string) =>
    json<{
      ok: boolean;
      results: Array<{
        id: string;
        publisher: string;
        displayName: string;
        description: string;
        version: string;
        installs: number;
      }>;
    }>("/extensions/search", { method: "POST", body: JSON.stringify({ query }) }),
  extInstall: (publisher: string, id: string, version: string) =>
    json<{ ok: boolean; file: string; dir: string; bytes: number }>("/extensions/install", {
      method: "POST",
      body: JSON.stringify({ publisher, id, version }),
    }),
  extRemove: (file: string) =>
    json<{ ok: boolean }>("/extensions/remove", { method: "POST", body: JSON.stringify({ file }) }),
};

export function basename(p: string) {
  return p.split(/[\\/]/).filter(Boolean).pop() ?? p;
}

export function dirname(p: string) {
  const parts = p.split(/[\\/]/);
  parts.pop();
  return parts.join("\\");
}

export function sep(p: string) {
  return p.includes("\\") ? "\\" : "/";
}

export function join(a: string, b: string) {
  if (!a) return b;
  const s = sep(a);
  return a.endsWith(s) ? a + b : a + s + b;
}

export function relative(root: string, p: string) {
  if (!root) return p;
  const n = (x: string) => x.replace(/\//g, "\\").toLowerCase();
  const r = n(root).replace(/\\$/, "");
  const q = n(p);
  if (q.startsWith(r + "\\")) return p.slice(r.length + 1);
  return p;
}
