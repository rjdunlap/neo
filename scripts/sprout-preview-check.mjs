import { launchTestBrowser, createTestContext } from './test-browser.mjs';
import assert from 'node:assert/strict';
const browser = await launchTestBrowser();
const context = await createTestContext(browser, { viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(
  `${process.env.GAME_URL || 'http://localhost:5194'}/art-lab/?view=${process.env.LAB_VIEW || '3d'}`,
);
await page.waitForSelector('body[data-ready="true"]');
await page.locator('#wave').click();
await page.waitForTimeout(500);
assert.match(await page.locator('#status').innerText(), /Hello/);
await page.screenshot({ path: `test-results/sprout-${process.env.LAB_VIEW || '3d'}-portrait.png` });
await page.locator('#ball').click();
assert.match(await page.locator('#status').innerText(), /nudge/);
await page.waitForTimeout(2800);
await page.setViewportSize({ width: 1000, height: 700 });
await page.screenshot({ path: `test-results/sprout-${process.env.LAB_VIEW || '3d'}-landscape.png` });
assert.deepEqual(errors, []);
console.log((await page.locator('#readout').innerText()).replace(/\n/g, ' | '));
console.log('PASS portrait hello, ball response, landscape resize; no page errors');
await browser.close();
