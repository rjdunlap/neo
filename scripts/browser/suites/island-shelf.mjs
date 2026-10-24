import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, tap, screenshot, next }) {
/** The child's island: a twinkle on games not yet played, a heart after a round, the favorites shelf (path) and Favorites card (subjects). */
async function islandShelf() {
  await page.evaluate(() => {
    kit.store.data.profile.band = 'toddler'; kit.store.data.world.band = 'toddler';
    kit.store.data.settings.placeLayout = 'path';
    kit.store.data.games = {}; kit.store.data.favorites = []; kit.store.data.stickers = [];
    neo.go.place('toddler');
  });
  await scene('PlaceScene');
  await page.waitForTimeout(400);
  const fresh = await page.evaluate(() => ({ landmarks: neo.scene.landmarks.map((l) => l.mod.id), sparkles: [...neo.scene.sparkles.keys()], shelf: neo.scene.shelf, quiet: [...neo.scene.sparkles.values()].every((s) => s.eventMode === 'none') }));
  assert.deepEqual(fresh.sparkles, fresh.landmarks, 'every unplayed game twinkles');
  assert.equal(fresh.shelf, null, 'no heart, no shelf');
  assert.ok(fresh.quiet, 'a twinkle never takes a touch');
  const id = fresh.landmarks[0];
  // Play one round of the first game (the shell's own finish, as a finished round does): one sticker, one play, no heart yet.
  await page.evaluate(() => kit.tapOn(neo.scene.landmarks[0].node, 0, -60));
  await scene('GameScene'); await page.waitForTimeout(1500);
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }); await page.waitForTimeout(700);
  const after = () => page.evaluate((id) => ({ plays: kit.store.stats(id).plays, stickers: kit.store.data.stickers.length, hearts: [...kit.store.data.favorites], lit: neo.scene.after.heart.children[1].children[1].visible }), id);
  assert.deepEqual(await after(), { plays: 1, stickers: 1, hearts: [], lit: false });
  await screenshot('island-heart-off');
  await tap('neo.scene.after.heart'); await page.waitForTimeout(150);
  assert.deepEqual((await after()).hearts, [id]); assert.equal((await after()).lit, true);
  await page.waitForTimeout(500);
  await tap('neo.scene.after.heart'); await page.waitForTimeout(150);
  assert.deepEqual((await after()).hearts, [], 'a second tap takes the heart back');
  await page.waitForTimeout(500);
  await tap('neo.scene.after.heart'); await page.waitForTimeout(150);
  assert.deepEqual((await after()).hearts, [id]);
  await screenshot('island-heart-on');
  assert.equal((await after()).stickers, 1, 'hearting never adds or takes a sticker');
  await page.waitForTimeout(500);
  await tap('neo.scene.after.home'); await scene('PlaceScene'); await page.waitForTimeout(500);
  const back = await page.evaluate(() => ({ sparkles: [...neo.scene.sparkles.keys()], shelf: neo.scene.shelf?.items.map((i) => i.mod.id) }));
  assert.deepEqual(back.shelf, [id], 'the hearted game stands on the shelf');
  assert.ok(!back.sparkles.includes(id) && back.sparkles.length === fresh.landmarks.length - 1, 'the played game stops twinkling and no other does');
  await screenshot('island-shelf');
  // The shelf is a way in: tap the game on it.
  await page.evaluate(() => kit.tapOn(neo.scene.shelf.items[0].node, 0, -50));
  await scene('GameScene');
  assert.equal(await page.evaluate(() => neo.scene.mod.id), id);
  // Subject layout: Little surprises' card leads at toddler, then Favorites with the one game inside; subjects with new games twinkle.
  await page.evaluate(() => { kit.store.data.settings.placeLayout = 'subjects'; neo.go.place('toddler'); });
  await scene('SubjectPlaceScene'); await page.waitForTimeout(400);
  const cards = await page.evaluate(() => neo.scene.cards.map((c) => ({ id: c.id, sparkle: !!c.sparkle })));
  assert.equal(cards[0].id, 'mix'); assert.equal(cards[1].id, 'favorites'); assert.equal(cards[1].sparkle, false);
  assert.ok(cards.slice(2).every((c) => c.sparkle), 'every subject still holds a game she has not played');
  await screenshot('island-favorites-card');
  await page.evaluate(() => kit.tapOn(neo.scene.cards[1].node)); await page.waitForTimeout(400);
  assert.deepEqual(await page.evaluate(() => ({ subject: neo.scene.state.subject, ids: neo.scene.cards.map((c) => c.id), sparkles: neo.scene.cards.map((c) => !!c.sparkle) })), { subject: 'favorites', ids: [id], sparkles: [false] });
  await page.evaluate(() => kit.tapOn(neo.scene.cards[0].node)); await scene('GameScene');
  assert.equal(await page.evaluate(() => neo.scene.mod.id), id);
  // Hearts and plays survive a reload, and a heart taken back leaves the card and the shelf.
  await page.evaluate(() => { kit.store.flush(); }); await page.waitForTimeout(400);
  await page.reload(); await ready();
  assert.deepEqual(await page.evaluate(() => [...kit.store.data.favorites]), [id]);
  await page.evaluate(() => { kit.store.data.settings.placeLayout = 'subjects'; kit.store.data.favorites = []; neo.go.place('toddler'); });
  await scene('SubjectPlaceScene'); await page.waitForTimeout(300);
  assert.ok(await page.evaluate(() => neo.scene.cards.every((c) => c.id !== 'favorites')), 'no hearts, no Favorites card');
  // Portrait: a full shelf of five clears the games and the arrows.
  await page.evaluate(async () => {
    const { GAMES } = await import('/src/games/registry.ts');
    kit.store.data.settings.placeLayout = 'path';
    kit.store.data.favorites = GAMES.filter((g) => g.bands.includes('toddler')).slice(0, 7).map((g) => g.id);
    neo.go.place('toddler');
  });
  await scene('PlaceScene'); await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => neo.scene.shelf.items.length), 5, 'a shelf holds five, the newest hearts');
  const clear = await page.evaluate(() => {
    const top = neo.scene.shelf.getBounds(); const arrows = [neo.scene.previous, neo.scene.next].filter((b) => b.visible).map((b) => b.getBounds());
    return { bottom: top.y + top.height, arrows: arrows.some((a) => a.x < top.x + top.width && a.x + a.width > top.x && a.y < top.y + top.height && a.y + a.height > top.y) };
  });
  assert.equal(clear.arrows, false, 'the arrows stay clear of the shelf');
  await screenshot('island-shelf-portrait');
  // "Next level" after a round: it plays the level above the one just finished (no card, since she has just seen it), and is absent at the top of her band's range.
  const playBubbles = async (level) => {
    await page.evaluate((level) => { kit.store.data.profile.band = 'toddler'; kit.store.data.settings.howToCards = false; kit.store.stats('bubble-pop').level = level; kit.store.stats('bubble-pop').history = []; kit.store.stats('bubble-pop').pinned = null; neo.go.game('bubble-pop', 'toddler'); }, level);
    await scene('GameScene'); await page.waitForTimeout(1200);
    await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
    await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }); await page.waitForTimeout(800);
  };
  await playBubbles(3);
  assert.equal(await page.evaluate(() => !!neo.scene.after.next), true, 'a round below the top of the range offers a next level');
  await screenshot('next-level-offer-portrait');
  await tap('neo.scene.after.next');
  await scene('GameScene'); await page.waitForTimeout(800);
  assert.deepEqual(await page.evaluate(() => [neo.scene.level, !!neo.scene.helpCard, neo.scene.game?.plan?.mode]), [4, false, 'color'], 'it plays level 4, straight in');
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }); await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => kit.store.stats('bubble-pop').level), 4, 'finishing it keeps her saved level where she played');
  // "Again" replays the level just finished, even when two smooth rounds have moved her saved level up.
  await page.evaluate(() => { const s = kit.store.stats('bubble-pop'); s.level = 3; s.history = [{ level: 3, misses: 0, hints: 0, seconds: 5, at: 1 }]; neo.go.game('bubble-pop', 'toddler'); });
  await scene('GameScene'); await page.waitForTimeout(1000);
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }); await page.waitForTimeout(800);
  assert.equal(await page.evaluate(() => kit.store.stats('bubble-pop').level), 4, 'two smooth rounds moved her saved level up');
  assert.equal(await page.evaluate(() => !!neo.scene.after.next), true, 'the next level is offered even then');
  await tap('neo.scene.after.again');
  await scene('GameScene'); await page.waitForTimeout(800);
  assert.deepEqual(await page.evaluate(() => [neo.scene.level, !!neo.scene.helpCard]), [3, false], 'again plays the level just finished, straight in');
  await page.setViewportSize({ width: 1024, height: 768 });
  await playBubbles(2);
  await screenshot('next-level-offer-landscape');
  await playBubbles(6);
  assert.equal(await page.evaluate(() => neo.scene.after.next), null, 'no next level at the top of her band');
  await page.evaluate(() => { kit.store.data.settings.howToCards = true; });
  assert.deepEqual(errors, []);
  log('Island: the celebration offers a next level that plays the level above with no card, keeps her saved level where she played, and is absent at the top of her band');
  log('Island: a fresh place twinkles on every game and has no shelf; a finished round gives one play and one sticker; the heart after a round toggles on, off and on, never touches stickers; the played game stops twinkling and the hearted one stands on the shelf and opens from it; the subject layout leads with a Favorites card (and drops it with no hearts); hearts survive a reload; a full shelf holds five in portrait clear of the arrows');
}

return { islandShelf };
}
