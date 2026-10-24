import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, pickFirst, screenshot }) {
/**
 * RW14 slice 2: a location's second-wave resident at the root (`HOME_ONLY=residents`, `RESIDENT_LAND=<land id>`, Bubble
 * Beach by default): arrive from Home, the illustrated resident stands on screen with a touch circle at least 100 units
 * across in both orientations, a poke suggests a game, the first game launches and Home comes back to the location. Then
 * Rainbow Meadow with a sprout friend: her own friend is the resident, and the corner guide hides.
 */
async function homeResidents() {
  const land = process.env.RESIDENT_LAND || 'bubble-beach';
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
  const state = () => page.evaluate(() => {
    const s = neo.scene, hs = s.host.scale.x, b = s.host.getBounds(), hit = s.host.hitArea, v = neo.view;
    return { id: s.id, resident: s.resident?.species ?? null, atHome: s.atHome, guide: s.pip.visible, touch: Math.round(hit.radius * 2 * hs),
      onScreen: b.x >= 0 && b.y >= 0 && b.x + b.width <= v.w * v.scale + 1 && b.y + b.height <= v.h * v.scale + 1, drawn: b.width > 60 && b.height > 60 };
  });
  await page.evaluate((id) => neo.go.land(id), land); await scene('LocationScene');
  const expected = await page.evaluate(async (id) => { const { LOCATIONS } = await import('/src/app/scenes/LocationScene.ts'); return LOCATIONS[id].resident; }, land);
  for (const [w, h] of [[1024, 768], [768, 1024]]) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(500);
    const st = await state();
    assert.equal(st.id, land); assert.equal(st.resident, expected); assert.equal(st.atHome, false); assert.equal(st.guide, true);
    assert.ok(st.touch >= 100, `touch circle ${st.touch}`); assert.ok(st.onScreen && st.drawn, `resident drawn on screen ${JSON.stringify(st)}`);
    await screenshot(`location-${land}-${w > h ? 'landscape' : 'portrait'}`);
  }
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  // A poke: the resident reacts, says hello, and a game glows.
  await page.evaluate(() => kit.tapOn(neo.scene.host)); await page.waitForTimeout(400);
  assert.ok(await page.evaluate(() => neo.scene.suggested !== null), 'the poke suggested a game');
  await page.waitForTimeout(400); await screenshot(`location-${land}-poked`);
  // The first game, then Home comes back to the location.
  await page.evaluate(() => kit.tapOn(neo.scene.showing[0].node)); await scene('GameScene');
  await page.waitForTimeout(800);
  // Holding the house (a HoldButton) leaves for the round's origin: this location.
  await page.evaluate(async () => { const p = neo.scene.home.getGlobalPosition(); await kit.drag([[p.x, p.y], [p.x, p.y]], 1, 750); });
  await scene('LocationScene');
  assert.equal(await page.evaluate(() => neo.scene.id), land);
  // Her friend at home: a sprout child in Rainbow Meadow stands as the resident; the guide hides.
  await page.evaluate(() => neo.go.land('rainbow-meadow')); await scene('LocationScene');
  await page.waitForTimeout(400);
  const home = await state();
  assert.deepEqual({ id: home.id, resident: home.resident, atHome: home.atHome, guide: home.guide }, { id: 'rainbow-meadow', resident: 'sprout', atHome: true, guide: false });
  assert.ok(home.touch >= 100 && home.onScreen && home.drawn, JSON.stringify(home));
  await screenshot('location-rainbow-meadow-at-home');
  assert.deepEqual(errors, []);
  log(`Residents: ${land} (${expected}) in both orientations, poke, launch and return, and her own friend at home in Rainbow Meadow passed`);
}

return { homeResidents };
}
