import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Fruit Slice by touch: level 1 by taps, two wrong-kind swipes at 3 (two misses, one glow), level 7's boards by straight lines (portrait screenshot), level 8 by swipes, the bowl and the pair board. */
async function fruitSlicePlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { misses: g.misses, hints: g.hints, glow: g.glow?.kind ?? null, index: g.index }; });
  const idle = () => page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, { timeout: 15000 });
  /** Wait for a hanging fruit that is right (or wrong) now; returns its place on screen. */
  const hanging = async (right) => {
    await page.evaluate(async () => { window.FS = await import('/src/games/fruit-slice/logic.ts'); });
    const h = await page.waitForFunction((right) => {
      const L = window.FS, g = neo.scene.game;
      if (neo.scene.finished || (g && L.met(g.current))) return 'done';
      if (!g || g.busy) return null;
      const f = g.flyers.find((q) => !q.gone && q.t > L.RISE + 0.15 && q.t < L.RISE + L.HANG - 0.6 && g.rightNow(q.toss.kind) === right);
      return f ? g.ctx.stage.toGlobal({ x: f.node.x, y: f.node.y }) : null;
    }, right, { timeout: 20000, polling: 50 });
    return h.jsonValue();
  };
  const swipe = async (p) => {
    if (p === 'done') return;
    const s = await page.evaluate(() => neo.scene.game.ctx.stage.worldTransform.a);
    await page.evaluate(({ p, d }) => kit.drag(kit.line([p.x - d, p.y], [p.x + d, p.y], 10)), { p, d: 100 * s });
    await page.waitForTimeout(150);
  };
  const tapBowl = async () => {
    await page.evaluate(async () => { window.FS = await import('/src/games/fruit-slice/logic.ts'); });
    await page.waitForFunction(() => { const g = neo.scene.game; return !g.busy && window.FS.met(g.current); }, null, { timeout: 15000 });
    const p = await page.evaluate(() => neo.scene.game.bowl.toGlobal({ x: 0, y: -10 }));
    await page.evaluate(({ x, y }) => kit.tap(x, y), p); await page.waitForTimeout(300);
  };
  const drawSolution = async () => {
    await idle();
    const l = await page.evaluate(() => { const g = neo.scene.game, l = g.solution(); const st = g.ctx.stage; return { a: st.toGlobal(g.boardPoint(l.a)), b: st.toGlobal(g.boardPoint(l.b)) }; });
    await page.evaluate(({ a, b }) => kit.drag(kit.line([a.x, a.y], [b.x, b.y], 14)), l);
    await page.waitForTimeout(400);
  };
  const sticker = async (n) => page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 20000 });

  // Level 1: a tap on each fruit slices it; no misses or hints; one sticker.
  await launch('fruit-slice', 1); await idle();
  let n = await page.evaluate(() => kit.store.data.stickers.length);
  for (let guard = 0; guard < 12 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
    const p = await hanging(true);
    if (p === 'done') break;
    await page.evaluate(({ x, y }) => kit.tap(x, y), p); await page.waitForTimeout(250);
  }
  let st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0], 'level 1 has no misses or hints');
  await sticker(n);

  // Level 3: two swipes through the wrong kind bounce (two misses) and the second lights the glow (one hint); then the right ones.
  await launch('fruit-slice', 3); await idle();
  n = await page.evaluate(() => kit.store.data.stickers.length);
  await swipe(await hanging(false));
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 0], 'a wrong-kind swipe is one miss');
  await swipe(await hanging(false));
  st = await state(); assert.deepEqual([st.misses, st.hints, st.glow], [2, 1, 'fruit'], 'the second miss glows the next right one, one hint');
  for (let guard = 0; guard < 14 && !(await page.evaluate(() => neo.scene.finished)); guard++) await swipe(await hanging(true));
  await sticker(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [2, 1]);

  // Level 7 upright: four boards, each solved by one straight line; one screenshot of the first board.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('fruit-slice', 7); await idle(); await page.waitForTimeout(500);
  await screenshot('fruit-slice-7-portrait');
  n = await page.evaluate(() => kit.store.data.stickers.length);
  for (let guard = 0; guard < 8 && !(await page.evaluate(() => neo.scene.finished)); guard++) await drawSolution();
  await sticker(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0], 'level 7 solved by the hint lines');
  await page.setViewportSize({ width: 1024, height: 768 });

  // Level 8: two signs by swipes and the bowl, then the pair board by straight lines and the bowl.
  await launch('fruit-slice', 8); await idle();
  n = await page.evaluate(() => kit.store.data.stickers.length);
  for (let sign = 0; sign < 2; sign++) {
    for (let guard = 0; guard < 10; guard++) {
      if (await page.evaluate(async () => { const L = await import('/src/games/fruit-slice/logic.ts'); return L.met(neo.scene.game.current); })) break;
      await swipe(await hanging(true));
    }
    await tapBowl(); await idle();
  }
  assert.equal(await page.evaluate(() => neo.scene.game.current.board), true, 'the last sign is a still board');
  for (let guard = 0; guard < 8; guard++) {
    if (await page.evaluate(async () => { const L = await import('/src/games/fruit-slice/logic.ts'); return L.met(neo.scene.game.current); })) break;
    await drawSolution();
  }
  await tapBowl();
  await sticker(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0], 'level 8 with no misses');
  assert.deepEqual(errors, [], 'page errors');
  log('Fruit Slice: level 1 by taps, two wrong-kind swipes and a glow at 3, level 7 by lines (upright), level 8 by swipes, the bowl and the pair board');
}

return { fruitSlicePlay };
}
