import assert from 'node:assert/strict';

export async function homeBook({ page, errors, log, ready, scene, pickFirst, tap, screenshot }) {
  await page.goto(new URL('/', process.env.GAME_URL || 'http://127.0.0.1:5173').href);
  await ready();
  await scene('ChooserScene');
  await page.evaluate(() => {
    kit.store.entry.startBand = 'prek';
    kit.store.data.profile = { name: 'Mia', band: 'prek' };
    kit.store.data.world.band = 'prek';
    kit.store.data.settings.speech = false;
    kit.store.meet('sprout', 'Clover', 'pink', 'start');
    kit.store.meet('glider', 'Breeze', 'purple', 'test:glider');
    neo.go.start();
  });
  await pickFirst();
  await scene('HomeScene');
  const openBook = async () => {
    await tap('neo.scene.play');
    await scene('PlayScene');
    await tap('neo.scene.books');
    await scene('LibraryScene');
    await tap("neo.scene.cards.find(({book}) => book === 'collection').node");
    await scene('BookScene');
  };
  const progress = () =>
    page.evaluate(() =>
      JSON.stringify({
        games: kit.store.data.games,
        stickers: kit.store.data.stickers,
        journal: kit.store.data.journal,
        companion: kit.store.data.creatures.companion,
        projects: kit.store.data.projects,
      }),
    );
  const before = await progress();
  const kind = () => page.evaluate(() => neo.scene.pages[neo.scene.page].kind);
  const chosen = () => page.evaluate(() => kit.store.data.book.goal);
  const next = async () => {
    const point = await page.evaluate(() => {
      const pos = neo.scene.next.getGlobalPosition();
      const rect = document.querySelector('canvas').getBoundingClientRect();
      return { x: pos.x + rect.left, y: pos.y + rect.top };
    });
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.waitForTimeout(460);
    await page.mouse.up();
    await page.waitForTimeout(80);
  };
  await openBook();
  assert.equal(await kind(), 'goals');
  await tap('neo.scene.star');
  assert.equal(await chosen(), 'friend:welcome');
  await screenshot('book-landscape');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(300);
  await screenshot('book-upright');
  await tap('neo.scene.path');
  await scene('ProjectScene');
  assert.equal(await page.evaluate(() => neo.scene.newcomer.species), 'river');
  await tap('neo.scene.back');
  await scene('BookScene');
  assert.equal(await chosen(), 'friend:welcome');
  await tap('neo.scene.star');
  assert.equal(await chosen(), null);
  await next();
  assert.equal(await kind(), 'friends');
  await next();
  await tap('neo.scene.cards[0]');
  await page.waitForTimeout(300);
  await tap('neo.scene.cards[0]');
  await scene('FriendsScene');
  assert.equal(await page.evaluate(() => neo.scene.stageFriend.species), 'glider');
  await tap('neo.scene.dress');
  await scene('DressScene');
  await tap('neo.scene.back');
  await scene('FriendsScene');
  await tap('neo.scene.back');
  await scene('BookScene');
  assert.equal(await page.evaluate(() => neo.scene.pages[neo.scene.page].species), 'glider');
  assert.equal(await progress(), before, 'looking, choosing and navigating do not add progress');
  await tap('neo.scene.back');
  await scene('LibraryScene');
  await tap("neo.scene.cards.find(({book}) => book === 'collection').node");
  await scene('BookScene');

  // The project steps have their own play coverage. Set each step complete, then adopt through the visible ending.
  await page.evaluate(() => {
    kit.store.beginWelcome('prek', 'pretty');
    kit.store.welcome.steps = ['pretty', 'yummy', 'song'];
  });
  await tap('neo.scene.path');
  await scene('ProjectScene');
  await page.waitForFunction(() => neo.scene.ending === 'naming', null, { timeout: 25000 });
  await tap('neo.scene.names[0].node');
  await tap('neo.scene.arrow');
  await scene('BookScene');
  assert.equal(await kind(), 'goals');
  assert.equal(await page.evaluate(() => !!neo.scene.path), false);
  assert.equal(await page.evaluate(() => neo.scene.cards.length), 1);
  await tap('neo.scene.back');
  await scene('LibraryScene');
  await tap("neo.scene.cards.find(({book}) => book === 'collection').node");
  await scene('BookScene');
  assert.equal(await kind(), 'friends');
  while ((await kind()) !== 'things') await next();
  await tap('neo.scene.cards[0]');
  await scene('PlayScene');
  assert.ok(await page.evaluate(() => neo.scene.bed), 'the earned bed opens creature play');
  assert.deepEqual(errors, []);
  log('PASS: collection book choice, project return and adoption, friend preview, and basket bed');
}
