import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function farLightsPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('far-lights').history.at(-1);
        return [r.misses, r.hints];
      });
    const idle = () =>
      page.waitForFunction(
        () => {
          const g = neo.scene.game;
          return g && g.layout && !g.busy;
        },
        null,
        { timeout: 15000 },
      );
    // Drag the strip light in `lane` to stop `s`.
    const dragTo = (lane, s) =>
      page.evaluate(
        async ([lane, s]) => {
          const g = neo.scene.game;
          const to = g.board.toGlobal({ x: g.layout.stopX[s - 1], y: g.layout.laneY[lane] });
          await kit.dragTo(g.stripLights[lane], to, 12);
        },
        [lane, s],
      );
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    // FAR_LEVELS=5,6 plays only the curtain levels; FAR_LEVELS=7,8 only strong and gentle.
    const only = (process.env.FAR_LEVELS ?? '').split(',').filter(Boolean).map(Number);
    if (!only.length || only.some((l) => l <= 4)) await early(score, idle, dragTo);
    if (!only.length || only.some((l) => l === 5 || l === 6)) await curtain(score, idle);
    if (!only.length || only.some((l) => l >= 7)) await strong(score, idle);
  }

  async function early(score, idle, dragTo) {
    // Level 1: three counted taps on the window lights, each after the last has drifted back.
    await launch('far-lights', 1, 'Mia', 'lap');
    for (let i = 0; i < 3; i++) {
      await page.waitForFunction(
        () => {
          const g = neo.scene.game;
          return g.layout && g.taps.moving.size === 0;
        },
        null,
        { timeout: 15000 },
      );
      await page.evaluate((i) => kit.tapOn(neo.scene.game.windowLights[i]), i);
      await page.waitForFunction((n) => neo.scene.game.taps.count === n, i + 1, { timeout: 4000 });
      // A tap on the light while it moves is free and not counted.
      await page.evaluate((i) => kit.tapOn(neo.scene.game.windowLights[i]), i);
      assert.equal(
        await page.evaluate(() => neo.scene.game.taps.count),
        i + 1,
        'a tap on a moving light does not count',
      );
    }
    await finished('far-lights');
    assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

    // Level 3 in portrait: both views, a wrong tap, then the brighter one, then the second pair.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('far-lights', 3, 'Mia', 'prek');
    await idle();
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.pairs[0]),
      { A: 1, B: 3 },
      'the authored first pair',
    );
    await screenshot('far-lights-3-portrait');
    await page.evaluate(() => kit.tapOn(neo.scene.game.windowLights[1]));
    await page.waitForFunction(() => neo.scene.game.tally.misses === 1, null, { timeout: 4000 });
    for (let i = 0; i < 2; i++) {
      await page.waitForFunction((i) => neo.scene.game.index === i && !neo.scene.game.busy, i, {
        timeout: 15000,
      });
      await page.evaluate(() => {
        const g = neo.scene.game;
        const p = g.pairs[g.index];
        kit.tapOn(g.windowLights[p.A < p.B ? 0 : 1]);
      });
    }
    await finished('far-lights');
    assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);

    // Level 4: the authored board (reference A at 2, loose B at 4); too bright at 1, Show a hint, Check, then board two.
    await launch('far-lights', 4, 'Mia', 'school');
    await idle();
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.boards[0]),
      { ref: 'A', r: 2, m: 4 },
      'the authored first board',
    );
    await dragTo('B', 1);
    await page.waitForFunction(() => neo.scene.game.stops.B === 1, null, { timeout: 4000 });
    await page.evaluate(() => kit.tapOn(neo.scene.game.check));
    await page.waitForFunction(() => neo.scene.game.tally.misses === 1, null, { timeout: 4000 });
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForFunction(() => neo.scene.game.stops.B === 2 && !neo.scene.game.busy, null, {
      timeout: 4000,
    });
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.equal(
      await page.evaluate(() => neo.scene.game.tally.hints),
      1,
      'asking again on the same board counts once',
    );
    await screenshot('far-lights-4-matched');
    await page.evaluate(() => kit.tapOn(neo.scene.game.check));
    await page.waitForFunction(() => neo.scene.game.index === 1 && !neo.scene.game.busy, null, {
      timeout: 15000,
    });
    const b = await page.evaluate(() => neo.scene.game.boards[1]);
    assert.deepEqual([b.ref, b.r], ['B', 1], 'board two swaps lanes and uses the other stop');
    await dragTo('A', 1);
    await page.waitForFunction(() => neo.scene.game.stops.A === 1, null, { timeout: 4000 });
    await page.evaluate(() => kit.tapOn(neo.scene.game.check));
    await finished('far-lights');
    assert.deepEqual(await score(), [1, 1], 'level 4 saved 1 miss, 1 hint');
    log(
      'Far Lights 1, 3 and 4: level 1 three counted taps (taps on a moving light free) 0/0; level 3 portrait authored pair, a wrong tap, both pairs 1/0; level 4 authored board, a too-bright Check, Show a hint asked twice (counted once), Check, board two with lanes swapped 1/1; passed',
    );
  }

  async function curtain(score, idle) {
    const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
    const tapSpot = (i) => page.evaluate((i) => kit.tapOn(neo.scene.game.windowLights[i]), i);
    const pull = () => page.evaluate(() => kit.tapOn(neo.scene.game.tassel));

    // Level 5: the authored pair (A at 1, B at 3); an early pull is free, the nearer light is one miss, then the farther.
    await launch('far-lights', 5, 'Mia', 'school');
    await idle();
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.pairs[0]),
      { A: 1, B: 3 },
      'the authored first pair',
    );
    await pull();
    await page.waitForTimeout(300);
    assert.equal(
      await page.evaluate(() => neo.scene.game.lifted),
      false,
      'the tassel does not lift the curtain before her answer',
    );
    await tapSpot(0);
    await page.waitForFunction(() => neo.scene.game.tally.misses === 1, null, { timeout: 4000 });
    await tapSpot(1);
    await page.waitForFunction(() => neo.scene.game.lifted, null, { timeout: 8000 });
    await page.waitForFunction(() => neo.scene.game.index === 1 && !neo.scene.game.busy, null, {
      timeout: 15000,
    });
    assert.equal(
      await page.evaluate(() => neo.scene.game.lifted),
      false,
      'the curtain is down again for pair two',
    );
    await page.evaluate(() => {
      const g = neo.scene.game;
      const p = g.pairs[g.index];
      kit.tapOn(g.windowLights[p.A > p.B ? 0 : 1]);
    });
    await finished('far-lights');
    assert.deepEqual(await score(), [1, 0], 'level 5 saved 1 miss, 0 hints');

    // Level 6 in portrait: the authored board [3, 1, 2]; marked left to right is wrong, Show a hint twice, then the right order.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('far-lights', 6, 'Mia', 'school');
    await idle();
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.orderBoards[0].stops),
      [3, 1, 2],
      'the authored first board',
    );
    await pull();
    assert.deepEqual(await tally(), [0, 0], 'a pull before three marks is free');
    for (const i of [0, 1, 2]) await tapSpot(i);
    await tapSpot(2);
    await tapSpot(2);
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.marks.picks),
      [0, 1, 2],
      'clearing and re-marking is free',
    );
    await page.waitForTimeout(300);
    await screenshot('far-lights-6-marks');
    await pull();
    await page.waitForFunction(() => neo.scene.game.tally.misses === 1, null, { timeout: 4000 });
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.marks.picks),
      [],
      'a wrong pull takes the marks off from the first wrong one',
    );
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.marks.picks, neo.scene.game.marks.locked]),
      [[1, 2], 2],
      'two hints lock the two nearest',
    );
    assert.deepEqual(await tally(), [1, 1], 'asking again on the same board counts once');
    await tapSpot(1);
    assert.deepEqual(await page.evaluate(() => neo.scene.game.marks.picks), [1, 2], 'a hint mark stays');
    await tapSpot(0);
    await pull();
    await page.waitForFunction(() => neo.scene.game.index === 1 && !neo.scene.game.busy, null, {
      timeout: 15000,
    });
    // Board two by the ghost finger's own moves.
    for (let k = 0; k < 8 && !(await page.evaluate(() => neo.scene.game?.finished !== false)); k++) {
      await page.waitForFunction(() => neo.scene.game?.finished !== false || !neo.scene.game.busy, null, {
        timeout: 15000,
      });
      await page.evaluate(() => {
        const g = neo.scene.game;
        const t = g && !g.finished && g.autotouch();
        if (t) kit.tapOn(t.tap.on);
      });
      await page.waitForTimeout(400);
    }
    await finished('far-lights');
    assert.deepEqual(await score(), [1, 1], 'level 6 saved 1 miss, 1 hint');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    log(
      'Far Lights 5 and 6: level 5 authored pair, an early pull free, a nearer tap one miss, curtain lifts and drops for pair two 1/0; level 6 portrait authored board, a pull before three marks free, re-marking free, a wrong pull one miss and marks off, Show a hint twice (counted once, marks locked), the right pull, board two by autotouch 1/1; passed',
    );
  }
  async function strong(score, idle) {
    const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
    const tapLane = (lane) =>
      page.evaluate((lane) => kit.tapOn(neo.scene.game.windowLights[lane === 'A' ? 0 : 1]), lane);
    const strongLane = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        const b = g.strongBoards[g.index];
        return b.A.glow > b.B.glow ? 'A' : 'B';
      });
    const otherLane = (l) => (l === 'A' ? 'B' : 'A');
    const ready = (i) =>
      page.waitForFunction(
        (i) => {
          const g = neo.scene.game;
          return g && g.index === i && g.layout && !g.busy && !g.lifted;
        },
        i,
        { timeout: 20000 },
      );

    // Level 7: the authored board (strong 4@2 in A, gentle 1@1 in B); the opening look ends with both looking the same.
    await launch('far-lights', 7, 'Mia', 'school');
    await ready(0);
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.strongBoards[0]),
      { A: { glow: 4, stop: 2 }, B: { glow: 1, stop: 1 } },
      'the authored first board',
    );
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.windowLights.map((w) => w.shown)),
      [1, 1],
      'after the opening look both look the same',
    );
    await tapLane('B');
    await page.waitForFunction(() => neo.scene.game.tally.misses === 1, null, { timeout: 4000 });
    await tapLane('A');
    await page.waitForFunction(() => neo.scene.game.lifted, null, { timeout: 10000 });
    await ready(1);
    await tapLane(await strongLane());
    await finished('far-lights');
    assert.deepEqual(await score(), [1, 0], 'level 7 saved 1 miss, 0 hints');
    assert.ok(
      await page.evaluate(() => kit.store.data.journal.found.includes('far-lights:strong-far')),
      'level 7 files its journal entry',
    );

    // Level 8 in portrait: a tap before the step is free, Both could fit, the step, a wrong tap, Show a hint, then the farther light.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('far-lights', 8, 'Mia', 'school');
    await ready(0);
    const s0 = await strongLane();
    await tapLane(otherLane(s0));
    await page.waitForTimeout(300);
    assert.deepEqual(await tally(), [0, 0], 'a tap before the step is a guess, never a miss');
    assert.equal(
      await page.evaluate(() => neo.scene.game.stepButton.visible),
      false,
      'the step waits for Both could fit',
    );
    await page.evaluate(() => kit.tapOn(neo.scene.game.fitButton));
    await page.waitForFunction(
      () => neo.scene.game.stepBoard.fit && neo.scene.game.stepButton.visible,
      null,
      { timeout: 4000 },
    );
    await page.evaluate(() => kit.tapOn(neo.scene.game.stepButton));
    await page.waitForFunction(
      () => neo.scene.game.stepBoard.stepped && neo.scene.game.stepAt.t === 1 && !neo.scene.game.busy,
      null,
      { timeout: 6000 },
    );
    assert.deepEqual(await tally(), [0, 0], 'Both could fit and the step never count');
    await tapLane(otherLane(s0));
    await page.waitForFunction(() => neo.scene.game.tally.misses === 1, null, { timeout: 4000 });
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.deepEqual(await tally(), [1, 1], 'asking again on the same board counts once');
    await page.waitForTimeout(500);
    await screenshot('far-lights-8-stepped');
    await tapLane(s0);
    await page.waitForFunction(() => neo.scene.game.lifted, null, { timeout: 10000 });
    await ready(1);
    // Board two by the ghost finger's own moves.
    for (let k = 0; k < 8 && !(await page.evaluate(() => neo.scene.game?.finished !== false)); k++) {
      await page.waitForFunction(() => neo.scene.game?.finished !== false || !neo.scene.game.busy, null, {
        timeout: 15000,
      });
      await page.evaluate(() => {
        const g = neo.scene.game;
        const t = g && !g.finished && g.autotouch();
        if (t) kit.tapOn(t.tap.on);
      });
      await page.waitForTimeout(500);
    }
    await finished('far-lights');
    assert.deepEqual(await score(), [1, 1], 'level 8 saved 1 miss, 1 hint');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    log(
      'Far Lights 7 and 8: level 7 authored board, the opening look ends level, a gentle tap one miss, curtain lifts, board two 1/0 and the journal entry; level 8 portrait, a tap before the step free, Both could fit, the step, a wrong tap one miss, Show a hint twice (counted once), the farther light, board two by autotouch 1/1; passed',
    );
  }
  return { farLightsPlay };
}
