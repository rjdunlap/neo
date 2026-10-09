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
const writeSave = (value) => page.evaluate((value) => new Promise((resolve, reject) => {
  const open = indexedDB.open('keyval-store', 1);
  open.onerror = () => reject(open.error);
  open.onsuccess = () => {
    const db = open.result, tx = db.transaction('keyval', 'readwrite');
    tx.objectStore('keyval').put(value, 'neo.save');
    tx.oncomplete = () => { resolve(); db.close(); };
    tx.onerror = () => { reject(tx.error); db.close(); };
  };
}), value);

const fromStart = async (target, afterTarget) => {
  await page.waitForFunction(() => document.fonts.status === 'loaded');
  await page.waitForTimeout(1600);
  await page.mouse.click(512, 308); await page.waitForTimeout(4200);
  await page.mouse.click(65, 65); await page.waitForTimeout(2800);
  await page.mouse.click(target.x, target.y); await page.waitForTimeout(afterTarget);
};

/** A production scene has no dev test API. Prove the route by the save change it alone makes, with one recovery
 * from a Start/place transition whose curtain intentionally swallowed a fixed-coordinate click. */
const findBlanketOffline = async () => {
  for (let attempt = 0; attempt < 2; attempt++) {
    await fromStart({ x: 842, y: 550 }, 3400);
    await page.screenshot({ path: 'test-results/offline/picnic.png' });
    for (const [x, y] of [[96, 296], [216, 320], [539, 354], [680, 353], [288, 426], [388, 418]]) {
      await page.mouse.click(x, y); await page.waitForTimeout(900);
      if ((await readSave()).stories?.picnic?.steps?.includes('blanket')) return;
    }
    if (attempt === 0) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('canvas').waitFor();
    }
  }
};

const openRoomAndJournalOffline = async (roomShot, journalShot) => {
  for (let attempt = 0; attempt < 2; attempt++) {
    await fromStart({ x: 75, y: 698 }, 1800);
    await page.screenshot({ path: roomShot });
    await page.mouse.click(719, 698); await page.waitForTimeout(1600);
    const journal = (await readSave()).journal;
    if (journal.found.length > 0 && journal.seen === journal.found.length) {
      await page.screenshot({ path: journalShot });
      return;
    }
    if (attempt === 0) {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('canvas').waitFor();
    }
  }
};

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
      tx.objectStore('keyval').put({
        version: 2,
        profile: { name: 'Mia', band: 'toddler' },
        pet: { name: 'Clover', color: 'pink', hatched: true },
        world: { band: 'toddler' },
        settings: { placeLayout: 'subjects', volume: 0.2, music: false, coplayHints: false },
        games: { 'monster-munch': { plays: 0, level: 2, pinned: 2, history: [] } },
        stickers: [],
        room: {
          items: [
            { id: 'bed', x: 0.78, y: 0.82, flip: true },
            { id: 'lamp', x: 0.34, y: 0.72, flip: false },
            { id: 'rug', x: 0.5, y: 0.8, flip: false },
            { id: 'shelf', x: 0.85, y: 0.76, flip: false },
            { id: 'plant', x: 0.68, y: 0.74, flip: false },
            { id: 'musicbox', x: 0.52, y: 0.9, flip: false },
          ],
          frame: null,
        },
        creations: {
          picture: { current: { kind: 'picture', stamps: [{ kind: 'star', color: 'pink', x: 0.25, y: 0.4, size: 1.5, turns: 1 }] }, previous: null },
          tune: { current: { kind: 'tune', cols: 4, rows: 3, notes: [{ col: 0, row: 0 }, { col: 2, row: 2 }] }, previous: null },
        },
        journal: { found: ['sink-float:duck', 'animal-snack:bunny'], seen: 0 },
      }, 'neo.save');
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
  // The start button leads straight to her place on the trail: Daisy Meadow for a toddler.
  // Start waits for its greeting before changing scenes; allow the production/offline frame loop to finish the
  // transition before paging through the place (a click during the curtain is intentionally swallowed).
  await page.mouse.click(512, 308); await page.waitForTimeout(4000);
  await page.screenshot({ path: 'test-results/offline/place.png' });
  // Four subject cards per page. Counting Cove is first on page two; Monster Munch
  // is its second game. Subject-local positions survive growth in earlier subjects.
  await page.mouse.click(959, 384); await page.waitForTimeout(700);
  await page.mouse.click(342, 290); await page.waitForTimeout(700);
  await page.screenshot({ path: 'test-results/offline/counting-cove.png' });
  await page.mouse.click(682, 290); await page.waitForTimeout(2000);
  // Every game opens on its how-to card, and Play starts the round (Monster Munch has no bot, so its card is text only).
  await page.screenshot({ path: 'test-results/offline/monster-munch-howto.png' });
  await page.mouse.click(574, 640); await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/offline/monster-munch.png' });
  // Counting along: tapping each cookie on the tray feeds it.
  for (let attempt = 0; attempt < 20; attempt++) {
    await page.mouse.click([327, 452, 577, 702, 827][attempt % 5], 678);
    await page.waitForTimeout(700);
    if ((await readSave())?.stickers?.length) break;
  }
  const save = await readSave();
  assert.equal(save?.stickers?.[0]?.game, 'monster-munch', 'Finished a new minigame while offline');
  assert.equal(save.games['monster-munch'].plays, 1);
  assert.equal(save.pet.name, 'Clover');
  assert.equal(save.settings.howToCards, true, 'An older save gets the cards on');
  assert.equal(save.settings.placeLayout, 'subjects');
  assert.deepEqual(save.world, { band: 'toddler' });
  await page.waitForTimeout(1700);
  await page.screenshot({ path: 'test-results/offline/reward.png' });
  // The seeded save predates island stories: loading it added the Windy Picnic, untold.
  assert.deepEqual(save.stories, { picnic: { steps: [], ended: false, keepsake: false } });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('canvas').waitFor();
  assert.equal((await readSave()).stickers.length, 1, 'Offline progress survived reload');
  assert.equal(await page.evaluate(() => typeof window.kit), 'undefined', 'Dev helper excluded from production');
  // Offline, the picnic opens from the map, and a step found there is kept across a reload. The striped blanket
  // is in one of six spots (two on each of the tree, the clothesline and the bush); try each until it's found.
  await findBlanketOffline();
  assert.deepEqual((await readSave()).stories.picnic.steps, ['blanket'], 'Found the blanket offline');
  await page.waitForTimeout(1500);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('canvas').waitFor();
  assert.deepEqual((await readSave()).stories.picnic, { steps: ['blanket'], ended: false, keepsake: false }, 'The story step survived an offline reload');
  // Open the public treehouse and journal routes while offline. The rearranged room, both kept creations and the
  // discoveries came from the old public save above, not dev helpers, and must still be there after production reloads.
  await openRoomAndJournalOffline('test-results/offline/treehouse.png', 'test-results/offline/journal.png');
  const roomSave = await readSave();
  assert.deepEqual(roomSave.room.items.find((item) => item.id === 'bed'), { id: 'bed', x: 0.78, y: 0.82, flip: true }, 'The rearranged bed loaded offline');
  assert.equal(roomSave.creations.picture.current.stamps[0].kind, 'star', 'The kept picture loaded offline');
  assert.deepEqual(roomSave.creations.tune.current.notes, [{ col: 0, row: 0 }, { col: 2, row: 2 }], 'The kept tune loaded offline');
  assert.deepEqual((await readSave()).journal, { found: ['sink-float:duck', 'animal-snack:bunny'], seen: 2 }, 'Opening the journal offline keeps and marks its discoveries seen');
  // Reset only the looked-at marker in the public save. Opening the journal after the next reload must advance it
  // again; comparing an unchanged save would not prove that the room and journal UI actually opened twice.
  const beforeJournalReload = await readSave();
  beforeJournalReload.journal.seen = 0;
  await writeSave(beforeJournalReload);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('canvas').waitFor();
  await openRoomAndJournalOffline('test-results/offline/treehouse-reloaded.png', 'test-results/offline/journal-reloaded.png');
  const reloadedRoom = await readSave();
  assert.deepEqual(reloadedRoom.room, roomSave.room, 'The rearranged room survived another offline reload');
  assert.deepEqual(reloadedRoom.creations, roomSave.creations, 'Both creations survived another offline reload');
  assert.deepEqual(reloadedRoom.journal, { found: ['sink-float:duck', 'animal-snack:bunny'], seen: 2 }, 'The journal survived another offline reload');
  assert.deepEqual(errors, []);
  console.log(`PASS: production reload, cached font and assets (${assets.length}), trail navigation, a how-to card and Play, new-game completion, reward, saved progress, the Windy Picnic, a rearranged treehouse with kept creations, and the discovery journal work offline and survive reloads.`);
} catch (error) {
  await page.screenshot({ path: 'test-results/offline/failure.png' });
  console.error(error); console.error('Page errors:', errors); process.exitCode = 1;
} finally { await browser.close(); }
