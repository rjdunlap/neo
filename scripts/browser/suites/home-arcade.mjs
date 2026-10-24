import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, pickFirst, screenshot }) {
/**
 * The Arcade (`HOME_ONLY=arcade`, docs/rework/ARCADE.md): Explore's fifth entry opens the grid with the first card's bot
 * playing in the spotlight; a tap spotlights a card, a page turn keeps it, Play launches it with the `{ explore: 'arcade' }`
 * origin, and that origin comes back to the same page and spotlight. The Topics sheet's Music tile filters to Music
 * Mountain's games. Landscape, Topics and portrait screenshots.
 */
async function homeArcade() {
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
  await page.evaluate(() => neo.go.explore()); await scene('ExploreScene');
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => c.entry === 'arcade').node)); await scene('ArcadeScene');
  const st = () => page.evaluate(() => { const s = neo.scene; return { filter: s.filter, page: s.page, n: s.list.length, cards: s.cards.length, spot: s.spotlit?.id ?? null, demo: !!s.demo, bot: !!s.demo?.hasBot }; });
  let a = await st();
  assert.ok(a.n > 50 && a.cards >= 4 && a.spot && a.demo && a.bot, JSON.stringify(a));
  await page.waitForTimeout(4000); await screenshot('arcade-landscape');
  await page.evaluate(() => kit.tapOn(neo.scene.cards[2].node)); await page.waitForTimeout(500);
  const picked = await page.evaluate(() => neo.scene.cards[2].mod.id);
  assert.equal((await st()).spot, picked);
  await page.evaluate(() => kit.tapOn(neo.scene.next)); await page.waitForTimeout(500);
  a = await st(); assert.deepEqual([a.page, a.spot], [1, picked], 'a page turn keeps the chosen spotlight');
  await page.evaluate(() => kit.tapOn(neo.scene.play)); await scene('GameScene');
  const origin = await page.evaluate(() => [neo.scene.mod.id, neo.scene.origin]);
  assert.deepEqual(origin, [picked, { explore: 'arcade', page: 1 }]);
  await page.evaluate((o) => neo.go.explore(o.explore, o.page), origin[1]); await scene('ArcadeScene');
  a = await st(); assert.deepEqual([a.page, a.spot], [1, picked], 'Back comes to the same page and spotlight');
  await page.evaluate(() => kit.tapOn(neo.scene.topics)); await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => neo.scene.sheet?.tiles.length), 12);
  await screenshot('arcade-topics');
  await page.evaluate(() => kit.tapOn(neo.scene.sheet.tiles.find((t) => t.filter === 'music-mountain').node)); await page.waitForTimeout(500);
  assert.ok(await page.evaluate(() => neo.scene.sheet === null && neo.scene.filter === 'music-mountain' && neo.scene.list.length > 0 && neo.scene.list.every((g) => g.region === 'music-mountain')));
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(3000);
  a = await st(); assert.ok(a.cards >= 4 && a.demo, JSON.stringify(a));
  await screenshot('arcade-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  assert.deepEqual(errors, []);
  log(`Arcade: ${a.n} Music games, spotlight bot, pick, page turn, launch with the arcade origin, return, Topics filter and both orientations passed`);
}

return { homeArcade };
}
