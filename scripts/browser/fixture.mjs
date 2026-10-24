import { createTestContext } from '../test-browser.mjs';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
// The island game is served at `classic/`; the site root is the creature-world rework. A bare origin gets `classic/`.
const islandUrl = (url) => (new URL(url).pathname === '/' ? new URL('classic/', url).href : url);

export async function createFixture(browser, suite) {
const output = `test-results/browser/${suite}`;
await mkdir(output, { recursive: true });
const context = await createTestContext(browser, { viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' });
try {
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => { errors.push(error.message); console.error('PAGE ERROR', error.stack?.split('\n').slice(0, 7).join('\n')); });
const log = (message) => console.log(new Date().toISOString(), message);
// Every suite but `howto` plays games straight away; the first-visit how-to card is that suite's subject (a reload brings the setting back, so it is set after each).
const frame = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const ready = async () => {
  await page.waitForFunction(() => window.neo?.scene && !neo.switching && window.kit);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await frame();
};
const scene = async (name) => {
  await page.waitForFunction(name => neo.scene.constructor.name === name && !neo.switching, name);
  await frame();
};
/** The first card on "Who's playing?": a tap opens the island as that person. */
const pickFirst = () => page.locator('.chooser__play').first().click();
/** A brand-new device: Add a player fills in the one blank profile (born in January last year, so the lap band). */
const addFirstPlayer = async (name = 'Mia') => {
  await scene('ChooserScene');
  await page.locator('.chooser__add').click();
  await page.fill('#add-name', name);
  await page.selectOption('#add-month', '1');
  await page.fill('#add-year', String(new Date().getFullYear() - 1));
  await page.locator('.parent button[type=submit]').click();
};
/** Enter on the focused card is couch play. A new scene ignores input for 0.35 s, so wait that out first. */
const chooserEnter = async () => {
  await scene('ChooserScene');
  await page.locator('.chooser__play').first().waitFor();
  await page.waitForTimeout(500);
  await page.keyboard.down('Enter'); await page.waitForTimeout(150); await page.keyboard.up('Enter');
};
const tap = async (expression) => {
  await page.evaluate((expression) => { const obj = Function(`return (${expression})`)(); kit.tapOn(obj); }, expression);
  await page.waitForTimeout(180);
};
const screenshot = (name) => page.screenshot({ path: `${output}/${name}.png` });
/** A full land shows a page at a time: tap its arrows until the game stands on the page (back to the first, then on). */
async function turnToGame(id) {
  while (await page.evaluate(() => neo.scene.prevArrow?.visible)) { await tap('neo.scene.prevArrow'); await page.waitForTimeout(350); }
  while (await page.evaluate((id) => !neo.scene.showing.some((m) => m.mod.id === id) && neo.scene.nextArrow?.visible, id)) { await tap('neo.scene.nextArrow'); await page.waitForTimeout(350); }
}
async function launch(id, level, childName = 'Mia', playBand) {
  await ready();
  await page.evaluate(async ({ id, level, childName, playBand }) => {
    const { gameById } = await import('/src/games/registry.ts');
    const { levelsInOrder } = await import('/src/progress/difficulty.ts');
    const mod = gameById(id);
    if (!mod) throw new Error(`Unknown game: ${id}`);
    // A band's levels are the ones in its order (which may skip IDs), not everything from min to max.
    const band = playBand ?? mod.bands.find((candidate) => levelsInOrder(mod.levels(candidate)).includes(level));
    if (!band || !levelsInOrder(mod.levels(band)).includes(level)) throw new Error(`${id}: unavailable level ${level}`);
    kit.store.entry.birth = null; kit.store.entry.startBand = band;
    kit.store.data.profile.band = band;
    kit.store.data.profile.name = childName;
    kit.store.stats(id).pinned = level;
    neo.go.game(id, band);
  }, { id, level, childName, playBand });
  await page.waitForFunction(({ id, level }) => !neo.switching && neo.scene.mod?.id === id && neo.scene.level === level && !neo.scene.finished, { id, level });
  await frame();
}
async function finished(id) {
  await page.waitForFunction(() => neo.scene.finished === true, null, { timeout: 30000 });
  assert.equal(await page.evaluate((id) => kit.store.data.stickers.at(-1).game, id), id);
  assert.equal(errors.length, 0, errors.join('\n'));
}
return { page, browser, context, errors, output, islandUrl, log, ready, scene, pickFirst, addFirstPlayer, chooserEnter, tap, screenshot, turnToGame, launch, finished };
} catch (error) {
  await context.close();
  throw error;
}
}
