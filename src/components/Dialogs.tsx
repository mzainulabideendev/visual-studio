import { useEffect, useState } from "react";
import { useStore } from "../store";
import { api, join, type Entry } from "../lib/api";
import { ChevronUp, Folder } from "./Icons";

function Frame({
  title,
  children,
  footer,
  onClose,
  width = 640,
}: {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onClose: () => void;
  width?: number;
}) {
  return (
    <div className="vs-modal-backdrop" onMouseDown={onClose}>
      <div className="vs-modal" style={{ width }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="vs-modal-title">
          {title}
          <span className="vs-modal-close" onClick={onClose}>×</span>
        </div>
        <div className="vs-modal-body">{children}</div>
        <div className="vs-modal-footer">{footer}</div>
      </div>
    </div>
  );
}

function OpenFolder({ onClose }: { onClose: () => void }) {
  const st = useStore();
  const [path, setPath] = useState(st.root ?? st.terminalCwd ?? "");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [drives, setDrives] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void api.info().then((i) => setDrives(i.drives)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!path) return;
    api
      .list(path)
      .then((r) => {
        setEntries(r.entries.filter((e) => e.dir));
        setError("");
      })
      .catch(() => {
        setEntries([]);
        setError("This path does not exist or cannot be read.");
      });
  }, [path]);

  const parent = () => {
    const clean = path.replace(/[\\/]+$/, "");
    const idx = Math.max(clean.lastIndexOf("\\"), clean.lastIndexOf("/"));
    if (idx > 2) setPath(clean.slice(0, idx));
    else if (/^[a-zA-Z]:/.test(clean)) setPath(clean.slice(0, 2) + "\\");
  };

  return (
    <Frame
      title="Open Folder"
      onClose={onClose}
      footer={
        <>
          <span className="vs-muted">The folder becomes the workspace root.</span>
          <div className="vs-modal-buttons">
            <button className="vs-btn" onClick={onClose}>Cancel</button>
            <button
              className="vs-btn primary"
              onClick={() => {
                onClose();
                void st.openFolder(path);
              }}
            >
              Select Folder
            </button>
          </div>
        </>
      }
    >
      <div className="vs-field">
        <label>Folder</label>
        <input
          autoFocus
          value={path}
          onChange={(e) => setPath(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void st.openFolder(path)}
          spellCheck={false}
        />
      </div>
      <div className="vs-browser">
        <div className="vs-browser-head">
          <button className="vs-icon-btn" onClick={parent} title="Up one level"><ChevronUp size={13} /></button>
          <div className="vs-browser-drives">
            {drives.map((d) => (
              <button key={d} className="vs-chip" onClick={() => setPath(d)}>{d}</button>
            ))}
          </div>
        </div>
        <div className="vs-browser-list">
          {error && <div className="vs-browser-error">{error}</div>}
          {entries.map((e) => (
            <div
              key={e.path}
              className="vs-browser-row"
              onDoubleClick={() => setPath(e.path)}
              onClick={() => setPath(e.path)}
            >
              <span className="vs-folder-icon"><Folder size={14} /></span>
              <span>{e.name}</span>
            </div>
          ))}
          {!entries.length && !error && <div className="vs-browser-empty">No subfolders</div>}
        </div>
      </div>
    </Frame>
  );
}

function NewFile({ onClose }: { onClose: () => void }) {
  const st = useStore();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  return (
    <Frame
      title="Add New File"
      width={520}
      onClose={onClose}
      footer={
        <>
          <span className="vs-muted">Relative to {st.root ?? "workspace"}</span>
          <div className="vs-modal-buttons">
            <button className="vs-btn" onClick={onClose}>Cancel</button>
            <button
              className="vs-btn primary"
              onClick={async () => {
                if (!st.root || !name.trim()) return;
                const target = join(st.root, name.trim());
                try {
                  await st.newFile(target);
                  onClose();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Create
            </button>
          </div>
        </>
      }
    >
      <div className="vs-field">
        <label>File name</label>
        <input
          autoFocus
          value={name}
          placeholder="Program.cs"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (document.querySelector(".vs-modal .primary") as HTMLButtonElement)?.click()}
        />
      </div>
      {error && <div className="vs-browser-error">{error}</div>}
      <p className="vs-muted">
        Type a path with folders (for example <code>src/App.tsx</code>) to create nested files.
      </p>
    </Frame>
  );
}

const TEMPLATES = [
  {
    id: "console",
    name: "Console App",
    group: "Console",
    desc: "A project for creating a command-line application that can run on .NET on Windows, Linux and macOS.",
    runnable: true,
  },
  {
    id: "classlib",
    name: "Class Library",
    group: "Library",
    desc: "A project for creating a class library that targets .NET or .NET Standard.",
    runnable: false,
  },
  {
    id: "wpf",
    name: "WPF Application",
    group: "Desktop",
    desc: "A project for creating a .NET WPF application with a Windows desktop user interface.",
    runnable: true,
  },
  {
    id: "winforms",
    name: "Windows Forms App",
    group: "Desktop",
    desc: "A project for creating an application with a Windows Forms user interface.",
    runnable: true,
  },
  {
    id: "webapp",
    name: "ASP.NET Core Web App (Razor Pages)",
    group: "Web",
    desc: "A project for creating an ASP.NET Core application with example Razor Pages content.",
    runnable: true,
  },
  {
    id: "mvc",
    name: "ASP.NET Core Web App (MVC)",
    group: "Web",
    desc: "A project for creating an ASP.NET Core application with MVC views and controllers.",
    runnable: true,
  },
  {
    id: "webapi",
    name: "ASP.NET Core Web API",
    group: "Web",
    desc: "A project for creating a RESTful HTTP service using ASP.NET Core controllers.",
    runnable: true,
  },
  {
    id: "blazor",
    name: "Blazor Web App",
    group: "Web",
    desc: "A project for creating an ASP.NET Core Blazor web app that runs on .NET.",
    runnable: true,
  },
  {
    id: "worker",
    name: "Worker Service",
    group: "Web",
    desc: "A project for creating a background worker service that can run as a Windows service or console app.",
    runnable: true,
  },
  {
    id: "xunit",
    name: "xUnit Test Project",
    group: "Test",
    desc: "A project that contains xUnit.net tests that can run on .NET on Windows, Linux and macOS.",
    runnable: false,
  },
  {
    id: "nunit",
    name: "NUnit Test Project",
    group: "Test",
    desc: "A project that contains NUnit tests that can run on .NET.",
    runnable: false,
  },
  {
    id: "mstest",
    name: "MSTest Test Project",
    group: "Test",
    desc: "A project that contains MSTest tests that can run on .NET.",
    runnable: false,
  },
];

const GROUPS = ["All", "Console", "Desktop", "Library", "Web", "Test"];
const FRAMEWORKS = [
  { id: "net10.0", label: ".NET 10.0 (Long Term Support)" },
  { id: "net9.0", label: ".NET 9.0 (Standard Term Support)" },
  { id: "net8.0", label: ".NET 8.0 (Long Term Support)" },
];

function NewProject({ onClose }: { onClose: () => void }) {
  const st = useStore();
  const [group, setGroup] = useState("All");
  const [template, setTemplate] = useState("console");
  const [name, setName] = useState("MyCloneProject");
  const [location, setLocation] = useState(st.root ?? st.terminalCwd ?? "");
  const [framework, setFramework] = useState("net10.0");
  const [solutionName, setSolutionName] = useState("MyCloneProject");
  const [createSolution, setCreateSolution] = useState(true);
  const [sameDirectory, setSameDirectory] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const selected = TEMPLATES.find((t) => t.id === template) ?? TEMPLATES[0];
  const shown = group === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.group === group);

  // Keep the solution name in sync until the user edits it themselves.
  const [solutionTouched, setSolutionTouched] = useState(false);

  const create = async () => {
    if (!location.trim() || !name.trim()) {
      setError("Project name and location are required.");
      return;
    }
    if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(name.trim())) {
      setError("Project name must start with a letter or underscore and use only letters, digits, '_', '.' or '-'.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await st.newProject({
        root: location.trim(),
        name: name.trim(),
        template,
        framework,
        solutionName: createSolution ? solutionName.trim() || name.trim() : name.trim(),
        createSolution,
        sameDirectory,
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Frame
      title="Create a new project"
      width={880}
      onClose={onClose}
      footer={
        <>
          <span className="vs-muted">
            {selected.runnable ? "Run with F5 after creation" : "Library / test project — build with Ctrl+Shift+B"}
          </span>
          <div className="vs-modal-buttons">
            <button className="vs-btn" onClick={onClose}>Cancel</button>
            <button className="vs-btn primary" disabled={busy} onClick={() => void create()}>
              {busy ? "Creating…" : "Create"}
            </button>
          </div>
        </>
      }
    >
      <div className="vs-np">
        <aside className="vs-np-side">
          <div className="vs-np-side-title">Templates</div>
          {GROUPS.map((g) => (
            <button
              key={g}
              className={`vs-np-group${group === g ? " active" : ""}`}
              onClick={() => setGroup(g)}
            >
              {g}
            </button>
          ))}
          <div className="vs-np-side-title" style={{ marginTop: 14 }}>Target framework</div>
          <select
            className="vs-np-select"
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
          >
            {FRAMEWORKS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </aside>

        <div className="vs-np-main">
          <div className="vs-np-list">
            {shown.map((t) => (
              <button
                key={t.id}
                className={`vs-np-card${template === t.id ? " active" : ""}`}
                onClick={() => {
                  setTemplate(t.id);
                  setError("");
                }}
              >
                <span className="vs-np-card-icon">{t.id === "console" ? ">_" : t.group === "Web" ? "⌘" : t.group === "Test" ? "✓" : "C#"}</span>
                <span className="vs-np-card-text">
                  <span className="vs-np-card-name">{t.name}</span>
                  <span className="vs-np-card-desc">{t.desc}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="vs-np-form">
            <div className="vs-np-form-title">Configure your new project</div>
            <div className="vs-field">
              <label>Project name</label>
              <input
                autoFocus
                value={name}
                spellCheck={false}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!solutionTouched) setSolutionName(e.target.value);
                }}
              />
            </div>
            <div className="vs-field">
              <label>Location</label>
              <input value={location} spellCheck={false} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="vs-field">
              <label>Solution name</label>
              <input
                value={solutionName}
                spellCheck={false}
                disabled={!createSolution}
                onChange={(e) => {
                  setSolutionTouched(true);
                  setSolutionName(e.target.value);
                }}
              />
            </div>
            <div className="vs-field">
              <label>Framework</label>
              <select value={framework} onChange={(e) => setFramework(e.target.value)}>
                {FRAMEWORKS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>
            <label className="vs-np-check">
              <input
                type="checkbox"
                checked={createSolution}
                onChange={(e) => setCreateSolution(e.target.checked)}
              />
              Create a new solution (.sln)
            </label>
            <label className="vs-np-check">
              <input
                type="checkbox"
                checked={sameDirectory}
                disabled={!createSolution}
                onChange={(e) => setSameDirectory(e.target.checked)}
              />
              Place solution and project in the same directory
            </label>
            <p className="vs-muted small">
              Creates <code>{location || "…"}\{solutionName || name}\{sameDirectory ? "" : `${name}\\`}</code> using the
              official <code>dotnet new {template}</code> template.
            </p>
          </div>
        </div>
      </div>
      {error && <div className="vs-browser-error" style={{ whiteSpace: "pre-wrap" }}>{error}</div>}
    </Frame>
  );
}

function NuGet({ onClose }: { onClose: () => void }) {
  const st = useStore();
  const [project, setProject] = useState(st.root ?? "");
  const [packageId, setPackageId] = useState("");
  const [version, setVersion] = useState("");
  const [error, setError] = useState("");
  const [packages, setPackages] = useState<Array<{ id: string; version: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ id: string; version: string; description: string; authors: string; downloads: number }>
  >([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!project) return;
    let dead = false;
    api.nugetList(project)
      .then((r) => { if (!dead) setPackages(r.packages ?? []); })
      .catch(() => undefined);
    return () => { dead = true; };
  }, [project]);

  // If the field holds a folder, resolve the .csproj inside it.
  useEffect(() => {
    if (!project || /\.(cs|fs|vb)proj$/i.test(project)) return;
    api
      .list(project)
      .then((r) => {
        const p = r.entries.find((e) => !e.dir && /\.(cs|fs|vb)proj$/i.test(e.name));
        if (p) setProject(p.path);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = async (id = packageId.trim(), ver = version.trim()) => {
    if (!project.trim() || !id) return;
    setBusy(true);
    setError("");
    try {
      const res = await st.addNuGet(project.trim(), id, ver);
      if (res.ok) {
        setPackageId("");
        setVersion("");
        const list = await api.nugetList(project.trim());
        setPackages(list.packages ?? []);
      } else {
        setError(res.stderr || res.command);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const r = await api.nugetSearch(query.trim());
      setResults(r.results ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSearching(false);
    }
  };

  const remove = async (id: string, ver: string) => {
    if (!project) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.nugetRemove(project, id, ver);
      if (res.ok) {
        const list = await api.nugetList(project);
        setPackages(list.packages ?? []);
      } else {
        setError(res.stderr || res.command);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Frame
      title="Manage NuGet Packages"
      width={680}
      onClose={onClose}
      footer={
        <>
          <div className="vs-modal-buttons">
            <button className="vs-btn" onClick={onClose}>Cancel</button>
            <button className="vs-btn primary" disabled={busy} onClick={() => void add()}>Add Package</button>
          </div>
        </>
      }
    >
      <div className="vs-field">
        <label>Project</label>
        <input value={project} onChange={(e) => setProject(e.target.value)} spellCheck={false} />
      </div>
      <div className="vs-field">
        <label>Search nuget.org</label>
        <div className="vs-nuget-search">
          <input
            autoFocus
            value={query}
            placeholder="Newtonsoft.Json, Serilog, Dapper…"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void search()}
            spellCheck={false}
          />
          <button className="vs-btn" disabled={searching} onClick={() => void search()}>
            {searching ? "Searching…" : "Search"}
          </button>
        </div>
        {results.length > 0 && (
          <div className="vs-nuget-results">
            {results.map((r) => (
              <div key={r.id} className="vs-nuget-result">
                <div className="vs-nuget-result-head">
                  <span className="vs-nuget-id">{r.id}</span>
                  <span className="vs-muted">v{r.version}</span>
                  <button className="vs-btn primary" disabled={busy} onClick={() => void add(r.id, r.version)}>
                    Install
                  </button>
                </div>
                <div className="vs-muted small">{r.authors}</div>
                <div className="vs-nuget-desc">{r.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="vs-field">
        <label>Package ID</label>
        <input value={packageId} placeholder="Newtonsoft.Json" onChange={(e) => setPackageId(e.target.value)} spellCheck={false} />
      </div>
      <div className="vs-field">
        <label>Version (optional)</label>
        <input value={version} placeholder="1.0.0" onChange={(e) => setVersion(e.target.value)} spellCheck={false} />
      </div>
      <div className="vs-field">
        <label>Installed Packages</label>
        <div className="vs-nuget-list">
          {packages.length === 0 && <div className="vs-muted">No packages installed.</div>}
          {packages.map((p) => (
            <div key={p.id} className="vs-nuget-row">
              <span className="vs-nuget-id">{p.id}</span>
              <span className="vs-muted">v{p.version}</span>
              <button className="vs-btn" disabled={busy} onClick={() => void remove(p.id, p.version)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
      <p className="vs-muted">
        Runs <code>dotnet add/remove &lt;project&gt; package &lt;id&gt; [--version v]</code>.
      </p>
      {error && <div className="vs-browser-error">{error}</div>}
    </Frame>
  );
}

function AddReference({ onClose }: { onClose: () => void }) {
  const st = useStore();
  const [project, setProject] = useState("");
  const [reference, setReference] = useState("");
  const [refs, setRefs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!st.root) return;
    api
      .list(st.root)
      .then((r) => {
        const p = r.entries.find((e) => !e.dir && e.name.toLowerCase().endsWith(".csproj"));
        if (p) setProject(p.path);
      })
      .catch(() => undefined);
  }, [st.root]);

  const load = async (proj: string) => {
    if (!proj) return;
    try {
      const r = await api.refsList(proj);
      setRefs(r.refs ?? []);
    } catch {
      setRefs([]);
    }
  };

  useEffect(() => {
    void load(project);
  }, [project]);

  return (
    <Frame
      title="Add Project Reference"
      width={620}
      onClose={onClose}
      footer={
        <>
          <span className="vs-muted">Runs <code>dotnet add &lt;project&gt; reference &lt;project&gt;</code></span>
          <div className="vs-modal-buttons">
            <button className="vs-btn" onClick={onClose}>Close</button>
            <button
              className="vs-btn primary"
              disabled={busy || !project.trim() || !reference.trim()}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const res = await api.refsAdd(project.trim(), reference.trim());
                  if (res.ok) {
                    setReference("");
                    await load(project.trim());
                  } else {
                    setError(res.stderr || res.command);
                  }
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Add Reference
            </button>
          </div>
        </>
      }
    >
      <div className="vs-field">
        <label>Project</label>
        <input value={project} onChange={(e) => setProject(e.target.value)} spellCheck={false} />
      </div>
      <div className="vs-field">
        <label>Reference project (.csproj)</label>
        <input
          value={reference}
          placeholder="..\\Library\\Library.csproj"
          onChange={(e) => setReference(e.target.value)}
          spellCheck={false}
        />
      </div>
      <div className="vs-field">
        <label>Current references</label>
        <div className="vs-nuget-list">
          {refs.length === 0 && <div className="vs-muted">No project references.</div>}
          {refs.map((r) => (
            <div key={r} className="vs-nuget-row">
              <span className="vs-nuget-id">{r}</span>
            </div>
          ))}
        </div>
      </div>
      {error && <div className="vs-browser-error">{error}</div>}
    </Frame>
  );
}

function AccountSettings({ onClose }: { onClose: () => void }) {
  const st = useStore();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await st.signIn(token.trim());
      setToken("");
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Frame
      title="Account settings"
      width={560}
      onClose={onClose}
      footer={
        <div className="vs-modal-buttons">
          {st.auth ? (
            <button
              className="vs-btn"
              onClick={() => {
                st.signOut();
                onClose();
              }}
            >
              Sign out
            </button>
          ) : null}
          <button className="vs-btn" onClick={onClose}>
            Close
          </button>
          {!st.auth && (
            <button className="vs-btn primary" disabled={busy || !token.trim()} onClick={() => void submit()}>
              Sign in
            </button>
          )}
        </div>
      }
    >
      <div className="vs-account-dialog-head">Visual Studio account</div>
      {st.auth ? (
        <>
          <div className="vs-github-user">
            {st.auth.avatar ? (
              <img src={st.auth.avatar} alt="" className="vs-github-avatar" />
            ) : (
              <span className="vs-avatar large">{(st.auth.name || st.auth.login).slice(0, 1).toUpperCase()}</span>
            )}
            <div>
              <div className="vs-github-name">{st.auth.name}</div>
              <div className="vs-muted">@{st.auth.login}</div>
            </div>
          </div>
          <p className="vs-muted vs-account-dialog-note">
            Signed in with GitHub. Settings, source control, and Copilot use this account on this machine.
          </p>
        </>
      ) : (
        <>
          <p className="vs-muted vs-account-dialog-note">
            Sign in to sync your settings, unlock subscriptions, and use GitHub Copilot. Your credentials stay on this
            machine.
          </p>
          <div className="vs-field">
            <label>GitHub personal access token</label>
            <input
              autoFocus
              type="password"
              value={token}
              placeholder="ghp_…"
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && token.trim() && !busy) void submit();
              }}
              spellCheck={false}
            />
          </div>
          <p className="vs-muted">
            Create a token at <b>github.com/settings/tokens</b> with <code>repo</code> scope.
          </p>
        </>
      )}
      {error && <div className="vs-browser-error">{error}</div>}
    </Frame>
  );
}

function Copilot({ onClose }: { onClose: () => void }) {
  const st = useStore();
  const [text, setText] = useState("");
  return (
    <Frame
      title="Copilot Chat"
      width={680}
      onClose={onClose}
      footer={
        <div className="vs-copilot-input">
          <input
            autoFocus
            value={text}
            placeholder="Ask Copilot about your code…"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && text.trim() && !st.copilot.busy) {
                void st.askCopilot(text.trim());
                setText("");
              }
            }}
          />
          <button
            className="vs-btn primary"
            disabled={st.copilot.busy || !text.trim()}
            onClick={() => {
              void st.askCopilot(text.trim());
              setText("");
            }}
          >
            {st.copilot.busy ? "…" : "Send"}
          </button>
        </div>
      }
    >
      <div className="vs-copilot">
        {st.copilot.messages.length === 0 && (
          <p className="vs-muted">
            Copilot chat is an OpenAI-compatible assistant. To enable it, set{" "}
            <code>COPILOT_API_KEY</code> (optionally <code>COPILOT_BASE_URL</code> and{" "}
            <code>COPILOT_MODEL</code>) in the environment before launching the app.
          </p>
        )}
        {st.copilot.messages.map((m, i) => (
          <div key={i} className={`vs-copilot-msg ${m.role}`}>
            <div className="vs-copilot-role">{m.role === "user" ? "You" : "Copilot"}</div>
            <div className="vs-copilot-text">{m.content}</div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function CloneRepository({ onClose }: { onClose: () => void }) {
  const st = useStore();
  const [url, setUrl] = useState("https://github.com/");
  const base = st.terminalCwd || st.root || "";
  const [parent, setParent] = useState(base ? join(join(base, "source"), "repos") : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const repoName = (() => {
    const clean = url.trim().replace(/\/+$/, "").replace(/\.git$/i, "");
    return clean.split(/[\\/]/).filter(Boolean).pop() ?? "";
  })();
  const target = parent && repoName ? join(parent, repoName) : "";

  return (
    <Frame
      title="Clone a Repository"
      width={620}
      onClose={onClose}
      footer={
        <>
          <span className="vs-muted">{target || "Enter a repository URL"}</span>
          <div className="vs-modal-buttons">
            <button className="vs-btn" onClick={onClose}>Cancel</button>
            <button
              className="vs-btn primary"
              disabled={busy || !url.trim() || !target}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const res = await api.cloneRepo(url.trim(), target);
                  if (res.ok) {
                    onClose();
                    await st.openFolder(res.path);
                  } else {
                    setError(res.stderr || res.stdout || `git clone failed (${res.code})`);
                  }
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Cloning…" : "Clone"}
            </button>
          </div>
        </>
      }
    >
      <div className="vs-field">
        <label>Repository URL</label>
        <input
          autoFocus
          value={url}
          placeholder="https://github.com/user/repo.git"
          onChange={(e) => setUrl(e.target.value)}
          spellCheck={false}
        />
      </div>
      <div className="vs-field">
        <label>Clone into (parent folder)</label>
        <input value={parent} onChange={(e) => setParent(e.target.value)} spellCheck={false} />
      </div>
      <p className="vs-muted">
        Runs <code>git clone &lt;url&gt; &lt;target&gt;</code>. Private repositories use your configured Git
        credentials.
      </p>
      {error && <div className="vs-browser-error">{error}</div>}
    </Frame>
  );
}

function OpenSolution({ onClose }: { onClose: () => void }) {
  const st = useStore();
  const [path, setPath] = useState(st.root ?? st.terminalCwd ?? "");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState("");

  const isSolutionFile = (p: string) => /\.(slnx?|csproj|fsproj|vbproj)$/i.test(p);

  useEffect(() => {
    if (!path || isSolutionFile(path)) return;
    api
      .list(path)
      .then((r) => {
        setEntries(
          r.entries.filter(
            (e) =>
              (!e.dir && /\.(slnx?|csproj|fsproj|vbproj)$/i.test(e.name)) ||
              (e.dir && !/^(bin|obj|node_modules|\.git|\.vs|dist)$/i.test(e.name)),
          ),
        );
        setError("");
      })
      .catch(() => {
        setEntries([]);
        setError("This path does not exist or cannot be read.");
      });
  }, [path]);

  const open = async (p: string) => {
    onClose();
    await st.openSolution(p);
  };

  return (
    <Frame
      title="Open a Project or Solution"
      width={700}
      onClose={onClose}
      footer={
        <>
          <span className="vs-muted">Paste a full path to a .sln / .csproj, or pick one below.</span>
          <div className="vs-modal-buttons">
            <button className="vs-btn" onClick={onClose}>Cancel</button>
            <button
              className="vs-btn primary"
              disabled={!path.trim()}
              onClick={() => void open(path.trim())}
            >
              Open
            </button>
          </div>
        </>
      }
    >
      <div className="vs-field">
        <label>Project or solution path</label>
        <input
          autoFocus
          value={path}
          onChange={(e) => setPath(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && path.trim() && void open(path.trim())}
          spellCheck={false}
        />
      </div>
      {!isSolutionFile(path) && (
        <div className="vs-browser" style={{ maxHeight: 260 }}>
          <div className="vs-browser-head">
            <button
              className="vs-icon-btn"
              title="Up one level"
              onClick={() => {
                const clean = path.replace(/[\\/]+$/, "");
                const idx = Math.max(clean.lastIndexOf("\\"), clean.lastIndexOf("/"));
                if (idx > 2) setPath(clean.slice(0, idx));
              }}
            >
              <ChevronUp size={13} />
            </button>
            <span className="vs-muted" style={{ marginLeft: 8 }}>{path}</span>
          </div>
          <div className="vs-browser-list">
            {error && <div className="vs-browser-error">{error}</div>}
            {entries.map((e) => (
              <div
                key={e.path}
                className="vs-browser-row"
                onClick={() => (e.dir ? setPath(e.path) : void open(e.path))}
              >
                <span className="vs-folder-icon">{e.dir ? <Folder size={14} /> : <span className="vs-file-badge">SLN</span>}</span>
                <span>{e.name}</span>
              </div>
            ))}
            {!entries.length && !error && <div className="vs-browser-empty">No projects or solutions in this folder</div>}
          </div>
        </div>
      )}
    </Frame>
  );
}

function SaveAs({ onClose }: { onClose: () => void }) {
  const st = useStore();
  const doc = st.docs.find((d) => d.path === st.active) ?? null;
  const [path, setPath] = useState(doc?.path ?? "");
  const [error, setError] = useState("");
  return (
    <Frame
      title="Save File As"
      width={560}
      onClose={onClose}
      footer={
        <div className="vs-modal-buttons">
          <button className="vs-btn" onClick={onClose}>Cancel</button>
          <button
            className="vs-btn primary"
            disabled={!doc || !path.trim()}
            onClick={async () => {
              if (!path.trim()) return;
              try {
                onClose();
                await st.saveAs(path.trim());
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Save
          </button>
        </div>
      }
    >
      <div className="vs-field">
        <label>Full path</label>
        <input autoFocus value={path} onChange={(e) => setPath(e.target.value)} spellCheck={false} />
      </div>
      {!doc && <p className="vs-muted">Open a file first.</p>}
      {error && <div className="vs-browser-error">{error}</div>}
    </Frame>
  );
}

function Prerequisites({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.prereq>> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.prereq().then(setData).catch((e) => setError((e as Error).message));
  }, []);
  const row = (label: string, info?: { found: boolean; version: string }, link?: string) => (
    <div className="vs-nuget-row">
      <span className={`vs-dot ${info?.found ? "" : "missing"}`} />
      <span className="vs-nuget-id" style={{ minWidth: 90 }}>{label}</span>
      <span className="vs-muted">{info ? (info.found ? info.version : "Not found") : "Checking…"}</span>
      {info && !info.found && link && (
        <button className="vs-btn" onClick={() => window.open(link, "_blank")}>Download</button>
      )}
    </div>
  );
  return (
    <Frame
      title="Required Components"
      width={640}
      onClose={onClose}
      footer={
        <div className="vs-modal-buttons">
          <button className="vs-btn primary" onClick={onClose}>Close</button>
        </div>
      }
    >
      <p className="vs-muted">
        This IDE drives the real toolchain on your PC. Install the missing components, then restart the app.
      </p>
      <div className="vs-nuget-list" style={{ maxHeight: "none" }}>
        {row(".NET SDK", data?.dotnet, "https://dotnet.microsoft.com/download")}
        {row("Git", data?.git, "https://git-scm.com/download/win")}
        {row("Node.js runtime (bundled)", { found: true, version: data?.node.version ?? "" })}
      </div>
      <p className="vs-muted small">
        .NET SDK powers build/run/NuGet; Git powers clone, commit and push.
      </p>
      {error && <div className="vs-browser-error">{error}</div>}
    </Frame>
  );
}

function Extensions({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("csharp");
  const [results, setResults] = useState<
    Array<{ id: string; publisher: string; displayName: string; description: string; version: string; installs: number }>
  >([]);
  const [installed, setInstalled] = useState<Array<{ file: string; size: number }>>([]);
  const [dir, setDir] = useState("");
  const [busy, setBusy] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const loadInstalled = async () => {
    try {
      const r = await api.extList();
      setInstalled(r.extensions);
      setDir(r.dir);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    void loadInstalled();
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const r = await api.extSearch(query.trim());
      setResults(r.results ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <Frame
      title="Manage Extensions"
      width={720}
      onClose={onClose}
      footer={
        <div className="vs-modal-buttons">
          <button className="vs-btn" onClick={onClose}>Close</button>
        </div>
      }
    >
      <div className="vs-field">
        <label>Search Visual Studio Marketplace</label>
        <div className="vs-nuget-search">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void search()}
            placeholder="C#, GitHub Copilot, Codeium, SonarLint…"
            spellCheck={false}
          />
          <button className="vs-btn" disabled={searching} onClick={() => void search()}>
            {searching ? "Searching…" : "Search"}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="vs-field">
          <label>Marketplace results</label>
          <div className="vs-nuget-results" style={{ maxHeight: 240 }}>
            {results.map((r) => (
              <div key={`${r.publisher}.${r.id}`} className="vs-nuget-result">
                <div className="vs-nuget-result-head">
                  <span className="vs-nuget-id">{r.displayName}</span>
                  <span className="vs-muted">{r.publisher}.{r.id} · v{r.version}</span>
                  <button
                    className="vs-btn primary"
                    disabled={busy === r.id}
                    onClick={async () => {
                      setBusy(r.id);
                      setError("");
                      try {
                        await api.extInstall(r.publisher, r.id, r.version);
                        await loadInstalled();
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy("");
                      }
                    }}
                  >
                    {busy === r.id ? "Downloading…" : "Download"}
                  </button>
                </div>
                <div className="vs-nuget-desc">{r.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="vs-field">
        <label>Downloaded extensions ({installed.length})</label>
        <div className="vs-nuget-list">
          {installed.length === 0 && <div className="vs-muted">No extensions downloaded yet.</div>}
          {installed.map((e) => (
            <div key={e.file} className="vs-nuget-row">
              <span className="vs-nuget-id">{e.file}</span>
              <span className="vs-muted">{Math.max(1, Math.round(e.size / 1024))} KB</span>
              <button
                className="vs-btn"
                onClick={async () => {
                  try {
                    await api.extRemove(e.file);
                    await loadInstalled();
                  } catch (err) {
                    setError((err as Error).message);
                  }
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {dir && <div className="vs-muted small" style={{ marginTop: 4 }}>{dir}</div>}
      </div>

      <p className="vs-muted">
        Extensions are downloaded from the Visual Studio Marketplace as <code>.vsix</code> packages and kept in
        the folder above. This clone does not load third-party VSIX binaries into its runtime — its built-in
        features (C#, NuGet, Git, Copilot) are always on.
      </p>
      {error && <div className="vs-browser-error">{error}</div>}
    </Frame>
  );
}

function GoToLine({ onClose }: { onClose: () => void }) {
  const st = useStore();
  const [line, setLine] = useState("1");
  return (
    <Frame
      title="Go To Line"
      width={380}
      onClose={onClose}
      footer={
        <div className="vs-modal-buttons">
          <button className="vs-btn" onClick={onClose}>Cancel</button>
          <button
            className="vs-btn primary"
            onClick={() => {
              if (st.active) st.revealAt(st.active, Number(line) || 1);
              onClose();
            }}
          >
            Go To
          </button>
        </div>
      }
    >
      <div className="vs-field">
        <label>Line number</label>
        <input
          autoFocus
          value={line}
          onChange={(e) => setLine(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (st.active) st.revealAt(st.active, Number(line) || 1);
              onClose();
            }
          }}
        />
      </div>
    </Frame>
  );
}

function About({ onClose }: { onClose: () => void }) {
  const st = useStore();
  return (
    <Frame
      title="About Microsoft Visual Studio"
      width={560}
      onClose={onClose}
      footer={
        <div className="vs-modal-buttons">
          <button className="vs-btn primary" onClick={onClose}>OK</button>
        </div>
      }
    >
      <div className="vs-about">
        <img src="/vs-icon.png" alt="" className="vs-about-logo" />
        <div>
          <h2>Visual Studio Clone</h2>
          <p className="vs-muted">
            An independent, evidence-based reimplementation of the Visual Studio 18.10 shell.
            Not affiliated with Microsoft.
          </p>
          <dl className="vs-about-facts">
            <dt>Clone version</dt><dd>1.0.0</dd>
            <dt>Shell reconstructed from</dt><dd>devenv.exe 18.10.12217.157 (sha256 1b2afedb…fb599)</dd>
            <dt>Theme source</dt><dd>Theme.Dark.pkgdef · Shell.Dark.pkgdef (1,194 color values decoded)</dd>
            <dt>Icon source</dt><dd>RT_ICON 256×256 PNG resource of devenv.exe</dd>
            <dt>Editor</dt><dd>Monaco with a derived VS dark token palette</dd>
            <dt>Workspace</dt><dd>{st.root ?? "none"}</dd>
          </dl>
          <p className="vs-muted small">
            See evidence/ and README.md in the project for provenance and the decoding methodology.
          </p>
        </div>
      </div>
    </Frame>
  );
}

export function Dialogs() {
  const st = useStore();
  const close = () => st.setDialog(null);
  if (!st.dialog) return null;
  if (st.dialog === "open-folder") return <OpenFolder onClose={close} />;
  if (st.dialog === "new-file") return <NewFile onClose={close} />;
  if (st.dialog === "new-project") return <NewProject onClose={close} />;
  if (st.dialog === "nuget") return <NuGet onClose={close} />;
  if (st.dialog === "add-reference") return <AddReference onClose={close} />;
  if (st.dialog === "github") return <AccountSettings onClose={close} />;
  if (st.dialog === "copilot") return <Copilot onClose={close} />;
  if (st.dialog === "go-to-line") return <GoToLine onClose={close} />;
  if (st.dialog === "clone") return <CloneRepository onClose={close} />;
  if (st.dialog === "open-solution") return <OpenSolution onClose={close} />;
  if (st.dialog === "save-as") return <SaveAs onClose={close} />;
  if (st.dialog === "prereq") return <Prerequisites onClose={close} />;
  if (st.dialog === "extensions") return <Extensions onClose={close} />;
  return <About onClose={close} />;
}
