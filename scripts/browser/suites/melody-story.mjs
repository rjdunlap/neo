import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, tap, screenshot }) {
  /** The Missing Melody: Wren's story from Bumpy Hills, three story rounds, the ending and the song card once. */
  async function melodyStory() {
    const hilltop = () =>
      page.waitForFunction(
        () => neo.scene.constructor.name === 'MelodyScene' && !neo.switching && !neo.scene.busy,
        null,
        { timeout: 40000 },
      );
    const story = () => page.evaluate(() => JSON.parse(JSON.stringify(kit.store.melody)));
    const stickers = () => page.evaluate(() => kit.store.data.stickers.length);
    const inGame = (id) =>
      page.waitForFunction(
        (id) =>
          neo.scene.constructor.name === 'GameScene' &&
          !neo.switching &&
          neo.scene.mod.id === id &&
          !neo.scene.finished,
        id,
        { timeout: 20000 },
      );
    const after = (button) =>
      page
        .waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 })
        .then(() => page.waitForTimeout(500))
        .then(() => tap(`neo.scene.after.${button}`));
    await page.evaluate(() => {
      kit.store.entry.birth = null;
      kit.store.entry.startBand = 'preschool';
      kit.store.data.profile.band = 'preschool';
      kit.store.data.world.band = 'preschool';
      kit.store.retellStory('melody');
      kit.store.data.settings.placeLayout = 'path';
    });
    const before = await stickers();
    // Other home spots show nothing new; Bumpy Hills has the spot first on its path.
    await page.evaluate(() => neo.go.place('toddler'));
    await scene('PlaceScene');
    assert.equal(await page.evaluate(() => neo.scene.story), null);
    await page.evaluate(() => neo.go.place('preschool'));
    await scene('PlaceScene');
    assert.ok(
      await page.evaluate(() => {
        const s = neo.scene.story.node,
          m = neo.scene.landmarks[0].node;
        return (
          neo.scene.story.story === 'melody' && s.x < m.x && s.hitArea.width >= 100 && s.hitArea.height >= 100
        );
      }),
      'the story spot stands first, at full size',
    );
    await page.waitForTimeout(300);
    await tap('neo.scene.story.node');
    await hilltop();
    assert.deepEqual(
      await page.evaluate(() => [
        neo.scene.requests.map((r) => r.glow.visible),
        neo.scene.cardButton.visible,
      ]),
      [[true, false, false], false],
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(400);
    await screenshot('melody-start-portrait');
    assert.ok(
      await page.evaluate(() =>
        neo.scene.requests.every((r) => {
          const b = r.node.getBounds();
          return b.x >= 0 && b.x + b.width <= innerWidth;
        }),
      ),
      'cards fit in portrait',
    );
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);

    // Notes: a real Song Maker round at level 4, finished with a miss and a hint; it does not move the game level.
    const makerLevel = await page.evaluate(() => kit.store.stats('song-maker').level);
    await tap("neo.scene.requests.find(r => r.step === 'notes').button");
    await inGame('song-maker');
    assert.deepEqual(await page.evaluate(() => [neo.scene.band, neo.scene.level, neo.scene.story]), [
      'preschool',
      4,
      { story: 'melody', step: 'notes', level: 4 },
    ]);
    await page.waitForTimeout(400);
    await page.evaluate(() => neo.scene.finish({ misses: 1, hints: 1 }));
    assert.deepEqual((await story()).steps, ['notes']);
    assert.equal(await page.evaluate(() => kit.store.stats('song-maker').level), makerLevel);
    await after('home');
    await hilltop();
    assert.deepEqual(await page.evaluate(() => neo.scene.from), 'notes');

    // Leaving mid-round: Sound Garden opens at 2, then home before finishing leaves the step undone.
    await tap("neo.scene.requests.find(r => r.step === 'highlow').button");
    await inGame('sound-garden');
    assert.equal(await page.evaluate(() => neo.scene.level), 2);
    await page.evaluate(() => neo.scene.goHome());
    await hilltop();
    assert.deepEqual((await story()).steps, ['notes']);
    // A reload resumes: notes in bloom, the other two jobs to do.
    await page.reload();
    await ready();
    await page.evaluate(() => neo.go.melody());
    await hilltop();
    assert.deepEqual(await page.evaluate(() => neo.scene.requests.map((r) => r.glow.visible)), [
      false,
      true,
      false,
    ]);

    // High and low, then friends: both finish through the round's own finish, so help reaches the same ending.
    await tap("neo.scene.requests.find(r => r.step === 'highlow').button");
    await inGame('sound-garden');
    await page.waitForTimeout(400);
    await page.evaluate(() => neo.scene.finish({ misses: 3, hints: 1 }));
    await after('home');
    await hilltop();
    assert.equal(await page.evaluate(() => neo.scene.branch.visible), true);
    await tap("neo.scene.requests.find(r => r.step === 'friends').button");
    await inGame('sing-along-barn');
    assert.equal(await page.evaluate(() => neo.scene.level), 3);
    await page.waitForTimeout(400);
    await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
    await after('home');
    await page.waitForFunction(
      () =>
        neo.scene.constructor.name === 'MelodyScene' &&
        neo.scene.friends.length === 2 &&
        kit.store.melody.ended,
      null,
      { timeout: 60000 },
    );
    await page.waitForTimeout(400);
    await screenshot('melody-finale');
    await hilltop();
    assert.deepEqual(await story(), { steps: ['notes', 'highlow', 'friends'], ended: true, keepsake: true });
    assert.equal(await stickers(), before + 3, 'one sticker per round; the story adds none');

    // Back again: calm, the friends stay, no second ending; the card offers a retelling that keeps it.
    await page.evaluate(() => neo.go.melody());
    await hilltop();
    assert.deepEqual(await page.evaluate(() => [neo.scene.friends.length, neo.scene.cardButton.visible]), [
      2,
      true,
    ]);
    await tap('neo.scene.cardButton');
    await page.waitForTimeout(400);
    assert.ok(await page.evaluate(() => !!neo.scene.cardView?.retell));
    await tap('neo.scene.cardView.retell');
    await hilltop();
    assert.deepEqual(await story(), { steps: [], ended: false, keepsake: true }, 'retelling keeps the card');
    assert.equal(await page.evaluate(() => neo.scene.friends.length), 0);
    assert.equal(await stickers(), before + 3);
    // Home goes to Bumpy Hills; the subject layout offers the story as a card too.
    await tap('neo.scene.home');
    await scene('PlaceScene');
    assert.equal(await page.evaluate(() => neo.scene.band), 'preschool');
    await page.evaluate(() => {
      kit.store.data.settings.placeLayout = 'subjects';
      neo.go.place('preschool');
    });
    await scene('SubjectPlaceScene');
    await page.waitForTimeout(400);
    await tap("neo.scene.cards.find(c => c.id === 'melody').node");
    await hilltop();
    await page.evaluate(() => {
      kit.store.data.settings.placeLayout = 'path';
      kit.store.data.profile.band = 'prek';
      kit.store.data.world.band = 'prek';
    });
    assert.equal(errors.length, 0, errors.join('\n'));
    log(
      'Missing Melody: Bumpy Hills entry only, portrait cards, Song Maker 4 at the story level, leaving mid-round, reload resume, Sound Garden 2 with help, Sing-Along Barn 3, ending and card once, retelling, subject card passed',
    );
  }

  return { melodyStory };
}
