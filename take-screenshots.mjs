import { chromium } from '@playwright/test';
import { mkdir } from 'fs/promises';

const BASE = 'http://localhost:5174';
const OUT  = './docs/screenshots';

async function go() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx     = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page    = await ctx.newPage();

  // 1. Dashboard top
  await page.goto(BASE);
  await page.waitForTimeout(5500);
  await page.screenshot({ path: `${OUT}/01-dashboard.png` });
  console.log('✓ dashboard');

  // 2. Dashboard scrolled — endpoints + chart
  await page.evaluate(() => window.scrollBy(0, 480));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/02-dashboard-lower.png` });
  console.log('✓ dashboard-lower');

  // 3. Endpoint detail — diffs tab
  const epLink = page.locator('a[href^="/endpoints/"]').first();
  await epLink.click();
  await page.waitForTimeout(4500);
  await page.screenshot({ path: `${OUT}/03-endpoint-detail.png` });
  console.log('✓ endpoint-detail');

  // 4. Schema tab (use exact button)
  await page.getByRole('button', { name: 'Schema' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/04-schema-viewer.png` });
  console.log('✓ schema-viewer');

  // 5. Diff History
  await page.goto(`${BASE}/diffs`);
  await page.waitForTimeout(4500);
  await page.screenshot({ path: `${OUT}/05-diff-history.png` });
  console.log('✓ diff-history');

  await browser.close();
  console.log('All screenshots saved to', OUT);
}
go().catch(e => { console.error(e.message); process.exit(1); });
