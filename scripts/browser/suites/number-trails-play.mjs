import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, screenshot, launch, finished }) {
  async function numberTrailsPlay() {
    const traceAll = () =>
      page.evaluate(async () => {
        const g = neo.scene.game;
        let steps = 0;
        while (g.phase === 'trace' && steps++ < 40) {
          if (!(await kit.until(() => !g.busy || g.phase !== 'trace', 18000)))
            throw new Error('Number Trails transition stuck');
          if (g.phase !== 'trace') break;
          const points = g.points.slice(g.progress).map(([x, y]) => {
            const p = g.canvas.toGlobal({ x: x * g.size, y: y * g.size });
            return [p.x, p.y];
          });
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
        await kit.drag(kit.line([p.x, p.y], [neo.view.w * neo.view.scale - 10, 15], 30));
        await kit.sleep(250);
      }
    });
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 1]);
    await screenshot('number-trails-1');
    await traceAll();
    assert.equal(await page.evaluate(() => neo.scene.game.n >= 1 && neo.scene.game.n <= 5), true);
    await page.waitForFunction(() => neo.scene.game.phase === 'done' || neo.scene.finished, null, {
      timeout: 30000,
    });
    await finished('number-trails');
    // Level 4, First numbers: one of 1, 2, 3 or 7, finished in one drag, then that many things appear by themselves.
    await launch('number-trails', 4);
    const first = await page.evaluate(() => neo.scene.game.n);
    assert.ok([1, 2, 3, 7].includes(first), `level 4 drew ${first}`);
    await traceAll();
    await page.waitForFunction(() => neo.scene.game.phase === 'done' || neo.scene.finished, null, {
      timeout: 30000,
    });
    assert.equal(await page.evaluate(() => neo.scene.game.things.length), first);
    await screenshot('number-trails-4');
    await finished('number-trails');
    // Level 3: she wakes things from a bigger group (n of n + 3), one count per tap, and the round ends at n; portrait layout holds.
    await launch('number-trails', 3);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await traceAll();
    const n = await page.evaluate(() => neo.scene.game.n);
    if (n > 0) {
      await page.waitForFunction(() => neo.scene.game.phase === 'wake', null, { timeout: 15000 });
      const group = await page.evaluate(() => neo.scene.game.things.length);
      assert.equal(group, Math.min(12, n + 3));
      await screenshot('number-trails-3-portrait');
      for (let i = 0; i < n - 1; i++) {
        await page.evaluate((i) => kit.tapOn(neo.scene.game.things[i]), i);
        await page.waitForTimeout(250);
      }
      assert.equal(await page.evaluate(() => neo.scene.game.woken), n - 1);
      await page.evaluate((n) => kit.tapOn(neo.scene.game.things[n]), n - 1);
    } else {
      assert.equal(await page.evaluate(() => neo.scene.game.things.length), 0);
    }
    await finished('number-trails');
    // Level 5, Write how many: count the group, two wrong cards (a miss each, the second glows the right one), the right card, then the trace.
    await page.setViewportSize({ width: 1024, height: 768 });
    await launch('number-trails', 5);
    const pickCard = (right) =>
      page.evaluate(async (right) => {
        const g = neo.scene.game;
        if (!(await kit.until(() => g.phase === 'cards' && !g.busy, 20000))) throw new Error('No cards');
        const i = right ? g.choices.indexOf(g.n) : g.choices.findIndex((d) => d !== g.n);
        kit.tapOn(g.cards[i]);
      }, right);
    const countAll = () =>
      page.evaluate(async () => {
        const g = neo.scene.game;
        if (!(await kit.until(() => !g.busy, 15000))) throw new Error('Count stuck');
        for (const t of g.things) {
          kit.tapOn(t);
          await kit.sleep(300);
        }
      });
    const five = await page.evaluate(() => ({
      n: neo.scene.game.n,
      phase: neo.scene.game.phase,
      canvas: neo.scene.game.canvas.visible,
      heading: neo.scene.game.heading.text,
    }));
    assert.equal(five.phase, 'count');
    assert.equal(five.canvas, false, 'the numeral stays hidden while she counts');
    assert.equal(five.heading, '?');
    await countAll();
    await pickCard(false);
    await page.waitForTimeout(400);
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.glowing]),
      [1, 0, false],
    );
    await pickCard(false);
    await page.waitForTimeout(400);
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.glowing]),
      [2, 1, true],
    );
    // The right card works mid-recount: it cuts the pet's count short.
    await page.waitForFunction(() => neo.scene.game.recounting, null, { timeout: 10000 });
    await screenshot('number-trails-5-glow');
    // U7 R4: the card's count starts and the tracing opens after the 0.5 s grow and beat, with `nt.start` still waiting.
    const r4 = await page.evaluate(async () => {
      const g = neo.scene.game,
        t = performance.now();
      kit.tapOn(g.cards[g.choices.indexOf(g.n)]);
      await kit.until(() => g.phase === 'trace' && !g.busy, 15000);
      return { ms: performance.now() - t, waiting: g.unasked };
    });
    assert.ok(
      r4.ms < 900 && r4.waiting,
      `R4: the tracing waited for the card's count (${Math.round(r4.ms)} ms)`,
    );
    log(`Number Trails 5: R4, tracing open ${Math.round(r4.ms)} ms after the right card, nt.start waiting`);
    assert.equal(await page.evaluate(() => neo.scene.game.canvas.visible), true);
    await traceAll();
    await page.waitForFunction(() => neo.scene.game.phase === 'done' || neo.scene.finished, null, {
      timeout: 30000,
    });
    assert.equal(await page.evaluate(() => neo.scene.game.things.length), five.n);
    await finished('number-trails');
    // Level 5 with zero: an empty basket, the cards straight away (one of them 0), then the 0 traced. Relaunch until zero comes up.
    let zero = false;
    for (let tries = 0; tries < 40 && !zero; tries++) {
      await launch('number-trails', 5);
      zero = await page.evaluate(() => neo.scene.game.n === 0);
    }
    if (zero) {
      assert.equal(
        await page.evaluate(() => [neo.scene.game.things.length, neo.scene.game.choices.includes(0)].join()),
        '0,true',
      );
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(400);
      await page.waitForFunction(() => neo.scene.game.phase === 'cards' && !neo.scene.game.busy, null, {
        timeout: 20000,
      });
      await screenshot('number-trails-5-zero-portrait');
      await pickCard(true);
      await page.waitForFunction(() => neo.scene.game.phase === 'trace' && !neo.scene.game.busy, null, {
        timeout: 15000,
      });
      await traceAll();
      await finished('number-trails');
    }
    // Level 6, Less help each time: one numeral three times in portrait (solid, dotted, start only); a wander on the
    // dotted try is one miss and brings the solid trail back for that stroke; the things come once, after the third try.
    await page.setViewportSize({ width: 768, height: 1024 });
    await launch('number-trails', 6);
    await page.waitForTimeout(400);
    const traceTry = (attempt) =>
      page.evaluate(async (attempt) => {
        const g = neo.scene.game;
        let steps = 0;
        while (g.phase === 'trace' && g.attempt === attempt && steps++ < 40) {
          if (!(await kit.until(() => !g.busy || g.phase !== 'trace', 18000)))
            throw new Error('Number Trails transition stuck');
          if (g.phase !== 'trace' || g.attempt !== attempt) break;
          const points = g.points.slice(g.progress).map(([x, y]) => {
            const p = g.canvas.toGlobal({ x: x * g.size, y: y * g.size });
            return [p.x, p.y];
          });
          await kit.drag(points, 1, 10);
          await kit.sleep(250);
        }
      }, attempt);
    const onTry = (attempt) =>
      page.waitForFunction(
        (attempt) =>
          neo.scene.game.attempt === attempt && neo.scene.game.phase === 'trace' && !neo.scene.game.busy,
        attempt,
        { timeout: 20000 },
      );
    const six = await page.evaluate(() => ({ n: neo.scene.game.n, guides: [...neo.scene.game.guides] }));
    assert.deepEqual(six.guides, ['solid', 'dotted', 'start']);
    const corridor = await page.evaluate(() => neo.scene.game.tolerance);
    await traceTry(0);
    await onTry(1);
    assert.equal(await page.evaluate(() => neo.scene.game.guideNow()), 'dotted');
    await screenshot('number-trails-6-dotted-portrait');
    await page.evaluate(async () => {
      const p = neo.scene.game.firefly.getGlobalPosition();
      await kit.drag(kit.line([p.x, p.y], [neo.view.w * neo.view.scale - 10, 15], 30));
      await kit.sleep(250);
    });
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.guideNow()]),
      [1, 0, 'solid'],
    );
    await traceTry(1);
    await onTry(2);
    assert.equal(await page.evaluate(() => neo.scene.game.guideNow()), 'start');
    assert.equal(await page.evaluate(() => neo.scene.game.tolerance), corridor);
    assert.equal(
      await page.evaluate(() => neo.scene.game.things.length),
      0,
      'no things before the third try',
    );
    await screenshot('number-trails-6-start-portrait');
    await traceTry(2);
    await page.waitForFunction(() => neo.scene.game.phase === 'done' || neo.scene.finished, null, {
      timeout: 30000,
    });
    assert.equal(await page.evaluate(() => neo.scene.game.things.length), six.n);
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [1, 0]);
    await finished('number-trails');
    await page.setViewportSize({ width: 1024, height: 768 });
    assert.deepEqual(errors, []);
    log(
      `Number Trails: levels 1, 4 (numeral ${first}), 3 (numeral ${n}) and 5 (count ${five.n}, two wrong cards and the glow, ${zero ? 'and a zero round in portrait' : 'no zero drawn in 40 tries'}) and 6 (numeral ${six.n} three times, one wander on the dotted try), two misses and a hint on wandering, the count and the waking, portrait and one sticker per round passed`,
    );
  }

  return { numberTrailsPlay };
}
