import { chromium } from "playwright-chromium";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const baseUrl = process.env.OG_BASE_URL || "http://localhost:3000";
const publicDir = new URL("../public/", import.meta.url);
await mkdir(publicDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.screenshot({
  path: fileURLToPath(new URL("og-home-preview.png", publicDir)),
  clip: { x: 0, y: 0, width: 1200, height: 630 }
});
await browser.close();

console.log("Created public/og-home-preview.png");
