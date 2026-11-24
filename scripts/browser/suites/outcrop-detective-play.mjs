import assert from 'node:assert/strict';

/**
 * Outcrop Detective at 390 × 625 with captions, through Lantern Lake's page. Level 1: a wrong Check (one miss), Show a
 * hint (one hint), taps to the fitting ribbon, Play, Check and Yes. Level 2: a fitting ribbon, Yes (a miss; the ribbon
 * becomes the other story), Not enough to tell, an uninformative look (a miss; misses glow per step, so nothing glows yet),
 * the lens closed by a tap, the sand look, the one fitting ribbon and Check. One sticker each, back to the same page.
 */
export function createSuite({ page, ready, scene, finished, screenshot, log }) {
  async function outcropDetectivePlay() {
    const id = 'outcrop-detective';
    const portrait = { width: 390, height: 625 };
    const landscape = { width: 625, height: 390 };
    await ready();
    const tap = async (expression) => {
      const { x, y } = await page.evaluate((expression) => {
        const node = Function(`return (${expression})`)();
        const area = node.hitArea;
        const p = area
          ? node.toGlobal({ x: area.x + (area.width ?? 0) / 2, y: area.y + (area.height ?? 0) / 2 })
          : node.getGlobalPosition();
        return { x: p.x, y: p.y };
      }, expression);
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(145);
    };
    const game = 'neo.scene.game';
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          ribbon: g.s.ribbon.join(''),
          step: g.s.step,
          record: g.s.record,
          truth: g.s.round.truth,
          looks: g.s.round.looks,
          misses: g.s.misses,
          hints: g.s.hints,
          glow: g.glow,
          lens: g.lensOpen,
          built: g.built,
        };
      });
    const swapTo = async (target) => {
      for (let i = 0; i < 4; i++) {
        const r = (await state()).ribbon;
        if (r[i] === target[i]) continue;
        await tap(`${game}.cards[${i}].node`);
        await tap(`${game}.cards[${r.indexOf(target[i])}].node`);
      }
      assert.equal((await state()).ribbon, target);
    };
    const stickers = () =>
      page.evaluate((id) => kit.store.data.stickers.filter((s) => s.game === id).length, id);
    const launch = async (level) => {
      await page.setViewportSize(landscape);
      await page.evaluate(
        ({ id, level }) => {
          kit.store.entry.birth = null;
          kit.store.entry.startBand = kit.store.data.profile.band = 'grownup';
          kit.store.data.settings.showWords = true;
          kit.store.data.settings.howToCards = false;
          kit.store.stats(id).pinned = level;
          if (neo.scene.constructor.name !== 'LandScene' || neo.scene.land?.id !== 'lantern-lake')
            neo.go.land('lantern-lake');
        },
        { id, level },
      );
      await scene('LandScene');
      while (await page.evaluate((id) => !neo.scene.showing.some(({ mod }) => mod.id === id), id)) {
        const current = await page.evaluate(() => neo.scene.page);
        assert.equal(
          await page.evaluate(() => neo.scene.nextArrow.visible),
          true,
          'Outcrop Detective is on a Lantern Lake page',
        );
        await tap('neo.scene.nextArrow');
        await page.waitForFunction((current) => neo.scene.page !== current, current, { timeout: 5000 });
        await page.waitForTimeout(300);
      }
      const landPage = await page.evaluate(() => neo.scene.page);
      await tap(`neo.scene.showing.find(({ mod }) => mod.id === '${id}').node`);
      await scene('GameScene');
      await page.waitForFunction(() => neo.scene.game && neo.scene.place.mode !== 'none');
      await page.setViewportSize(portrait);
      await page.waitForFunction(() => neo.view.upright);
      return landPage;
    };
    const done = async (landPage, want) => {
      await finished(id);
      const last = await page.evaluate((id) => {
        const { misses, hints, level } = kit.store.stats(id).history.at(-1);
        return { misses, hints, level };
      }, id);
      assert.deepEqual(last, want);
      await page.waitForFunction(() => neo.scene.after?.home);
      await tap('neo.scene.after.home');
      await scene('LandScene');
      assert.deepEqual(await page.evaluate(() => [neo.scene.land.id, neo.scene.page]), [
        'lantern-lake',
        landPage,
      ]);
    };

    const before = await stickers();

    // Level 1.
    let landPage = await launch(1);
    let s = await state();
    assert.equal(s.step, 'order');
    assert.notEqual(s.ribbon, 'ABXC');
    await tap(`${game}.checkButton.node`);
    await tap(`${game}.checkButton.node`); // the same wrong ribbon again: free
    s = await state();
    assert.deepEqual([s.misses, s.hints], [1, 0]);
    // Show a hint (the pause sheet's action): one card moves, one hint.
    const r0 = s.ribbon;
    await page.evaluate(() => neo.scene.game.askForHint());
    s = await state();
    assert.notEqual(s.ribbon, r0);
    assert.equal(s.hints, 1);
    await swapTo('ABXC');
    await tap(`${game}.play.node`);
    await page.waitForFunction(() => neo.scene.game.built === 4 && !neo.scene.game.playing, null, {
      timeout: 30000,
    });
    await tap(`${game}.checkButton.node`);
    assert.equal((await state()).step, 'sure');
    await tap(`${game}.answers[0].node`);
    await done(landPage, { misses: 1, hints: 1, level: 1 });

    // Level 2.
    landPage = await launch(2);
    s = await state();
    assert.deepEqual([s.step, s.record], ['order', 'sand']);
    await swapTo('ABXC');
    await tap(`${game}.checkButton.node`);
    assert.equal((await state()).step, 'sure');
    await tap(`${game}.answers[0].node`); // Yes: a miss, and the ribbon becomes the other story that fits
    s = await state();
    assert.deepEqual([s.misses, s.ribbon], [1, 'AXBC']);
    await tap(`${game}.answers[1].node`);
    s = await state();
    assert.equal(s.step, 'look');
    const wrong = s.looks.findIndex((l) => l !== 'look-sand');
    await tap(`${game}.lookCards[${wrong}].node`); // a preview: free
    assert.equal((await state()).misses, 1);
    await tap(`${game}.lookButton.node`);
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.lens], [2, 0, true]);
    await tap(`${game}.cards[0].node`); // any tap closes the lens
    assert.equal((await state()).lens, false);
    await tap(`${game}.lookCards[${s.looks.indexOf('look-sand')}].node`);
    await tap(`${game}.lookButton.node`);
    await tap(`${game}.cards[0].node`);
    s = await state();
    assert.deepEqual([s.step, s.record, s.lens], ['again', 'sand-off', false]);
    await screenshot('outcrop-detective-portrait');
    await swapTo(s.truth === 'cut' ? 'ABXC' : 'AXBC');
    await tap(`${game}.checkButton.node`);
    await done(landPage, { misses: 2, hints: 0, level: 2 });
    assert.equal(await stickers(), before + 2);
    log(
      'outcrop detective: level 1 one miss one hint, level 2 two misses no hint, two stickers, same Lantern Lake page',
    );
  }
  return { outcropDetectivePlay };
}
