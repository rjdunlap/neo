import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, screenshot, launch, finished }) {
/** Clap the Syllables level 6, Beat train: two wrong cars (a miss each, then the next picture glows), a free drop in empty space, three trains, portrait. */
async function clapTrainPlay() {
  await page.evaluate(() => { kit.store.data.stickers = []; });
  const idleGame = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 40000 });
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { counts: g.cards.map((c) => c.word.parts.length), sorted: g.cards.map((c) => c.word.parts.length).sort((a, b) => a - b), full: g.cars.map((c) => !!c.word) }; });
  const load = (cardIndex, car) => page.evaluate(async ({ cardIndex, car }) => {
    const g = neo.scene.game; const p = g.cars[car].node.getGlobalPosition();
    await kit.dragTo(g.cards[cardIndex].node, { x: p.x, y: p.y + 10 }, 12);
  }, { cardIndex, car });
  await launch('clap-syllables', 6); await idleGame();
  await screenshot('clap-6');
  assert.ok(await page.evaluate(() => neo.scene.game.cards.every((c) => c.node.hitArea.width >= 100)), 'each picture keeps a large drag target');
  for (let t = 0; t < 3; t++) {
    if (t > 0) await page.waitForFunction((t) => neo.scene.game.index === t && !neo.scene.game.busy, t, { timeout: 40000 });
    let { counts, sorted } = await state();
    assert.equal(new Set(counts).size >= 2, true, 'a train has an order to find');
    if (t === 0) {
      const wrongCar = sorted.findIndex((n) => n !== counts[0]);
      await load(0, wrongCar); await page.waitForTimeout(700);
      await load(0, wrongCar); await page.waitForTimeout(1400);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, !!neo.scene.game.glowing]), [2, 1, true], 'two wrong cars: two misses and the next picture glows');
      await page.evaluate(async () => { await kit.dragTo(neo.scene.game.cards[0].node, { x: 60, y: 300 }, 8); });
      await page.waitForTimeout(500);
      assert.equal(await page.evaluate(() => neo.scene.game.misses), 2, 'dropping in empty space is not a miss');
    }
    for (let i = 0; i < 3; i++) {
      const { full } = await state();
      const car = sorted.findIndex((n, k) => n === counts[i] && !full[k]);
      await load(i, car); await page.waitForTimeout(600);
    }
    assert.deepEqual((await state()).full, [true, true, true], 'every car loaded');
  }
  await finished('clap-syllables');
  assert.deepEqual(await page.evaluate(() => [kit.store.stats('clap-syllables').history.at(-1).misses, kit.store.stats('clap-syllables').history.at(-1).hints, kit.store.data.stickers.length]), [2, 1, 1]);
  await launch('clap-syllables', 6); await idleGame();
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => [...neo.scene.game.cards, ...neo.scene.game.cars].every((c) => { const b = c.node.getBounds(); return b.x > 0 && b.x + b.width < innerWidth && b.y > 0 && b.y + b.height < innerHeight; })), 'pictures and cars on screen in portrait');
  await screenshot('clap-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Clap the Syllables level 6: three beat trains loaded fewest claps to most, two wrong cars then a glowing next picture, a free drop in empty space, one sticker; portrait layout');
}

return { clapTrainPlay };
}
