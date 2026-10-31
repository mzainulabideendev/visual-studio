// UI smoke test: drives the running clone with a real browser and captures screenshots.
import puppeteer from "puppeteer-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL = "http://localhost:5180";
const OUT = process.argv[2] ?? "evidence/screens";

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1600,1000", "--force-device-scale-factor=1"],
  defaultViewport: { width: 1600, height: 1000 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE:", m.text());
});

await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: `${OUT}/01-start-window.png` });

// Open the sample workspace through the real dialog flow.
await page.screenshot({ path: `${OUT}/01b.png` });
const openFolder = await page.$$(".vs-start-action");
await openFolder[2].click();
await new Promise((r) => setTimeout(r, 400));
await page.click(".vs-modal input");
await page.evaluate(() => {
  const input = document.querySelector(".vs-modal input");
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(input, "D:\\\\Reversed Engneering\\\\visual studio\\\\sample\\\\HelloVs");
  input.dispatchEvent(new Event("input", { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: `${OUT}/02-open-folder-dialog.png` });
await page.evaluate(() => {
  const btns = [...document.querySelectorAll(".vs-modal-footer button")];
  btns.find((b) => b.textContent.includes("Select Folder"))?.click();
});
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: `${OUT}/03-shell-empty.png` });

// Open a file from the tree (double click Program.cs).
await page.evaluate(() => {
  const rows = [...document.querySelectorAll(".vs-tree-row")];
  const row = rows.find((r) => r.textContent.includes("Program.cs"));
  row?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 1600));
await page.screenshot({ path: `${OUT}/04-editor.png` });

// Build and capture the error list.
await page.keyboard.down("Control");
await page.keyboard.down("Shift");
await page.keyboard.press("B");
await page.keyboard.up("Shift");
await page.keyboard.up("Control");
await new Promise((r) => setTimeout(r, 9000));
await page.screenshot({ path: `${OUT}/05-build-errors.png` });

// Command palette.
await page.keyboard.down("Control");
await page.keyboard.press("Q");
await page.keyboard.up("Control");
await new Promise((r) => setTimeout(r, 500));
await page.keyboard.type("term");
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${OUT}/06-palette.png` });
await page.keyboard.press("Escape");

// Terminal.
await page.evaluate(() => {
  const tabs = [...document.querySelectorAll(".vs-bottom-tab")];
  tabs.find((t) => t.textContent.includes("Terminal"))?.click();
});
await new Promise((r) => setTimeout(r, 300));
await page.click(".vs-terminal-input input");
await page.keyboard.type("dotnet run --no-build");
await page.keyboard.press("Enter");
await new Promise((r) => setTimeout(r, 7000));
await page.screenshot({ path: `${OUT}/07-terminal.png` });

// Light theme + properties dock.
await page.evaluate(() => {
  const menus = [...document.querySelectorAll(".vs-menu-title")];
  menus.find((m) => m.textContent === "View")?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 250));
await page.screenshot({ path: `${OUT}/08-view-menu.png` });

console.log("screenshots written to", OUT);
await browser.close();
