import assert from 'node:assert/strict';

export function createSuite({ page, screenshot, launch, finished }) {
  /** Down We Go by touch: level 1 (pre-K) with a ledge tapped before the ride (free), the ride, a measured too-dark ledge twice (two misses, one glow hint), a lit ledge that is not the deepest (free), then the right ledge, and the other two dives; level 2 (school) with an unmeasured ledge (free), a requested hint, a portrait screenshot with the lantern at the darkest knot, then the right ledge on all three dives. */
  async function downWeGoPlay() {
    const settle = async () => {
      await page.waitForTimeout(300);
      await page.waitForFunction(
        () => neo.scene.finished || (!neo.scene.game.busy && !neo.scene.game.moving),
        null,
        { timeout: 25000 },
      );
      await page.waitForTimeout(250);
    };
    const tapLedge = (k) => page.evaluate((k) => kit.tapOn(neo.scene.game.ledges[k]), k);
    const tapKnot = (k) => page.evaluate((k) => kit.tapOn(neo.scene.game.knotHits[k]), k);
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          idx: g.idx,
          misses: g.misses,
          hints: g.hints,
          ride: g.ride,
          glow: g.glowKnot,
          light: g.d.light,
          need: g.d.need,
          measured: g.measured,
        };
      });
    const deepestOf = (s) => s.light.reduce((best, n, k) => (n >= s.need ? k : best), 0);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    // Pre-K, level 1.
    await launch('down-we-go', 1, 'Mia', 'prek');
    await settle();
    let s = await state();
    assert.equal(s.ride, true);
    await tapLedge(0); // before the ride: asked to pull the lantern down, free
    await settle();
    assert.equal((await state()).misses, 0);
    for (let k = 1; k < s.light.length; k++) {
      await tapKnot(k);
      await settle();
    }
    s = await state();
    assert.equal(s.ride, false);
    const dark = s.light.length - 1; // the last knot is always too dark
    await tapLedge(dark);
    await settle();
    await tapLedge(dark);
    await settle();
    s = await state();
    assert.equal(s.misses, 2);
    assert.equal(s.hints, 1);
    assert.equal(s.glow, deepestOf(s));
    if (deepestOf(s) > 0) {
      await tapLedge(0); // lit but not the deepest: free
      await settle();
      assert.equal((await state()).misses, 2);
    }
    await tapLedge(deepestOf(s));
    await page.waitForFunction(() => neo.scene.game.idx === 1, null, { timeout: 20000 });
    for (let dive = 1; dive < 3; dive++) {
      await settle();
      s = await state();
      for (let k = 1; k < s.light.length; k++) {
        await tapKnot(k);
        await settle();
      }
      await tapLedge(deepestOf(await state()));
      if (dive < 2) await page.waitForFunction((d) => neo.scene.game.idx === d + 1, dive, { timeout: 20000 });
    }
    await finished('down-we-go');
    const h = await page.evaluate(() => kit.store.stats('down-we-go').history.at(-1));
    assert.deepEqual([h.misses, h.hints], [2, 1]);
    // School, level 2.
    await launch('down-we-go', 2, 'Mia', 'school');
    await settle();
    s = await state();
    assert.equal(s.light.length, 5);
    await tapLedge(4); // not measured yet: a prediction, free
    await settle();
    assert.equal((await state()).misses, 0);
    await page.evaluate(() => neo.scene.game.askForHint());
    await settle();
    assert.equal((await state()).hints, 1);
    await tapKnot(4);
    await settle();
    await screenshot('down-we-go-darkest-knot');
    for (let dive = 0; dive < 3; dive++) {
      s = await state();
      for (let k = 0; k < s.light.length; k++) {
        await tapKnot(k);
        await settle();
      }
      await tapLedge(deepestOf(await state()));
      if (dive < 2) await page.waitForFunction((d) => neo.scene.game.idx === d + 1, dive, { timeout: 20000 });
    }
    await finished('down-we-go');
  }
  return { downWeGoPlay };
}
