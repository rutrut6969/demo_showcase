import { chromium } from "playwright-chromium";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const baseUrl = "http://localhost:3000";
const outputDir = new URL("../qa-screenshots/", import.meta.url);
await mkdir(outputDir, { recursive: true });

let server;
async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("Timed out waiting for local Next server");
}

try {
  await waitForServer();
} catch {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args = process.platform === "win32" ? ["/d", "/s", "/c", "npm run start -- -p 3000"] : ["run", "start", "--", "-p", "3000"];
  server = spawn(command, args, {
    stdio: "ignore"
  });
  await waitForServer();
}

const browser = await chromium.launch();

const pages = [
  ["/", "landing-desktop.png"],
  ["/demos?demo=crafted-commerce", "crafted-desktop.png"],
  ["/demos?demo=petes-kitchen", "petes-desktop.png"],
  ["/demos?demo=harbor-family-practice", "harbor-desktop.png"],
  ["/demos?demo=obsidian-tech-er", "tech-er-desktop.png"],
  ["/admin/login", "admin-login-desktop.png"],
  ["/invoices/preview", "invoice-desktop.png"]
];

const results = [];
for (const [path, fileName] of pages) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  const notFound = [];
  const recordError = (message) => {
    if (!message.includes("ERR_NETWORK_ACCESS_DENIED")) errors.push(message);
  };
  page.on("response", (response) => {
    if (response.status() === 404) notFound.push(response.url());
  });
  page.on("pageerror", (error) => recordError(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") recordError(message.text());
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
  results.push({ fileName, errors, notFound, ...metrics });
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

const modalPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
await modalPage.goto(`${baseUrl}/demos?demo=petes-kitchen`, { waitUntil: "networkidle" });
await modalPage.getByRole("button", { name: "Get AI Estimate" }).first().click();
await modalPage.waitForTimeout(300);
const modalMetrics = await modalPage.evaluate(() => ({
  width: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
  hasModal: document.body.innerText.includes("Request a custom platform estimate")
}));
await modalPage.screenshot({ path: fileURLToPath(new URL("request-modal-mobile.png", outputDir)), fullPage: true });
await modalPage.close();

await browser.close();
if (server) server.kill();
await writeFile(new URL("qa-results.json", outputDir), JSON.stringify({ results, mobileMetrics, modalMetrics }, null, 2));
console.log(JSON.stringify({ results, mobileMetrics, modalMetrics }, null, 2));
