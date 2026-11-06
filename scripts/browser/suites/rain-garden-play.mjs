import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function rainGardenPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('rain-garden').history.at(-1); return [r.misses, r.hints]; });
  const state = () => page.evaluate(() => neo.scene.game.state);
  const settle = async () => { await page.waitForTimeout(200); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 30000 }); await page.waitForTimeout(150); };
  const cloud = () => page.evaluate(() => kit.tapOn(neo.scene.game.cloud));
  const tileTap = (i) => page.evaluate((i) => kit.tapOn(neo.scene.game.tiles[i]), i);
  const leaf = () => page.evaluate(() => kit.tapOn(neo.scene.game.leaf));
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  const from = Number(process.env.FROM_LEVEL || 1);
  let s;

  if (from <= 3) {
  // Level 1 (authored: soil): no leaf before rain; rain gives 2 kept and 2 in the pond; a tap mid-shower is ignored;
  // rain again on a fresh garden; the leaf finishes 0/0.
  await launch('rain-garden', 1, 'Mia', 'toddler');
  await settle();
  s = await state();
  assert.deepEqual([s.surfaces, s.leaf], [['soil'], false]);
  await cloud();
  await page.waitForTimeout(300);
  await cloud();
  await settle();
  s = await state();
  assert.deepEqual([s.trials, s.current, s.drops, s.leaf], [1, [[2, 2]], 4, true], 'one shower: two kept, two in the pond, the leaf');
  await cloud(); await settle();
  s = await state();
  assert.deepEqual([s.trials, s.current, s.drops], [2, [[2, 2]], 4], 'a fresh garden, the same result');
  await leaf();
  await finished('rain-garden');
  assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

  // Level 2 in portrait (authored: stone left, soil right): a screenshot mid-shower, then flip the left ground, rain, finish 0/0.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await launch('rain-garden', 2, 'Mia', 'preschool');
  await settle();
  assert.deepEqual((await state()).surfaces, ['stone', 'soil']);
  await cloud();
  await page.waitForTimeout(2600);
  await screenshot('rain-garden-2-portrait-shower');
  await settle();
  s = await state();
  assert.deepEqual([s.current, s.leaf], [[[0, 4], [2, 2]], true], 'same rain: stone kept none, soil kept two');
  await tileTap(0); await settle();
  s = await state();
  assert.deepEqual([s.surfaces, s.current, s.drops, s.misses], [['soil', 'soil'], null, 0, 0], 'a tile flip resets both gardens, no miss');
  await cloud(); await settle();
  assert.deepEqual((await state()).current, [[2, 2], [2, 2]], 'the same ground, the same result');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  await leaf();
  await finished('rain-garden');
  assert.deepEqual(await score(), [0, 0], 'level 2 saved 0 misses, 0 hints');

  // Level 3 (authored: stone): a requested hint points at the cloud (one hint); the first rain becomes the bookmark;
  // no leaf on the same ground; soil and rain again bring the leaf; finish 0/1.
  await launch('rain-garden', 3, 'Mia', 'school');
  await settle();
  await page.evaluate(() => neo.scene.game.askForHint());
  s = await state();
  assert.deepEqual([s.hints, s.pointing], [1, 'cloud']);
  await cloud(); await settle();
  s = await state();
  assert.deepEqual([s.bookmark, s.current, s.leaf], [['stone', 0, 4], null, false], 'the first rain is kept on the card');
  await cloud(); await settle();
  s = await state();
  assert.deepEqual([s.current, s.leaf], [[[0, 4]], false], 'the same ground again: no leaf yet');
  await tileTap(1); await settle();
  assert.deepEqual((await state()).surfaces, ['soil']);
  await cloud(); await settle();
  s = await state();
  assert.deepEqual([s.current, s.bookmark, s.leaf, s.misses], [[[2, 2]], ['stone', 0, 4], true, 0], 'soil beside the stone card brings the leaf');
  await leaf();
  await finished('rain-garden');
  assert.deepEqual(await score(), [0, 1], 'level 3 saved 0 misses, 1 hint');
  log('Rain Garden 1–3: level 1 rain, mid-shower tap ignored, fresh rain, leaf 0/0; level 2 portrait shower screenshot, tile flip resets both (no miss), leaf 0/0; level 3 hint, bookmark, same-ground no leaf, soil compare, leaf 0/1; passed');
  }

  // Level 4 in portrait (authored: soil over stone, low bed marked): try it, a wrong Check (one miss) and its screenshot,
  // the same arrangement checked again counts nothing, Show me flips the top bed (one hint), she flips the low bed, the Check passes 1/1.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await launch('rain-garden', 4, 'Mia', 'school');
  await settle();
  s = await state();
  assert.deepEqual([s.level, s.bed, s.surfaces, s.current], [4, 1, ['soil', 'stone'], null]);
  await cloud(); await settle();
  s = await state();
  assert.deepEqual([s.current, s.drops, s.misses], [[2, 0, 2], 4, 0], 'the top soil kept two, two ran past the stone');
  const checkTap = () => page.evaluate(() => kit.tapOn(neo.scene.game.check));
  await checkTap(); await settle();
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.passed, s.drops], [1, 0, false, 4], 'a wrong Check: one miss, drops stay');
  await screenshot('rain-garden-4-portrait-wrong-check');
  await checkTap(); await settle();
  assert.equal((await state()).misses, 1, 'the same arrangement again counts nothing');
  await page.evaluate(() => neo.scene.game.askForHint());
  await settle();
  s = await state();
  assert.deepEqual([s.surfaces, s.hints, s.current, s.drops], [['stone', 'stone'], 1, null, 0], 'Show me flips the top bed to fresh');
  await page.evaluate(() => kit.tapOn(neo.scene.game.beds[1])); await settle();
  assert.deepEqual((await state()).surfaces, ['stone', 'soil']);
  await checkTap();
  await finished('rain-garden');
  assert.deepEqual(await score(), [1, 1], 'level 4 saved 1 miss, 1 hint');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  log('Rain Garden 4: portrait, try it, wrong Check 1 miss (screenshot), same arrangement again no miss, Show me flips the top bed (1 hint), low bed flipped, Check passes 1/1; passed');
}
return { rainGardenPlay };
}
