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

  /**
   * Common Ground level 2, in portrait: a first Visit that is right (cushion mid-row, basket on its left) makes the friend ask for
   * a different side; a Visit with the basket still on the left is one miss ("same"); Help lights the basket's move to the right;
   * one Undo restores the room before it; the same move again, then Visit: the friend sits and the round finishes with one miss
   * and one hint.
   */
  async function commonGroundChangePlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          room: [...g.room],
          phase: g.phase,
          previewed: g.previewed,
          misses: g.t.misses,
          hints: g.t.hints,
          hint: g.hint,
          fixture: g.visit.fixture,
          stack: g.stack.length,
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
    await launch('common-ground', 2);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    const { fixture } = await state();
    const row = fixture === 'window' ? 0 : 1;
    await dragToCell('cushion', row * 3 + 1);
    await dragToCell('basket', row * 3);
    await page.waitForTimeout(300);
    await page.evaluate(() => kit.tapOn(neo.scene.game.go));
    await page.waitForFunction(() => neo.scene.game.phase === 2, null, { timeout: 8000 });
    let s = await state();
    assert.equal(s.previewed, 'left', 'the preview put the basket on the left');
    assert.equal(s.misses, 0, 'a right first Visit is no miss');
    await screenshot('common-ground-changed-portrait');
    await page.evaluate(() => kit.tapOn(neo.scene.game.go));
    await page.waitForTimeout(500);
    s = await state();
    assert.equal(s.misses, 1, 'Visit with the basket on the old side is one miss');
    await page.evaluate(() => neo.scene.game.askForHint());
    s = await state();
    assert.equal(s.hints, 1, 'Help is one hint');
    // The first cell beside the cushion, in reading order, that is not on the left: the right by the window, above for the door.
    assert.deepEqual(
      [s.hint.piece, s.hint.cell],
      ['basket', fixture === 'window' ? 2 : 1],
      'the glow names the other side',
    );
    await dragToCell('basket', s.hint.cell);
    await page.waitForTimeout(300);
    s = await state();
    assert.equal(s.stack, 1, 'one move since the change');
    await page.evaluate(() => kit.tapOn(neo.scene.game.undoBtn));
    await page.waitForTimeout(300);
    s = await state();
    assert.equal(s.room[row * 3], 'basket', 'Undo puts the basket back on its old place');
    assert.equal(s.stack, 0);
    await dragToCell('basket', row * 3 + 2);
    await page.waitForTimeout(300);
    await page.evaluate(() => kit.tapOn(neo.scene.game.go));
    await finished('common-ground');
    const r = await page.evaluate(() => {
      const h = kit.store.stats('common-ground').history.at(-1);
      return [h.misses, h.hints];
    });
    assert.deepEqual(r, [1, 1], 'one miss and one hint across both Visits are saved');
    await page.setViewportSize({ width: 1024, height: 768 });
    log('Common Ground 2: changed request, same-side miss, Help, Undo, revised room, saved score passed');
  }
  return { commonGroundPlay, commonGroundChangePlay };
}
