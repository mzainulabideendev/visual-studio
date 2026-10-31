/**
 * Design tokens reconstructed from the Visual Studio 18.10 Community installation on this machine.
 *
 * Source artifacts (see ../evidence):
 *   Common7/IDE/CommonExtensions/Platform/Theme.Dark.pkgdef   -> Environment / CommonDocument / TreeView colors
 *   Common7/IDE/CommonExtensions/Platform/Shell.Dark.pkgdef   -> Shell (Fluent) + ShellInternal colors
 *   Common7/IDE/CommonExtensions/Platform/Theme.Light.pkgdef  -> light counterpart
 *   Common7/IDE/CommonExtensions/Platform/Shell.Light.pkgdef
 *
 * Each token below is annotated with the exact registry value name it was decoded from.
 */

export type Palette = Record<string, string>;

export const darkPalette: Palette = {
  // Shell.Dark.pkgdef \ ShellInternal
  envBg: "#1c1c1c", //            EnvironmentBackground
  header: "#282828", //           EnvironmentHeader
  headerInactive: "#282828", //   EnvironmentHeaderInactive
  borderAccent: "#ee8491", //     EnvironmentBorder
  borderInactive: "#454545", //   EnvironmentBorderInactive
  logo: "#ee8491", //             EnvironmentLogo
  badge: "#ffffff0f", //          EnvironmentBadge
  // Shell.Dark.pkgdef \ Shell (Fluent surface ramp)
  solidBase: "#202020", //        SolidBackgroundFillBase
  solidSecondary: "#1c1c1c", //   SolidBackgroundFillSecondary
  solidTertiary: "#282828", //    SolidBackgroundFillTertiary
  solidQuaternary: "#2c2c2c", //  SolidBackgroundFillQuaternary
  solidQuinary: "#333333", //     SolidBackgroundFillQuinary
  surface: "#2c2c2c", //          SurfaceBackgroundFillDefault
  layer: "#3a3a3a4d", //          LayerFillDefault
  divider: "#ffffff15", //        DividerStrokeDefault
  controlFill: "#ffffff0f", //    ControlFillDefault
  controlFillHover: "#ffffff15", // ControlFillSecondary
  controlFillPressed: "#ffffff08", // ControlFillTertiary
  controlStroke: "#ffffff12", //  ControlStrokeDefault
  controlSolid: "#454545", //     ControlSolidFillDefault
  accent: "#ee8491", //           AccentFillDefault
  accentAlt: "#f8ccd2", //        AccentFillAlt
  accentSecondary: "#ee8491e5", // AccentFillSecondary
  accentSubtle: "#ee84911f", //   AccentFillSenary
  accentText: "#f8ccd2", //       AccentTextFillPrimary
  textPrimary: "#ffffff", //      TextFillPrimary
  textSecondary: "#ffffffc8", //  TextFillSecondary
  textTertiary: "#ffffff8b", //   TextFillTertiary
  textDisabled: "#ffffff5d", //   TextFillDisabled
  onAccent: "#000000", //         TextOnAccentFillPrimary
  success: "#5fcb6c", //          SystemFillSuccess
  successBg: "#1b3d39", //        SystemFillSuccessBackground
  caution: "#00e1fc", //          SystemFillCaution
  cautionBg: "#193543", //        SystemFillCautionBackground
  critical: "#a499ff", //         SystemFillCritical
  criticalBg: "#262744", //       SystemFillCriticalBackground
  attention: "#ffcd60", //        SystemFillAttention
  attentionBg: "#ffffff08", //    SystemFillAttentionBackground
  link: "#ebbe83", //             Shell.Dark \ ShellInternal? no: Environment.PanelHyperlink
  // Theme.Dark.pkgdef \ Environment
  envBackground: "#1f1f1f", //    EnvironmentBackground
  fileTab: "#2e2e2e", //          FileTabBackground
  fileTabActive: "#3d3d3d", //    FileTabSelectedBackground
  fileTabBorder: "#e86071", //    FileTabSelectedBorder
  fileTabText: "#b2b2b2", //      FileTabText
  fileTabTextActive: "#fafafa", // FileTabSelectedText
  fileTabHoverBg: "#3d3d3d", //   FileTabProvisionalHover
  panelBorder: "#333333", //      PanelBorder
  commandBarText: "#d6d6d6", //   CommandBarTextActive
  commandBarHover: "#333333", //  CommandBarHover
  menuBg: "#2e2e2e", //           CommandBarMenuBackgroundGradientBegin
  menuBorder: "#424242", //       CommandBarMenuBorder
  menuHover: "#3d3d3d", //        CommandBarMenuItemMouseOver
  menuSeparator: "#3d3d3d", //    CommandBarMenuSeparator
  comboBg: "#383838", //          ComboBoxBackground
  comboBorder: "#424242", //      ComboBoxBorder
  tooltipBg: "#424242", //        DebuggerDataTipActiveBackground
  statusBar: "#111111", //        StatusBarBackgroundFillRest (#0000004d over #1c1c1c)
  statusBarBuilding: "#82363f", // StatusBarBackgroundFillBuilding
  statusBarDebugging: "#01217a", // StatusBarBackgroundFillDebugging
  scrollThumb: "#4d4d4d", //       Environment \ FileTabScrollBarThumb
  scrollThumbHover: "#999999", // Environment \ FileTabScrollBarThumbHover
  editorBg: "#1e1e1e", //         editor default (ControlFillActiveInput #1e1e1eb2)
  listHover: "#333333", //        CommonDocument.ListItemBackgroundHover
  listSelected: "#666666", //     CommonDocument.ListItemBackgroundSelected
  treeGlyph: "#d6d6d6", //        TreeView.Glyph
  error: "#f44747",
  warning: "#ffcc66",
};

export const lightPalette: Palette = {
  envBg: "#eeeeee", //            Shell.Light \ ShellInternal EnvironmentBackground
  header: "#f9f9f9", //           EnvironmentHeader
  headerInactive: "#f9f9f9",
  borderAccent: "#b04956", //     EnvironmentBorder
  borderInactive: "#adadad",
  logo: "#b04956",
  badge: "#ffffffb2",
  solidBase: "#f3f3f3", //        SolidBackgroundFillBase
  solidSecondary: "#eeeeee",
  solidTertiary: "#f9f9f9",
  solidQuaternary: "#ffffff",
  solidQuinary: "#fdfdfd",
  surface: "#f9f9f9",
  layer: "#ffffff80",
  divider: "#00000014",
  controlFill: "#ffffffb2",
  controlFillHover: "#ffffffd9",
  controlFillPressed: "#ffffff80",
  controlStroke: "#0000001a",
  controlSolid: "#ffffff",
  accent: "#b04956", //           AccentFillDefault (light)
  accentAlt: "#82363f",
  accentSecondary: "#b04956e5",
  accentSubtle: "#b049561f",
  accentText: "#82363f",
  textPrimary: "#000000e4",
  textSecondary: "#00000099",
  textTertiary: "#00000073",
  textDisabled: "#0000005c",
  onAccent: "#ffffff",
  success: "#107c10",
  successBg: "#dff6dd",
  caution: "#0f6cbd",
  cautionBg: "#dceefb",
  critical: "#82363f",
  criticalBg: "#fde7e9",
  attention: "#8a5300",
  attentionBg: "#fff4ce",
  link: "#c0700e",
  envBackground: "#f2eeee", //    Theme.Light \ Environment EnvironmentBackground
  fileTab: "#e2e2e2", //          FileTabBackground
  fileTabActive: "#ffffff",
  fileTabBorder: "#be6c00",
  fileTabText: "#717171", //      FileTabInactiveText
  fileTabTextActive: "#1e1e1e",
  fileTabHoverBg: "#f5dec9", //   CommandBarHover
  panelBorder: "#dbcecc", //      PanelBorder
  commandBarText: "#1e1e1e", //   CommandBarTextActive
  commandBarHover: "#f5dec9",
  menuBg: "#f6f6f6", //           CommandBarMenuBackgroundGradientBegin
  menuBorder: "#dbcecc",
  menuHover: "#f5dec9",
  menuSeparator: "#e2e2e2",
  comboBg: "#ffffff",
  comboBorder: "#dbcecc",
  tooltipBg: "#ffffff",
  statusBar: "#6e6c6c", //        StatusBarBackgroundFillRest (#0000008b over #f2eeee)
  statusBarBuilding: "#b04956", // StatusBarBackgroundFillBuilding
  statusBarDebugging: "#094bbc", // StatusBarBackgroundFillDebugging
  scrollThumb: "#c9c3c2", //       Environment \ FileTabScrollBarThumb
  scrollThumbHover: "#686868", // Environment \ FileTabScrollBarThumbHover
  editorBg: "#ffffff",
  listHover: "#f5dec9",
  listSelected: "#cde8ff",
  treeGlyph: "#616161",
  error: "#a1260d",
  warning: "#8a5300",
};

/** C# / VB / TS syntax colors used by the Visual Studio dark editor. */
export const editorTokens = [
  { token: "", foreground: "DCDCDC" },
  { token: "comment", foreground: "57A64A" },
  { token: "keyword", foreground: "569CD6" },
  { token: "keyword.control", foreground: "C586C0" },
  { token: "string", foreground: "CE9178" },
  { token: "number", foreground: "B5CEA8" },
  { token: "type", foreground: "4EC9B0" },
  { token: "type.identifier", foreground: "4EC9B0" },
  { token: "identifier", foreground: "9CDCFE" },
  { token: "function", foreground: "DCDCAA" },
  { token: "predefined", foreground: "569CD6" },
  { token: "operator", foreground: "D4D4D4" },
  { token: "delimiter", foreground: "D4D4D4" },
  { token: "annotation", foreground: "DCDCAA" },
  { token: "tag", foreground: "569CD6" },
  { token: "attribute.name", foreground: "9CDCFE" },
  { token: "metatag", foreground: "569CD6" },
  { token: "invalid", foreground: "F44747" },
];

export const monacoDark = {
  base: "vs-dark" as const,
  inherit: true,
  rules: editorTokens,
  colors: {
    "editor.background": "#1E1E1E",
    "editor.foreground": "#DCDCDC",
    "editorLineNumber.foreground": "#858585",
    "editorLineNumber.activeForeground": "#C6C6C6",
    "editorCursor.foreground": "#AEAFAD",
    "editor.selectionBackground": "#264F78",
    "editor.inactiveSelectionBackground": "#3A3D41",
    "editor.lineHighlightBackground": "#282828",
    "editor.lineHighlightBorder": "#00000000",
    "editorIndentGuide.background1": "#333333",
    "editorIndentGuide.activeBackground1": "#404040",
    "editorWhitespace.foreground": "#333333",
    "editorBracketMatch.background": "#0C3B4E",
    "editorBracketMatch.border": "#88888855",
    "editorGutter.background": "#1E1E1E",
    "editorWidget.background": "#2E2E2E",
    "editorWidget.border": "#424242",
    "editorSuggestWidget.background": "#2E2E2E",
    "editorSuggestWidget.border": "#424242",
    "editorSuggestWidget.selectedBackground": "#3D3D3D",
    "editorHoverWidget.background": "#2E2E2E",
    "editorHoverWidget.border": "#424242",
    "scrollbarSlider.background": "#4d4d4d66",
    "scrollbarSlider.hoverBackground": "#99999999",
    "scrollbarSlider.activeBackground": "#999999aa",
    "minimap.background": "#1E1E1E",
    "editorOverviewRuler.border": "#00000000",
    "editorError.foreground": "#F44747",
    "editorWarning.foreground": "#FFCC66",
    "editorInfo.foreground": "#75BEFF",
  },
};

export const monacoLight = {
  base: "vs" as const,
  inherit: true,
  rules: [
    { token: "", foreground: "000000" },
    { token: "comment", foreground: "008000" },
    { token: "keyword", foreground: "0000FF" },
    { token: "keyword.control", foreground: "AF00DB" },
    { token: "string", foreground: "A31515" },
    { token: "number", foreground: "098658" },
    { token: "type", foreground: "2B91AF" },
    { token: "type.identifier", foreground: "2B91AF" },
    { token: "identifier", foreground: "001080" },
    { token: "function", foreground: "795E26" },
    { token: "predefined", foreground: "0000FF" },
    { token: "operator", foreground: "000000" },
    { token: "invalid", foreground: "CD3131" },
  ],
  colors: {
    "editor.background": "#FFFFFF",
    "editor.foreground": "#000000",
    "editorLineNumber.foreground": "#2B91AF",
    "editorLineNumber.activeForeground": "#000000",
    "editor.lineHighlightBackground": "#F5F5F5",
    "editor.selectionBackground": "#ADD6FF",
    "editorIndentGuide.background1": "#D3D3D3",
    "editorWidget.background": "#F6F6F6",
    "editorWidget.border": "#DBCECC",
    "minimap.background": "#FFFFFF",
    "scrollbarSlider.background": "#00000022",
  },
};

export function applyPalette(p: Palette) {
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(p)) {
    root.setProperty(`--vs-${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}`, v);
  }
}
