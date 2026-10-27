import { createTestContext } from '../test-browser.mjs';
import { publicSave, waitForSave } from './storage.mjs';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

/** Production-only proof: use real canvas clicks, the visible Home link and public IndexedDB, never neo/kit. */
export async function rootOffline(browser) {
  const context = await createTestContext(browser, { viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const output = 'test-results/offline/root';
  await mkdir(output, { recursive: true });
  const { read, write } = publicSave(page);
  try {
    await page.goto(new URL('/', process.env.GAME_URL || 'http://localhost:4173').href);
    await page.locator('.chooser__add').waitFor();
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await write({
      version: 3, profile: { name: 'Offline Mia', band: 'toddler' }, world: { band: 'toddler' },
      creatures: { owned: [{ id: 'clvr', species: 'sprout', name: 'Clover', look: { color: 'pink', worn: [] }, metAt: 'start' }], companion: 'clvr' },
      settings: { speech: false, music: false }, explore: { last: null },
      games: {}, stickers: [{ game: 'bubble-pop', seed: 7, at: 1 }],
    });
    await context.setOffline(true);
    const visit = async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('.chooser__play').first().click();
      await page.locator('.classic-link').waitFor({ state: 'visible' });
      await page.waitForFunction(() => document.fonts.status === 'loaded');
      // Production has no scene API. Allow the 0.35 s curtain to settle after the DOM link becomes visible.
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${output}/home.png` });
      // At 1024×768: toddler Home Explore, Explore Places, then Counting Cove's place card.
      await page.mouse.click(914, 403); await page.waitForTimeout(1400);
      await page.locator('.classic-link').waitFor({ state: 'hidden' });
      await page.mouse.click(282, 197); await page.waitForTimeout(2200);
      await page.screenshot({ path: `${output}/places.png` });
      await page.mouse.click(397, 200);
      await waitForSave(read, save => save?.explore?.last === 'counting-cove', 'Root navigation did not persist Counting Cove while offline');
    };
    await visit();
    const first = await read();
    assert.equal(first.profile.name, 'Offline Mia');
    assert.equal(first.creatures.companion, 'clvr');
    assert.equal(first.stickers.length, 1);
    assert.equal(first.stickers[0].seed, 7);
    assert.deepEqual(first.games, {}, 'navigation creates no round progress');
    await page.screenshot({ path: `${output}/counting-cove.png` });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.chooser__play').first().waitFor();
    assert.equal((await read()).explore.last, 'counting-cove', 'root location survives an offline reload');
    // Remove only the marker so a second real visit must write it again, rather than reading stale evidence.
    await write({ ...first, explore: { ...first.explore, last: null } });
    await visit();
    const again = await read();
    assert.deepEqual(again.stickers, first.stickers);
    assert.deepEqual(again.creatures, first.creatures);
    assert.equal(await page.evaluate(() => typeof window.kit), 'undefined');
    assert.equal(await page.evaluate(() => typeof window.neo), 'undefined');
    assert.deepEqual(errors, []);
    console.log('PASS: production root Home → Explore → Counting Cove offline twice; location and owned progress survive reload.');
  } catch (error) {
    await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
    throw error;
  } finally { await context.close(); }
}
