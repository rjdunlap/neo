import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, turnToGame, launch, finished, next }) {
async function marbleJumpPlay() {
  const tapHole = async i => { await page.evaluate(i => kit.tapOn(neo.scene.game.nodes[i]), i); await page.waitForTimeout(160); };
  for (const level of [1, 6]) {
    await launch('marble-jump', level); await page.waitForTimeout(400);
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    const start = await page.evaluate(() => neo.scene.game.board);
    const pair = await page.evaluate(async () => {
      const L = await import('/src/games/marble-jump/logic.ts'), g = neo.scene.game;
      for (let a = 0; a < 15; a++) for (let b = 0; b < 15; b++)
        if (L.occupied(g.board, a) && !L.occupied(g.board, b) && !L.moves(g.board).some(j => j.from === a && j.to === b)) return [a, b];
    });
    await tapHole(pair[0]); await tapHole(pair[1]);
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 1);
    assert.equal(await page.evaluate(() => neo.scene.game.board), start);
    await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
    await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'repeating the same hint counts once');
    const first = await page.evaluate(() => neo.scene.game.hinted);
    await tapHole(first.from); await tapHole(first.to);
    await tap('neo.scene.game.undoButton');
    assert.equal(await page.evaluate(() => neo.scene.game.board), start);
    await tap('neo.scene.game.restartButton');
    if (level === 6) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(350);
      assert.ok(await page.evaluate(() => neo.scene.game.nodes.every(n => n.hitArea.radius * n.worldTransform.a / neo.view.scale >= 32)));
      await screenshot('marble-jump-6-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(350);
    }
    if (level === 6) {
      const route = await page.evaluate(async () => {
        const L = await import('/src/games/marble-jump/logic.ts');
        function seek(board) {
          for (const j of L.moves(board)) {
            const after = L.jump(board, j);
            if (L.solve(after) === null) return [j];
            const rest = seek(after); if (rest) return [j, ...rest];
          }
          return null;
        }
        return seek(neo.scene.game.board);
      });
      assert.ok(route, 'the full triangle permits a legal route that needs revision');
      for (const j of route) { await tapHole(j.from); await tapHole(j.to); }
      assert.equal(await page.evaluate(() => neo.scene.game.misses), 1, 'legal experiments add no miss');
      const expected = await page.evaluate(async () => {
        const L = await import('/src/games/marble-jump/logic.ts'), g = neo.scene.game;
        return g.history[L.recovery(g.history)];
      });
      await tap('neo.scene.game.hintButton');
      assert.equal(await page.evaluate(() => neo.scene.game.board), expected, 'hint returns to the nearest clearing route');
      assert.ok(await page.evaluate(() => neo.scene.game.hinted !== null));
    }
    let jumps = 0;
    while (!(await page.evaluate(() => neo.scene.finished))) {
      const next = await page.evaluate(async () => {
        const L = await import('/src/games/marble-jump/logic.ts'); return L.solve(neo.scene.game.board)[0];
      });
      await tapHole(next.from); await tapHole(next.to);
      assert.ok(++jumps <= 13);
    }
    await finished('marble-jump');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('marble-jump').history.at(-1); return [r.misses, r.hints]; }), [1, level === 6 ? 2 : 1]);
  }
  await page.evaluate(() => neo.go.land('puzzle-peaks')); await scene('LandScene');
  await turnToGame('marble-jump');
  await tap("neo.scene.showing.find(m => m.mod.id === 'marble-jump').node"); await scene('GameScene');
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => neo.scene.mod.id), 'marble-jump');
  await page.evaluate(() => neo.go.land('puzzle-peaks')); await scene('LandScene');
  await page.waitForTimeout(400);
  assert.deepEqual(errors, []);
  log('Marble Jump: first/last, illegal jump, hint recovery, undo/restart, portrait, land launch/leave and one sticker passed');
}

return { marbleJumpPlay };
}
