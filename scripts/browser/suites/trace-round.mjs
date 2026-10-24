import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
async function traceRound(level, name, wrong = false) {
  await launch('letter-trails', level, name);
  if (wrong) {
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let i = 0; i < 2; i++) {
        const p = g.firefly.getGlobalPosition();
        await kit.drag(kit.line([p.x, p.y], [neo.view.w * neo.view.scale - 10, 15], 30)); await kit.sleep(250);
      }
    });
    // The second wander is one hint: the firefly flies the next stretch by itself (leaving dots), then comes back to where she was.
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'one tracing hint per stroke');
    await page.waitForTimeout(500);
    await screenshot('letter-trails');
    assert.ok(await page.evaluate(async () => {
      const g = neo.scene.game;
      if (!await kit.until(() => !g.busy, 6000)) return false;
      const p = g.points[g.progress];
      return Math.hypot(g.firefly.x - p[0] * g.size, g.firefly.y - p[1] * g.size) < 1;
    }), 'the firefly shows the way and comes back to her checkpoint');
  }
  await page.evaluate(async () => {
    const g = neo.scene.game;
    let steps = 0;
    while (!g.done && steps++ < 160) {
      if (!await kit.until(() => !g.busy || g.done, 18000)) throw new Error('Letter transition stuck');
      if (g.done) break;
      const points = g.points.slice(g.progress).map(([x, y]) => { const p = g.canvas.toGlobal({ x: x * g.size, y: y * g.size }); return [p.x, p.y]; });
      await kit.drag(points, 1, 10);
      await kit.sleep(250);
    }
    if (!g.done) throw new Error('Tracing did not complete');
  });
  await finished('letter-trails');
  assert.ok(await page.evaluate(() => kit.store.data.journal.found.some((id) => id.startsWith('letter-trails:'))), 'a traced letter is filed in the journal');
  log(`Letter Trails level ${level} (${name || 'single letter'}): tracing and reward passed`);
}

return { traceRound };
}
