import assert from 'node:assert/strict';

export function createSuite({ page, ready, scene, finished, screenshot, log }) {
  async function tideTablesPlay() {
    const id = 'tide-tables';
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
    const control = (what, i) => tap(`neo.scene.game.${what}[${i}].node`);
    const draft = () => page.evaluate(() => neo.scene.game.draft);
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          counts: g.counts,
          hint: g.hint,
          selected: g.selected,
          row: g.activeRow,
          completed: g.completed,
        };
      });
    const put = async (job, row) => {
      if ((await state()).selected !== job) await control('jobs', job);
      await control('rows', row);
    };
    const stickers = () =>
      page.evaluate((id) => kit.store.data.stickers.filter((s) => s.game === id).length, id);
    const landOpen = async (level, variant) => {
      // The classic map still asks for landscape. An upright round can then rotate into portrait.
      await page.setViewportSize(landscape);
      await page.evaluate(
        async ({ id, level, variant }) => {
          const { Rng } = await import('/src/engine/random.ts');
          let seed = 1;
          while (new Rng(seed).int(0, 1) !== variant) seed++;
          const previous = Math.random;
          window.restoreTideRandom = () => {
            Math.random = previous;
          };
          Math.random = () => seed / 2 ** 31;
          kit.store.entry.birth = null;
          kit.store.entry.startBand = kit.store.data.profile.band = 'grownup';
          kit.store.data.settings.showWords = true;
          kit.store.stats(id).pinned = level;
          neo.go.land('lantern-lake');
        },
        { id, level, variant },
      );
      try {
        await scene('LandScene');
        while (await page.evaluate((id) => !neo.scene.showing.some(({ mod }) => mod.id === id), id)) {
          const { current, more } = await page.evaluate(() => ({
            current: neo.scene.page,
            more: neo.scene.nextArrow.visible,
          }));
          assert.equal(more, true, 'Tide Tables should appear on a later page of Lantern Lake');
          await tap('neo.scene.nextArrow');
          await page.waitForFunction((current) => neo.scene.page !== current, current, { timeout: 5000 });
          await page.waitForTimeout(300);
        }
        const landPage = await page.evaluate(() => neo.scene.page);
        await tap("neo.scene.showing.find(({ mod }) => mod.id === 'tide-tables').node");
        await scene('GameScene');
        await page.waitForFunction(() => neo.scene.game && neo.scene.place.mode !== 'none');
        assert.equal(await page.evaluate(() => neo.scene.level), level);
        await page.setViewportSize(portrait);
        await page.waitForFunction(() => neo.view.upright);
        assert.equal(await page.evaluate(() => neo.scene.game.board.times[0]), variant ? '07:30' : '07:00');
        return landPage;
      } finally {
        await page.evaluate(() => {
          window.restoreTideRandom?.();
          delete window.restoreTideRandom;
        });
      }
    };
    const back = async (landPage) => {
      await page.waitForFunction(() => neo.scene.after?.home);
      await tap('neo.scene.after.home');
      await scene('LandScene');
      assert.deepEqual(await page.evaluate(() => [neo.scene.land.id, neo.scene.page]), [
        'lantern-lake',
        landPage,
      ]);
    };

    const before = await stickers();
    const firstPage = await landOpen(1, 0);
    await control('actions', 2);
    assert.deepEqual((await state()).counts, { misses: 0, hints: 0 });
    await put(0, 2);
    await control('rows', 2);
    assert.equal((await state()).selected, 0);
    await put(1, 1);
    await put(2, 0);
    await control('actions', 2);
    await finished(id);
    assert.equal(await stickers(), before + 1);
    assert.deepEqual((await state()).completed, [0, 1, 2]);
    await back(firstPage);

    const secondPage = await landOpen(2, 1);
    await put(0, 0);
    await put(1, 3);
    await put(2, 1);
    await control('actions', 2);
    assert.match(await page.evaluate(() => neo.scene.game.status.text), /after 19:30/);
    await control('actions', 2);
    assert.deepEqual((await state()).counts, { misses: 1, hints: 0 });

    // Swap the occupied rows in two moves, then undo both drafts to restore the original conflict.
    await put(2, 3);
    assert.deepEqual(await draft(), [0, null, 3]);
    await put(1, 2);
    await control('actions', 2);
    assert.deepEqual((await state()).counts, { misses: 2, hints: 1 });
    assert.deepEqual((await state()).hint, { job: 1, row: 1 });
    await control('actions', 0);
    assert.deepEqual(await draft(), [0, null, 3]);
    await control('actions', 0);
    assert.deepEqual(await draft(), [0, 3, 1]);
    await control('actions', 2);
    assert.deepEqual((await state()).counts, { misses: 2, hints: 1 });

    await control('actions', 1);
    await control('actions', 1);
    const hint = await state();
    assert.deepEqual(hint.counts, { misses: 2, hints: 2 });
    assert.deepEqual(hint.hint, { job: 1, row: 1 });
    await screenshot('tide-tables-level-2-portrait');
    await page.setViewportSize(landscape);
    await page.waitForFunction(() => !neo.view.upright);
    assert.deepEqual(await draft(), [0, 3, 1]);
    assert.deepEqual((await state()).hint, hint.hint);
    await put(hint.hint.job, hint.hint.row);
    assert.deepEqual(await draft(), [0, 1, null]);
    await page.setViewportSize(portrait);
    await page.waitForFunction(() => neo.view.upright);
    await put(2, 3);
    await control('actions', 2);
    await control('actions', 2);
    await finished(id);
    assert.deepEqual((await state()).completed, [0, 1, 3]);
    assert.deepEqual(
      await page.evaluate((id) => {
        const { misses, hints, level } = kit.store.stats(id).history.at(-1);
        return { misses, hints, level };
      }, id),
      { misses: 2, hints: 2, level: 2 },
    );
    assert.equal(await stickers(), before + 2);
    await back(secondPage);
    log(
      'Tide Tables: both levels from Lantern Lake, occupied-row readout, order miss, hint glow, undo, rotation, one sticker per round and return passed',
    );
  }

  return { tideTablesPlay };
}
