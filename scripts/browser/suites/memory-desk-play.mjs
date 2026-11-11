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
  }
  return { memoryDeskPlay };
}
