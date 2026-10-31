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
return { spinnerFairPlay };
}
