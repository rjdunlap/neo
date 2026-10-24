import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, pickFirst, addFirstPlayer, tap, screenshot, profiles }) {
/** RW05 slice 1: the hatch meets a sprout, Friends changes the companion, and the choice follows reload, profiles and reset. */
async function friendsFlow() {
  await ready();
  await addFirstPlayer();
  await scene('HatchScene');
  for (let i = 0; i < 4; i++) { await tap('neo.scene.egg'); await page.waitForTimeout(180); }
  await tap('neo.scene.next'); await page.waitForTimeout(300);
  await tap('neo.scene.choices.children[2]'); await page.waitForTimeout(300); // Mochi, the sprout's second name
  await tap('neo.scene.next');
  await scene('MapScene');
  const mochi = await page.evaluate(() => kit.store.companion);
  assert.deepEqual({ species: mochi.species, name: mochi.name, metAt: mochi.metAt }, { species: 'sprout', name: 'Mochi', metAt: 'start' });
  // 1. The guide in a guide-only game is a sprout, and {pet} is Mochi.
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; neo.go.game('bubble-pop'); });
  await scene('GameScene');
  assert.deepEqual(await page.evaluate(async () => ({ species: neo.scene.pet.species, pet: (await import('/src/audio/voice.ts')).voice.pet })), { species: 'sprout', pet: 'Mochi' });
  // 2. A development seed meets a river; the treehouse's basket opens Friends with both cards, Mochi ringed.
  const pebble = await page.evaluate(() => kit.store.meet('river', 'Pebble', 'blue', 'dev:river').id);
  assert.equal(await page.evaluate(() => kit.store.meet('river', 'Again', 'red', 'dev:river').name), 'Pebble', 'meeting is idempotent on its token');
  await page.evaluate(() => neo.go.room()); await scene('RoomScene');
  await page.waitForTimeout(400); await screenshot('friends-treehouse');
  await tap('neo.scene.basket'); await scene('FriendsScene');
  assert.deepEqual(await page.evaluate(() => ({ cards: neo.scene.cards.children.length, previewed: neo.scene.previewed, stage: neo.scene.stageFriend.species })), { cards: 2, previewed: mochi.id, stage: 'sprout' });
  await screenshot('friends-landscape');
  // Tapping Pebble's card previews her and saves nothing.
  await tap('neo.scene.cards.children[1]');
  assert.deepEqual(await page.evaluate(() => ({ stage: neo.scene.stageFriend.species, companion: kit.store.data.creatures.companion })), { stage: 'river', companion: mochi.id });
  // Come with me on the current companion would only say so; on Pebble it chooses her, at once, and returns to the treehouse.
  await tap('neo.scene.come'); await scene('RoomScene');
  assert.deepEqual(await page.evaluate(() => ({ room: neo.scene.pet.species, companion: kit.store.data.creatures.companion })), { room: 'river', companion: pebble });
  // Choosing is not mastery: no sticker, no round recorded.
  assert.deepEqual(await page.evaluate(() => ({ stickers: kit.store.data.stickers.length, plays: Object.values(kit.store.data.games).reduce((n, g) => n + g.plays, 0) })), { stickers: 0, plays: 0 });
  // 3. Reload: the chooser's card shows the river portrait; the guide is a river named Pebble; a large-pet game builds the stand-in pip.
  await page.waitForTimeout(400);
  await page.reload(); await ready();
  await scene('ChooserScene'); await page.locator('.chooser__play canvas').first().waitFor();
  await screenshot('friends-chooser');
  await pickFirst(); await scene('MapScene');
  assert.equal(await page.evaluate(() => kit.store.companion.name), 'Pebble');
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; neo.go.game('splish-splash'); });
  await scene('GameScene');
  assert.deepEqual(await page.evaluate(async () => ({ guide: neo.scene.pet.species, pet: (await import('/src/audio/voice.ts')).voice.pet })), { guide: 'river', pet: 'Pebble' });
  // 4. Another profile has its own collection, never Pebble.
  await page.evaluate(async () => {
    const { selectPlayer } = await import('/src/app/players.ts');
    const other = kit.store.addProfile();
    await selectPlayer(other);
  });
  assert.equal(await page.evaluate(() => kit.store.companion), null);
  await page.evaluate(async () => { const { selectPlayer } = await import('/src/app/players.ts'); await selectPlayer(kit.store.profiles[0].id); });
  assert.equal(await page.evaluate(() => kit.store.companion?.name), 'Pebble');
  // 5. Start over keeps her friends and her choice; undo brings back the save whole.
  await page.evaluate(() => kit.store.addSticker('bubble-pop', 3));
  await page.evaluate(() => kit.store.reset());
  assert.deepEqual(await page.evaluate(() => ({ stickers: kit.store.data.stickers.length, friend: kit.store.companion.name, owned: kit.store.data.creatures.owned.length })), { stickers: 0, friend: 'Pebble', owned: 2 });
  await page.evaluate(() => kit.store.undo());
  assert.deepEqual(await page.evaluate(() => ({ stickers: kit.store.data.stickers.length, friend: kit.store.companion.name })), { stickers: 1, friend: 'Pebble' });
  // 6. Friends in portrait.
  await page.evaluate(() => neo.go.friends()); await scene('FriendsScene');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await screenshot('friends-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  assert.equal(errors.length, 0, errors.join('\n'));
  log('Friends: hatch meets a sprout, Friends previews and chooses, reload, profiles and reset keep the companion');
}

return { friendsFlow };
}
