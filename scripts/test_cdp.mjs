import { chromium } from 'playwright-core';

async function main() {
  console.log('Connecting to Chrome over CDP on 127.0.0.1:9222...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  console.log('Connected! Contexts:', browser.contexts().length);
  const context = browser.contexts()[0];
  const pages = context.pages();
  console.log('Open pages:', pages.length);
  for (const page of pages) {
    console.log(' - URL:', page.url(), 'Title:', await page.title());
  }

  const page = pages[0] || await context.newPage();
  console.log('Navigating to Vercel...');
  await page.goto('https://vercel.com/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('Current Vercel URL:', page.url());
  console.log('Current Vercel Title:', await page.title());
}

main().catch(console.error);
