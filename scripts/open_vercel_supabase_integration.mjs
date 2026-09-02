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

  console.log('Navigating to Vercel macs-agent-portal settings/integrations...');
  await page.goto('https://vercel.com/pauli-4426s-projects/macs-agent-portal/integrations', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('Integrations URL:', page.url());
  console.log('Integrations Title:', await page.title());
  await page.screenshot({ path: 'scripts/vercel_integrations.png' });

  console.log('\nNavigating to Vercel Storage / Stores...');
  await page.goto('https://vercel.com/pauli-4426s-projects/macs-agent-portal/stores', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('Stores URL:', page.url());
  console.log('Stores Title:', await page.title());
  await page.screenshot({ path: 'scripts/vercel_stores.png' });

  console.log('\nNavigating to Vercel Environment Variables...');
  await page.goto('https://vercel.com/pauli-4426s-projects/macs-agent-portal/settings/environment-variables', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('Env vars URL:', page.url());
  await page.screenshot({ path: 'scripts/vercel_env_vars.png' });

  // Let's inspect text on stores / integrations
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\nEnv vars summary text preview:', bodyText.slice(0, 800));

  await context.close();
}

main().catch(console.error);
