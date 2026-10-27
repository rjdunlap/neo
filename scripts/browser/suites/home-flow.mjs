import { selectValue } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ homeMeadow, page, errors, log, ready, scene, pickFirst, tap, screenshot, homeFirstRun, homeResidents, homeButtons, homeLastPlace, homeResult, next }) {
async function homeFlow() {
  if (process.env.HOME_ONLY === 'meadow') return homeMeadow();
  if (process.env.HOME_ONLY !== undefined) selectValue(process.env.HOME_ONLY, ['first-run', 'result', 'residents', 'buttons', 'last-place'], 'HOME_ONLY');
  if (process.env.HOME_ONLY === 'first-run') return homeFirstRun();
  if (process.env.HOME_ONLY === 'result') return homeResult();
  if (process.env.HOME_ONLY === 'residents') return homeResidents();
  if (process.env.HOME_ONLY === 'buttons') return homeButtons();
  if (process.env.HOME_ONLY === 'last-place') return homeLastPlace();
  await page.goto(new URL('/', process.env.GAME_URL || 'http://127.0.0.1:5173').href); await ready();
  await scene('ChooserScene');
  // A preschool person with a kept tune; a second, toddler profile with its own friend.
  await page.evaluate(() => {
    kit.store.data.creatures = { owned: [{ id: 'pip0', species: 'sprout', name: 'Clover', look: { color: 'pink', worn: ['scarf'] }, metAt: 'start' }, { id: 'gli0', species: 'glider', name: 'Breeze', look: { color: 'yellow', worn: [] }, metAt: 'dev:glider' }], companion: 'pip0' };
    kit.store.data.profile.band = 'preschool';
    kit.store.keepCreation({ kind: 'tune', cols: 4, rows: 3, notes: [{ col: 0, row: 0 }, { col: 1, row: 1 }, { col: 2, row: 2 }, { col: 3, row: 1 }] });
    // Last seen at toddler: Home throws her birthday (RW08 slice 2).
    kit.store.data.world.band = 'toddler';
    kit.store.save(); kit.store.flush(); neo.go.start();
  });
  await pickFirst(); await scene('HomeScene');
  assert.deepEqual(await page.evaluate(() => ({ young: neo.scene.young, play: !!neo.scene.play, toy: !!neo.scene.toy, pet: neo.scene.pet.species, worn: neo.scene.pet.worn, link: !document.querySelector('.classic-link').hidden })), { young: false, play: true, toy: false, pet: 'sprout', worn: ['scarf'], link: true });
  // The birthday once, and the grown-ups' gear top right with the link below it.
  assert.deepEqual(await page.evaluate(() => ({ birthday: neo.scene.birthday, world: kit.store.data.world.band })), { birthday: true, world: 'preschool' });
  const corner = await page.evaluate(() => { const g = document.querySelector('.gear').getBoundingClientRect(), l = document.querySelector('.classic-link').getBoundingClientRect(); return { gear: !document.querySelector('.gear').hidden, below: l.top >= g.bottom, right: g.right > innerWidth - 80 }; });
  assert.deepEqual(corner, { gear: true, below: true, right: true });
  await page.waitForTimeout(400); await screenshot('home-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await screenshot('home-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  const before = await page.evaluate(() => JSON.stringify({ games: kit.store.data.games, stickers: kit.store.data.stickers, journal: kit.store.data.journal }));
  // Play with Clover: creature play, the ball three times; it repeats and nothing is recorded.
  await tap('neo.scene.play'); await scene('PlayScene');
  assert.equal(await page.evaluate(() => document.querySelector('.classic-link').hidden), true);
  for (let i = 1; i <= 3; i++) {
    await tap('neo.scene.toy.ball');
    await page.waitForFunction(() => !neo.scene.toy.flight && !neo.scene.toy.chasing, null, { timeout: 8000 });
    assert.deepEqual(await page.evaluate(() => ({ throws: neo.scene.toy.throws, fetches: neo.scene.toy.fetches })), { throws: i, fetches: i });
  }
  assert.equal(await page.evaluate(() => JSON.stringify({ games: kit.store.data.games, stickers: kit.store.data.stickers, journal: kit.store.data.journal })), before, 'the ball records nothing');
  await screenshot('play-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await screenshot('play-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  // The kept tune plays.
  await tap('neo.scene.plaque');
  await page.waitForFunction(() => neo.scene.singing, null, { timeout: 3000 });
  await page.waitForFunction(() => !neo.scene.singing, null, { timeout: 8000 });
  // RW08 slice 2: the books → the library (the journal and the Windy Picnic at preschool) → the journal → Back → the library.
  assert.equal(await page.evaluate(() => document.querySelector('.gear')), null, 'the gear belongs to Home');
  await tap('neo.scene.books'); await scene('LibraryScene');
  assert.deepEqual(await page.evaluate(() => neo.scene.cards.map((c) => c.book)), ['journal', 'windy']);
  await screenshot('library-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  await screenshot('library-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await tap('neo.scene.cards[0].node'); await scene('JournalScene');
  await tap('neo.scene.back'); await scene('LibraryScene');
  // One Windy Picnic step at the root: the blanket, saved once; the story's Back returns to the library, the library's to creature play.
  const picnic = () => page.waitForFunction(() => neo.scene.constructor.name === 'PicnicScene' && !neo.switching && !neo.scene.busy, null, { timeout: 30000 });
  await tap('neo.scene.cards[1].node'); await picnic();
  await tap("neo.scene.requests.find(r => r.step === 'blanket').button");
  await tap('neo.scene.hung.find(h => h.index === neo.scene.puzzle.target).node'); await picnic();
  assert.deepEqual(await page.evaluate(() => kit.store.picnic.steps), ['blanket']);
  await tap('neo.scene.home'); await scene('LibraryScene');
  await tap('neo.scene.back'); await scene('PlayScene');
  // Basket → Friends → Dress → Back → Friends (same friend) → Back → creature play.
  await tap('neo.scene.basket'); await scene('FriendsScene');
  await tap('neo.scene.cards.children[1]'); await page.waitForTimeout(300);
  await tap('neo.scene.dress'); await scene('DressScene');
  await tap('neo.scene.back'); await scene('FriendsScene');
  assert.equal(await page.evaluate(() => neo.scene.previewed), 'gli0');
  await tap('neo.scene.back'); await scene('PlayScene');
  // Dress → Home → Home.
  await tap('neo.scene.basket'); await scene('FriendsScene');
  await tap('neo.scene.dress'); await scene('DressScene');
  await tap('neo.scene.home'); await scene('HomeScene');
  // Leaving mid-bounce is clean.
  await tap('neo.scene.play'); await scene('PlayScene');
  await tap('neo.scene.toy.ball'); await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => !!neo.scene.toy.flight), true);
  await tap('neo.scene.home'); await scene('HomeScene');
  await page.waitForTimeout(400);
  // RW08: Explore's four entries → Places → Counting Cove → its Back → Places → Back → Explore → Back → Home.
  const explore = (entry, at = 0) => page.waitForFunction(({ entry, at }) => neo.scene.constructor.name === 'ExploreScene' && !neo.switching && neo.scene.entry === entry && (entry === null || neo.scene.page === at), { entry, at });
  await tap('neo.scene.explore'); await explore(null);
  assert.deepEqual(await page.evaluate(() => neo.scene.cards.map((c) => c.entry)), ['places', 'favorites', 'all', 'family']);
  assert.equal(await page.evaluate(() => document.querySelector('.classic-link')?.hidden), true);
  await screenshot('explore');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  await screenshot('explore-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await tap('neo.scene.cards[0].node'); await explore('places');
  // Every built location (RW13), Rainbow Meadow and Counting Cove first.
  assert.deepEqual(await page.evaluate(() => neo.scene.ids.slice(0, 2)), ['rainbow-meadow', 'counting-cove']);
  await tap('neo.scene.cards[1].node'); await scene('LocationScene');
  assert.equal(await page.evaluate(() => neo.scene.id), 'counting-cove');
  await tap('neo.scene.home'); await explore('places');
  await tap('neo.scene.back'); await explore(null);
  await tap('neo.scene.back'); await scene('HomeScene');
  assert.equal(await page.evaluate(() => document.querySelector('.classic-link')?.hidden), false);
  await page.waitForTimeout(400);
  // All games, page 2 → a game → its result → Back to All games (the same page) → Home.
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await tap('neo.scene.explore'); await explore(null);
  await tap('neo.scene.cards[2].node'); await explore('all', 0);
  const index = await page.evaluate(async () => { const { allGames } = await import('/src/content/explore.ts'); const { GAMES } = await import('/src/games/registry.ts'); const { LANDS } = await import('/src/content/lands.ts'); return allGames(kit.store.data.profile.band, GAMES, LANDS).map((g) => g.id); });
  assert.equal(await page.evaluate(() => [neo.scene.prev.visible, neo.scene.next.visible].join()), 'false,true');
  await tap('neo.scene.next'); await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(() => [neo.scene.page, neo.scene.prev.visible, neo.scene.cards.map((c) => c.mod?.id)]), [1, true, index.slice(4, 8)]);
  await screenshot('explore-all-page2');
  await tap('neo.scene.cards[0].node');
  await page.waitForFunction((id) => neo.scene.constructor.name === 'GameScene' && !neo.switching && neo.scene.mod.id === id, index[4], { timeout: 20000 });
  assert.deepEqual(await page.evaluate(() => neo.scene.origin), { explore: 'all', page: 1 });
  await page.waitForTimeout(600);
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  await page.waitForFunction(() => !!neo.scene.after?.house, null, { timeout: 20000 }); await page.waitForTimeout(600);
  const [hx, bx] = await page.evaluate(() => [neo.scene.after.house.x, neo.scene.after.home.x]);
  assert.ok(Math.abs(hx - bx) >= 120, 'Back and Home stand at least 120 apart');
  await screenshot('result-back-to-all');
  await tap('neo.scene.after.home'); await explore('all', 1);
  await tap('neo.scene.home'); await scene('HomeScene');
  // Favorites, newest first: an older kids' game says so and plays at its own band; nothing re-pins.
  const older = await page.evaluate(async () => { const { GAMES } = await import('/src/games/registry.ts'); const { ageOf } = await import('/src/content/explore.ts'); const g = GAMES.find((m) => ageOf(m, 'preschool') === 'bigger' && m.bands.includes('school')); kit.store.data.favorites = [GAMES[0].id, g.id]; return g.id; });
  await page.evaluate(() => neo.go.explore('favorites')); await explore('favorites', 0);
  assert.deepEqual(await page.evaluate(() => neo.scene.cards.map((c) => c.mod?.id)).then((ids) => ids[0]), older);
  const pinned = await page.evaluate((id) => kit.store.stats(id).pinned ?? null, older);
  await tap('neo.scene.cards[0].node');
  await page.waitForFunction((id) => neo.scene.constructor.name === 'GameScene' && !neo.switching && neo.scene.mod.id === id, older, { timeout: 20000 });
  assert.deepEqual(await page.evaluate(() => [neo.scene.band, neo.scene.origin]), ['school', { explore: 'favorites', page: 0 }]);
  assert.equal(await page.evaluate((id) => kit.store.stats(id).pinned ?? null, older), pinned);
  // No favorites: one big All games card.
  await page.evaluate(() => { kit.store.data.favorites = []; neo.go.explore('favorites'); }); await explore('favorites', 0);
  assert.deepEqual(await page.evaluate(() => neo.scene.cards.map((c) => c.kind + ':' + (c.entry ?? ''))), ['entry:all']);
  await screenshot('explore-no-favorites');
  // Family play → couch play → leave → back to Explore's Family play, in both orientations.
  for (const size of [{ width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(size); await page.evaluate(() => neo.go.explore()); await explore(null);
    await tap('neo.scene.cards[3].node'); await explore('family', 0);
    if (size.width < size.height) await screenshot('explore-family-portrait');
    await tap('neo.scene.cards[0].node'); await scene('CouchScene');
    await page.waitForTimeout(500);
    await page.evaluate(() => neo.scene.leave()); await explore('family', 0);
  }
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await page.evaluate(() => neo.go.hub()); await scene('HomeScene');
  // The youngest's Home: the ball right here, no Play picture.
  await page.evaluate(() => { kit.store.data.profile.band = 'toddler'; neo.go.hub(); }); await scene('HomeScene');
  assert.deepEqual(await page.evaluate(() => ({ young: neo.scene.young, play: !!neo.scene.play, toy: !!neo.scene.toy })), { young: true, play: false, toy: true });
  await tap('neo.scene.toy.ball');
  await page.waitForFunction(() => neo.scene.toy.fetches === 1, null, { timeout: 8000 });
  await screenshot('home-toddler');
  assert.equal(await page.evaluate(() => neo.scene.birthday), false, 'the birthday is thrown once');
  // RW08 slice 2: at lap, Little surprises leads All games' first page; a stop's Home comes back there with the sheet, and its Back ends the mix.
  await page.evaluate(() => { kit.store.data.profile.band = 'lap'; neo.go.explore('all', 0); }); await explore('all', 0);
  assert.deepEqual(await page.evaluate(() => neo.scene.cards.map((c) => c.kind).slice(0, 2)), ['mix', 'game']);
  await screenshot('explore-all-mix');
  await tap('neo.scene.cards[0].node');
  await page.waitForFunction(() => !!neo.scene.mix?.sheet, null, { timeout: 5000 });
  await tap('neo.scene.mix.sheet.playButton');
  await page.waitForFunction(() => neo.scene.constructor.name === 'GameScene' && !neo.switching && !!neo.scene.game, null, { timeout: 20000 });
  assert.deepEqual(await page.evaluate(() => [!!neo.scene.mixRound, neo.scene.origin]), [true, { place: 'lap' }]);
  await page.evaluate(() => neo.scene.leave()); await explore('all', 0);
  await page.waitForFunction(() => !!neo.scene.mix?.sheet, null, { timeout: 5000 });
  await tap('neo.scene.mix.sheet.backButton');
  assert.deepEqual(await page.evaluate(() => [neo.scene.constructor.name, neo.scene.mix.sheet, neo.scene.mix.live]), ['ExploreScene', null, false]);
  await page.evaluate(() => { kit.store.data.profile.band = 'toddler'; neo.go.hub(); }); await scene('HomeScene');
  // Who's playing → a second profile → its own Home and companion.
  await tap('neo.scene.who'); await scene('ChooserScene');
  await page.evaluate(async () => {
    const { selectPlayer } = await import('/src/app/players.ts');
    await selectPlayer(kit.store.addProfile());
    kit.store.meet('river', 'Pebble', 'blue', 'start');
    neo.go.hub();
  });
  await scene('HomeScene');
  assert.deepEqual(await page.evaluate(() => ({ pet: neo.scene.pet.species, worn: neo.scene.pet.worn })), { pet: 'river', worn: [] });
  // Reload: the root begins at the chooser again.
  await page.reload(); await ready();
  await scene('ChooserScene');
  assert.equal(errors.length, 0, errors.join('\n'));
  log('Home: chooser → Home by band, creature play ball ×3 unrecorded, tune, Friends/Dress chain, mid-bounce leave, Explore entries → Places → Counting Cove → Back chain, All games page 2 → game → Back to All games (same page) → Home, Favorites older launch and empty, Family play → couch → Explore both orientations, second profile; RW08 slice 2: birthday once, the gear, books → library → journal → Back, a Windy blanket step at the root → Back → library, Little surprises on All games page 1 → stop → Home → sheet → Back');
}

return { homeFlow };
}
