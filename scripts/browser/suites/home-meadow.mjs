import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, pickFirst, screenshot }) {
/**
 * RW14 slice 4: the illustrated Rainbow Meadow (`HOME_ONLY=meadow`). Places shows the meadow's postcard; the meadow draws
 * its picture over the whole view with no code-drawn sun, clouds or scenery and its games on plates, in both orientations;
 * Counting Cove (no picture) is unchanged; a round launched there finishes on the picture; Explore's postcard shows it.
 */
async function homeMeadow() {
  await page.goto(new URL('/', process.env.GAME_URL || 'http://127.0.0.1:5173').href); await ready();
  await scene('ChooserScene');
  await page.evaluate(() => {
    kit.store.data.creatures = { owned: [{ id: 'pip0', species: 'river', name: 'Ripple', look: { color: 'blue', worn: [] }, metAt: 'start' }], companion: 'pip0' };
    kit.store.data.profile.band = 'preschool';
    kit.store.data.world.band = 'preschool';
    kit.store.data.settings.howToCards = false;
    kit.store.save(); kit.store.flush(); neo.go.start();
  });
  await pickFirst(); await scene('HomeScene');
  const pictured = (node) => { const walk = (n) => (n.texture && n.texture.width >= 400) || (n.children ?? []).some(walk); return walk(node); };
  await page.evaluate(() => neo.go.explore('places')); await scene('ExploreScene'); await page.waitForTimeout(500);
  const cards = await page.evaluate((src) => { const walk = eval(src); return neo.scene.cards.map((c) => [c.id, walk(c.node)]); }, `(${pictured})`);
  assert.deepEqual(cards.filter(([, p]) => p).map(([id]) => id), ['rainbow-meadow'], JSON.stringify(cards));
  await screenshot('meadow-places');
  const look = () => page.evaluate(() => {
    const s = neo.scene, v = neo.view, pic = s.options.backdropImage, b = pic?.getBounds();
    return { id: s.id, picture: !!pic, sun: !!s.backdrop.sun, clouds: s.backdrop.clouds.length, scenery: !!s.scenery,
      covers: !!b && b.x <= 1 && b.y <= 1 && b.x + b.width >= v.w * v.scale - 1 && b.y + b.height >= v.h * v.scale - 1,
      spots: s.showing.length, visible: s.showing.every((m) => m.node.visible), resident: s.resident?.species ?? null };
  });
  await page.evaluate(() => neo.go.land('rainbow-meadow')); await scene('LocationScene');
  for (const [w, h] of [[1024, 768], [768, 1024]]) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(500);
    const st = await look();
    assert.deepEqual({ ...st, spots: st.spots > 0 }, { id: 'rainbow-meadow', picture: true, sun: false, clouds: 0, scenery: false, covers: true, spots: true, visible: true, resident: 'sprout' }, JSON.stringify(st));
    await screenshot(`meadow-${w > h ? 'landscape' : 'portrait'}`);
  }
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await page.evaluate(() => neo.go.land('counting-cove')); await scene('LocationScene'); await page.waitForTimeout(300);
  const cove = await look();
  assert.deepEqual({ picture: cove.picture, scenery: cove.scenery }, { picture: false, scenery: true }, JSON.stringify(cove));
  await page.evaluate(() => neo.go.land('rainbow-meadow')); await scene('LocationScene'); await page.waitForTimeout(300);
  await page.evaluate(() => kit.tapOn(neo.scene.showing[0].node)); await scene('GameScene');
  await page.waitForTimeout(1500);
  assert.equal(await page.evaluate(() => neo.scene.origin?.land), 'rainbow-meadow');
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  await page.waitForFunction(() => neo.scene.after?.home, null, { timeout: 15000 });
  await page.waitForTimeout(700);
  for (const [w, h] of [[1024, 768], [768, 1024]]) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(500);
    assert.ok(await page.evaluate(() => !!neo.scene.resultPlace?.picture), 'the result stands on the meadow picture');
    await screenshot(`meadow-result-${w > h ? 'landscape' : 'portrait'}`);
  }
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await page.evaluate(() => kit.tapOn(neo.scene.after.home)); await scene('LocationScene');
  assert.equal(await page.evaluate(() => neo.scene.id), 'rainbow-meadow');
  await page.evaluate(() => neo.go.explore()); await scene('ExploreScene'); await page.waitForTimeout(500);
  const last = await page.evaluate((src) => { const walk = eval(src); return neo.scene.last && [neo.scene.last.id, walk(neo.scene.last.node)]; }, `(${pictured})`);
  assert.deepEqual(last, ['rainbow-meadow', true]);
  await screenshot('meadow-explore-postcard');
  assert.deepEqual(errors, []);
  log('Illustrated meadow: Places postcard, picture in both orientations without sun/clouds/scenery, Counting Cove unchanged, result on the picture and the Explore postcard passed');
}

return { homeMeadow };
}
