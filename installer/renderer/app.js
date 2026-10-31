const WORKLOADS = [
  {
    id: "desktop",
    title: "Desktop development with .NET",
    desc: "The IDE shell, C# / .NET project system, debugger, NuGet, Solution Explorer, Error List and the .NET SDK integration.",
    size: 0,
    required: true,
    checked: true,
  },
  {
    id: "web",
    title: "ASP.NET and web development",
    desc: "Project templates for ASP.NET Core, Razor Pages, Web API and Blazor, plus the web launch profiles.",
    size: 0,
    checked: true,
  },
  {
    id: "node",
    title: "Node.js development",
    desc: "JavaScript / TypeScript editing, npm and Node.js launch support in the built-in terminal.",
    size: 0,
    checked: true,
  },
  {
    id: "git",
    title: "Git tools",
    desc: "Git Changes panel, staging, commit, push and GitHub sign-in.",
    size: 0,
    checked: true,
  },
  {
    id: "copilot",
    title: "GitHub Copilot",
    desc: "Inline AI chat panel. Requires an OpenAI-compatible API key (OPENAI_API_KEY or COPILOT_API_KEY).",
    size: 0,
    checked: true,
  },
  {
    id: "extensions",
    title: "Extension manager",
    desc: "Search the Visual Studio Marketplace, download VSIX packages and manage installed extensions.",
    size: 0,
    checked: true,
  },
];

const COMPONENTS = [
  { id: "dotnet-sdk", title: ".NET 10 SDK", desc: "Build and run C#, F# and VB projects.", checked: true },
  { id: "git-cli", title: "Git for Windows", desc: "Required for source control integration.", checked: true },
  { id: "node-cli", title: "Node.js runtime", desc: "Used by the bundled local backend.", checked: true },
  { id: "nuget", title: "NuGet package manager", desc: "Search nuget.org and add / remove packages.", checked: true },
  { id: "monaco", title: "Code editor (Monaco)", desc: "Syntax highlighting, IntelliSense and multi-cursor editing.", checked: true },
  { id: "terminal", title: "Integrated terminal", desc: "PowerShell terminal inside the IDE.", checked: true },
];

const PREVIEW = {
  dotnet: { label: ".NET SDK", url: "https://dotnet.microsoft.com/download" },
  git: { label: "Git for Windows", url: "https://git-scm.com/download/win" },
  node: { label: "Node.js", url: "https://nodejs.org/en/download" },
};

const state = {
  info: null,
  installDir: "",
  installed: false,
};

const $ = (id) => document.getElementById(id);
const selected = new Set(WORKLOADS.filter((w) => w.checked).map((w) => w.id));
const selectedComponents = new Set(COMPONENTS.filter((c) => c.checked).map((c) => c.id));

function fmtMB(bytes) {
  if (!bytes) return "0 MB";
  const mb = bytes / 1048576;
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${Math.round(mb)} MB`;
}

function renderWorkloads() {
  const host = $("workloadList");
  host.innerHTML = "";
  for (const workload of WORKLOADS) {
    const row = document.createElement("label");
    row.className = `workload${selected.has(workload.id) ? " checked" : ""}${workload.required ? " disabled" : ""}`;
    row.innerHTML = `
      <input type="checkbox" ${selected.has(workload.id) ? "checked" : ""} ${workload.required ? "disabled" : ""} />
      <span class="workload-body">
        <span class="workload-title">
          ${workload.title}
          ${workload.required ? '<span class="badge required">Required</span>' : ""}
        </span>
        <span class="workload-desc">${workload.desc}</span>
      </span>`;
    const input = row.querySelector("input");
    input.addEventListener("change", () => {
      if (input.checked) selected.add(workload.id);
      else selected.delete(workload.id);
      renderWorkloads();
      updateSummary();
    });
    host.appendChild(row);
  }
}

function renderComponents() {
  const host = $("componentList");
  host.innerHTML = "";
  for (const component of COMPONENTS) {
    const row = document.createElement("label");
    row.className = `workload${selectedComponents.has(component.id) ? " checked" : ""}`;
    row.innerHTML = `
      <input type="checkbox" ${selectedComponents.has(component.id) ? "checked" : ""} />
      <span class="workload-body">
        <span class="workload-title">${component.title}</span>
        <span class="workload-desc">${component.desc}</span>
      </span>`;
    const input = row.querySelector("input");
    input.addEventListener("change", () => {
      if (input.checked) selectedComponents.add(component.id);
      else selectedComponents.delete(component.id);
      renderComponents();
    });
    host.appendChild(row);
  }
}

function renderPrereqs() {
  const host = $("prereqList");
  host.innerHTML = "";
  if (!state.info) return;
  for (const key of Object.keys(PREVIEW)) {
    const prereq = state.info.prereqs[key];
    const row = document.createElement("div");
    row.className = "prereq-row";
    row.innerHTML = `
      <span class="status${prereq.found ? " ok" : ""}"></span>
      <span><b>${PREVIEW[key].label}</b> ${prereq.found ? `— ${prereq.version}` : "— not detected"}</span>
      ${prereq.found ? "" : `<button class="link" data-url="${PREVIEW[key].url}">Download</button>`}`;
    const link = row.querySelector("button.link");
    if (link) link.addEventListener("click", () => window.installer.openUrl(link.dataset.url));
    host.appendChild(row);
  }
}

function updateSummary() {
  if (!state.info) return;
  const bytes = state.info.payloadBytes;
  $("summary").textContent = state.installed
    ? `Installed at ${state.installDir} — ${fmtMB(bytes)} • ${selected.size} workloads selected`
    : `Required: ${fmtMB(bytes)} • ${selected.size} workloads, ${selectedComponents.size} components`;
  $("sizeValue").textContent = fmtMB(bytes);
}

function updatePaths() {
  $("locIde").textContent = state.installDir;
  $("locShared").textContent = `${state.installDir}\\shared`;
  $("locCache").textContent = `${state.info.home}\\AppData\\Local\\VisualStudioClone\\cache`;
  $("pathHint").textContent = state.installed
    ? "Visual Studio Clone is already installed here. Installing again upgrades it in place."
    : "The folder will be created if it does not exist.";
}

function showTab(name) {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === name));
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.add("hidden"));
  $(`panel-${name}`).classList.remove("hidden");
}

function showError(message) {
  const box = $("errorBox");
  if (!message) {
    box.classList.add("hidden");
    box.textContent = "";
    return;
  }
  box.textContent = message;
  box.classList.remove("hidden");
}

async function loadInfo() {
  state.info = await window.installer.info();
  state.installed = state.info.installed;
  if (!state.installDir) state.installDir = state.info.defaultDir;
  $("installPath").value = state.installDir;
  $("stateText").textContent = state.installed ? "Installed" : "Not installed";
  $("stateDot").classList.toggle("installed", state.installed);
  renderPrereqs();
  updatePaths();
  updateSummary();
  $("installBtn").disabled = false;
  $("installBtn").textContent = state.installed ? "Modify" : "Install";
}

$("installPath").addEventListener("input", (event) => {
  state.installDir = event.target.value;
  updatePaths();
});

$("browseBtn").addEventListener("click", async () => {
  const dir = await window.installer.pickDir();
  if (dir) {
    state.installDir = dir;
    $("installPath").value = dir;
    updatePaths();
  }
});

$("refreshBtn").addEventListener("click", () => void loadInfo());
$("closeBtn").addEventListener("click", () => window.installer.close());
$("cancelBtn").addEventListener("click", () => window.installer.close());
$("minBtn").addEventListener("click", () => window.installer.minimize());

document.querySelectorAll(".tab").forEach((tab) =>
  tab.addEventListener("click", () => showTab(tab.dataset.tab)),
);

window.installer.onProgress((payload) => {
  $("progressStep").textContent = payload.step;
  $("progressDetail").textContent = payload.detail || "";
  $("barFill").style.width = `${Math.max(2, Math.min(100, payload.percent))}%`;
});

$("installBtn").addEventListener("click", async () => {
  showError("");
  const dir = $("installPath").value.trim();
  if (!dir) {
    showError("Choose an installation path first.");
    showTab("location");
    return;
  }
  state.installDir = dir;
  $("progressOverlay").classList.remove("hidden");
  $("progressStep").textContent = "Starting…";
  $("progressDetail").textContent = "";
  $("barFill").style.width = "2%";

  const result = await window.installer.install({
    installDir: dir,
    workloads: [...selected],
    components: [...selectedComponents],
    desktopShortcut: $("desktopShortcut").checked,
    startMenuShortcut: $("startShortcut").checked,
  });

  if (!result.ok) {
    $("progressOverlay").classList.add("hidden");
    showError(`Installation failed:\n${result.error}`);
    return;
  }

  $("progressOverlay").classList.add("hidden");
  $("doneOverlay").classList.remove("hidden");
  $("doneDetail").textContent = `Installed to ${result.installDir}`;
  state.installed = true;
  $("stateText").textContent = "Installed";
  $("stateDot").classList.add("installed");
  $("installBtn").textContent = "Modify";
  updateSummary();
});

$("launchBtn").addEventListener("click", async () => {
  await window.installer.launch($("installPath").value.trim());
  window.installer.close();
});

$("doneBtn").addEventListener("click", () => window.installer.close());

renderWorkloads();
renderComponents();
loadInfo().catch((error) => showError(String(error)));
