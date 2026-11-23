import assert from 'node:assert/strict';

export function createSuite({ page, ready, scene, finished, screenshot, log }) {
  async function fenceTheFieldPlay() {
    const id = 'fence-the-field';
    const portrait = { width: 390, height: 625 };
    const landscape = { width: 625, height: 390 };
    await ready();
    const tapNode = async (expression) => {
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
    const state = () => page.evaluate(() => ({ ...neo.scene.game.state }));
    /** A real tap on the field at the middle of rail `e`. */
    const tapRail = async (e) => {
      const { x, y } = await page.evaluate((e) => {
        const g = neo.scene.game;
        const p = g.pad.toGlobal(g.spot(e));
        return { x: p.x, y: p.y };
      }, e);
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(145);
    };
    const turn = () =>
      page.waitForFunction(() => ['turn', 'done'].includes(neo.scene.game.state.phase), null, {
        timeout: 20000,
      });
    /** The game's own rules, read from the page: the rail a hint would glow, and the open rails that cost a plot. */
    const rules = () =>
      page.evaluate(async () => {
        const logic = await import('/src/games/fence-the-field/logic.ts');
        const { mask, level } = neo.scene.game.state;
        const open = logic.openRails(mask);
        return {
          sound: logic.hint(mask, level).rail,
          unsound: open.filter((e) => !logic.sound(mask, e)),
          laid: [...Array(logic.RAILS).keys()].find((e) => mask & (1 << e)),
        };
      });
    /** Lays sound rails, waiting out the pet's turns, until the last rail. */
    const playOut = async () => {
      for (let i = 0; i < 30; i++) {
        await turn();
        const s = await state();
        if (s.phase === 'done') return;
        const { sound } = await rules();
        await tapRail(sound);
        assert.notEqual((await state()).mask, s.mask, `rail ${sound} should be laid`);
      }
      assert.fail('The field should fill within 30 of her rails');
    };
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
        assert.equal(more, true, 'Fence the Field should appear on a later page of Lantern Lake');
        await tapNode('neo.scene.nextArrow');
        await page.waitForFunction((current) => neo.scene.page !== current, current, { timeout: 5000 });
        await page.waitForTimeout(300);
      }
      const landPage = await page.evaluate(() => neo.scene.page);
      await tapNode("neo.scene.showing.find(({ mod }) => mod.id === 'fence-the-field').node");
      await scene('GameScene');
      await page.waitForFunction(() => neo.scene.game && neo.scene.place.mode !== 'none');
      assert.equal(await page.evaluate(() => neo.scene.level), level);
      await page.setViewportSize(portrait);
      await page.waitForFunction(() => neo.view.upright);
      return landPage;
    };
    const back = async (landPage) => {
      await page.waitForFunction(() => neo.scene.after?.home);
      await tapNode('neo.scene.after.home');
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

    // Level 1: a laid rail stays down and costs nothing; sound rails to the last one give one sticker.
    const firstPage = await landOpen(1);
    await turn();
    let s = await state();
    assert.equal(s.level, 1);
    await tapRail((await rules()).laid);
    assert.deepEqual(await state(), s, 'a laid rail changes nothing');
    await playOut();
    await finished(id);
    s = await state();
    assert.equal(s.her + s.pet, 9);
    assert.ok(s.her >= s.target, `she gets at least the ${s.target} the strip promised (got ${s.her})`);
    assert.equal(await stickers(), before + 1);
    assert.deepEqual(await lastRound(), { misses: 0, hints: 0, level: 1 });
    await back(firstPage);

    // Level 2: a rail that costs a plot is laid, answered by the pet and stepped back: one miss.
    const secondPage = await landOpen(2);
    await turn();
    const start = await state();
    const { unsound } = await rules();
    assert.ok(unsound.length > 0, 'a level 2 field opens with a rail that costs a plot');
    await tapRail(unsound[0]);
    s = await state();
    assert.equal(s.phase, 'replay');
    assert.notEqual(s.mask, start.mask);
    await page.waitForFunction((mask) => neo.scene.game.state.mask !== mask, s.mask, { timeout: 5000 });
    await screenshot('fence-the-field-level-2-portrait');
    await turn();
    s = await state();
    assert.deepEqual(s, { ...start, misses: 1 }, 'the field steps back to before the rail');
    // The same rail at the same position replays, free.
    await tapRail(unsound[0]);
    assert.equal((await state()).phase, 'replay');
    await turn();
    assert.deepEqual(await state(), { ...start, misses: 1 });
    // Help glows one sound rail and counts once; asking again at the same position is free.
    await tapNode('neo.scene.game.help');
    await tapNode('neo.scene.game.help');
    s = await state();
    assert.equal(s.hints, 1);
    assert.equal(s.hint, (await rules()).sound);
    await page.setViewportSize(landscape);
    await page.waitForFunction(() => !neo.view.upright);
    assert.deepEqual(await state(), s, 'rotating keeps the field, the count and the glow');
    await screenshot('fence-the-field-level-2-sideways');
    await tapRail(s.hint);
    assert.notEqual((await state()).mask, s.mask);
    await page.setViewportSize(portrait);
    await page.waitForFunction(() => neo.view.upright);
    await playOut();
    await finished(id);
    s = await state();
    assert.equal(s.her + s.pet, 9);
    assert.ok(s.her >= s.target);
    assert.deepEqual(await lastRound(), { misses: 1, hints: 1, level: 2 });
    assert.equal(await stickers(), before + 2);
    await back(secondPage);
    log(
      'Fence the Field: both levels from Lantern Lake at 390×625 with captions, a laid rail free, a costly rail replayed and stepped back (counted once, laid again free), Help counted once, rotation, one sticker per round and return passed',
    );
  }

  return { fenceTheFieldPlay };
}
