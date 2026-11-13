import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const playwrightModule = process.env.PLAYWRIGHT_MODULE;
if (!playwrightModule) throw new Error("PLAYWRIGHT_MODULE is required");
const { chromium } = await import(pathToFileURL(playwrightModule).href);
const BASE = process.env.SMOKE_BASE_URL || "http://127.0.0.1:4173/";
const artifacts = path.resolve("artifacts/browser-smoke");
fs.mkdirSync(artifacts, { recursive: true });

const browser = await chromium.launch({ headless: true });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", error => errors.push(error.message));
const assert = (condition, description) => {
  if (!condition) throw new Error(description);
};

try {
  const response = await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  assert(response?.ok(), "Main application did not load");
  await page.locator("#root").waitFor();
  const aboutButton = page.locator("button").filter({ hasText: /项目介绍|About/ }).first();
  await aboutButton.waitFor({ timeout: 15000 });
  await aboutButton.click();
  await page.locator("#project-overview-title").waitFor();
  await page.locator("#keyword-index").waitFor();
  await page.screenshot({ path: path.join(artifacts, "desktop-overview.png"), fullPage: true });
  const returnButton = page.getByRole("button", { name: /开始生成检索式|Start building a query/ }).first();
  await returnButton.click();
  await page.getByRole("button", { name: /官方网址速查|Official Whitelist/ }).first().click();
  await page.locator("main").first().waitFor();

  for (const slug of ["academic-literature-search", "boolean-search", "keyword-expansion"]) {
    const url = new URL("guides/" + slug + "/", BASE).toString();
    const guideResponse = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    assert(guideResponse?.ok(), "Guide returned an error: " + url);
    assert(await page.locator("h1").count() === 1, "Guide should have one h1: " + slug);
    const firstSection = page.locator('aside a[href^="#"]').first();
    const fragment = await firstSection.getAttribute("href");
    if (!fragment) throw new Error("Guide TOC missing: " + slug);
    await firstSection.click();
    assert(new URL(page.url()).hash === fragment, "Guide TOC link is broken: " + slug);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  await page.locator("button").filter({ hasText: /项目介绍|About/ }).first().click();
  await page.locator("#keyword-index").waitFor();
  await page.screenshot({ path: path.join(artifacts, "mobile-overview.png"), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 2, "Mobile page has horizontal overflow of " + overflow + "px");
  assert(errors.length === 0, "Uncaught browser errors:\n" + errors.join("\n"));
  console.log("Browser smoke passed: desktop overview, app return path, whitelist, three guide routes/TOCs, mobile overview.");
} catch (error) {
  await page.screenshot({ path: path.join(artifacts, "failure.png"), fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser.close();
}
