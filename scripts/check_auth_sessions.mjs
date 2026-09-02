import { chromium } from 'playwright-core';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const sourceDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
const targetDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data Automation');

async function main() {
  console.log('Preparing automation profile directory...');
  fs.mkdirSync(targetDataDir, { recursive: true });

  // Copy Local State
  if (fs.existsSync(path.join(sourceDataDir, 'Local State'))) {
    fs.copyFileSync(path.join(sourceDataDir, 'Local State'), path.join(targetDataDir, 'Local State'));
  }

  // Copy Default folder with robocopy
  const srcDefault = path.join(sourceDataDir, 'Default');
  const dstDefault = path.join(targetDataDir, 'Default');
  try {
    execSync(`robocopy "${srcDefault}" "${dstDefault}" /E /XD "Cache" "Code Cache" "DawnGraphiteCache" "DawnWebGPUCache" "CacheStorage" "GPUCache" /XF "*.tmp" /R:1 /W:1 /NFL /NDL /NJH /NJS`, { stdio: 'ignore' });
  } catch (e) {
    // robocopy returns non-zero on success
  }

  console.log('Launching Chrome with cloned profile...');
  const context = await chromium.launchPersistentContext(targetDataDir, {
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled']
  });

  const page = context.pages()[0] || await context.newPage();

  console.log('1. Checking Vercel login state...');
  await page.goto('https://vercel.com/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('Vercel URL:', page.url());
  console.log('Vercel Title:', await page.title());

  console.log('2. Checking Supabase projects...');
  await page.goto('https://supabase.com/dashboard/projects', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('Supabase URL:', page.url());
  console.log('Supabase Title:', await page.title());

  await context.close();
}

main().catch(console.error);
