import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function logicGridPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('logic-grid').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);
  const idle = () => page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 30000 });
  // Taps a grid square through its real control.
  const tapSquare = (i) => page.evaluate((i) => { const g = neo.scene.game; kit.tapOn(g.cells[i], 50 * neo.view.scale, 50 * neo.view.scale); }, i);
  // Plays the rest of the round as the ghost finger would.
  const playOut = async () => {
    for (let n = 0; n < 60; n++) {
      await idle();
      await page.waitForTimeout(300);
      if (await page.evaluate(() => neo.scene.finished === true)) return;
      await page.evaluate(() => {
        const intent = neo.scene.game.autotouch();
        if (intent?.tap) kit.tapOn(intent.tap.on, intent.tap.x * neo.view.scale, intent.tap.y * neo.view.scale);
      });
    }
  };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1: a yes one clue rules out is one miss once it rests; Help points (one hint); the rest by the bot's taps.
  await launch('logic-grid', 1);
  await idle(); await page.waitForTimeout(400);
  let s = await page.evaluate(() => { const g = neo.scene.game; return { boards: g.boards.length, clues: g.current.clues.length, cells: g.cells.length }; });
  assert.deepEqual(s, { boards: 2, clues: 2, cells: 6 }, 'level 1: two boards of two clues on a 2 by 3 grid');
  const wrong = await page.evaluate(() => neo.scene.game.wrongYes());
  assert.ok(wrong >= 0, 'a square a clue rules out');
  await tapSquare(wrong);
  await page.waitForTimeout(300);
  assert.deepEqual(await tally(), [0, 0], 'not judged before it rests');
  await page.waitForTimeout(2800);
  assert.deepEqual(await tally(), [1, 0], 'a ruled-out yes is one miss once it rests');
  await page.evaluate(() => kit.tapOn(neo.scene.game.help)); await page.waitForTimeout(400);
  assert.deepEqual(await tally(), [1, 1], 'Help counts one hint');
  await page.evaluate(() => kit.tapOn(neo.scene.game.help)); await page.waitForTimeout(400);
  assert.deepEqual(await tally(), [1, 1], 'the second press marks the square with no second hint');
  await playOut();
  await finished('logic-grid');
  assert.deepEqual(await score(), [1, 1], 'level 1 saved 1 miss, 1 hint');

  // Level 2: tapping through yes to no on the not clue's square is free; a portrait look; both boards by the bot.
  await launch('logic-grid', 2);
  await idle(); await page.waitForTimeout(400);
  const not = await page.evaluate(() => { const b = neo.scene.game.current; const c = b.clues.find((x) => x.kind === 'not'); return { kinds: b.clues.map((x) => x.kind), sq: c.friend * b.places.length + c.place }; });
  assert.deepEqual(not.kinds, ['direct', 'not'], 'level 2: one clue says where, one says not');
  await tapSquare(not.sq); await page.waitForTimeout(250); await tapSquare(not.sq);
  await page.waitForTimeout(2800);
  assert.deepEqual(await tally(), [0, 0], 'yes on the way to no is never counted');
  assert.equal(await page.evaluate((i) => neo.scene.game.marks[i], not.sq), 2, 'the square is a no');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  const fit = await page.evaluate(() => {
    const g = neo.scene.game, v = neo.view;
    const boxes = [...g.cells, ...g.friendCards, ...g.clueCards, g.help].map((o) => { const b = o.getBounds(); return { x: b.x / v.scale, y: b.y / v.scale, w: b.width / v.scale, h: b.height / v.scale }; });
    return { min: Math.min(...boxes.map((b) => Math.min(b.w, b.h))), bottom: Math.max(...boxes.map((b) => b.y + b.h)), right: Math.max(...boxes.map((b) => b.x + b.w)), w: v.w, h: v.h };
  });
  assert.ok(fit.min >= 96, `targets stay about 100 units (${fit.min})`);
  assert.ok(fit.bottom <= fit.h && fit.right <= fit.w, 'everything fits upright');
  await screenshot('logic-grid-2-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await playOut();
  await finished('logic-grid');
  assert.deepEqual(await score(), [0, 0], 'level 2 saved no misses or hints');
  log('Mystery Grid 1 and 2: a resting ruled-out yes is one miss, Help points then marks (one hint), yes-to-no is free, portrait fits, both levels to the sticker, passed');
}
return { logicGridPlay };
}
