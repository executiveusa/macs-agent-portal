import { chromium } from 'playwright-core';
import path from 'node:path';
import os from 'node:os';

const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data Debug');
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  console.log('Launching browser with persistent context from:', userDataDir);
  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath,
    headless: false,
    args: ['--remote-debugging-port=9222', '--remote-allow-origins=*']
  });
  console.log('Browser launched successfully!');
  const page = context.pages()[0] || await context.newPage();
  await page.goto('http://127.0.0.1:9222/json/version');
  const text = await page.textContent('body');
  console.log('Port 9222 response:', text);
  
  // Keep running so Chrome DevTools MCP can connect and operate
  console.log('Keeping browser running for automation...');
  await new Promise(() => {});
}

main().catch(err => {
  console.error('Launch failed:', err);
  process.exit(1);
});
