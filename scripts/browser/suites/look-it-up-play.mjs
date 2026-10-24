import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
/** Look It Up: level 1 touches every label on three pages; level 3 finds each visitor's page and row, with both wrong pictures first on the first visitor (the glow hint); level 3 in portrait. */
async function lookItUpPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('look-it-up').history.at(-1); return [r.misses, r.hints]; });
  const settle = async () => { await page.waitForTimeout(300); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 25000 }); await page.waitForTimeout(250); };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await launch('look-it-up', 1);
  await settle();
  for (let p = 0; p < 3; p++) {
    for (let i = 0; i < 3; i++) {
      await page.evaluate((i) => kit.tapOn(neo.scene.game.rows[i].node), i);
      await page.waitForTimeout(200);
    }
    await settle();
  }
  await finished('look-it-up');
  assert.deepEqual(await score(), [0, 0]);
  await launch('look-it-up', 3);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
  await screenshot('look-it-up-3-portrait');
  for (let n = 0; n < 3; n++) {
    await page.waitForFunction((n) => neo.scene.game.index === n && !neo.scene.game.busy, n, { timeout: 25000 });
    await page.waitForTimeout(200);
    if (n === 0) {
      // Two different wrong pictures: two misses, then the glow (one hint).
      const wrongs = await page.evaluate(async () => { const L = await import('/src/games/look-it-up/logic.ts'); const g = neo.scene.game; const v = g.round.visits[g.index]; return g.choices.map((c) => c.picture).filter((p) => L.check(g.round, v, p).kind === 'wrong'); });
      for (const p of wrongs) { await page.evaluate((p) => kit.tapOn(neo.scene.game.choices.find((c) => c.picture === p).node), p); await settle(); }
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 1]);
    }
    for (let step = 0; step < 4; step++) {
      const h = await page.evaluate(async () => { const L = await import('/src/games/look-it-up/logic.ts'); const g = neo.scene.game; return L.hintFor(g.round, g.round.visits[g.index], g.open, g.rowSeen); });
      if (h.kind === 'tab') await page.evaluate((id) => kit.tapOn(neo.scene.game.tabs.find((t) => t.id === id).node), h.animal);
      else if (h.kind === 'row') await page.evaluate((row) => kit.tapOn(neo.scene.game.rows.find((r) => r.kind === row).node), h.row);
      else { await page.evaluate((p) => kit.tapOn(neo.scene.game.choices.find((c) => c.picture === p).node), h.picture); break; }
      await page.waitForTimeout(350);
    }
    await page.waitForTimeout(400);
  }
  await finished('look-it-up');
  assert.deepEqual(await score(), [2, 1]);
  await page.setViewportSize({ width: 1024, height: 768 });
  log('Look It Up 1 and 3: labels touched, tab and row found, two wrong pictures then the glow hint, portrait, saved score and sticker passed');
}

return { lookItUpPlay };
}
