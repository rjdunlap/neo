import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('test-results/offline', { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
// This uses the public save format and IndexedDB, never the dev-only game helpers.
const readSave = () => page.evaluate(() => new Promise((resolve, reject) => {
  const open = indexedDB.open('keyval-store', 1);
  open.onerror = () => reject(open.error);
  open.onsuccess = () => {
    const db = open.result, request = db.transaction('keyval').objectStore('keyval').get('neo.save');
    request.onsuccess = () => { resolve(request.result); db.close(); };
    request.onerror = () => { reject(request.error); db.close(); };
  };
}));

try {
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:4173');
  await page.locator('canvas').waitFor();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.evaluate(() => new Promise((resolve, reject) => {
    const open = indexedDB.open('keyval-store', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('keyval');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result, tx = db.transaction('keyval', 'readwrite');
      tx.objectStore('keyval').put({ version: 2, profile: { name: 'Mia', band: 'toddler' }, pet: { name: 'Clover', color: 'pink', hatched: true }, world: { opened: [], band: null }, settings: { sessionMinutes: 0, volume: 0.2, music: false, coplayHints: false }, games: { 'size-parade': { plays: 0, level: 1, pinned: 1, history: [] } }, stickers: [] }, 'neo.save');
      tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error);
    };
  }));
  const assets = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async (name) => (await (await caches.open(name)).keys()).map((r) => r.url)))).flat());
  assert.ok(assets.some((url) => url.includes('.woff2')), 'Font cached');
  assert.ok(assets.some((url) => url.includes('.js')), 'Game bundle cached');
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('canvas').waitFor();
  await page.waitForFunction(() => document.fonts.status === 'loaded');
  await page.waitForTimeout(1400);
  await page.mouse.click(512, 308); await page.waitForTimeout(2800);
  await page.screenshot({ path: 'test-results/offline/map.png' });
  await page.mouse.click(512, 165); await page.waitForTimeout(2300);
  await page.mouse.click(512, 620); await page.waitForTimeout(1400);
  await page.screenshot({ path: 'test-results/offline/size-parade.png' });
  for (let attempt = 0; attempt < 24; attempt++) {
    await page.mouse.click([487, 662][attempt % 2], 625);
    await page.waitForTimeout(1000);
    if ((await readSave())?.stickers?.length) break;
  }
  const save = await readSave();
  assert.equal(save?.stickers?.[0]?.game, 'size-parade', 'Finished a new minigame while offline');
  assert.equal(save.games['size-parade'].plays, 1);
  assert.equal(save.pet.name, 'Clover');
  assert.equal(save.world.opened.length, 10);
  await page.waitForTimeout(1700);
  await page.screenshot({ path: 'test-results/offline/reward.png' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('canvas').waitFor();
  assert.equal((await readSave()).stickers.length, 1, 'Offline progress survived reload');
  assert.equal(await page.evaluate(() => typeof window.kit), 'undefined', 'Dev helper excluded from production');
  assert.deepEqual(errors, []);
  console.log(`PASS: production reload, cached font and assets (${assets.length}), map navigation, new-game completion, reward, and saved progress work offline.`);
} catch (error) {
  await page.screenshot({ path: 'test-results/offline/failure.png' });
  console.error(error); console.error('Page errors:', errors); process.exitCode = 1;
} finally { await browser.close(); }
