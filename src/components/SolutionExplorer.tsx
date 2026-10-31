import { useMemo, useState } from "react";
import { useStore, basename } from "../store";
import { badgeFor } from "../lib/lang";
import type { Entry } from "../lib/api";
import {
  ChevronDown,
  ChevronRight,
  Close,
  Collapse,
  Folder,
  Pin,
  Properties,
  Refresh,
  Search,
  ShowAll,
  Solution,
} from "./Icons";
import { ArrowLeft, ArrowRight } from "./Icons";

function FileBadge({ name }: { name: string }) {
  const b = badgeFor(name, false);
  return (
    <span className="vs-file-badge" style={{ color: b.color }}>
      {b.label.slice(0, 2)}
    </span>
  );
}

function Row({
  entry,
  depth,
  selected,
  hasChildren,
}: {
  entry: Entry;
  depth: number;
  selected: boolean;
  hasChildren: boolean;
}) {
  const st = useStore();
  const expanded = !!st.expanded[entry.path];
  return (
    <div
      className={`vs-tree-row${selected ? " selected" : ""}`}
      style={{ paddingLeft: 6 + depth * 14 }}
      onClick={() => {
        st.setSelection(entry.path);
        if (entry.dir) void st.toggleDir(entry.path);
        else void st.openFile(entry.path, true);
      }}
      onDoubleClick={() => {
        if (!entry.dir) {
          st.setActive(entry.path);
          void st.openFile(entry.path, false);
        }
      }}
      title={entry.path}
    >
      <span className="vs-tree-chevron">
        {entry.dir && hasChildren ? (
          expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
        ) : null}
      </span>
      {entry.dir ? (
        <span className={`vs-folder-icon${expanded ? " open" : ""}`}>
          <Folder size={14} open={expanded} />
        </span>
      ) : (
        <FileBadge name={entry.name} />
      )}
      <span className="vs-tree-name">{entry.name}</span>
      {st.git.files.find((f) => f.path.endsWith(entry.name)) && (
        <span className="vs-git-mark">M</span>
      )}
    </div>
  );
}

function Branch({ dir, depth, filter }: { dir: string; depth: number; filter: string }) {
  const st = useStore();
  const entries = st.tree[dir] ?? [];
  const filtered = filter
    ? entries.filter((e) => e.name.toLowerCase().includes(filter.toLowerCase()))
    : entries;
  const selected = st.selection;

  return (
    <>
      {filtered.map((e) => {
        const isOpen = !!st.expanded[e.path];
        return (
          <div key={e.path}>
            <Row
              entry={e}
              depth={depth}
              selected={selected === e.path}
              hasChildren={e.dir}
            />
            {e.dir && isOpen && <Branch dir={e.path} depth={depth + 1} filter={filter} />}
          </div>
        );
      })}
      {!filtered.length && filter && (
        <div className="vs-tree-empty" style={{ paddingLeft: 6 + depth * 14 }}>
          No matches
        </div>
      )}
    </>
  );
}

export function SolutionExplorer() {
  const st = useStore();
  const [filter, setFilter] = useState("");
  const rootName = st.root ? basename(st.root) : "No Solution";

  return (
    <div className="vs-toolwindow">
      <div className="vs-toolwindow-toolbar">
        <button className="vs-tool-btn" disabled title="Navigate backward"><ArrowLeft size={15} /></button>
        <button className="vs-tool-btn" disabled title="Navigate forward"><ArrowRight size={15} /></button>
        <button className="vs-tool-btn" disabled title="Home"><Solution size={14} /></button>
        <button
          className="vs-tool-btn"
          title="Refresh"
          onClick={() => st.root && void st.refreshDir(st.root)}
        >
          <Refresh />
        </button>
        <button
          className="vs-tool-btn"
          title="Collapse All"
          onClick={() => st.root && useStore.setState({ expanded: { [st.root]: true } })}
        >
          <Collapse />
        </button>
        <button className="vs-tool-btn" title="Show All Files"><ShowAll /></button>
        <button className="vs-tool-btn" title="Properties" onClick={st.toggleRight}>
          <Properties />
        </button>
      </div>

      <div className="vs-tree-search">
        <Search size={12} />
        <input
          value={filter}
          placeholder="Search Solution Explorer (Ctrl+;)"
          onChange={(e) => setFilter(e.target.value)}
        />
        {filter && (
          <button className="vs-icon-btn" onClick={() => setFilter("")}>
            <Close size={11} />
          </button>
        )}
      </div>

      <div className="vs-tree">
        {st.root ? (
          <>
            <div className="vs-tree-row vs-tree-solution" style={{ paddingLeft: 4 }}>
              <span className="vs-tree-chevron">
                <ChevronDown size={12} />
              </span>
              <span className="vs-folder-icon"><Solution size={14} /></span>
              <span className="vs-tree-name">Solution '{rootName}'</span>
            </div>
            <div className="vs-tree-solution-count" style={{ paddingLeft: 24 }}>
              {st.tree[st.root]?.length ?? 0} items
            </div>
            <Branch dir={st.root} depth={1} filter={filter} />
          </>
        ) : (
          <div className="vs-tree-placeholder">
            <p>No solution loaded.</p>
            <button className="vs-link-btn" onClick={() => st.setDialog("open-folder")}>
              Open a local folder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function SearchView() {
  const st = useStore();
  const [q, setQ] = useState(st.search.query);
  const grouped = useMemo(() => {
    const m = new Map<string, { line: number; text: string }[]>();
    for (const h of st.search.results) {
      const k = h.path;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(h);
    }
    return [...m.entries()];
  }, [st.search.results]);

  return (
    <div className="vs-toolwindow">
      <div className="vs-search-pane">
        <div className="vs-search-input">
          <Search size={13} />
          <input
            autoFocus
            value={q}
            placeholder="Search in files"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void st.searchAll(q);
            }}
          />
          <button className="vs-icon-btn" onClick={() => void st.searchAll(q)}>
            <Search size={12} />
          </button>
        </div>
        <div className="vs-search-meta">
          {st.search.busy
            ? "Searching…"
            : st.search.done
              ? `${st.search.results.length} result(s) in ${grouped.length} file(s)`
              : "Enter a term and press Enter"}
        </div>
        <div className="vs-search-results">
          {grouped.map(([file, hits]) => (
            <div key={file} className="vs-search-file">
              <div className="vs-search-filename" title={file}>
                <FileBadge name={file} />
                <span>{file.replace(st.root ?? "", "").replace(/^[\\/]/, "")}</span>
                <span className="vs-search-count">{hits.length}</span>
              </div>
              {hits.slice(0, 50).map((h, i) => (
                <div
                  key={i}
                  className="vs-search-hit"
                  onClick={() => {
                    void st.openFile(file, false);
                    st.revealAt(file, h.line);
                  }}
                >
                  <span className="vs-search-line">{h.line}</span>
                  <span className="vs-search-text">{h.text.trim()}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LeftDock() {
  const st = useStore();
  return (
    <aside className="vs-dock vs-dock-left">
      <div className="vs-dock-tabs">
        <button
          className={`vs-dock-tab${st.leftTab === "solution" ? " active" : ""}`}
          onClick={() => st.setLeftTab("solution")}
        >
          Solution Explorer
        </button>
        <button
          className={`vs-dock-tab${st.leftTab === "search" ? " active" : ""}`}
          onClick={() => st.setLeftTab("search")}
        >
          Search
        </button>
        <div className="vs-dock-tab-actions">
          <button className="vs-icon-btn" title="Pin"><Pin size={12} /></button>
          <button className="vs-icon-btn" title="Close" onClick={st.toggleLeft}><Close size={11} /></button>
        </div>
      </div>
      {st.leftTab === "solution" ? <SolutionExplorer /> : <SearchView />}
    </aside>
  );
}
