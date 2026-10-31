import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function sproutShufflePlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('sprout-shuffle').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 30000 }); await page.waitForTimeout(250); };
  const tapOn = async (expr) => { await page.evaluate((expr) => kit.tapOn(Function(`return (${expr})`)()), expr); await settle(); };
  const state = () => page.evaluate(() => { const g = neo.scene.game; const r = g.round; return { phase: r.phase, slots: [...r.slots], opened: [...r.opened], built: [...r.built], chosen: [...r.chosen].sort(), missing: g.setup.build.length === 1 ? g.setup.build[0] : null, build: [...g.setup.build], claim: r.claim, tries: g.tries, check: !!g.checkButton?.visible, finished: neo.scene.finished === true }; });
  const tapTile = async (side, index) => tapOn(`neo.scene.game.tiles.find((t) => t.side === ${side} && t.index === ${index}).node`);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1: a tapped copy from each plant opens a spotted sprout; a dragged copy into the wrong parent's slot springs back silently; four buds, then one sticker.
  await launch('sprout-shuffle', 1);
  await settle();
  let s = await state();
  assert.deepEqual([s.phase, s.slots, s.missing], ['give', [null, null], null], 'level 1 opens with two empty slots and no missing bud');
  await page.evaluate(async () => {
    const g = neo.scene.game;
    const tile = g.tiles.find((t) => t.side === 0 && t.index === 1);
    const slot = g.slots[1].getGlobalPosition();
    await kit.dragTo(tile.node, { x: slot.x, y: slot.y + 40 }, 14);
  });
  await settle();
  s = await state();
  assert.deepEqual(s.slots, [null, null], 'a copy dropped on the other parent\'s slot springs back, nothing given');
  assert.deepEqual(await tally(), [0, 0], 'and it is not a miss');
  await tapTile(0, 1);
  s = await state();
  assert.deepEqual(s.slots, [1, null], 'a tap gives the left plant\'s second copy');
  await tapTile(0, 0);
  s = await state();
  assert.deepEqual(s.slots, [0, null], 'the other copy of the same plant swaps in, for free');
  await tapTile(1, 0);
  await page.waitForFunction(() => neo.scene.game.round.phase === 'fan', null, { timeout: 15000 });
  await settle();
  s = await state();
  assert.deepEqual([s.slots, s.opened], [[0, 0], [false, false, false, false]], 'both slots full: the fan appears with four closed buds');
  await screenshot('sprout-shuffle-1-landscape');
  for (let i = 0; i < 4; i++) await tapOn(`neo.scene.game.buds[${i}]`);
  await finished('sprout-shuffle');
  assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

  // Level 2: build a route, grow the missing bud from its two lit tiles (a wrong tile shakes, no miss), choose one look and Check (one miss, replayed route), a second wrong Check glows (one hint), then Show me picks both and Check finishes.
  await launch('sprout-shuffle', 2);
  await settle();
  s = await state();
  assert.equal(s.opened.filter(Boolean).length, 3, 'level 2 opens with three buds open');
  assert.equal(s.opened[s.missing], false, 'and the seeded missing bud closed');
  await tapTile(0, 0);
  await tapTile(1, 1);
  await page.waitForFunction(() => neo.scene.game.round.phase === 'fan', null, { timeout: 15000 });
  await settle();
  const route = await page.evaluate(() => neo.scene.game.setup.routes[neo.scene.game.setup.build[0]].from);
  await tapTile(0, 1 - route[0]);
  s = await state();
  assert.deepEqual([s.built, await tally()], [[false, false], [0, 0]], 'a tile that is not the missing bud\'s source does nothing and costs nothing');
  await tapTile(0, route[0]);
  s = await state();
  assert.deepEqual(s.built, [true, false], 'the left source tile grows half the bud');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await screenshot('sprout-shuffle-2-portrait');
  await tapTile(1, route[1]);
  await page.waitForFunction(() => neo.scene.game.round.phase === 'choose', null, { timeout: 15000 });
  await settle();
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  s = await state();
  assert.deepEqual([s.opened, s.check], [[true, true, true, true], false], 'all four buds open; Check is not shown before a choice');
  await tapOn('neo.scene.game.cards.find((c) => c.key === "spotted")');
  s = await state();
  assert.deepEqual([s.chosen, s.check], [['spotted'], true], 'one card chosen, Check shown');
  await tapOn('neo.scene.game.checkButton');
  await settle();
  assert.deepEqual(await tally(), [1, 0], 'Check with only spotted is one miss, no hint yet');
  await tapOn('neo.scene.game.checkButton');
  await settle();
  assert.deepEqual(await tally(), [2, 1], 'the second wrong Check counts a miss and the glow hint');
  await page.evaluate(() => neo.scene.game.askForHint()); await settle();
  s = await state();
  assert.deepEqual(s.chosen, ['plain', 'spotted'], 'Show me chooses both looks');
  assert.deepEqual(await tally(), [2, 2], 'and counts one hint');
  await page.evaluate(() => neo.scene.game.askForHint()); await settle();
  assert.deepEqual(await tally(), [2, 2], 'a second Show me in the same task is free');
  assert.equal((await state()).finished, false, 'she still presses Check herself');
  await tapOn('neo.scene.game.checkButton');
  await finished('sprout-shuffle');
  assert.deepEqual(await score(), [2, 2], 'level 2 saved 2 misses, 2 hints');
  // Level 3: two spotted plants; all four buds closed and built in turn from their lit tiles; Try one is free; "Always" is one miss with the plain route replayed; "Sometimes" finishes.
  await launch('sprout-shuffle', 3);
  await settle();
  s = await state();
  assert.deepEqual([s.phase, s.build, s.opened], ['give', [0, 1, 2, 3], [false, false, false, false]], 'level 3 opens with every bud closed, all four to build');
  await tapTile(0, 0);
  await tapTile(1, 0);
  await page.waitForFunction(() => neo.scene.game.round.phase === 'fan', null, { timeout: 15000 });
  await settle();
  for (let b = 0; b < 4; b++) {
    const from = await page.evaluate((b) => neo.scene.game.setup.routes[b].from, b);
    await tapTile(0, from[0]);
    await tapTile(1, from[1]);
    await page.waitForFunction((b) => neo.scene.game.round.opened[b] && !neo.scene.game.busy, b, { timeout: 15000 });
    await settle();
  }
  s = await state();
  assert.deepEqual([s.phase, s.opened, await tally()], ['choose', [true, true, true, true], [0, 0]], 'four buds built, no miss, the claim cards appear');
  const plainBuds = await page.evaluate(() => neo.scene.game.setup.routes.filter((r) => r.sprout[0] === 'a' && r.sprout[1] === 'a').length);
  assert.equal(plainBuds, 1, 'one of the four ways is plain');
  await tapOn('neo.scene.game.tryButton');
  await tapOn('neo.scene.game.tryButton');
  s = await state();
  assert.deepEqual([s.tries, await tally(), s.check], [2, [0, 0], false], 'Try one draws are free and do not bring Check');
  await tapOn('neo.scene.game.cards.find((c) => c.key === "always")');
  s = await state();
  assert.deepEqual([s.claim, s.check], ['always', true], '"Always" chosen, Check shown');
  await tapOn('neo.scene.game.checkButton');
  await settle();
  assert.deepEqual(await tally(), [1, 0], '"Always spotted" is one miss');
  await tapOn('neo.scene.game.cards.find((c) => c.key === "sometimes")');
  s = await state();
  assert.equal(s.claim, 'sometimes', 'choosing "sometimes" lets go of "always"');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await screenshot('sprout-shuffle-3-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await tapOn('neo.scene.game.checkButton');
  await finished('sprout-shuffle');
  assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');
  log('Sprout Shuffle 1–3: cross-slot spring-back, swap, four buds, missing bud from lit tiles, two wrong Checks (glow), Show me, four built buds, free Try one, wrong claim, finish, passed');
}
return { sproutShufflePlay };
}
