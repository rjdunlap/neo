import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot }) {
  async function pondMergePlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('pond-merge').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          pieces: g.pond.pieces.length,
          index: g.index,
          hints: g.hints,
          ghost: g.ghost.visible,
          finishing: g.finishing,
          history: g.history.length,
        };
      });
    // Ready: the last friend has fallen clear and the pile is still (or the round is ending).
    const ready = () =>
      page.waitForFunction(
        () => {
          const g = neo.scene.game;
          return g.finishing || (g.pond.sinceDrop >= 0.4 && g.pond.pieces.every((p) => p.calm >= 0.5));
        },
        null,
        { timeout: 15000 },
      );
    // Put a finger on the friend at the top, slide to board x, and let go (a real pointer, as a finger would).
    const dropAt = (x) =>
      page.evaluate(async (x) => {
        const g = neo.scene.game;
        const from = g.board.toGlobal({ x: g.heldX, y: 60 });
        const to = g.board.toGlobal({ x, y: 60 });
        await kit.drag(kit.line([from.x, from.y], [to.x, to.y], 8));
      }, x);
    const playOn = async (limit) => {
      for (let i = 0; i < limit; i++) {
        await ready();
        if ((await state()).finishing) return;
        await dropAt(await page.evaluate(() => neo.scene.game.hintX()));
      }
    };
    const press = (name) => page.evaluate((n) => kit.tapOn(neo.scene.game.buttons[n]), name);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 1: follow the hint rule (never pressing Hint); a duck appears, 0 misses and 0 hints.
    await launch('pond-merge', 1, 'Mia', 'prek');
    await ready();
    await playOn(40);
    await finished('pond-merge');
    assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

    // Level 3 in portrait: one drop, a free take-back, then one Hint press, and the swan.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('pond-merge', 3, 'Mia', 'school');
    await ready();
    await dropAt(120);
    let s = await state();
    assert.equal(s.pieces, 1, 'one friend in the pond after a drop');
    assert.equal(s.index, 1);
    await press('takeBack');
    s = await state();
    assert.equal(s.pieces, 0, 'take-back empties the pond again');
    assert.equal(s.index, 0, 'take-back returns the same friend');
    assert.equal(s.hints, 0, 'take-back is free');
    await press('hint');
    s = await state();
    assert.equal(s.ghost, true, 'the ghost drop shows');
    assert.equal(s.hints, 1, 'one hint pressed');
    await screenshot('pond-merge-portrait');
    await playOn(80);
    await finished('pond-merge');
    assert.deepEqual(await score(), [0, 1], 'level 3 saved 0 misses, 1 hint');
  }
  return { pondMergePlay };
}
