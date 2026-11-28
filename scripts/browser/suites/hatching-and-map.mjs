import assert from 'node:assert/strict';

export function createSuite({ page, log, ready, scene, pickFirst, addFirstPlayer, tap, screenshot }) {
  async function hatchingAndMap() {
    await ready();
    assert.equal(await page.evaluate(() => kit.store.data.creatures.owned.length), 0);
    await addFirstPlayer();
    await scene('HatchScene');
    for (let i = 0; i < 4; i++) {
      await tap('neo.scene.egg');
      await page.waitForTimeout(180);
    }
    assert.equal(await page.evaluate(() => neo.scene.step), 'color');
    assert.equal(await page.evaluate(() => neo.scene.choices.children.length), 9);
    assert.equal(await page.evaluate(() => neo.scene.more.visible), false);
    // Paint Mixer 4: colours she has mixed (filed in her journal) are a second page of balls behind the page button.
    await page.evaluate(() => {
      kit.store.data.journal.found.push('paint-mixer:lilac', 'paint-mixer:peach');
      kit.store.save();
      neo.go.hatch(true);
    });
    await scene('HatchScene');
    await page.waitForFunction(() => neo.scene.step === 'color' && neo.scene.more?.visible);
    await tap('neo.scene.more');
    assert.deepEqual(
      await page.evaluate(() => ({ balls: neo.scene.choices.children.length, back: neo.scene.back.visible })),
      { balls: 3, back: true },
    );
    await tap('neo.scene.choices.children[1]');
    assert.equal(await page.evaluate(() => neo.scene.color), 'peach');
    await screenshot('hatch-mixed-colours');
    await tap('neo.scene.back');
    assert.equal(await page.evaluate(() => neo.scene.choices.children.length), 9);
    await tap('neo.scene.choices.children[4]');
    await screenshot('hatch-color');
    await tap('neo.scene.next');
    await tap('neo.scene.choices.children[3]');
    await page.locator('#pet-name').fill('Mochi');
    await page.locator('.pet-name-form button').click();
    await screenshot('hatch-name');
    await tap('neo.scene.next');
    await scene('HomeScene');
    assert.deepEqual(
      await page.evaluate(() => {
        const c = kit.store.companion;
        return { species: c.species, name: c.name, color: c.look.color, metAt: c.metAt };
      }),
      { species: 'sprout', name: 'Mochi', color: 'purple', metAt: 'start' },
    );
    await screenshot('map-lap');
    await page.waitForTimeout(600);
    await page.reload();
    await ready();
    assert.equal(await page.evaluate(() => kit.store.data.creatures.owned.length), 1);
    // "Who's playing?" opens Home's yard; its signpost is the island map: eleven lands, Home and the picnic.
    await pickFirst();
    await scene('HomeScene');
    await page.evaluate(() => neo.go.explore('places'));
    await scene('MapScene');
    assert.deepEqual(
      await page.evaluate(() => ({ lands: neo.scene.lands.length, home: neo.scene.homeBand })),
      { lands: 11, home: 'lap' },
    );
    // A land shows its games for her age and younger, and its signpost the bigger kids' games.
    await tap("neo.scene.lands.find(l => l.def.id === 'barnyard').node");
    await scene('LandScene');
    const barn = await page.evaluate(async () => {
      const { landFor, visibleIn, olderIn } = await import('/src/content/lands.ts');
      const { GAMES } = await import('/src/games/registry.ts');
      const land = landFor('barnyard');
      return {
        want: visibleIn(land, 'lap', GAMES).map((g) => g.id),
        older: olderIn(land, 'lap', GAMES).map((g) => g.id),
        mine: neo.scene.mine.map((m) => m.mod.id),
        shown: neo.scene.showing.map((m) => m.mod.id),
        back: neo.scene.older.map((m) => m.mod.id),
        sign: !!neo.scene.sign,
      };
    });
    assert.deepEqual(barn.mine, barn.want);
    assert.deepEqual(barn.shown, barn.want);
    assert.deepEqual(barn.back, barn.older);
    assert.equal(barn.sign, barn.older.length > 0);
    await screenshot('land-barnyard-lap');
    // A game opens at her band, and a single tap on the round's house returns to the land.
    await page.evaluate(() => kit.tapOn(neo.scene.mine[0].node, 0, -60));
    await scene('GameScene');
    assert.deepEqual(await page.evaluate(() => [neo.scene.mod.id, neo.scene.band, neo.scene.origin]), [
      barn.want[0],
      'lap',
      { land: 'barnyard', page: 0 },
    ]);
    await tap('neo.scene.home');
    await scene('LandScene');
    assert.equal(await page.evaluate(() => neo.scene.id), 'barnyard');
    // The location's Back goes to the island map, where the pet now waits by the barnyard; the map's Home is the yard.
    await tap('neo.scene.home');
    await scene('MapScene');
    assert.equal(await page.evaluate(() => neo.scene.petAt), 'barnyard');
    await screenshot('map-lap');
    await tap('neo.scene.home');
    await scene('HomeScene');
    // A grown-up moves her up a band: Home throws her a birthday, once.
    await page.evaluate(() => {
      kit.store.setBand('preschool');
      neo.go.hub();
    });
    await scene('HomeScene');
    assert.equal(await page.evaluate(() => neo.scene.birthday), true);
    await page.waitForFunction(() => kit.store.data.world.band === 'preschool', null, { timeout: 10000 });
    await screenshot('home-preschool');
    // A game whose youngest band is above preschool (Robot Path opens to preschool now, so it no longer counts as bigger kids' here).
    await page.evaluate(async () => {
      const { GAMES } = await import('/src/games/registry.ts');
      const { bandRank, lowestBand } = await import('/src/progress/bands.ts');
      const older = GAMES.find((g) => bandRank(lowestBand(g.bands)) > bandRank('preschool'));
      kit.store.stats(older.id).history.push({ level: 1, misses: 0, hints: 0, seconds: 90, at: Date.now() });
    });
    // The grown-ups' gear on Home: a short press only hints, holding it for two seconds opens the page.
    const gear = page.locator('.gear');
    const gearBox = await gear.boundingBox();
    await page.mouse.move(gearBox.x + gearBox.width / 2, gearBox.y + gearBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.up();
    assert.equal(await page.locator('.parent').count(), 0, 'a short press opens nothing');
    assert.ok(
      await gear.evaluate((el) => el.classList.contains('gear--hint')),
      'a short press shows the hint',
    );
    await page.mouse.down();
    await page.locator('.parent').waitFor({ timeout: 4000 });
    await page.mouse.up();
    // A game for older players shows up in the week's summary even though it isn't for her age yet.
    assert.ok(
      await page.locator('.parent', { hasText: 'A game for older players' }).count(),
      'bigger-kids row',
    );
    await page.locator('[data-band="prek"]').click();
    await page.locator('#p-name').fill('Mia');
    await page.locator('#p-pet-name').fill('Clover');
    // Her mixed colours are offered there too, marked as mixed in Paint Mixer.
    assert.deepEqual(await page.locator('#p-pet-color option').allTextContents(), [
      'teal',
      'pink',
      'blue',
      'purple',
      'green',
      'yellow',
      'orange',
      'red',
      'peach (mixed in Paint Mixer)',
      'lilac (mixed in Paint Mixer)',
    ]);
    await page.locator('#p-pet-color').selectOption('pink');
    await page.locator('[data-done]').click();
    await scene('HomeScene');
    // The grown-ups' page edits the companion: its name, its colour, and Home's friend turned to that colour.
    assert.deepEqual(
      await page.evaluate(() => ({
        name: kit.store.companion.name,
        color: kit.store.companion.look.color,
        recolored: (neo.scene.pet.rig.skin ?? neo.scene.pet.rig.mesh).filters.length,
      })),
      { name: 'Clover', color: 'pink', recolored: 1 },
    );
    assert.deepEqual(await page.evaluate(() => kit.store.data.world), { band: 'prek' });
    await page.waitForTimeout(3000);
    await screenshot('home-prek');
    log(
      'Hatching, save reload, Home, the island map, a land and its return, birthdays, and parent settings passed',
    );
  }

  return { hatchingAndMap };
}
