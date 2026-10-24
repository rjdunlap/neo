import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
/** Sense Detective: level 1 (a not-yet, a wrong tick, then found); level 2 in portrait (a look, a not-yet, a listen, a wrong tick, a requested hint). */
async function senseDetectivePlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('sense-detective').history.at(-1); return [r.misses, r.hints]; });
  const settle = async () => { await page.waitForTimeout(300); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 25000 }); await page.waitForTimeout(250); };
  const tapCard = async (own) => { await page.evaluate((own) => { const g = neo.scene.game; kit.tapOn(g.cards.find((c) => (c.id === g.round.hidden) === own).node); }, own); await page.waitForTimeout(250); };
  const tapNode = async (name) => { await page.evaluate((name) => kit.tapOn(neo.scene.game[name]), name); await settle(); };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await launch('sense-detective', 1);
  await settle();
  await tapCard(false); await tapNode('checkBtn');
  assert.equal(await page.evaluate(() => neo.scene.game.misses), 0);
  await tapNode('lookBtn'); await tapNode('checkBtn');
  assert.equal(await page.evaluate(() => neo.scene.game.misses), 1);
  await tapCard(true); await tapNode('checkBtn');
  await finished('sense-detective');
  assert.deepEqual(await score(), [1, 0]);
  await launch('sense-detective', 2);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
  await settle();
  await tapNode('lookBtn');
  await tapCard(false); await tapNode('checkBtn');
  assert.equal(await page.evaluate(() => neo.scene.game.misses), 0);
  await tapNode('listenBtn');
  await screenshot('sense-detective-2-portrait');
  await tapNode('checkBtn');
  assert.equal(await page.evaluate(() => neo.scene.game.misses), 1);
  await page.evaluate(() => neo.scene.game.askForHint());
  await tapCard(true); await tapNode('checkBtn');
  await finished('sense-detective');
  assert.deepEqual(await score(), [1, 1]);
  await page.setViewportSize({ width: 1024, height: 768 });
  log('Sense Detective 1 and 2: not-yet, wrong tick, found, look then listen, requested hint, portrait, saved score passed');
}

return { senseDetectivePlay };
}
