import { chromium } from 'playwright-core';
import path from 'node:path';
import os from 'node:os';

const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data Debug');
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  console.log('Testing Playwright browser session...');
  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath,
    headless: false,
    ignoreDefaultArgs: ['--remote-debugging-pipe'],
    args: [
      '--disable-blink-features=AutomationControlled',
      '--remote-allow-origins=*'
    ]
  });

  const page = context.pages()[0] || await context.newPage();

  console.log('Navigating to Vercel dashboard to check session...');
  await page.goto('https://vercel.com/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  console.log('Vercel Current URL:', page.url());
  console.log('Vercel Page Title:', await page.title());

  console.log('Navigating to Supabase dashboard to check session...');
  await page.goto('https://supabase.com/dashboard/projects', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  console.log('Supabase Current URL:', page.url());
  console.log('Supabase Page Title:', await page.title());

  await context.close();
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
