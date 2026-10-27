import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished, next }) {
/** Brain Break: real taps, stable checked stones, hints and one reward per board. */
async function brainBreakPlay() {
  for (const level of [1, 3]) {
    await launch('brain-break', level); await page.waitForTimeout(350);
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    const wrong = await page.evaluate(() => neo.scene.game.board.findIndex(n => n === 2));
    await tap(`neo.scene.game.stones[${wrong}]`);
    await tap(`neo.scene.game.stones[${wrong}]`);
    assert.deepEqual(await page.evaluate(() => {
      const g = neo.scene.game; return [g.next, g.misses, g.hints, g.board[g.hinted]];
    }), [1, 2, 1, 1]);
    await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 2);
    if (level === 3) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(450);
      await screenshot('brain-break-portrait');
    }
    for (let n = 1; n <= (level === 1 ? 9 : 25); n++) {
      const i = await page.evaluate(n => neo.scene.game.board.indexOf(n), n);
      await tap(`neo.scene.game.stones[${i}]`);
      if (n === 1) {
        await tap(`neo.scene.game.stones[${i}]`);
        assert.equal(await page.evaluate(() => neo.scene.game.next), 2, 'checked stone is free');
      }
    }
    await finished('brain-break');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 2]);
    await page.setViewportSize({ width: 1024, height: 768 });
  }
  log('brainbreak: first/last boards, wrong taps, automatic/manual hint, checked stones, portrait and one sticker passed');
}

return { brainBreakPlay };
}
