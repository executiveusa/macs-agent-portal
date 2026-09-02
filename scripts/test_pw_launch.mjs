import { chromium } from 'playwright-core';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const testDir = path.join(os.tmpdir(), 'pw-chrome-profile-' + Date.now());
fs.mkdirSync(testDir, { recursive: true });

async function main() {
  console.log('Launching Chrome with Playwright persistent context...');
  const context = await chromium.launchPersistentContext(testDir, {
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false
  });
  console.log('Successfully launched Chrome!');
  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://example.com');
  console.log('Navigated to example.com, title:', await page.title());
  await context.close();
  fs.rmSync(testDir, { recursive: true, force: true });
}

main().catch(console.error);
