export type Badge = { label: string; color: string; bg?: string; kind?: string };

const map: Record<string, Badge> = {
  cs: { label: "C#", color: "#368832" },
  vb: { label: "VB", color: "#2f6fd0" },
  fs: { label: "F#", color: "#30b9db" },
  cpp: { label: "C++", color: "#9b4f96" },
  cc: { label: "C++", color: "#9b4f96" },
  cxx: { label: "C++", color: "#9b4f96" },
  h: { label: "H", color: "#9b4f96" },
  hpp: { label: "H++", color: "#9b4f96" },
  c: { label: "C", color: "#5a7fb3" },
  ts: { label: "TS", color: "#3178c6" },
  tsx: { label: "TS", color: "#3178c6" },
  js: { label: "JS", color: "#d4b62c" },
  jsx: { label: "JS", color: "#d4b62c" },
  mjs: { label: "JS", color: "#d4b62c" },
  json: { label: "{}", color: "#cbcb41" },
  jsonc: { label: "{}", color: "#cbcb41" },
  html: { label: "<>", color: "#e37933" },
  htm: { label: "<>", color: "#e37933" },
  css: { label: "#", color: "#42a5f5" },
  scss: { label: "S", color: "#c6538c" },
  less: { label: "L", color: "#2a5f9e" },
  md: { label: "M", color: "#519aba" },
  xml: { label: "<>", color: "#a8c023" },
  xaml: { label: "X", color: "#5b9bd5" },
  sln: { label: "SLN", color: "#c09553" },
  csproj: { label: "P", color: "#3f7fd0" },
  vcxproj: { label: "P", color: "#9b4f96" },
  fsproj: { label: "P", color: "#30b9db" },
  vbproj: { label: "P", color: "#2f6fd0" },
  props: { label: "P", color: "#8a8a8a" },
  targets: { label: "T", color: "#8a8a8a" },
  png: { label: "IMG", color: "#a074c4" },
  jpg: { label: "IMG", color: "#a074c4" },
  jpeg: { label: "IMG", color: "#a074c4" },
  gif: { label: "IMG", color: "#a074c4" },
  svg: { label: "SVG", color: "#ffb13b" },
  ico: { label: "ICO", color: "#a074c4" },
  sh: { label: "$", color: "#4caf50" },
  ps1: { label: "PS", color: "#4c8fd0" },
  bat: { label: "BAT", color: "#8a8a8a" },
  cmd: { label: "CMD", color: "#8a8a8a" },
  yml: { label: "Y", color: "#cb171e" },
  yaml: { label: "Y", color: "#cb171e" },
  toml: { label: "T", color: "#8a8a8a" },
  txt: { label: "TXT", color: "#8a8a8a" },
  gitignore: { label: "G", color: "#f14e32" },
  gitattributes: { label: "G", color: "#f14e32" },
  editorconfig: { label: "EC", color: "#8a8a8a" },
  sql: { label: "SQL", color: "#d0a03f" },
  py: { label: "PY", color: "#4b8bbe" },
  java: { label: "J", color: "#e76f00" },
  razor: { label: "RZ", color: "#512bd4" },
  cshtml: { label: "RZ", color: "#512bd4" },
  resx: { label: "R", color: "#7ab648" },
  config: { label: "CFG", color: "#8a8a8a" },
};

export function ext(name: string) {
  const lower = name.toLowerCase();
  if (lower === "dockerfile") return "dockerfile";
  if (lower.startsWith(".git")) return lower.slice(1);
  if (lower === ".editorconfig") return "editorconfig";
  const i = lower.lastIndexOf(".");
  return i <= 0 ? "" : lower.slice(i + 1);
}

export function badgeFor(name: string, dir: boolean): Badge {
  if (dir) return { label: "", color: "#dcb67a" };
  const e = ext(name);
  return map[e] ?? { label: e ? e.slice(0, 3).toUpperCase() : "•", color: "#8f8f8f" };
}

const languages: Record<string, string> = {
  cs: "csharp",
  csx: "csharp",
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  jsonc: "json",
  css: "css",
  scss: "scss",
  less: "less",
  html: "html",
  htm: "html",
  md: "markdown",
  markdown: "markdown",
  xml: "xml",
  xaml: "xml",
  svg: "xml",
  csproj: "xml",
  vbproj: "xml",
  fsproj: "xml",
  vcxproj: "xml",
  props: "xml",
  targets: "xml",
  config: "xml",
  resx: "xml",
  yml: "yaml",
  yaml: "yaml",
  ps1: "powershell",
  psm1: "powershell",
  bat: "bat",
  cmd: "bat",
  sh: "shell",
  sql: "sql",
  py: "python",
  java: "java",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  h: "cpp",
  hpp: "cpp",
  c: "c",
  razor: "razor",
  cshtml: "razor",
  vb: "vb",
  fs: "fsharp",
  toml: "ini",
  ini: "ini",
  txt: "plaintext",
  gitignore: "plaintext",
};

export function languageFor(name: string) {
  return languages[ext(name)] ?? "plaintext";
}
