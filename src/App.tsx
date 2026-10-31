import { useEffect } from "react";
import { useStore, useActiveDoc, basename } from "./store";
import { applyPalette, darkPalette, lightPalette } from "./theme";
import { TitleBar } from "./components/TitleBar";
import { Toolbar } from "./components/Toolbar";
import { LeftDock } from "./components/SolutionExplorer";
import { EditorArea } from "./components/EditorPane";
import { BottomPanel } from "./components/BottomPanel";
import { StatusBar } from "./components/StatusBar";
import { CommandPalette } from "./components/CommandPalette";
import { StartWindow } from "./components/StartWindow";
import { Dialogs } from "./components/Dialogs";
import { badgeFor } from "./lib/lang";
import { api } from "./lib/api";

function PropertiesDock() {
  const st = useStore();
  const doc = useActiveDoc();
  const selected = st.selection ?? doc?.path ?? null;
  const b = selected && !doc ? badgeFor(basename(selected), false) : null;
  const size = doc ? `${new TextEncoder().encode(doc.content).length} bytes` : "—";

  return (
    <aside className="vs-dock vs-dock-right">
      <div className="vs-dock-tabs">
        <button className="vs-dock-tab active">Properties</button>
        <div className="vs-dock-tab-actions">
          <button className="vs-icon-btn" onClick={st.toggleRight} title="Close">×</button>
        </div>
      </div>
      <div className="vs-props">
        {!selected && <div className="vs-panel-empty">Select an item to inspect its properties.</div>}
        {selected && (
          <>
            <div className="vs-props-header">
              {doc ? (
                <span className="vs-file-badge" style={{ color: badgeFor(doc.name, false).color }}>
                  {badgeFor(doc.name, false).label.slice(0, 2)}
                </span>
              ) : (
                <span className="vs-file-badge" style={{ color: b?.color }}>{b?.label.slice(0, 2)}</span>
              )}
              <span>{basename(selected)}</span>
            </div>
            <div className="vs-props-section">General</div>
            <div className="vs-props-row"><span>Full path</span><span className="vs-props-value" title={selected}>{selected}</span></div>
            <div className="vs-props-row"><span>Language</span><span className="vs-props-value">{doc?.language ?? "—"}</span></div>
            <div className="vs-props-row"><span>Size</span><span className="vs-props-value">{size}</span></div>
            <div className="vs-props-row"><span>Modified</span><span className="vs-props-value">{doc ? (doc.content !== doc.saved ? "Yes" : "No") : "No"}</span></div>
            {doc && (
              <>
                <div className="vs-props-section">Editor</div>
                <div className="vs-props-row"><span>Line</span><span className="vs-props-value">{st.cursor.line}</span></div>
                <div className="vs-props-row"><span>Column</span><span className="vs-props-value">{st.cursor.column}</span></div>
                <div className="vs-props-row"><span>Selection</span><span className="vs-props-value">{st.cursor.sel} char(s)</span></div>
              </>
            )}
            <div className="vs-props-section">Source Control</div>
            <div className="vs-props-row">
              <span>Status</span>
              <span className="vs-props-value">
                {st.git.files.find((f) => selected.endsWith(f.path.replace(/\//g, "\\")))?.status ?? "Unmodified"}
              </span>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export default function App() {
  const st = useStore();
  const theme = useStore((s) => s.theme);
  const startVisible = useStore((s) => s.startVisible);

  useEffect(() => {
    void (async () => {
      await useStore.getState().init();
      try {
        const p = await api.prereq();
        if (!p.dotnet.found || !p.git.found) useStore.getState().setDialog("prereq");
      } catch {
        /* server offline */
      }
    })();
  }, []);

  useEffect(() => {
    applyPalette(theme === "dark" ? darkPalette : lightPalette);
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState();
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (ctrl && e.shiftKey && key === "p") { e.preventDefault(); s.setPalette(true); return; }
      if (ctrl && key === "q") { e.preventDefault(); s.setPalette(true); return; }
      if (ctrl && key === "s") { e.preventDefault(); e.shiftKey ? void s.saveAll() : void s.save(); return; }
      if (ctrl && e.shiftKey && key === "o") { e.preventDefault(); s.setDialog("open-solution"); return; }
      if (ctrl && e.shiftKey && key === "n") { e.preventDefault(); s.setDialog("new-project"); return; }
      if (ctrl && key === "o") { e.preventDefault(); s.setDialog("open-solution"); return; }
      if (ctrl && key === "n" && !e.shiftKey) { e.preventDefault(); s.setDialog("new-file"); return; }
      if (ctrl && key === "w") { e.preventDefault(); if (s.active) s.closeDoc(s.active); return; }
      if (ctrl && key === "`") { e.preventDefault(); s.toggleBottom("terminal"); return; }
      if (ctrl && e.shiftKey && key === "b") { e.preventDefault(); void s.build(); return; }
      if (ctrl && e.shiftKey && key === "f") { e.preventDefault(); s.setLeftTab("search"); return; }
      if (ctrl && key === "g") { e.preventDefault(); s.setDialog("go-to-line"); return; }
      if (key === "f5") { e.preventDefault(); void s.run(); return; }
      if (key === "f4") { e.preventDefault(); s.toggleRight(); return; }
      if (key === "escape") { s.setPalette(false); if (s.dialog) s.setDialog(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (startVisible) {
    return (
      <>
        <StartWindow />
        <Dialogs />
        <CommandPalette />
      </>
    );
  }

  return (
    <div className={`vs-app theme-${theme}`}>
      <TitleBar />
      <Toolbar />
      <div className="vs-body">
        {st.leftOpen && <LeftDock />}
        <div className="vs-center">
          <EditorArea />
          {st.bottomOpen && <BottomPanel />}
        </div>
        {st.rightOpen && <PropertiesDock />}
      </div>
      <StatusBar />
      <CommandPalette />
      <Dialogs />
    </div>
  );
}
