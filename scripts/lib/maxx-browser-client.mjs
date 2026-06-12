import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const envFiles = [resolve(repoRoot, ".env.local"), resolve(repoRoot, ".env")];

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    if (line.startsWith("export ")) {
      line = line.slice(7).trim();
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex < 0) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function loadMaxxEnv() {
  for (const filePath of envFiles) {
    parseEnvFile(filePath);
  }
}

export function getMaxxEnv(name) {
  loadMaxxEnv();
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getOptionalMaxxEnv(name) {
  loadMaxxEnv();
  return process.env[name]?.trim() ?? "";
}

export async function connectRemoteBrowser() {
  const endpoint = getMaxxEnv("MAXX_BROWSER_WS_ENDPOINT");
  const browser = await chromium.connectOverCDP(endpoint);
  const context = browser.contexts()[0] ?? (await browser.newContext());
  const page = await context.newPage();

  return { browser, context, page };
}

export async function withRemotePage(url, callback, options = {}) {
  const { browser, page } = await connectRemoteBrowser();

  try {
    await page.goto(url, {
      waitUntil: options.waitUntil ?? "domcontentloaded",
      timeout: options.timeoutMs ?? 60000,
    });

    if (options.waitForNetworkIdle !== false) {
      await page.waitForLoadState("networkidle", { timeout: options.networkIdleTimeoutMs ?? 10000 }).catch(() => {});
    }

    return await callback({ browser, page });
  } finally {
    await browser.close();
  }
}

export async function readRemotePageSnapshot(url) {
  return withRemotePage(url, async ({ page }) => {
    const title = await page.title();
    const body = await page.locator("body").innerText({ timeout: 15000 }).catch(() => "");

    return {
      title,
      body,
    };
  });
}
