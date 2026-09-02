import { chromium } from 'playwright-core';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const sourceDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
const targetDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data Automation');

async function testProfile(profileName) {
  console.log(`\n========================================`);
  console.log(`TESTING PROFILE: ${profileName}`);
  console.log(`========================================`);

  // Copy profile
  const src = path.join(sourceDataDir, profileName);
  const dst = path.join(targetDataDir, profileName);
  fs.mkdirSync(dst, { recursive: true });
  try {
    execSync(`robocopy "${src}" "${dst}" /E /XD "Cache" "Code Cache" "DawnGraphiteCache" "DawnWebGPUCache" "CacheStorage" "GPUCache" /XF "*.tmp" /R:1 /W:1 /NFL /NDL /NJH /NJS`, { stdio: 'ignore' });
  } catch (e) {}

  const context = await chromium.launchPersistentContext(targetDataDir, {
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: [
      `--profile-directory=${profileName}`,
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = context.pages()[0] || await context.newPage();

  console.log('Checking Vercel...');
  await page.goto('https://vercel.com/pauli-4426s-projects/macs-agent-portal', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(e => console.log('Vercel nav error:', e.message));
  await page.waitForTimeout(3000);
  console.log(`[${profileName}] Vercel URL:`, page.url());
  console.log(`[${profileName}] Vercel Title:`, await page.title());

  console.log('Checking Supabase...');
  await page.goto('https://supabase.com/dashboard/project/sxkemnqvxlgewrjplcag', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(e => console.log('Supabase nav error:', e.message));
  await page.waitForTimeout(3000);
  console.log(`[${profileName}] Supabase URL:`, page.url());
  console.log(`[${profileName}] Supabase Title:`, await page.title());

  await context.close();
}

async function main() {
  // Ensure Local State is in targetDataDir
  if (fs.existsSync(path.join(sourceDataDir, 'Local State'))) {
    fs.copyFileSync(path.join(sourceDataDir, 'Local State'), path.join(targetDataDir, 'Local State'));
  }

  for (const prof of ['Profile 2', 'Default', 'Profile 3', 'Profile 1']) {
    try {
      await testProfile(prof);
    } catch (err) {
      console.error(`Error testing ${prof}:`, err.message);
    }
  }
}

main().catch(console.error);
