import assert from 'node:assert/strict';

export function createSuite({ page, log, ready, scene, pickFirst, addFirstPlayer, tap, screenshot }) {
async function hatchingAndMap() {
  await ready();
  assert.equal(await page.evaluate(() => kit.store.data.creatures.owned.length), 0);
  await addFirstPlayer();
  await scene('HatchScene');
  for (let i = 0; i < 4; i++) { await tap('neo.scene.egg'); await page.waitForTimeout(180); }
  assert.equal(await page.evaluate(() => neo.scene.step), 'color');
  assert.equal(await page.evaluate(() => neo.scene.choices.children.length), 9);
  await tap('neo.scene.choices.children[4]');
  await screenshot('hatch-color');
  await tap('neo.scene.next');
  await tap('neo.scene.choices.children[3]');
  await page.locator('#pet-name').fill('Mochi');
  await page.locator('.pet-name-form button').click();
  await screenshot('hatch-name');
  await tap('neo.scene.next');
  await scene('MapScene');
  assert.deepEqual(await page.evaluate(() => { const c = kit.store.companion; return { species: c.species, name: c.name, color: c.look.color, metAt: c.metAt }; }), { species: 'sprout', name: 'Mochi', color: 'purple', metAt: 'start' });
  await screenshot('map-lap');
  await page.waitForTimeout(600);
  await page.reload(); await ready();
  assert.equal(await page.evaluate(() => kit.store.data.creatures.owned.length), 1);
  // "Who's playing?" opens the island map: eleven lands, her home spot (her age place) and the picnic.
  await pickFirst(); await scene('MapScene');
  assert.deepEqual(await page.evaluate(() => ({ lands: neo.scene.lands.length, home: neo.scene.homeBand })), { lands: 11, home: 'lap' });
  // A land shows its games for her age and younger, and its signpost the bigger kids' games.
  await tap("neo.scene.lands.find(l => l.def.id === 'barnyard').node"); await scene('LandScene');
  const barn = await page.evaluate(async () => {
    const { landFor, visibleIn, olderIn } = await import('/src/content/lands.ts');
    const { GAMES } = await import('/src/games/registry.ts');
    const land = landFor('barnyard');
    return { want: visibleIn(land, 'lap', GAMES).map((g) => g.id), older: olderIn(land, 'lap', GAMES).map((g) => g.id), mine: neo.scene.mine.map((m) => m.mod.id), shown: neo.scene.showing.map((m) => m.mod.id), back: neo.scene.older.map((m) => m.mod.id), sign: !!neo.scene.sign };
  });
  assert.deepEqual(barn.mine, barn.want); assert.deepEqual(barn.shown, barn.want); assert.deepEqual(barn.back, barn.older);
  assert.equal(barn.sign, barn.older.length > 0);
  await screenshot('land-barnyard-lap');
  // A game opens at her band, and holding home comes back to the land.
  await page.evaluate(() => kit.tapOn(neo.scene.mine[0].node, 0, -60)); await scene('GameScene');
  assert.deepEqual(await page.evaluate(() => [neo.scene.mod.id, neo.scene.band, neo.scene.origin]), [barn.want[0], 'lap', { land: 'barnyard', page: 0 }]);
  await page.mouse.move(62, 62); await page.mouse.down();
  await scene('LandScene'); await page.mouse.up();
  assert.equal(await page.evaluate(() => neo.scene.id), 'barnyard');
  // The island button goes back to the map, where the pet now waits by the barnyard; the home spot holds every lap game.
  await tap('neo.scene.home'); await scene('MapScene');
  assert.equal(await page.evaluate(() => neo.scene.petAt), 'barnyard');
  await screenshot('map-lap');
  await tap('neo.scene.home'); await scene('PlaceScene');
  assert.equal(await page.evaluate(() => neo.scene.band), 'lap');
  const lapGames = await page.evaluate(async () => (await import('/src/app/scenes/PlaceScene.ts')).gamesFor('lap').map((g) => g.id));
  assert.deepEqual(await page.evaluate(() => neo.scene.landmarks.map((l) => l.mod.id)), lapGames);
  await screenshot('place-lap');
  await tap('neo.scene.home'); await scene('MapScene');
  // An older home spot's path swipes; its games play at the band nearest pre-K that each has.
  await page.evaluate(() => neo.go.place('prek')); await scene('PlaceScene');
  assert.equal(await page.evaluate(() => neo.scene.band), 'prek');
  assert.ok(await page.evaluate(() => neo.scene.maxScroll > 0), 'pre-K games need a swipe');
  // A swipe that starts on a game scrolls the land instead of opening the game.
  const from = await page.evaluate(() => { const p = neo.scene.landmarks[2].node.getGlobalPosition(); return [p.x, p.y - 60]; });
  await page.mouse.move(from[0], from[1]); await page.mouse.down();
  for (let x = from[0]; x >= from[0] - 320; x -= 20) await page.mouse.move(x, from[1]);
  await page.mouse.up(); await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => neo.scene.constructor.name), 'PlaceScene');
  const swiped = await page.evaluate(() => neo.scene.scroll);
  assert.ok(swiped > 200, `swipe scrolled ${swiped}`);
  await tap('neo.scene.next'); await page.waitForTimeout(600);
  assert.ok(await page.evaluate((s) => neo.scene.scroll > s, swiped));
  await tap('neo.scene.previous'); await page.waitForTimeout(600);
  await screenshot('place-prek');
  const picked = await page.evaluate(() => { const l = neo.scene.landmarks.find((l) => { const x = l.node.getGlobalPosition().x; return x > 250 && x < 800; }); kit.tapOn(l.node, 0, -60); return l.mod.id; });
  await scene('GameScene');
  const expectBand = await page.evaluate(async (id) => { const { playBand } = await import('/src/progress/bands.ts'); const { gameById } = await import('/src/games/registry.ts'); return playBand(gameById(id).bands, 'prek'); }, picked);
  assert.equal(await page.evaluate(() => neo.scene.band), expectBand);
  // Holding home returns to the place it came from.
  await page.mouse.move(62, 62); await page.mouse.down();
  await scene('PlaceScene'); await page.mouse.up();
  assert.equal(await page.evaluate(() => neo.scene.band), 'prek');
  await tap('neo.scene.home'); await scene('MapScene');
  // A grown-up moves her up a band: the pet has a birthday and the home spot becomes her new age place.
  await page.evaluate(() => { kit.store.setBand('preschool'); neo.go.hub(); });
  await scene('MapScene');
  assert.equal(await page.evaluate(() => neo.scene.birthday), true);
  await page.waitForFunction(() => neo.scene.homeBand === 'preschool' && neo.scene.home.scale.x === 1, null, { timeout: 10000 });
  await screenshot('map-preschool');
  // A game whose youngest band is above preschool (Robot Path opens to preschool now, so it no longer counts as bigger kids' here).
  await page.evaluate(async () => {
    const { GAMES } = await import('/src/games/registry.ts'); const { bandRank, lowestBand } = await import('/src/progress/bands.ts');
    const older = GAMES.find((g) => bandRank(lowestBand(g.bands)) > bandRank('preschool'));
    kit.store.stats(older.id).history.push({ level: 1, misses: 0, hints: 0, seconds: 90, at: Date.now() });
  });
  // The grown-ups' gear on the map: a short press only hints, holding it for two seconds opens the page.
  const gear = page.locator('.gear');
  const gearBox = await gear.boundingBox();
  await page.mouse.move(gearBox.x + gearBox.width / 2, gearBox.y + gearBox.height / 2);
  await page.mouse.down(); await page.waitForTimeout(300); await page.mouse.up();
  assert.equal(await page.locator('.parent').count(), 0, 'a short press opens nothing');
  assert.ok(await gear.evaluate((el) => el.classList.contains('gear--hint')), 'a short press shows the hint');
  await page.mouse.down();
  await page.locator('.parent').waitFor({ timeout: 4000 });
  await page.mouse.up();
  // A game for bigger kids, played from a signpost, shows up in the week's summary even though it isn't for her age yet.
  assert.ok(await page.locator('.parent', { hasText: 'A game for bigger kids, from a signpost' }).count(), 'bigger-kids row');
  await page.locator('[data-band="prek"]').click();
  await page.locator('#p-name').fill('Mia');
  await page.locator('#p-pet-name').fill('Clover');
  await page.locator('#p-pet-color').selectOption('pink');
  await page.locator('[data-done]').click(); await scene('MapScene');
  // The grown-ups' page edits the companion: its name, its colour, and the map's friend turned to that colour.
  assert.deepEqual(await page.evaluate(() => ({ name: kit.store.companion.name, color: kit.store.companion.look.color, recolored: (neo.scene.pip.rig.skin ?? neo.scene.pip.rig.mesh).filters.length })), { name: 'Clover', color: 'pink', recolored: 1 });
  assert.deepEqual(await page.evaluate(() => kit.store.data.world), { band: 'prek' });
  await page.waitForTimeout(3000);
  await screenshot('map-prek');
  log('Hatching, save reload, the lands map, a land and its return, the home spot, swiping, birthdays, and parent settings passed');
}

return { hatchingAndMap };
}
