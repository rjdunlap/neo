import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function paintMixerPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('paint-mixer').history.at(-1); return [r.misses, r.hints]; });
  const state = () => page.evaluate(() => { const s = neo.scene.game.state; return { bucket: s.bucket, drops: s.drops, misses: s.misses, hints: s.hints, glow: s.glow, size: s.size, pair: s.sample.pair, counts: s.sample.counts, busy: s.busy }; });
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 40000 }); await page.waitForTimeout(150); };
  const pour = async (pot) => { await page.evaluate((pot) => kit.tapOn(neo.scene.game.potNodes.get(pot)), pot); await page.waitForTimeout(220); };
  const button = async (kind) => { await page.evaluate((kind) => kit.tapOn(neo.scene.game.buttons.get(kind)), kind); await page.waitForTimeout(220); };
  const pourRow = async (s, times) => { for (let k = 0; k < times; k++) { for (let i = 0; i < s.counts[0]; i++) await pour(s.pair[0]); for (let i = 0; i < s.counts[1]; i++) await pour(s.pair[1]); } };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1, bucket 1: an empty Check is a miss (pot A short); one drop short of the row is a second miss and lights the glow (one hint);
  // following the glow (the missing pot, then Check) matches. Bucket 2: the row straight through; two buckets end the round.
  await launch('paint-mixer', 1, 'Mia', 'school');
  await settle();
  let s = await state();
  assert.equal(s.bucket, 0);
  assert.equal(s.size, s.counts[0] + s.counts[1], 'level 1 holds one row of the sample');
  await button('check');
  s = await state();
  assert.deepEqual([s.misses, s.hints], [1, 0], 'an empty Check is one miss, no hint');
  assert.equal(s.glow, null, 'no glow after the first miss');
  await pourRow(s, 1);
  await button('undo');
  s = await state();
  assert.equal(s.drops.length, s.size - 1, 'Undo took the last drop back (free)');
  await button('check');
  await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual([s.misses, s.hints], [2, 1], 'the second miss glows: one hint');
  assert.equal(s.glow?.at, 'pot', 'the glow is on the pot of the missing place');
  assert.equal(s.glow.pot, s.pair[1], 'the missing place is pot B');
  await screenshot('paint-mixer-1-landscape');
  await pour(s.glow.pot);
  s = await state();
  assert.equal(s.glow?.at, 'check', 'the glow moves to Check once the counts match');
  await button('check');
  await settle();
  s = await state();
  assert.equal(s.bucket, 1, 'the second bucket is up');
  assert.deepEqual(s.drops, [], 'the bucket emptied by itself');
  assert.equal(s.glow, null, 'the glow is off for the new bucket');
  await pourRow(s, 1);
  await button('check');
  await finished('paint-mixer');
  assert.deepEqual(await score(), [2, 1], 'level 1 saved 2 misses, 1 hint');

  // Level 2, bucket 1: one row is "more, the same way" (not a miss); a loose extra drop is one miss; Undo clears it; two rows match.
  // Bucket 2 in portrait: two rows straight through.
  await launch('paint-mixer', 2, 'Mia', 'school');
  await settle();
  s = await state();
  assert.equal(s.size, 2 * (s.counts[0] + s.counts[1]), 'level 2 holds two rows of the sample');
  await pourRow(s, 1);
  await button('check');
  await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual([s.misses, s.hints], [0, 0], 'one row is more, the same way: not a miss');
  await pourRow(s, 1);
  await pour(s.pair[0]);
  s = await state();
  assert.equal(s.drops.length, s.size + 1, 'an extra drop sits loose');
  await button('check');
  s = await state();
  assert.deepEqual([s.misses, s.hints], [1, 0], 'too many of pot A is one miss');
  await button('undo');
  await button('check');
  await settle();
  s = await state();
  assert.equal(s.bucket, 1, 'two rows matched; the second bucket is up');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await pourRow(s, 2);
  await screenshot('paint-mixer-2-portrait');
  await button('check');
  await finished('paint-mixer');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  assert.deepEqual(await score(), [1, 0], 'level 2 saved 1 miss, 0 hints');
  log('Paint Mixer 1–2: empty Check and one short (2/1, the glow on the missing pot then Check), the second row straight; one row is more the same way, a loose drop (1/0), Undo and two rows, portrait second bucket; passed');
}
return { paintMixerPlay };
}
