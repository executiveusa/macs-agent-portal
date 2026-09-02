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

  console.log('Navigating to Google Accounts to check listed accounts...');
  await page.goto('https://accounts.google.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('Google Accounts URL:', page.url());
  console.log('Google Accounts Title:', await page.title());
  await page.screenshot({ path: 'scripts/google_accounts_page.png' });

  const text = await page.evaluate(() => document.body.innerText);
  console.log('Google Accounts Text:', text.slice(0, 1000));

  await context.close();
}

main().catch(console.error);
