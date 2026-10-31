# Provenance — how the Visual Studio shell was measured

This project is a reconstruction, not a reskin made from screenshots. Every color, the
application icon, the product identity, and the shell geometry were derived from the
Visual Studio 2026 installation on this machine:

```
C:\Program Files\Microsoft Visual Studio\18\Community\Common7\IDE\devenv.exe
  18.10.12217.157  (stable)
  sha256 1b2afedb69a2899f8c713510c653cbfaa61198a0aa1c665424b9dc56090fb599
```

## 1. Target identification (observed)

`REA ▸ open_binary` reported format `pe`, architecture `x86_64`, and the digest above.
`REA ▸ inspect_pe_resources` (provider `rea-pe-resources`, no decompiler required) produced
evidence `ev_37f9ae…6ea6`: a PE32+ image whose icon group 41 carries a 256 px PNG
(`declared_bytes 49160`) plus 96/80/72/64/60/48/40/32/24/20/16 px variants.

The extracted 256 px blob **is** `public/vs-icon.png`; the mark is the violet/pink ribbon
introduced with the 2026 branding.

The native decompiler providers were verified but unavailable on this host (Ghidra not
configured, Hopper unsupported on win32, IDA/Kuna not configured), so no code-level claims are
made about `devenv.exe` itself. They were not needed: the shell's appearance is declared as
data, not compiled into the binary.

## 2. Where the shell declares its colors (observed)

Visual Studio stores theme values as binary registry blobs inside `*.pkgdef` files:

```
Common7\IDE\CommonExtensions\Platform\
  Theme.Dark.pkgdef    33 categories, 1,194 color records
  Theme.Light.pkgdef   33 categories, 1,205 color records
  Shell.Dark.pkgdef     3 categories,  130 records  (Fluent ramp: Surface/Control/Text/Accent)
  Shell.Light.pkgdef    3 categories,  130 records
  Themes.Registration.pkgdef   theme id -> name ("Dark", "Cool Slate", "Bubblegum", …)
```

`Shell.Dark.pkgdef` also carries `ShellInternal`: the window frame
(`EnvironmentBackground #1c1c1c`, `EnvironmentBorder #ee8491`, status-bar state fills) and
`EditorOverride`: popup colors used by the editor's completion UI.

## 3. Binary format of a theme blob (reverse engineered here)

Each `"Data"=hex:…` value under
`[$RootKey$\Themes\{1ded0138-47ce-435e-84ef-9ec1f439b749}\<Category>]` is:

```
u32  total byte length of the blob
u32  format word        (0x0b in every blob inspected; meaning unknown)
u32  format version     (0x01)
u8[16] category GUID    (e.g. 73338ded-2d56-4aad-b8eb-73b20d3f4bff = "Shell")
u32  record count
repeat record_count times:
    u32   name length in bytes
    u8[]  name, UTF-8, no terminator ("FileTabSelectedBackground")
    u8    value kind       (0x01 = color; no other kind observed)
    u8[4] color, BGRA order (blue, green, red, alpha)
    u8    has-alternate    (0x00 or 0x01)
    u8[4] optional second BGRA color (only when has-alternate = 1)
```

Notes and unknowns, kept explicit:

- Colors are **BGRA**, not ARGB. `FileTabDocumentBorderBackground` =
  `71,60,e8,ff` → `#e86071`.
- The `has-alternate` byte holds a second color that the shell uses in high-contrast mode
  (`AccessKeyToolTip` = `#999999` with alternate `#000000`). The decoder ignores it.
- What the second header word encodes is **not established**. Records parse correctly without
  interpreting it, and the parsed count matches the trailing record stream in every blob tested.
- Editor *syntax* colors are not in these files. `Microsoft.VisualStudio.LanguageServices.pkgdef`
  contains a `Roslyn Text Editor MEF Items` blob in a slightly different record shape whose
  values are the **light** defaults. The dark syntax palette in `src/theme.ts` is therefore a
  documented design choice mapped onto the same hue family (`#569CD6`, `#CE9178`, `#57A64A`,
  `#4EC9B0`, `#DCDCAA`), not a byte-for-byte extraction.

Reproduce with:

```powershell
node tools/decode-pkgdef-theme.mjs `
  "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\IDE\CommonExtensions\Platform\Theme.Dark.pkgdef" `
  evidence/theme-dark.json
```

## 4. Mapping into tokens (inference)

`src/theme.ts` names each token after the registry value it came from, e.g.

```ts
accent: "#ee8491",        // Shell ▸ AccentFillDefault
fileTabActive: "#3d3d3d", // Environment ▸ FileTabSelectedBackground
envBackground: "#1f1f1f", // Environment ▸ EnvironmentBackground
header: "#282828",        // ShellInternal ▸ EnvironmentHeader
```

Non-color geometry (34 px title bar, 38 px toolbar, 292 px tool-window dock, 240 px bottom
panel, 22 px tree rows, 24 px status bar) is a design choice chosen to match the shell's
proportions. The layout order — menu bar in the title bar, Start + configuration combos on the
toolbar, tool windows left/right, document well with a top accent on the active tab, status bar
with Ln/Col and diagnostics — follows the shell's own structure.

## 5. Verification (observed)

`tools/ui-smoke.mjs` drives the running app with Edge through Puppeteer and writes
`evidence/screens/*.png`. It confirms:

1. the start window renders with real recents,
2. the open-folder dialog browses the real file system,
3. `Program.cs` opens with C# coloring,
4. `Ctrl+Shift+B` executes `dotnet build` and the output lands in the Output pane,
5. `Ctrl+Q` filters commands/files,
6. `dotnet run --no-build` executes through the terminal pane and prints program output.

Losses: the clone renders a *subset* — no extension host, no debugger, no designer, no
NuGet UX. Where the shell's behavior could not be observed statically it was left disabled
rather than invented; menu items that are not implemented are greyed out.
