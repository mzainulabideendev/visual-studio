import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "./Icons";
import { useStore } from "../store";
import { editorBus } from "../lib/editorBus";

export type MenuItem =
  | { kind: "separator" }
  | {
      kind?: "item";
      label: string;
      shortcut?: string;
      action?: () => void;
      disabled?: boolean;
      checked?: boolean;
      submenu?: MenuItem[];
    };

export const sep: MenuItem = { kind: "separator" };

export function useMenus(): { label: string; items: MenuItem[] }[] {
  const st = useStore();
  const hasRoot = !!st.root;
  const hasDoc = !!st.active;
  const theme = st.theme;

  const themeItems: MenuItem[] = [
    { label: "Dark", checked: theme === "dark", action: () => st.setTheme("dark") },
    { label: "Light", checked: theme === "light", action: () => st.setTheme("light") },
  ];

  return [
    {
      label: "File",
      items: [
        {
          label: "New",
          submenu: [
            { label: "Project…", shortcut: "Ctrl+Shift+N", action: () => st.setDialog("new-project") },
            { label: "File…", shortcut: "Ctrl+N", action: () => st.setDialog("new-file") },
            { label: "PowerShell Script", action: () => st.setDialog("new-file") },
          ],
        },
        {
          label: "Open",
          submenu: [
            { label: "Project/Solution…", shortcut: "Ctrl+Shift+O", action: () => st.setDialog("open-solution") },
            { label: "Folder…", shortcut: "Ctrl+Shift+Alt+O", action: () => st.setDialog("open-folder") },
            { label: "File…", shortcut: "Ctrl+O", action: () => st.setDialog("open-solution") },
          ],
        },
        {
          label: "Clone Repository…",
          action: () => st.setDialog("clone"),
        },
        {
          label: "Open Recent",
          submenu: st.recent.length
            ? [
                ...st.recent.map((r) => ({ label: r, action: () => void st.openFolder(r) })),
                sep,
                { label: "Clear list", action: () => localStorage.removeItem("vsclone.recent") },
              ]
            : [{ label: "(empty)", disabled: true }],
        },
        sep,
        { label: "Account Settings…", action: () => st.setDialog("github") },
        sep,
        { label: "Close Solution", disabled: !hasRoot, action: () => st.setStartVisible(true) },
        sep,
        { label: "Save", shortcut: "Ctrl+S", disabled: !hasDoc, action: () => void st.save() },
        { label: "Save As…", disabled: !hasDoc, action: () => st.setDialog("save-as") },
        { label: "Save All", shortcut: "Ctrl+Shift+S", disabled: !st.docs.length, action: () => void st.saveAll() },
        sep,
        { label: "Print…", shortcut: "Ctrl+P", disabled: true },
        sep,
        { label: "Exit", shortcut: "Alt+F4", action: () => window.close() },
      ],
    },
    {
      label: "Edit",
      items: [
        { label: "Undo", shortcut: "Ctrl+Z", disabled: !hasDoc, action: () => editorBus.undo() },
        { label: "Redo", shortcut: "Ctrl+Y", disabled: !hasDoc, action: () => editorBus.redo() },
        sep,
        { label: "Cut", shortcut: "Ctrl+X", disabled: !hasDoc, action: () => editorBus.cut() },
        { label: "Copy", shortcut: "Ctrl+C", disabled: !hasDoc, action: () => editorBus.copy() },
        { label: "Paste", shortcut: "Ctrl+V", disabled: !hasDoc, action: () => editorBus.paste() },
        { label: "Delete", shortcut: "Del", disabled: !hasDoc, action: () => editorBus.delete() },
        sep,
        { label: "Select All", shortcut: "Ctrl+A", disabled: !hasDoc, action: () => editorBus.selectAll() },
        sep,
        {
          label: "Find and Replace",
          submenu: [
            { label: "Quick Find", shortcut: "Ctrl+F", disabled: !hasDoc, action: () => editorBus.find() },
            { label: "Quick Replace", shortcut: "Ctrl+H", disabled: !hasDoc, action: () => editorBus.replace() },
            { label: "Find in Files", shortcut: "Ctrl+Shift+F", action: () => st.setLeftTab("search") },
          ],
        },
        {
          label: "Advanced",
          submenu: [
            { label: "Format Document", shortcut: "Shift+Alt+F", disabled: !hasDoc, action: () => editorBus.format() },
            { label: "Comment Selection", shortcut: "Ctrl+K, Ctrl+C", disabled: !hasDoc, action: () => editorBus.comment() },
            { label: "Increase Line Indent", disabled: !hasDoc, action: () => editorBus.indent() },
            { label: "Decrease Line Indent", disabled: !hasDoc, action: () => editorBus.outdent() },
          ],
        },
        {
          label: "Go To",
          submenu: [
            { label: "Go To Line…", shortcut: "Ctrl+G", action: () => st.setDialog("go-to-line") },
            { label: "Go To All…", shortcut: "Ctrl+,", action: () => st.setPalette(true) },
          ],
        },
      ],
    },
    {
      label: "View",
      items: [
        { label: "Solution Explorer", shortcut: "Ctrl+Alt+L", checked: st.leftOpen && st.leftTab === "solution", action: () => st.setLeftTab("solution") },
        { label: "Git Changes", shortcut: "Ctrl+0", checked: st.git.isRepo, action: () => st.toggleBottom("git") },
        { label: "Test Explorer", checked: false, disabled: true },
        { label: "Terminal", shortcut: "Ctrl+`", checked: st.bottomOpen && st.bottomTab === "terminal", action: () => st.toggleBottom("terminal") },
        sep,
        { label: "Error List", checked: st.bottomOpen && st.bottomTab === "errors", action: () => st.toggleBottom("errors") },
        { label: "Output", checked: st.bottomOpen && st.bottomTab === "output", action: () => st.toggleBottom("output") },
        { label: "Properties Window", shortcut: "F4", checked: st.rightOpen, action: () => st.toggleRight() },
        sep,
        { label: "Command Palette…", shortcut: "Ctrl+Shift+P", action: () => st.setPalette(true) },
        { label: "Copilot Chat", action: () => st.setDialog("copilot") },
        sep,
        { label: "Zoom In", shortcut: "Ctrl+=", action: () => editorBus.zoom(1) },
        { label: "Zoom Out", shortcut: "Ctrl+-", action: () => editorBus.zoom(-1) },
        { label: "Reset Zoom", action: () => editorBus.zoom(0) },
        sep,
        { label: "Full Screen", shortcut: "Shift+Alt+Enter", action: () => document.documentElement.requestFullscreen?.() },
        sep,
        {
          label: "Theme",
          submenu: themeItems,
        },
      ],
    },
    {
      label: "Git",
      items: [
        { label: "Clone Repository…", disabled: true },
        { label: "Create Git Repository…", disabled: !hasRoot, action: () => void st.initGit() },
        sep,
        { label: "Commit or Stash…", disabled: !hasRoot, action: () => st.toggleBottom("git") },
        { label: "Push", disabled: !st.git.isRepo, action: () => void st.push() },
        { label: "Pull", disabled: true },
        { label: "Fetch", disabled: true },
        sep,
        {
          label: st.auth ? `Signed in as ${st.auth.login}` : "Sign in to your account…",
          action: () => st.setDialog("github"),
        },
        { label: "Account Settings…", action: () => st.setDialog("github") },
        { label: "Sign Out", disabled: !st.auth, action: () => st.signOut() },
        sep,
        { label: "Manage Branches", disabled: true },
        { label: "Settings", disabled: true },
      ],
    },
    {
      label: "Project",
      items: [
        { label: "Add New Item…", shortcut: "Ctrl+Shift+A", disabled: !hasRoot, action: () => st.setDialog("new-file") },
        { label: "Add Existing Item…", shortcut: "Shift+Alt+A", disabled: true },
        { label: "Add", submenu: [{ label: "New Folder", disabled: !hasRoot, action: () => st.setDialog("new-file") }] },
        sep,
        { label: "Manage NuGet Packages…", disabled: !hasRoot, action: () => st.setDialog("nuget") },
        { label: "Project Dependencies…", disabled: true },
        { label: "Add Project Reference…", disabled: !hasRoot, action: () => st.setDialog("add-reference") },
        sep,
        { label: "Properties…", shortcut: "Alt+Enter", action: () => st.toggleRight() },
      ],
    },
    {
      label: "Build",
      items: [
        { label: "Build Solution", shortcut: "Ctrl+Shift+B", disabled: !hasRoot, action: () => void st.build() },
        { label: "Rebuild Solution", disabled: !hasRoot, action: () => void st.build(true) },
        { label: "Clean Solution", disabled: !hasRoot, action: () => void st.clean() },
        sep,
        { label: "Cancel", disabled: st.status.kind !== "building" },
        { label: "Publish Selection…", disabled: true },
      ],
    },
    {
      label: "Debug",
      items: [
        { label: "Start Debugging", shortcut: "F5", disabled: !hasRoot, action: () => void st.run() },
        { label: "Start Without Debugging", shortcut: "Ctrl+F5", disabled: !hasRoot, action: () => void st.run() },
        sep,
        { label: "Attach to Process…", disabled: true },
        { label: "Break All", shortcut: "Ctrl+Alt+Break", disabled: true },
        sep,
        { label: "Step Into", shortcut: "F11", disabled: true },
        { label: "Step Over", shortcut: "F10", disabled: true },
        { label: "Step Out", shortcut: "Shift+F11", disabled: true },
        sep,
        { label: "Windows", submenu: [{ label: "Immediate", disabled: true }, { label: "Locals", disabled: true }] },
      ],
    },
    {
      label: "Test",
      items: [
        { label: "Test Explorer", action: () => st.toggleBottom("output") },
        { label: "Run All Tests", shortcut: "Ctrl+R, A", disabled: !hasRoot, action: () => void st.runTests() },
        { label: "Debug All Tests", disabled: true },
        sep,
        { label: "Configure Run Settings", disabled: true },
        { label: "Choose Test Explorer Settings", disabled: true },
      ],
    },
    {
      label: "Tools",
      items: [
        { label: "Command Prompt", action: () => st.toggleBottom("terminal") },
        { label: "PowerShell", action: () => st.toggleBottom("terminal") },
        sep,
        { label: "Manage NuGet Packages…", action: () => st.setDialog("nuget") },
        { label: "GitHub Sign In…", action: () => st.setDialog("github") },
        { label: "Copilot Chat", action: () => st.setDialog("copilot") },
        {
          label: "Create GUID",
          action: () => {
            const guid = crypto.randomUUID().toUpperCase();
            void navigator.clipboard?.writeText(guid).catch(() => undefined);
            st.setStatus(`GUID ${guid} copied`, "rest");
            st.appendOutput(`\nGUID: ${guid}\n`);
          },
        },
        { label: "Check Required Components…", action: () => st.setDialog("prereq") },
        { label: "ILDasm", disabled: true },
        sep,
        { label: "Theme", submenu: themeItems },
        { label: "Options…", action: () => st.setDialog("about") },
      ],
    },
    {
      label: "Extensions",
      items: [
        { label: "Manage Extensions…", action: () => st.setDialog("extensions") },
        { label: "Browse Marketplace…", action: () => window.open("https://marketplace.visualstudio.com/vs", "_blank") },
        { label: "Installed Extensions", action: () => st.setDialog("extensions") },
        sep,
        { label: "Extension Manager…", action: () => st.setDialog("extensions") },
        { label: "Extension Settings", disabled: true },
      ],
    },
    {
      label: "Window",
      items: [
        { label: "New Window", action: () => window.open(location.href, "_blank") },
        { label: "Close Document", shortcut: "Ctrl+W", disabled: !hasDoc, action: () => st.active && st.closeDoc(st.active) },
        { label: "Close All Documents", disabled: !st.docs.length, action: () => st.docs.forEach((d) => st.closeDoc(d.path, true)) },
        sep,
        { label: "Reset Window Layout", action: () => { st.toggleLeft(); st.toggleLeft(); } },
        { label: "Start Window", action: () => st.setStartVisible(true) },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "About Microsoft Visual Studio", action: () => st.setDialog("about") },
        { label: "Documentation", action: () => window.open("https://learn.microsoft.com/visualstudio/", "_blank") },
        { label: "Keyboard Shortcuts", action: () => st.setPalette(true) },
        { label: "Send Feedback", action: () => window.open("https://developercommunity.visualstudio.com/", "_blank") },
      ],
    },
  ];
}

export function MenuBar({ compact = false }: { compact?: boolean }) {
  const menus = useMenus();
  const [open, setOpen] = useState<number | null>(null);
  const [sub, setSub] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open === null) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(null);
        setSub(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const render = (items: MenuItem[], path: string) => (
    <div className="vs-menu-popup" role="menu">
      {items.map((it, i) => {
        if (it.kind === "separator") return <div key={path + i} className="vs-menu-sep" />;
        const item = it as Extract<MenuItem, { label: string }>;
        const isOpen = sub === i;
        return (
          <div
            key={path + i + item.label}
            className={`vs-menu-item${item.disabled ? " disabled" : ""}${isOpen ? " open" : ""}`}
            onMouseEnter={() => setSub(item.submenu ? i : null)}
            onClick={(e) => {
              if (item.disabled) return;
              if (item.submenu) {
                e.stopPropagation();
                setSub(isOpen ? null : i);
                return;
              }
              item.action?.();
              setOpen(null);
              setSub(null);
            }}
          >
            <span className="vs-menu-check">{item.checked ? "✓" : ""}</span>
            <span className="vs-menu-label">{item.label}</span>
            {item.shortcut && <span className="vs-menu-shortcut">{item.shortcut}</span>}
            {item.submenu && <span className="vs-menu-arrow"><ChevronRight size={12} /></span>}
            {item.submenu && isOpen && (
              <div className="vs-submenu">{render(item.submenu, path + i + "/")}</div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={`vs-menubar${compact ? " compact" : ""}`} ref={ref}>
      {menus.map((m, i) => (
        <div
          key={m.label}
          className={`vs-menu-title${open === i ? " active" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            setOpen(i);
            setSub(null);
          }}
          onMouseEnter={() => {
            if (open !== null && open !== i) {
              setOpen(i);
              setSub(null);
            }
          }}
        >
          {m.label}
          {open === i && render(m.items, m.label)}
        </div>
      ))}
    </div>
  );
}
