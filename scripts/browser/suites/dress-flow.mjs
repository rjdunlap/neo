import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, pickFirst, tap, screenshot }) {
async function dressFlow() {
  // RW06 slice 1: Friends → Dress → crown, scarf, then a sun hat that takes the crown's place → back, with the look kept everywhere.
  await page.evaluate(() => {
    kit.store.data.creatures = { owned: [{ id: 'pip0', species: 'sprout', name: 'Clover', look: { color: 'pink', worn: [] }, metAt: 'start' }, { id: 'riv0', species: 'river', name: 'Pebble', look: { color: 'blue', worn: [] }, metAt: 'dev:river' }], companion: 'pip0' };
    kit.store.data.settings.howToCards = false; kit.store.save(); kit.store.flush(); neo.go.start();
  });
  await pickFirst(); await scene('MapScene');
  await page.evaluate(() => neo.go.room()); await scene('RoomScene');
  await tap('neo.scene.basket'); await scene('FriendsScene');
  await tap('neo.scene.dress'); await scene('DressScene');
  const card = (item) => `neo.scene.cards.children.find((c) => c.item === '${item}')`;
  assert.equal(await page.evaluate(() => neo.scene.cards.children.length), 7, 'the sprout wears seven items');
  await tap(card('crown')); await page.waitForTimeout(300);
  await tap(card('scarf')); await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(() => ({ saved: kit.store.companion.look.worn, shown: neo.scene.friend.worn })), { saved: ['crown', 'scarf'], shown: ['crown', 'scarf'] });
  await tap(card('sunhat')); await page.waitForTimeout(500);
  assert.deepEqual(await page.evaluate(() => ({ saved: kit.store.companion.look.worn, shown: neo.scene.friend.worn })), { saved: ['scarf', 'sunhat'], shown: ['scarf', 'sunhat'] });
  await screenshot('dress-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await screenshot('dress-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  // Back to Friends with Clover still on the stage; then Pebble: her own six items, and her look untouched.
  await tap('neo.scene.back'); await scene('FriendsScene');
  assert.deepEqual(await page.evaluate(() => ({ previewed: neo.scene.previewed, worn: neo.scene.stageFriend.worn })), { previewed: 'pip0', worn: ['scarf', 'sunhat'] });
  await tap('neo.scene.cards.children[1]'); await page.waitForTimeout(300);
  await tap('neo.scene.dress'); await scene('DressScene');
  assert.equal(await page.evaluate(() => neo.scene.cards.children.length), 6, 'the river wears six items');
  await tap('neo.scene.back'); await scene('FriendsScene');
  assert.deepEqual(await page.evaluate(() => ({ previewed: neo.scene.previewed, pebble: kit.store.data.creatures.owned[1].look.worn })), { previewed: 'riv0', pebble: [] });
  // The treehouse resident wears it; dressing is not a round.
  await tap('neo.scene.back'); await scene('RoomScene');
  assert.deepEqual(await page.evaluate(() => neo.scene.pet.worn), ['scarf', 'sunhat']);
  assert.deepEqual(await page.evaluate(() => ({ stickers: kit.store.data.stickers.length, plays: Object.values(kit.store.data.games).reduce((n, g) => n + g.plays, 0) })), { stickers: 0, plays: 0 });
  // Reload: still dressed, and a guide-only game's guide wears it.
  await page.waitForTimeout(400);
  await page.reload(); await ready();
  await scene('ChooserScene'); await pickFirst(); await scene('MapScene');
  assert.deepEqual(await page.evaluate(() => kit.store.companion.look.worn), ['scarf', 'sunhat']);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; neo.go.game('bubble-pop'); });
  await scene('GameScene');
  assert.deepEqual(await page.evaluate(() => neo.scene.pet.worn), ['scarf', 'sunhat']);
  // Another profile's companion is undressed.
  await page.evaluate(async () => {
    const { selectPlayer } = await import('/src/app/players.ts');
    await selectPlayer(kit.store.addProfile());
    kit.store.meet('sprout', 'Mochi', 'teal', 'start');
    kit.store.data.settings.howToCards = false;
    neo.go.game('bubble-pop');
  });
  await scene('GameScene');
  assert.deepEqual(await page.evaluate(() => ({ saved: kit.store.companion.look.worn, guide: neo.scene.pet.worn })), { saved: [], guide: [] });
  assert.equal(errors.length, 0, errors.join('\n'));
  log('Dress: put on, a slot swap, back to Friends, the treehouse, reload, the guide, another profile undressed');
}

return { dressFlow };
}
