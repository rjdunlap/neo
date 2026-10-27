import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
async function seaLiftPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, misses: g.state.misses, hints: g.state.hints, index: g.state.index, picked: g.state.picked.length, hinted: g.state.hinted, car: g.carAt, waiting: g.waiting.map((w) => w.stop).join(',') }; });
  const idle = () => page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, { timeout: 20000 });
  const sticker = (n) => page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 40000 });
  const tapStop = (stop) => page.evaluate((stop) => { const g = neo.scene.game; const b = g.L.landings.get(stop); const p = g.tapLayer.toGlobal({ x: b.x + b.w / 2, y: b.y + b.h / 2 }); kit.tap(p.x, p.y); }, stop);
  const botStep = () => page.evaluate(async () => {
    const g = neo.scene.game;
    if (!g || neo.scene.finished) { await kit.sleep(150); return 'done'; }
    const it = g.autotouch();
    if (!it) { await kit.sleep(150); return 'wait'; }
    const p = it.tap.on.toGlobal({ x: it.tap.x ?? 0, y: it.tap.y ?? 0 }); kit.tap(p.x, p.y);
    await kit.sleep(400);
    return 'move';
  });
  const playOut = async (n) => { for (let guard = 0; guard < 120 && !(await page.evaluate(() => neo.scene.finished)); guard++) await botStep(); await sticker(n); };

  // Level 1, the authored round: the duck wants three above the water. Two above is one miss (twice is still one), then a requested hint.
  await launch('sea-lift', 1); await idle();
  let n = await page.evaluate(() => kit.store.data.stickers.length);
  await tapStop(0); await page.waitForTimeout(200);
  assert.equal((await state()).misses, 0, 'the dock the lift waits at is not a miss');
  await tapStop(2); await idle();
  let st = await state(); assert.deepEqual([st.misses, st.car, st.index], [1, 0, 0], 'a wrong stop is one miss and the lift comes back to the water');
  await tapStop(2); await idle();
  assert.equal((await state()).misses, 1, 'the same wrong stop again counts nothing more');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(150);
  await page.evaluate(() => neo.scene.game.askForHint());
  st = await state(); assert.deepEqual([st.hints, st.hinted], [1, true], 'Show a hint glows once and counts once');
  await screenshot('sea-lift-1');
  await playOut(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 1]);

  // Level 3, the authored deepest-first case: two below the water before five below is one miss, and the penguin stays put.
  await launch('sea-lift', 3); await idle();
  n = await page.evaluate(() => kit.store.data.stickers.length);
  assert.equal((await state()).waiting, '-5,-2,3', 'the fish, penguin and cat wait at their stops');
  await tapStop(1); await page.waitForTimeout(200);
  assert.equal((await state()).misses, 0, 'an empty landing is not a miss');
  await tapStop(-2); await idle();
  st = await state(); assert.deepEqual([st.misses, st.picked, st.waiting], [1, 0, '-5,-2,3'], 'the -2 before -5 mistake: one miss, nobody boards');
  await tapStop(-5); await idle();
  assert.equal((await state()).picked, 1, 'the deepest friend boards');
  await playOut(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 0]);

  // Level 2 upright: the zig-zag landings and the lift mid-shaft, riding through the water.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('sea-lift', 2); await idle(); await page.waitForTimeout(300);
  const target = await page.evaluate(() => neo.scene.game.state.items[0].ride.to);
  await tapStop(target); await page.waitForTimeout(650);
  await screenshot('sea-lift-2-portrait');
  await idle();
  await page.setViewportSize({ width: 1024, height: 768 });

  // Level 4, the authored round: the fish at three below, the duck at four above, cards 1, 7 and 8. A landing is free; the 1 is one
  // miss (the lift rides it out and comes back, the card dims); the same card again is nothing; Show a hint glows the 7.
  const tapCard = (value) => page.evaluate((value) => { const g = neo.scene.game; const i = g.cards.findIndex((c) => c.value === value); const b = g.C.cards[i]; const p = g.tapLayer.toGlobal({ x: b.x + b.w / 2, y: b.y + b.h / 2 }); kit.tap(p.x, p.y); }, value);
  const cardAlpha = (value) => page.evaluate((value) => neo.scene.game.cards.find((c) => c.value === value).node.alpha, value);
  await launch('sea-lift', 4); await idle();
  n = await page.evaluate(() => kit.store.data.stickers.length);
  assert.deepEqual(await page.evaluate(() => neo.scene.game.cards.map((c) => c.value)), [1, 7, 8], 'the authored cards');
  assert.equal((await state()).car, -3, 'the lift waits with the fish at three below');
  await tapStop(4); await page.waitForTimeout(200);
  assert.equal((await state()).misses, 0, 'a landing tap is free at level 4');
  await tapStop(1); await page.waitForTimeout(300);
  st = await state(); assert.deepEqual([st.misses, st.index, st.busy], [0, 0, false], "a landing whose number matches a card is still free, not that card");
  await tapCard(1); await idle();
  st = await state(); assert.deepEqual([st.misses, st.car, st.index], [1, -3, 0], 'a wrong card is one miss and the lift returns to the fish');
  assert.ok((await cardAlpha(1)) < 0.5, 'the wrong card dims');
  await tapCard(1); await page.waitForTimeout(200);
  assert.equal((await state()).misses, 1, 'a dimmed card counts nothing more');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(150);
  st = await state(); assert.deepEqual([st.hints, st.hinted], [1, true], 'Show a hint glows the right card once');
  await screenshot('sea-lift-4');
  await tapCard(7); await idle();
  st = await state(); assert.deepEqual([st.index, st.car, st.misses], [1, -1, 1], 'the 7 sends the lift to the duck, then the penguin case begins');
  await playOut(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 1]);

  // Level 5, the authored round: the duck at four above. Its own stop is free; two below is one miss; four below is the twin. The
  // turtle at the dock is its own twin.
  await launch('sea-lift', 5); await idle();
  n = await page.evaluate(() => kit.store.data.stickers.length);
  assert.equal((await state()).car, 4, 'the duck rides at four above');
  await tapStop(4); await page.waitForTimeout(200);
  assert.equal((await state()).misses, 0, "the friend's own stop is free");
  await tapStop(-2); await idle();
  st = await state(); assert.deepEqual([st.misses, st.car, st.index], [1, 4, 0], 'a wrong stop is one miss and the lift returns to the duck');
  await tapStop(-4); await idle();
  st = await state(); assert.deepEqual([st.index, st.car], [1, -2], 'the twin at four below, then the fish case begins');
  for (let guard = 0; guard < 40 && (await state()).index < 3; guard++) await botStep();
  await idle();
  st = await state(); assert.deepEqual([st.index, st.car], [3, 0], 'the turtle waits at the dock');
  await tapStop(0); await idle();
  assert.equal((await state()).index, 4, 'the dock is its own twin');
  await playOut(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 0]);

  // Level 4 upright: the card column beside the shaft.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('sea-lift', 4); await idle(); await page.waitForTimeout(300);
  assert.ok(await page.evaluate(() => !!neo.scene.game.C), 'the card column lays out upright');
  await screenshot('sea-lift-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, [], 'page errors');
  log('Sea Lift: level 1 with the dock tap free, one wrong stop twice and a requested hint, level 3 with the deeper-friend miss, level 2 upright mid-ride, level 4 with a free landing, one wrong card (dimmed, free again) and a requested hint, level 5 with the own stop free, one wrong stop and the dock twin, level 4 upright');
}

return { seaLiftPlay };
}
