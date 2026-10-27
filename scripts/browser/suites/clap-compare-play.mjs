import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
async function clapComparePlay() {
  await page.evaluate(() => { kit.store.data.stickers = []; });
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 40000 });
  await launch('clap-syllables', 8); await idle();
  const directions = [];
  for (let i = 0; i < 4; i++) {
    await page.waitForFunction((i) => neo.scene.game.index === i && !neo.scene.game.busy, i, { timeout: 40000 });
    directions.push(await page.evaluate(() => neo.scene.game.q.comparison));
    assert.equal(await page.evaluate(() => { const ns = neo.scene.game.q.words.map((w) => w.parts.length); return ns.length === 2 && ns[0] !== ns[1]; }), true);
    if (i === 0) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
      assert.ok(await page.evaluate(() => neo.scene.game.cards.every((c) => { const b = c.node.getBounds(); return b.width >= 100 && b.x > 0 && b.x + b.width < innerWidth && b.y > 0 && b.y + b.height < innerHeight; })), 'comparison targets fit portrait');
      await screenshot('clap-8-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
      // Replay is free; a wrong choice is a miss; the second glows the correct picture.
      await tap('neo.scene.game.replay'); await idle();
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
      for (let n = 0; n < 2; n++) {
        await page.evaluate(async () => { const g = neo.scene.game; await kit.tapOn(g.cards.find((c) => c.word.parts.length !== g.q.target).node); });
        await idle();
      }
      assert.deepEqual(await page.evaluate(() => { const g = neo.scene.game; return [g.misses, g.hints, g.glowing === g.cards.find((c) => c.word.parts.length === g.q.target).node]; }), [2, 1, true]);
    }
    await page.evaluate(async () => { const g = neo.scene.game; const intent = g.autotouch(); await kit.tapOn(intent.tap.on); });
  }
  await finished('clap-syllables');
  assert.deepEqual(directions, [directions[0], directions[0] === 'more' ? 'fewer' : 'more', directions[0], directions[0] === 'more' ? 'fewer' : 'more']);
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('clap-syllables').history.at(-1); return [r.level, r.misses, r.hints, kit.store.data.stickers.length]; }), [8, 2, 1, 1]);
  assert.deepEqual(errors, []);
  log('Clap level 8: alternating more/fewer, free replay, two misses then correct glow, finger choices, one sticker and portrait');
}

return { clapComparePlay };
}
