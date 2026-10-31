import { useStore } from "../store";
import { Account, Close, Search, Sparkle } from "./Icons";

const actions = [
  {
    label: "Clone a repository",
    hint: "Get code from GitHub, Azure DevOps, or another Git host",
    primary: true,
    dialog: "clone",
  },
  { label: "Open a project or solution", hint: "Open a .sln, .csproj, or any workspace file", dialog: "open-solution" },
  { label: "Open a local folder", hint: "Browse a folder on this machine", open: true, dialog: "open-folder" },
  { label: "Create a new project", hint: "Start from a blank solution or template", dialog: "new-project" },
] as const;

export function StartWindow() {
  const st = useStore();
  const recents = st.recent;

  return (
    <div className="vs-start">
      <div className="vs-start-header">
        <img src="/vs-icon.png" alt="" className="vs-start-logo" />
        <span className="vs-start-product">Visual Studio 2026</span>
        <span className="vs-start-tag">Reconstructed shell · v{st.version}</span>
        <div className="vs-start-header-right">
          <button className="vs-icon-btn" title="Search"><Search size={14} /></button>
          <button
            className="vs-icon-btn vs-start-account"
            title={st.auth ? `Signed in as ${st.auth.name || st.auth.login}` : "Sign in to your Visual Studio account"}
            onClick={() => st.setDialog("github")}
          >
            {st.auth?.avatar ? (
              <img className="vs-avatar small" src={st.auth.avatar} alt="" />
            ) : (
              <span className={`vs-avatar small${st.auth ? "" : " signed-out"}`}>
                {st.auth ? (st.auth.name || st.auth.login).slice(0, 1).toUpperCase() : <Account size={12} />}
              </span>
            )}
          </button>
          <button className="vs-icon-btn" onClick={() => st.setStartVisible(false)} title="Close">
            <Close size={13} />
          </button>
        </div>
      </div>

      <div className="vs-start-body">
        <aside className="vs-start-left">
          {actions.map((a) => (
            <button
              key={a.label}
              className={`vs-start-action${"primary" in a && a.primary ? " primary" : ""}`}
              onClick={() => st.setDialog(a.dialog)}
            >
              <span className="vs-start-action-title">{a.label}</span>
              <span className="vs-start-action-hint">{a.hint}</span>
            </button>
          ))}
          <button className="vs-start-continue" onClick={() => st.setStartVisible(false)}>
            Continue without code <span aria-hidden>→</span>
          </button>
        </aside>

        <main className="vs-start-main">
          <h1>Get started</h1>
          <div className="vs-start-subhead">
            <span>Recent</span>
            <button className="vs-text-btn" onClick={() => st.setDialog("open-folder")}>
              Browse…
            </button>
          </div>
          <div className="vs-start-recents">
            {recents.length === 0 && (
              <div className="vs-start-empty">
                <Sparkle size={16} />
                <div>
                  <strong>No recent workspaces</strong>
                  <p>Open a folder to populate this list. Everything you see is read from your real file system.</p>
                </div>
              </div>
            )}
            {recents.map((r) => (
              <button key={r} className="vs-start-card" onClick={() => void st.openFolder(r)}>
                <span className="vs-start-card-icon">SLN</span>
                <span className="vs-start-card-body">
                  <span className="vs-start-card-title">{r.split("\\").filter(Boolean).pop()}</span>
                  <span className="vs-start-card-path">{r}</span>
                </span>
                <span className="vs-start-card-open">Open</span>
              </button>
            ))}
          </div>

          <div className="vs-start-footer">
            <div className="vs-start-tip">
              <strong>Tip</strong> Press <span className="vs-key">Ctrl+Q</span> to search commands, files, and settings.
            </div>
            <div className="vs-start-version">Visual Studio 18.10.12217.157 shell palette · MIT clone</div>
          </div>
        </main>
      </div>
    </div>
  );
}
