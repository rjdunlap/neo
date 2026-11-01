import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function notAlwaysPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('not-always').history.at(-1); return [r.misses, r.hints]; });
  const state = () => page.evaluate(() => { const g = neo.scene.game, p = g.play; return { claim: p.claim, phase: p.phase, misses: p.misses, hints: p.hints, glowing: p.glowing, target: p.target(), busy: g.busy }; });
  // Waits until taps are taken again (hit-testing uses the last frame, so let a fresh sign or row render first).
  const ready = async () => { await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 40000 }); await page.waitForTimeout(250); };
  const tapCard = async (i) => { await ready(); await page.evaluate((i) => kit.tapOn(neo.scene.game.cards[i].node), i); await page.waitForTimeout(250); };
  const tapStamp = async () => { await ready(); await page.evaluate(() => kit.tapOn(neo.scene.game.stamp)); await page.waitForTimeout(250); };
  const tapMend = async (j) => { await ready(); await page.evaluate((j) => kit.tapOn(neo.scene.game.mendNodes[j]), j); await page.waitForTimeout(250); };
  /** Answer everything left with the hint target, as the ghost finger does. */
  const finishRest = async (id) => {
    for (let k = 0; k < 12; k++) {
      await ready();
      if (await page.evaluate(() => neo.scene.finished)) break;
      const s = await state();
      if (s.phase === 'done') break;
      if (s.target.kind === 'card') await tapCard(s.target.i);
      else if (s.target.kind === 'stamp') await tapStamp();
      else await tapMend(s.target.j);
    }
    await finished(id);
  };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1 (pre-K), the authored row: "All of these have hats!" is broken only by card C (index 2). Two cards with hats
  // (two misses, the glow, one hint), then C; the other two claims answered right.
  await launch('not-always', 1, 'Mia', 'prek');
  await ready();
  await screenshot('not-always-1');
  await tapCard(0);
  let s = await state();
  assert.deepEqual([s.misses, s.hints, s.glowing, s.claim], [1, 0, false, 0], 'a card with a hat: one miss, the claim stays');
  await tapCard(1);
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.glowing], [2, 1, true], 'a second fitting card lights the glow: one hint');
  assert.deepEqual(s.target, { kind: 'card', i: 2 }, 'the glow is on the bare-headed card');
  await tapCard(2);
  await page.waitForFunction(() => neo.scene.game.play.claim === 1, null, { timeout: 20000 });
  await finishRest('not-always');
  assert.deepEqual(await score(), [2, 1], 'level 1 saved 2 misses, 1 hint');

  // Level 2 (school), portrait: five cards in two rows and the stamp. "All of these are red!" is false: stamping it is a
  // miss, then a breaker; "All of these have hats!" is true and stamped; the last claim answered right.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await launch('not-always', 2, 'Mia', 'school');
  await tapStamp();
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.claim], [1, 0, 0], 'a false stamp: one miss, the claim stays');
  await screenshot('not-always-2-portrait');
  await tapCard(3);
  await page.waitForFunction(() => neo.scene.game.play.claim === 1, null, { timeout: 20000 });
  s = await state();
  assert.deepEqual(s.target, { kind: 'stamp' }, 'the hats claim is true of every card');
  await tapStamp();
  await page.waitForFunction(() => neo.scene.game.play.claim === 2, null, { timeout: 20000 });
  await finishRest('not-always');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  assert.deepEqual(await score(), [1, 0], 'level 2 saved 1 miss, 0 hints');

  // Level 3 (school): break "All of these have hats!" with card C, choose the false "None of these have hats!" (one miss),
  // then the true "None of these have spots!"; the second claim and its mend answered right.
  await launch('not-always', 3, 'Mia', 'school');
  await tapCard(2);
  await page.waitForFunction(() => neo.scene.game.play.phase === 'mend', null, { timeout: 20000 });
  await tapCard(0);
  s = await state();
  assert.deepEqual([s.misses, s.phase], [0, 'mend'], 'a card tap while the mended signs are up is free');
  await tapMend(0);
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.phase], [1, 0, 'mend'], 'a false mended claim: one miss');
  await screenshot('not-always-3-mends');
  await tapMend(1);
  await page.waitForFunction(() => neo.scene.game.play.claim === 1, null, { timeout: 20000 });
  await finishRest('not-always');
  assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');
  log('Not Always 1–3: level 1 two fitting cards and the glow then the breaker (2/1); portrait level 2 a false stamp then a true claim stamped (1/0); level 3 a free card tap, one false mend then the true one (1/0); passed');
}
return { notAlwaysPlay };
}
