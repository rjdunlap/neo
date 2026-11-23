import assert from 'node:assert/strict';

export function createSuite({ page, ready, scene, finished, screenshot, log }) {
  async function keyItOutPlay() {
    const id = 'key-it-out';
    const portrait = { width: 390, height: 625 };
    const landscape = { width: 625, height: 390 };
    await ready();
    const tapAt = async ({ x, y }) => {
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(145);
    };
    const tapNode = async (expression) => {
      const at = await page.evaluate((expression) => {
        const node = Function(`return (${expression})`)();
        const area = node.hitArea;
        const p = area
          ? node.toGlobal({ x: area.x + (area.width ?? 0) / 2, y: area.y + (area.height ?? 0) / 2 })
          : node.getGlobalPosition();
        return { x: p.x, y: p.y };
      }, expression);
      await tapAt(at);
    };
    const state = () => page.evaluate(() => ({ ...neo.scene.game.state }));
    const settled = () =>
      page.waitForFunction(() => ['play', 'done'].includes(neo.scene.game.state.phase), null, {
        timeout: 15000,
      });
    /** Choose sketch `i` with real taps: the Sketches tab when the Key page is open upright, then its cell. */
    const choose = async (i) => {
      const s = await state();
      if (s.chosen === i) return;
      const upright = await page.evaluate(() => neo.view.upright);
      if (upright && s.tab !== 'sketches') await tapNode('neo.scene.game.sketchesTab');
      await tapNode(`neo.scene.game.cells[${i}]`);
      assert.equal((await state()).chosen, i);
    };
    /** A real tap on the Key page: a question (`end` 'question') or a branch end, slid into view first. */
    const tapKey = async (t) => {
      if ((await state()).tab !== 'key' && (await page.evaluate(() => neo.view.upright)))
        await tapNode('neo.scene.game.keyTab');
      const at = await page.evaluate((t) => {
        const g = neo.scene.game;
        const p = g.key.toGlobal(g.keySpot(t));
        return { x: p.x, y: p.y };
      }, t);
      await page.waitForTimeout(60);
      await tapAt(at);
    };
    /** Give `name` to the chosen sketch by tapping the branch end that ends in it. */
    const giveName = async (name) => {
      const t = await page.evaluate((name) => neo.scene.game.nameEnd(name), name);
      await tapKey(t);
    };
    const name = async (i, n) => {
      await choose(i);
      await giveName(n);
      await settled();
    };
    /** The game's own hint, read from the page without counting it. */
    const nextStep = () =>
      page.evaluate(async () => {
        const logic = await import('/src/games/key-it-out/logic.ts');
        const g = neo.scene.game;
        const h = logic.hint(g.board, g.page);
        return h && { sketch: h.sketch, name: h.name };
      });
    const playOut = async () => {
      for (let i = 0; i < 12; i++) {
        await settled();
        if ((await state()).phase === 'done') return;
        const step = await nextStep();
        if (!step) return;
        await name(step.sketch, step.name);
      }
      assert.fail('The page should fill within twelve namings');
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
        assert.equal(more, true, 'Key It Out should appear on a later page of Lantern Lake');
        await tapNode('neo.scene.nextArrow');
        await page.waitForFunction((current) => neo.scene.page !== current, current, { timeout: 5000 });
        await page.waitForTimeout(300);
      }
      const landPage = await page.evaluate(() => neo.scene.page);
      await tapNode("neo.scene.showing.find(({ mod }) => mod.id === 'key-it-out').node");
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

    // Level 1: read the key from question 1, follow a branch, then name all six; two stampings, no misses.
    const firstPage = await landOpen(1);
    let s = await state();
    assert.equal(s.level, 1);
    assert.equal(s.names.length, 6);
    await choose(1);
    assert.equal((await state()).tab, 'key', 'choosing a sketch upright opens the key');
    await tapKey({ q: 0, end: 'question' });
    const branch = await page.evaluate(() => {
      const g = neo.scene.game;
      const q = g.board.key[0];
      return ['yes', 'no'].find((e) => 'q' in q[e]);
    });
    if (branch) {
      await tapKey({ q: 0, end: branch });
      s = await state();
      assert.equal(
        s.names.every((n) => n === null),
        true,
        'following a branch names nothing',
      );
    }
    await page.waitForTimeout(300);
    await screenshot('key-it-out-level-1-key-portrait');
    // The capture strip: each part's three values on an otherwise fixed creature, then the four hidden forms.
    await page.evaluate(async () => {
      // The game's own Graphics class, so the strip uses the page's one Pixi.
      const Graphics = neo.scene.game.cellArt.constructor;
      const { drawSketch } = await import('/src/games/key-it-out/art.ts');
      const { LOOKS } = await import('/src/games/key-it-out/logic.ts');
      const g = new Graphics();
      g.label = 'capture';
      g.rect(0, 0, 768, 1240).fill(0xffffff);
      const base = [0, 0, 0, 0];
      for (let p = 0; p < 4; p++)
        for (let v = 0; v < 3; v++) {
          const look = base.slice();
          look[p] = v;
          drawSketch(
            g,
            LOOKS[look[0] * 27 + look[1] * 9 + look[2] * 3 + look[3]],
            [],
            0,
            140 + v * 245,
            130 + p * 220,
            0.75,
            false,
          );
        }
      for (let p = 0; p < 4; p++) drawSketch(g, LOOKS[40], [p], 0, 105 + p * 185, 1010, 0.62, false);
      neo.scene.game.ctx.stage.addChild(g);
    });
    await page.waitForTimeout(200);
    await screenshot('key-it-out-capture-strip');
    await page.evaluate(() => neo.scene.game.ctx.stage.getChildByLabel('capture').destroy());
    await playOut();
    await finished(id);
    s = await state();
    assert.deepEqual(s.names, s.answer);
    assert.equal(await stickers(), before + 1);
    assert.deepEqual(await lastRound(), { misses: 0, hints: 0, level: 1 });
    await back(firstPage);

    // Level 2: fill the page with no right name, so nothing is stamped and the full page is judged.
    const secondPage = await landOpen(2);
    s = await state();
    assert.equal(s.level, 2);
    const answer = s.answer;
    const wrong = answer.map((_, i) => answer[(i + 1) % answer.length]);
    for (let i = 0; i < answer.length; i++) await name(i, wrong[i]);
    s = await state();
    assert.deepEqual(s.names, wrong);
    assert.equal(s.misses, 1, 'a full wrong page is one miss');
    assert.notEqual(s.fault, null);
    assert.match(s.note, /^Sketch \d+ is named \w+\. The key reaches/);
    // Lift a name and put it back: the same page again replays the explanation, free.
    const again = s.chosen;
    await tapNode('neo.scene.game.plate');
    assert.equal((await state()).names[again], null);
    await giveName(wrong[again]);
    await settled();
    s = await state();
    assert.deepEqual(s.names, wrong);
    assert.equal(s.misses, 1, 'the same full page is not counted again');
    // Help: one hint, counted once; asked again on the same page, free.
    await tapNode('neo.scene.game.help');
    await tapNode('neo.scene.game.help');
    s = await state();
    assert.equal(s.hints, 1);
    assert.equal(s.chosen, s.hint.sketch);
    assert.equal(s.tab, 'key');
    assert.match(s.note, /Name sketch \d+ \w+\.$/);
    await page.waitForTimeout(300);
    await screenshot('key-it-out-level-2-hint-portrait');
    // Rotating keeps the page, the chosen sketch, the hint and the counts.
    await page.setViewportSize(landscape);
    await page.waitForFunction(() => !neo.view.upright);
    const { tab: _tab, ...kept } = s;
    const { tab: _sideTab, ...side } = await state();
    assert.deepEqual(side, kept, 'rotating keeps the page, the chosen sketch and the hint');
    await screenshot('key-it-out-level-2-sideways');
    await page.setViewportSize(portrait);
    await page.waitForFunction(() => neo.view.upright);
    // Follow the hint, then name the rest.
    await giveName(s.hint.name);
    await settled();
    assert.equal((await state()).names[s.hint.sketch], s.hint.name);
    await playOut();
    await finished(id);
    s = await state();
    assert.deepEqual(s.names, s.answer);
    assert.deepEqual(await lastRound(), { misses: 1, hints: 1, level: 2 });
    assert.equal(await stickers(), before + 2);
    await back(secondPage);
    log(
      'Key It Out: both levels from Lantern Lake at 390×625 with captions, a key question read and a branch followed (free), level 1 named in two stampings, a full wrong page counted once and refilled free, Help counted once, rotation keeping the page, one sticker per round and return passed',
    );
  }

  return { keyItOutPlay };
}
