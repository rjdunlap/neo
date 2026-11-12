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
    // LENS_LEVELS=7,8 plays only the wall-clue and why-green levels.
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
    await launch('puddle-lens', 1);
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
    // U7 R4: neither the pressed name nor the right answer's line (2.4 s each when muted) holds the next drop.
    await page.evaluate(() => kit.tapOn(neo.scene.game.choiceButtons[0]));
    await page.waitForFunction(() => neo.scene.game.index === 1 && !neo.scene.game.busy, null, {
      timeout: 2000,
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
