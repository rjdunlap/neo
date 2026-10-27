import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, pickFirst, tap, screenshot }) {
/**
 * RW14 slice 8: the last place first (`HOME_ONLY=last-place`). Explore has no postcard before a visit; after Counting Cove
 * its postcard stands above the four unchanged entries in both orientations, survives a reload, and opens the cove.
 */
async function homeLastPlace() {
  await page.goto(new URL('/', process.env.GAME_URL || 'http://127.0.0.1:5173').href); await ready();
  await scene('ChooserScene');
  await page.evaluate(() => {
    kit.store.data.creatures = { owned: [{ id: 'pip0', species: 'sprout', name: 'Clover', look: { color: 'pink', worn: [] }, metAt: 'start' }], companion: 'pip0' };
    kit.store.data.profile.band = 'preschool';
    kit.store.data.world.band = 'preschool';
    kit.store.data.explore = { last: null };
    kit.store.save(); kit.store.flush(); neo.go.start();
  });
  await pickFirst(); await scene('HomeScene');
  const explore = () => page.waitForFunction(() => neo.scene.constructor.name === 'ExploreScene' && !neo.switching && neo.scene.entry === null);
  await page.evaluate(() => neo.go.explore()); await explore();
  assert.equal(await page.evaluate(() => neo.scene.last), null, 'no postcard before her first visit');
  await page.evaluate(() => neo.go.land('counting-cove')); await scene('LocationScene');
  assert.equal(await page.evaluate(() => kit.store.data.explore.last), 'counting-cove');
  await page.evaluate(() => kit.store.flush()); await page.waitForTimeout(400);
  await page.reload(); await ready(); await pickFirst(); await scene('HomeScene');
  await page.evaluate(() => neo.go.explore()); await explore();
  for (const [w, h] of [[1024, 768], [768, 1024]]) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(500);
    const st = await page.evaluate(() => {
      const s = neo.scene, k = neo.view.scale, p = s.last.node.getBounds();
      const apart = s.cards.every((c) => { const b = c.node.getBounds(); return b.y >= p.maxY || b.maxY <= p.y || b.x >= p.maxX || b.maxX <= p.x; });
      return { id: s.last.id, entries: s.cards.map((c) => c.entry).join(), w: p.width / k, h: p.height / k, apart };
    });
    assert.deepEqual([st.id, st.entries, st.apart], ['counting-cove', 'places,favorites,all,family', true], JSON.stringify(st));
    assert.ok(st.w >= 150 && st.h >= 150, JSON.stringify(st));
    await screenshot(`explore-last-place-${w > h ? 'landscape' : 'portrait'}`);
  }
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await tap('neo.scene.last.node'); await scene('LocationScene');
  assert.equal(await page.evaluate(() => neo.scene.id), 'counting-cove');
  assert.deepEqual(errors, []);
  log('Last place: no postcard before a visit; Counting Cove\'s postcard above the four entries in both orientations, after a reload, opens the cove passed');
}

return { homeLastPlace };
}
