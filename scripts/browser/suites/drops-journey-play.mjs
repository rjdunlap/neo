import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function dropsJourneyPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('drops-journey').history.at(-1); return [r.misses, r.hints]; });
  const state = () => page.evaluate(() => neo.scene.game.state);
  const settle = async () => { await page.waitForTimeout(200); await page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.busy && !neo.scene.game.replaying), null, { timeout: 40000 }); await page.waitForTimeout(150); };
  const card = async (name) => {
    const i = (await state()).cards.indexOf(name);
    assert.ok(i >= 0, `card ${name} offered`);
    await page.evaluate((i) => kit.tapOn(neo.scene.game.cardNodes[i]), i);
    await page.waitForTimeout(150);
  };
  const leaf = () => page.evaluate(() => kit.tapOn(neo.scene.game.leaf));
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1 (authored: start in the sea): sea → cloud → river → sea, no leaf before three stops; the leaf finishes with 0/0.
  await launch('drops-journey', 1, 'Mia', 'preschool');
  await settle();
  let s = await state();
  assert.equal(s.at, 'sea');
  assert.deepEqual(s.cards, ['cloud', 'stay'], 'the sea offers the cloud and staying');
  await card('cloud');
  s = await state();
  assert.equal(s.busy, true, 'the drop is moving');
  await page.evaluate(() => kit.tapOn(neo.scene.game.cardNodes[0]));
  await settle();
  s = await state();
  assert.equal(s.stops, 1, 'a tap during the move was ignored');
  assert.equal(s.at, 'cloud');
  await card('river'); await settle();
  assert.equal((await state()).leaf, false, 'no leaf after two stops');
  await card('sea'); await settle();
  s = await state();
  assert.equal(s.leaf, true, 'the leaf after three stops');
  await leaf();
  await finished('drops-journey');
  assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

  // Level 2 in portrait (authored: sea to the snow): a screenshot mid-rise with the vapour dots, then cloud → snow and the leaf.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await launch('drops-journey', 2, 'Mia', 'school');
  await settle();
  s = await state();
  assert.deepEqual([s.start, s.goal], ['sea', 'snow']);
  await card('cloud');
  await page.waitForTimeout(700);
  await screenshot('drops-journey-2-portrait-rising');
  await settle();
  assert.equal((await state()).cards.length, 5, 'the cloud offers four moves and staying');
  await card('snow'); await settle();
  s = await state();
  assert.equal(s.leaf, true, 'the postcard became the leaf');
  await leaf();
  await finished('drops-journey');
  assert.deepEqual(await score(), [0, 0], 'level 2 saved 0 misses, 0 hints');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);

  // Level 3 (authored: sea, cards cloud / river can't-go / stay): the can't-go card is a miss and greys; to the cloud; ...
  await launch('drops-journey', 3, 'Mia', 'school');
  await settle();
  s = await state();
  assert.deepEqual(s.cards, ['cloud', 'cant:river', 'stay']);
  await card('cant:river'); await settle();
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.at, s.tried], [1, 0, 'sea', [1]], "one miss, the drop stays in the sea, the card greys");
  await page.evaluate(() => kit.tapOn(neo.scene.game.cardNodes[1])); await settle();
  assert.equal((await state()).misses, 1, 'a greyed card is not counted again');
  // Travel until a stop offers another can't-go card, then tap it: the second miss lights the glow (one hint).
  await card('cloud'); await settle();
  for (let k = 0; k < 6; k++) {
    s = await state();
    const cant = s.cards.find((c) => c.startsWith('cant:'));
    if (cant) { await card(cant); await settle(); await page.waitForFunction(() => neo.scene.game.glowOn, null, { timeout: 15000 }); break; }
    const next = s.cards.find((c) => c !== 'stay' && c !== s.at) ?? 'stay';
    await card(next); await settle();
  }
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.glowOn], [2, 1, true], 'the second miss glows: one hint');
  await screenshot('drops-journey-3-glow');
  // Requested hint: points at a lawful card (one more hint); follow it and keep moving to four moves, then the leaf.
  await page.evaluate(() => neo.scene.game.askForHint());
  s = await state();
  assert.equal(s.hints, 2, 'a requested hint counts one');
  assert.ok(!s.cards[s.pointing].startsWith('cant:'), 'the hint points at a lawful card');
  for (let k = 0; k < 12 && !(await state()).canFinish; k++) {
    s = await state();
    const next = s.cards.find((c) => c !== 'stay' && !c.startsWith('cant:'));
    await card(next); await settle();
  }
  s = await state();
  assert.ok(s.moves >= 4 && s.leaf, 'four moves bring the leaf');
  await leaf();
  await finished('drops-journey');
  assert.deepEqual(await score(), [2, 2], 'level 3 saved 2 misses, 2 hints');
  log("Drop's Journey 1–3: level 1 three stops (a mid-move tap ignored) to the leaf 0/0; level 2 portrait sea → cloud → snow with the vapour screenshot 0/0; level 3 two can't-go cards (greyed, glow, one hint) and a requested hint, four moves, 2/2; passed");
}
return { dropsJourneyPlay };
}
