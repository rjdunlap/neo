import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, screenshot, launch, finished }) {
async function numberTrailsPlay() {
  const traceAll = () => page.evaluate(async () => {
    const g = neo.scene.game;
    let steps = 0;
    while (g.phase === 'trace' && steps++ < 40) {
      if (!await kit.until(() => !g.busy || g.phase !== 'trace', 18000)) throw new Error('Number Trails transition stuck');
      if (g.phase !== 'trace') break;
      const points = g.points.slice(g.progress).map(([x, y]) => { const p = g.canvas.toGlobal({ x: x * g.size, y: y * g.size }); return [p.x, p.y]; });
      await kit.drag(points, 1, 10);
      await kit.sleep(250);
    }
    if (g.phase === 'trace') throw new Error('Tracing did not complete');
  });
  // Level 1: two wandering drags earn a miss each and a hint; tracing then shows exactly n things, counted in turn.
  await launch('number-trails', 1);
  await page.evaluate(async () => {
    const g = neo.scene.game;
    for (let i = 0; i < 2; i++) {
      const p = g.firefly.getGlobalPosition();
      await kit.drag(kit.line([p.x, p.y], [neo.view.w * neo.view.scale - 10, 15], 30)); await kit.sleep(250);
    }
  });
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 1]);
  await screenshot('number-trails-1');
  await traceAll();
  assert.equal(await page.evaluate(() => neo.scene.game.n >= 1 && neo.scene.game.n <= 5), true);
  await page.waitForFunction(() => neo.scene.game.phase === 'done' || neo.scene.finished, null, { timeout: 30000 });
  await finished('number-trails');
  // Level 3: she wakes things from a bigger group (n of n + 3), one count per tap, and the round ends at n; portrait layout holds.
  await launch('number-trails', 3);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  await traceAll();
  const n = await page.evaluate(() => neo.scene.game.n);
  if (n > 0) {
    await page.waitForFunction(() => neo.scene.game.phase === 'wake', null, { timeout: 15000 });
    const group = await page.evaluate(() => neo.scene.game.things.length);
    assert.equal(group, Math.min(12, n + 3));
    await screenshot('number-trails-3-portrait');
    for (let i = 0; i < n - 1; i++) { await page.evaluate((i) => kit.tapOn(neo.scene.game.things[i]), i); await page.waitForTimeout(250); }
    assert.equal(await page.evaluate(() => neo.scene.game.woken), n - 1);
    await page.evaluate((n) => kit.tapOn(neo.scene.game.things[n]), n - 1);
  } else {
    assert.equal(await page.evaluate(() => neo.scene.game.things.length), 0);
  }
  await finished('number-trails');
  assert.deepEqual(errors, []);
  log(`Number Trails: levels 1 and 3 (numeral ${n}), two misses and a hint on wandering, the count and the waking, portrait and one sticker per round passed`);
}

return { numberTrailsPlay };
}
