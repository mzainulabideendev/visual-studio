# Visual Studio shell — evidence-based clone

A working, local recreation of the **Visual Studio 2026 (18.10 Community)** shell: title bar,
menus, toolbar, Solution Explorer, document well, Properties, Error List / Output / Terminal /
Git Changes, and status bar — driven by a real folder on disk, a real Monaco editor, a real
`dotnet build`, and a real PowerShell command runner.

The look is not guessed. The chrome palette, tab colors, surface ramp, and accent were decoded
from the Visual Studio installation on this machine; the app icon is the 256 px PNG resource
from `devenv.exe`.

![Shell](evidence/screens/04-editor.png)

## Run it

```powershell
npm install
npm start          # API on :5179 + Vite on :5180, opens the browser
```

Then **File ▸ Open ▸ Folder…** (`Ctrl+O`) and pick any folder. A ready-made sample lives in
`sample/HelloVs`.

Production build:

```powershell
npm run build
npm run preview    # serves dist/ + API from :5179
```

## Packaging into a standalone .exe

```powershell
npm run package                                  # electron-packager → Release/visual-studio-clone-win32-x64/
npx electron-builder --dir --win --x64          # unpacked Electron app → dist\win-unpacked\Visual Studio Clone.exe
```

The unpacked bundle (`dist\win-unpacked\Visual Studio Clone.exe`) contains the Electron
shell plus the app ASAR. Its main process spawns the backend (`server/index.mjs`) and loads
the UI from `http://127.0.0.1:5179/` (which serves the Vite build in `dist/`). Run `npm run build`
first so `dist/` contains the frontend build.

For a single-file NSIS installer instead of an unpacked folder:

```powershell
npx electron-builder --win --x64
```

### Visual Studio-style setup (`installer/`)

```powershell
npm run build:installer   # package IDE → installer/payload/app → Release/installer-ui/VisualStudioClone-Installer-1.0.0.exe
npm run installer:dev     # run the setup UI from source
```

The setup executable carries the packaged IDE as `resources/payload/app` and copies it into the
chosen install folder. `npm run installer:dev` uses `installer/payload/app` when it exists and
otherwise falls back to `Release/visual-studio-clone-win32-x64`.

---

## Linux build

A ready-to-run Linux x64 build is produced with:

```powershell
npm run release:linux        # frontend + Electron Linux app + portable .tar.gz
```

Output: `Release/VisualStudioClone-<version>-linux-x64.tar.gz`. The archive stores Unix
permission bits, so on Linux:

```bash
tar xzf VisualStudioClone-1.0.0-linux-x64.tar.gz
cd VisualStudioClone-1.0.0-linux-x64
./visual-studio-clone
```

To produce native installers, run these **on Linux** (or via the
[`Linux build`](.github/workflows/linux.yml) GitHub Actions workflow):

```bash
npm ci
npm run build
npx electron-builder --linux AppImage deb --x64 --config.directories.output=Release/linux
```

This yields `VisualStudioClone-1.0.0-x86_64.AppImage` and a `.deb` package.

`npm run package:linux` (and `package:linux:arm64`) produce an unpacked
`Release/visual-studio-clone-linux-x64/` folder if you only need the directory.

---

## Running on Linux / macOS

The clone itself is plain Node (Express + React + Monaco) — it runs wherever Node.js
does, and the VS feature set is platform-neutral:

- **Terminal**: `pwsh` on Windows, `$SHELL` / `bash` on Linux & macOS (backend picks it).
- **Editor**: shell-script files (`.sh`, `.bash`) already map to Monaco's `shell` language.
- **Build**: `dotnet build` / `dotnet build -t:Rebuild` via the .NET SDK — fully cross-platform.
- **Paths**: absolute paths are handled with Node's `path` module, so `/home/…` folders work
  on Unix just like `D:\…` on Windows.
- **Git**: `git` CLI based, works everywhere.

To run on Linux/macOS:

```bash
node server/index.mjs   # API
npx vite                # UI (or `npm run build && npm run preview`)
```

---

## What actually works

| Area | Behavior |
| --- | --- |
| Solution Explorer | Lazy directory tree, real file icons/badges, filter box, refresh, open on single click (preview tab) / double click (pinned tab) |
| Editor | Monaco with a VS-derived theme, tabs, dirty markers, breadcrumbs, go-to-line, `Ctrl+S` / `Ctrl+Shift+S` |
| Command palette | `Ctrl+Q` / `Ctrl+Shift+P` — every enabled menu command plus workspace files |
| Build | Auto-detects `*.sln` / `*.csproj` / `*.fsproj` / `*.vbproj` / `package.json`, runs the real toolchain (`dotnet build`, or `-t:Rebuild` for **Rebuild Solution**), parses `file(line,col): error CSxxxx:` diagnostics into the Error List |
| Terminal | Persistent PowerShell invocation per command with cwd tracking (`cd` works), history with ↑/↓ |
| Search | `Ctrl+Shift+F` real recursive content search (skips `node_modules`, `.git`, `bin`, `obj`, binaries) |
| Source control | `git status --porcelain` branch + change list, file markers in the tree |
| Diagnostics | Clicking an error opens the file at the exact line |
| Themes | Dark and Light, both taken from the installed theme files |

## Provenance

Everything visual is traceable. Full methodology: [`docs/PROVENANCE.md`](docs/PROVENANCE.md).

| Artifact | Used for | Evidence |
| --- | --- | --- |
| `Common7\IDE\devenv.exe` (18.10.12217.157) | identity, product version, icon | `evidence/devenv-pe-resources.json` (REA evidence `ev_37f9ae…6ea6`) |
| `CommonExtensions\Platform\Theme.Dark.pkgdef` | 1,194 chrome colors | `evidence/theme-dark.json` |
| `CommonExtensions\Platform\Shell.Dark.pkgdef` | Fluent surface ramp, accent, status bar | `evidence/shell-dark.json` |
| `CommonExtensions\Platform\Theme.Light.pkgdef` | light theme | `evidence/theme-light.json` |
| `CommonExtensions\Platform\Shell.Light.pkgdef` | light Fluent ramp | `evidence/shell-light.json` |
| `devenv.exe` RT_ICON 256×256 | app icon | `evidence/icon/icon-256x256-0.png` |
| `Tools\decode-pkgdef-theme.mjs` | decodes the binary theme blobs | run it yourself against any `*.pkgdef` |

Key decoded values (dark):

```
EnvironmentBackground        #1f1f1f     FileTabBackground          #2e2e2e
EnvironmentHeader            #282828     FileTabSelectedBackground  #3d3d3d
PanelBorder                  #333333     FileTabSelectedBorder      #e86071
AccentFillDefault (Shell)    #ee8491     AccentFillAlt              #f8ccd2
SolidBackgroundFillBase      #202020     TextFillPrimary            #ffffff
```

## Layout

```
src/
  theme.ts                 decoded palette + Monaco themes
  store.ts                 zustand app state (workspace, docs, build, git, terminal)
  components/
    TitleBar / MenuBar     window chrome, full menu model, submenus
    Toolbar                Start button, configuration combos, dock toggles
    SolutionExplorer       tree, filter, Search view
    EditorPane             tab strip, breadcrumbs, Monaco host
    BottomPanel            Error List, Output, Terminal, Git Changes
    StatusBar              build state, Ln/Col, diagnostics, branch
    CommandPalette         commands + files
    StartWindow            VS-style start page with recents
    Dialogs                open folder browser, new file, go to line, about
server/index.mjs           filesystem, search, exec, build, git API
tools/                     theme decoder, icon extractor, browser smoke test
evidence/                  decoded palettes, icon, screenshots
```

## Honest limits

- This is **not** a compiler, debugger, or MSBuild host. F5 is a visual state; builds are
  delegated to the real SDK. There is no IntelliSense beyond Monaco's own.
- The terminal is a command runner, not a PTY: no interactive prompts, no ANSI full-screen apps.
- No extension model, NuGet UI, designer surfaces, or solution/project editing.
- Visual Studio name, icon, and color values are Microsoft's; this repository is an independent
  engineering study and is not affiliated with or endorsed by Microsoft.
