import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function crosswordPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('crossword').history.at(-1);
        return [r.misses, r.hints];
      });
    const tally = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);
    const idle = () =>
      page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 30000 });
    // Drags a bank tile (the right one, or a wrong one) onto the active word's next empty square, through the real drag.
    const fill = (wrong) =>
      page.evaluate(async (wrong) => {
        const g = neo.scene.game,
          p = g.puzzle;
        const { key: sq, letter: want } = g.nextSquare();
        const tile = g.bank.find((t) => (wrong ? t.letter !== want : t.letter === want));
        const to = g.layer.toGlobal(g.center(sq));
        await kit.dragTo(tile, to, 12);
        return { sq, letter: tile.letter, want };
      }, wrong);
    // Plays the rest of the round as the ghost finger would: tap the next picture, or drag the right tile.
    const playOut = async () => {
      for (let n = 0; n < 40; n++) {
        await idle();
        await page.waitForTimeout(300);
        if (await page.evaluate(() => neo.scene.finished === true)) return;
        await page.evaluate(async () => {
          const g = neo.scene.game,
            intent = g.autotouch();
          if (!intent) return;
          if (intent.tap)
            kit.tapOn(intent.tap.on, intent.tap.x * neo.view.scale, intent.tap.y * neo.view.scale);
          else
            await kit.dragTo(intent.drag.on, intent.to.on.toGlobal({ x: intent.to.x, y: intent.to.y }), 12);
        });
      }
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    // FROM_LEVEL=4 plays only the newest level.
    const from = Number(process.env.FROM_LEVEL || 1);
    const geom = () =>
      page.evaluate(() => {
        const g = neo.scene.game,
          v = neo.view;
        const box = (o) => ({
          x0: o.x + o.hitArea.x,
          y0: o.y + o.hitArea.y,
          x1: o.x + o.hitArea.x + o.hitArea.width,
          y1: o.y + o.hitArea.y + o.hitArea.height,
        });
        const all = [...g.bank, g.help, ...(g.show.visible ? [g.show] : [])].map(box);
        const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
        let overlaps = 0;
        for (let i = 0; i < all.length; i++)
          for (let j = i + 1; j < all.length; j++) if (hit(all[i], all[j])) overlaps++;
        const p = g.puzzle,
          b = g.board;
        const grid = { x0: b.x, y0: b.y, x1: b.x + p.w * 104 - 4, y1: b.y + p.h * 104 - 4 };
        return {
          bank: g.bank.length,
          overlaps,
          onGrid: all.filter((a) => hit(a, grid)).length,
          inView:
            all.every((a) => a.x0 >= 0 && a.y0 >= 0 && a.x1 <= v.w && a.y1 <= v.h) &&
            grid.y1 <= v.h &&
            grid.x1 <= v.w,
        };
      });
    // Right tiles until one blank of the active word is left, then a wrong one: one miss.
    const wrongLast = async () => {
      for (let n = 0; n < 6; n++) {
        const left = await page.evaluate(() => {
          const g = neo.scene.game,
            p = g.puzzle,
            w = p.words[g.active];
          return w.word.split('').filter((_, i) => {
            const k = w.dir === 'down' ? `${w.row + i},${w.col}` : `${w.row},${w.col + i}`;
            return !g.fills.has(k);
          }).length;
        });
        if (left <= 1) break;
        await fill(false);
        await page.waitForTimeout(400);
        await idle();
      }
      await fill(true);
      await page.waitForTimeout(900);
    };
    let s, gm;
    if (from <= 2) {
      // Level 1: one wrong tile in the crossing is one miss and hops back; Help fills the crossing (one hint); the rest by drags.
      await launch('crossword', 1);
      await idle();
      await page.waitForTimeout(400);
      s = await page.evaluate(() => {
        const g = neo.scene.game;
        return { puzzles: g.puzzles.length, blanks: g.puzzle.blanks.length, bank: g.bank.length };
      });
      assert.deepEqual(
        s,
        { puzzles: 3, blanks: 1, bank: 3 },
        'level 1: three puzzles, one blank, three tiles',
      );
      const w = await fill(true);
      assert.notEqual(w.letter, w.want, 'a wrong tile was dragged');
      await page.waitForTimeout(700);
      assert.deepEqual(await tally(), [1, 0], 'a wrong crossing is one miss');
      s = await page.evaluate(() => ({
        filled: neo.scene.game.fills.size,
        bank: neo.scene.game.bank.length,
      }));
      assert.deepEqual(s, { filled: 0, bank: 3 }, 'the wrong tile hops back to the bank');
      await page.evaluate(() => kit.tapOn(neo.scene.game.help));
      await page.waitForTimeout(400);
      assert.deepEqual(await tally(), [1, 1], 'Help counts one hint');
      await playOut();
      await finished('crossword');
      assert.deepEqual(await score(), [1, 1], 'level 1 saved 1 miss, 1 hint');

      // Level 2: two crossings and first letters, a portrait look, all filled by drags with no misses.
      await launch('crossword', 2);
      await idle();
      await page.waitForTimeout(400);
      s = await page.evaluate(() => {
        const g = neo.scene.game;
        return { puzzles: g.puzzles.length, words: g.puzzle.words.length, bank: g.bank.length };
      });
      assert.equal(s.puzzles, 2, 'level 2 plays two puzzles');
      assert.equal(s.words, 3, 'three words in a chain');
      assert.ok(s.bank <= 4, 'at most four tiles');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(800);
      const small = await page.evaluate(() => {
        const g = neo.scene.game,
          v = neo.view;
        const all = [...g.bank, g.help];
        return {
          minSide: Math.min(...all.map((o) => Math.min(o.hitArea.width, o.hitArea.height))),
          bottom: Math.max(...all.map((o) => o.y + o.hitArea.y + o.hitArea.height)),
          h: v.h,
        };
      });
      assert.ok(small.minSide >= 100, `bank tiles and Help stay at least 100 units (${small.minSide})`);
      assert.ok(small.bottom <= small.h, 'the bank fits on screen upright');
      await screenshot('crossword-2-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);
      await playOut();
      await finished('crossword');
      assert.deepEqual(await score(), [0, 0], 'level 2 saved no misses or hints');
      log(
        'Crossword 1 and 2: a wrong crossing is one miss and hops back, Help one hint, portrait bank, both levels to the sticker, passed',
      );
    }
    if (from <= 3) {
      // Level 3: one themed criss-cross of four words, every square blank. A word filled with one wrong last tile is one miss;
      // Help is one hint; the six-tile bank sits clear of Help and the grid in landscape.
      await launch('crossword', 3);
      await idle();
      await page.waitForTimeout(400);
      s = await page.evaluate(() => {
        const g = neo.scene.game,
          p = g.puzzle;
        const letters = new Set(
          p.words.flatMap((w) =>
            w.word
              .split('')
              .map((_, i) => (w.dir === 'down' ? `${w.row + i},${w.col}` : `${w.row},${w.col + i}`)),
          ),
        );
        return {
          puzzles: g.puzzles.length,
          words: p.words.length,
          theme: p.theme?.name,
          allBlank: letters.size === p.blanks.length,
          w: p.w,
          h: p.h,
        };
      });
      assert.equal(s.puzzles, 1, 'level 3 plays one grid');
      assert.equal(s.words, 4, 'four words');
      assert.ok(s.theme, 'the round has a theme');
      assert.ok(s.allBlank, 'every letter square is blank');
      assert.ok(s.w <= 6 && s.h <= 6, 'at most 6 by 6');
      gm = await geom();
      assert.ok(gm.bank <= 6, `at most six tiles (${gm.bank})`);
      assert.deepEqual(
        [gm.overlaps, gm.onGrid, gm.inView],
        [0, 0, true],
        `landscape bank clear of Help and the grid, on screen (${JSON.stringify(gm)})`,
      );
      await screenshot('crossword-3-landscape');
      await wrongLast();
      assert.deepEqual(await tally(), [1, 0], 'a wrong full word is one miss');
      await idle();
      await page.evaluate(() => kit.tapOn(neo.scene.game.help));
      await page.waitForTimeout(400);
      assert.deepEqual(await tally(), [1, 1], 'Help counts one hint');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(800);
      gm = await geom();
      assert.deepEqual(
        [gm.overlaps, gm.onGrid, gm.inView],
        [0, 0, true],
        `portrait bank clear of Help and the grid, on screen (${JSON.stringify(gm)})`,
      );
      await screenshot('crossword-3-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);
      await playOut();
      await finished('crossword');
      assert.deepEqual(await score(), [1, 1], 'level 3 saved 1 miss, 1 hint');
      log(
        'Crossword 3: a themed four-word criss-cross, a wrong full word one miss, Help one hint, six-tile bank clear in both orientations, to the sticker, passed',
      );
    }

    // Level 4: speakers instead of pictures. Tapping one says its riddle (free); Show me reveals the active word's picture (one
    // hint, once); a wrong full word is one miss; Show me and the bank sit clear of Help and the grid in both orientations.
    await launch('crossword', 4);
    await idle();
    await page.waitForTimeout(400);
    s = await page.evaluate(() => {
      const g = neo.scene.game,
        p = g.puzzle;
      return { words: p.words.length, revealed: g.revealed.size, show: g.show.visible, theme: p.theme };
    });
    assert.deepEqual(
      s,
      { words: 4, revealed: 0, show: true, theme: undefined },
      'level 4: four riddle words, every picture hidden, Show me on screen',
    );
    await page.evaluate(() => {
      const g = neo.scene.game,
        w = g.puzzle.words[1];
      const c = w.dir === 'across' ? { row: w.row, col: w.col - 1 } : { row: w.row - 1, col: w.col };
      kit.tapOn(g.grid, (c.col * 104 + 50) * neo.view.scale, (c.row * 104 + 50) * neo.view.scale);
    });
    await page.waitForTimeout(400);
    s = await page.evaluate(() => ({
      active: neo.scene.game.active,
      revealed: neo.scene.game.revealed.size,
    }));
    assert.deepEqual(
      s,
      { active: 1, revealed: 0 },
      'tapping a speaker picks its word and keeps the picture hidden',
    );
    assert.deepEqual(await tally(), [0, 0], 'hearing a riddle is free');
    await page.evaluate(() => kit.tapOn(neo.scene.game.show));
    await page.waitForTimeout(400);
    assert.deepEqual(await tally(), [0, 1], 'Show me counts one hint');
    assert.equal(
      await page.evaluate(() => neo.scene.game.revealed.has(1)),
      true,
      'Show me reveals the active word',
    );
    await page.evaluate(() => kit.tapOn(neo.scene.game.show));
    await page.waitForTimeout(400);
    assert.deepEqual(await tally(), [0, 1], 'Show me again on a shown picture is not another hint');
    gm = await geom();
    assert.deepEqual(
      [gm.overlaps, gm.onGrid, gm.inView],
      [0, 0, true],
      `landscape Show me, bank and Help clear (${JSON.stringify(gm)})`,
    );
    await wrongLast();
    assert.deepEqual(await tally(), [1, 1], 'a wrong full riddle word is one miss');
    await idle();
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    gm = await geom();
    assert.deepEqual(
      [gm.overlaps, gm.onGrid, gm.inView],
      [0, 0, true],
      `portrait Show me, bank and Help clear (${JSON.stringify(gm)})`,
    );
    await screenshot('crossword-4-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await playOut();
    await finished('crossword');
    assert.deepEqual(await score(), [1, 1], 'level 4 saved 1 miss, 1 hint');
    log(
      'Crossword 4: speakers hide the pictures, a riddle tap is free, Show me one hint once, a wrong full word one miss, Show me clear in both orientations, to the sticker, passed',
    );
  }
  return { crosswordPlay };
}
