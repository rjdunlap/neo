import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
async function orchardPlay() {
  const levels = (process.env.ORCHARD_LEVELS || '1,3').split(',').map(Number);
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

return { orchardPlay };
}
