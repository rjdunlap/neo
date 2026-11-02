import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
async function orchardPlay() {
  const all = (process.env.ORCHARD_LEVELS || '1,3').split(',').map(Number);
  const levels = all.filter(l => l <= 3);
  if (all.some(l => l >= 4)) await orchardBaskets(all.filter(l => l >= 4));
  if (!levels.length) { assert.deepEqual(errors, []); return; }
  const gesture = () => page.evaluate(() => {
    const g = neo.scene.game;
    const intent = g.autotouch();
    if (intent) kit.tapOn(intent.tap.on);
  });
  for (const level of levels) {
    await launch('orchard-rows', level);
    await page.waitForFunction(() => !neo.scene.game.busy);
    // Planting and counting are free exploration; only number choices are answers.
    if (level !== 3) {
      while (await page.evaluate(() => neo.scene.game.phase !== 'answer')) {
        await gesture(); await page.waitForTimeout(160);
        await page.waitForFunction(() => !neo.scene.game.busy);
      }
      const before = await page.evaluate(() => neo.scene.game.counted.length);
      await tap('neo.scene.game.groups[0]');
      await page.waitForFunction(() => !neo.scene.game.busy);
      assert.equal(await page.evaluate(() => neo.scene.game.counted.length), before);
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      await tap('neo.scene.game.pads.find(p => p.n !== neo.scene.game.answer).node');
      await page.waitForFunction(() => !neo.scene.game.busy);
    }
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]), [2, 1, true]);
    await screenshot(`orchard-rows-${level}-hint`);
    if (level === 3) {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(350);
      await screenshot('orchard-rows-3-portrait');
    }
    const turnedCounts = [];
    for (let guard = 0; guard < 60; guard++) {
      if (await page.evaluate(() => neo.scene.finished)) break;
      const state = await page.evaluate(() => ({ phase: neo.scene.game.phase, busy: neo.scene.game.busy, turned: neo.scene.game.turned, o: neo.scene.game.oriented }));
      if (state.turned) turnedCounts.push(state.o.rows * state.o.columns);
      if (!state.busy) await gesture();
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy);
      await page.waitForTimeout(150);
    }
    await finished('orchard-rows');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('orchard-rows').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
    if (level > 1) assert.ok(turnedCounts.length > 0, 'columns were counted');
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Orchard Rows ${level}: real taps, replay, two misses/one hint, supported completion and one sticker passed`);
  }
  // Leave during speech, then return. The old game's continuation must never finish a second round.
  await launch('orchard-rows', 3);
  await page.waitForFunction(() => !neo.scene.game.busy);
  await gesture();
  await page.evaluate(() => neo.go.land('counting-cove'));
  await scene('LandScene');
  await page.waitForTimeout(300);
  assert.deepEqual(errors, []);
}

/** Levels 4–6: real taps on the arrows, Plant / One long row and the baskets; the bot (the help's path) for the rest. */
async function orchardBaskets(levels) {
  const st = () => page.evaluate(() => { const g = neo.scene.game; return { ...g.state, busy: g.busy, n: g.n, tasks: undefined }; });
  const idle = () => page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.busy && neo.scene.game.speaking === 0 && !neo.scene.game.dealing()), null, { timeout: 30000 });
  const press = async (what) => { await page.evaluate((w) => kit.tapOn(typeof w === 'number' ? neo.scene.game.baskets[w] : neo.scene.game[w]), what); await page.waitForTimeout(120); await idle(); };
  const bot = async (until) => {
    for (let guard = 0; guard < 200; guard++) {
      // The check and the tap in one evaluation, so nothing is tapped after the goal is reached.
      const r = await page.evaluate((src) => { if ((0, eval)(src)()) return 'done'; const i = neo.scene.game.autotouch(); if (i) kit.tapOn(i.tap.on); return i ? 'tap' : 'wait'; }, until.toString());
      if (r === 'done') return;
      await page.waitForTimeout(r === 'tap' ? 250 : 150);
    }
    throw new Error('the bot did not get there');
  };
  const saved = () => page.evaluate(() => { const r = kit.store.stats('orchard-rows').history.at(-1); return [r.misses, r.hints]; });
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  for (const level of levels) {
    if (level === 5) { await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400); }
    await launch('orchard-rows', level);
    await idle();
    let s = await st();
    if (level === 4) {
      assert.deepEqual([s.n, s.rows], [12, 5], 'level 4 opens on 12 at 5 rows');
      await press('up'); await press('down');
      assert.deepEqual([(await st()).rows, (await st()).misses], [5, 0], 'arrows are free');
      await press('act');
      s = await st();
      assert.deepEqual([s.misses, s.hints, s.glowing], [1, 0, false], 'Plant with 2 left is a miss');
      await press('act');
      s = await st();
      assert.deepEqual([s.misses, s.hints, s.glowing], [2, 1, true], 'a second lights the glow: one hint');
      await screenshot('orchard-rows-4-glow');
      await bot(() => neo.scene.finished || neo.scene.game.state.index === 1);
      await bot(() => neo.scene.finished);
      await finished('orchard-rows');
      assert.deepEqual(await saved(), [2, 1]);
    } else if (level === 5) {
      await bot(() => neo.scene.game.state.found.length === 1 && !neo.scene.game.busy && neo.scene.game.speaking === 0);
      await press('act');
      s = await st();
      assert.deepEqual([s.found.length, s.misses, s.hints], [1, 0, 0], 'a shape planted twice is free');
      while ((await st()).rows > 1) await press('down');
      await page.waitForTimeout(700);
      await screenshot('orchard-rows-5-portrait-one-row');
      await bot(() => neo.scene.finished);
      await finished('orchard-rows');
      assert.deepEqual(await saved(), [0, 0]);
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
    } else {
      const wrong = await page.evaluate(() => neo.scene.game.state.tasks[0].baskets.findIndex(n => n !== 13));
      await press(wrong);
      await press('act');
      s = await st();
      assert.deepEqual([s.misses, s.hints, s.shown.length], [1, 0, 1], 'a wrong claim is one miss and the pet plants its shape');
      await press('act');
      assert.equal((await st()).misses, 1, 'claiming it again replays for free');
      await screenshot('orchard-rows-6-wrong-claim');
      await bot(() => neo.scene.finished);
      await finished('orchard-rows');
      assert.deepEqual(await saved(), [1, 0]);
    }
    log(`Orchard Rows ${level}: real taps, accounting and one sticker passed`);
  }
}

return { orchardPlay };
}
