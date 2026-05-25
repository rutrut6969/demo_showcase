import { chromium } from "playwright-chromium";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const baseUrl = "http://localhost:3000";
const outputDir = new URL("../qa-screenshots/", import.meta.url);
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();

const pages = [
  ["/", "landing-desktop.png"],
  ["/demos?demo=obsidian-tech-er", "demos-desktop.png"],
  ["/admin", "admin-desktop.png"],
  ["/invoices/preview", "invoice-desktop.png"]
];

const results = [];
for (const [path, fileName] of pages) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  const metrics = await page.evaluate(() => ({
    title: document.title,
    url: location.href,
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
    text: document.body.innerText.slice(0, 240)
  }));
  await page.screenshot({ path: fileURLToPath(new URL(fileName, outputDir)), fullPage: true });
  results.push({ fileName, errors, ...metrics });
  await page.close();
}

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
await mobile.goto(`${baseUrl}/demos?demo=crafted-commerce`, { waitUntil: "networkidle" });
const mobileMetrics = await mobile.evaluate(() => ({
  width: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
  text: document.body.innerText.slice(0, 240)
}));
await mobile.screenshot({ path: fileURLToPath(new URL("demos-mobile.png", outputDir)), fullPage: true });
await mobile.close();

await browser.close();
await writeFile(new URL("qa-results.json", outputDir), JSON.stringify({ results, mobileMetrics }, null, 2));
console.log(JSON.stringify({ results, mobileMetrics }, null, 2));
