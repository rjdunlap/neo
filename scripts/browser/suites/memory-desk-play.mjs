import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot }) {
  async function memoryDeskPlay() {
    const tapOn = async (expr) => {
      await page.evaluate((expr) => kit.tapOn(Function(`return (${expr})`)()), expr);
      await page.waitForTimeout(250);
    };
    const settle = async () => {
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.fly, null, { timeout: 10000 });
      await page.waitForTimeout(150);
    };
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          desk: [g.state.input, g.state.stored, g.state.output],
          presses: g.history.length,
          contrast: g.contrast,
          tally: [g.tally.misses, g.tally.hints],
          pointing: g.pointing !== null,
          doneAlpha: g.doneButton.alpha,
          finished: neo.scene.finished === true,
        };
      });
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 1: a dim Done and an empty Keep are free nudges; Keep and Show copy; the contrast lights Done; Help is one hint.
    await launch('memory-desk', 1);
    await settle();
    const [a, b] = await page.evaluate(() => neo.scene.game.brief.tokens);
    assert.notEqual(a, b, 'two different pictures');
    let s = await state();
    assert.deepEqual(s.desk, [null, null, null], 'the desk starts empty');
    assert.ok(s.doneAlpha < 1, 'Done starts dim');

    await tapOn('neo.scene.game.doneButton');
    s = await state();
    assert.equal(s.finished, false, 'a dim Done does not end the round');
    assert.equal(s.pointing, true, 'a dim Done points at the next thing to try');

    await tapOn('neo.scene.game.keepButton');
    s = await state();
    assert.deepEqual(s.desk, [null, null, null], 'Keep on an empty tray changes nothing');
    assert.equal(s.presses, 0, 'an empty Keep is not a press to undo');

    await tapOn('neo.scene.game.showButton');
    s = await state();
    assert.deepEqual(s.desk, [null, null, null], 'Show on an empty drawer shows nothing');

    await tapOn('neo.scene.game.cardNodes[0]');
    await tapOn('neo.scene.game.keepButton');
    await settle();
    s = await state();
    assert.deepEqual(s.desk, [a, a, null], 'Keep copies the tray into the drawer; the tray keeps its own');

    await tapOn('neo.scene.game.showButton');
    await settle();
    s = await state();
    assert.deepEqual(s.desk, [a, a, a], 'Show copies the drawer into the window');
    assert.equal(s.contrast, false, 'no contrast while the tray has not changed');

    // A requested Help: one hint, pointing at the other picture.
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(200);
    s = await state();
    assert.deepEqual(s.tally, [0, 1], 'Help is one hint and no miss');
    assert.equal(s.pointing, true, 'Help points at a control');

    await tapOn('neo.scene.game.cardNodes[1]');
    s = await state();
    assert.deepEqual(s.desk, [b, a, a], 'changing the tray changes nothing else');
    await tapOn('neo.scene.game.undoButton');
    await page.waitForTimeout(450);
    s = await state();
    assert.deepEqual(s.desk, [a, a, a], 'Undo takes back the last press');
    await tapOn('neo.scene.game.cardNodes[1]');

    // A second press during a slide jumps to the settled picture.
    await tapOn('neo.scene.game.showButton');
    await settle();
    s = await state();
    assert.deepEqual(s.desk, [b, a, a], 'the window shows the kept one, not the tray');
    assert.equal(s.contrast, true, 'the contrast has been seen');
    assert.equal(s.doneAlpha, 1, 'Done lights');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    s = await state();
    assert.deepEqual(s.desk, [b, a, a], 'the desk survives a turn to portrait');
    await screenshot('memory-desk-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    await screenshot('memory-desk-landscape');

    await tapOn('neo.scene.game.doneButton');
    await finished('memory-desk');
    const last = await page.evaluate(() => {
      const r = kit.store.stats('memory-desk').history.at(-1);
      return [r.misses, r.hints];
    });
    assert.deepEqual(last, [0, 1], 'nothing is a miss; the one Help is the one hint');

    // Levels 2–3, the hatch.
    const hatch = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          bi: g.bi,
          hatches: [...g.hatches],
          pos: g.pos,
          desk: [g.state.input, g.state.stored, g.state.output],
          tally: [g.tally.misses, g.tally.hints],
          glowing: g.glowing !== null,
          helpAt: g.helpAt,
          undoAlpha: g.undoButton.alpha,
          finished: neo.scene.finished === true || g.finished,
        };
      });
    const still = async () => {
      await page.waitForFunction(
        () => neo.scene.finished || neo.scene.game.finished || (!neo.scene.game.busy && neo.scene.game.playTo === null),
        null,
        { timeout: 15000 },
      );
      await page.waitForTimeout(450);
    };
    const press = async (expr) => {
      await tapOn(`neo.scene.game.${expr}`);
      await still();
    };
    const help = async () => {
      await page.evaluate(() => neo.scene.game.askForHint());
      await still();
    };

    // Level 2: an untouched Check is a nudge; a failed Check is a miss; the second brings the glow; both briefs pass.
    await launch('memory-desk', 2);
    await still();
    const [x, y] = await page.evaluate(() => neo.scene.game.brief.queue);
    let h = await hatch();
    assert.deepEqual(h.hatches, [false, false], 'both hatches start shut');
    assert.deepEqual(h.desk, [null, null, null], 'the desk starts empty');
    assert.equal(await page.evaluate(() => neo.scene.game.brief.target), y, 'the first sign wants the second picture');
    await press('checkButton');
    h = await hatch();
    assert.deepEqual([h.tally, h.bi, h.pos], [[0, 0], 0, 0], 'an untouched Check is a nudge, not a miss or a run');

    await press('hatchNodes[1]');
    await press('undoButton');
    h = await hatch();
    assert.deepEqual(h.hatches, [false, false], 'Undo takes back the last hatch change');
    assert.ok(h.undoAlpha < 1, 'Undo dims with nothing to take back');

    await press('hatchNodes[0]');
    await press('stepButton');
    h = await hatch();
    assert.deepEqual([h.pos, h.desk], [3, [x, x, x]], 'one Step: the picture arrives, goes in through the open hatch and shows');
    await press('stepButton');
    h = await hatch();
    assert.deepEqual([h.pos, h.desk], [6, [y, x, x]], 'a shut hatch keeps the old one while the tray changes');
    assert.deepEqual(h.tally, [0, 0], 'stepping is never counted');

    await press('checkButton');
    h = await hatch();
    assert.deepEqual([h.tally, h.bi, h.glowing], [[1, 0], 0, false], 'a failed Check is one miss and no glow yet');
    await press('checkButton');
    h = await hatch();
    assert.deepEqual([h.tally, h.glowing], [[1, 0], false], 'the same hatches checked again are not a second miss');
    await press('hatchNodes[0]');
    h = await hatch();
    assert.equal(h.pos, 0, 'changing a hatch clears her run from that step on');
    await press('checkButton');
    h = await hatch();
    assert.deepEqual([h.tally, h.glowing], [[2, 1], true], 'the second failed Check brings the glow and one hint');

    await press('hatchNodes[1]');
    await press('checkButton');
    await page.waitForFunction(() => neo.scene.game.bi === 1 && !neo.scene.game.busy, null, { timeout: 15000 });
    await page.waitForTimeout(450);
    h = await hatch();
    assert.deepEqual(h.hatches, [false, false], 'the second brief starts shut again');
    assert.equal(await page.evaluate(() => neo.scene.game.brief.target), x, 'the second sign wants the first picture');
    await press('hatchNodes[0]');
    await screenshot('memory-desk-level-2');
    await tapOn('neo.scene.game.checkButton');
    await finished('memory-desk');
    let round = await page.evaluate(() => {
      const r = kit.store.stats('memory-desk').history.at(-1);
      return [r.level, r.misses, r.hints];
    });
    assert.deepEqual(round, [2, 2, 1], 'level 2: two misses, the one glow, one round');

    // Level 3: the wrong desk; Help shows the step, then sets the hatch; two repairs to the sticker.
    await launch('memory-desk', 3);
    await still();
    for (const bi of [0, 1]) {
      const b = await page.evaluate(() => {
        const { brief } = neo.scene.game;
        return { preset: [...brief.preset], stored: brief.initialStored, queue: [...brief.queue] };
      });
      h = await hatch();
      assert.equal(h.bi, bi);
      assert.deepEqual(h.hatches, b.preset, 'the desk starts on its wrong preset');
      assert.deepEqual(h.desk, [null, b.stored, null], 'the drawer starts with a token kept');
      if (bi === 0) {
        await press('checkButton');
        h = await hatch();
        assert.deepEqual([h.tally, h.pos], [[0, 0], 0], 'an untouched Check on the wrong desk is a nudge');
      }
      await help();
      h = await hatch();
      assert.deepEqual(h.hatches, b.preset, 'the first Help changes nothing');
      assert.deepEqual([h.tally, h.glowing], [[0, 2 * bi + 1], true], 'the first Help is one hint and a glow');
      assert.equal(h.pos, 3 * h.helpAt + 2, 'it stops at the write of the step it names');
      await help();
      h = await hatch();
      assert.equal(h.hatches.filter((v, i) => v !== b.preset[i]).length, 1, 'the second Help sets that one hatch');
      assert.deepEqual(h.tally, [0, 2 * bi + 2], 'and is one more hint');
      if (bi === 0) {
        // Her run was cleared from the changed hatch on; Step runs the rest of the row.
        for (let i = h.pos / 3; i < 3; i++) await press('stepButton');
        h = await hatch();
        assert.equal(h.pos, 9, 'Step runs the rest of her row');
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(500);
        h = await hatch();
        assert.equal(h.pos, 9, 'her run survives a turn to portrait');
        await screenshot('memory-desk-level-3-portrait');
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(400);
        await screenshot('memory-desk-level-3-landscape');
        await tapOn('neo.scene.game.checkButton');
        await page.waitForFunction(() => neo.scene.game.bi === 1 && !neo.scene.game.busy, null, { timeout: 15000 });
        await page.waitForTimeout(450);
      }
    }
    await tapOn('neo.scene.game.checkButton');
    await finished('memory-desk');
    round = await page.evaluate(() => {
      const r = kit.store.stats('memory-desk').history.at(-1);
      return [r.level, r.misses, r.hints];
    });
    assert.deepEqual(round, [3, 0, 4], 'level 3: no miss, four Help presses');
  }
  return { memoryDeskPlay };
}
