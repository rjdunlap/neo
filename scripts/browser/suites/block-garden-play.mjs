import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Block Garden by touch: levels 1 and 8 planted by drags along the solver's way, two refused drops at 3 (two misses, one hint), undo, level 6 upright. */
async function blockGardenPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, misses: g.misses, hints: g.hints, hinted: !!g.hinted, index: g.index, filled: g.state.bed.filled.join(','), used: g.state.used }; });
  const idle = () => page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, { timeout: 15000 });
  /** Drag the piece in slot order `piece` so its shadow lands with its top-left square at (r, c) (or anywhere over the bed point given). */
  const dragTo = async (piece, r, c) => {
    const pts = await page.evaluate(({ piece, r, c }) => {
      const g = neo.scene.game, slot = g.slots.find((s) => s.piece === piece);
      const L = g.garden.pieces[piece];
      return { a: slot.carrier.toGlobal({ x: 0, y: 0 }), id: L, piece };
    }, { piece, r, c });
    const target = await page.evaluate(async ({ piece, r, c }) => {
      const { SHAPES } = await import('/src/games/block-garden/logic.ts');
      const g = neo.scene.game, s = SHAPES[g.garden.pieces[piece]], lay = g.lay;
      const lift = g.liftFor(piece);
      return g.root.toGlobal({ x: lay.x + (c + s.w / 2) * lay.cell, y: lay.y + (r + s.h / 2) * lay.cell + lift });
    }, { piece, r, c });
    await page.evaluate(({ a, b }) => kit.drag(kit.line([a.x, a.y], [b.x, b.y], 16)), { a: pts.a, b: target });
    await page.waitForTimeout(250);
  };
  const plantAll = async () => {
    for (let guard = 0; guard < 60 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
      await idle();
      if (await page.evaluate(() => neo.scene.finished)) break;
      const p = await page.evaluate(async () => {
        const L = await import('/src/games/block-garden/logic.ts'), g = neo.scene.game;
        if (g.busy) return null;
        const h = L.hintPlacement(g.garden, g.state, g.history);
        return h.kind === 'plan' ? h.placement : null;
      });
      if (!p) { await page.waitForTimeout(250); continue; }
      await dragTo(p.piece, p.r, p.c); await page.waitForTimeout(500);
    }
    await page.waitForFunction(() => neo.scene.finished, null, { timeout: 20000 });
  };
  // Level 1: the authored row first; planted by drags, no misses or hints, one sticker.
  await launch('block-garden', 1); await idle();
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  assert.equal(await page.evaluate(() => neo.scene.game.state.bed.buds[2]), 0b10, 'level 1 starts with the authored row');
  await plantAll();
  let st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0]);
  await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers, { timeout: 15000 });
  // Level 3: a drop over the bed where the piece cannot fit springs back as one miss; the second lights the hint once.
  await launch('block-garden', 3); await idle();
  const refusedSpot = () => page.evaluate(async () => {
    const L = await import('/src/games/block-garden/logic.ts'), g = neo.scene.game, lay = g.lay;
    for (const piece of L.trayNow(g.garden, g.state.used)) {
      const id = g.garden.pieces[piece], s = L.SHAPES[id];
      for (let r = 0; r + s.h <= lay.n; r++) for (let c = 0; c + s.w <= lay.n; c++) {
        if (!L.nearestAnchor(g.state.bed, id, lay.x + c * lay.cell, lay.y + r * lay.cell, lay)) return { piece, r, c };
      }
    }
    return null;
  });
  for (let k = 1; k <= 2; k++) {
    const spot = await refusedSpot();
    assert.ok(spot, 'level 3 has a spot where a piece cannot fit');
    await dragTo(spot.piece, spot.r, spot.c); await page.waitForTimeout(400);
    st = await state(); assert.equal(st.misses, k, `refused drop ${k} is a miss`);
    assert.equal(st.used, 0, 'a refused drop plants nothing');
  }
  assert.deepEqual([st.hints, st.hinted], [1, true], 'the second miss lights the hint once');
  const hinted = await page.evaluate(() => neo.scene.game.hinted);
  const before = (await state()).filled;
  await dragTo(hinted.piece, hinted.r, hinted.c); await page.waitForTimeout(700); await idle();
  st = await state(); assert.notEqual(st.filled, before, 'the hinted piece is planted'); assert.equal(st.misses, 2, 'planting is never a miss');
  if (!(await page.evaluate(() => neo.scene.game.index)) && (await page.evaluate(() => neo.scene.game.history.length))) {
    await page.evaluate(() => neo.scene.game.undoButton.press()); await page.waitForTimeout(300);
    assert.equal((await state()).filled, before, 'the round arrow takes it back');
  }
  assert.deepEqual(errors, [], 'page errors');
  // Level 6 upright: two trays and the seed packets, one screenshot.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('block-garden', 6); await idle(); await page.waitForTimeout(500);
  await screenshot('block-garden-6-portrait');
  // A tap on a tall piece's slot (upright, the tray sits right under the bed) puts it back for free.
  const tall = await page.evaluate(async () => { const L = await import('/src/games/block-garden/logic.ts'), g = neo.scene.game; const s = g.slots.find((s) => s.piece !== null && L.SHAPES[g.garden.pieces[s.piece]].h >= 2); return s ? s.carrier.toGlobal({ x: 0, y: 0 }) : null; });
  if (tall) {
    const was = await state();
    await page.evaluate(({ x, y }) => kit.tap(x, y), { x: tall.x, y: tall.y }); await page.waitForTimeout(500);
    const now = await state(); assert.deepEqual([now.misses, now.used], [was.misses, was.used], 'a tap on a slot is never a miss');
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  // Level 8 (grown-up): the whole bed emptied by drags, no misses or hints, one more sticker.
  const stickers8 = await page.evaluate(() => kit.store.data.stickers.length);
  await launch('block-garden', 8); await idle();
  await plantAll();
  st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0]);
  await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers8, { timeout: 15000 });
  assert.deepEqual(errors, [], 'page errors');
  log('Block Garden: levels 1 and 8 planted by drags, refused drops at 3 (two misses, one hint), the hint planted, undo, level 6 upright');
}

return { blockGardenPlay };
}
