import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished, next }) {
/** Word Search by touch: both ends of the ladder, a wrong line, a crooked mark, a drag across a word, Hint, Start over, 64-unit targets upright and sideways, sliding to reach every square. */
async function wordSearchTouchPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, n: g.n, misses: g.misses, hints: g.hints, found: g.found.size, anchor: g.anchor, maxX: g.maxX, maxY: g.maxY, hinted: !!g.hinted, guesses: g.guesses }; });
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 15000 });
  /** Slide the grid with a real drag until a square is in view. */
  const slide = (i) => page.evaluate(async (i) => {
    const g = neo.scene.game;
    for (let guard = 0; guard < 4 && !g.inView(i); guard++) {
      const c = g.center(i), { x, y, w, h } = g.vp;
      const dx = Math.min(g.maxX, Math.max(0, c.x + 12 - w / 2)) - g.scrollX, dy = Math.min(g.maxY, Math.max(0, c.y + 12 - h / 2)) - g.scrollY;
      const a = g.touchLayer.toGlobal({ x: x + w / 2 + dx / 2, y: y + h / 2 + dy / 2 }), b = g.touchLayer.toGlobal({ x: x + w / 2 - dx / 2, y: y + h / 2 - dy / 2 });
      await kit.drag(kit.line([a.x, a.y], [b.x, b.y], 10));
      await kit.sleep(100);
    }
    if (!g.inView(i)) throw new Error(`square ${i} cannot be brought into view`);
  }, i);
  const tapCell = async (i) => { await slide(i); await page.evaluate((i) => { const g = neo.scene.game, p = g.board.toGlobal(g.center(i)); kit.tap(p.x, p.y); }, i); await page.waitForTimeout(140); };
  const tapButton = async (kind) => { await page.evaluate((kind) => { const g = neo.scene.game, k = g.slots.findIndex((s) => s.kind === kind), s = g.slots[k], p = g.buttonLayer.toGlobal({ x: s.x + s.w / 2, y: s.y + s.h / 2 }); kit.tap(p.x, p.y); }, kind); await page.waitForTimeout(250); };
  const solve = async () => {
    for (let guard = 0; guard < 60 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
      await idle();
      const next = await page.evaluate(async () => {
        const g = neo.scene.game, L = await import('/src/games/word-search/logic.ts'), k = g.grid.words.findIndex((_, i) => !g.found.has(i));
        if (k < 0) return null;
        const cells = L.cellsOfWord(g.n, g.grid.words[k]);
        return { first: cells[0], last: cells[cells.length - 1] };
      });
      if (!next) { await page.waitForTimeout(300); continue; }
      await tapCell(next.first); await tapCell(next.last);
    }
  };
  /** Every square and button at least 64 logical units, on screen, clear of the grid's window; every square reachable by sliding. */
  const targets = (label) => page.evaluate(async (label) => {
    const g = neo.scene.game, out = [], V = neo.view, vp = g.vp;
    if (g.cell < 64) out.push(`cell ${g.cell}`);
    if (vp.x < 0 || vp.y < 0 || vp.x + vp.w > V.w || vp.y + vp.h > V.h) out.push('window off screen');
    for (const s of g.slots) {
      if (s.w < 64 || s.h < 64) out.push(`${s.kind} small ${s.w}x${s.h}`);
      if (s.x < 0 || s.y < 0 || s.x + s.w > V.w || s.y + s.h > V.h) out.push(`${s.kind} off screen`);
      if (s.x < vp.x + vp.w && vp.x < s.x + s.w && s.y < vp.y + vp.h && vp.y < s.y + s.h) out.push(`${s.kind} over the grid`);
    }
    const [a, b] = g.slots; if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) out.push('buttons overlap');
    for (const i of [0, g.n - 1, g.n * (g.n - 1), g.n * g.n - 1]) {
      const c = g.center(i), x = c.x + 12 - vp.w / 2, y = c.y + 12 - vp.h / 2;
      g.setScroll(g.maxX > 0 ? x : 0, g.maxY > 0 ? y : 0);
      if (!g.inView(i, 0)) out.push(`corner ${i} cannot be brought into view`);
    }
    g.setScroll(0, 0);
    return out.map((m) => `${label}: ${m} (${V.w}x${V.h}, scale ${V.scale})`);
  }, label);
  // Level 1 (8 by 8, all in view): a wrong line counts, a crooked mark costs nothing, a drag across a word finds it, one hint, start over.
  await launch('word-search', 1); await idle();
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  let st = await state();
  assert.equal(st.n, 8); assert.equal(st.maxX + (await state()).maxY, 0, 'an 8 by 8 grid is all in view');
  assert.deepEqual(await targets('level 1 landscape'), []);
  await tapCell(0); await tapCell(1); st = await state();
  assert.equal(st.misses, 1, 'a wrong line is one miss'); assert.equal(st.anchor, null);
  await tapCell(0); await tapCell(10); st = await state(); // 0 to row 1, column 2: not a straight line
  assert.equal(st.misses, 1, 'a crooked mark costs nothing'); assert.equal(st.anchor, 10, 'the first letter moves to the new square');
  await tapCell(10); st = await state(); assert.equal(st.anchor, null, 'the same letter lets go');
  await tapButton('hint'); st = await state();
  assert.deepEqual([st.hints, st.hinted], [1, true]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 1 portrait'), []);
  await screenshot('wordsearch-touch-1-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  const drag = await page.evaluate(async () => {
    const g = neo.scene.game, L = await import('/src/games/word-search/logic.ts'), k = g.grid.words.findIndex((_, i) => !g.found.has(i)), cells = L.cellsOfWord(g.n, g.grid.words[k]);
    const a = g.board.toGlobal(g.center(cells[0])), b = g.board.toGlobal(g.center(cells[cells.length - 1]));
    await kit.drag(kit.line([a.x, a.y], [b.x, b.y], 8)); await kit.sleep(300);
    return { found: g.found.has(k), count: g.found.size };
  });
  assert.deepEqual(drag, { found: true, count: 1 }, 'a drag from the first letter to the last finds the word');
  await tapButton('again'); await page.waitForTimeout(300);
  assert.equal((await state()).found, 0, 'start over clears the words found');
  await solve(); await finished('word-search');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('word-search').history.at(-1); return [r.misses, r.hints]; }), [1, 1]);
  // Level 4 (14 by 14): the grid slides, every square can be reached, solved by touch with no help.
  await launch('word-search', 4); await idle();
  st = await state(); assert.equal(st.n, 14); assert.ok(st.maxX > 0 && st.maxY > 0, 'a 14 by 14 grid slides');
  assert.deepEqual(await targets('level 4 landscape'), []);
  await screenshot('wordsearch-touch-4-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 4 portrait'), []);
  await screenshot('wordsearch-touch-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  // A hint brings its letter into view.
  await tapCell(14 * 14 - 1); await tapCell(14 * 14 - 1);
  await page.evaluate(() => neo.scene.game.setScroll(0, 0));
  await tapButton('hint');
  assert.ok(await page.evaluate(() => { const g = neo.scene.game; return g.hinted && g.inView(g.hinted.cell, 0); }), 'the hinted letter is in view');
  await page.evaluate(() => neo.scene.game.restart()); await page.waitForTimeout(200);
  await solve(); await finished('word-search');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('word-search').history.at(-1); return [r.misses]; }), [0]);
  // From Lantern Lake it plays here, by touch, and leaving mid-round is quiet.
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; neo.go.land('lantern-lake'); }); await scene('LandScene');
  await page.evaluate(() => neo.go.game('word-search', 'grownup', undefined, false, { land: 'lantern-lake' })); await scene('GameScene'); await idle();
  await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene'); await page.waitForTimeout(500);
  assert.deepEqual(errors, []);
  log('Word Search touch: first and last level, wrong line, crooked mark, drag across a word, hint, start over, sliding to every square, 64-unit targets upright and sideways, one sticker each passed');
}

return { wordSearchTouchPlay };
}
