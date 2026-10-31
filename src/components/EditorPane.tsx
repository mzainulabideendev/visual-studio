import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { editorBus } from "../lib/editorBus";
import { useStore, useActiveDoc, type Doc } from "../store";
import { badgeFor } from "../lib/lang";
import { ChevronRight, Close } from "./Icons";

type EditorType = import("monaco-editor").editor.IStandaloneCodeEditor;

function Tab({ doc, active }: { doc: Doc; active: boolean }) {
  const st = useStore();
  const dirty = doc.content !== doc.saved;
  const b = badgeFor(doc.name, false);
  return (
    <div
      className={`vs-tab${active ? " active" : ""}${doc.preview ? " preview" : ""}`}
      onClick={() => st.setActive(doc.path)}
      onMouseDown={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          st.closeDoc(doc.path);
        }
      }}
      title={doc.path}
    >
      <span className="vs-file-badge" style={{ color: b.color }}>{b.label.slice(0, 2)}</span>
      <span className="vs-tab-name">{doc.name}{dirty ? "*" : ""}</span>
      <button
        className="vs-tab-close"
        onClick={(e) => {
          e.stopPropagation();
          st.closeDoc(doc.path);
        }}
      >
        <Close size={10} />
      </button>
    </div>
  );
}

function Breadcrumbs({ doc }: { doc: Doc }) {
  const st = useStore();
  const root = st.root ?? "";
  const rel = doc.path.startsWith(root) ? doc.path.slice(root.length).replace(/^[\\/]/, "") : doc.path;
  const parts = rel.split(/[\\/]/);
  return (
    <div className="vs-breadcrumbs">
      {parts.map((p, i) => (
        <span key={i} className="vs-crumb">
          {i > 0 && <span className="vs-crumb-sep"><ChevronRight size={10} /></span>}
          <span className={i === parts.length - 1 ? "vs-crumb-current" : ""}>{p}</span>
        </span>
      ))}
    </div>
  );
}

export function EditorArea() {
  const st = useStore();
  const doc = useActiveDoc();
  const editorRef = useRef<EditorType | null>(null);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || !st.reveal) return;
    if (st.reveal.path !== st.active) return;
    ed.setPosition({ lineNumber: st.reveal.line, column: 1 });
    ed.revealLineInCenter(st.reveal.line);
    ed.focus();
    useStore.setState({ reveal: null });
  }, [st.reveal, st.active]);

  return (
    <section className="vs-editor-area">
      <div className="vs-tabstrip">
        <div className="vs-tabs">
          {st.docs.map((d) => (
            <Tab key={d.path} doc={d} active={d.path === st.active} />
          ))}
        </div>
        <div className="vs-tabstrip-actions">
          <button
            className="vs-icon-btn"
            title="Close all documents"
            disabled={!st.docs.length}
            onClick={() => st.docs.forEach((d) => st.closeDoc(d.path, true))}
          >
            <Close size={11} />
          </button>
        </div>
      </div>

      {doc ? (
        <>
          <div className="vs-editor-breadcrumb-bar">
            <Breadcrumbs doc={doc} />
            <span className="vs-editor-dirty">{doc.content !== doc.saved ? "modified" : ""}</span>
          </div>
          <div className="vs-editor-host">
            <Editor
              key={doc.path}
              path={doc.path}
              language={doc.language}
              value={doc.content}
              theme={st.theme === "dark" ? "vs-dark-2026" : "vs-light-2026"}
              onChange={(v) => st.setContent(doc.path, v ?? "")}
              onMount={(editor, monaco) => {
                editorRef.current = editor;
                editorBus.set(editor);
                editor.onDidChangeCursorSelection((e) => {
                  st.setCursor({
                    line: e.selection.positionLineNumber,
                    column: e.selection.positionColumn,
                    sel: e.selection.selectionStartLineNumber === e.selection.positionLineNumber
                      ? Math.abs(e.selection.positionColumn - e.selection.selectionStartColumn)
                      : 0,
                  });
                });
                editor.focus();
              }}
              options={{
                fontFamily: '"Cascadia Mono", "Cascadia Code", Consolas, "Courier New", monospace',
                fontSize: 13.5,
                lineHeight: 21,
                fontLigatures: true,
                glyphMargin: true,
                folding: true,
                renderWhitespace: "selection",
                cursorBlinking: "solid",
                cursorSmoothCaretAnimation: "off",
                smoothScrolling: true,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                roundedSelection: false,
                padding: { top: 8 },
                minimap: { enabled: false },
                scrollbar: {
                  verticalScrollbarSize: 14,
                  horizontalScrollbarSize: 14,
                  useShadows: false,
                  verticalSliderSize: 10,
                },
                overviewRulerBorder: false,
                stickyScroll: { enabled: false },
                bracketPairColorization: { enabled: false },
                guides: { indentation: true, bracketPairs: false },
                renderLineHighlight: "line",
              }}
            />
          </div>
        </>
      ) : (
        <div className="vs-empty-editor">
          <div className="vs-empty-title">{st.root ? "No open documents" : "Visual Studio"}</div>
          <div className="vs-empty-lines">
            <div><span className="vs-key">Ctrl+O</span> open a folder</div>
            <div><span className="vs-key">Ctrl+Q</span> search commands and files</div>
            <div><span className="vs-key">Ctrl+Shift+B</span> build the solution</div>
            <div><span className="vs-key">Ctrl+`</span> open the terminal</div>
          </div>
        </div>
      )}
    </section>
  );
}
