import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function lensPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('puddle-lens').history.at(-1);
        return [r.misses, r.hints];
      });
    const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
    const settle = async () => {
      await page.waitForTimeout(250);
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 20000 });
      await page.waitForTimeout(200);
    };
    const turn = async (stop) => {
      await page.evaluate((stop) => kit.tapOn(neo.scene.game.stopButtons[stop - 1]), stop);
      await page.waitForFunction((stop) => neo.scene.game.stop === stop, stop, { timeout: 5000 });
      await page.waitForTimeout(400);
    };
    const show = async () => {
      await page.evaluate(() => kit.tapOn(neo.scene.game.answer));
      await page.waitForTimeout(300);
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    const choose = async (i) => {
      await page.evaluate((i) => kit.tapOn(neo.scene.game.choiceButtons[i]), i);
      await settle();
    };
    // Levels 9 and 11: tap a card (or 'cant-tell', the fourth answer) by what it names.
    const card = async (id) => {
      await page.evaluate((id) => {
        const g = neo.scene.game;
        kit.tapOn(g.choiceButtons.find((b) => b.stop === id));
      }, id);
      await settle();
    };
    const auto = async () => {
      for (let i = 0; i < 40 && !(await page.evaluate(() => neo.scene.finished)); i++) {
        await settle();
        await page.evaluate(() => {
          const t = neo.scene.game.autotouch();
          if (t) kit.tapOn(t.tap.on);
        });
        await page.waitForTimeout(500);
      }
    };
    const portrait = async (name) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(800);
      await screenshot(name);
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(800);
    };
    // LENS_LEVELS=7,8 plays only the wall-clue and why-green levels (9, 10 and 11 the slide files); LENS_LEVELS=lap only the lap level.
    const onlyLap = process.env.LENS_LEVELS === 'lap';
    if (!process.env.LENS_LEVELS || onlyLap) await lap();
    if (onlyLap) return;
    const only = (process.env.LENS_LEVELS ?? '').split(',').filter(Boolean).map(Number);
    if (!only.length || only.some((l) => l <= 6)) await early();
    // Level 7: plant cells, animal cells, can't tell yet; the wall is the clue.
    if (!only.length || only.includes(7)) {
      await launch('puddle-lens', 7);
      await settle();
      assert.deepEqual(
        await page.evaluate(() => neo.scene.game.walls),
        ['onion-skin', 'cheek-cells', 'leaf'],
        'the authored slides',
      );
      assert.equal(await page.evaluate(() => neo.scene.game.stop), 2, 'level 7 starts at the hand lens');
      await choose(1);
      assert.deepEqual(await tally(), [0, 0], 'animal before the walls show is free');
      await turn(3);
      await choose(1);
      assert.deepEqual(await tally(), [1, 0], 'animal for the onion skin at stop 3: a miss');
      await choose(0);
      await page.waitForFunction(() => neo.scene.game.index === 1, null, { timeout: 8000 });
      await settle();
      await turn(3);
      await choose(2);
      assert.deepEqual(await tally(), [2, 0], "can't tell yet once the edges show: a miss");
      await turn(4);
      await portrait('puddle-lens-7-cheek-portrait');
      await choose(1);
      await page.waitForFunction(() => neo.scene.game.index === 2, null, { timeout: 8000 });
      await settle();
      await page.evaluate(() => neo.scene.game.askForHint());
      await page.waitForFunction(() => neo.scene.game.stop === 3, null, { timeout: 5000 });
      await settle();
      assert.deepEqual(await tally(), [2, 1], 'Show a hint turns the leaf to stop 3 and counts one');
      await choose(0);
      await finished('puddle-lens');
      assert.deepEqual(await score(), [2, 1], 'level 7 saved two misses and one hint');
      log(
        "Puddle Lens 7: a free early answer, a wrong kind and a can't-tell miss at stop 3, a counted hint to stop 3, cheek portrait, saved 2/1",
      );
    }
    // Level 8: tiny green living things, green all through the water, can't tell yet.
    if (!only.length || only.includes(8)) {
      await launch('puddle-lens', 8);
      await settle();
      assert.deepEqual(
        await page.evaluate(() => neo.scene.game.greens),
        ['green-balls', 'green-water', 'green-threads'],
        'the authored drops',
      );
      await turn(3);
      await choose(0);
      await choose(2);
      assert.deepEqual(await tally(), [0, 0], 'dots at stop 3 decide nothing: both answers free');
      await turn(4);
      await choose(0);
      await page.waitForFunction(() => neo.scene.game.index === 1, null, { timeout: 8000 });
      await settle();
      await turn(3);
      await turn(4);
      await portrait('puddle-lens-8-water-portrait');
      await choose(0);
      assert.deepEqual(await tally(), [1, 0], 'living for the coloured water at stop 4: a miss');
      await choose(1);
      await page.waitForFunction(() => neo.scene.game.index === 2, null, { timeout: 8000 });
      await settle();
      await auto();
      await finished('puddle-lens');
      assert.deepEqual(await score(), [1, 0], 'level 8 saved one miss');
      log(
        'Puddle Lens 8: free answers at stop 3, a wrong verdict on the coloured water at stop 4, portrait, saved 1/0',
      );
    }
    // Level 9 (grown-up): three field-guide cards and can't tell yet; the view rules cards out.
    if (!only.length || only.includes(9)) {
      await launch('puddle-lens', 9);
      await settle();
      assert.deepEqual(
        await page.evaluate(() => neo.scene.game.files.map((f) => f.case.id)),
        ['N2', 'N5', 'N3'],
        'the authored files',
      );
      assert.equal(await page.evaluate(() => neo.scene.game.stop), 2, 'level 9 starts at the hand lens');
      assert.equal(
        await page.evaluate(() => neo.scene.game.choiceButtons.length),
        4,
        "three cards and can't tell yet",
      );
      await card('swimmer');
      assert.deepEqual(await tally(), [0, 0], 'a card before anything shows is free');
      await turn(3);
      await card('swimmer');
      assert.deepEqual(await tally(), [1, 0], 'a swimmer for the bubble at stop 3: ruled out, a miss');
      await card('bubble');
      await page.waitForFunction(() => neo.scene.game.index === 1, null, { timeout: 8000 });
      await settle();
      assert.deepEqual(await page.evaluate(() => neo.scene.game.closed), ['bubble'], 'the folder is stamped');
      await turn(3);
      await portrait('puddle-lens-9-silt-portrait');
      await card('swimmer');
      assert.deepEqual(await tally(), [2, 0], 'a swimmer for a dot at stop 3: ruled out, a miss');
      await card('green-ball');
      await card('cant-tell');
      assert.deepEqual(await tally(), [2, 0], "a card still standing and can't tell yet are free at stop 3");
      await turn(4);
      await card('silt');
      await page.waitForFunction(() => neo.scene.game.index === 2, null, { timeout: 8000 });
      await settle();
      await page.evaluate(() => neo.scene.game.askForHint());
      await page.waitForFunction(() => neo.scene.game.stop === 3, null, { timeout: 5000 });
      await settle();
      assert.deepEqual(await tally(), [2, 1], 'Show a hint turns the cheek cells to stop 3 and counts one');
      await card('cheek-cells');
      await finished('puddle-lens');
      assert.deepEqual(await score(), [2, 1], 'level 9 saved two misses and one hint');
      log(
        "Puddle Lens 9: a free early card, two ruled-out cards, free standing card and can't tell at stop 3, a counted hint, silt portrait, saved 2/1",
      );
    }
    // Level 10 (grown-up): a scale bar in the view and three lengths ten times apart.
    if (!only.length || only.includes(10)) {
      await launch('puddle-lens', 10);
      await settle();
      assert.deepEqual(
        await page.evaluate(() => neo.scene.game.measures.map((f) => f.sample)),
        ['swimmer', 'green-ball', 'sand-grain'],
        'the authored files',
      );
      assert.equal(await page.evaluate(() => neo.scene.game.stop), 2, 'level 10 starts at the hand lens');
      assert.equal(await page.evaluate(() => neo.scene.game.choiceButtons.length), 3, 'three lengths');
      await choose(2);
      assert.deepEqual(await tally(), [0, 0], 'a length before both ends show beside a bar is free');
      await turn(3);
      await portrait('puddle-lens-10-swimmer-portrait');
      await choose(0);
      assert.deepEqual(await tally(), [1, 0], '20 µm for the swimmer beside its bar: a miss');
      await choose(1);
      await page.waitForFunction(() => neo.scene.game.index === 1, null, { timeout: 8000 });
      await settle();
      assert.deepEqual(
        await page.evaluate(() => neo.scene.game.lengths),
        ['200 µm'],
        'the folder is stamped',
      );
      await turn(3);
      const right = await page.evaluate(() => neo.scene.game.measure.slot);
      await choose(right);
      assert.deepEqual(
        await tally(),
        [1, 0],
        'the green ball is only a dot at stop 3: even its true length is free',
      );
      assert.equal(await page.evaluate(() => neo.scene.game.index), 1, 'and does not close the file');
      await page.evaluate(() => neo.scene.game.askForHint());
      await page.waitForFunction(() => neo.scene.game.stop === 4, null, { timeout: 5000 });
      await settle();
      assert.deepEqual(await tally(), [1, 1], 'Show a hint turns the green ball to stop 4 and counts one');
      await auto();
      await finished('puddle-lens');
      assert.deepEqual(await score(), [1, 1], 'level 10 saved one miss and one hint');
      log(
        'Puddle Lens 10: a free early length, a wrong length beside the bar, a free length on a dot, a counted hint, swimmer portrait, saved 1/1',
      );
    }
    // Level 11 (grown-up): open cases. Some files cannot be closed by any stop, and not enough evidence is then the right close.
    if (!only.length || only.includes(11)) {
      await launch('puddle-lens', 11);
      await settle();
      assert.deepEqual(
        await page.evaluate(() => neo.scene.game.files.map((f) => f.case.id)),
        ['O3', 'O1', 'O5'],
        'the authored files',
      );
      assert.equal(await page.evaluate(() => neo.scene.game.stop), 2, 'level 11 starts at the hand lens');
      assert.equal(
        await page.evaluate(() => neo.scene.game.choiceButtons.length),
        4,
        'three cards and the fourth answer',
      );
      await turn(3);
      assert.equal(
        await page.evaluate(() => neo.scene.game.openShown),
        false,
        "below the closest stop it is can't tell yet",
      );
      await card('cheek-cells');
      assert.deepEqual(await tally(), [1, 0], 'animal cells for cork at stop 3: ruled out, a miss');
      await card('cant-tell');
      await card('onion-skin');
      assert.deepEqual(await tally(), [1, 0], "can't tell yet and a card still standing are free at stop 3");
      await turn(4);
      assert.equal(
        await page.evaluate(() => neo.scene.game.openShown),
        true,
        'at the closest stop the fourth answer is the closed folder',
      );
      await card('cork');
      await page.waitForFunction(() => neo.scene.game.index === 1, null, { timeout: 8000 });
      await settle();
      assert.deepEqual(await page.evaluate(() => neo.scene.game.closed), ['cork'], 'the folder is stamped');
      await turn(4);
      await portrait('puddle-lens-11-tiny-dot-portrait');
      await card('tiny-living');
      assert.deepEqual(await tally(), [2, 0], 'naming one of two cards that both fit the dot: a miss');
      assert.equal(await page.evaluate(() => neo.scene.game.index), 1, 'and does not close the file');
      await card('cant-tell');
      await page.waitForFunction(() => neo.scene.game.index === 2, null, { timeout: 8000 });
      await settle();
      assert.deepEqual(
        await page.evaluate(() => neo.scene.game.closed),
        ['cork', 'cant-tell'],
        'the file closes as not enough evidence',
      );
      await page.evaluate(() => neo.scene.game.askForHint());
      await page.waitForFunction(() => neo.scene.game.stop === 4, null, { timeout: 5000 });
      await settle();
      assert.deepEqual(await tally(), [2, 1], 'Show a hint turns the green ball to stop 4 and counts one');
      await card('cant-tell');
      assert.deepEqual(await tally(), [3, 1], 'not enough evidence on a file one card can close: a miss');
      await auto();
      await finished('puddle-lens');
      assert.deepEqual(await score(), [3, 1], 'level 11 saved three misses and one hint');
      log(
        'Puddle Lens 11: a ruled-out card, free answers at stop 3, cork closed, a named survivor on the open dot (a miss), not enough evidence closes it, a counted hint, a wrong not-enough-evidence, tiny-dot portrait, saved 3/1',
      );
    }
  }
  // Level 1 at lap: a touch anywhere swells the lens, a touch while it moves changes nothing, the next thing waits for
  // her touch (no timer), and the pause sheet's hint is not counted.
  async function lap() {
    const settle = async () => {
      await page.waitForTimeout(250);
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 20000 });
      await page.waitForTimeout(200);
    };
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return { swollen: g.swollen, busy: g.busy, index: g.index, hints: g.tally.hints };
      });
    // A corner far from the lens (top right), checked to be outside it.
    const tapOutside = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        const { x, y, r } = g.layout.lens;
        const at = { x: g.view.w - 40, y: 40 };
        if (Math.hypot(at.x - x, at.y - y) <= r) throw new Error('the corner is inside the lens');
        const p = g.board.toGlobal(at);
        kit.tap(p.x, p.y);
      });
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('puddle-lens', 1, 'Mia', 'lap');
    await settle();
    await tapOutside();
    await page.waitForTimeout(300);
    let s = await state();
    assert.ok(s.busy && !s.swollen, 'a touch outside the lens starts the swell');
    await tapOutside();
    await page.waitForFunction(() => neo.scene.game.swollen, null, { timeout: 5000 });
    s = await state();
    assert.equal(s.index, 0, 'a touch while the lens moves does not skip ahead');
    await page.waitForTimeout(3000);
    s = await state();
    assert.ok(s.swollen && s.index === 0, 'the swollen lens waits for her touch, not a timer');
    // Turned to portrait while swollen (the rebuild waits): the new far corner still answers.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await tapOutside();
    await page.waitForFunction(() => neo.scene.game.index === 1, null, { timeout: 5000 });
    await page.setViewportSize({ width: 1024, height: 768 });
    await settle();
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForFunction(() => neo.scene.game.swollen, null, { timeout: 5000 });
    assert.equal((await state()).hints, 0, "at lap the pause sheet's hint is not counted");
    await screenshot('puddle-lens-1-lap');
    // The ghost finger finishes the round: on the lens, both to swell and to bring the next thing.
    for (let i = 0; i < 20 && !(await page.evaluate(() => neo.scene.finished)); i++) {
      await page.evaluate(() => {
        const t = neo.scene.game.autotouch();
        if (t) kit.tapOn(t.tap.on);
      });
      await page.waitForTimeout(700);
    }
    await finished('puddle-lens');
    const r = await page.evaluate(() => kit.store.stats('puddle-lens').history.at(-1));
    assert.deepEqual([r.misses, r.hints], [0, 0], 'lap level 1 counts nothing');
  }
  async function early() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('puddle-lens').history.at(-1);
        return [r.misses, r.hints];
      });
    const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
    const settle = async () => {
      await page.waitForTimeout(250);
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 20000 });
      await page.waitForTimeout(200);
    };
    const turn = async (stop) => {
      await page.evaluate((stop) => kit.tapOn(neo.scene.game.stopButtons[stop - 1]), stop);
      await page.waitForFunction((stop) => neo.scene.game.stop === stop, stop, { timeout: 5000 });
      await page.waitForTimeout(400);
    };
    const show = async () => {
      await page.evaluate(() => kit.tapOn(neo.scene.game.answer));
      await page.waitForTimeout(300);
    };
    // Toddler's level 1: a tap on the lens; the swell shrinks back by itself (or on a second tap).
    await launch('puddle-lens', 1, 'Mia', 'toddler');
    await settle();
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => kit.tapOn(neo.scene.game.lensHit));
      await page.waitForFunction(() => neo.scene.game.swollen, null, { timeout: 5000 });
      if (i === 0) await page.evaluate(() => kit.tapOn(neo.scene.game.lensHit));
      await page.waitForFunction((i) => neo.scene.finished || neo.scene.game.index > i, i, { timeout: 8000 });
      await settle();
    }
    await finished('puddle-lens');
    assert.deepEqual(await score(), [0, 0], 'level 1 has nothing to get wrong');
    await launch('puddle-lens', 4);
    await settle();
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.questions.slice(0, 2).map((q) => q.feature)),
      ['boxes', 'leaf'],
      'the authored leaf round',
    );
    await turn(2);
    await show();
    assert.deepEqual(await tally(), [1, 0], 'boxes at the hand lens are too small: a miss');
    await turn(4);
    await show();
    await settle();
    assert.equal(await page.evaluate(() => neo.scene.game.index), 1, 'boxes at the closest stop: shown');
    await show();
    assert.deepEqual(await tally(), [2, 0], 'the whole leaf at the closest stop is too close: a miss');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForFunction(() => neo.scene.game.stop === 1, null, { timeout: 5000 });
    assert.deepEqual(await tally(), [2, 1], 'Show a hint turns the dial and counts one');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    assert.deepEqual(await tally(), [2, 1], 'a second hint on the same question counts nothing more');
    await show();
    await settle();
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('puddle-lens-4-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    for (let i = 0; i < 30 && !(await page.evaluate(() => neo.scene.finished)); i++) {
      await settle();
      await page.evaluate(() => {
        const t = neo.scene.game.autotouch();
        if (t) kit.tapOn(t.tap.on);
      });
      await page.waitForTimeout(500);
    }
    await finished('puddle-lens');
    assert.deepEqual(await score(), [2, 1]);
    const choose = async (i) => {
      await page.evaluate((i) => kit.tapOn(neo.scene.game.choiceButtons[i]), i);
      await settle();
    };
    const auto = async () => {
      for (let i = 0; i < 40 && !(await page.evaluate(() => neo.scene.finished)); i++) {
        await settle();
        await page.evaluate(() => {
          const t = neo.scene.game.autotouch();
          if (t) kit.tapOn(t.tap.on);
        });
        await page.waitForTimeout(500);
      }
    };
    // Level 5: alive, not alive, can't tell yet.
    await launch('puddle-lens', 5);
    await settle();
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.lifeDrops.map((d) => d.pair)),
      ['A', 'C', 'B'],
      'the authored drops',
    );
    assert.equal(await page.evaluate(() => neo.scene.game.stop), 2, 'level 5 starts at the hand lens');
    await choose(0);
    await choose(2);
    assert.deepEqual(await tally(), [0, 0], 'early guesses are free');
    await turn(3);
    await choose(1);
    assert.deepEqual(await tally(), [1, 0], 'not alive for the swimmer at stop 3: a miss');
    // U7 R4: neither the pressed answer's name nor the right answer's line (2.4 s each when muted) holds the next
    // drop; it follows a 0.6 s beat.
    await page.evaluate(() => kit.tapOn(neo.scene.game.choiceButtons[0]));
    await page.waitForFunction(() => neo.scene.game.index === 1 && !neo.scene.game.busy, null, {
      timeout: 1500,
    });
    await settle();
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('puddle-lens-5-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(800);
    await screenshot('puddle-lens-5-landscape');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForFunction(() => neo.scene.game.stop === 4, null, { timeout: 5000 });
    await settle();
    assert.deepEqual(
      await tally(),
      [1, 1],
      'Show a hint turns the dial to the closest stop for the silt and counts one',
    );
    await choose(1);
    await page.waitForFunction(() => neo.scene.finished || neo.scene.game.index === 2, null, {
      timeout: 8000,
    });
    await auto();
    await finished('puddle-lens');
    assert.deepEqual(await score(), [1, 1], 'level 5 saved one miss and one hint');
    // Level 6: one cell, many cells, not cells.
    await launch('puddle-lens', 6);
    await settle();
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.sorts),
      ['green-thread', 'swimmer', 'sand', 'green-ball'],
      'the authored slides',
    );
    await choose(0);
    assert.deepEqual(await tally(), [0, 0], 'a tray before the edges show is free');
    await turn(3);
    await choose(1);
    await page.waitForFunction(() => neo.scene.game.index === 1, null, { timeout: 8000 });
    await settle();
    await turn(3);
    await choose(1);
    assert.deepEqual(await tally(), [1, 0], 'many cells for the swimmer: a miss');
    await choose(0);
    await page.waitForFunction(() => neo.scene.game.index === 2, null, { timeout: 8000 });
    await settle();
    await screenshot('puddle-lens-6-landscape');
    await auto();
    await finished('puddle-lens');
    assert.deepEqual(await score(), [1, 0], 'level 6 saved one miss');
    log(
      'Puddle Lens 5 and 6: free early guesses, a miss at the deciding stop, a counted hint to stop 4, portrait and landscape button groups, a free tray, a wrong tray, saved 1/1 and 1/0',
    );
    log(
      'Puddle Lens 1 and 4: three swells (one shrunk early), authored leaf, too small and too close misses, one counted hint, portrait, saved score passed',
    );
  }
  return { lensPlay };
}
