// Smoke check the production bundle served by `node server/index.mjs --serve`.
import puppeteer from "puppeteer-core";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1600,1000"],
  defaultViewport: { width: 1600, height: 1000 },
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
page.on("console", (m) => m.type() === "error" && console.log("CONSOLE ERROR:", m.text()));
await page.goto("http://127.0.0.1:5179/", { waitUntil: "networkidle2" });
await new Promise((r) => setTimeout(r, 1500));
const hasStart = await page.evaluate(() => !!document.querySelector(".vs-start-card") || !!document.querySelector(".vs-start"));
const titlebarBg = await page.evaluate(() => {
  const el = document.querySelector(".vs-titlebar, .vs-start-header");
  if (!el) return "(none)";
  const cs = getComputedStyle(el);
  const root = getComputedStyle(document.documentElement);
  const vars = [];
  for (let i = 0; i < root.length; i++) vars.push(root[i]);
  return { bg: cs.backgroundColor, headerVar: root.getPropertyValue("--vs-header").trim() };
});
console.log(JSON.stringify({ hasStart, titlebarBg }));
await page.screenshot({ path: "evidence/screens/11-prod-start.png" });
await browser.close();
console.log("prod smoke done");
