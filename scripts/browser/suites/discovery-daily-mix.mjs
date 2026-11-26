import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, screenshot }) {
  /** D10 slice 3: Today's six, Play all through the mix planner at a phone held upright (`DISCOVERY_ONLY=daily`). */
  async function discoveryDailyMix() {
    const states = () =>
      page.evaluate(async () => {
        const { mixMemory } = await import('/src/app/discovery.ts');
        return mixMemory.live(kit.store.data)?.state.items.map((i) => i.state) ?? null;
      });
    const tapNode = (path) =>
      page.evaluate((path) => {
        const node = path.split('.').reduce((o, k) => o[k], neo.scene);
        const p = node.toGlobal({ x: 0, y: 0 });
        kit.tap(p.x, p.y);
      }, path);
    const openSixPage = async () => {
      await page.evaluate(async () => {
        const { discoveryMemory, mixMemory } = await import('/src/app/discovery.ts');
        discoveryMemory.clear();
        mixMemory.end();
        kit.store.data.games = {};
        kit.store.data.profile.band = 'preschool';
        kit.store.data.settings.howToCards = false;
        neo.go.daily();
      });
      await scene('DailyScene');
    };
    const intoGame = () =>
      page.waitForFunction(() => !neo.switching && !!neo.scene.game && !neo.scene.finished, null, {
        timeout: 20000,
      });
    const finishRound = async () => {
      await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
      await page.waitForFunction(() => neo.scene.resultReady);
    };

    await page.setViewportSize({ width: 390, height: 844 });
    await openSixPage();
    await tapNode('playAll');
    await page.waitForFunction(() => !!neo.scene.sheet);
    assert.deepEqual(await states(), Array(6).fill('upcoming'));
    await screenshot('daily-mix-preview-upright');

    // Play: the first stop opens at the card's band and level, as a daily round.
    const first = await page.evaluate(() => [neo.scene.picks[0].mod.id, neo.scene.picks[0].level]);
    await tapNode('sheet.playButton');
    await intoGame();
    assert.deepEqual(
      await page.evaluate(() => [
        neo.scene.mod.id,
        neo.scene.startLevel,
        !!neo.scene.mixRound,
        'daily' in neo.scene.origin,
      ]),
      [first[0], first[1], true, true],
    );
    await finishRound();
    assert.deepEqual((await states()).slice(0, 2), ['played', 'upcoming']);

    // Home from the result returns to the preview on the six page, at the next stop.
    await page.evaluate(() => neo.scene.goHome());
    await scene('DailyScene');
    await page.waitForFunction(() => !!neo.scene.sheet);
    assert.deepEqual((await states()).slice(0, 2), ['played', 'upcoming']);

    // Skip hops over the second stop; the rest are skipped until the ending.
    for (let p = 1; p < 6; p++) {
      await tapNode('sheet.skipButton');
      await page.waitForTimeout(600);
    }
    assert.deepEqual(await states(), ['played', 'skipped', 'skipped', 'skipped', 'skipped', 'skipped']);
    await page.waitForFunction(() => neo.scene.sheet.ending);
    await screenshot('daily-mix-ending-upright');

    // Done ends the session on the six page: one tick, no flourish for a skipped game, and the cards stay playable.
    await tapNode('sheet.homeButton');
    await page.waitForFunction(() => !neo.scene.sheet);
    assert.equal(await states(), null);
    assert.equal(
      await page.evaluate(() => neo.scene.cards.filter((c) => c.node.getChildByLabel('tick').visible).length),
      1,
    );

    // A second Play all plays what is left: the ticked game starts played.
    await tapNode('playAll');
    await page.waitForFunction(() => !!neo.scene.sheet);
    assert.deepEqual(await states(), ['played', ...Array(5).fill('upcoming')]);
    await tapNode('sheet.backButton');
    assert.equal(await states(), null);
    log(
      'Today’s six: Play all preview, a finished round, Home back to the preview, Skip, the ending and Done',
    );
    await page.setViewportSize({ width: 1280, height: 800 });
    assert.deepEqual(errors, []);
  }

  return { discoveryDailyMix };
}
