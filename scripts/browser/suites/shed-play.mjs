import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
/** Second Chance Shed: level 1 with an empty-yard drop (never counted) then every scrap to the worms; level 4 with one wrong place (the reason), a requested hint (the glow), a portrait screenshot with all four places, then every thing to its place. */
async function shedPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('second-chance-shed').history.at(-1); return [r.misses, r.hints]; });
  const settle = async () => { await page.waitForTimeout(300); await page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.busy && neo.scene.game.item), null, { timeout: 25000 }); await page.waitForTimeout(250); };
  const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
  const dropOn = (place) => page.evaluate(async (place) => {
    const g = neo.scene.game;
    const target = (place ? g.places.find((p) => p.place === place).node : g.cart).getGlobalPosition();
    await kit.dragTo(g.item.node, place ? target : { x: target.x - 300, y: target.y + 120 });
  }, place);
  const playOut = async () => {
    for (let i = 0; i < 8; i++) {
      await settle();
      if (await page.evaluate(() => neo.scene.finished || neo.scene.game.finished)) break;
      await dropOn(await page.evaluate(async () => { const L = await import('/src/games/second-chance-shed/logic.ts'); return L.ITEMS[neo.scene.game.item.id].place; }));
    }
  };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await launch('second-chance-shed', 1);
  await settle();
  const first = await page.evaluate(() => neo.scene.game.item.id);
  await dropOn(null); await page.waitForTimeout(700);
  assert.deepEqual([await page.evaluate(() => neo.scene.game.item?.id), ...await tally()], [first, 0, 0], 'an empty-yard drop floats back, uncounted');
  await playOut();
  await finished('second-chance-shed');
  assert.deepEqual(await score(), [0, 0]);
  await launch('second-chance-shed', 4);
  await settle();
  const wrong = await page.evaluate(async () => { const L = await import('/src/games/second-chance-shed/logic.ts'); const own = L.ITEMS[neo.scene.game.item.id].place; return L.PLACES.find((p) => p !== own); });
  await dropOn(wrong); await page.waitForTimeout(700);
  assert.deepEqual(await tally(), [1, 0], 'a wrong place is one miss');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(300);
  assert.deepEqual([...await tally(), await page.evaluate(() => neo.scene.game.tally.glowing)], [1, 1, true], 'Show a hint glows and counts once');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('second-chance-shed-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await playOut();
  await finished('second-chance-shed');
  assert.deepEqual(await score(), [1, 1]);
  log('Second Chance Shed 1 and 4: empty-yard drop uncounted, worms fed, wrong place miss, requested glow hint, portrait, saved score passed');
}

return { shedPlay };
}
