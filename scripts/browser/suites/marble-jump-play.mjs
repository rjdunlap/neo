import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, turnToGame, launch, finished, next }) {
async function marbleJumpPlay() {
  const tapHole = async i => { await page.evaluate(i => kit.tapOn(neo.scene.game.nodes[i]), i); await page.waitForFunction(() => !neo.scene.game.flight); await page.waitForTimeout(120); };
  await page.setViewportSize({ width: 768, height: 1024 });
  let look = 'oak';
  for (let tries = 0; look === 'oak' && tries < 12; tries++) {
    await launch('marble-jump', 2); await page.waitForTimeout(300);
    look = await page.evaluate(() => neo.scene.game.look.name);
  }
  assert.notEqual(look, 'oak', 'a new tray look comes up within a few rounds');
  const opening = await page.evaluate(async () => (await import('/src/games/marble-jump/logic.ts')).solve(neo.scene.game.board)[0]);
  await tapHole(opening.from); await tapHole(opening.to);
  await screenshot(`marble-jump-2-${look}-portrait`);
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  for (const level of [1, 2, 6]) {
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
    const colour = await page.evaluate(i => neo.scene.game.colors[i], first.from);
    await page.evaluate(i => kit.tapOn(neo.scene.game.nodes[i]), first.from); await page.waitForTimeout(160);
    await page.evaluate(i => kit.tapOn(neo.scene.game.nodes[i]), first.to);
    assert.ok(await page.evaluate(() => !!neo.scene.game.flight), 'the jump is shown, not swapped in one redraw');
    await page.waitForFunction(() => !neo.scene.game.flight);
    assert.equal(await page.evaluate(i => neo.scene.game.colors[i], first.to), colour, 'the marble keeps its colour as it lands');
    assert.equal(await page.evaluate(() => neo.scene.game.taken.length), 1, 'the jumped marble is in the pocket');
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
        return g.history[L.recovery(g.history.map(s => s.board))].board;
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
