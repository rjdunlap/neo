import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function farLightsPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('far-lights').history.at(-1); return [r.misses, r.hints]; });
  const idle = () => page.waitForFunction(() => { const g = neo.scene.game; return g && g.layout && !g.busy; }, null, { timeout: 15000 });
  // Drag the strip light in `lane` to stop `s`.
  const dragTo = (lane, s) => page.evaluate(async ([lane, s]) => {
    const g = neo.scene.game;
    const to = g.board.toGlobal({ x: g.layout.stopX[s - 1], y: g.layout.laneY[lane] });
    await kit.dragTo(g.stripLights[lane], to, 12);
  }, [lane, s]);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1: three counted taps on the window lights, each after the last has drifted back.
  await launch('far-lights', 1, 'Mia', 'lap');
  for (let i = 0; i < 3; i++) {
    await page.waitForFunction(() => { const g = neo.scene.game; return g.layout && g.taps.moving.size === 0; }, null, { timeout: 15000 });
    await page.evaluate((i) => kit.tapOn(neo.scene.game.windowLights[i]), i);
    await page.waitForFunction((n) => neo.scene.game.taps.count === n, i + 1, { timeout: 4000 });
    // A tap on the light while it moves is free and not counted.
    await page.evaluate((i) => kit.tapOn(neo.scene.game.windowLights[i]), i);
    assert.equal(await page.evaluate(() => neo.scene.game.taps.count), i + 1, 'a tap on a moving light does not count');
  }
  await finished('far-lights');
  assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

  // Level 3 in portrait: both views, a wrong tap, then the brighter one, then the second pair.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await launch('far-lights', 3, 'Mia', 'prek');
  await idle();
  assert.deepEqual(await page.evaluate(() => neo.scene.game.pairs[0]), { A: 1, B: 3 }, 'the authored first pair');
  await screenshot('far-lights-3-portrait');
  await page.evaluate(() => kit.tapOn(neo.scene.game.windowLights[1]));
  await page.waitForFunction(() => neo.scene.game.tally.misses === 1, null, { timeout: 4000 });
  for (let i = 0; i < 2; i++) {
    await page.waitForFunction((i) => neo.scene.game.index === i && !neo.scene.game.busy, i, { timeout: 15000 });
    await page.evaluate(() => { const g = neo.scene.game; const p = g.pairs[g.index]; kit.tapOn(g.windowLights[p.A < p.B ? 0 : 1]); });
  }
  await finished('far-lights');
  assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);

  // Level 4: the authored board (reference A at 2, loose B at 4); too bright at 1, Show a hint, Check, then board two.
  await launch('far-lights', 4, 'Mia', 'school');
  await idle();
  assert.deepEqual(await page.evaluate(() => neo.scene.game.boards[0]), { ref: 'A', r: 2, m: 4 }, 'the authored first board');
  await dragTo('B', 1);
  await page.waitForFunction(() => neo.scene.game.stops.B === 1, null, { timeout: 4000 });
  await page.evaluate(() => kit.tapOn(neo.scene.game.check));
  await page.waitForFunction(() => neo.scene.game.tally.misses === 1, null, { timeout: 4000 });
  await page.evaluate(() => neo.scene.game.askForHint());
  await page.waitForFunction(() => neo.scene.game.stops.B === 2 && !neo.scene.game.busy, null, { timeout: 4000 });
  await page.evaluate(() => neo.scene.game.askForHint());
  assert.equal(await page.evaluate(() => neo.scene.game.tally.hints), 1, 'asking again on the same board counts once');
  await screenshot('far-lights-4-matched');
  await page.evaluate(() => kit.tapOn(neo.scene.game.check));
  await page.waitForFunction(() => neo.scene.game.index === 1 && !neo.scene.game.busy, null, { timeout: 15000 });
  const b = await page.evaluate(() => neo.scene.game.boards[1]);
  assert.deepEqual([b.ref, b.r], ['B', 1], 'board two swaps lanes and uses the other stop');
  await dragTo('A', 1);
  await page.waitForFunction(() => neo.scene.game.stops.A === 1, null, { timeout: 4000 });
  await page.evaluate(() => kit.tapOn(neo.scene.game.check));
  await finished('far-lights');
  assert.deepEqual(await score(), [1, 1], 'level 4 saved 1 miss, 1 hint');
  log('Far Lights 1, 3 and 4: level 1 three counted taps (taps on a moving light free) 0/0; level 3 portrait authored pair, a wrong tap, both pairs 1/0; level 4 authored board, a too-bright Check, Show a hint asked twice (counted once), Check, board two with lanes swapped 1/1; passed');
}
return { farLightsPlay };
}
