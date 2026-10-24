import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, turnToGame, launch, finished, next }) {
/** Pyramid Solitaire: finite complement deals, revision, recovery and real card taps. */
async function pyramidPlay() {
  for (const level of [1, 3]) {
    await launch('pyramid-solitaire', level); await page.waitForTimeout(350);
    let initial = await page.evaluate(() => neo.scene.game.mask);
    await tap('neo.scene.game.nodes[0]');
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 0, 'covered-card exploration is free');
    // Find a mismatched pair from the actual deal, using exposed non-kings only.
    const wrongPair = () => page.evaluate(async () => {
      const L = await import('/src/games/pyramid-solitaire/logic.ts'), g = neo.scene.game;
      const free = g.puzzle.ranks.map((_, i) => i).filter(i => L.exposed(g.puzzle, g.mask, i) && g.puzzle.ranks[i] !== 13);
      for (const a of free) for (const b of free) if (a !== b && g.puzzle.ranks[a] + g.puzzle.ranks[b] !== 13) return [a, b];
      return null;
    });
    let wrong = await wrongPair();
    for (let attempt = 0; !wrong && attempt < 10; attempt++) {
      await launch('pyramid-solitaire', level); await page.waitForTimeout(250);
      initial = await page.evaluate(() => neo.scene.game.mask); wrong = await wrongPair();
    }
    assert.ok(wrong, 'exercise a mismatched exposed pair');
    {
      for (const i of wrong) await tap(`neo.scene.game.nodes[${i}]`);
      assert.equal(await page.evaluate(() => neo.scene.game.misses), 1);
      assert.equal(await page.evaluate(() => neo.scene.game.mask), initial);
    }
    await tap('neo.scene.game.hintButton'); await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'visible hint is counted once');
    const hinted = await page.evaluate(() => [...neo.scene.game.hinted]);
    for (const i of hinted) await tap(`neo.scene.game.nodes[${i}]`);
    await tap('neo.scene.game.undoButton');
    assert.equal(await page.evaluate(() => neo.scene.game.mask), initial);
    for (const i of hinted) await tap(`neo.scene.game.nodes[${i}]`);
    await tap('neo.scene.game.againButton');
    assert.equal(await page.evaluate(() => neo.scene.game.mask), initial);
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
    if (level === 3) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(350);
      assert.ok(await page.evaluate(() => {
        const g = neo.scene.game, v = neo.view;
        return [...g.nodes, g.undoButton, g.hintButton, g.againButton].every(n => {
          const b = n.getBounds(); return b.width >= 64 && b.height >= 64 && b.x >= 0 && b.y >= 0 && b.x + b.width <= v.w && b.y + b.height <= v.h;
        });
      }), 'portrait controls fit with grown-up target sizes');
      await screenshot('pyramid-solitaire-3-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(350);
      await screenshot('pyramid-solitaire-3-landscape');
    }
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let guard = 0; guard < 20 && !g.finished; guard++) {
        const move = g.solve(g.mask)?.[0]; if (!move) throw new Error('Missing clearing route');
        for (const i of move) { kit.tapOn(g.nodes[i]); await kit.sleep(170); }
      }
    });
    await finished('pyramid-solitaire');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    log(`Pyramid Solitaire ${level}: touch, hint, revision, one sticker passed`);
  }
  // Find a legal dead end in an actual isolated round, without replacing game state.
  let recovery = null;
  for (let attempt = 0; !recovery && attempt < 12; attempt++) {
    await launch('pyramid-solitaire', 3); await page.waitForTimeout(250);
    recovery = await page.evaluate(async () => {
      const L = await import('/src/games/pyramid-solitaire/logic.ts'), g = neo.scene.game;
      const visited = new Set();
      const visit = (mask, route) => {
        if (visited.has(mask)) return null; visited.add(mask);
        for (const move of L.moves(g.puzzle, mask)) {
          const next = L.remove(mask, move);
          if (g.solve(next) === null) return [...route, move];
          const found = visit(next, [...route, move]); if (found) return found;
        }
        return null;
      };
      const route = visit(g.mask, []); return route ? { route } : null;
    });
  }
  assert.ok(recovery, 'exercise a legal blocked route');
  for (const move of recovery.route) for (const i of move) await tap(`neo.scene.game.nodes[${i}]`);
  assert.equal(await page.evaluate(() => neo.scene.game.solve(neo.scene.game.mask)), null);
  assert.equal(await page.evaluate(() => neo.scene.game.misses), 0);
  await tap('neo.scene.game.hintButton');
  assert.ok(await page.evaluate(() => neo.scene.game.solve(neo.scene.game.mask)));
  assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
  await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene');
  await turnToGame('pyramid-solitaire');
  await tap("neo.scene.showing.find(m => m.mod.id === 'pyramid-solitaire').node"); await scene('GameScene');
  assert.equal(await page.evaluate(() => neo.scene.mod.id), 'pyramid-solitaire');
  const beforeLeaving = await page.evaluate(() => kit.store.data.stickers.length);
  await page.evaluate(async () => {
    const p = neo.scene.home.getGlobalPosition();
    await kit.drag([[p.x, p.y], [p.x, p.y]], 1, 750);
  }); await scene('LandScene');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), beforeLeaving);
  log('Pyramid Solitaire: legal dead-end recovery, land launch, home and interruption passed');
}

return { pyramidPlay };
}
