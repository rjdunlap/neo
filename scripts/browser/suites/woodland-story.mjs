import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, tap, screenshot, finished }) {
/** The Woodland Picnic: Hazel's story from Wonder Woods, three story rounds, the ending and the photo once. */
async function woodlandStory() {
  const clearing = () => page.waitForFunction(() => neo.scene.constructor.name === 'WoodlandScene' && !neo.switching && !neo.scene.busy, null, { timeout: 40000 });
  const story = () => page.evaluate(() => JSON.parse(JSON.stringify(kit.store.woodland)));
  const stickers = () => page.evaluate(() => kit.store.data.stickers.length);
  const inGame = (id) => page.waitForFunction((id) => neo.scene.constructor.name === 'GameScene' && !neo.switching && neo.scene.mod.id === id && !neo.scene.finished, id, { timeout: 20000 });
  const after = (button) => page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }).then(() => page.waitForTimeout(500)).then(() => tap(`neo.scene.after.${button}`));
  await page.evaluate(() => { kit.store.entry.birth = null; kit.store.entry.startBand = 'school'; kit.store.data.profile.band = 'school'; kit.store.data.world.band = 'school'; kit.store.retellStory('woodland'); kit.store.data.settings.placeLayout = 'path'; });
  const before = await stickers();
  // Younger home spots show nothing new; Wonder Woods has the spot first on its path.
  await page.evaluate(() => neo.go.place('prek')); await scene('PlaceScene');
  assert.equal(await page.evaluate(() => neo.scene.story), null);
  await page.evaluate(() => neo.go.place('school')); await scene('PlaceScene');
  assert.ok(await page.evaluate(() => { const s = neo.scene.story.node, m = neo.scene.landmarks[0].node; return s.x < m.x && s.hitArea.width >= 100 && s.hitArea.height >= 100; }), 'the story spot stands first, at full size');
  await page.waitForTimeout(300);
  await tap('neo.scene.story.node'); await clearing();
  assert.deepEqual(await page.evaluate(() => [neo.scene.requests.map((r) => r.glow.visible), neo.scene.pole.visible, neo.scene.stump.visible, neo.scene.photoButton.visible]), [[true, false, false], false, false, false]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
  await screenshot('woodland-start-portrait');
  assert.ok(await page.evaluate(() => neo.scene.requests.every((r) => { const b = r.node.getBounds(); return b.x >= 0 && b.x + b.width <= innerWidth; })), 'cards fit in portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);

  // Invitations: a real Mail Carrier round at level 6, one wrong house first.
  const mailLevel = await page.evaluate(() => kit.store.stats('mail-carrier').level);
  await tap("neo.scene.requests.find(r => r.step === 'invitations').button");
  await inGame('mail-carrier');
  assert.deepEqual(await page.evaluate(() => [neo.scene.band, neo.scene.level, neo.scene.story]), ['school', 6, { story: 'woodland', step: 'invitations', level: 6 }]);
  await page.evaluate(async () => {
    const g = neo.scene.game;
    await kit.until(() => !!g.trip && !g.busy, 20000);
    const wrong = g.houses.findIndex((_, i) => i !== g.trip[0]);
    kit.tapOn(g.houses[wrong], 0, -50);
    await kit.sleep(300);
    for (let n = 0; n < 400 && !neo.scene.finished; n++) {
      const intent = g.autotouch();
      if (intent?.tap) kit.tapOn(intent.tap.on, intent.tap.x ?? 0, intent.tap.y ?? 0);
      await kit.sleep(250);
    }
  });
  await finished('mail-carrier');
  assert.ok(await page.evaluate(() => kit.store.stats('mail-carrier').history.at(-1).misses >= 1), 'the wrong house counted as a miss');
  assert.equal(await page.evaluate(() => kit.store.stats('mail-carrier').level), mailLevel, 'a story round does not move the game level');
  assert.deepEqual((await story()).steps, ['invitations']);
  await after('home'); await clearing();
  assert.deepEqual(await page.evaluate(() => [neo.scene.from, neo.scene.houses.every((h) => h.flag.visible)]), ['invitations', true]);

  // Leaving mid-round: Seesaw Balance opens at 7, then home before finishing leaves the step undone.
  await tap("neo.scene.requests.find(r => r.step === 'baskets').button");
  await inGame('seesaw-balance');
  assert.equal(await page.evaluate(() => neo.scene.level), 7);
  await page.evaluate(() => neo.scene.goHome()); await clearing();
  assert.deepEqual(await page.evaluate(() => [neo.scene.from, neo.scene.pole.visible]), ['baskets', false]);
  assert.deepEqual((await story()).steps, ['invitations']);
  // A reload resumes: flags up, baskets still to do.
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.woodland()); await clearing();
  assert.deepEqual(await page.evaluate(() => [neo.scene.houses.every((h) => h.flag.visible), neo.scene.requests.map((r) => r.glow.visible)]), [true, [false, true, false]]);

  // Baskets (with help) and the beat finish through the round's own finish: help reaches the same ending.
  await tap("neo.scene.requests.find(r => r.step === 'baskets').button");
  await inGame('seesaw-balance');
  await page.waitForTimeout(400);
  await page.evaluate(() => neo.scene.finish({ misses: 3, hints: 1 }));
  await after('home'); await clearing();
  assert.equal(await page.evaluate(() => neo.scene.pole.visible), true);
  await tap("neo.scene.requests.find(r => r.step === 'beat').button");
  await inGame('beat-builder');
  assert.deepEqual(await page.evaluate(() => [neo.scene.level, neo.scene.game.woodland.constructor.name]), [3, 'PicnicStage']);
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  await after('home');
  await page.waitForFunction(() => neo.scene.constructor.name === 'WoodlandScene' && neo.scene.friends.length === 3 && kit.store.woodland.ended, null, { timeout: 60000 });
  await page.waitForTimeout(400);
  await screenshot('woodland-finale');
  await clearing();
  assert.deepEqual(await story(), { steps: ['invitations', 'baskets', 'beat'], ended: true, keepsake: true });
  assert.equal(await stickers(), before + 3, 'one sticker per round; the story adds none');

  // Back again: calm, the friends stay, no second ending; the photo offers a retelling that keeps it.
  await page.evaluate(() => neo.go.woodland()); await clearing();
  assert.deepEqual(await page.evaluate(() => [neo.scene.friends.length, neo.scene.photoButton.visible]), [3, true]);
  await tap('neo.scene.photoButton'); await page.waitForTimeout(400);
  assert.ok(await page.evaluate(() => !!neo.scene.photoView?.retell));
  await tap('neo.scene.photoView.retell'); await clearing();
  assert.deepEqual(await story(), { steps: [], ended: false, keepsake: true }, 'retelling keeps the photo');
  assert.equal(await page.evaluate(() => neo.scene.friends.length), 0);
  assert.equal(await stickers(), before + 3);
  // Home goes to Wonder Woods; the subject layout offers the story as a card too.
  await tap('neo.scene.home'); await scene('PlaceScene');
  assert.equal(await page.evaluate(() => neo.scene.band), 'school');
  await page.evaluate(() => { kit.store.data.settings.placeLayout = 'subjects'; neo.go.place('school'); }); await scene('SubjectPlaceScene');
  await page.waitForTimeout(400);
  await tap("neo.scene.cards.find(c => c.id === 'woodland').node"); await clearing();
  await page.evaluate(() => { kit.store.data.settings.placeLayout = 'path'; kit.store.data.profile.band = 'prek'; kit.store.data.world.band = 'prek'; });
  assert.equal(errors.length, 0, errors.join('\n'));
  log('Woodland Picnic: Wonder Woods entry only, portrait cards, Mail Carrier 6 with a miss at the story level, leaving mid-round, reload resume, Seesaw 7 with help, Beat Builder 3 picnic stage, ending and photo once, retelling, subject card passed');
}

return { woodlandStory };
}
