import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
async function singBarnPlay() {
  const tapNotes = (n) => page.evaluate(async (n) => { for (let i = 0; i < n; i++) { kit.tap(512, 300); await kit.sleep(130); } }, n);
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { idx: g.idx, total: g.song.length, phase: g.phase, singer: g.singer, order: [...g.order], placed: [...g.placed] }; });
  // Each round draws one of eight songs from its seed; relaunch until the round sings the one under test.
  const launchTune = async (level, id) => {
    const seen = [];
    for (let k = 0; k < 60; k++) {
      await launch('sing-along-barn', level);
      seen.push(await page.evaluate(() => neo.scene.game.tune.id));
      if (seen.at(-1) === id) return;
    }
    assert.fail(`no ${id} round in 60 launches: ${seen.join(' ')}`);
  };
  // Level 1: the farm picks one animal; every tap is the next note, mashing fast still sings it, and nothing can be wrong.
  await launchTune(1, 'macdonald');
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  let st = await state();
  assert.deepEqual([st.phase, st.total, st.order.length], ['sing', 12 + 13, 1]);
  await tapNotes(12);
  st = await state();
  assert.equal(st.idx, 12);
  assert.equal(st.singer, st.order[0], 'the first friend comes out for the first verse');
  await tapNotes(4); await page.waitForTimeout(700);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
  await screenshot('sing-along-barn-1-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await tapNotes(8);
  st = await state();
  assert.deepEqual([st.idx, st.singer, st.placed], [24, st.order[0], []], 'one note is left of the last "O"');
  await tapNotes(1); await finished('sing-along-barn');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1);
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // Hot Cross Buns, level 2: two friends, a six-note opening, then "One a penny, two a penny, hot cross buns" for each; a friend answers on "buns" and has its moment at the door before the next comes out.
  await launchTune(2, 'buns');
  st = await state();
  assert.deepEqual([st.phase, st.total, st.order.length], ['sing', 6 + 2 * 11, 2]);
  await tapNotes(6);
  st = await state();
  assert.equal(st.singer, st.order[0], 'the first friend comes out after the opening');
  await tapNotes(3); await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  await screenshot('sing-along-barn-2-buns-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await tapNotes(7); st = await state();
  assert.deepEqual([st.idx, st.singer], [16, st.order[0]], 'the last "buns" of the first verse is still to come');
  await tapNotes(1); await page.waitForTimeout(150);
  assert.equal((await state()).singer, st.order[0], 'the friend answers at the door first');
  await page.waitForTimeout(900);
  assert.equal((await state()).singer, st.order[1], 'then the second friend comes out');
  await tapNotes(11); await finished('sing-along-barn');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // Mary Had a Little Lamb, level 1: a thirteen-note opening, then "little lamb, little lamb, its fleece was white as snow"; the friend answers on the last "lamb".
  await launchTune(1, 'mary');
  assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 13 + 12]);
  await tapNotes(24); await page.waitForTimeout(200); await tapNotes(1); await finished('sing-along-barn');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // Au Clair de la Lune, level 1: an eleven-note opening, then "Prête-moi ta plume, pour écrire un mot" for the friend, who answers on "mot".
  await launchTune(1, 'clair');
  assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 11 + 12]);
  await tapNotes(22); await page.waitForTimeout(200); await tapNotes(1); await finished('sing-along-barn');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // Rain, Rain, Go Away, level 1: a twelve-note opening, then "Rain, rain, go away, we want to play" for the friend, who answers on "play".
  await launchTune(1, 'rain');
  assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 12 + 9]);
  await tapNotes(20); await page.waitForTimeout(200); await tapNotes(1); await finished('sing-along-barn');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // The Itsy Bitsy Spider, level 1: a thirteen-note opening, then "climbed up the water spout" for the friend, who answers on "spout".
  await launchTune(1, 'itsy');
  assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 13 + 6]);
  await tapNotes(18); await page.waitForTimeout(200); await tapNotes(1); await finished('sing-along-barn');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // Bounce High, Bounce Low, level 1: a ten-note opening to Shiloh, then "bounce the ball to the <friend>", who answers on its name.
  await launchTune(1, 'bounce');
  assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 10 + 10]);
  await tapNotes(19); await page.waitForTimeout(200); await tapNotes(1); await finished('sing-along-barn');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // Ring Around the Rosie, level 1: a thirteen-note opening, then "Ashes, ashes, we all fall down" for the friend, who answers on "down".
  await launchTune(1, 'ring');
  assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 13 + 8]);
  await tapNotes(20); await page.waitForTimeout(200); await tapNotes(1); await finished('sing-along-barn');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // Level 5 upright: eight song cards in one row, each at least 100 units, none touching, all on screen; the rosie card sings Ring Around the Rosie.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
  await launch('sing-along-barn', 5); await page.waitForTimeout(1500);
  const cards = await page.evaluate(() => neo.scene.game.tuneCards.map((c) => ({ x: c.x - 110 * c.scale.x, w: 220 * c.scale.x, h: 200 * c.scale.y })));
  const vw = await page.evaluate(() => neo.view.w);
  assert.equal(cards.length, 8);
  for (const [k, c] of cards.entries()) {
    assert.ok(c.w >= 100 && c.h >= 100, `card ${k} is ${c.w} by ${c.h}`);
    assert.ok(c.x >= 0 && c.x + c.w <= vw, `card ${k} is on screen`);
    if (k > 0) assert.ok(c.x > cards[k - 1].x + cards[k - 1].w, `cards ${k - 1} and ${k} do not touch`);
  }
  await screenshot('sing-along-barn-5-eight-cards-portrait');
  await page.evaluate(() => kit.tapOn(neo.scene.game.tuneCards[7])); await page.waitForTimeout(1800);
  assert.equal(await page.evaluate(() => neo.scene.game.tune.id), 'ring');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  // Level 3: she asks two friends in (a second tap on the same friend does nothing), then they sing in the order she chose.
  await launchTune(3, 'macdonald');
  assert.equal((await state()).phase, 'invite');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(700);
  await screenshot('sing-along-barn-3-invite-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  // A friend is touched at its body, a little above its feet.
  for (const a of ['cat', 'cat', 'dog']) { await page.evaluate((a) => kit.tapOn(neo.scene.game.friends.get(a), 0, -66), a); await page.waitForTimeout(300); }
  await page.waitForFunction(() => neo.scene.game.phase === 'sing' && neo.scene.game.placed.length === 2 && neo.scene.game.tapLayer.eventMode === 'static', null, { timeout: 8000 });
  st = await state();
  assert.deepEqual(st.order, ['cat', 'dog']);
  assert.equal(st.total, 12 + 2 * 13);
  assert.equal(await page.evaluate(() => ['pig', 'duck', 'cow'].some((a) => neo.scene.game.friends.get(a).visible)), false, 'the friends not asked in have left');
  await screenshot('sing-along-barn-3-invited');
  await tapNotes(12 + 8);
  st = await state();
  assert.equal(st.singer, 'cat');
  await tapNotes(5);
  st = await state();
  assert.deepEqual([st.idx, st.singer], [25, 'dog'], 'the first verse is over: cat goes back to the bottom row and dog comes out');
  await tapNotes(st.total - st.idx - 3);
  // Leave on the last notes: the finale must not fire after the scene is gone.
  await page.evaluate(() => neo.go.land('music-mountain')); await scene('LandScene'); await page.waitForTimeout(900);
  // Level 4: the opening, then she picks who sings each verse; the song only grows by the friend picked, a stray tap while choosing does nothing, and the round ends after the third verse.
  await launchTune(4, 'macdonald');
  const stickers4 = await page.evaluate(() => kit.store.data.stickers.length);
  st = await state();
  assert.deepEqual([st.phase, st.total, st.order.length], ['sing', 12, 0]);
  await tapNotes(12);
  await page.waitForFunction(() => neo.scene.game.phase === 'invite' && neo.scene.game.tapLayer.eventMode === 'none', null, { timeout: 5000 });
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => ['cow', 'pig', 'duck', 'cat', 'dog'].every((a) => neo.scene.game.friends.get(a).visible)), true, 'all five friends are offered first');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(700);
  await screenshot('sing-along-barn-4-pick-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await tapNotes(2); assert.equal((await state()).idx, 12, 'a tap anywhere while choosing does not sing');
  await page.evaluate(() => kit.tapOn(neo.scene.game.friends.get('duck'), 0, -66)); await page.waitForTimeout(300);
  st = await state();
  assert.deepEqual([st.phase, st.order, st.singer, st.total], ['sing', ['duck'], 'duck', 25]);
  await tapNotes(13); await page.waitForFunction(() => neo.scene.game.phase === 'invite', null, { timeout: 5000 }); await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => ['cow', 'pig', 'cat', 'dog'].every((a) => neo.scene.game.friends.get(a).visible)), true, 'the four friends not yet chosen are offered');
  await page.evaluate(() => kit.tapOn(neo.scene.game.friends.get('duck'), 0, -66)); await page.waitForTimeout(300);
  assert.equal((await state()).phase, 'invite', 'a friend who has sung only says hello');
  await page.evaluate(() => kit.tapOn(neo.scene.game.friends.get('cat'), 0, -66)); await page.waitForTimeout(300);
  st = await state();
  assert.deepEqual([st.phase, st.order, st.singer, st.total], ['sing', ['duck', 'cat'], 'cat', 38]);
  await tapNotes(13); await page.waitForFunction(() => neo.scene.game.phase === 'invite', null, { timeout: 5000 }); await page.waitForTimeout(700);
  await page.evaluate(() => kit.tapOn(neo.scene.game.friends.get('pig'), 0, -66)); await page.waitForTimeout(300);
  st = await state();
  assert.deepEqual([st.phase, st.order, st.total], ['sing', ['duck', 'cat', 'pig'], 51]);
  await tapNotes(13); await finished('sing-along-barn');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers4 + 1);
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  assert.deepEqual(errors, []);
  log('Sing-Along Barn: levels 1, 3 and 4 (Old MacDonald) and Hot Cross Buns, Mary Had a Little Lamb and Ring Around the Rosie rounds, the eight-card chooser upright at level 5, one sticker with no misses or hints, tap-per-note song order, chosen friends in her order (all at once, then one verse at a time), portrait and leaving mid-song passed');
}

return { singBarnPlay };
}
