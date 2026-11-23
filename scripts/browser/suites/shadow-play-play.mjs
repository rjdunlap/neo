import assert from 'node:assert/strict';

export function createSuite({ page, ready, scene, finished, screenshot, log }) {
  async function shadowPlayPlay() {
    const id = 'shadow-play';
    const portrait = { width: 390, height: 625 };
    const landscape = { width: 625, height: 390 };
    await ready();
    const pointOf = (expression) =>
      page.evaluate((expression) => {
        const node = Function(`return (${expression})`)();
        const area = node.hitArea;
        const p = area
          ? node.toGlobal({ x: area.x + (area.width ?? 0) / 2, y: area.y + (area.height ?? 0) / 2 })
          : node.getGlobalPosition();
        return { x: p.x, y: p.y };
      }, expression);
    const tap = async (expression) => {
      const { x, y } = await pointOf(expression);
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(145);
    };
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          counts: { ...g.counts },
          marks: g.arr.map((p) => p.mark),
          solution: g.board.solution.map((p) => p.mark),
          cutouts: g.board.solution.map((p) => `${p.cutout.shape}${p.cutout.w}${p.cutout.h}`),
          hint: g.hint,
          wrong: g.wrong && { rail: g.wrong.rail, fault: g.wrong.fault },
          lit: g.lit,
          at: g.at,
          busy: g.busy,
        };
      });
    /** Where a mark sits on a rail, on the page, at the foot of the row (clear of the handle's cut-out). */
    const markPoint = (rail, mark) =>
      page.evaluate(
        ({ rail, mark }) => {
          const g = neo.scene.game;
          const r = g.layout.rails[rail];
          const p = g.root.toGlobal({ x: r.lampX + ((r.screenX - r.lampX) * mark) / 12, y: r.row.y });
          return { x: p.x, y: p.y };
        },
        { rail, mark },
      );
    /** Taps a rail at a mark: the row, or the handle when it covers that mark. */
    const tapMark = async (rail, mark) => {
      const { x, y } = await markPoint(rail, mark);
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(160);
    };
    /** Drags a rail's handle to a mark with a real pointer, in steps. */
    const slide = async (rail, mark) => {
      const from = await pointOf(`neo.scene.game.handles[${rail}].node`);
      const to = await markPoint(rail, mark);
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      for (let i = 1; i <= 6; i++) {
        await page.mouse.move(from.x + ((to.x - from.x) * i) / 6, from.y + ((to.y - from.y) * i) / 6);
        await page.waitForTimeout(20);
      }
      await page.mouse.up();
      await page.waitForTimeout(160);
    };
    const light = () => tap('neo.scene.game.lightButton.node');
    const help = () => tap('neo.scene.game.helpButton.node');
    const stickers = () =>
      page.evaluate((id) => kit.store.data.stickers.filter((s) => s.game === id).length, id);
    const landOpen = async (level) => {
      // The classic map still asks for landscape. An upright round can then rotate into portrait.
      await page.setViewportSize(landscape);
      await page.evaluate(
        ({ id, level }) => {
          kit.store.entry.birth = null;
          kit.store.entry.startBand = kit.store.data.profile.band = 'grownup';
          kit.store.data.settings.showWords = true;
          kit.store.stats(id).pinned = level;
          neo.go.land('lantern-lake');
        },
        { id, level },
      );
      await scene('LandScene');
      while (await page.evaluate((id) => !neo.scene.showing.some(({ mod }) => mod.id === id), id)) {
        const { current, more } = await page.evaluate(() => ({
          current: neo.scene.page,
          more: neo.scene.nextArrow.visible,
        }));
        assert.equal(more, true, 'Shadow Play should appear on a later page of Lantern Lake');
        await tap('neo.scene.nextArrow');
        await page.waitForFunction((current) => neo.scene.page !== current, current, { timeout: 5000 });
        await page.waitForTimeout(300);
      }
      const landPage = await page.evaluate(() => neo.scene.page);
      await tap("neo.scene.showing.find(({ mod }) => mod.id === 'shadow-play').node");
      await scene('GameScene');
      await page.waitForFunction(() => neo.scene.game && neo.scene.place.mode !== 'none');
      assert.equal(await page.evaluate(() => neo.scene.level), level);
      await page.setViewportSize(portrait);
      await page.waitForFunction(() => neo.view.upright);
      return landPage;
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
    const lastRound = () =>
      page.evaluate((id) => {
        const { misses, hints, level } = kit.store.stats(id).history.at(-1);
        return { misses, hints, level };
      }, id);

    const before = await stickers();
    const firstPage = await landOpen(1);
    let s = await state();
    assert.equal(s.lit, true);
    assert.equal(await page.evaluate(() => neo.scene.game.lightButton.node.visible), false);
    // Level 1: the lamp is lit and each of the two boards finishes by itself. The first cut-out is dragged, the rest tapped.
    for (const board of [0, 1]) {
      await page.waitForFunction((board) => neo.scene.game.at === board && !neo.scene.game.busy, board);
      s = await state();
      assert.ok(s.marks.every((mark, rail) => mark !== s.solution[rail]));
      await slide(0, s.solution[0]);
      assert.equal((await state()).marks[0], s.solution[0]);
      await tapMark(1, s.solution[1]);
      await tapMark(2, s.solution[2]);
    }
    await finished(id);
    assert.equal(await stickers(), before + 1);
    assert.deepEqual(await lastRound(), { misses: 0, hints: 0, level: 1 });
    await back(firstPage);

    const secondPage = await landOpen(2);
    s = await state();
    assert.equal(s.lit, false);
    // Light on the opening (wrong) arrangement: one miss, the real shadow and the first rail named.
    await light();
    s = await state();
    assert.deepEqual(s.counts, { misses: 1, hints: 0 });
    assert.equal(s.lit, true);
    assert.equal(s.wrong.rail, 0);
    assert.equal(s.wrong.fault, s.marks[0] < s.solution[0] ? 'tall' : 'short');
    await screenshot('shadow-play-level-2-portrait');
    // The same arrangement lit again replays the explanation, free.
    await light();
    assert.deepEqual((await state()).counts, { misses: 1, hints: 0 });
    await help();
    await help();
    s = await state();
    assert.deepEqual(s.counts, { misses: 1, hints: 1 });
    assert.deepEqual(s.hint, { rail: 0, kind: 'mark', mark: s.solution[0] });
    await page.setViewportSize(landscape);
    await page.waitForFunction(() => !neo.view.upright);
    const turned = await state();
    assert.deepEqual(turned.marks, s.marks);
    assert.deepEqual(turned.hint, s.hint);
    assert.deepEqual(turned.cutouts, s.cutouts);
    await screenshot('shadow-play-level-2-sideways');
    // Following the hint moves the first cut-out and puts the lamp out.
    await slide(0, s.hint.mark);
    s = await state();
    assert.equal(s.marks[0], s.solution[0]);
    assert.equal(s.lit, false);
    await page.setViewportSize(portrait);
    await page.waitForFunction(() => neo.view.upright);
    await tapMark(1, s.solution[1]);
    await slide(2, s.solution[2]);
    assert.deepEqual((await state()).marks, s.solution);
    await light();
    await finished(id);
    assert.deepEqual(await lastRound(), { misses: 1, hints: 1, level: 2 });
    assert.equal(await stickers(), before + 2);
    await back(secondPage);
    log(
      'Shadow Play: both levels from Lantern Lake at 390×625 with captions, slides by drag and by tap, a wrong Light counted once, Help counted once, rotation, one sticker per round and return passed',
    );
  }

  return { shadowPlayPlay };
}
