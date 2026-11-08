import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  /** Block Garden by touch: levels 1 and 8 planted by drags along the solver's way, two refused drops at 3 (two misses, one hint), undo, level 6 upright, level 5 upright in autumn. */
  async function blockGardenPlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          busy: g.busy,
          misses: g.misses,
          hints: g.hints,
          hinted: !!g.hinted,
          index: g.index,
          filled: g.state.bed.filled.join(','),
          used: g.state.used,
        };
      });
    const idle = () =>
      page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, {
        timeout: 15000,
      });
    /** Drag the piece in slot order `piece` so its shadow lands with its top-left square at (r, c) (or anywhere over the bed point given). */
    const dragTo = async (piece, r, c) => {
      const pts = await page.evaluate(
        ({ piece, r, c }) => {
          const g = neo.scene.game,
            slot = g.slots.find((s) => s.piece === piece);
          const L = g.garden.pieces[piece];
          return { a: slot.carrier.toGlobal({ x: 0, y: 0 }), id: L, piece };
        },
        { piece, r, c },
      );
      const target = await page.evaluate(
        async ({ piece, r, c }) => {
          const { SHAPES } = await import('/src/games/block-garden/logic.ts');
          const g = neo.scene.game,
            s = SHAPES[g.garden.pieces[piece]],
            lay = g.lay;
          const lift = g.liftFor(piece);
          return g.root.toGlobal({
            x: lay.x + (c + s.w / 2) * lay.cell,
            y: lay.y + (r + s.h / 2) * lay.cell + lift,
          });
        },
        { piece, r, c },
      );
      await page.evaluate(({ a, b }) => kit.drag(kit.line([a.x, a.y], [b.x, b.y], 16)), {
        a: pts.a,
        b: target,
      });
      await page.waitForTimeout(250);
    };
    const plantAll = async () => {
      for (let guard = 0; guard < 60 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
        await idle();
        if (await page.evaluate(() => neo.scene.finished)) break;
        const p = await page.evaluate(async () => {
          const L = await import('/src/games/block-garden/logic.ts'),
            g = neo.scene.game;
          if (g.busy) return null;
          const h = L.hintPlacement(g.garden, g.state, g.history);
          return h.kind === 'plan' ? h.placement : null;
        });
        if (!p) {
          await page.waitForTimeout(250);
          continue;
        }
        await dragTo(p.piece, p.r, p.c);
        await page.waitForTimeout(500);
      }
      await page.waitForFunction(() => neo.scene.finished, null, { timeout: 20000 });
    };
    const refusedSpot = () =>
      page.evaluate(async () => {
        const L = await import('/src/games/block-garden/logic.ts'),
          g = neo.scene.game,
          lay = g.lay;
        for (const piece of L.trayNow(g.garden, g.state.used)) {
          const id = g.garden.pieces[piece],
            s = L.SHAPES[id];
          for (let r = 0; r + s.h <= lay.n; r++)
            for (let c = 0; c + s.w <= lay.n; c++) {
              if (!L.nearestAnchor(g.state.bed, id, lay.x + c * lay.cell, lay.y + r * lay.cell, lay))
                return { piece, r, c };
            }
        }
        return null;
      });
    // Level 11 (school's top), upright: the snail's line has an easy gap; the carried piece over it shows the snail worried, a drop
    // there is refused as a miss, a second one lights the hint, the hinted piece is planted, then the rest by drags and one sticker.
    // GARDEN_LEVELS=11 runs this part alone.
    if (!process.env.GARDEN_LEVELS || process.env.GARDEN_LEVELS === '11') {
      await page.setViewportSize({ width: 768, height: 1024 });
      await launch('block-garden', 11);
      await idle();
      const stickers11 = await page.evaluate(() => kit.store.data.stickers.length);
      const snailSpot = () =>
        page.evaluate(async () => {
          const L = await import('/src/games/block-garden/logic.ts'),
            g = neo.scene.game;
          for (const piece of L.trayNow(g.garden, g.state.used)) {
            const id = g.garden.pieces[piece];
            const a = L.anchors(g.state.bed, id).find((at) => !L.allowed(g.state.bed, id, at));
            if (a) return { piece, r: a.r, c: a.c, snails: L.place(g.state.bed, id, a).snails };
          }
          return null;
        });
      const spot = await snailSpot();
      assert.ok(spot && spot.snails.length === 1, 'level 11 has a tray piece that would fill the snail line');
      await page.waitForTimeout(400);
      await screenshot('block-garden-11-portrait');
      // The shadow over the snail's line: the worried snail instead of the shimmer.
      await page.evaluate(({ piece, r, c }) => (neo.scene.game.shadow = { piece, at: { r, c } }), spot);
      await page.waitForTimeout(200);
      await screenshot('block-garden-11-worried');
      await page.evaluate(() => (neo.scene.game.shadow = null));
      for (let k = 1; k <= 2; k++) {
        const s = await snailSpot();
        await dragTo(s.piece, s.r, s.c);
        await page.waitForTimeout(400);
        const st = await state();
        assert.deepEqual([st.misses, st.used], [k, 0], `snail drop ${k} is refused as a miss`);
      }
      let st11 = await state();
      assert.deepEqual([st11.hints, st11.hinted], [1, true], 'the second miss lights the hint once');
      const kept = await page.evaluate(() => neo.scene.game.state.bed.keep.join(','));
      const hinted = await page.evaluate(() => neo.scene.game.hinted);
      const ok = await page.evaluate(async (h) => {
        const L = await import('/src/games/block-garden/logic.ts'),
          g = neo.scene.game;
        return L.allowed(g.state.bed, g.garden.pieces[h.piece], h);
      }, hinted);
      assert.ok(ok, 'the hint never fills the snail line');
      await dragTo(hinted.piece, hinted.r, hinted.c);
      await idle();
      assert.notEqual((await state()).used, 0, 'the hinted piece is planted');
      await plantAll();
      st11 = await state();
      assert.deepEqual([st11.misses, st11.hints], [2, 1]);
      assert.equal(
        await page.evaluate(() => neo.scene.game.state.bed.keep.join(',')),
        kept,
        'the snail is still home at the end',
      );
      await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers11, {
        timeout: 15000,
      });
      assert.deepEqual(errors, [], 'page errors');
      if (process.env.GARDEN_LEVELS === '11') {
        log(
          'Block Garden level 11 upright: the worried snail over its line, two refused snail drops (two misses), the hint lit once and planted, the rest by drags, the snail kept, one sticker',
        );
        return;
      }
    }
    // Level 10 (school, between 5 and 6), upright: the next tray shows faded under the tray; a tap on a faded piece wiggles it and
    // is never a miss; a refused drop is one miss; planted by drags, one sticker. GARDEN_LEVELS=10 runs this part alone.
    await page.setViewportSize({ width: 768, height: 1024 });
    await launch('block-garden', 10);
    await idle();
    const stickers10 = await page.evaluate(() => kit.store.data.stickers.length);
    const ghosts = await page.evaluate(() => {
      const g = neo.scene.game;
      return g.ghosts.map((gh, i) => ({
        piece: gh.piece,
        visible: gh.node.visible,
        at: gh.node.toGlobal({ x: 0, y: 0 }),
        rect: g.lay.next[i],
      }));
    });
    assert.deepEqual(
      ghosts.map((gh) => [gh.piece, gh.visible]),
      [
        [3, true],
        [4, true],
        [5, true],
      ],
      'level 10 shows the second tray faded',
    );
    for (const gh of ghosts)
      assert.ok(Math.min(gh.rect.w, gh.rect.h) >= 100, 'a faded card is at least 100 across');
    await page.waitForTimeout(400);
    await screenshot('block-garden-10-portrait');
    let st0 = await state();
    await page.evaluate(({ x, y }) => kit.tap(x, y), ghosts[1].at);
    await page.waitForTimeout(150);
    assert.ok(await page.evaluate(() => neo.scene.game.ghosts[1].wiggle > 0), 'a tapped faded piece wiggles');
    let st1 = await state();
    assert.deepEqual(
      [st1.misses, st1.hints, st1.used],
      [st0.misses, st0.hints, 0],
      'a faded piece is never a miss',
    );
    // A drag that starts on a faded piece lifts nothing.
    await page.evaluate(({ a }) => kit.drag(kit.line([a.x, a.y], [a.x, a.y - 400], 12)), { a: ghosts[0].at });
    await page.waitForTimeout(300);
    st1 = await state();
    assert.deepEqual([st1.misses, st1.used], [0, 0], 'a faded piece cannot be lifted');
    const spot10 = await refusedSpot();
    assert.ok(spot10, 'level 10 has a spot where a piece cannot fit');
    await dragTo(spot10.piece, spot10.r, spot10.c);
    await page.waitForTimeout(400);
    assert.deepEqual(
      [(await state()).misses, (await state()).used],
      [1, 0],
      'a refused drop at 10 is one miss',
    );
    await plantAll();
    st1 = await state();
    assert.equal(st1.misses, 1);
    await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers10, {
      timeout: 15000,
    });
    await page.setViewportSize({ width: 1024, height: 768 });
    await launch('block-garden', 10);
    await idle();
    await page.waitForTimeout(400);
    await screenshot('block-garden-10');
    assert.deepEqual(errors, [], 'page errors');
    if (process.env.GARDEN_LEVELS === '10') {
      log(
        'Block Garden level 10: the faded next tray upright and wide, a tapped and a dragged faded piece (never a miss), one refused drop (one miss), planted by drags, one sticker',
      );
      return;
    }
    // Level 1: the authored row first; planted by drags, no misses or hints, one sticker.
    await launch('block-garden', 1);
    await idle();
    const stickers = await page.evaluate(() => kit.store.data.stickers.length);
    assert.equal(
      await page.evaluate(() => neo.scene.game.state.bed.buds[2]),
      0b10,
      'level 1 starts with the authored row',
    );
    await plantAll();
    let st = await state();
    assert.deepEqual([st.misses, st.hints], [0, 0]);
    await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers, { timeout: 15000 });
    // Level 9 (pre-K, between 2 and 3): level 3's corner gardens with the stripes on; a refused drop is free; planted by drags, one sticker.
    await launch('block-garden', 9);
    await idle();
    const stickers9 = await page.evaluate(() => kit.store.data.stickers.length);
    assert.ok(
      await page.evaluate(() => neo.scene.game.plan.tinted && neo.scene.game.garden.n === 6),
      'level 9 is a striped 6 by 6 garden',
    );
    const free = await refusedSpot();
    assert.ok(free, 'level 9 has a spot where a piece cannot fit');
    await dragTo(free.piece, free.r, free.c);
    await page.waitForTimeout(400);
    st = await state();
    assert.deepEqual(
      [st.misses, st.hints, st.used],
      [0, 0, 0],
      'a refused drop at 9 plants nothing and is never a miss',
    );
    await screenshot('block-garden-9');
    await plantAll();
    st = await state();
    assert.deepEqual([st.misses, st.hints], [0, 0]);
    await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers9, {
      timeout: 15000,
    });
    // Level 3: a drop over the bed where the piece cannot fit springs back as one miss; the second lights the hint once.
    await launch('block-garden', 3);
    await idle();
    for (let k = 1; k <= 2; k++) {
      const spot = await refusedSpot();
      assert.ok(spot, 'level 3 has a spot where a piece cannot fit');
      await dragTo(spot.piece, spot.r, spot.c);
      await page.waitForTimeout(400);
      st = await state();
      assert.equal(st.misses, k, `refused drop ${k} is a miss`);
      assert.equal(st.used, 0, 'a refused drop plants nothing');
    }
    assert.deepEqual([st.hints, st.hinted], [1, true], 'the second miss lights the hint once');
    const hinted = await page.evaluate(() => neo.scene.game.hinted);
    const before = (await state()).filled;
    await dragTo(hinted.piece, hinted.r, hinted.c);
    await page.waitForTimeout(700);
    await idle();
    st = await state();
    assert.notEqual(st.filled, before, 'the hinted piece is planted');
    assert.equal(st.misses, 2, 'planting is never a miss');
    if (
      !(await page.evaluate(() => neo.scene.game.index)) &&
      (await page.evaluate(() => neo.scene.game.history.length))
    ) {
      await page.evaluate(() => neo.scene.game.undoButton.press());
      await page.waitForTimeout(300);
      assert.equal((await state()).filled, before, 'the round arrow takes it back');
    }
    assert.deepEqual(errors, [], 'page errors');
    // Level 6 upright: two trays and the seed packets, one screenshot.
    await page.setViewportSize({ width: 768, height: 1024 });
    await launch('block-garden', 6);
    await idle();
    await page.waitForTimeout(500);
    await screenshot('block-garden-6-portrait');
    // A tap on a tall piece's slot (upright, the tray sits right under the bed) puts it back for free.
    const tall = await page.evaluate(async () => {
      const L = await import('/src/games/block-garden/logic.ts'),
        g = neo.scene.game;
      const s = g.slots.find((s) => s.piece !== null && L.SHAPES[g.garden.pieces[s.piece]].h >= 2);
      return s ? s.carrier.toGlobal({ x: 0, y: 0 }) : null;
    });
    if (tall) {
      const was = await state();
      await page.evaluate(({ x, y }) => kit.tap(x, y), { x: tall.x, y: tall.y });
      await page.waitForTimeout(500);
      const now = await state();
      assert.deepEqual([now.misses, now.used], [was.misses, was.used], 'a tap on a slot is never a miss');
    }
    // Level 5 upright in the autumn look: the look changes only the drawing; planted by drags, no misses or hints.
    await launch('block-garden', 5);
    await idle();
    const garden5 = await page.evaluate(() => {
      const g = neo.scene.game;
      g.look = 'autumn';
      g.resize(g.ctx.view);
      return g.state.bed.filled.join(',');
    });
    await page.waitForTimeout(300);
    await screenshot('block-garden-5-autumn-portrait');
    assert.equal((await state()).filled, garden5, 'the look leaves the garden alone');
    await plantAll();
    st = await state();
    assert.deepEqual([st.misses, st.hints], [0, 0]);
    assert.ok(
      await page.evaluate(() => neo.scene.game.basketPile.children.length > 0),
      'the buds she woke sit in the basket',
    );
    await page.setViewportSize({ width: 1024, height: 768 });
    // Level 8 (grown-up): the whole bed emptied by drags, no misses or hints, one more sticker.
    const stickers8 = await page.evaluate(() => kit.store.data.stickers.length);
    await launch('block-garden', 8);
    await idle();
    await plantAll();
    st = await state();
    assert.deepEqual([st.misses, st.hints], [0, 0]);
    await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers8, {
      timeout: 15000,
    });
    assert.deepEqual(errors, [], 'page errors');
    log(
      'Block Garden: levels 1, 9 and 8 planted by drags, a free refused drop at 9, refused drops at 3 (two misses, one hint), the hint planted, undo, level 6 upright, level 5 upright in autumn',
    );
  }

  return { blockGardenPlay };
}
