import assert from 'node:assert/strict';

export function createSuite({ page, ready, scene, finished, screenshot, log }) {
  async function jarCluesPlay() {
    const id = 'jar-clues';
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
    /** A number's cell in page pixels. */
    const cellAt = (n) =>
      page.evaluate((n) => {
        const g = neo.scene.game;
        const s = g.spotOf(n);
        const p = s.on.toGlobal({ x: s.x, y: s.y });
        return { x: p.x, y: p.y };
      }, n);
    const tapNumber = async (n) => tapAt(await cellAt(n));
    /** A real sweep: a mouse stroke from the first number to the last, through each one between. */
    const sweep = async (ns) => {
      const first = await cellAt(ns[0]);
      await page.mouse.move(first.x, first.y);
      await page.mouse.down();
      for (const n of ns.slice(1)) {
        const p = await cellAt(n);
        await page.mouse.move(p.x, p.y, { steps: 3 });
      }
      await page.mouse.up();
      await page.waitForTimeout(120);
    };
    /** Make the board right for the clues shown, sweeping a row's runs as the ghost finger does. */
    const solveClue = async () => {
      for (let i = 0; i < 40; i++) {
        const run = await page.evaluate(async () => {
          const logic = await import('/src/games/jar-clues/logic.ts');
          const g = neo.scene.game;
          return logic.sweepRun(g.board, g.shown, g.marks);
        });
        if (!run) return;
        if (run.length === 1) await tapNumber(run[0]);
        else await sweep(run);
      }
      assert.fail('the board should hold within forty strokes');
    };
    const next = () => tapNode('neo.scene.game.next');
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
          kit.store.data.settings.howToCards = false;
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
        assert.equal(more, true, 'Jar Clues should appear on a later page of Lantern Lake');
        await tapNode('neo.scene.nextArrow');
        await page.waitForFunction((current) => neo.scene.page !== current, current, { timeout: 5000 });
        await page.waitForTimeout(300);
      }
      const landPage = await page.evaluate(() => neo.scene.page);
      await tapNode("neo.scene.showing.find(({ mod }) => mod.id === 'jar-clues').node");
      await scene('GameScene');
      await page.waitForFunction(() => neo.scene.game && neo.scene.place.mode !== 'none');
      assert.equal(await page.evaluate(() => neo.scene.level), level);
      await page.setViewportSize(portrait);
      await page.waitForFunction(() => neo.view.upright);
      await page.waitForTimeout(300);
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
    /** Plant a guess, then each clue: make the board right and press Next clue; ends at the last look. */
    const throughClues = async (from, shotAtLast) => {
      for (let s = await state(); s.phase === 'clues'; s = await state()) {
        if (s.shown >= from) await solveClue();
        if (shotAtLast && s.shown === s.clues.length) {
          await page.waitForTimeout(300);
          await screenshot(shotAtLast);
        }
        await next();
      }
      assert.equal((await state()).phase, 'last');
    };

    const before = await stickers();

    // The capture strip: the jar at the upright strip's size, at pairs of counts nine apart (the smallest gap the
    // last look asks the eye to judge), with the ten line. The round is left unfinished.
    await landOpen(1);
    await page.evaluate(async () => {
      const Graphics = neo.scene.game.jarArt.constructor;
      const { drawJar, JAR_OUTER } = await import('/src/games/jar-clues/art.ts');
      const { pile } = await import('/src/engine/random.ts').then(async ({ Rng }) => {
        const logic = await import('/src/games/jar-clues/logic.ts');
        return { pile: (n) => logic.pile(n, new Rng(n * 7)) };
      });
      const g = new Graphics();
      g.label = 'capture';
      g.rect(0, 0, 768, 1240).fill(0xffffff);
      const k = Math.min(164 / JAR_OUTER.w, 244 / JAR_OUTER.h);
      [12, 21, 30, 42, 51, 60].forEach((n, i) =>
        drawJar(g, 130 + (i % 3) * 250, 170 + Math.floor(i / 3) * 330, k, pile(n), true),
      );
      neo.scene.game.ctx.stage.addChild(g);
    });
    await page.waitForTimeout(200);
    await screenshot('jar-clues-capture-nine-apart');
    await page.evaluate(() => neo.scene.game.ctx.stage.getChildByLabel('capture').destroy());

    // Level 1: First clue waits for a guess; plant one, move it, and play every clue right.
    const firstPage = await landOpen(1);
    let s = await state();
    assert.equal(s.level, 1);
    assert.equal(s.phase, 'guess');
    await next();
    assert.equal((await state()).phase, 'guess', 'First clue waits for a guess');
    await tapNumber(20);
    await tapNumber(30);
    s = await state();
    assert.equal(s.guess, 30);
    assert.deepEqual(s.crossed, [], 'a guess crosses nothing off');
    await next();
    s = await state();
    assert.equal(s.shown, 1);
    await throughClues(1);
    s = await state();
    assert.deepEqual([s.misses, s.hints], [0, 0]);
    await tapNode(`neo.scene.game.cards[${s.last.indexOf(s.count)}]`);
    await finished(id);
    assert.equal(await stickers(), before + 1);
    assert.deepEqual(await lastRound(), { misses: 0, hints: 0, level: 1 });
    await back(firstPage);

    // Level 2: Next clue with a ruled-out number standing is one miss; the same board again is free.
    const secondPage = await landOpen(2);
    await tapNumber(25);
    await next();
    s = await state();
    assert.equal(s.shown, 1);
    assert.ok(s.wrong.length > 0, 'the first clue rules something out');
    await next();
    s = await state();
    assert.equal(s.misses, 1, 'a board that does not hold is one miss');
    assert.equal(s.fault, s.wrong[0], 'the explanation lights the lowest wrong number');
    assert.match(s.note, new RegExp(`^${s.fault} is still standing\\. The clue says `));
    await page.waitForTimeout(400);
    await next();
    s = await state();
    assert.equal(s.misses, 1, 'the same board again is not counted again');
    // Help: one hint for the lowest row; follow it by tapping the lit numbers.
    await tapNode('neo.scene.game.help');
    s = await state();
    assert.equal(s.hints, 1);
    assert.ok(s.hint.lit.length > 0);
    await page.waitForTimeout(300);
    await screenshot('jar-clues-level-2-hint-portrait');
    for (const n of s.hint.lit) await tapNumber(n);
    s = await state();
    assert.ok(
      s.wrong.every((n) => Math.floor((n - 1) / 10) !== s.hint.row),
      'following the hint leaves its row right',
    );
    // Rotating keeps the board, the guess, the clue and the counts.
    const { note: _n, ...kept } = s;
    await page.setViewportSize(landscape);
    await page.waitForFunction(() => !neo.view.upright);
    const { note: _m, ...side } = await state();
    assert.deepEqual(side, kept, 'rotating keeps the board');
    await screenshot('jar-clues-level-2-sideways');
    await page.setViewportSize(portrait);
    await page.waitForFunction(() => neo.view.upright);
    await page.waitForTimeout(300);
    await solveClue();
    await next();
    await throughClues(2, 'jar-clues-level-2-last-clue-portrait');
    s = await state();
    await screenshot('jar-clues-level-2-last-look-portrait');
    // Choose a card that is not the count: a judgement, never a miss.
    const other = s.last.findIndex((n) => n !== s.count);
    await tapNode(`neo.scene.game.cards[${other}]`);
    await finished(id);
    s = await state();
    assert.equal(s.chosen, s.last[other]);
    assert.match(s.note, new RegExp(`The jar holds ${s.count}\\.`));
    assert.deepEqual(await lastRound(), { misses: 1, hints: 1, level: 2 });
    assert.equal(await stickers(), before + 2);
    await back(secondPage);
    log(
      'Jar Clues: both levels from Lantern Lake at 390×625 with captions; First clue waiting for a guess, the guess moved free, level 1 swept clean; level 2 a ruled-out number left standing counted once and rechecked free, Help counted once and followed, rotation keeping the board, a card that was not the count chosen with no miss, one sticker per round and return passed',
    );
  }

  return { jarCluesPlay };
}
