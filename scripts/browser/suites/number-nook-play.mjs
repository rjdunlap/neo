import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished, next }) {
/** Number Nook: both ends, rejected tap, a hint counted once, the glide, revision, a portrait in a new look, shortest route and one sticker. */
async function numberNookPlay() {
  for (const level of [1, 3]) {
    await launch('number-nook', level);
    await page.waitForTimeout(400);
    // Level 1's portrait is taken in a look other than today's lantern paper.
    for (let tries = 0; level === 1 && tries < 8 && await page.evaluate(() => neo.scene.game.look.name) === 'lantern paper'; tries++) {
      await launch('number-nook', level); await page.waitForTimeout(400);
    }
    const original = await page.evaluate(() => neo.scene.game.board.slice());
    const wrong = await page.evaluate(async () => {
      const { neighbours } = await import('/src/games/number-nook/logic.ts');
      const g = neo.scene.game, legal = neighbours(g.board, g.plan.cols);
      return g.board.findIndex((v, i) => v && !legal.includes(i));
    });
    await tap(`neo.scene.game.nodes[${wrong}]`);
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 1);
    assert.deepEqual(await page.evaluate(() => neo.scene.game.board), original);
    await tap('neo.scene.game.hintButton');
    await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'a hint already showing is not counted again');
    await page.evaluate(() => kit.tapOn(neo.scene.game.nodes[neo.scene.game.hinted]));
    assert.ok(await page.evaluate(() => neo.scene.game.glide !== null), 'the tile glides into the gap');
    await page.waitForTimeout(260);
    assert.equal(await page.evaluate(() => neo.scene.game.glide), null);
    await tap('neo.scene.game.undoButton');
    assert.deepEqual(await page.evaluate(() => neo.scene.game.board), original);
    await page.evaluate(async () => {
      const { solutionStep } = await import('/src/games/number-nook/logic.ts');
      const g = neo.scene.game;
      kit.tapOn(g.nodes[solutionStep(g.board, g.plan.cols).next]);
    });
    await page.waitForTimeout(260);
    await tap('neo.scene.game.againButton');
    assert.deepEqual(await page.evaluate(() => neo.scene.game.board), original);
    assert.equal(await page.evaluate(() => neo.scene.game.moves), 2);
    if (level === 1) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      assert.ok(await page.evaluate(() => neo.scene.game.cell >= 64));
      log(`Number Nook portrait look: ${await page.evaluate(() => neo.scene.game.look.name)}`);
      await screenshot('number-nook-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
    }
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    const line = await page.evaluate(async () => {
      const { solutionStep } = await import('/src/games/number-nook/logic.ts');
      const g = neo.scene.game;
      for (let guard = 0; guard < 40 && !g.finished; guard++) {
        const step = solutionStep(g.board, g.plan.cols);
        if (!step || step.next < 0) throw new Error('Missing sliding route');
        kit.tapOn(g.nodes[step.next]); await kit.sleep(220);
      }
      return g.status.text;
    });
    assert.match(line, /fewest from the start: \d+/);
    await finished('number-nook');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    log(`Number Nook level ${level}: touch, revision and reward passed`);
  }
}

return { numberNookPlay };
}
