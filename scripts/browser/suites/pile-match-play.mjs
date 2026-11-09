import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  /** Pile Match by touch: level 1 with one wrong kind, level 8 with a full tray refused, three put-backs and the hint they bring, level 9's four places, level 11's free little pile, level 4 upright in the autumn look; one sticker each. */
  async function pileMatchPlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          busy: g.busy,
          misses: g.misses,
          hints: g.hints,
          mask: g.mask,
          tray: g.trayOrder.length,
          hinted: !!g.hinted,
          finished: g.finished,
        };
      });
    const idle = () =>
      page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, {
        timeout: 15000,
      });
    /** Tap a point in the game's units, as a finger would (down and up on the canvas). */
    const tapAt = async (x, y) => {
      const p = await page.evaluate(({ x, y }) => neo.scene.game.hitLayer.toGlobal({ x, y }), { x, y });
      await page.evaluate(({ x, y }) => kit.tap(x, y), p);
      await page.waitForTimeout(120);
      await idle();
      await page.waitForTimeout(80);
    };
    const tapPiece = async (i) => {
      const p = await page.evaluate((i) => neo.scene.game.layout.pieces[i], i);
      await tapAt(p.x, p.y);
    };
    const tapSlot = async (k) => {
      const s = await page.evaluate((k) => neo.scene.game.layout.slots[k], k);
      await tapAt(s.x + s.w / 2, s.y + s.h / 2);
    };
    /** Follow the ghost finger's own choice until the heap is clear. */
    const solveAll = async () => {
      for (
        let guard = 0;
        guard < 120 && !(await page.evaluate(() => neo.scene.finished || neo.scene.game.finished));
        guard++
      ) {
        await idle();
        const t = await page.evaluate(() => {
          const g = neo.scene.game,
            i = g.autotouch();
          return i ? { x: i.tap.x, y: i.tap.y } : null;
        });
        if (!t) {
          await page.waitForTimeout(200);
          continue;
        }
        await tapAt(t.x, t.y);
      }
      await page.waitForFunction(() => neo.scene.finished, null, { timeout: 20000 });
    };
    // Level 1: apples asked first; a free piece of the seeded second kind is one miss and changes nothing.
    await launch('pile-match', 1);
    await idle();
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => neo.scene.game.look), 'meadow', 'level 1 keeps the meadow');
    const stickers = await page.evaluate(() => kit.store.data.stickers.length);
    const wrong = await page.evaluate(async () => {
      const L = await import('/src/games/pile-match/logic.ts'),
        g = neo.scene.game;
      if (L.KINDS[L.askedKind(g.board, g.mask)] !== 'apple') return -2;
      return L.freePieces(g.board.cells, g.mask).find((i) => L.KINDS[g.board.kinds[i]] !== 'apple') ?? -1;
    });
    assert.ok(wrong >= 0, 'level 1 asks for apples and shows another kind');
    const full = (await state()).mask;
    await tapPiece(wrong);
    let st = await state();
    assert.deepEqual(
      [st.misses, st.mask, st.tray],
      [1, full, 0],
      'another kind when apples are asked is one miss and stays on the grass',
    );
    // The screen turns while a piece is in flight: it still lands and the round goes on.
    const apple = await page.evaluate(async () => {
      const L = await import('/src/games/pile-match/logic.ts'),
        g = neo.scene.game;
      return L.hintFor(g.board, g.mask, 3, { asked: L.askedKind(g.board, g.mask) }).take;
    });
    const p1 = await page.evaluate(
      (i) => neo.scene.game.hitLayer.toGlobal(neo.scene.game.layout.pieces[i]),
      apple,
    );
    await page.evaluate(({ x, y }) => {
      kit.tap(x, y);
      neo.scene.game.resize(neo.view);
    }, p1);
    await page.waitForTimeout(150);
    await idle();
    assert.equal(
      (await state()).tray,
      1,
      'a resize mid-flight lands the piece and leaves the round answering',
    );
    await solveAll();
    st = await state();
    assert.deepEqual([st.misses, st.hints], [1, 0], 'level 1 solved with the one miss');
    await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers, { timeout: 15000 });
    // Level 8: fill the tray without a three, then a fourth kind is refused once (one miss); three put-backs light the hint.
    await launch('pile-match', 8);
    await idle();
    await page.waitForTimeout(300);
    const stickers8 = await page.evaluate(() => kit.store.data.stickers.length);
    for (let guard = 0; guard < 12 && (await state()).tray < 5; guard++) {
      const i = await page.evaluate(async () => {
        const L = await import('/src/games/pile-match/logic.ts'),
          g = neo.scene.game,
          t = L.tray(g.board, g.mask);
        const open = L.freePieces(g.board.cells, g.mask);
        return (
          open.find((i) => t[g.board.kinds[i]] === 0) ??
          open.find((i) => t[g.board.kinds[i]] === 1) ??
          open[0]
        );
      });
      await tapPiece(i);
    }
    assert.equal((await state()).tray, 5, 'the tray fills to five');
    const refused = await page.evaluate(async () => {
      const L = await import('/src/games/pile-match/logic.ts'),
        g = neo.scene.game,
        t = L.tray(g.board, g.mask);
      return L.freePieces(g.board.cells, g.mask).find((i) => t[g.board.kinds[i]] < 2) ?? -1;
    });
    assert.ok(refused >= 0, 'a free piece the full tray must refuse');
    await tapPiece(refused);
    await tapPiece(refused);
    st = await state();
    assert.deepEqual([st.misses, st.tray], [1, 5], 'a full tray refuses, and only the first refusal counts');
    for (let k = 0; k < 3; k++) await tapSlot(0);
    await page.waitForTimeout(300);
    st = await state();
    assert.deepEqual(
      [st.tray, st.misses, st.hints, st.hinted],
      [2, 1, 1, true],
      'three put-backs are free and light the hint once',
    );
    await solveAll();
    st = await state();
    assert.deepEqual([st.misses, st.hints], [1, 1]);
    await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers8, {
      timeout: 15000,
    });
    // Level 9: a four-place tray fills without a three, a fifth tap is refused (one miss), then solved by taps.
    await launch('pile-match', 9);
    await idle();
    await page.waitForTimeout(300);
    const stickers9 = await page.evaluate(() => kit.store.data.stickers.length);
    assert.equal(
      await page.evaluate(() => neo.scene.game.layout.slots.length),
      4,
      'level 9 draws four places',
    );
    for (let guard = 0; guard < 10 && (await state()).tray < 4; guard++) {
      const i = await page.evaluate(async () => {
        const L = await import('/src/games/pile-match/logic.ts'),
          g = neo.scene.game,
          t = L.tray(g.board, g.mask);
        const open = L.freePieces(g.board.cells, g.mask);
        return (
          open.find((i) => t[g.board.kinds[i]] === 0) ??
          open.find((i) => t[g.board.kinds[i]] === 1) ??
          open[0]
        );
      });
      await tapPiece(i);
    }
    assert.equal((await state()).tray, 4, 'the tray fills to four');
    const refused9 = await page.evaluate(async () => {
      const L = await import('/src/games/pile-match/logic.ts'),
        g = neo.scene.game,
        t = L.tray(g.board, g.mask);
      return L.freePieces(g.board.cells, g.mask).find((i) => t[g.board.kinds[i]] < 2) ?? -1;
    });
    assert.ok(refused9 >= 0, 'a free piece the full four-place tray must refuse');
    await tapPiece(refused9);
    st = await state();
    assert.deepEqual([st.misses, st.tray], [1, 4], 'the full four-place tray refuses and counts once');
    await screenshot('pile-match-9-full-tray');
    await solveAll();
    await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers9, {
      timeout: 15000,
    });
    // Level 11: a little pile of two kinds; a covered touch and three put-backs are never counted, the tray never fills.
    await launch('pile-match', 11);
    await idle();
    await page.waitForTimeout(300);
    const stickers11 = await page.evaluate(() => kit.store.data.stickers.length);
    const pile = await page.evaluate(async () => {
      const L = await import('/src/games/pile-match/logic.ts'),
        g = neo.scene.game,
        open = L.freePieces(g.board.cells, g.mask);
      return {
        slots: g.layout.slots.length,
        layers: [0, 1].map((z) => g.board.cells.filter((c) => c.z === z).length),
        covered: g.board.cells.map((_, i) => i).find((i) => !open.includes(i)),
        top: open.find((i) => g.board.cells[i].z === 1),
      };
    });
    assert.deepEqual(
      [pile.slots, pile.layers],
      [5, [4, 2]],
      'level 11 is four on the grass, two on top, five places',
    );
    await tapPiece(pile.covered);
    st = await state();
    assert.deepEqual([st.misses, st.tray], [0, 0], 'a covered touch wiggles and is never counted');
    for (let k = 0; k < 3; k++) {
      await tapPiece(pile.top);
      await tapSlot(0);
    }
    await page.waitForTimeout(300);
    st = await state();
    assert.deepEqual(
      [st.tray, st.misses, st.hints, st.hinted],
      [0, 0, 0, false],
      'put-backs in free play never bring the hint',
    );
    await screenshot('pile-match-11-little-pile');
    let most = 0;
    for (let guard = 0; guard < 20 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
      const i = await page.evaluate(async () => {
        const L = await import('/src/games/pile-match/logic.ts'),
          g = neo.scene.game,
          t = L.tray(g.board, g.mask),
          open = L.freePieces(g.board.cells, g.mask);
        // Spread the kinds out first, to hold as many as two kinds can.
        return open.find((i) => t[g.board.kinds[i]] < 2) ?? open[0] ?? -1;
      });
      if (i < 0) break;
      await tapPiece(i);
      most = Math.max(most, (await state()).tray);
    }
    await page.waitForFunction(() => neo.scene.finished, null, { timeout: 20000 });
    st = await state();
    assert.ok(most <= 4, `the tray never fills (held ${most})`);
    assert.deepEqual([st.misses, st.hints], [0, 0], 'level 11 solved with nothing counted');
    await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers11, {
      timeout: 15000,
    });
    // Level 4 upright in the autumn look (relaunched until the seed gives it): taps wait for the drop-in, one screenshot, solved by taps.
    await page.setViewportSize({ width: 768, height: 1024 });
    let look = '';
    for (let guard = 0; guard < 15 && look !== 'autumn'; guard++) {
      await launch('pile-match', 4);
      look = await page.evaluate(() => neo.scene.game.look);
    }
    assert.equal(look, 'autumn', 'level 4 can blow down in the autumn look');
    assert.equal(
      await page.evaluate(() => neo.scene.game.busy),
      true,
      'the heap is still dropping in, so taps wait',
    );
    await idle();
    await page.waitForTimeout(400);
    await screenshot('pile-match-4-autumn-portrait');
    const stickers4 = await page.evaluate(() => kit.store.data.stickers.length);
    await solveAll();
    await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers4, {
      timeout: 15000,
    });
    await page.setViewportSize({ width: 1024, height: 768 });
    assert.deepEqual(errors, [], 'page errors');
    log(
      'Pile Match: level 1 with a wrong kind, level 8 with a full-tray refusal, put-backs and a hint, level 9 with a full four-place tray, level 11 free play with nothing counted, level 4 upright in autumn, all solved by taps',
    );
  }

  return { pileMatchPlay };
}
