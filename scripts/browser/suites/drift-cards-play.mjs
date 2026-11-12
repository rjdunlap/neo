import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function driftCardsPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('drift-cards').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        const t = g.turns[g.index];
        return {
          index: g.index,
          misses: g.misses,
          hints: g.hints,
          busy: g.busy,
          glow: t?.glow ?? false,
          row0: g.sea.cells[0].join(''),
        };
      });
    const settle = async () => {
      await page.waitForTimeout(300);
      await page.waitForFunction(
        () =>
          neo.scene.finished ||
          (!neo.scene.game.busy &&
            (neo.scene.game.plan.mode === 'send' ||
              (neo.scene.game.held && neo.scene.game.held.scale.x > 0.99))),
        null,
        { timeout: 30000 },
      );
      await page.waitForTimeout(400);
    };
    const tapBeach = (b) => page.evaluate((b) => kit.tapOn(neo.scene.game.plates.get(b)), b);
    const tapBoat = (col) =>
      page.evaluate((col) => kit.tapOn(neo.scene.game.boats.find((x) => x.col === col).node), col);
    /** The boats whose card reaches the asked friend, followed through the arrows in the page. */
    const rightBoats = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        const sea = g.sea;
        const land = (col) => {
          let r = 0,
            c = col;
          for (;;) {
            const d = sea.cells[r][c];
            if (d === 'e') {
              if (++c >= sea.cols) return 'E';
            } else if (d === 'w') {
              if (--c < 0) return 'W';
            } else if (++r >= sea.rows) return c < sea.cols / 2 ? 'SW' : 'SE';
          }
        };
        return g.plan.boats.filter((b) => land(b) === g.request.ask);
      });
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 1, the authored sea: card 1 (west) guessed south is free; card 2 (south) east then west is two misses and the glow; then south; card 3 east.
    await launch('drift-cards', 1, 'Mia', 'school');
    await settle();
    let s = await state();
    assert.equal(s.row0, 'ssssw', 'the first level-1 round is the authored sea');
    await tapBeach('S');
    await settle();
    s = await state();
    assert.deepEqual(
      [s.index, s.misses, s.hints],
      [1, 0, 0],
      'the first card is a free guess; it drifts to the west beach anyway',
    );
    await tapBeach('E');
    await page.waitForTimeout(500);
    s = await state();
    assert.deepEqual(
      [s.index, s.misses, s.hints, s.glow],
      [1, 1, 0, false],
      'a wrong beach for card 2 is one miss and the card stays',
    );
    await tapBeach('W');
    await page.waitForTimeout(500);
    s = await state();
    assert.deepEqual(
      [s.index, s.misses, s.hints, s.glow],
      [1, 2, 1, true],
      'the second miss glows the south beach: one hint',
    );
    await tapBeach('S');
    // U7 R4: "Found by …" (2.4 s when muted) never holds the next card: it is held as soon as this one is found.
    await page.waitForFunction(
      () => [...neo.scene.game.friends.values()].reduce((n, f) => n + f.found, 0) === 2,
      null,
      { timeout: 30000, polling: 50 },
    );
    await page.waitForFunction(() => neo.scene.game.index === 2 && !neo.scene.game.busy, null, {
      timeout: 800,
    });
    await settle();
    s = await state();
    assert.deepEqual([s.index, s.misses, s.hints], [2, 2, 1], 'the right beach drops card 2');
    await tapBeach('E');
    await finished('drift-cards');
    assert.deepEqual(await score(), [2, 1], 'level 1 saved 2 misses, 1 hint');

    // Level 2, the authored first request (the frog, south-west): boat 5 reaches the penguin (a miss, the request stays), then boat 1.
    await launch('drift-cards', 2, 'Mia', 'school');
    await settle();
    assert.deepEqual(await rightBoats(), [1, 3], 'the authored request: boats 1 and 3 reach the frog');
    await tapBoat(5);
    await page.waitForTimeout(400);
    s = await state();
    assert.equal(s.misses, 1, 'a boat that misses the friend is one miss');
    await settle();
    s = await state();
    assert.deepEqual([s.index, s.misses], [0, 1], 'the card comes back and the request stays');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(900);
    await tapBoat(1);
    await page.waitForTimeout(1300);
    await screenshot('drift-cards-2-portrait-drift');
    await settle();
    s = await state();
    assert.deepEqual([s.index, s.misses, s.hints], [1, 1, 0], 'a right boat answers the request');
    for (let i = 1; i < 3; i++) {
      const right = await rightBoats();
      assert.ok(right.length >= 1, 'every seeded request has a right boat');
      await tapBoat(right[0]);
      if (i < 2) await settle();
    }
    await finished('drift-cards');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [1, 0], 'level 2 saved 1 miss, 0 hints');
    log(
      'Drift Cards 1–2: level 1 free first guess, two misses then the glow, saved 2/1; level 2 a wrong boat drifts to the penguin and back, right boats in portrait, saved 1/0; passed',
    );

    // Level 3, the authored case: B (card 1 rules it out) is a miss, B again counts nothing, C (card 2) is the second miss and
    // the glow, then A and the replay. The options' order is seeded, so each is found by its arrows.
    const ARROWS = { A: 'esse', B: 'esee', C: 'essw' };
    const patch = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        const t = g.turns[0];
        return {
          misses: g.misses,
          hints: g.hints,
          busy: g.busy,
          glow: t.glow,
          option: g.option,
          fog: g.fog.length,
          options: g.pc.options.map((o) => o.join('')),
          answer: g.pc.answer,
          alpha: g.checkBtn.alpha,
        };
      });
    const lay = (arrows) =>
      page.evaluate((a) => {
        const g = neo.scene.game;
        kit.tapOn(g.patchCards[g.pc.options.findIndex((o) => o.join('') === a)]);
      }, arrows);
    const check = () => page.evaluate(() => kit.tapOn(neo.scene.game.checkBtn));
    const idle = async () => {
      await page.waitForTimeout(300);
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 30000 });
      await page.waitForTimeout(300);
    };
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(400);
    await launch('drift-cards', 3, 'Mia', 'school');
    await page.waitForTimeout(800);
    let p = await patch();
    assert.deepEqual(
      [...p.options].sort(),
      Object.values(ARROWS).sort(),
      'the first level-3 case is the authored one',
    );
    assert.equal(p.options[p.answer], ARROWS.A, 'A is the answer');
    assert.deepEqual(
      [p.fog, p.option, p.alpha < 1],
      [4, null, true],
      'four fogged cells, no patch in, Check waiting',
    );
    await screenshot('drift-cards-3-portrait-fog');
    await check();
    await page.waitForTimeout(300);
    p = await patch();
    assert.deepEqual([p.misses, p.busy], [0, false], 'Check with nothing in the fog does nothing');
    await lay(ARROWS.B);
    await page.waitForTimeout(300);
    p = await patch();
    assert.deepEqual([p.fog, p.misses], [0, 0], 'laying a patch is free and lifts the fog');
    await check();
    await page.waitForTimeout(300);
    p = await patch();
    assert.deepEqual([p.misses, p.hints, p.glow], [1, 0, false], 'B: card 1 rules it out, one miss');
    await idle();
    await check();
    await page.waitForTimeout(300);
    p = await patch();
    assert.deepEqual([p.misses, p.hints], [1, 0], 'checking B again counts nothing');
    await lay(ARROWS.C);
    await page.waitForTimeout(300);
    await check();
    await page.waitForTimeout(300);
    p = await patch();
    assert.deepEqual(
      [p.misses, p.hints, p.glow],
      [2, 1, true],
      'C: card 2 rules it out, the second miss glows A (one hint)',
    );
    await idle();
    await lay(ARROWS.A);
    await page.waitForTimeout(300);
    await check();
    await finished('drift-cards');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [2, 1], 'level 3 saved 2 misses, 1 hint');
    log(
      'Drift Cards 3: authored case in portrait, B a miss, B again free, C the second miss and the glow, A and the replay, saved 2/1; passed',
    );
  }
  return { driftCardsPlay };
}
