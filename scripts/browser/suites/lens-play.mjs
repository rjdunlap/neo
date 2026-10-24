import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function lensPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('puddle-lens').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 20000 }); await page.waitForTimeout(200); };
  const turn = async (stop) => { await page.evaluate((stop) => kit.tapOn(neo.scene.game.stopButtons[stop - 1]), stop); await page.waitForFunction((stop) => neo.scene.game.stop === stop, stop, { timeout: 5000 }); await page.waitForTimeout(400); };
  const show = async () => { await page.evaluate(() => kit.tapOn(neo.scene.game.answer)); await page.waitForTimeout(300); };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await launch('puddle-lens', 1);
  await settle();
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => kit.tapOn(neo.scene.game.lensHit));
    await page.waitForFunction(() => neo.scene.game.swollen, null, { timeout: 5000 });
    if (i === 0) await page.evaluate(() => kit.tapOn(neo.scene.game.lensHit));
    await page.waitForFunction((i) => neo.scene.finished || neo.scene.game.index > i, i, { timeout: 8000 });
    await settle();
  }
  await finished('puddle-lens');
  assert.deepEqual(await score(), [0, 0], 'level 1 has nothing to get wrong');
  await launch('puddle-lens', 4);
  await settle();
  assert.deepEqual(await page.evaluate(() => neo.scene.game.questions.slice(0, 2).map((q) => q.feature)), ['boxes', 'leaf'], 'the authored leaf round');
  await turn(2); await show();
  assert.deepEqual(await tally(), [1, 0], 'boxes at the hand lens are too small: a miss');
  await turn(4); await show(); await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.index), 1, 'boxes at the closest stop: shown');
  await show();
  assert.deepEqual(await tally(), [2, 0], 'the whole leaf at the closest stop is too close: a miss');
  await page.evaluate(() => neo.scene.game.askForHint());
  await page.waitForFunction(() => neo.scene.game.stop === 1, null, { timeout: 5000 });
  assert.deepEqual(await tally(), [2, 1], 'Show a hint turns the dial and counts one');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(300);
  assert.deepEqual(await tally(), [2, 1], 'a second hint on the same question counts nothing more');
  await show(); await settle();
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('puddle-lens-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  for (let i = 0; i < 30 && !(await page.evaluate(() => neo.scene.finished)); i++) {
    await settle();
    await page.evaluate(() => { const t = neo.scene.game.autotouch(); if (t) kit.tapOn(t.tap.on); });
    await page.waitForTimeout(500);
  }
  await finished('puddle-lens');
  assert.deepEqual(await score(), [2, 1]);
  log('Puddle Lens 1 and 4: three swells (one shrunk early), authored leaf, too small and too close misses, one counted hint, portrait, saved score passed');
}
return { lensPlay };
}
