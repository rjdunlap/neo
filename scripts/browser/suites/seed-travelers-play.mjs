import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function seedTravelersPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('seed-travelers').history.at(-1);
        return [r.misses, r.hints];
      });
    const idle = () =>
      page.waitForFunction(
        () => {
          const g = neo.scene.game;
          return g && g.layout && !g.busy;
        },
        null,
        { timeout: 15000 },
      );
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 1: the bellows, one Replay, then the basket.
    await launch('seed-travelers', 1, 'Mia', 'preschool');
    await idle();
    assert.equal(
      await page.evaluate(() => neo.scene.game.basket.visible),
      false,
      'no basket before the first arrival',
    );
    await page.evaluate(() => kit.tapOn(neo.scene.game.bellows));
    await page.waitForFunction(
      () => neo.scene.game.state.place.plume === 'tray' && !neo.scene.game.busy,
      null,
      { timeout: 15000 },
    );
    await page.evaluate(() => kit.tapOn(neo.scene.game.bellows));
    await page.waitForFunction(() => neo.scene.game.shown?.replay === true, null, { timeout: 4000 });
    await idle();
    assert.equal(
      await page.evaluate(() => neo.scene.game.state.place.plume),
      'tray',
      'the replay delivers again',
    );
    await page.waitForFunction(() => neo.scene.game.basket.visible, null, { timeout: 4000 });
    await page.evaluate(() => kit.tapOn(neo.scene.game.basket));
    await finished('seed-travelers');
    assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

    // Level 3 in portrait: the plume with the critter stays, one requested hint, then both deliveries.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('seed-travelers', 3, 'Mia', 'prek');
    await idle();
    await page.evaluate(() => kit.tapOn(neo.scene.game.critter));
    await page.waitForFunction(() => neo.scene.game.state.chosen.carrier === 'fur', null, { timeout: 4000 });
    await page.evaluate(() => kit.tapOn(neo.scene.game.seeds.plume));
    await page.waitForFunction(() => neo.scene.game.busy, null, { timeout: 4000 });
    await idle();
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.state.place.plume, neo.scene.game.state.trials.length]),
      ['patch', 1],
      'the plume stayed and the board has one cell',
    );
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.equal(
      await page.evaluate(() => neo.scene.game.state.hints),
      1,
      'asking again while the glow is up counts nothing',
    );
    for (let i = 0; i < 4 && !(await page.evaluate(() => neo.scene.game.state.done)); i++) {
      await idle();
      await page.evaluate(() => {
        const g = neo.scene.game;
        const t = g.state.hintAction();
        kit.tapOn(t.unit ? g.seeds[t.unit] : t.carrier === 'breeze' ? g.bellows : g.critter);
      });
      await page.waitForTimeout(300);
      if (i === 1) {
        await idle();
        if (!(await page.evaluate(() => neo.scene.game.state.done)))
          await screenshot('seed-travelers-3-portrait');
      }
    }
    await finished('seed-travelers');
    assert.deepEqual(await score(), [0, 1], 'level 3 saved 0 misses, 1 hint');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    log(
      'Seed Travelers 1 and 3: level 1 bellows, one Replay, basket 0/0; level 3 portrait a plume-and-critter stay, Show a hint twice (counted once), both seeds delivered 0/1; passed',
    );
  }
  return { seedTravelersPlay };
}
