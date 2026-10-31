import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store";
import { useMenus, type MenuItem } from "./MenuBar";
import { badgeFor } from "../lib/lang";
import { ChevronRight } from "./Icons";

type Command = { label: string; group: string; shortcut?: string; run: () => void };
type FileItem = { label: string; path: string };

function flatten(items: MenuItem[], group: string): Command[] {
  const out: Command[] = [];
  for (const it of items) {
    if (it.kind === "separator") continue;
    const item = it as Extract<MenuItem, { label: string }>;
    if (item.submenu) {
      for (const sub of item.submenu) {
        if (sub.kind === "separator") continue;
        const s = sub as Extract<MenuItem, { label: string }>;
        if (s.submenu) {
          out.push(...flatten([s], `${group}: ${item.label}`));
        } else if (s.action && !s.disabled) {
          out.push({ label: `${item.label}: ${s.label}`, group: `${group}: ${item.label}`, shortcut: s.shortcut, run: s.action });
        }
      }
      continue;
    }
    if (item.action && !item.disabled) {
      out.push({ label: item.label, group, shortcut: item.shortcut, run: item.action });
    }
  }
  return out;
}

export function CommandPalette() {
  const st = useStore();
  const menus = useMenus();
  const [q, setQ] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo(() => {
    const all: Command[] = [];
    for (const m of menus) all.push(...flatten(m.items, m.label));
    all.push(
      { label: "View: Toggle Theme", group: "View", run: () => st.setTheme(st.theme === "dark" ? "light" : "dark") },
      { label: "Build: Build Solution", group: "Build", shortcut: "Ctrl+Shift+B", run: () => void st.build() },
      { label: "View: Start Without Debugging", group: "Debug", run: () => st.setStatus("Ready") },
    );
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.theme]);

  const files = useMemo<FileItem[]>(() => {
    const out: FileItem[] = [];
    for (const [, entries] of Object.entries(st.tree)) {
      for (const e of entries) if (!e.dir) out.push({ label: e.name, path: e.path });
    }
    return out;
  }, [st.tree]);

  const lower = q.toLowerCase();

  const matchedCommands = useMemo(
    () =>
      commands
        .filter((c) => !lower || c.label.toLowerCase().includes(lower) || c.group.toLowerCase().includes(lower))
        .slice(0, 40),
    [commands, lower],
  );

  const matchedFiles = useMemo(
    () =>
      lower
        ? files.filter((f) => f.path.toLowerCase().includes(lower)).slice(0, 30)
        : files.slice(0, 12),
    [files, lower],
  );

  const rows = [
    ...matchedCommands.map((c) => ({ type: "cmd" as const, c })),
    ...matchedFiles.map((f) => ({ type: "file" as const, f })),
  ];

  useEffect(() => {
    if (st.paletteOpen) {
      setQ("");
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [st.paletteOpen]);

  useEffect(() => setIndex(0), [q]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${index}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [index]);

  if (!st.paletteOpen) return null;

  const run = (row: (typeof rows)[number]) => {
    st.setPalette(false);
    if (row.type === "cmd") row.c.run();
    else {
      void st.openFile(row.f.path, false);
      st.revealAt(row.f.path, 1);
    }
  };

  return (
    <div className="vs-overlay" onMouseDown={() => st.setPalette(false)}>
      <div className="vs-palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="vs-palette-input">
          <input
            ref={inputRef}
            value={q}
            placeholder="Search Visual Studio"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") st.setPalette(false);
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(i + 1, rows.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(i - 1, 0));
              }
              if (e.key === "Enter" && rows[index]) {
                e.preventDefault();
                run(rows[index]);
              }
            }}
          />
          <span className="vs-palette-hint">Esc to dismiss</span>
        </div>
        <div className="vs-palette-list" ref={listRef}>
          {matchedCommands.length > 0 && <div className="vs-palette-group">Commands</div>}
          {matchedCommands.map((c, i) => (
            <div
              key={"c" + i}
              data-row={i}
              className={`vs-palette-row${index === i ? " active" : ""}`}
              onMouseEnter={() => setIndex(i)}
              onClick={() => run({ type: "cmd", c })}
            >
              <span className="vs-palette-text">{c.label}</span>
              <span className="vs-palette-group-label">{c.group}</span>
              {c.shortcut && <span className="vs-palette-shortcut">{c.shortcut}</span>}
            </div>
          ))}
          {matchedFiles.length > 0 && (
            <div className="vs-palette-group">
              {lower ? "Files" : "Recently opened files"}
              <span className="vs-palette-note">Enter to open</span>
            </div>
          )}
          {matchedFiles.map((f, i) => {
            const rowIndex = matchedCommands.length + i;
            const b = badgeFor(f.label, false);
            return (
              <div
                key={"f" + f.path}
                data-row={rowIndex}
                className={`vs-palette-row${index === rowIndex ? " active" : ""}`}
                onMouseEnter={() => setIndex(rowIndex)}
                onClick={() => run({ type: "file", f })}
              >
                <span className="vs-file-badge" style={{ color: b.color }}>{b.label.slice(0, 2)}</span>
                <span className="vs-palette-text">{f.label}</span>
                <span className="vs-palette-path">
                  {st.root && f.path.startsWith(st.root) ? f.path.slice(st.root.length + 1) : f.path}
                </span>
                <ChevronRight size={11} />
              </div>
            );
          })}
          {!rows.length && <div className="vs-palette-empty">No results for “{q}”</div>}
        </div>
      </div>
    </div>
  );
}
