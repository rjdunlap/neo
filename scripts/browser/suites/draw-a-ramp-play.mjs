import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot }) {
  async function drawARampPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('draw-a-ramp').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          index: g.index,
          strokes: g.strokes.length,
          hint: !!g.hintStroke,
          run: !!g.run,
          busy: g.busy,
        };
      });
    const idle = (i) =>
      page.waitForFunction(
        (i) => neo.scene.game.index === i && !neo.scene.game.busy && !neo.scene.game.run,
        i,
        {
          timeout: 15000,
        },
      );
    // Drag a line along board points with a real pointer, as a finger would.
    const draw = (pts) =>
      page.evaluate(async (pts) => {
        const g = neo.scene.game;
        const globals = pts.map(([x, y]) => g.board.toGlobal({ x, y }));
        const path = [];
        for (let i = 1; i < globals.length; i++)
          path.push(...kit.line([globals[i - 1].x, globals[i - 1].y], [globals[i].x, globals[i].y], 14));
        await kit.drag(path);
      }, pts);
    const reference = () =>
      page.evaluate(() => neo.scene.game.puzzle.ref.map((s) => s.map((p) => [p.x, p.y])));
    const press = (name) => page.evaluate((n) => kit.tapOn(neo.scene.game.buttons[n]), name);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 1: Go with nothing drawn only nudges; the reference ramp pops the balloon, twice.
    await launch('draw-a-ramp', 1, 'Mia', 'preschool');
    await idle(0);
    await press('go');
    assert.equal((await state()).run, false, 'Go with no ramp does not run');
    for (let i = 0; i < 2; i++) {
      await idle(i);
      for (const s of await reference()) await draw(s);
      await press('go');
      await page.waitForFunction((i) => neo.scene.game.index > i || neo.scene.game.done, i, {
        timeout: 20000,
      });
    }
    await finished('draw-a-ramp');
    assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

    // Level 3 in portrait: a flat ramp that misses is a free experiment, Hint counts once, then the two reference ramps.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('draw-a-ramp', 3, 'Mia', 'prek');
    await idle(0);
    const [first] = await reference();
    await draw([
      [first[0][0], first[0][1] + 60],
      [first[1][0] - 120, first[1][1] + 60],
    ]);
    await press('go');
    await page.waitForFunction(() => !neo.scene.game.run && neo.scene.game.fails > 0, null, {
      timeout: 20000,
    });
    assert.equal((await state()).strokes, 1);
    await press('hint');
    assert.equal((await state()).hint, true, 'the dashed ramp shows');
    await screenshot('draw-a-ramp-3-portrait-hint');
    await press('clear');
    for (let i = 0; i < 2; i++) {
      await idle(i);
      for (const s of await reference()) await draw(s);
      await press('go');
      await page.waitForFunction((i) => neo.scene.game.index > i || neo.scene.game.done, i, {
        timeout: 20000,
      });
    }
    await finished('draw-a-ramp');
    assert.deepEqual(await score(), [0, 1], 'level 3 saved 0 misses, 1 hint');
  }
  return { drawARampPlay };
}
