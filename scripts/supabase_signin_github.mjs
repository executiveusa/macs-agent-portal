import { chromium } from 'playwright-core';
import path from 'node:path';
import os from 'node:os';

const targetDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data Automation');

async function main() {
  const context = await chromium.launchPersistentContext(targetDataDir, {
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled']
  });

  const page = context.pages()[0] || await context.newPage();

  console.log('Navigating to Supabase sign-in with returnTo...');
  await page.goto('https://supabase.com/dashboard/sign-in?returnTo=%2Fproject%2Fsxkemnqvxlgewrjplcag%2Fauth%2Furl-configuration', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await page.waitForTimeout(3000);

  console.log('Checking for Continue with GitHub button...');
  const githubBtn = page.getByRole('button', { name: /Continue with GitHub/i });
  if (await githubBtn.isVisible()) {
    console.log('Clicking Continue with GitHub...');
    await githubBtn.click();
    await page.waitForTimeout(6000);
  }

  console.log('Current URL after GitHub click:', page.url());
  console.log('Current Title:', await page.title());
  await page.screenshot({ path: 'scripts/after_github_click.png' });

  await context.close();
}

main().catch(console.error);
