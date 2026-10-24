import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
/** Adventure Walk: level 1 (three free choices); level 3 in portrait (one wrong way, a replay, a requested hint, then the calls). */
async function adventureWalkPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('adventure-walk').history.at(-1); return [r.misses, r.hints]; });
  const st = () => page.evaluate(() => { const s = neo.scene.game.state; return { stop: s.stop, misses: s.misses, hints: s.hints, glow: s.glow }; });
  const idle = async () => { await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 8000 }); await page.waitForTimeout(150); };
  const slot = (i) => page.evaluate((i) => kit.tapOn(neo.scene.game.zoneNodes[i]), i);
  const asked = () => page.evaluate(() => { const g = neo.scene.game, s = g.state.route.stops[g.state.stop]; return s.asked === s.first ? 0 : 1; });
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await launch('adventure-walk', 1);
  await page.waitForTimeout(800);
  for (let i = 0; i < 3; i++) { await slot(i % 2); await page.waitForTimeout(2600); }
  await finished('adventure-walk');
  assert.deepEqual(await score(), [0, 0]);
  await launch('adventure-walk', 3);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  await screenshot('adventure-walk-3-portrait');
  await page.evaluate(() => kit.tapOn(neo.scene.game.badgeNode));
  await page.waitForTimeout(300);
  await slot(1 - (await asked()));
  await page.waitForTimeout(1200);
  let a = await st();
  assert.equal(a.misses, 1); assert.equal(a.stop, 0);
  await page.evaluate(() => neo.scene.game.askForHint());
  a = await st();
  assert.equal(a.hints, 1); assert.equal(a.glow, true);
  await slot(await asked());
  await page.waitForTimeout(2600);
  for (let i = 0; i < 2; i++) { await slot(await asked()); await page.waitForTimeout(2600); }
  await finished('adventure-walk');
  assert.deepEqual(await score(), [1, 1]);
  await page.setViewportSize({ width: 1024, height: 768 });
  log('Adventure Walk 1 and 3: free choices, wrong way, replay, requested hint, calls followed, portrait, saved score passed');
}

return { adventureWalkPlay };
}
