// Quick hero-only check — avoids full re-run timeout.
import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--no-sandbox"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  await page.goto("http://127.0.0.1:4199/", { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate(() => window.sessionStorage.setItem("maxx_intro_seen", "1"));
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.waitForSelector("h1", { timeout: 15000 });

  const h1 = await page.locator("h1").first().innerText();
  const title = await page.title();
  const auditCtas = await page.locator('a[href="#audit"]').count();
  const allH2 = await page.locator("h2").allInnerTexts();
  const consoleErrorCount = consoleErrors.length;

  // Mobile CTA check
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  const mobileCtaVisible = await page.locator('a[href="#audit"]').first().isVisible().catch(() => false);

  console.log(JSON.stringify({
    title,
    h1: h1.slice(0, 60),
    auditCtaCount: auditCtas,
    sectionCount: allH2.length,
    mobilePrimaryCtaAboveFold: mobileCtaVisible,
    consoleErrorCount,
    consoleErrors: consoleErrors.slice(0, 5),
  }, null, 2));
} finally {
  await browser.close();
}
