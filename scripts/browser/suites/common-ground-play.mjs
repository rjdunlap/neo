import assert from 'node:assert/strict';

export function createSuite({ page, log, launch, finished, screenshot }) {
  /**
   * Common Ground level 1, in portrait: a cushion in the wrong row with the basket beside it, a Visit that names the cushion
   * (one miss), Help (one hint) and the glowing move, a plant on a free cell, then Visit again: the friend sits and the round
   * finishes with one miss and one hint.
   */
  async function commonGroundPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('common-ground').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          room: [...g.room],
          misses: g.t.misses,
          hints: g.t.hints,
          hint: g.hint,
          fixture: g.visit.fixture,
        };
      });
    const dragToCell = (piece, cell) =>
      page.evaluate(
        async ([piece, cell]) => {
          const g = neo.scene.game;
          const node = g.pieces.find((p) => p.piece === piece).node;
          const c = g.layout.cells[cell];
          const p = node.parent.toGlobal({ x: c.x, y: c.y });
          await kit.dragTo(node, { x: p.x, y: p.y + 40 * neo.view.scale }, 18);
        },
        [piece, cell],
      );
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('common-ground', 1);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('common-ground-portrait');
    const { fixture } = await state();
    const right = fixture === 'window' ? 0 : 1;
    const wrong = 1 - right;
    await dragToCell('cushion', wrong * 3 + 1);
    await dragToCell('basket', right * 3 + 1);
    await page.waitForTimeout(300);
    let s = await state();
    assert.equal(s.room[wrong * 3 + 1], 'cushion', 'the cushion goes where it was dropped');
    assert.equal(s.misses, 0, 'placing is free');
    await page.evaluate(() => kit.tapOn(neo.scene.game.go));
    await page.waitForTimeout(500);
    s = await state();
    assert.equal(s.misses, 1, 'Visit with the cushion off its wall is one miss');
    assert.equal(s.room[wrong * 3 + 1], 'cushion', 'her arrangement is kept');
    await page.evaluate(() => neo.scene.game.askForHint());
    s = await state();
    assert.equal(s.hints, 1, 'Help is one hint');
    assert.equal(s.hint.piece, 'cushion');
    assert.equal(s.hint.cell, right * 3 + 1);
    await dragToCell('cushion', s.hint.cell);
    await page.waitForTimeout(300);
    s = await state();
    assert.equal(s.room[right * 3 + 1], 'cushion');
    const free = s.room.findIndex((p) => p === null);
    await dragToCell('plant', free);
    await page.waitForTimeout(300);
    await page.evaluate(() => kit.tapOn(neo.scene.game.go));
    await finished('common-ground');
    assert.deepEqual(await score(), [1, 1], 'one miss and one hint are saved');
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Common Ground 1: portrait, misplaced cushion, Visit miss, Help, plant, friend sits, saved score passed',
    );
  }
  return { commonGroundPlay };
}
