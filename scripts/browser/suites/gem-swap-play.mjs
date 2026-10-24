import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, turnToGame, launch, finished, next }) {
/** Gem Swap: real taps, gentle rejected swaps, solver help, revision, both ends and one reward. */
async function gemSwapPlay() {
  const state = () => page.evaluate(() => {
    const g = neo.scene.game;
    return { board: g.board, selected: g.selected, hinted: g.hinted, misses: g.misses, hints: g.hints, presses: g.presses, busy: g.busy, par: g.puzzle.par };
  });
  const tapCell = async i => { await page.evaluate(i => kit.tapOn(neo.scene.game.nodes[i]), i); await page.waitForTimeout(130); };
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.game.finished);
  const next = () => page.evaluate(async () => {
    const g = neo.scene.game, L = await import('/src/games/gem-swap/logic.ts');
    return L.hintFor(g.board, g.puzzle.size);
  });
  for (const level of [1, 4]) {
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await launch('gem-swap', level); await page.waitForTimeout(400);
    const initial = await state();
    const invalid = await page.evaluate(async () => {
      const g = neo.scene.game, L = await import('/src/games/gem-swap/logic.ts'), n = g.puzzle.size;
      for (let a = 0; a < g.board.length; a++) for (const b of [a + 1, a + n]) {
        if (L.neighbors(a, b, n) && g.board[a] >= 0 && g.board[b] >= 0 && !L.swap(g.board, n, [a, b])) return [a, b];
      }
      throw new Error('no rejected swap to exercise');
    });
    for (let attempt = 0; attempt < 2; attempt++) { await tapCell(invalid[0]); await tapCell(invalid[1]); }
    let s = await state();
    assert.deepEqual(s.board, initial.board); assert.equal(s.misses, 2); assert.equal(s.hints, 1); assert.ok(s.hinted);
    await tap('neo.scene.game.hintButton'); assert.equal((await state()).hints, 1, 'same hint is not counted twice');
    await tapCell(s.hinted[0]); assert.equal((await state()).selected, s.hinted[0]);
    await tapCell(s.hinted[0]); assert.equal((await state()).selected, null, 'tap again cancels');
    if (level === 4) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(250);
      const geometry = await page.evaluate(() => neo.scene.game.nodes.map(n => {
        const p = n.toGlobal({ x: n.hitArea.x, y: n.hitArea.y });
        return { x: p.x / neo.view.scale, y: p.y / neo.view.scale, w: n.hitArea.width, h: n.hitArea.height };
      }));
      const view = await page.evaluate(() => ({ w: neo.view.w, h: neo.view.h }));
      for (const r of geometry) { assert.ok(r.w >= 64 && r.h >= 64); assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w + 1 && r.y + r.h <= view.h + 1); }
      await screenshot('gem-swap-4-portrait');
      const pair = await next(); await tapCell(pair[0]); await tapCell(pair[1]); await idle();
      assert.equal((await state()).presses, 1);
      await tap('neo.scene.game.undoButton');
      assert.deepEqual((await state()).board, initial.board); assert.equal((await state()).presses, 1, 'Undo never reduces the score');
      await tap('neo.scene.game.restartButton');
      assert.deepEqual((await state()).board, initial.board); assert.equal((await state()).hints, 2);
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(250);
    }
    for (let i = 0; i < 10 && !(await page.evaluate(() => neo.scene.game.finished)); i++) {
      const pair = await next(); assert.ok(pair); await tapCell(pair[0]); await tapCell(pair[1]); await idle();
    }
    await finished('gem-swap');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('gem-swap').history.at(-1); return [r.misses, r.hints]; }), [2, level === 4 ? 2 : 1]);
  }
  await page.evaluate(() => { kit.store.data.profile.band = 'grownup'; neo.go.land('lantern-lake'); }); await scene('LandScene');
  await turnToGame('gem-swap');
  await tap("neo.scene.showing.find(m => m.mod.id === 'gem-swap').node"); await scene('GameScene');
  await page.waitForTimeout(400);
  // Leaving in the middle of a clear discards scene-owned animation safely.
  const pair = await next(); await tapCell(pair[0]); await tapCell(pair[1]);
  await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene'); await page.waitForTimeout(600);
  assert.deepEqual(errors, []);
  log('Gem Swap: first/last, two rejected swaps, hint once, cancel, Undo/Restart accounting, portrait targets, shell sticker, Lantern Lake and leave mid-clear passed');
}

return { gemSwapPlay };
}
