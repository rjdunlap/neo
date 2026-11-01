import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function spinnerFairPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('spinner-fair').history.at(-1); return [r.misses, r.hints]; });
  const state = () => page.evaluate(() => neo.scene.game.state);
  const settle = async () => { await page.waitForTimeout(200); await page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.spinning && !neo.scene.game.busy), null, { timeout: 40000 }); await page.waitForTimeout(120); };
  const tapSpinner = async (i) => { await page.evaluate((i) => kit.tapOn(neo.scene.game.spinners[i].node), i); await page.waitForTimeout(150); };
  const spinAll = async (i) => { const s = await state(); for (let k = s.results.length; k < s.spins; k++) { await tapSpinner(i); await settle(); } };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1 (preschool): six spins she taps, each a block on the critter it landed on; no question, so no misses or hints.
  await launch('spinner-fair', 1, 'Mia', 'preschool');
  await settle();
  let s = await state();
  assert.equal(s.phase, 'spin');
  assert.equal(s.spins, 6);
  assert.equal(s.kinds.length, 3, 'three critters, three bars');
  await spinAll(0);
  await finished('spinner-fair');
  assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

  // Level 3 (school), portrait: a wrong pick (a miss), a second wrong pick (the glow, one hint), the better spinner, ten spins;
  // the second pick right away and ten spins. Spins never count.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await launch('spinner-fair', 3, 'Mia', 'school');
  await settle();
  s = await state();
  assert.equal(s.phase, 'pick');
  const fav = (w) => w.filter((k) => k === s.favourite).length;
  assert.ok(fav(s.wheels[s.better]) - fav(s.wheels[1 - s.better]) >= 2, 'the better spinner has at least two more wedges of the favourite');
  await screenshot('spinner-fair-3-portrait');
  await tapSpinner(1 - s.better);
  await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.glowing], [1, 0, false], 'one wrong pick: a miss, no glow');
  await page.waitForFunction(() => !neo.scene.game.busy);
  await tapSpinner(1 - s.better);
  await page.waitForFunction(() => neo.scene.game.state.glowing, null, { timeout: 15000 });
  s = await state();
  assert.deepEqual([s.misses, s.hints], [2, 1], 'the second wrong pick lights the glow: one hint');
  await screenshot('spinner-fair-3-glow-portrait');
  await tapSpinner(s.better);
  await settle();
  s = await state();
  assert.equal(s.phase, 'spin');
  assert.equal(s.picked, s.better);
  assert.equal(s.glowing, false);
  for (let k = 0; k < 9; k++) { await tapSpinner(s.picked); await settle(); }
  await screenshot('spinner-fair-3-bars-portrait');
  await spinAll(s.picked);
  s = await state();
  assert.equal(s.set, 1, 'ten spins end the first pick');
  assert.deepEqual([s.misses, s.hints], [2, 1], 'the spins changed nothing in the score');
  await tapSpinner(s.better);
  await settle();
  s = await state();
  await spinAll(s.picked);
  await finished('spinner-fair');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  assert.deepEqual(await score(), [2, 1], 'level 3 saved 2 misses, 1 hint');
  log('Spinner Fair 1 and 3: six spins (0/0); portrait level 3 two wrong picks (2/1, the glow), the better spinner and ten spins, the second pick straight; passed');
}
/** Spinner Fair 4–5: a face on the wrong spinner (one miss, it slides back), then every face home and the showing spins; portrait
 * level 5 with a wrong fair, an uneven Check (two misses, the glow, one hint), wedges moved (one the wrong way first if it starts
 * 4–2), Check and the six-spin race, then the second race straight. */
async function spinnerFairRacePlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('spinner-fair').history.at(-1); return [r.misses, r.hints]; });
  const state = () => page.evaluate(() => neo.scene.game.state);
  const settle = async () => { await page.waitForTimeout(200); await page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.spinning && !neo.scene.game.busy && !neo.scene.game.rebuild), null, { timeout: 40000 }); await page.waitForTimeout(150); };
  const dragCard = async (card, spinner) => {
    await page.evaluate(async ({ card, spinner }) => {
      const g = neo.scene.game, c = g.cards.find((x) => x.card === card), s = g.spinners[spinner].node.getGlobalPosition();
      await kit.dragTo(c.node, { x: s.x, y: s.y + 40 * neo.view.scale });
    }, { card, spinner });
    await page.waitForTimeout(500);
  };
  const press = async (b) => { await page.evaluate((b) => kit.tapOn(neo.scene.game.buttons[b]), b); await page.waitForTimeout(250); };
  /** Hand one wedge of `from` (0 or 1) to the other racer. */
  const hand = async (from) => {
    await page.evaluate(async (from) => {
      const g = neo.scene.game, kind = g.racers[from], p = g.pieces.filter((x) => x.kind === kind).at(from === 0 ? -1 : 0);
      await kit.dragTo(p.node, g.racerNodes[1 - from].getGlobalPosition());
    }, from);
    await settle();
  };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 4: one face on a spinner it does not fit, then every face where it fits.
  await launch('spinner-fair', 4, 'Mia', 'school');
  await settle();
  let s = await state();
  assert.equal(s.cards.length, 3);
  assert.deepEqual([...s.fits].sort(), ['maybe', 'none', 'sure'], 'one sure, one maybe and one no-way spinner');
  const first = s.cards[0].card;
  const wrong = s.fits.findIndex((f) => f !== first);
  await dragCard(first, wrong);
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.cards[0].placed], [1, 0, null], 'a face on a spinner it does not fit: one miss, back in the tray');
  for (let set = 0; set < 2; set++) {
    await settle();
    s = await state();
    for (const c of s.cards) await dragCard(c.card, s.fits.indexOf(c.card));
    if (set === 0) { await page.waitForFunction(() => neo.scene.game.state.set === 1, null, { timeout: 30000 }); }
  }
  await finished('spinner-fair');
  assert.deepEqual(await score(), [1, 0], 'level 4 saved 1 miss, 0 hints');

  // Level 5 upright: a wrong fair (a miss), unfair, an uneven Check (the second miss: the glow, one hint), wedges, Check, the race.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await launch('spinner-fair', 5, 'Mia', 'school');
  await settle();
  s = await state();
  assert.equal(s.phase, 'ask');
  assert.equal(s.fair, false, 'race 1 starts unfair');
  await press('fair'); await settle();
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.phase], [1, 0, 'ask'], 'a wrong fair: one miss');
  await press('unfair'); await settle();
  assert.equal((await state()).phase, 'even');
  await press('check'); await settle();
  await page.waitForFunction(() => neo.scene.game.state.glowing, null, { timeout: 15000 });
  s = await state();
  assert.deepEqual([s.misses, s.hints], [2, 1], 'an uneven Check is the second miss: the glow, one hint');
  const big = s.counts[0] > s.counts[1] ? 0 : 1;
  let moves = 0;
  if (s.counts[big] === 4) { await hand(1 - big); moves++; assert.deepEqual((await state()).counts[big], 5, 'a wedge the wrong way moves too, free'); }
  await screenshot('spinner-fair-5-portrait');
  while (!(await state()).fair) { await hand(big); moves++; }
  assert.ok(moves >= 2, 'at least two wedge moves');
  s = await state();
  assert.deepEqual([s.counts, s.misses, s.hints], [[3, 3], 2, 1], 'moving wedges is never counted');
  await press('check'); await settle();
  assert.equal((await state()).phase, 'race');
  for (let k = 0; k < 6; k++) { await page.evaluate(() => kit.tapOn(neo.scene.game.art.node)); await settle(); }
  await page.waitForFunction(() => neo.scene.game.state.set === 1, null, { timeout: 30000 }); await settle();
  s = await state();
  await press(s.fair ? 'fair' : 'unfair'); await settle();
  if (!s.fair) {
    const b2 = s.counts[0] > s.counts[1] ? 0 : 1;
    while (!(await state()).fair) await hand(b2);
    await press('check'); await settle();
  }
  for (let k = 0; k < 6; k++) { await page.evaluate(() => kit.tapOn(neo.scene.game.art.node)); await settle(); }
  await finished('spinner-fair');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  assert.deepEqual(await score(), [2, 1], 'level 5 saved 2 misses, 1 hint');
  log('Spinner Fair 4–5: a face on the wrong spinner (1/0) then all three; portrait level 5 wrong fair, uneven Check (2/1, the glow), wedges both ways, the race, second race straight; passed');
}
return { spinnerFairPlay, spinnerFairRacePlay };
}
