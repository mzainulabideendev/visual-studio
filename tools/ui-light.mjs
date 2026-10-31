// Verifies the light theme: chrome, editor, Properties dock, and light-theme
// severity colours in the Error List.
import puppeteer from "puppeteer-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUT = process.argv[2] ?? "evidence/screens";
const ROOT = process.argv[3] ?? "D:\\Reversed Engneering\\visual studio\\sample\\HelloVs";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1600,1000"],
  defaultViewport: { width: 1600, height: 1000 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

await page.goto("http://localhost:5180", { waitUntil: "networkidle2" });
await wait(800);

await page.evaluate((root) => {
  localStorage.setItem("vsclone.recent", JSON.stringify([root]));
  localStorage.setItem("vsclone.theme", "light");
}, ROOT);
await page.reload({ waitUntil: "networkidle2" });
await wait(900);

await page.evaluate(() => {
  document.querySelector(".vs-start-card")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
await wait(1400);

await page.evaluate(() => {
  const rows = [...document.querySelectorAll(".vs-tree-row")];
  rows.find((r) => r.textContent.includes("Program.cs"))?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
});
await wait(1600);

await page.keyboard.press("F4");
await wait(500);
await page.screenshot({ path: `${OUT}/09-light-editor-properties.png` });

// Force a full rebuild through the Build menu so the sample's CS0219 warning
// re-appears in the Error List, then show the list.
await page.evaluate(() => {
  const titles = [...document.querySelectorAll(".vs-menu-title")];
  titles.find((t) => t.textContent?.startsWith("Build"))?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
});
await wait(400);
await page.evaluate(() => {
  const items = [...document.querySelectorAll(".vs-menu-item")];
  items.find((i) => i.textContent?.includes("Rebuild Solution"))?.click();
});
await wait(9000);
await page.evaluate(() => {
  const tabs = [...document.querySelectorAll(".vs-bottom-tabs button, .vs-tab")];
  const t = tabs.find((b) => b.textContent?.trim().startsWith("Error List"));
  t instanceof HTMLElement ? t.click() : null;
});
await wait(700);
await page.screenshot({ path: `${OUT}/10-light-errors.png` });

const probe = await page.evaluate(() => {
  const cs = (sel) => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el) : null;
  };
  const root = getComputedStyle(document.documentElement);
  return {
    theme: document.querySelector(".vs-app")?.className,
    titlebar: cs(".vs-titlebar")?.backgroundColor,
    statusbar: cs(".vs-statusbar")?.backgroundColor,
    statusbarText: cs(".vs-statusbar")?.color,
    listBg: cs(".vs-tree-row")?.color,
    tabActive: cs(".vs-file-tab.active")?.backgroundColor,
    envBg: root.getPropertyValue("--vs-env-background").trim(),
    errorToken: root.getPropertyValue("--vs-error").trim(),
  };
});
console.log(JSON.stringify(probe, null, 2));

console.log("done");
await browser.close();
