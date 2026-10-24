import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Draw the Pattern by touch: level 1 by marks, two strays at 3 (a miss, then the glow), level 4's circle both ways, a level 5 portrait screenshot, a wrong candidate at 8. */
async function drawPatternPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { misses: g.misses, hints: g.hints, glow: g.glow, index: g.index }; });
  const idle = () => page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, { timeout: 25000 });
  const sticker = (n) => page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });
  const stickers = () => page.evaluate(() => kit.store.data.stickers.length);
  /** Screen points along the stroke she is on, from where the crayon waits: way `order` (the chosen or continuing one by default). */
  const route = (order = null) => page.evaluate(async (order) => {
    const L = await import('/src/games/draw-the-pattern/logic.ts');
    const g = neo.scene.game, t = g.tracks[g.cur];
    const o = order ?? t.stroke.right ?? t.order ?? 0;
    const from = t.order === o || t.order === null ? t.progress : 0;
    return L.botRoute(t.stroke, t.stroke.orders[o], from).map((p) => g.paper.toGlobal({ x: p[0] * g.s, y: p[1] * g.s })).map((p) => [p.x, p.y]);
  }, order);
  const dragAlong = (pts) => page.evaluate((pts) => {
    const path = [];
    for (let i = 1; i < pts.length; i++) path.push(...kit.line(pts[i - 1], pts[i], 6));
    return kit.drag(path);
  }, pts);
  const done = () => page.evaluate(() => neo.scene.finished || neo.scene.game.finished);
  const drawOn = async (order = null) => { await idle(); if (await done()) return; await dragAlong(await route(order)); await page.waitForTimeout(150); };
  const finishRound = async (n) => {
    for (let guard = 0; guard < 16 && !(await page.evaluate(() => neo.scene.finished)); guard++) await drawOn();
    await sticker(n);
  };

  // Level 1: four marks on each of three strips (a pat counts too); no misses or hints.
  await launch('draw-the-pattern', 1); await idle();
  let n = await stickers();
  for (let guard = 0; guard < 20 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
    await idle();
    if (await done()) break;
    const pts = await page.evaluate((k) => { const g = neo.scene.game; return [0.5 + (k % 4) * 0.7, 0.9 + (k % 4) * 0.7].map((x, i) => g.paper.toGlobal({ x: x * g.s, y: (0.3 + i * 0.3) * g.s })).map((p) => [p.x, p.y]); }, guard);
    if (guard % 4 === 3) await page.evaluate(([a]) => kit.tap(a[0], a[1]), pts);
    else await dragAlong(pts);
    await page.waitForTimeout(150);
  }
  await sticker(n);
  let st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0], 'level 1 has no misses or hints');

  // Level 3: draw a little, wander off (one miss, progress kept), wander again (the glow, one hint), then finish.
  await launch('draw-the-pattern', 3); await idle();
  n = await stickers();
  const stray = async () => {
    const pts = await route();
    const off = [pts[1][0], pts[1][1] + 260];
    await page.evaluate(({ a, b, c }) => kit.drag([...kit.line(a, b, 6), ...kit.line(b, c, 8)]), { a: pts[0], b: pts[1], c: off });
    await page.waitForTimeout(200);
  };
  const lead = await page.evaluate(() => neo.scene.game.tracks[0].stroke.lead);
  await stray();
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 0], 'a stray is one miss');
  assert.ok(await page.evaluate((lead) => neo.scene.game.tracks[0].progress > lead, lead), 'progress is kept after a stray');
  await stray();
  st = await state(); assert.deepEqual([st.misses, st.hints, st.glow], [2, 1, true], 'the second stray lights the way, one hint');
  await finishRound(n);

  // Level 4: the circle counterclockwise (the bot's way), then another round's circle clockwise by a kit drag.
  for (const way of [0, 1]) {
    await launch('draw-the-pattern', 4); await idle();
    n = await stickers();
    await drawOn(way);
    assert.equal(await page.evaluate(() => neo.scene.game.tracks[0].order), way, `the circle went ${way ? 'clockwise' : 'counterclockwise'}`);
    await finishRound(n);
  }

  // Level 5 upright: one screenshot once the dashes have faded.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('draw-the-pattern', 5); await idle(); await page.waitForTimeout(400);
  await screenshot('draw-the-pattern-5-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });

  // Level 8: draw the candidate that breaks the pattern past its divergence (one miss, the rule), then finish.
  await launch('draw-the-pattern', 8); await idle();
  n = await stickers();
  const wrong = await page.evaluate(() => { const t = neo.scene.game.tracks[0]; return 1 - t.stroke.right; });
  await dragAlong(await route(wrong));
  await idle();
  st = await state();
  assert.equal(st.misses, 1, 'a wrong candidate is one miss');
  assert.equal(await page.evaluate(() => neo.scene.game.tracks[0].progress), 0, 'her wrong stroke fades');
  await finishRound(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 0]);
  assert.deepEqual(errors, [], 'page errors');
  log('Draw the Pattern: level 1 by marks, two strays and the glow at 3, the level-4 circle both ways, level 5 upright, a wrong candidate at 8');
}

return { drawPatternPlay };
}
