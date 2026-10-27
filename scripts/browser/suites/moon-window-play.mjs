import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function moonWindowPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('moon-window').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 20000 }); await page.waitForTimeout(200); };
  const card = async (i) => { await page.evaluate((i) => kit.tapOn(neo.scene.game.cards[i].node), i); await settle(); };
  const board = () => page.evaluate(() => { const b = neo.scene.game.round.board; return b ? [b.cards, b.answer, b.target ?? b.ask] : null; });
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 2: the authored boards; the thin slice is one miss, the half Moon fits; Show a hint on the second board counts once.
  await launch('moon-window', 2);
  await settle();
  assert.deepEqual(await board(), [[1, 2], 1, 2], 'the authored first board: a slice and a half, the window half');
  await card(0);
  assert.deepEqual(await tally(), [1, 0], 'the thin slice: one miss');
  await card(0);
  assert.deepEqual(await tally(), [1, 0], 'the same wrong card again counts nothing');
  await card(1);
  assert.deepEqual(await board(), [[4, 1], 0, 4], 'the second board: full against a slice');
  await page.evaluate(() => neo.scene.game.askForHint());
  await page.waitForTimeout(300);
  assert.deepEqual(await tally(), [1, 1], 'Show a hint before a tap counts one');
  await page.evaluate(() => neo.scene.game.askForHint());
  await page.waitForTimeout(300);
  assert.deepEqual(await tally(), [1, 1], 'a second Show a hint on the board counts nothing more');
  await card(0);
  await finished('moon-window');
  assert.deepEqual(await score(), [1, 1]);

  // Level 3: the authored comparisons (more, then less), a portrait screenshot with both Moons at one size, then the seeded third.
  await launch('moon-window', 3);
  await settle();
  assert.deepEqual(await board(), [[4, 1], 0, 'more'], 'the authored first comparison: full and a slice, more');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('moon-window-3-portrait');
  await card(0);
  assert.deepEqual(await board(), [[3, 2], 1, 'less'], 'the second comparison: most and half, less');
  await card(0);
  assert.deepEqual(await tally(), [1, 0], 'the mostly lit Moon on a less request: one miss');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await card(1);
  const third = await board();
  assert.ok(third && Math.abs(third[0][0] - third[0][1]) >= 1, 'a seeded third comparison');
  await card(third[1]);
  await finished('moon-window');
  assert.deepEqual(await score(), [1, 0]);
  log('Moon Window 2 and 3: a wrong card and one counted hint, a less comparison, portrait, passed');
}
return { moonWindowPlay };
}
