import assert from 'node:assert/strict';

export function createSuite({ page, finished, screenshot, launch }) {
  /** Bunny Patches by touch: level 1 (pre-K, one bunny given) with a full wrong board (one miss, repeat judging free), a hint and the right bunnies; level 3 (school and grown-up) with paw marks, the lamp and the answer in two taps a square, an upright screenshot of each. */
  async function bunnyPatchesPlay() {
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    const tapCell = async (at) => {
      await page.evaluate((at) => kit.tapOn(neo.scene.game.cells[at]), at);
      await page.waitForTimeout(170);
    };
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          misses: g.misses,
          hints: g.hints,
          bunnies: g.bunnies.slice(),
          n: g.board.n,
          finished: g.finished,
        };
      });
    const answer = () =>
      page.evaluate(() => neo.scene.game.board.solution.map((c, r) => r * neo.scene.game.board.n + c));

    /** The level on an upright 390 × 844 phone: upright view, squares of 100 units or more, one screenshot. */
    const upright = async (level) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await launch('bunny-patches', level);
      await page.waitForTimeout(400);
      const [up, cell] = await page.evaluate(() => [neo.view.upright, neo.scene.game.cell]);
      assert.equal(up, true);
      assert.ok(cell >= 100, `squares are ${cell} units`);
      await screenshot(`bunny-patches-portrait-${level}`);
      await page.setViewportSize({ width: 1024, height: 768 });
    };

    if (process.env.BUNNY_ONLY === 'upright') {
      await upright(1);
      await upright(3);
      return;
    }

    // Level 1.
    await launch('bunny-patches', 1);
    await page.waitForTimeout(400);
    let s = await state();
    assert.equal(s.n, 4);
    assert.equal(s.bunnies.length, 1, 'the given bunny is already sitting');
    const given = s.bunnies[0];
    await tapCell(given);
    assert.deepEqual((await state()).bunnies, [given], 'the given bunny cannot be lifted');
    const ans = await answer();
    const wrong = await page.evaluate((ans) => {
      const g = neo.scene.game;
      return [...Array(16).keys()].filter((i) => !ans.includes(i) && i !== g.bunnies[0]).slice(0, 3);
    }, ans);
    for (const at of wrong) await tapCell(at);
    s = await state();
    assert.equal(s.bunnies.length, 4);
    assert.equal(s.misses, 1, 'a full wrong board is one miss');
    await tapCell(wrong[0]);
    await tapCell(wrong[0]);
    assert.equal((await state()).misses, 1, 'the same full board judged again is free');
    const other = await page.evaluate(
      (ans) => [...Array(16).keys()].find((i) => !ans.includes(i) && !neo.scene.game.bunnies.includes(i)),
      ans,
    );
    await tapCell(wrong[0]);
    await tapCell(other);
    assert.equal((await state()).misses, 2, 'a changed full board is judged again');
    await tapCell(other);
    await page.evaluate(() => kit.tapOn(neo.scene.game.hintButton));
    await page.waitForTimeout(200);
    assert.ok((await state()).hints >= 1);
    for (const at of wrong)
      await page
        .evaluate((at) => neo.scene.game.bunnies.includes(at) && kit.tapOn(neo.scene.game.cells[at]), at)
        .then(() => page.waitForTimeout(170));
    for (const at of ans) if (!(await state()).bunnies.includes(at)) await tapCell(at);
    await page.waitForTimeout(300);
    assert.equal((await state()).finished, true);
    await finished('bunny-patches');

    // Level 3: paw marks are free, the lamp is off until asked for.
    await launch('bunny-patches', 3);
    await page.waitForTimeout(400);
    const ans3 = await answer();
    await tapCell(0);
    assert.deepEqual((await state()).bunnies, [], 'one tap is a paw mark, not a bunny');
    await tapCell(0);
    assert.deepEqual((await state()).bunnies, [0], 'a second tap puts the bunny down');
    await tapCell(0);
    assert.deepEqual((await state()).bunnies, [], 'a third tap clears the square');
    for (const at of ans3) {
      await tapCell(at);
      await tapCell(at);
    }
    await page.waitForTimeout(300);
    s = await state();
    assert.equal(s.finished, true);
    assert.equal(s.misses, 0);
    await finished('bunny-patches');
  }
  return { bunnyPatchesPlay };
}
