import { useStore } from "../store";
import { Bell, ChevronDown, ErrorIcon, GitBranch, InfoIcon, WarningIcon } from "./Icons";

export function StatusBar() {
  const st = useStore();
  const doc = st.docs.find((d) => d.path === st.active);
  const errors = st.problems.filter((p) => p.severity === "error").length;
  const warnings = st.problems.filter((p) => p.severity === "warning").length;
  const kindClass =
    st.status.kind === "building" ? " building" : st.status.kind === "debugging" ? " debugging" : "";

  return (
    <footer className={`vs-statusbar${kindClass}`}>
      <div className="vs-status-left">
        <button className="vs-status-item" title="Solution configurations">
          {st.status.kind === "debugging" ? <span className="vs-dot" /> : <ChevronDown size={11} />}
        </button>
        <span className="vs-status-item strong">{st.status.text}</span>
        {st.root && (
          <span className="vs-status-item muted" title={st.root}>
            {st.root.split("\\").pop()}
          </span>
        )}
      </div>
      <div className="vs-status-right">
        <button className="vs-status-item" title="Go to line">
          Ln {st.cursor.line}, Col {st.cursor.column}
          {st.cursor.sel > 0 ? ` (${st.cursor.sel} selected)` : ""}
        </button>
        <button className="vs-status-item" title="Indentation">Spaces: 4</button>
        <button className="vs-status-item" title="Encoding">UTF-8</button>
        <button className="vs-status-item" title="Line endings">CRLF</button>
        <button className="vs-status-item" title="Error list" onClick={() => st.toggleBottom("errors")}>
          <span className="sev-error"><ErrorIcon size={12} /></span> {errors}
          <span className="sev-warn"><WarningIcon size={12} /></span> {warnings}
        </button>
        <button className="vs-status-item" title="Git changes" onClick={() => st.toggleBottom("git")}>
          <GitBranch size={12} />
          <span>{st.git.isRepo ? st.git.branch || "main" : "Add to Source Control"}</span>
        </button>
        <button className="vs-status-item" title="Account settings" onClick={() => st.setDialog("github")}>
          {st.auth ? `@${st.auth.login}` : "Sign in"}
        </button>
        <button className="vs-status-item" title="Notifications">
          <Bell size={13} />
        </button>
        <button className="vs-status-item" title="About" onClick={() => st.setDialog("about")}>
          <InfoIcon size={12} />
        </button>
        {doc && <span className="vs-status-item dim">{doc.language}</span>}
      </div>
    </footer>
  );
}
