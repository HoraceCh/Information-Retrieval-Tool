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
  // Reload the app shell before exercising the whitelist; its visible nav label may vary by locale.
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
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
  // Download the generated offline page and test hostile persisted data.
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  await page.locator('button[title*="离线安装"]').first().evaluate(button => button.click());
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /一键打包下载离线版 HTML/ }).click();
  const download = await downloadPromise;
  const offlinePath = await download.path();
  assert(offlinePath, "Offline HTML download was not created");
  const offlinePage = await browser.newPage();
  await offlinePage.addInitScript(() => {
    localStorage.setItem("ai_info_literacy_offline_db_v6", JSON.stringify({
      links: [
        { name: '<img src=x onerror=window.__xss=1>', url: 'javascript:alert(1)', cat: '数据库' },
        { name: '<svg onload=window.__xss=2>', url: 'https://example.com/?q=%22%3E', cat: '数据库' }
      ],
      files: [{ name: `x');window.__xss=3;//.pdf` }, { name: '../outside.html' }]
    }));
  });
  await offlinePage.goto("file://" + offlinePath, { waitUntil: "domcontentloaded" });
  await offlinePage.locator("#catGrid").waitFor();
  assert.equal(await offlinePage.locator("#catGrid a[href^='javascript:']").count(), 0, "Dangerous persisted URL was rendered");
  assert.equal(await offlinePage.locator("#catGrid img, #catGrid svg").count(), 0, "Persisted link name injected markup");
  assert.equal(await offlinePage.evaluate(() => window.__xss || 0), 0, "Persisted content executed script");
  assert.equal(await offlinePage.locator("#fileList button").count(), 1, "Unsafe filenames should not be rendered");
  await offlinePage.close();

  assert(errors.length === 0, "Uncaught browser errors:\n" + errors.join("\n"));
  console.log("Browser smoke passed: desktop overview, app return path, whitelist, three guide routes/TOCs, mobile overview.");
} catch (error) {
  await page.screenshot({ path: path.join(artifacts, "failure.png"), fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser.close();
}
