import { chromium } from 'playwright-core';
import path from 'node:path';
import os from 'node:os';

const userDataDir = 'C:\\Users\\execu\\AppData\\Local\\Google\\Chrome\\User Data';
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  console.log('Launching persistent context on primary user data dir...');
  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath,
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled']
  });

  const page = context.pages()[0] || await context.newPage();

  console.log('\n--- Phase 1: Checking Vercel Project ---');
  await page.goto('https://vercel.com/pauli-4426s-projects/macs-agent-portal', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await page.waitForTimeout(3000);
  console.log('Vercel Project Page URL:', page.url());
  console.log('Vercel Project Page Title:', await page.title());
  await page.screenshot({ path: 'scripts/vercel_project_page.png' });

  console.log('\n--- Phase 2: Checking Supabase Project ---');
  await page.goto('https://supabase.com/dashboard/project/sxkemnqvxlgewrjplcag', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await page.waitForTimeout(4000);
  console.log('Supabase Project Page URL:', page.url());
  console.log('Supabase Project Page Title:', await page.title());
  await page.screenshot({ path: 'scripts/supabase_project_page.png' });

  console.log('\n--- Phase 3: Checking Supabase Auth URL Config ---');
  await page.goto('https://supabase.com/dashboard/project/sxkemnqvxlgewrjplcag/auth/url-configuration', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await page.waitForTimeout(4000);
  console.log('Supabase Auth URL Config URL:', page.url());
  console.log('Supabase Auth URL Config Title:', await page.title());
  await page.screenshot({ path: 'scripts/supabase_auth_url_config.png' });

  await context.close();
}

main().catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
