import { useStore } from "../store";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Play,
  PanelBottom,
  PanelRight,
  Solution,
  Stop,
} from "./Icons";

export function Toolbar() {
  const st = useStore();
  const building = st.status.kind === "building";
  const debugging = st.status.kind === "debugging";

  return (
    <div className="vs-toolbar">
      <div className="vs-toolbar-nav">
        <button className="vs-tool-btn" title="Navigate backward (Ctrl+-)" disabled>
          <ArrowLeft />
        </button>
        <button className="vs-tool-btn" title="Navigate forward (Ctrl+Shift+-)" disabled>
          <ArrowRight />
        </button>
      </div>

      <div className="vs-toolbar-sep" />

      <div className="vs-start-group">
        <button
          className={`vs-start-btn${debugging ? " active" : ""}`}
          disabled={!st.root || building}
          onClick={() => {
            if (debugging) {
              st.setStatus("Ready", "rest");
              return;
            }
            void st.run();
          }}
          title="Start Debugging (F5)"
        >
          {debugging ? <Stop size={12} /> : <Play size={12} />}
          <span>{debugging ? "Stop" : "Start"}</span>
        </button>
        <button className="vs-start-more" disabled={!st.root} title="Start options">
          <ChevronDown size={11} />
        </button>
      </div>

      <div className="vs-toolbar-sep" />

      <button className="vs-combo" disabled={!st.root}>
        <span className="vs-combo-label">Debug</span>
        <ChevronDown size={11} />
      </button>
      <button className="vs-combo" disabled={!st.root}>
        <span className="vs-combo-label">Any CPU</span>
        <ChevronDown size={11} />
      </button>

      <div className="vs-toolbar-spacer" />

      <button
        className={`vs-tool-btn${st.leftOpen ? " on" : ""}`}
        title="Solution Explorer (Ctrl+Alt+L)"
        onClick={() => st.setLeftTab("solution")}
      >
        <Solution size={15} />
      </button>
      <button
        className={`vs-tool-btn${st.rightOpen ? " on" : ""}`}
        title="Properties (F4)"
        onClick={st.toggleRight}
      >
        <PanelRight size={15} />
      </button>
      <button
        className={`vs-tool-btn${st.bottomOpen ? " on" : ""}`}
        title="Error List / Output"
        onClick={() => st.toggleBottom()}
      >
        <PanelBottom size={15} />
      </button>
    </div>
  );
}
