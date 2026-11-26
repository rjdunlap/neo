import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot }) {
  /** Market Days by touch: level 1 with a banner placed beside a town of the same banner (the one miss), Undo, two Hint requests (glow, then place), then the ghost finger's taps to a finish and a portrait screenshot; level 3 with Why? (uncounted) and the finish on three banners. */
  async function marketDaysPlay() {
    const tapOn = (path) =>
      page.evaluate((path) => kit.tapOn(path.split('.').reduce((o, k) => o[k], neo.scene.game)), path);
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return { misses: g.misses, hints: g.hints, assign: [...g.assign], finished: g.finished };
      });
    /** Taps the ghost finger's next target until the round is finished. */
    const botFinish = async () => {
      for (let i = 0; i < 60; i++) {
        const done = await page.evaluate(() => neo.scene.finished || neo.scene.game.finished);
        if (done) return;
        await page.evaluate(() => {
          const intent = neo.scene.game.autotouch();
          if (intent) kit.tapOn(intent.tap.on);
        });
        await page.waitForTimeout(220);
      }
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('market-days', 1, 'Mia', 'grownup');
    await page.waitForTimeout(400);
    // A miss: a banner on a town beside a town that already holds it.
    const clash = await page.evaluate(async () => {
      const L = await import('/src/games/market-days/logic.ts');
      const g = neo.scene.game;
      const near = L.neighbourLists(g.round.map);
      for (let t = 0; t < g.assign.length; t++) {
        if (g.assign[t] !== -1) continue;
        const n = near[t].find((n) => g.assign[n] !== -1);
        if (n !== undefined) return { town: t, banner: g.assign[n] };
      }
      return null;
    });
    assert.ok(clash, 'a town beside a preset town');
    await page.evaluate((b) => kit.tapOn(neo.scene.game.banners[b]), clash.banner);
    await page.evaluate((t) => kit.tapOn(neo.scene.game.towns[t]), clash.town);
    await page.waitForTimeout(300);
    let s = await state();
    assert.equal(s.misses, 1, 'one miss for the clash');
    await page.waitForTimeout(500);
    await tapOn('buttons.1'); // Undo
    s = await state();
    assert.equal(s.assign[clash.town], -1, 'undo clears the clash');
    await tapOn('hintBtn');
    await page.waitForTimeout(500);
    await tapOn('hintBtn');
    await page.waitForTimeout(300);
    s = await state();
    assert.equal(s.hints, 2, 'two hint requests');
    assert.equal(s.misses, 1);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(400);
    await screenshot('market-days-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await botFinish();
    await finished('market-days');
    const r = await page.evaluate(() => kit.store.stats('market-days').history.at(-1));
    assert.equal(r.misses, 1);
    assert.equal(r.hints, 2);

    // Level 3: Why? explains and is not a hint; the round ends on three banners.
    await launch('market-days', 3, 'Mia', 'grownup');
    await page.waitForTimeout(400);
    await tapOn('whyBtn');
    await page.waitForTimeout(300);
    s = await state();
    assert.equal(s.hints, 0, 'Why? is not a hint');
    await botFinish();
    await finished('market-days');
    const r3 = await page.evaluate(() => kit.store.stats('market-days').history.at(-1));
    assert.equal(r3.misses, 0);
    assert.equal(r3.hints, 0);
  }
  return { marketDaysPlay };
}
