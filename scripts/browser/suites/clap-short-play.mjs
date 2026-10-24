import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Short guided preschool entry: two words, no count or timing mistakes. */
async function clapShortPlay() {
  await page.evaluate(() => { kit.store.data.stickers = []; });
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 40000 });
  await launch('clap-syllables', 9); await idle();
  const counts = [];
  for (let i = 0; i < 2; i++) {
    await page.waitForFunction((i) => neo.scene.game.index === i && !neo.scene.game.busy, i, { timeout: 40000 });
    const n = await page.evaluate(() => neo.scene.game.word.parts.length);
    counts.push(n);
    assert.equal(await page.evaluate(() => neo.scene.game.beads.length), n);
    if (i === 0) {
      await page.evaluate(() => { neo.scene.game.idle = 100; });
      await page.waitForFunction(() => neo.scene.game.busy, null, { timeout: 5000 }); await idle();
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.claps]), [0, 0, 0]);
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
      assert.ok(await page.evaluate(() => { const g = neo.scene.game; const p = g.pad.getBounds(); const c = g.cards[0].node.getBounds(); return p.width >= 100 && p.height >= 100 && p.x >= 0 && p.x + p.width <= innerWidth && p.y >= 0 && p.y + p.height <= innerHeight && c.y + c.height < p.y; }), 'picture and large hands fit portrait without overlap');
      await screenshot('clap-9-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
    }
    for (let j = 0; j < n; j++) {
      await tap('neo.scene.game.pad');
      assert.equal(await page.evaluate(() => neo.scene.game.beads.filter((b) => b.lit).length), j + 1);
    }
  }
  await finished('clap-syllables');
  assert.deepEqual(counts.sort(), [1, 2]);
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('clap-syllables').history.at(-1); return [r.level, r.misses, r.hints, kit.store.data.stickers.length]; }), [9, 0, 0, 1]);
  assert.deepEqual(errors, []);
  log('Clap level 9: two guided words, one and two beats, automatic support replay, lit bead per tap, no misses/hints, one sticker and portrait');
}

return { clapShortPlay };
}
