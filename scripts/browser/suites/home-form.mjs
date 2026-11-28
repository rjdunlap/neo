import assert from 'node:assert/strict';

/** RW11 slice 2: a pre-K profile's blossom goal, from the book into Garden Grow level 2 and back to a grown form. */
export async function homeForm({ page, errors, log, ready, scene, pickFirst, tap, screenshot }) {
  await page.goto(new URL('/', process.env.GAME_URL || 'http://127.0.0.1:5173').href);
  await ready();
  await scene('ChooserScene');
  await page.evaluate(() => {
    kit.store.entry.startBand = 'prek';
    kit.store.data.profile = { name: 'Mia', band: 'prek' };
    kit.store.data.world.band = 'prek';
    kit.store.data.settings.speech = false;
    kit.store.data.settings.howToCards = false;
    kit.store.meet('sprout', 'Clover', 'pink', 'start');
    neo.go.start();
  });
  await pickFirst();
  await scene('HomeScene');
  await page.evaluate(() => neo.go.book());
  await scene('BookScene');
  const goals = await page.evaluate(() =>
    neo.scene.pages.filter((p) => p.kind === 'goals').map((p) => p.goal.id),
  );
  assert.ok(goals.includes('form:sprout:sun') && goals.includes('form:sprout:moon'), 'both blossoms offered');
  // Go to the moon blossom's page.
  await page.evaluate(() => {
    const i = neo.scene.pages.findIndex((p) => p.kind === 'goals' && p.goal.id === 'form:sprout:moon');
    neo.scene.page = i;
    neo.scene.buildPage();
  });
  assert.equal(await page.evaluate(() => !!neo.scene.path), true, 'the page has a path into the garden');
  await screenshot('book-form-goal');
  const level = await page.evaluate(() => kit.store.stats('garden-grow').level);
  await tap('neo.scene.path');
  await page.waitForFunction(() => neo.scene.mod?.id === 'garden-grow' && neo.scene.game, null, {
    timeout: 15000,
  });
  assert.equal(await page.evaluate(() => neo.scene.level), 2);
  await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 15000 });
  // Plant two beds, then rain: the first seed is the requested kind.
  for (const i of [0, 1]) {
    // The first touch after the round starts can be lost to the entrance, so retry until the seed is in.
    for (let tries = 0; tries < 4; tries++) {
      await page.evaluate((n) => kit.tapOn(neo.scene.game.beds[n].node), i);
      await page.waitForTimeout(350);
      if (await page.evaluate((n) => !!neo.scene.game.beds[n].seed, i)) break;
    }
  }
  assert.equal(
    await page.evaluate(() => neo.scene.game.beds[0].kind),
    'tulip',
    'the first seed is the moon kind',
  );
  await page.evaluate(() => kit.tapOn(neo.scene.game.cloud));
  await page.waitForFunction(() => neo.scene.finished === true, null, { timeout: 30000 });
  assert.deepEqual(
    await page.evaluate(() => kit.store.data.creatures.forms),
    ['sprout:moon'],
    'the moon blossom is grown',
  );
  assert.equal(
    await page.evaluate(() => kit.store.stats('garden-grow').level),
    level,
    'a round from the book leaves her saved level alone',
  );
  await page.waitForFunction(() => neo.scene.after?.home, null, { timeout: 20000 });
  await screenshot('book-form-result');
  await page.evaluate(() => kit.tapOn(neo.scene.after.home));
  await scene('BookScene');
  const left = await page.evaluate(() =>
    neo.scene.pages.filter((p) => p.kind === 'goals' && p.goal.kind === 'form').map((p) => p.goal.id),
  );
  assert.deepEqual(left, ['form:sprout:sun'], 'the grown blossom leaves the book; the other stays offered');
  assert.deepEqual(errors, [], 'no page errors');
  log('PASS: blossom goal from the book into Garden Grow level 2, form grown, book updated');
}
