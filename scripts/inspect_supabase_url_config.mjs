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

  console.log('Navigating to Supabase URL Configuration for project sxkemnqvxlgewrjplcag...');
  await page.goto('https://supabase.com/dashboard/project/sxkemnqvxlgewrjplcag/auth/url-configuration', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await page.waitForTimeout(4000);

  console.log('Current URL:', page.url());
  console.log('Page Title:', await page.title());

  await page.screenshot({ path: 'scripts/supabase_url_config.png' });
  console.log('Screenshot saved to scripts/supabase_url_config.png');

  // Let's inspect form inputs
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, textarea, button')).map(el => ({
      tagName: el.tagName,
      id: el.id,
      name: el.name,
      type: el.type,
      value: el.value,
      placeholder: el.placeholder,
      text: el.innerText,
      ariaLabel: el.getAttribute('aria-label')
    }));
  });
  console.log('Found inputs and controls:', JSON.stringify(inputs, null, 2));

  await context.close();
}

main().catch(console.error);
