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
// Suppress the first-run tour overlay while exercising stable navigation.
await page.addInitScript(() => {
  try { localStorage.setItem("visited-guided-search-v1.0", "true"); } catch {}
});
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
  await returnButton.waitFor({ state: "visible" });
  await returnButton.click({ timeout: 15000 });
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
  // The offline installer is a desktop header control. Switch back from the
  // narrow mobile viewport before testing its download/export workflow.
  await page.setViewportSize({ width: 1440, height: 900 });
  // Export actual generated offline HTML; serve on a known origin for stable localStorage.
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  await page.locator('button[title*="离线安装"]:visible').first().click({ timeout: 15000 });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /一键打包下载离线版 HTML/ }).click();
  const download = await downloadPromise;
  const offlinePath = await download.path();
  assert(Boolean(offlinePath), "Offline HTML download was not created");
  const offlineHtml = fs.readFileSync(offlinePath, "utf8");

  const offlinePage = await browser.newPage();
  const offlineErrors = [];
  offlinePage.on("pageerror", error => offlineErrors.push(error.message));
  await offlinePage.route("**/__offline_security_test.html", route =>
    route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: offlineHtml })
  );
  await offlinePage.addInitScript(() => {
    localStorage.setItem("ai_info_literacy_offline_db_v6", JSON.stringify({
      links: [
        { name: '<img src=x onerror=window.__xss=1>', url: 'javascript:alert(1)', cat: '二、AI素养' },
        { name: '<svg onload=window.__xss=2>', url: 'https://example.com/?q=%22%3E', cat: '二、AI素养' }
      ],
      files: [
        { name: "x');window.__xss=3;evil.pdf" },
        { name: '../outside.html' }
      ]
    }));
  });
  const offlineUrl = new URL("__offline_security_test.html", BASE).toString();
  const offlineResponse = await offlinePage.goto(offlineUrl, { waitUntil: "domcontentloaded" });
  assert(offlineResponse?.ok(), "Generated offline page failed to load");
  await offlinePage.locator("#catGrid").waitFor();
  assert(await offlinePage.locator("#catGrid a").count() === 1, "Only safe stored URL should render");
  assert(await offlinePage.locator("#catGrid a[href^='https://example.com/']").count() === 1, "Valid HTTPS URL was lost");
  assert(await offlinePage.locator("#catGrid a[href^='javascript:']").count() === 0, "Unsafe persisted URL rendered");
  assert(await offlinePage.locator("#catGrid img, #catGrid svg").count() === 0, "Stored name injected HTML");
  assert((await offlinePage.locator("#catGrid").innerText()).includes("<svg onload="), "Safe text was not preserved");
  assert(await offlinePage.locator("#fileList .file-name").count() === 1, "Unsafe filename rendered");
  assert((await offlinePage.locator("#fileList").innerText()).includes("window.__xss=3"), "Punctuation in a safe filename should remain plain text");
  assert((await offlinePage.evaluate(() => window.__xss || 0)) === 0, "Persisted content executed JS");
  assert(offlineErrors.length === 0, "Generated HTML runtime errors:\n" + offlineErrors.join("\n"));
  await offlinePage.close();
  console.log("Offline HTML security passed: unsafe URLs/markup filtered, valid content preserved.");

  assert(errors.length === 0, "Uncaught browser errors:\n" + errors.join("\n"));
  console.log("Browser smoke passed: desktop overview, app return path, whitelist, three guide routes/TOCs, mobile overview.");
} catch (error) {
  await page.screenshot({ path: path.join(artifacts, "failure.png"), fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser.close();
}
