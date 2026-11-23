import assert from 'node:assert/strict';

/** RW10 slice 2: a school profile's colour goal, from the book into Paint Mixer level 5 and on to Dress's colour row. */
export async function homeColour({ page, errors, log, ready, scene, pickFirst, tap, screenshot }) {
  await page.goto(new URL('/', process.env.GAME_URL || 'http://127.0.0.1:5173').href);
  await ready();
  await scene('ChooserScene');
  await page.evaluate(() => {
    kit.store.entry.startBand = 'school';
    kit.store.data.profile = { name: 'Mia', band: 'school' };
    kit.store.data.world.band = 'school';
    kit.store.data.settings.speech = false;
    kit.store.data.settings.howToCards = false;
    kit.store.meet('sprout', 'Clover', 'pink', 'start');
    neo.go.start();
  });
  await pickFirst();
  await scene('HomeScene');
  await tap('neo.scene.play');
  await scene('PlayScene');
  await tap('neo.scene.books');
  await scene('LibraryScene');
  await tap("neo.scene.cards.find(({book}) => book === 'collection').node");
  await scene('BookScene');
  const here = () =>
    page.evaluate(() => {
      const p = neo.scene.pages[neo.scene.page];
      return {
        kind: p.kind,
        colour: p.goal?.colour ?? null,
        path: !!neo.scene.path,
        colours: p.colours ?? null,
      };
    });
  const next = async () => {
    await page.evaluate(async () => {
      const { x, y } = neo.scene.next.getGlobalPosition();
      await kit.drag(kit.line([x, y], [x, y], 26), 1, 28);
    });
  };
  assert.deepEqual(
    await here(),
    { kind: 'goals', colour: 'peach', path: true, colours: null },
    'the book opens on peach, unmixed',
  );
  assert.equal(
    await page.evaluate(() => neo.scene.pages.filter((p) => p.kind === 'goals').length),
    6,
    'one page per paint-shelf colour',
  );
  await tap('neo.scene.star');
  assert.equal(await page.evaluate(() => kit.store.data.book.goal), 'colour:peach');
  await screenshot('book-colour-goal');
  const level = await page.evaluate(() => kit.store.stats('paint-mixer').level);

  // The path: Paint Mixer level 5 with peach as the first bucket, whatever the seed.
  await tap('neo.scene.path');
  await page.waitForFunction(() => neo.scene.mod?.id === 'paint-mixer' && neo.scene.game?.state, null, {
    timeout: 15000,
  });
  assert.equal(await page.evaluate(() => neo.scene.level), 5);
  assert.equal(
    await page.evaluate(async () =>
      (await import('/src/games/paint-mixer/logic.ts')).mixName(neo.scene.game.state.sample),
    ),
    'peach',
    'the first bucket is the requested recipe',
  );
  const settle = async () => {
    await page.waitForTimeout(250);
    await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 40000 });
    await page.waitForTimeout(150);
  };
  const check = async () => {
    await page.evaluate(() => kit.tapOn(neo.scene.game.buttons.get('check')));
    await page.waitForTimeout(220);
  };
  await settle();
  await check();
  assert.equal(await page.evaluate(() => neo.scene.game.state.misses), 1, 'an empty Check is one miss');
  // Help to its finish, both buckets: the glow, then the ghost pours until Check glows.
  for (const bucket of [0, 1]) {
    await page.waitForFunction((b) => neo.scene.game.state.bucket === b && !neo.scene.game.busy, bucket, {
      timeout: 40000,
    });
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForFunction(
      () => neo.scene.game.state.glow?.at === 'check' && !neo.scene.game.pouring,
      null,
      {
        timeout: 60000,
      },
    );
    await check();
    await settle();
  }
  await page.waitForFunction(() => neo.scene.finished === true, null, { timeout: 30000 });
  assert.ok(
    await page.evaluate(() => kit.store.data.journal.found.includes('paint-mixer:peach')),
    'a helped bucket files its colour',
  );
  assert.equal(
    await page.evaluate(() => kit.store.stats('paint-mixer').level),
    level,
    'a round from the book leaves her saved level alone',
  );
  await page.waitForFunction(() => neo.scene.after?.home, null, { timeout: 15000 });
  await screenshot('book-colour-result');
  await page.evaluate(() => kit.tapOn(neo.scene.after.home));
  await scene('BookScene');
  assert.deepEqual(
    await here(),
    { kind: 'goals', colour: 'peach', path: false, colours: null },
    'back on peach, now mixed',
  );
  assert.equal(await page.evaluate(() => kit.store.data.book.goal), 'colour:peach', 'the choice is kept');
  await screenshot('book-colour-mixed');

  // Things holds what she mixed; a colour opens Dress for her companion.
  const toThings = await page.evaluate(
    () => neo.scene.pages.findIndex((p) => p.kind === 'things') - neo.scene.page,
  );
  for (let i = 0; i < toThings; i++) await next();
  const things = await here();
  assert.equal(things.kind, 'things');
  assert.ok(things.colours.includes('peach'), `peach is among her things (${things.colours})`);
  await screenshot('book-things');
  await tap('neo.scene.cards[0]');
  await scene('DressScene');
  const offered = () => page.evaluate(() => neo.scene.swatches.children.map((s) => s.color));
  const colours = await page.evaluate(() => neo.scene.colours);
  assert.ok(
    colours.includes('peach') && !colours.includes('lilac'),
    `only mixed colours join the row (${colours})`,
  );
  for (let i = 0; i < 4 && !(await offered()).includes('peach'); i++) await tap('neo.scene.rowNext');
  await tap("neo.scene.swatches.children.find((s) => s.color === 'peach')");
  assert.equal(await page.evaluate(() => neo.scene.friend.color), 'peach');
  assert.equal(await page.evaluate(() => kit.store.companion.look.color), 'peach');
  await screenshot('dress-colour-row');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await screenshot('dress-colour-row-upright');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(300);
  await tap('neo.scene.back');
  await scene('BookScene');
  assert.equal((await here()).kind, 'things', 'Back from Dress returns to her things');

  // Reload keeps the colour and the mixed jar.
  await page.reload();
  await ready();
  await scene('ChooserScene');
  await pickFirst();
  await scene('HomeScene');
  assert.equal(await page.evaluate(() => kit.store.companion.look.color), 'peach');
  assert.equal(await page.evaluate(() => neo.scene.pet.color), 'peach');
  assert.deepEqual(errors, []);
  log(
    'PASS: colour goal chosen, Paint Mixer level 5 on the requested peach (one miss, help to the finish), saved level unchanged, back to the book with peach mixed, Things → Dress → peach on the row → reload keeps it',
  );
}
