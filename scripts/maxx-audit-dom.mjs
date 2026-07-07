// Headless functional audit of the MAXX preview build.
// Verifies the React app mounts and the conversion copy + CTAs are in the DOM.
// Uses playwright-core with the system Chrome.
import { chromium } from "playwright-core";

const CHROME =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = process.env.MAXX_URL || "http://127.0.0.1:4199/";

const checks = [
  { id: "hero-headline", selector: "h1", contains: "Recover the follow-ups" },
  { id: "primary-cta", selector: 'a[href="#audit"]', contains: "Book a Recovery Audit" },
  { id: "secondary-cta", selector: 'a[href="#how-it-works"]', contains: "Missed Follow-Up Checklist" },
  { id: "pain-section", selector: "#pain h2", contains: "fall through the cracks" },
  { id: "outcomes-section", selector: "#outcomes h2", contains: "Recover conversations" },
  { id: "howitworks", selector: "#how-it-works h2", contains: "Five steps" },
  { id: "pricing-section", selector: "#pricing h2", contains: "Own it" },
  { id: "package-starter", selector: "#pricing", contains: "Recovery Starter" },
  { id: "audit-anchor", selector: "#audit", contains: "recovery audit" },
  { id: "powered-by-hermes", selector: "#audit", contains: "Powered by Hermes" },
  { id: "risk-reversal", selector: "#pricing", contains: "Risk reversal" },
  { id: "footer-operations", selector: "#departments h2", contains: "falling through the cracks" },
];

const results = [];
const errors = [];

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto(URL, { waitUntil: "networkidle", timeout: 45000 });
  // Skip the intro so the hero renders.
  await page.evaluate(() => window.sessionStorage.setItem("maxx_intro_seen", "1"));
  await page.reload({ waitUntil: "networkidle", timeout: 45000 });
  await page.waitForSelector("h1", { timeout: 15000 });

  const title = await page.title();

  for (const check of checks) {
    try {
      const el = await page.$(check.selector);
      if (!el) {
        results.push({ ...check, status: "MISSING_SELECTOR" });
        continue;
      }
      const text = (await el.innerText()) || "";
      const ok = text.toLowerCase().includes(check.contains.toLowerCase());
      results.push({ ...check, status: ok ? "PASS" : "FAIL", got: text.slice(0, 80) });
    } catch (e) {
      errors.push({ check, error: String(e).slice(0, 120) });
    }
  }

  // CTA link count + nav link count
  const auditCtas = await page.locator('a[href="#audit"]').count();
  const navLinks = await page.locator("header a, header [role=link]").count();

  const summary = {
    url: URL,
    title,
    auditCtas,
    navLinks,
    consoleErrors: consoleErrors.slice(0, 8),
    pass: results.filter((r) => r.status === "PASS").length,
    fail: results.filter((r) => r.status === "FAIL").length,
    missing: results.filter((r) => r.status === "MISSING_SELECTOR").length,
  };

  console.log(JSON.stringify({ summary, results, errors }, null, 2));
} finally {
  await browser.close();
}
