import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
/** Second Chance Shed: level 1 with an empty-yard drop (never counted) then every scrap to the worms; level 4 with one wrong place (the reason), a requested hint (the glow), a portrait screenshot with all four places, then every thing to its place. */
async function shedPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('second-chance-shed').history.at(-1); return [r.misses, r.hints]; });
  const settle = async () => { await page.waitForTimeout(300); await page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.busy && neo.scene.game.item), null, { timeout: 25000 }); await page.waitForTimeout(250); };
  const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
  const dropOn = (place) => page.evaluate(async (place) => {
    const g = neo.scene.game;
    const target = (place ? g.places.find((p) => p.place === place).node : g.cart).getGlobalPosition();
    await kit.dragTo(g.item.node, place ? target : { x: target.x - 300, y: target.y + 120 });
  }, place);
  const playOut = async () => {
    for (let i = 0; i < 8; i++) {
      await settle();
      if (await page.evaluate(() => neo.scene.finished || neo.scene.game.finished)) break;
      await dropOn(await page.evaluate(async () => { const L = await import('/src/games/second-chance-shed/logic.ts'); return L.ITEMS[neo.scene.game.item.id].place; }));
    }
  };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await launch('second-chance-shed', 1);
  await settle();
  const first = await page.evaluate(() => neo.scene.game.item.id);
  await dropOn(null); await page.waitForTimeout(700);
  assert.deepEqual([await page.evaluate(() => neo.scene.game.item?.id), ...await tally()], [first, 0, 0], 'an empty-yard drop floats back, uncounted');
  await playOut();
  await finished('second-chance-shed');
  assert.deepEqual(await score(), [0, 0]);
  await launch('second-chance-shed', 4);
  await settle();
  const wrong = await page.evaluate(async () => { const L = await import('/src/games/second-chance-shed/logic.ts'); const own = L.ITEMS[neo.scene.game.item.id].place; return L.PLACES.find((p) => p !== own); });
  await dropOn(wrong); await page.waitForTimeout(700);
  assert.deepEqual(await tally(), [1, 0], 'a wrong place is one miss');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(300);
  assert.deepEqual([...await tally(), await page.evaluate(() => neo.scene.game.tally.glowing)], [1, 1, true], 'Show a hint glows and counts once');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('second-chance-shed-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await playOut();
  await finished('second-chance-shed');
  assert.deepEqual(await score(), [1, 1]);
  log('Second Chance Shed 1 and 4: empty-yard drop uncounted, worms fed, wrong place miss, requested glow hint, portrait, saved score passed');
}

/**
 * Second Chance Shed 5–6: level 5 with the tin in Remake (a failed ring, then the same plan rung again counting nothing), then the
 * tin to the friend; level 6 with the tempting plan, two failed rings and the glow, Show a hint then Show me one, a portrait screenshot.
 */
async function shedPlanPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('second-chance-shed').history.at(-1); return [r.misses, r.hints]; });
  const state = () => page.evaluate(() => neo.scene.game.state);
  const settle = async () => { await page.waitForTimeout(300); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 25000 }); await page.waitForTimeout(200); };
  const put = (id, spot) => page.evaluate(async ([id, spot]) => {
    const g = neo.scene.game;
    const t = g.things[g.round.items.indexOf(id)];
    const f = spot === 'f0' ? 0 : spot === 'f1' ? 1 : -1;
    const at = f >= 0 ? g.friends[f].node.getGlobalPosition() : g.places.get(spot).getGlobalPosition();
    await kit.dragTo(t.node, f >= 0 ? { x: at.x, y: at.y + 105 * neo.view.scale } : at);
  }, [id, spot]).then(() => page.waitForTimeout(350));
  const ring = () => page.evaluate(() => kit.tapOn(neo.scene.game.bell)).then(() => page.waitForTimeout(400));
  const home = (id) => page.evaluate(async (id) => (await import('/src/games/second-chance-shed/logic.ts')).ITEMS[id].place, id);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  await launch('second-chance-shed', 5, 'Mia', 'school');
  await settle();
  let s = await state();
  assert.equal(s.level, 5);
  assert.deepEqual(s.requests, ['pencils']);
  await ring();
  assert.deepEqual([(await state()).misses], [0], 'ringing with everything on the cart is free');
  for (const id of s.items) await put(id, id === 'tin' ? 'remake' : await home(id));
  s = await state();
  assert.equal(s.spots[s.items.indexOf('tin')], 'remake');
  await ring();
  assert.deepEqual([(await state()).misses, (await state()).hints], [1, 0], 'the tin in Remake leaves the pencils friend empty: one miss');
  await ring();
  assert.equal((await state()).misses, 1, 'ringing again on the same plan counts nothing');
  await put('tin', 'f0');
  s = await state();
  assert.equal(s.spots[s.items.indexOf('tin')], 'f0', 'the tin is with the pencils friend');
  await ring();
  assert.equal((await state()).finished, true, 'the plan works: the bell finishes the round');
  await page.waitForFunction(() => neo.scene.finished === true, null, { timeout: 60000 });
  assert.deepEqual(await score(), [1, 0], 'level 5 saved 1 miss, 0 hints');

  await launch('second-chance-shed', 6, 'Mia', 'school');
  await settle();
  s = await state();
  const both = s.items.find((id) => id === 'box' || id === 'tub');
  const pencils = s.requests.indexOf('pencils') === 0 ? 'f0' : 'f1';
  const other = pencils === 'f0' ? 'f1' : 'f0';
  for (const id of s.items) if (id !== both && id !== 'tin') await put(id, await home(id));
  await put(both, pencils);
  await put('tin', 'shelf');
  await ring();
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.glowing], [1, 0, false], 'the tempting plan: the other friend has nothing, one miss');
  await put('tin', other);
  await ring();
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.glowing], [2, 1, true], 'the tin with the wrong friend: second miss, the glow, one hint');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('second-chance-shed-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  await page.evaluate(() => neo.scene.game.askForHint());
  assert.equal((await state()).hints, 1, 'Show a hint on the glowing round adds nothing');
  await page.evaluate(() => neo.scene.game.askForHint());
  await page.waitForTimeout(500);
  s = await state();
  assert.equal(s.hints, 2, 'Show me one counts a hint');
  assert.equal(s.spots[s.items.indexOf('tin')], pencils, 'Show me one gave the tin to the pencils friend');
  assert.equal(s.spots[s.items.indexOf(both)], 'cart', 'the swap sent the both-fit thing back to the cart');
  await put(both, other);
  await ring();
  assert.equal((await state()).finished, true, 'the pairing works: the bell finishes the round');
  await page.waitForFunction(() => neo.scene.finished === true, null, { timeout: 60000 });
  assert.deepEqual(await score(), [2, 2], 'level 6 saved 2 misses, 2 hints');
  log('Second Chance Shed 5–6: free cart ring, tin in Remake (1 miss, unchanged ring free), tin to the friend; tempting plan and the tin on the wrong friend (2 misses, glow), Show a hint then Show me one (swap), portrait, finish 2/2; passed');
}

return { shedPlay, shedPlanPlay };
}
