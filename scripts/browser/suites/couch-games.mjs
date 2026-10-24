import { selectNames } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot, finished, couchGuide }) {
/**
 * Every game in the couch catalog: its intro explains it (name, goal, controller diagram, a demo whose bot presses
 * something), and its bot then plays a real round through control() at the level a trip first schedules.
 */
async function couchGames() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const ids = await page.evaluate(async () => (await import('/src/couch/party.ts')).COUCH_IDS.slice());
  assert.ok(ids.length >= 9, 'the catalog has grown past the starting three');
  // COUCH_ONLY=peg-garden,bumper-garden plays just those games (a comma-separated list of ids).
  const picked = selectNames(process.env.COUCH_ONLY, ids, 'COUCH_ONLY');
  for (const id of picked) {
    // Every tier unlocked, a fresh together trip with this game chosen, nothing explained yet.
    await page.evaluate((id) => {
      localStorage.setItem('neo.couch.v1', JSON.stringify({ version: 2, trips: 30, stickers: {}, seen: [], party: { seed: 4242, mode: 'together', reroll: 0, turn: null, selected: id, rounds: [] } }));
    }, id);
    await page.reload(); await ready();
    await chooserEnter();
    await page.waitForFunction(() => neo.scene.screen === 'menu');
    await page.waitForTimeout(450);
    await page.getByRole('button', { name: /^Resume /, exact: false }).click();
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'intro');
    const name = await page.locator('.couch-how-screen h1').innerText();
    assert.equal(name, await page.evaluate(async (id) => (await import('/src/games/registry.ts')).couchGameById(id).name, id));
    assert.equal(await page.locator('.couch-how-screen svg.pad').count(), 1, `${id}: controller diagram`);
    assert.ok(await page.locator('.couch-rows li').count() >= 1, `${id}: control rows`);
    // A typing game's bot presses letter keys, which the arrows-Enter-Esc diagram does not show: its demo has to type instead.
    const typingGame = await page.evaluate(async (id) => !!(await import('/src/games/registry.ts')).couchGameById(id).typing, id);
    if (typingGame) await page.waitForFunction(() => neo.scene.demo?.game?.typist?.presses > 0, null, { timeout: 30000 });
    else {
      await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
      assert.ok(await page.locator('.pad .on').count() >= 1, `${id}: the diagram lights with the bot`);
    }
    assert.equal(await page.evaluate(() => document.querySelector('.couch-how-screen').scrollHeight <= document.querySelector('.couch-how-screen').clientHeight + 1), true, `${id}: the intro fits the screen`);
    await screenshot(`couch-catalog-${id}`);
    await page.waitForTimeout(450);
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(450);
    await page.evaluate(async () => {
      const g = neo.scene.game; let last = performance.now(); const start = last;
      while (neo.scene.game === g && !g.finished && performance.now() - start < 150000) {
        await new Promise(r => requestAnimationFrame(r));
        const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
        g.control(g.autoplay(dt), dt);
      }
      if (!g.finished) throw new Error('the bot did not finish its round');
    });
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'menu', null, { timeout: 20000 });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
    assert.equal(saved.party.rounds.length, 1, `${id}: one stop settled`);
    assert.equal(saved.party.rounds[0].id, id);
    assert.ok(saved.seen.includes(id), `${id}: marked explained`);
    assert.equal(Object.values(saved.stickers).reduce((n, s) => n + s.count, 0), 1);
    assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, `${id}: the child's save is untouched`);
    log(`Couch catalog: ${id}: intro, controller lighting, bot round and save passed`);
  }
  assert.deepEqual(errors, []);
  if (process.env.COUCH_ONLY === undefined) await couchGuide(ids);
}

return { couchGames };
}
