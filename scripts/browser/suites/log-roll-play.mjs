import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, turnToGame, launch, finished, next }) {
/** Log Roll: both ends, rejected edge roll, solver hint, revision and upright completion. */
async function logRollPlay() {
  for (const level of [1, 3]) {
    await launch('log-roll', level); await page.waitForTimeout(400);
    const original = await page.evaluate(() => ({ ...neo.scene.game.state }));
    // Walk to an edge using legal rolls, then try an unsupported roll through its real button.
    const blocked = await page.evaluate(async () => {
      const { DIRECTIONS, roll, key, solved } = await import('/src/games/log-roll/logic.ts');
      const g = neo.scene.game, queue = [{ state: g.state, route: [] }], seen = new Set();
      for (let head = 0; head < queue.length; head++) {
        const v = queue[head];
        for (const d of DIRECTIONS) {
          const n = roll(v.state, d, g.puzzle.plan.floor);
          if (!n) return [...v.route, d];
          if (!seen.has(key(n)) && !solved(n, g.puzzle.plan.floor)) {
            seen.add(key(n)); queue.push({ state: n, route: [...v.route, d] });
          }
        }
      }
      throw new Error('No unsupported roll found');
    });
    for (const d of blocked.slice(0, -1)) await tap(`neo.scene.game.directions.${d}`);
    const edgeState = await page.evaluate(() => ({ ...neo.scene.game.state }));
    await tap(`neo.scene.game.directions.${blocked.at(-1)}`);
    assert.deepEqual(await page.evaluate(() => neo.scene.game.state), edgeState);
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 0);
    assert.match(await page.evaluate(() => neo.scene.game.status.text), /Both ends need stones/);
    await tap('neo.scene.game.againButton');
    assert.deepEqual(await page.evaluate(() => neo.scene.game.state), original);
    await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
    await page.evaluate(() => { const g = neo.scene.game; kit.tapOn(g.directions[g.hinted]); });
    await page.waitForTimeout(180);
    await tap('neo.scene.game.undoButton');
    assert.deepEqual(await page.evaluate(() => neo.scene.game.state), original);
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
    if (level === 3) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      assert.ok(await page.evaluate(() => neo.scene.game.cell >= 64));
      await screenshot('log-roll-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
      await screenshot('log-roll-landscape');
    }
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await page.evaluate(async () => {
      const { solutionStep } = await import('/src/games/log-roll/logic.ts');
      const g = neo.scene.game;
      for (let guard = 0; guard < 40 && !g.finished; guard++) {
        const d = solutionStep(g.state, g.puzzle.plan.floor)?.next;
        if (!d) throw new Error('No Log Roll route');
        kit.tapOn(g.directions[d]); await kit.sleep(170);
      }
    });
    await finished('log-roll');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    log(`Log Roll level ${level}: edge support, hint, Undo, reset and one sticker passed`);
  }
  await page.evaluate(() => neo.go.land('tinker-lab')); await scene('LandScene');
  await turnToGame('log-roll');
  await tap("neo.scene.showing.find(m => m.mod.id === 'log-roll').node"); await scene('GameScene');
  assert.equal(await page.evaluate(() => neo.scene.mod.id), 'log-roll');
}

return { logRollPlay };
}
