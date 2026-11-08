import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/**
 * Cut Along by touch: level 1 by taps, two strays at 3 (two misses, the glow), level 5's circle both ways round, level 7
 * upright in the garland with a star or moon, a wrong outline at 8, one stray on level 9's spirals upright, a wrong line and
 * a hint at 10 upright, and level 11 upright: a tap between shapes, a stray and a hint, one piece dropped off the picture
 * (it floats to the middle) and two placed where they were let go.
 * `CUT_LEVELS=9` (a comma list) plays only those levels.
 */
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
  const want = (l) => !process.env.CUT_LEVELS || process.env.CUT_LEVELS.split(',').map(Number).includes(l);
  let n = 0, st = null;
  const played = [];

  // Level 1: tap every mark on three strips; no misses or hints.
  if (want(1)) {
  await launch('cut-along', 1); await idle();
  n = await stickers();
  for (let guard = 0; guard < 20 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
    await idle();
    const p = await page.evaluate(() => { const g = neo.scene.game, i = g.marks.findIndex((_, k) => !g.snipped.has(k)); if (i < 0) return null; const m = g.marks[i]; return g.paper.toGlobal({ x: m.x * g.s, y: (1 - m.length / 2) * g.s }); });
    if (p) { await page.evaluate(({ x, y }) => kit.tap(x, y), p); await page.waitForTimeout(200); }
  }
  await sticker(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0], 'level 1 has no misses or hints');
  played.push('level 1 by taps');
  }

  const stray = async () => {
    const pts = await route(null, null);
    const before = await page.evaluate(() => neo.scene.game.active.progress);
    const off = [pts[1][0], pts[1][1] + 220];
    await page.evaluate(({ a, b, c }) => kit.drag([...kit.line(a, b, 6), ...kit.line(b, c, 8)]), { a: pts[0], b: pts[1], c: off });
    await page.waitForTimeout(200);
    return before;
  };
  // Level 3: cut a little, wander off (one miss, progress kept), wander again (the glow, one hint), then cut every strip.
  if (want(3)) {
  await launch('cut-along', 3); await idle();
  n = await stickers();
  await stray();
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 0], 'a stray is one miss');
  const kept = await page.evaluate(() => neo.scene.game.active.progress);
  assert.ok(kept > 0, 'progress is kept after a stray');
  await stray();
  st = await state(); assert.deepEqual([st.misses, st.hints, st.glow], [2, 1, true], 'the second stray lights the way, one hint');
  for (let guard = 0; guard < 8 && !(await page.evaluate(() => neo.scene.finished)); guard++) await cutActive();
  await sticker(n);
  played.push('two strays and the glow at 3');
  }

  // Level 5: the hill and the curve, then the circle counterclockwise (the bot's way); a second round's circle clockwise.
  for (const way of want(5) ? [0, 1] : []) {
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
    if (way) played.push('the level-5 circle both ways');
  }

  // Level 7 upright: relaunch until the garland holds a star or a moon, screenshot that sheet, then cut every shape.
  if (want(7)) {
  await page.setViewportSize({ width: 768, height: 1024 });
  const night = (p) => p === 'star' || p === 'moon';
  let pick = null;
  for (let tries = 0; tries < 30; tries++) {
    await launch('cut-along', 7); await idle();
    pick = await page.evaluate(() => { const g = neo.scene.game; return { theme: g.theme, pieces: g.cuts.map((c) => c.piece) }; });
    if (pick.theme === 'garland' && pick.pieces.some(night)) break;
  }
  assert.ok(pick.theme === 'garland' && pick.pieces.some(night), `a garland with a star or moon: ${JSON.stringify(pick)}`);
  n = await stickers();
  let shot = false;
  for (let guard = 0; guard < 6 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
    await idle();
    if (await done()) break;
    const piece = await page.evaluate(() => neo.scene.game.active?.cut.piece);
    if (!shot && night(piece)) { await page.waitForTimeout(400); await screenshot('cut-along-7-garland-portrait'); shot = true; }
    await cutActive();
  }
  await sticker(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0], 'level 7 cut cleanly');
  await page.setViewportSize({ width: 1024, height: 768 });
  played.push('a level-7 garland with a star or moon upright');
  }

  // Level 8: cut a fifth into a piece that does not fit (one miss, it closes again), then cut the fitting one on every board.
  if (want(8)) {
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
  played.push('a wrong outline at 8');
  }

  // Level 9 upright: the garden picture, one stray up the shell's lead-in (one miss, progress kept), then every spiral.
  if (want(9)) {
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('cut-along', 9); await idle();
  n = await stickers();
  const pieces = await page.evaluate(() => neo.scene.game.cuts.map((c) => c.piece));
  assert.deepEqual(pieces.slice(0, 2), ['shell', 'snake'], 'level 9 opens with the shell and the snake');
  await stray();
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 0], 'a stray on a spiral is one miss');
  assert.ok(await page.evaluate(() => neo.scene.game.active.progress) > 0, 'progress is kept after the stray');
  let shot = false;
  for (let guard = 0; guard < 8 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
    await idle();
    if (await done()) break;
    if (!shot && (await page.evaluate(() => neo.scene.game.index)) === 1) { await page.waitForTimeout(400); await screenshot('cut-along-9-garden-portrait'); shot = true; }
    await cutActive();
  }
  await sticker(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 0], 'level 9: one miss, no hint');
  await page.setViewportSize({ width: 1024, height: 768 });
  played.push(`level 9's spirals upright with one stray (${pieces.join(', ')})`);
  }
  // Level 10 upright: cut a fifth into a line that makes the wrong pair (one miss, both of its ends close), ask for the hint
  // (the working line glows, one hint), then cut the working line on every board, from its far end on the first.
  if (want(10)) {
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('cut-along', 10); await idle();
  n = await stickers();
  const wrong = await page.evaluate(() => 2 * (neo.scene.game.splits[0].fits === 0 ? 1 : 0));
  await dragAlong((await route(wrong, 0)).slice(0, 4));
  await idle();
  st = await state();
  assert.deepEqual([st.misses, st.hints], [1, 0], 'a wrong line is one miss');
  assert.deepEqual(await page.evaluate((w) => [neo.scene.game.tracks[w].progress, neo.scene.game.tracks[w + 1].progress], wrong), [0, 0], 'its slit closes up again');
  await page.evaluate(() => neo.scene.game.askForHint());
  st = await state(); assert.deepEqual([st.misses, st.hints, st.glow], [1, 1, true], 'the hint lights the working line');
  await page.waitForTimeout(400); await screenshot('cut-along-10-two-portrait');
  for (let guard = 0; guard < 6 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
    await idle();
    if (await done()) break;
    const fit = await page.evaluate(() => { const g = neo.scene.game; return 2 * g.splits[g.index].fits + (g.index === 0 ? 1 : 0); });
    await dragAlong(await route(fit, 0)); await page.waitForTimeout(150);
  }
  await sticker(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 1], 'level 10: one miss, one hint');
  await page.setViewportSize({ width: 1024, height: 768 });
  played.push('a wrong line and a hint at 10 upright');
  }
  // Level 11 upright: on each sheet a tap between the shapes chooses nothing (never a miss), then a tap chooses a shape (the
  // first, the second, the third); the first is strayed off (one miss) and the hint lit (one hint) before it is cut. The first
  // piece is let go off the picture and floats to its middle; the other two land where they were let go.
  if (want(11)) {
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('cut-along', 11); await idle();
  n = await stickers();
  const paperAt = (x, y) => page.evaluate(({ x, y }) => { const g = neo.scene.game, p = g.paper.toGlobal({ x: x * g.s, y: y * g.s }); return [p.x, p.y]; }, { x, y });
  const picAt = (x, y) => page.evaluate(({ x, y }) => { const g = neo.scene.game, pic = g.layout.picture, p = g.picture.toGlobal({ x: x * pic.w, y: y * pic.h }); return [p.x, p.y]; }, { x, y });
  const L = await page.evaluate(async () => { const L = await import('/src/games/cut-along/logic.ts'); return { xs: [...L.OWN_XS], y: L.OWN_Y }; });
  const drops = [null, [0.25, 0.3], [0.7, 0.62]];
  for (let k = 0; k < 3; k++) {
    await idle();
    assert.equal(await page.evaluate(() => neo.scene.game.choosing), true, `sheet ${k + 1} offers shapes`);
    if (k === 2) { await page.waitForTimeout(400); await screenshot('cut-along-11-own-portrait'); }
    const between = await paperAt((L.xs[0] + L.xs[1]) / 2, L.y);
    await page.evaluate(([x, y]) => kit.tap(x, y), between); await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => neo.scene.game.choosing), true, 'a tap between the shapes chooses nothing');
    const offered = await page.evaluate((k) => neo.scene.game.choices[k], k);
    await page.evaluate(([x, y]) => kit.tap(x, y), await paperAt(L.xs[k], L.y)); await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => neo.scene.game.active.cut.kind), offered[k], `the tapped shape (${offered[k]}) is the one to cut`);
    if (k === 0) {
      await stray();
      await page.evaluate(() => neo.scene.game.askForHint());
      st = await state(); assert.deepEqual([st.misses, st.hints, st.glow], [1, 1, true], 'a stray is one miss, the hint lights the stretch');
    }
    await cutActive(0);
    await page.waitForFunction(() => neo.scene.game.held?.handle.enabled, null, { timeout: 8000 });
    await page.waitForTimeout(300);
    const from = await page.evaluate(() => { const p = neo.scene.game.held.holder.getGlobalPosition(); return [p.x, p.y]; });
    // The piece rides 40 units above the finger, so the finger lets go 40 below where the piece should land.
    const target = drops[k] ? await picAt(...drops[k]) : await paperAt(0.2, 0.9);
    const scale = await page.evaluate(() => neo.scene.game.hand.worldTransform.a);
    await page.evaluate(({ a, b }) => kit.drag(kit.line(a, b, 14)), { a: from, b: [target[0], target[1] + 40 * scale] });
    await page.waitForFunction((k) => neo.scene.game.owned.length > k, k, { timeout: 8000 });
    const at = await page.evaluate((k) => neo.scene.game.owned[k], k);
    if (!drops[k]) assert.deepEqual([at.x, at.y], [0.5, 0.5], 'a piece let go off the picture floats to its middle');
    else assert.ok(Math.abs(at.x - drops[k][0]) < 0.06 && Math.abs(at.y - drops[k][1]) < 0.06, `piece ${k + 1} lands where it was let go (${at.x.toFixed(2)}, ${at.y.toFixed(2)})`);
  }
  await sticker(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 1], 'level 11: one miss, one hint');
  await page.setViewportSize({ width: 1024, height: 768 });
  played.push('level 11 upright: a tap between shapes, a stray and a hint, one drop off the picture and two placed');
  }
  assert.deepEqual(errors, [], 'page errors');
  log(`Cut Along: ${played.join('; ')}`);
}

return { cutAlongPlay };
}
