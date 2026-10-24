import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, pickFirst, screenshot }) {
/**
 * RW14 slice 5: the result in its place (`HOME_ONLY=result`). Duck Pond launched from Counting Cove's spot finishes on the
 * cove's sky behind a soft veil, in both orientations, with the result buttons on their formulas, and Back returns to the
 * cove; from Story Grove it shows the grove's night; with no origin, the home backdrop.
 */
async function homeResult() {
  await page.goto(new URL('/', process.env.GAME_URL || 'http://127.0.0.1:5173').href); await ready();
  await scene('ChooserScene');
  await page.evaluate(() => {
    kit.store.data.creatures = { owned: [{ id: 'pip0', species: 'sprout', name: 'Clover', look: { color: 'pink', worn: [] }, metAt: 'start' }], companion: 'pip0' };
    kit.store.data.profile.band = 'preschool';
    kit.store.data.world.band = 'preschool';
    kit.store.data.settings.howToCards = false;
    kit.store.save(); kit.store.flush(); neo.go.start();
  });
  await pickFirst(); await scene('HomeScene');
  const finishAndLook = async (name) => {
    await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
    await page.waitForFunction(() => neo.scene.after?.home, null, { timeout: 15000 });
    await page.waitForTimeout(700);
    for (const [w, h] of [[1024, 768], [768, 1024]]) {
      await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(500);
      const st = await page.evaluate(() => {
        const s = neo.scene, v = neo.view, a = s.after;
        return { place: !!s.resultPlace, sky: !!s.resultPlace?.sky, again: [a.again.x - v.w / 2, a.again.y / v.h], home: [a.home.x - v.w / 2, a.home.y / v.h], r: a.home.radius };
      });
      assert.ok(st.place, `${name}: a place behind the result`);
      assert.deepEqual([st.again[0], st.home[0], st.r * 2 >= 100], [-240, 240, true], JSON.stringify(st));
      assert.ok(Math.abs(st.again[1] - 0.72) < 1e-6 && Math.abs(st.home[1] - 0.72) < 1e-6, JSON.stringify(st));
      await screenshot(`result-${name}-${w > h ? 'landscape' : 'portrait'}`);
      if (w === 1024) log(`${name}: ${st.sky ? 'location sky' : 'home backdrop'}`);
    }
    await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  };
  await page.evaluate(() => neo.go.land('counting-cove')); await scene('LocationScene');
  await page.evaluate(() => kit.tapOn(neo.scene.showing.find((s) => s.mod?.id === 'duck-pond' || s.id === 'duck-pond')?.node ?? neo.scene.showing[0].node)); await scene('GameScene');
  await page.waitForTimeout(1500);
  const from = await page.evaluate(() => ({ id: neo.scene.mod.id, origin: neo.scene.origin }));
  assert.deepEqual(from.origin, { land: 'counting-cove', page: 0 }, JSON.stringify(from));
  await finishAndLook('cove');
  await page.evaluate(() => kit.tapOn(neo.scene.after.home)); await scene('LocationScene');
  assert.equal(await page.evaluate(() => neo.scene.id), 'counting-cove');
  await page.evaluate(() => neo.go.game('duck-pond', 'preschool', undefined, false, { land: 'story-grove' })); await scene('GameScene');
  await page.waitForTimeout(1500);
  await finishAndLook('grove');
  await page.evaluate(() => neo.go.game('duck-pond', 'preschool')); await scene('GameScene');
  await page.waitForTimeout(1500);
  await finishAndLook('no-origin');
  assert.deepEqual(errors, []);
  log(`Result in place: ${from.id} from Counting Cove (and Back to it), from Story Grove and with no origin, in both orientations passed`);
}

return { homeResult };
}
