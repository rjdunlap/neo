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

  // Level 3, bucket 1: three pots (the pair and a stray); one row is "more, the same way, up to the line" (no miss) and fills one
  // table column; a stray drop is one miss; Undo, then rows to the line fill the table and match. Bucket 2 in portrait, straight.
  const full = () => page.evaluate(() => { const s = neo.scene.game.state; return { pots: s.pots, stray: s.sample.stray, table: s.table, done: s.done, size: s.size }; });
  await launch('paint-mixer', 3, 'Mia', 'school');
  await settle();
  s = await state();
  let f = await full();
  const lineBatches = s.counts[0] + s.counts[1] >= 5 ? 2 : 3;
  assert.equal(f.pots.length, 3, 'three pots at level 3');
  assert.ok(f.stray && !s.pair.includes(f.stray) && f.pots.includes(f.stray), 'the stray pot is on screen and not in the pair');
  assert.equal(s.size, lineBatches * (s.counts[0] + s.counts[1]), 'the line is 3 batches (totals 3–4) or 2 (total 5)');
  assert.deepEqual(f.table, { columns: lineBatches, filled: 0 }, 'an empty table');
  await pourRow(s, 1);
  f = await full();
  assert.equal(f.table.filled, 1, 'one complete row fills one column');
  await button('check');
  await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual([s.misses, s.hints], [0, 0], 'one row below the line is more, the same way: not a miss');
  await pour(f.stray);
  await button('check');
  s = await state();
  assert.deepEqual([s.misses, s.hints], [1, 0], 'a stray drop is one miss');
  f = await full();
  assert.equal(f.table.filled, 1, 'a stray drop fills no column');
  await button('undo');
  await pourRow(s, lineBatches - 1);
  f = await full();
  assert.equal(f.table.filled, lineBatches, 'the table is full at the line');
  await button('check');
  await settle();
  s = await state();
  assert.equal(s.bucket, 1, 'the line matched; the second bucket is up');
  f = await full();
  assert.equal(f.pots.length, 3, 'the second bucket has its stray too');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await pourRow(s, s.counts[0] + s.counts[1] >= 5 ? 2 : 3);
  await screenshot('paint-mixer-3-portrait');
  await button('check');
  await finished('paint-mixer');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');

  // Level 4: one row is the first way (kept as a star on its column); the same amount again is named, not a miss; two rows are the
  // second way and finish the round.
  await launch('paint-mixer', 4, 'Mia', 'school');
  await settle();
  s = await state();
  f = await full();
  assert.equal(f.size, null, 'no line at level 4');
  await pourRow(s, 1);
  await button('check');
  await settle();
  s = await state(); f = await full();
  assert.equal(f.done, 1, 'the first way is one copy');
  assert.deepEqual(s.drops, [], 'the bucket emptied by itself for the second way');
  await pourRow(s, 1);
  await button('check');
  await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual([s.misses, s.hints], [0, 0], 'the same amount again is not a miss');
  await pourRow(s, 1);
  await screenshot('paint-mixer-4-landscape');
  await button('check');
  await finished('paint-mixer');
  assert.deepEqual(await score(), [0, 0], 'level 4 saved 0 misses, 0 hints');
  log('Paint Mixer 3–4: stray pot, one row more the same way (no miss), a stray Check (1/0), the table filling to the line, portrait second bucket; level 4 one row then the same amount (no miss) then two rows (0/0); passed');
}
return { paintMixerPlay };
}
