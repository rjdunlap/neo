import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished }) {
/** Meadow Pens: level 1 with an empty ring (uncounted), a three-square pen for four (a miss), a requested hint and the supported finish; level 2 with one wrong card (the row-by-row fill); level 3 with a straight six (the wrong fence), a requested hint and a portrait screenshot; every other pen by real taps on the ghost finger's path. */
async function meadowPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('meadow-pens').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
  const settle = async () => { await page.waitForTimeout(300); await page.waitForFunction(() => neo.scene.finished || neo.scene.game.finished || !neo.scene.game.busy, null, { timeout: 30000 }); await page.waitForTimeout(250); };
  const tapCell = (x, y) => page.evaluate(async ({ x, y }) => {
    const L = await import('/src/games/meadow-pens/logic.ts');
    const g = neo.scene.game;
    const p = g.board.toGlobal(L.centre(L.cellRect(g.lay, L.cellOf(x, y))));
    kit.tap(p.x, p.y);
  }, { x, y });
  const ring = async () => { await page.evaluate(() => kit.tapOn(neo.scene.game.bell)); await settle(); };
  const playOut = async () => {
    for (let i = 0; i < 120; i++) {
      await settle();
      if (await page.evaluate(() => neo.scene.finished || neo.scene.game.finished)) break;
      await page.evaluate(() => {
        const g = neo.scene.game;
        const t = g.autotouch();
        if (!t) return;
        if (t.tap.on === g.board) { const p = g.board.toGlobal({ x: t.tap.x, y: t.tap.y }); kit.tap(p.x, p.y); }
        else kit.tapOn(t.tap.on);
      });
      await page.waitForTimeout(150);
    }
  };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await launch('meadow-pens', 1);
  await settle();
  await ring();
  assert.deepEqual(await tally(), [0, 0], 'an empty ring is free');
  for (const [x, y] of [[1, 1], [2, 1], [3, 1]]) { await tapCell(x, y); await page.waitForTimeout(120); }
  assert.equal(await page.evaluate(() => neo.scene.game.painted.length), 3);
  await ring();
  assert.deepEqual(await tally(), [1, 0], 'three squares for four is one miss');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(300);
  assert.deepEqual([...await tally(), await page.evaluate(() => neo.scene.game.tally.glowing)], [1, 1, true], 'Show a hint glows and counts once');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(200);
  assert.deepEqual(await tally(), [1, 1], 'asking again counts nothing');
  await page.evaluate(() => kit.tapOn(neo.scene.game.bell));
  await page.waitForFunction(() => neo.scene.game.index === 1 || neo.scene.finished, null, { timeout: 20000 });
  await playOut();
  await finished('meadow-pens');
  assert.deepEqual(await score(), [1, 1]);
  await launch('meadow-pens', 2);
  await settle();
  await page.evaluate(() => { const g = neo.scene.game; kit.tapOn(g.cards.find((c) => c.value !== g.task.field.right)); });
  await settle();
  assert.deepEqual(await tally(), [1, 0], 'a wrong card is one miss');
  assert.equal(await page.evaluate(() => neo.scene.game.painted.length), 6, 'the wrong card fills the field row by row');
  await playOut();
  await finished('meadow-pens');
  assert.deepEqual(await score(), [1, 0]);
  await launch('meadow-pens', 3);
  await settle();
  for (let x = 0; x < 6; x++) { await tapCell(x, 0); await page.waitForTimeout(120); }
  await ring();
  assert.deepEqual(await tally(), [1, 0], 'six in a line needs fourteen pieces, not ten: one miss');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(300);
  assert.deepEqual(await tally(), [1, 1]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('meadow-pens-3-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  await playOut();
  await finished('meadow-pens');
  assert.deepEqual(await score(), [1, 1]);
  log('Meadow Pens 1-3: empty ring free, short pen miss, requested glow and supported finish, wrong card fill, wrong fence miss, portrait, saved scores passed');
}

return { meadowPlay };
}
