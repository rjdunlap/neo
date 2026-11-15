import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
  async function traceRound(level, name, wrong = false) {
    // Level 7 plays on a phone held upright, so the word's own picture is checked where the playtests happen.
    const phone = level === 7;
    const landscape = page.viewportSize();
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    try {
      await playRound(level, name, wrong);
    } finally {
      if (phone) await page.setViewportSize(landscape);
    }
  }

  async function playRound(level, name, wrong) {
    await launch('letter-trails', level, name);
    if (wrong) {
      await page.evaluate(async () => {
        const g = neo.scene.game;
        for (let i = 0; i < 2; i++) {
          const p = g.firefly.getGlobalPosition();
          await kit.drag(kit.line([p.x, p.y], [neo.view.w * neo.view.scale - 10, 15], 30));
          await kit.sleep(250);
        }
      });
      // The second wander is one hint: the firefly flies the next stretch by itself (leaving dots), then comes back to where she was.
      assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'one tracing hint per stroke');
      await page.waitForTimeout(500);
      await screenshot('letter-trails');
      assert.ok(
        await page.evaluate(async () => {
          const g = neo.scene.game;
          if (!(await kit.until(() => !g.busy, 6000))) return false;
          const p = g.points[g.progress];
          return Math.hypot(g.firefly.x - p[0] * g.size, g.firefly.y - p[1] * g.size) < 1;
        }),
        'the firefly shows the way and comes back to her checkpoint',
      );
    }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      let steps = 0;
      while (!g.done && g.letterIndex < g.word.length && steps++ < 160) {
        if (!(await kit.until(() => !g.busy || g.done || g.letterIndex === g.word.length, 18000)))
          throw new Error('Letter transition stuck');
        if (g.done || g.letterIndex === g.word.length) break;
        const points = g.points.slice(g.progress).map(([x, y]) => {
          const p = g.canvas.toGlobal({ x: x * g.size, y: y * g.size });
          return [p.x, p.y];
        });
        await kit.drag(points, 1, 10);
        await kit.sleep(250);
      }
      if (g.letterIndex < g.word.length) throw new Error('Tracing did not complete');
    });
    if (level >= 7) {
      // A word ends on its own picture, a name on a sign with the whole name; a name is traced up to eight letters.
      const shown = await page.evaluate(async () => {
        const g = neo.scene.game;
        await kit.until(() => g.picture && g.picture.scale.x > 0.5, 3000);
        return { word: g.word, traced: g.traced.size, picture: !!g.picture };
      });
      assert.ok(shown.picture, 'the word or name is shown at the end');
      if (level === 8)
        assert.ok(shown.word.length <= 8, `a name is traced up to eight letters (${shown.word})`);
      await page.waitForTimeout(400);
      await screenshot(`letter-trails-${level}-${shown.word}`);
    }
    assert.ok(
      await page.evaluate(() => kit.until(() => neo.scene.game.done, 8000)),
      'the round finishes after the closing picture',
    );
    await finished('letter-trails');
    assert.ok(
      await page.evaluate(() => kit.store.data.journal.found.some((id) => id.startsWith('letter-trails:'))),
      'a traced letter is filed in the journal',
    );
    log(`Letter Trails level ${level} (${name || 'single letter'}): tracing and reward passed`);
  }

  return { traceRound };
}
