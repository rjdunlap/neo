import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Sudoku Garden by touch: both ends of the ladder, a wrong number, Marks, Erase, a hint, targets of at least 64 units upright and sideways. */
async function jarSortPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, misses: g.misses, hints: g.hints, lifted: g.lifted, hinted: !!g.hinted, board: g.board.map((j) => j.join('')).join('|'), index: g.index }; });
  const idle = () => page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, { timeout: 15000 });
  const jarPoint = (i) => page.evaluate((i) => { const j = neo.scene.game.jars[i]; return j.carrier.toGlobal({ x: 0, y: -j.spot.hit.h / 2 }); }, i);
  const tapJar = async (i) => { const p = await jarPoint(i); await page.evaluate(({ x, y }) => kit.tap(x, y), p); await page.waitForTimeout(160); };
  /** Plays the solver's way out by taps until the round ends. */
  const solveAll = async () => {
    for (let guard = 0; guard < 200 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
      await idle();
      if (await page.evaluate(() => neo.scene.finished)) break;
      const m = await page.evaluate(async () => { const L = await import('/src/games/jar-sort/logic.ts'), g = neo.scene.game; return g.busy ? null : L.solve(g.board, g.plan.cap, g.labels)?.[0] ?? null; });
      if (!m) { await page.waitForTimeout(250); continue; }
      await tapJar(m.from); await tapJar(m.to); await page.waitForTimeout(450);
    }
    await page.waitForFunction(() => neo.scene.finished, null, { timeout: 20000 });
  };
  /** A move that is refused (a different kind on top, or full), from a jar with something to lift. */
  const refusedPair = () => page.evaluate(async () => {
    const L = await import('/src/games/jar-sort/logic.ts'), g = neo.scene.game;
    for (let f = 0; f < g.board.length; f++) for (let t = 0; t < g.board.length; t++) if (L.refusal(g.board, g.plan.cap, f, t)) return { from: f, to: t };
    return null;
  });
  // Level 1: two authored boards; a refused move under lit jars is free; a tap on the ground sets a lifted fruit back.
  await launch('jar-sort', 1); await idle();
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  let st = await state();
  assert.equal(st.board, '01|1|0', 'level 1 starts with the authored two-move board');
  await tapJar(0);
  assert.equal((await state()).lifted, 0, 'a tap lifts the top fruit');
  await page.evaluate(() => kit.tap(neo.view.w / 2 * neo.view.scale, (neo.view.h - 30) * neo.view.scale)); await page.waitForTimeout(200);
  assert.equal((await state()).lifted, null, 'a tap on the ground sets it back');
  await tapJar(0); await tapJar(2); await page.waitForTimeout(400);
  st = await state(); assert.deepEqual([st.misses, st.board], [0, '01|1|0'], 'a refused move at level 1 is free and changes nothing');
  await solveAll();
  st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0]);
  await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers, { timeout: 15000 });
  // Level 3: a refused move is one miss; the second lights the hint once; a drag moves a fruit like two taps; undo takes it back.
  await launch('jar-sort', 3); await idle();
  for (let k = 1; k <= 2; k++) {
    const pair = await refusedPair();
    assert.ok(pair, 'level 3 has a refused move to try');
    await tapJar(pair.from); await tapJar(pair.to); await page.waitForTimeout(400);
    st = await state(); assert.equal(st.misses, k, `refused move ${k} is a miss`);
  }
  assert.deepEqual([st.hints, st.hinted], [1, true], 'the second miss lights the hint move once');
  const legalMove = await page.evaluate(async () => { const L = await import('/src/games/jar-sort/logic.ts'), g = neo.scene.game; return L.moves(g.board, g.plan.cap)[0]; });
  const before = (await state()).board;
  const a = await jarPoint(legalMove.from), b = await jarPoint(legalMove.to);
  await page.evaluate(({ a, b }) => kit.drag(kit.line([a.x, a.y], [b.x, b.y + 40 * neo.view.scale], 14)), { a, b }); await page.waitForTimeout(600); await idle();
  st = await state(); assert.notEqual(st.board, before, 'a drag from jar to jar moves the fruit'); assert.equal(st.misses, 2, 'a legal move is never a miss');
  await page.evaluate(() => neo.scene.game.undoButton.press()); await page.waitForTimeout(300);
  assert.equal((await state()).board, before, 'the round arrow takes it back');
  assert.deepEqual(errors, [], 'page errors');
  // Level 7 upright: seven jars in two rows, one screenshot.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('jar-sort', 7); await idle(); await page.waitForTimeout(400);
  await screenshot('jar-sort-7-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  // Level 8: mats; solved by taps, no misses or hints, one more sticker.
  const stickers8 = await page.evaluate(() => kit.store.data.stickers.length);
  await launch('jar-sort', 8); await idle();
  assert.equal(await page.evaluate(() => neo.scene.game.labels.filter((k) => k !== null).length), 4, 'four jars stand on mats');
  await solveAll();
  st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0]);
  await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers8, { timeout: 15000 });
  assert.deepEqual(errors, [], 'page errors');
  log('Jar Sort: levels 1 and 8 solved by taps, refused moves (free at 1, misses at 3), a hint, a drag, undo, level 7 upright');
}

return { jarSortPlay };
}
