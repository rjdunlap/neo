import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, pickFirst, screenshot }) {
/**
 * RW14 slice 3: one meaning per button at the root (`HOME_ONLY=buttons`). Counting Cove shows Back (Places' picture) and a
 * house beside it in both orientations; a game's how-to card and round show a back arrow, not a house; the result's Back
 * returns to the location, and the location's house goes Home.
 */
async function homeButtons() {
  await page.goto(new URL('/', process.env.GAME_URL || 'http://127.0.0.1:5173').href); await ready();
  await scene('ChooserScene');
  await page.evaluate(() => {
    kit.store.data.creatures = { owned: [{ id: 'pip0', species: 'sprout', name: 'Clover', look: { color: 'pink', worn: [] }, metAt: 'start' }], companion: 'pip0' };
    kit.store.data.profile.band = 'preschool';
    kit.store.data.world.band = 'preschool';
    kit.store.data.settings.howToCards = true;
    kit.store.save(); kit.store.flush(); neo.go.start();
  });
  await pickFirst(); await scene('HomeScene');
  await page.evaluate(() => neo.go.land('counting-cove')); await scene('LocationScene');
  for (const [w, h] of [[1024, 768], [768, 1024]]) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(500);
    const st = await page.evaluate(() => {
      const s = neo.scene, hb = s.heading.getBounds(), k = neo.view.scale;
      return { back: s.home.meaning, house: s.house?.meaning, r: s.house?.radius, houseRight: s.house.getBounds().maxX, headingLeft: hb.x, k };
    });
    assert.deepEqual({ back: st.back, house: st.house }, { back: 'back', house: 'home' });
    assert.ok(st.r * 2 >= 100 && st.houseRight < st.headingLeft, JSON.stringify(st));
    await screenshot(`buttons-location-${w > h ? 'landscape' : 'portrait'}`);
  }
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await page.evaluate(() => kit.tapOn(neo.scene.showing[0].node)); await scene('GameScene');
  await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(() => neo.scene.helpCard?.backButton?.meaning), 'back', 'the how-to card goes Back');
  await screenshot('buttons-howto');
  await page.evaluate(() => neo.scene.playFromIntro()); await page.waitForTimeout(800);
  assert.equal(await page.evaluate(() => neo.scene.home.meaning), 'back', 'the round leaves Back');
  await screenshot('buttons-round');
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  await page.waitForFunction(() => neo.scene.after?.home, null, { timeout: 15000 });
  await page.waitForTimeout(600);
  assert.deepEqual(await page.evaluate(() => ({ back: neo.scene.after.home.meaning, house: neo.scene.after.house?.meaning })), { back: 'back', house: 'home' });
  await screenshot('buttons-result');
  await page.evaluate(() => kit.tapOn(neo.scene.after.home)); await scene('LocationScene');
  assert.equal(await page.evaluate(() => neo.scene.id), 'counting-cove');
  await page.waitForTimeout(500);
  await page.evaluate(() => kit.tapOn(neo.scene.house)); await scene('HomeScene');
  assert.deepEqual(errors, []);
  log('Buttons: location Back + house in both orientations, how-to Back, round Back, result Back to the location, house Home passed');
}

return { homeButtons };
}
