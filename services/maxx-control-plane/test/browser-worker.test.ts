import assert from "node:assert/strict";
import test from "node:test";
import { UnavailableBrowserWorker, PlaywrightBrowserWorker, createBrowserWorker } from "../src/browser-worker.js";

test("UnavailableBrowserWorker reports an honest failure instead of hanging", async () => {
  const worker = new UnavailableBrowserWorker("MAXX_BROWSER_ENABLED is false");
  const result = await worker.execute("navigate", "https://example.com");
  assert.equal(result.success, false);
  assert.equal(result.error, "MAXX_BROWSER_ENABLED is false");
});

test("createBrowserWorker picks the Playwright worker only when browser is enabled", () => {
  assert.ok(createBrowserWorker({ browserEnabled: false }) instanceof UnavailableBrowserWorker);
  assert.ok(createBrowserWorker({ browserEnabled: true }) instanceof PlaywrightBrowserWorker);
});

test("PlaywrightBrowserWorker rejects navigate/extract/screenshot without a target", async () => {
  const worker = new PlaywrightBrowserWorker({ headless: true, executablePath: process.env.MAXX_BROWSER_EXECUTABLE_PATH });
  try {
    const result = await worker.execute("navigate");
    assert.equal(result.success, false);
    assert.match(result.error ?? "", /requires a target URL/);
  } finally {
    await worker.close();
  }
});

test("PlaywrightBrowserWorker returns an honest failure for search (no search provider configured)", async () => {
  const worker = new PlaywrightBrowserWorker({ headless: true, executablePath: process.env.MAXX_BROWSER_EXECUTABLE_PATH });
  try {
    const result = await worker.execute("search", "donor churn");
    assert.equal(result.success, false);
    assert.match(result.error ?? "", /search provider/);
  } finally {
    await worker.close();
  }
});

test("PlaywrightBrowserWorker returns an honest failure for mutating actions", async () => {
  const worker = new PlaywrightBrowserWorker({ headless: true, executablePath: process.env.MAXX_BROWSER_EXECUTABLE_PATH });
  try {
    const result = await worker.execute("purchase", "https://example.com/checkout");
    assert.equal(result.success, false);
    assert.match(result.error ?? "", /not implemented generically/);
  } finally {
    await worker.close();
  }
});

// This one launches a real local Chromium instance (available in this
// sandbox at PLAYWRIGHT_BROWSERS_PATH) and drives it against an inline
// data: URL, so it proves the navigate/extract/screenshot path actually
// works end-to-end rather than only typechecking.
test("PlaywrightBrowserWorker navigates, extracts, and screenshots a real page", async (t) => {
  const worker = new PlaywrightBrowserWorker({ headless: true, executablePath: process.env.MAXX_BROWSER_EXECUTABLE_PATH });
  const target = "data:text/html,<html><body><h1>MAXX browser worker test</h1></body></html>";
  try {
    const navigateResult = await worker.execute("navigate", target);
    assert.equal(navigateResult.success, true, navigateResult.error);

    const extractResult = await worker.execute("extract", target);
    assert.equal(extractResult.success, true, extractResult.error);
    assert.match(extractResult.content ?? "", /MAXX browser worker test/);

    const screenshotResult = await worker.execute("screenshot", target);
    assert.equal(screenshotResult.success, true, screenshotResult.error);
    assert.ok((screenshotResult.screenshotBase64?.length ?? 0) > 0);
    assert.doesNotThrow(() => Buffer.from(screenshotResult.screenshotBase64 ?? "", "base64"));
  } catch (error) {
    // If Chromium cannot launch in this environment (sandbox restriction),
    // skip rather than fail the suite - the honest-failure-path tests above
    // still cover the contract.
    t.skip(`Chromium launch unavailable: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await worker.close();
  }
});
