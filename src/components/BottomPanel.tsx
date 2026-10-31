import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { basename } from "../lib/api";
import { terminalShellName } from "../lib/platform";
import { Close, ErrorIcon, GitBranch, InfoIcon, Send, WarningIcon } from "./Icons";
import type { ErrorItem } from "../lib/api";

function severityIcon(s: ErrorItem["severity"]) {
  if (s === "error") return <span className="sev-error"><ErrorIcon size={13} /></span>;
  if (s === "warning") return <span className="sev-warn"><WarningIcon size={13} /></span>;
  return <span className="sev-info"><InfoIcon size={13} /></span>;
}

function ErrorList() {
  const st = useStore();
  const errors = st.problems;
  return (
    <div className="vs-errorlist">
      <div className="vs-table-head">
        <span className="col-sev" />
        <span className="col-code">Code</span>
        <span className="col-desc">Description</span>
        <span className="col-project">Project</span>
        <span className="col-file">File</span>
        <span className="col-line">Line</span>
      </div>
      <div className="vs-table-body">
        {errors.length === 0 && (
          <div className="vs-panel-empty">
            {st.status.kind === "building" ? "Build in progress…" : "No issues found. Build the solution to populate the error list."}
          </div>
        )}
        {errors.map((e, i) => (
          <div
            key={i}
            className="vs-table-row"
            onClick={() => {
              if (e.file) {
                void st.openFile(e.file, false);
                st.revealAt(e.file, e.line || 1);
              }
            }}
          >
            <span className="col-sev">{severityIcon(e.severity)}</span>
            <span className="col-code">{e.code}</span>
            <span className="col-desc">{e.message}</span>
            <span className="col-project">{e.project ?? basename(st.root ?? "")}</span>
            <span className="col-file">{basename(e.file)}</span>
            <span className="col-line">{e.line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Output() {
  const st = useStore();
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [st.output]);
  return (
    <pre className="vs-output" ref={ref}>
      {st.output || "Ready.\n"}
    </pre>
  );
}

function Terminal() {
  const st = useStore();
  const [input, setInput] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const history = useRef<string[]>([]);
  const [hIndex, setHIndex] = useState(-1);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [st.terminal.length, st.terminalBusy]);

  const submit = () => {
    const cmd = input.trim();
    if (!cmd || st.terminalBusy) return;
    history.current = [cmd, ...history.current];
    setHIndex(-1);
    setInput("");
    void st.runTerminal(cmd);
  };

  return (
    <div className="vs-terminal">
      <div className="vs-terminal-body" ref={ref}>
        {st.terminal.map((l, i) => (
          <div key={i} className={`vs-term-line ${l.kind}`}>{l.text}</div>
        ))}
        {st.terminalBusy && <div className="vs-term-line info">…</div>}
      </div>
      <div className="vs-terminal-input">
        <span className="vs-terminal-prompt">
          {terminalShellName()} {st.terminalCwd || st.root || ""}&gt;
        </span>
        <input
          value={input}
          spellCheck={false}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "ArrowUp") {
              e.preventDefault();
              const next = Math.min(hIndex + 1, history.current.length - 1);
              setHIndex(next);
              setInput(history.current[next] ?? "");
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              const next = Math.max(hIndex - 1, -1);
              setHIndex(next);
              setInput(next === -1 ? "" : history.current[next]);
            }
          }}
          placeholder={st.root ? "Type a command and press Enter" : "Open a folder to run commands here"}
        />
        <button className="vs-icon-btn" onClick={submit} title="Run">
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

function GitChanges() {
  const st = useStore();
  const [message, setMessage] = useState("");
  if (!st.git.isRepo) {
    return (
      <div className="vs-panel-empty">
        This folder is not a Git repository. <br />
        <button className="vs-btn primary" style={{ marginTop: 8 }} disabled={!st.root} onClick={() => void st.initGit()}>
          Create Git Repository
        </button>
      </div>
    );
  }
  return (
    <div className="vs-gitpane">
      <div className="vs-git-branch">
        <GitBranch size={13} /> {st.git.branch}
        <span className="vs-muted">{st.git.files.length} change(s)</span>
      </div>
      <div className="vs-commit-box">
        <textarea
          value={message}
          placeholder="Commit message (stages all changes)"
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
        />
        <div className="vs-commit-actions">
          <button
            className="vs-btn primary"
            disabled={!message.trim()}
            onClick={() => {
              void st.commit(message.trim());
              setMessage("");
            }}
          >
            Commit All
          </button>
          <button className="vs-btn" onClick={() => void st.push()}>Push</button>
        </div>
      </div>
      {st.git.files.length === 0 && <div className="vs-panel-empty">Working tree clean.</div>}
      {st.git.files.map((f) => (
        <div key={f.path} className="vs-git-file">
          <span className="vs-git-status">{f.status.trim() || "M"}</span>
          <span>{f.path}</span>
        </div>
      ))}
    </div>
  );
}

const tabs = [
  { id: "errors", label: "Error List" },
  { id: "output", label: "Output" },
  { id: "terminal", label: "Terminal" },
  { id: "git", label: "Git Changes" },
] as const;

export function BottomPanel() {
  const st = useStore();
  const errorCount = st.problems.filter((p) => p.severity === "error").length;
  const warnCount = st.problems.filter((p) => p.severity === "warning").length;

  return (
    <section className="vs-bottom">
      <div className="vs-bottom-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`vs-bottom-tab${st.bottomTab === t.id ? " active" : ""}`}
            onClick={() => st.setBottomTab(t.id)}
          >
            {t.label}
            {t.id === "errors" && errorCount > 0 && <span className="vs-badge error">{errorCount}</span>}
            {t.id === "errors" && warnCount > 0 && <span className="vs-badge warn">{warnCount}</span>}
            {t.id === "git" && st.git.isRepo && st.git.files.length > 0 && (
              <span className="vs-badge">{st.git.files.length}</span>
            )}
          </button>
        ))}
        <div className="vs-bottom-actions">
          {st.bottomTab === "output" && (
            <button className="vs-text-btn" onClick={st.clearOutput}>Clear</button>
          )}
          <button className="vs-icon-btn" title="Close" onClick={() => st.toggleBottom()}>
            <Close size={11} />
          </button>
        </div>
      </div>
      <div className="vs-bottom-body">
        {st.bottomTab === "errors" && <ErrorList />}
        {st.bottomTab === "output" && <Output />}
        {st.bottomTab === "terminal" && <Terminal />}
        {st.bottomTab === "git" && <GitChanges />}
      </div>
    </section>
  );
}
