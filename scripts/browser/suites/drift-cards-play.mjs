import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function driftCardsPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('drift-cards').history.at(-1); return [r.misses, r.hints]; });
  const state = () => page.evaluate(() => { const g = neo.scene.game; const t = g.turns[g.index]; return { index: g.index, misses: g.misses, hints: g.hints, busy: g.busy, glow: t?.glow ?? false, row0: g.sea.cells[0].join('') }; });
  const settle = async () => { await page.waitForTimeout(300); await page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.busy && (neo.scene.game.plan.mode === 'send' || (neo.scene.game.held && neo.scene.game.held.scale.x > 0.99))), null, { timeout: 30000 }); await page.waitForTimeout(400); };
  const tapBeach = (b) => page.evaluate((b) => kit.tapOn(neo.scene.game.plates.get(b)), b);
  const tapBoat = (col) => page.evaluate((col) => kit.tapOn(neo.scene.game.boats.find((x) => x.col === col).node), col);
  /** The boats whose card reaches the asked friend, followed through the arrows in the page. */
  const rightBoats = () => page.evaluate(() => {
    const g = neo.scene.game; const sea = g.sea;
    const land = (col) => { let r = 0, c = col; for (;;) { const d = sea.cells[r][c]; if (d === 'e') { if (++c >= sea.cols) return 'E'; } else if (d === 'w') { if (--c < 0) return 'W'; } else if (++r >= sea.rows) return c < sea.cols / 2 ? 'SW' : 'SE'; } };
    return g.plan.boats.filter((b) => land(b) === g.request.ask);
  });
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1, the authored sea: card 1 (west) guessed south is free; card 2 (south) east then west is two misses and the glow; then south; card 3 east.
  await launch('drift-cards', 1, 'Mia', 'school');
  await settle();
  let s = await state();
  assert.equal(s.row0, 'ssssw', 'the first level-1 round is the authored sea');
  await tapBeach('S');
  await settle();
  s = await state();
  assert.deepEqual([s.index, s.misses, s.hints], [1, 0, 0], 'the first card is a free guess; it drifts to the west beach anyway');
  await tapBeach('E');
  await page.waitForTimeout(500);
  s = await state();
  assert.deepEqual([s.index, s.misses, s.hints, s.glow], [1, 1, 0, false], 'a wrong beach for card 2 is one miss and the card stays');
  await tapBeach('W');
  await page.waitForTimeout(500);
  s = await state();
  assert.deepEqual([s.index, s.misses, s.hints, s.glow], [1, 2, 1, true], 'the second miss glows the south beach: one hint');
  await tapBeach('S');
  await settle();
  s = await state();
  assert.deepEqual([s.index, s.misses, s.hints], [2, 2, 1], 'the right beach drops card 2');
  await tapBeach('E');
  await finished('drift-cards');
  assert.deepEqual(await score(), [2, 1], 'level 1 saved 2 misses, 1 hint');

  // Level 2, the authored first request (the frog, south-west): boat 5 reaches the penguin (a miss, the request stays), then boat 1.
  await launch('drift-cards', 2, 'Mia', 'school');
  await settle();
  assert.deepEqual(await rightBoats(), [1, 3], 'the authored request: boats 1 and 3 reach the frog');
  await tapBoat(5);
  await page.waitForTimeout(400);
  s = await state();
  assert.equal(s.misses, 1, 'a boat that misses the friend is one miss');
  await settle();
  s = await state();
  assert.deepEqual([s.index, s.misses], [0, 1], 'the card comes back and the request stays');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(900);
  await tapBoat(1);
  await page.waitForTimeout(1300);
  await screenshot('drift-cards-2-portrait-drift');
  await settle();
  s = await state();
  assert.deepEqual([s.index, s.misses, s.hints], [1, 1, 0], 'a right boat answers the request');
  for (let i = 1; i < 3; i++) {
    const right = await rightBoats();
    assert.ok(right.length >= 1, 'every seeded request has a right boat');
    await tapBoat(right[0]);
    if (i < 2) await settle();
  }
  await finished('drift-cards');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  assert.deepEqual(await score(), [1, 0], 'level 2 saved 1 miss, 0 hints');
  log('Drift Cards 1–2: level 1 free first guess, two misses then the glow, saved 2/1; level 2 a wrong boat drifts to the penguin and back, right boats in portrait, saved 1/0; passed');
}
return { driftCardsPlay };
}
