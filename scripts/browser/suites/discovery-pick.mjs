import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, screenshot }) {
  /** D7a: Pick for me on a lap-or-toddler home spot and a subject home spot, at a phone held upright (`DISCOVERY_ONLY=pick`). */
  async function discoveryPick() {
    const tapNode = (path) =>
      page.evaluate((path) => {
        const node = path.split('.').reduce((o, k) => o[k], neo.scene);
        const p = node.toGlobal({ x: 0, y: 0 });
        kit.tap(p.x, p.y);
      }, path);
    const openPlace = async (band, layout, sceneName) => {
      await page.evaluate(
        async ([band, layout]) => {
          const { pickMemory } = await import('/src/app/discovery.ts');
          pickMemory.forget();
          kit.store.data.profile.band = band;
          kit.store.data.settings.howToCards = false;
          kit.store.data.settings.placeLayout = layout;
          neo.go.place(band);
        },
        [band, layout],
      );
      await scene(sceneName);
    };
    const shown = () => page.evaluate(() => neo.scene.picker.sheet && neo.scene.picker.sheet.cardTitle());

    await page.setViewportSize({ width: 390, height: 844 });
    for (const [band, layout, sceneName] of [
      ['toddler', 'path', 'PlaceScene'],
      ['preschool', 'subjects', 'SubjectPlaceScene'],
    ]) {
      await openPlace(band, layout, sceneName);
      const saved = await page.evaluate(() => JSON.stringify(kit.store.data));
      await tapNode('picker.button');
      await page.waitForFunction(() => !!neo.scene.picker.sheet);
      const keys = await page.evaluate(() => neo.scene.picker.sheet.chipKeys());
      assert.ok(keys.includes('everything'), `${band}: Anything chip`);
      await screenshot(`pick-chooser-${band}-upright`);

      // One pick shows a game; Another walks the whole order once with no repeat, then the end line, then Again.
      await tapNode('picker.sheet.pickButton');
      const seen = [await shown()];
      await screenshot(`pick-card-${band}-upright`);
      // Two real taps on Another, then the rest of the order by calling it directly (a tap has a cooldown).
      for (let i = 0; i < 2; i++) {
        await tapNode('picker.sheet.anotherButton');
        await page.waitForTimeout(450);
        seen.push(await shown());
      }
      for (let i = 0; i < 400 && (await shown()) !== 'That was all of them'; i++) {
        await page.evaluate(() => neo.scene.picker.another());
        const t = await shown();
        if (t !== 'That was all of them') seen.push(t);
      }
      assert.ok(seen.length >= 1, `${band}: at least one game picked`);
      assert.equal(new Set(seen).size, seen.length, `${band}: no repeat before the order ends`);
      assert.equal(await shown(), 'That was all of them');
      await screenshot(`pick-end-${band}-upright`);
      assert.equal(
        await page.evaluate(() => JSON.stringify(kit.store.data)),
        saved,
        `${band}: nothing was saved`,
      );

      // Again starts a fresh order that does not open on the game last shown; Play opens that game from this home spot.
      await tapNode('picker.sheet.againButton');
      const first = await shown();
      assert.notEqual(first, seen[seen.length - 1], `${band}: Again avoids the last shown`);
      const id = await page.evaluate(() => neo.scene.picker.sheet && neo.scene.picker.shownId());
      await tapNode('picker.sheet.playButton');
      await page.waitForFunction(() => !neo.switching && !!neo.scene.game, null, { timeout: 20000 });
      assert.deepEqual(await page.evaluate(() => [neo.scene.mod.id, 'place' in neo.scene.origin]), [
        id,
        true,
      ]);
    }
    log('Pick for me: chooser, One pick, Another to the end, Again and Play at toddler and preschool');
    await page.setViewportSize({ width: 1280, height: 800 });
    assert.deepEqual(errors, []);
  }

  return { discoveryPick };
}
