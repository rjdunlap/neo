import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot }) {
  /** Campsite by touch on an upright phone: a free tree tap and short check, the authored touching camp (one miss, checked again free), a fourth tent refused, a changed wrong camp (second miss and its hint), a Hint press, the revision and the finish. */
  async function campsitePlay() {
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    const tap = async (at) => {
      await page.evaluate((at) => kit.tapOn(neo.scene.game.cells[at]), at);
      await page.waitForTimeout(170);
    };
    const check = async () => {
      await page.evaluate(() => kit.tapOn(neo.scene.game.checkButton));
      await page.waitForTimeout(200);
    };
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          misses: g.misses,
          hints: g.hints,
          tents: g.tents.slice().sort((a, b) => a - b),
          finished: g.finished,
        };
      });
    // Squares counted row by row from 0: R1C2 = 1, R1C3 = 2, R1C4 = 3, R3C3 = 10, R3C4 = 11, R4C1 = 12.
    await page.setViewportSize({ width: 390, height: 844 });
    await launch('campsite', 1);
    await page.waitForTimeout(400);
    const [up, cell] = await page.evaluate(() => [neo.view.upright, neo.scene.game.cell]);
    assert.equal(up, true);
    assert.ok(cell >= 100, `squares are ${cell} units`);

    await tap(0);
    assert.deepEqual((await state()).tents, [], 'a tree tap lights its sides and pitches nothing');
    await tap(1);
    await check();
    assert.equal((await state()).misses, 0, 'checking a part-full camp is free');

    await tap(2);
    await tap(11);
    await tap(12);
    assert.deepEqual((await state()).tents, [1, 2, 11], 'a fourth tent is refused');
    await check();
    assert.equal((await state()).misses, 1, 'the touching camp is one miss');
    await screenshot('campsite-portrait');
    await check();
    assert.equal((await state()).misses, 1, 'the same camp checked again is free');

    await tap(11);
    await tap(12);
    await check();
    let s = await state();
    assert.equal(s.misses, 2, 'a changed wrong camp is a second miss');
    assert.equal(s.hints, 1, 'the second miss brings the hint by itself');
    await page.evaluate(() => kit.tapOn(neo.scene.game.hintButton));
    await page.waitForTimeout(200);
    assert.equal((await state()).hints, 2, 'a Hint press counts one');

    // The revision: pack up the stray tents, pitch the answer.
    await tap(2);
    await tap(12);
    await tap(10);
    await tap(3);
    assert.deepEqual((await state()).tents, [1, 3, 10]);
    await check();
    await page.waitForTimeout(300);
    s = await state();
    assert.equal(s.finished, true);
    assert.equal(s.misses, 2);
    await finished('campsite');
    await page.setViewportSize({ width: 1024, height: 768 });
  }
  return { campsitePlay };
}
