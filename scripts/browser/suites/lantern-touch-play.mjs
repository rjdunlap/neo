import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
async function lanternTouchPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, index: g.index, ponds: g.ponds.length, lit: g.lit.filter(Boolean).length, presses: g.presses, hinted: g.hinted, misses: g.misses, hints: g.hints, n: g.n }; });
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 15000 });
  /** Tap the lantern a fewest-press way wants next, with a real touch on the pond. */
  const tapNext = async () => {
    await idle();
    await page.evaluate(async () => {
      const g = neo.scene.game, { hintFor } = await import('/src/games/lantern-lights/logic.ts');
      const at = g.center(hintFor(g.lit, g.n, g.cursor)), p = g.board.toGlobal(at);
      kit.tap(p.x, p.y);
    });
    await page.waitForTimeout(150);
  };
  const solveAll = async () => { for (let guard = 0; guard < 400 && !(await page.evaluate(() => neo.scene.finished)); guard++) await tapNext(); };
  // Level 1 (first): a tap that is not in the answer is free and can be taken back; a hint counts once; start over; then light every pond.
  await launch('lantern-lights', 1); await idle();
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  let st = await state();
  assert.equal(st.n, 3);
  const before = st.lit;
  await page.evaluate(() => { const g = neo.scene.game, p = g.board.toGlobal(g.center(g.n * g.n - 1)); kit.tap(p.x, p.y); });
  await page.waitForTimeout(400);
  st = await state(); assert.equal(st.presses, 1, 'a tap on a lantern is one press');
  await tap('neo.scene.game.undoButton'); await page.waitForTimeout(400);
  st = await state(); assert.equal(st.lit, before, 'undo puts the lanterns back'); assert.equal(st.misses, 0);
  await tap('neo.scene.game.hintButton');
  st = await state(); assert.deepEqual([st.hints, st.hinted !== null], [1, true]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  await screenshot('lantern-lights-1-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  await tap('neo.scene.game.againButton'); await page.waitForTimeout(500);
  await solveAll(); await finished('lantern-lights');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1);
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('lantern-lights').history.at(-1); return [r.misses, r.hints]; }), [0, 1]);
  // Level 6 (last): the biggest pond, solved by touch alone, no help.
  await launch('lantern-lights', 6); await idle();
  assert.ok((await state()).n >= 4);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  await screenshot('lantern-lights-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  await screenshot('lantern-lights-6-landscape');
  await solveAll(); await finished('lantern-lights');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('lantern-lights').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // Opening it from Lantern Lake plays it here, by touch; leaving mid-round is quiet.
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; neo.go.land('lantern-lake'); }); await scene('LandScene');
  await page.evaluate(() => neo.go.game('lantern-lights', 'grownup', undefined, false, 'lantern-lake')); await scene('GameScene'); await idle();
  await tapNext(); await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene'); await page.waitForTimeout(700);
  // (A puzzle that takes only a controller would open its couch puzzle-shelf course from the island; Pond Conga, the last, now plays by touch.)
  await page.evaluate(() => neo.go.hub()); await scene('MapScene');
  assert.deepEqual(errors, []);
  log('Lantern Lights touch: first and last level, a free tap and undo, one hint, start over, one sticker each, portrait and leaving mid-round passed');
}

return { lanternTouchPlay };
}
