import { chromium } from 'playwright-core';
import path from 'node:path';
import os from 'node:os';

const targetDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data Automation');

async function main() {
  const context = await chromium.launchPersistentContext(targetDataDir, {
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: [
      '--profile-directory=Profile 2',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = context.pages()[0] || await context.newPage();

  console.log('Navigating to Vercel login...');
  await page.goto('https://vercel.com/login?next=%2Fpauli-4426s-projects%2Fmacs-agent-portal%2Fstores', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await page.waitForTimeout(3000);

  const googleBtn = page.getByRole('button', { name: /Continue with Google/i }).or(page.locator('button:has-text("Continue with Google")'));
  if (await googleBtn.isVisible()) {
    console.log('Clicking Continue with Google on Vercel...');
    await googleBtn.click();
    await page.waitForTimeout(6000);
  }

  console.log('Current URL after Google login click:', page.url());
  console.log('Current Title:', await page.title());
  await page.screenshot({ path: 'scripts/vercel_after_google_click.png' });

  // If there's an account picker, select jointhepaulieffect@gmail.com
  const accountOption = page.locator('div[data-identifier="jointhepaulieffect@gmail.com"]').or(page.locator('text=jointhepaulieffect@gmail.com'));
  if (await accountOption.isVisible({ timeout: 4000 }).catch(() => false)) {
    console.log('Found jointhepaulieffect@gmail.com in account picker, clicking...');
    await accountOption.click();
    await page.waitForTimeout(6000);
    console.log('URL after account select:', page.url());
  }

  await page.screenshot({ path: 'scripts/vercel_login_result.png' });
  await context.close();
}

main().catch(console.error);
