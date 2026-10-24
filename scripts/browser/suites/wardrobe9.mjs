import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
async function wardrobe9() {
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('weather-wardrobe', 9);
  await page.waitForTimeout(900);
  await screenshot('weather-wardrobe-9');
  await page.evaluate(async () => {
    const g = neo.scene.game;
    if (g.plan.mode !== 'sky' || g.skyCards.length !== 3 || g.worn.size !== 2 || !g.blank) throw new Error('Which sky did not start grey with three skies and a dressed pet');
    const wrong = g.skyCards.find((c) => c.weather !== g.outfit.answer);
    for (let i = 0; i < 2; i++) { kit.tapOn(wrong.node); await kit.sleep(150); if (!g.busy || g.blank) throw new Error('No wrong sky shown'); await kit.until(() => !g.busy, 5000); await kit.sleep(50); }
    if (g.hints !== 1 || g.misses !== 2 || !g.blank) throw new Error('Which sky miss or hint accounting wrong');
    for (let step = 0; !g.done && step < 12; step++) {
      await kit.until(() => !g.busy || g.done, 15000);
      if (g.done) break;
      const right = g.skyCards.find((c) => c.weather === g.outfit.answer);
      kit.tapOn(right.node);
      await kit.sleep(500);
    }
    if (!g.done) throw new Error('Which sky rounds did not finish');
  });
  await finished('weather-wardrobe');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('weather-wardrobe').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
  log('Weather Wardrobe 9: grey scene, wrong sky with consequence, hint, saved round and sticker passed');
  await page.setViewportSize({ width: 1024, height: 768 });
}

return { wardrobe9 };
}
