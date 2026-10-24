import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Cut Along by touch: level 1 by taps, two strays at 3 (two misses, the glow), level 5's circle both ways round, a level 6 portrait screenshot, a wrong outline at 8. */
async function cutAlongPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { misses: g.misses, hints: g.hints, glow: g.glow, index: g.index }; });
  const idle = () => page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, { timeout: 20000 });
  const sticker = (n) => page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });
  const stickers = () => page.evaluate(() => kit.store.data.stickers.length);
  /** Screen points along a cut from where the scissors wait: track `which` (the active one by default), way round `order`. */
  const route = (which, order) => page.evaluate(async ({ which, order }) => {
    const L = await import('/src/games/cut-along/logic.ts');
    const g = neo.scene.game, t = which === null ? g.active : g.tracks[which];
    const pts = order === null ? L.pathOf(t.cut, t.order) : t.cut.orders[order];
    return L.botRoute(t.cut, pts, t.progress).map((p) => g.paper.toGlobal({ x: p[0] * g.s, y: p[1] * g.s })).map((p) => [p.x, p.y]);
  }, { which, order });
  const dragAlong = (pts) => page.evaluate((pts) => {
    const path = [];
    for (let i = 1; i < pts.length; i++) path.push(...kit.line(pts[i - 1], pts[i], 6));
    return kit.drag(path);
  }, pts);
  const done = () => page.evaluate(() => neo.scene.finished || neo.scene.game.finished);
  const cutActive = async (order = null) => { await idle(); if (await done()) return; await dragAlong(await route(null, order)); await page.waitForTimeout(150); };

  // Level 1: tap every mark on three strips; no misses or hints.
  await launch('cut-along', 1); await idle();
  let n = await stickers();
  for (let guard = 0; guard < 20 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
    await idle();
    const p = await page.evaluate(() => { const g = neo.scene.game, i = g.marks.findIndex((_, k) => !g.snipped.has(k)); if (i < 0) return null; const m = g.marks[i]; return g.paper.toGlobal({ x: m.x * g.s, y: (1 - m.length / 2) * g.s }); });
    if (p) { await page.evaluate(({ x, y }) => kit.tap(x, y), p); await page.waitForTimeout(200); }
  }
  await sticker(n);
  let st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0], 'level 1 has no misses or hints');

  // Level 3: cut a little, wander off (one miss, progress kept), wander again (the glow, one hint), then cut every strip.
  await launch('cut-along', 3); await idle();
  n = await stickers();
  const stray = async () => {
    const pts = await route(null, null);
    const before = await page.evaluate(() => neo.scene.game.active.progress);
    const off = [pts[1][0], pts[1][1] + 220];
    await page.evaluate(({ a, b, c }) => kit.drag([...kit.line(a, b, 6), ...kit.line(b, c, 8)]), { a: pts[0], b: pts[1], c: off });
    await page.waitForTimeout(200);
    return before;
  };
  await stray();
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 0], 'a stray is one miss');
  const kept = await page.evaluate(() => neo.scene.game.active.progress);
  assert.ok(kept > 0, 'progress is kept after a stray');
  await stray();
  st = await state(); assert.deepEqual([st.misses, st.hints, st.glow], [2, 1, true], 'the second stray lights the way, one hint');
  for (let guard = 0; guard < 8 && !(await page.evaluate(() => neo.scene.finished)); guard++) await cutActive();
  await sticker(n);

  // Level 5: the hill and the curve, then the circle counterclockwise (the bot's way); a second round's circle clockwise.
  for (const way of [0, 1]) {
    await launch('cut-along', 5); await idle();
    n = await stickers();
    for (let guard = 0; guard < 6 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
      await idle();
      if (await done()) break;
      const closed = await page.evaluate(() => neo.scene.game.active?.cut.closed);
      await cutActive(closed ? way : null);
      if (closed) assert.equal(await page.evaluate(() => neo.scene.game.tracks[0].order), way, `the circle went ${way ? 'clockwise' : 'counterclockwise'}`);
    }
    await sticker(n);
  }

  // Level 6 upright: one screenshot of the first sheet.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('cut-along', 6); await idle(); await page.waitForTimeout(500);
  await screenshot('cut-along-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });

  // Level 8: cut a fifth into a piece that does not fit (one miss, it closes again), then cut the fitting one on every board.
  await launch('cut-along', 8); await idle();
  n = await stickers();
  const wrong = await page.evaluate(() => neo.scene.game.boards[0].fits === 0 ? 1 : 0);
  await dragAlong((await route(wrong, 0)).slice(0, 6));
  await idle();
  st = await state();
  assert.equal(st.misses, 1, 'a wrong outline is one miss');
  assert.equal(await page.evaluate((w) => neo.scene.game.tracks[w].progress, wrong), 0, 'its slit closes up again');
  for (let guard = 0; guard < 6 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
    await idle();
    if (await done()) break;
    const fit = await page.evaluate(() => neo.scene.game.boards[neo.scene.game.index].fits);
    if (fit === null) break;
    await dragAlong(await route(fit, 0)); await page.waitForTimeout(150);
  }
  await sticker(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 0]);
  assert.deepEqual(errors, [], 'page errors');
  log('Cut Along: level 1 by taps, two strays and the glow at 3, the level-5 circle both ways, level 6 upright, a wrong outline at 8');
}

return { cutAlongPlay };
}
