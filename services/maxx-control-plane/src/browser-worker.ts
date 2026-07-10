import type { Browser } from "playwright-core";
import type { BrowserAction } from "./approval-policy.js";

export type BrowserExecutionResult = {
  success: boolean;
  url: string | null;
  content?: string;
  screenshotBase64?: string;
  error?: string;
  durationMs: number;
};

export interface BrowserWorker {
  execute(action: BrowserAction, target?: string): Promise<BrowserExecutionResult>;
  close(): Promise<void>;
}

// Used when MAXX_BROWSER_ENABLED=false. Every call returns an honest
// success:false result instead of hanging or fabricating a page.
export class UnavailableBrowserWorker implements BrowserWorker {
  constructor(private readonly reason: string) {}

  async execute(): Promise<BrowserExecutionResult> {
    return { success: false, url: null, error: this.reason, durationMs: 0 };
  }

  async close(): Promise<void> {}
}

const MAX_EXTRACTED_CONTENT_LENGTH = 20_000;

// Executes read-only browser actions (navigate/extract/screenshot) with a
// real Chromium instance via playwright-core - either a locally launched
// browser (default, fully testable in this sandbox) or a remote CDP
// endpoint (MAXX_BROWSER_WS_ENDPOINT, for a production browser farm; not
// exercised against a real remote endpoint here).
//
// "search" and every mutating action (submit_form, purchase, upload,
// delete, change_permissions, enter_sensitive_data, post, send_message)
// deliberately return success:false: each needs a target-specific
// integration (a configured search provider, a site's actual form/auth
// flow) that cannot be implemented generically without producing dishonest
// no-op "success" results.
export class PlaywrightBrowserWorker implements BrowserWorker {
  private browserPromise: Promise<Browser> | null = null;

  constructor(
    private readonly options: { wsEndpoint?: string; headless?: boolean; timeoutMs?: number; executablePath?: string },
  ) {}

  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      const { chromium } = await import("playwright-core");
      this.browserPromise = this.options.wsEndpoint
        ? chromium.connect(this.options.wsEndpoint, { timeout: this.options.timeoutMs ?? 30_000 })
        : chromium.launch({
            headless: this.options.headless ?? true,
            executablePath: this.options.executablePath,
          });
    }
    return this.browserPromise;
  }

  async execute(action: BrowserAction, target?: string): Promise<BrowserExecutionResult> {
    const startedAt = Date.now();
    if (action === "navigate" || action === "extract" || action === "screenshot") {
      if (!target) {
        return { success: false, url: null, error: `Action "${action}" requires a target URL`, durationMs: 0 };
      }
      let page;
      try {
        const browser = await this.getBrowser();
        const context = await browser.newContext();
        page = await context.newPage();
        await page.goto(target, { timeout: this.options.timeoutMs ?? 30_000, waitUntil: "domcontentloaded" });

        if (action === "screenshot") {
          const buffer = await page.screenshot({ type: "png" });
          await context.close();
          return {
            success: true,
            url: page.url(),
            screenshotBase64: buffer.toString("base64"),
            durationMs: Date.now() - startedAt,
          };
        }

        if (action === "extract") {
          const text = await page.innerText("body").catch(() => "");
          await context.close();
          return {
            success: true,
            url: page.url(),
            content: text.slice(0, MAX_EXTRACTED_CONTENT_LENGTH),
            durationMs: Date.now() - startedAt,
          };
        }

        await context.close();
        return { success: true, url: page.url(), durationMs: Date.now() - startedAt };
      } catch (error) {
        return {
          success: false,
          url: null,
          error: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - startedAt,
        };
      }
    }

    if (action === "search") {
      return {
        success: false,
        url: null,
        error: "search requires a configured search provider; not implemented generically",
        durationMs: 0,
      };
    }

    return {
      success: false,
      url: null,
      error: `Mutating browser action "${action}" requires a target-specific integration; not implemented generically`,
      durationMs: 0,
    };
  }

  async close(): Promise<void> {
    if (!this.browserPromise) return;
    const browser = await this.browserPromise;
    await browser.close();
    this.browserPromise = null;
  }
}

export function createBrowserWorker(config: {
  browserEnabled: boolean;
  wsEndpoint?: string;
  headless?: boolean;
  executablePath?: string;
}): BrowserWorker {
  return config.browserEnabled
    ? new PlaywrightBrowserWorker({
        wsEndpoint: config.wsEndpoint,
        headless: config.headless,
        executablePath: config.executablePath,
      })
    : new UnavailableBrowserWorker("MAXX_BROWSER_ENABLED is false");
}
