import assert from 'node:assert/strict';

export function createSuite({ page, ready, scene, finished, screenshot, log }) {
  async function truthBridgePlay() {
    const id = 'truth-bridge';
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
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          counts: { ...g.counts },
          marks: [...g.marks],
          solution: [...g.board.solution],
          seats: [...g.board.seats],
          hint: g.hint,
          wrong: g.wrong,
          blank: g.blank,
          at: g.at,
          busy: g.busy,
          status: g.status.text,
        };
      });
    const seat = (i) => tap(`neo.scene.game.seats[${i}].node`);
    const cross = () => tap('neo.scene.game.crossButton.node');
    const help = () => tap('neo.scene.game.helpButton.node');
    /** Taps an islander until their mark is `kind`. */
    const mark = async (i, kind) => {
      for (let n = 0; n < 3 && (await state()).marks[i] !== kind; n++) await seat(i);
      assert.equal((await state()).marks[i], kind);
    };
    const flip = (kind) => (kind === 'straight' ? 'topsy' : 'straight');
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
        assert.equal(more, true, 'Truth Bridge should appear on a later page of Lantern Lake');
        await tap('neo.scene.nextArrow');
        await page.waitForFunction((current) => neo.scene.page !== current, current, { timeout: 5000 });
        await page.waitForTimeout(300);
      }
      const landPage = await page.evaluate(() => neo.scene.page);
      await tap("neo.scene.showing.find(({ mod }) => mod.id === 'truth-bridge').node");
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
    // Cross on blank marks names the first islander, free.
    let s = await state();
    assert.equal(s.seats.length, 2);
    await cross();
    s = await state();
    assert.equal(s.blank, 0);
    assert.match(s.status, /^Mark \w+ first\.$/);
    assert.deepEqual(s.counts, { misses: 0, hints: 0 });
    // Tapping a bubble re-reads its sentence and changes nothing.
    await tap('neo.scene.game.bubbles[1].node');
    assert.deepEqual((await state()).marks, [null, null]);
    for (const board of [0, 1]) {
      await page.waitForFunction((board) => neo.scene.game.at === board && !neo.scene.game.busy, board);
      s = await state();
      for (const i of [0, 1]) await mark(i, s.solution[i]);
      await cross();
    }
    await finished(id);
    assert.equal(await stickers(), before + 1);
    assert.deepEqual(await lastRound(), { misses: 0, hints: 0, level: 1 });
    await back(firstPage);

    const secondPage = await landOpen(2);
    s = await state();
    assert.equal(s.seats.length, 3);
    const wrongMarks = [flip(s.solution[0]), s.solution[1], s.solution[2]];
    for (const i of [0, 1, 2]) await mark(i, wrongMarks[i]);
    await cross();
    s = await state();
    assert.deepEqual(s.counts, { misses: 1, hints: 0 });
    assert.notEqual(s.wrong, null);
    assert.match(s.status, /is marked (Straight|Topsy), so these words/);
    // The same marks again replay the explanation, free.
    await cross();
    assert.deepEqual((await state()).counts, { misses: 1, hints: 0 });
    await help();
    await help();
    s = await state();
    assert.deepEqual(s.counts, { misses: 1, hints: 1 });
    assert.equal(s.hint.seat, 0);
    assert.equal(s.hint.kind, s.solution[0]);
    await screenshot('truth-bridge-level-2-portrait');
    await page.setViewportSize(landscape);
    await page.waitForFunction(() => !neo.view.upright);
    const turned = await state();
    assert.deepEqual(turned.marks, wrongMarks);
    assert.deepEqual(turned.hint, s.hint);
    assert.deepEqual(turned.seats, s.seats);
    await screenshot('truth-bridge-level-2-sideways');
    await mark(0, s.hint.kind);
    await page.setViewportSize(portrait);
    await page.waitForFunction(() => neo.view.upright);
    assert.deepEqual((await state()).marks, s.solution);
    await cross();
    await finished(id);
    assert.deepEqual(await lastRound(), { misses: 1, hints: 1, level: 2 });
    assert.equal(await stickers(), before + 2);
    await back(secondPage);
    log(
      'Truth Bridge: both levels from Lantern Lake at 390×625 with captions, a blank Cross, a wrong Cross counted once, Help counted once, rotation, one sticker per round and return passed',
    );
  }

  return { truthBridgePlay };
}
