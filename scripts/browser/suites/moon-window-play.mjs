import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function moonWindowPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('moon-window').history.at(-1);
        return [r.misses, r.hints];
      });
    const tally = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);
    const settle = async () => {
      await page.waitForTimeout(250);
      await page.waitForFunction(
        () => neo.scene.finished || (!neo.scene.game.busy && !neo.scene.game.unasked),
        null,
        { timeout: 20000 },
      );
      await page.waitForTimeout(200);
    };
    const card = async (i) => {
      await page.evaluate((i) => kit.tapOn(neo.scene.game.cards[i].node), i);
      await settle();
    };
    const board = () =>
      page.evaluate(() => {
        const b = neo.scene.game.round.board;
        return b ? [b.cards, b.answer, b.target ?? b.ask] : null;
      });
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 4 (lap) on a phone: the window is the big thing; touches on the sky corner, the wall and the window each turn
    // it, a touch mid-turn is free, a thumbnail replays without turning, Show a hint counts nothing, then a sticker.
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(400);
    await launch('moon-window', 4, 'Mia', 'lap');
    await page.waitForFunction(() => neo.scene.game?.catcher, null, { timeout: 15000 });
    await screenshot('moon-window-4-start-phone');
    const lap = await page.evaluate(async () => {
      const g = neo.scene.game;
      const v = g.view;
      const at = (x, y) => {
        const p = g.ctx.stage.toGlobal({ x, y });
        kit.tap(p.x, p.y);
      };
      const w = g.layout.window;
      const res = { shown: [], busyTaps: [], thumbs: 0, later: g.laterButton.parent !== null, window: w.w };
      g.askForHint();
      const spots = [
        [v.w - 180, 160],
        [v.w * 0.15, v.h * 0.4],
        [w.x + w.w / 2, w.y + w.h / 2],
      ];
      for (let n = 0; n < 3; n++) {
        await kit.until(() => !g.busy, 15000);
        await kit.sleep(300);
        res.shown.push(g.shown);
        if (n === 1) {
          // A thumbnail answers with its line and does not turn the window.
          const t = g.thumbs[0];
          const p = t.toGlobal({ x: 0, y: 0 });
          kit.tap(p.x, p.y);
          await kit.sleep(300);
          res.afterThumb = g.shown;
        }
        at(...spots[n]);
        await kit.sleep(260);
        res.midTurn = (res.midTurn ?? 0) + (g.busy ? 1 : 0);
        at(v.w * 0.5, v.h * 0.9 - 200);
        await kit.until(() => !g.busy, 15000);
        res.busyTaps.push(g.shown);
      }
      res.thumbs = g.thumbs.length;
      await kit.until(() => neo.scene.finished, 20000);
      res.misses = g.misses;
      res.hints = g.hints;
      return res;
    });
    assert.equal(lap.later, false, 'no Later button at level 4');
    assert.deepEqual(lap.shown, [1, 2, 3], 'each touch anywhere turned the window once');
    assert.equal(lap.midTurn, 3, 'the second touch landed while the window was turning');
    assert.deepEqual(lap.busyTaps, [2, 3, 4], 'a second touch while it turns is free');
    assert.equal(lap.afterThumb, 2, 'a thumbnail replays without turning');
    assert.equal(lap.thumbs, 4, 'four views in the row');
    await page.setViewportSize({ width: 1024, height: 768 });
    await finished('moon-window');
    assert.deepEqual(await score(), [0, 0], 'level 4 saved 0 misses, 0 hints');
    log(
      `Moon Window 4 (lap): window ${lap.window} units, sky, wall and window touches each turned it, mid-turn taps free, a thumbnail replayed, 0/0; passed`,
    );

    // Level 2: the authored boards; the thin slice is one miss, the half Moon fits; Show a hint on the second board counts once.
    await launch('moon-window', 2);
    await settle();
    assert.deepEqual(
      await board(),
      [[1, 2], 1, 2],
      'the authored first board: a slice and a half, the window half',
    );
    await card(0);
    assert.deepEqual(await tally(), [1, 0], 'the thin slice: one miss');
    await card(0);
    assert.deepEqual(await tally(), [1, 0], 'the same wrong card again counts nothing');
    await card(1);
    assert.deepEqual(await board(), [[4, 1], 0, 4], 'the second board: full against a slice');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    assert.deepEqual(await tally(), [1, 1], 'Show a hint before a tap counts one');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    assert.deepEqual(await tally(), [1, 1], 'a second Show a hint on the board counts nothing more');
    await card(0);
    await finished('moon-window');
    assert.deepEqual(await score(), [1, 1]);

    // Level 3: the authored comparisons (more, then less), a portrait screenshot with both Moons at one size, then the seeded third.
    await launch('moon-window', 3);
    await settle();
    assert.deepEqual(
      await board(),
      [[4, 1], 0, 'more'],
      'the authored first comparison: full and a slice, more',
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('moon-window-3-portrait');
    await card(0);
    assert.deepEqual(await board(), [[3, 2], 1, 'less'], 'the second comparison: most and half, less');
    await card(0);
    assert.deepEqual(await tally(), [1, 0], 'the mostly lit Moon on a less request: one miss');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await card(1);
    const third = await board();
    assert.ok(third && Math.abs(third[0][0] - third[0][1]) >= 1, 'a seeded third comparison');
    await card(third[1]);
    await finished('moon-window');
    assert.deepEqual(await score(), [1, 0]);
    log('Moon Window 2 and 3: a wrong card and one counted hint, a less comparison, portrait, passed');
  }
  return { moonWindowPlay };
}
