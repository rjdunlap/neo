import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Clap the Syllables: clap along, clap by yourself (a wrong count, a hint), sort by claps (wrong drops, a hint), match claps to a picture. */
async function clapPlay() {
  await page.evaluate(() => { kit.store.data.stickers = []; });
  const idleGame = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 40000 });
  const beats = () => page.evaluate(() => neo.scene.game.word.parts.length);
  const clap = async (n) => { for (let i = 0; i < n; i++) { await tap('neo.scene.game.pad'); } };
  const results = () => page.evaluate(() => ({ misses: neo.scene.game.misses, hints: neo.scene.game.hints, stickers: kit.store.data.stickers.length }));
  // Level 1: the pet claps each word, she claps along; the beads light one for each clap, and there is nothing to get wrong.
  await launch('clap-syllables', 1); await idleGame();
  await screenshot('clap-1');
  assert.ok(await page.evaluate(() => neo.scene.game.pad.hitArea.radius * 2 >= 100), 'the hands are a big target');
  // A quiet moment: the pet shows the word again by itself.
  await page.evaluate(() => { neo.scene.game.idle = 100; });
  await page.waitForFunction(() => neo.scene.game.busy, null, { timeout: 5000 }); await idleGame();
  for (let w = 0; w < 3; w++) {
    await idleGame();
    const n = await beats();
    assert.equal(await page.evaluate(() => neo.scene.game.beads.length), n, 'one bead for each beat');
    await clap(n);
    assert.equal(await page.evaluate(() => neo.scene.game.beads.every((b) => b.lit)), true);
    if (w < 2) await page.waitForFunction((w) => neo.scene.game.index === w + 1 && !neo.scene.game.busy, w, { timeout: 40000 });
  }
  await finished('clap-syllables');
  assert.deepEqual(await results(), { misses: 0, hints: 0, stickers: 1 });
  // Level 2: she counts alone. Two wrong counts (a demonstration each; the second leaves the beats showing as a hint), then it can be finished.
  await launch('clap-syllables', 2); await idleGame();
  await screenshot('clap-2');
  let n = await beats();
  await clap(n + 1);
  await page.waitForFunction(() => neo.scene.game.misses === 1, null, { timeout: 10000 }); await idleGame();
  assert.equal(await page.evaluate(() => neo.scene.game.guided), false, 'one wrong count is only a demonstration');
  await clap(n + 1);
  await page.waitForFunction(() => neo.scene.game.misses === 2, null, { timeout: 10000 }); await idleGame();
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.guided, neo.scene.game.hints, neo.scene.game.beads.length]), [true, 1, n], 'the second wrong count shows the beats');
  await clap(n);
  for (let w = 1; w < 3; w++) {
    await page.waitForFunction((w) => neo.scene.game.index === w && !neo.scene.game.busy, w, { timeout: 40000 });
    n = await beats();
    await clap(n);   // right count, then a pause: counted
  }
  await finished('clap-syllables');
  assert.deepEqual(await results(), { misses: 2, hints: 1, stickers: 2 });
  // Level 3: sort. A wrong bin is a miss and the claps are played; after two, the right bin glows; dropping in empty space costs nothing.
  await launch('clap-syllables', 3); await idleGame();
  await screenshot('clap-3');
  const drop = (cardIndex, count) => page.evaluate(async ({ cardIndex, count }) => {
    const g = neo.scene.game; const card = g.cards[cardIndex]; const bin = g.bins.find((b) => b.count === count);
    const p = bin.node.getGlobalPosition();
    await kit.dragTo(card.node, { x: p.x, y: p.y + 40 }, 12);
  }, { cardIndex, count });
  const counts = await page.evaluate(() => neo.scene.game.cards.map((c) => c.word.parts.length));
  const wrongBin = (n) => (n === 1 ? 2 : 1);
  await drop(0, wrongBin(counts[0])); await page.waitForTimeout(500);
  await drop(0, wrongBin(counts[0])); await page.waitForTimeout(700);
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, !!neo.scene.game.glowing]), [2, 1, true], 'two wrong bins: two misses and the right bin glows');
  await page.evaluate(async () => { const g = neo.scene.game; const c = g.cards[0]; await kit.dragTo(c.node, { x: 60, y: 420 }, 8); });
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => neo.scene.game.misses), 2, 'dropping in empty space is not a miss');
  for (let i = 0; i < counts.length; i++) { await drop(i, counts[i]); await page.waitForTimeout(550); }
  await finished('clap-syllables');
  assert.deepEqual(await results(), { misses: 2, hints: 1, stickers: 3 });
  // Level 4: hear some claps and find the picture with that many.
  await launch('clap-syllables', 4); await idleGame();
  await screenshot('clap-4');
  for (let q = 0; q < 4; q++) {
    await idleGame();
    const target = await page.evaluate(() => neo.scene.game.q.target);
    assert.equal(await page.evaluate(() => neo.scene.game.beads.length), target, 'the claps are shown as beads too');
    if (q === 0) {
      for (let k = 0; k < 2; k++) {
        await page.evaluate((target) => kit.tapOn(neo.scene.game.cards.find((c) => c.word.parts.length !== target).node), target);
        await page.waitForTimeout(400); await idleGame();
      }
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 1]);
    }
    await page.evaluate((target) => kit.tapOn(neo.scene.game.cards.find((c) => c.word.parts.length === target).node), target);
    await page.waitForTimeout(300);
    if (q < 3) await page.waitForFunction((q) => neo.scene.game.index === q + 1 && !neo.scene.game.busy, q, { timeout: 40000 });
  }
  await finished('clap-syllables');
  assert.deepEqual(await results(), { misses: 2, hints: 1, stickers: 4 });
  // Level 5: long words in four size classes. The two rows leave room for all eight large picture cards.
  await launch('clap-syllables', 5); await idleGame();
  await screenshot('clap-5');
  const longCounts = await page.evaluate(() => neo.scene.game.cards.map((c) => c.word.parts.length));
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.cards.length, neo.scene.game.bins.length]), [8, 4]);
  assert.deepEqual([...new Set(longCounts)].sort(), [1, 2, 3, 4], 'the round has words for every bin');
  assert.ok(await page.evaluate(() => neo.scene.game.cards.every((c) => c.node.hitArea.width >= 100)), 'each picture keeps a large drag target');
  const levelFiveWrongBin = (n) => (n === 1 ? 2 : 1);
  await drop(0, levelFiveWrongBin(longCounts[0])); await page.waitForTimeout(700);
  await drop(0, levelFiveWrongBin(longCounts[0])); await page.waitForTimeout(1400);
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, !!neo.scene.game.glowing]), [2, 1, true], 'two wrong bins: two misses and the right bin glows');
  for (let i = 0; i < longCounts.length; i++) { await drop(i, longCounts[i]); await page.waitForTimeout(550); }
  await finished('clap-syllables');
  assert.deepEqual(await results(), { misses: 2, hints: 1, stickers: 5 });
  // Portrait: the same game, the hands and the cards stay on screen.
  await launch('clap-syllables', 5); await idleGame();
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => [...neo.scene.game.cards, ...neo.scene.game.bins].every((c) => { const p = c.node.getGlobalPosition(); return p.x > 0 && p.x < innerWidth && p.y > 0 && p.y < innerHeight; })), 'cards and bins on screen in portrait');
  await screenshot('clap-5-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Clap the Syllables: levels 1–4 retain their clap-along, solo, three-bin sort and matching rounds; level 5 sorts eight long-word pictures into four large bins, including all four clap counts, with a wrong-bin hint and a portrait layout; one sticker per round');
}

return { clapPlay };
}
