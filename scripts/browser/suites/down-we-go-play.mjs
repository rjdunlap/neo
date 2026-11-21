import assert from 'node:assert/strict';

export function createSuite({ page, screenshot, launch, finished }) {
  /** Down We Go by touch: level 1 (pre-K) with a ledge tapped before the ride (free), the ride, a measured too-dark ledge twice (two misses, one glow hint), a lit ledge that is not the deepest (free), then the right ledge, and the other two dives; level 2 (school) with an unmeasured ledge (free), a requested hint, a portrait screenshot with the lantern at the darkest knot, then the right ledge on all three dives; level 3 with the other prediction first (free) and a screenshot of the plates; level 4 with the free first question wrong, one counted wrong dial and the right ones. */
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
    // School, level 3: measure and plant the first cove, the OTHER prediction first (free), then the second cove.
    await launch('down-we-go', 3, 'Mia', 'school');
    await settle();
    let g = await page.evaluate(() => ({ w: neo.scene.game.dives.map((d) => d.water), idx: neo.scene.game.idx }));
    assert.notEqual(g.w[0], g.w[1]);
    for (let k = 0; k < 5; k++) {
      await tapKnot(k);
      await settle();
    }
    await tapLedge(deepestOf(await state()));
    await page.waitForFunction(() => neo.scene.game.predicting, null, { timeout: 20000 });
    await page.waitForTimeout(600);
    await screenshot('down-we-go-cove-guess');
    const truthDeeper = await page.evaluate(() => {
      const [a, b] = neo.scene.game.dives;
      const dp = (d) => d.light.reduce((best, n, k) => (n >= d.need ? k : best), 0);
      return dp(b) > dp(a);
    });
    // The other plate: plates[0] is Deeper, plates[1] is Not as deep.
    await page.evaluate((i) => kit.tapOn(neo.scene.game.plates[i]), truthDeeper ? 1 : 0);
    await page.waitForFunction(() => !neo.scene.game.predicting, null, { timeout: 25000 });
    await settle();
    s = await state();
    assert.equal(s.misses, 0);
    for (let k = 0; k < 5; k++) {
      await tapKnot(k);
      await settle();
    }
    await tapLedge(deepestOf(await state()));
    await finished('down-we-go');
    // School, level 4: the free first question wrong, then a counted wrong dial, then the right ones.
    await launch('down-we-go', 4, 'Mia', 'school');
    await settle();
    const cardOf = (right) =>
      page.evaluate((right) => {
        const g = neo.scene.game;
        const q = g.qs[g.qi];
        return q.options.findIndex((o) => (o === q.answer) === right);
      }, right);
    const tapCard = (i) => page.evaluate((i) => kit.tapOn(neo.scene.game.cards[i]), i);
    await tapCard(await cardOf(false)); // first question: free
    await settle();
    assert.equal((await state()).misses, 0);
    await tapCard(await cardOf(true));
    await page.waitForFunction(() => neo.scene.game.qi === 1, null, { timeout: 20000 });
    await settle();
    await screenshot('down-we-go-dial-cards');
    await tapCard(await cardOf(false)); // second question: one miss
    await settle();
    assert.equal((await state()).misses, 1);
    await tapCard(await cardOf(true));
    await page.waitForFunction(() => neo.scene.game.qi === 2, null, { timeout: 20000 });
    await settle();
    await tapCard(await cardOf(true));
    await finished('down-we-go');
  }
  return { downWeGoPlay };
}
