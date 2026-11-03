import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function gardenRowsPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { index: g.index, misses: g.misses, hints: g.hints, busy: g.busy, hinted: g.hinted, bed: g.bed, kinds: g.puzzles[g.index]?.kinds }; });
  const settle = () => page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 30000 }).then(() => page.waitForTimeout(250));
  // Past the board's and the packets' tap cooldowns.
  const tapCell = (r, c) => page.evaluate(({ r, c }) => { const p = neo.scene.game.board.toGlobal({ x: c * 100 + 50, y: r * 100 + 50 }); kit.tap(p.x, p.y); }, { r, c }).then(() => page.waitForTimeout(250));
  const pick = (f) => page.evaluate((f) => kit.tapOn(neo.scene.game.packets.children[f]), f).then(() => page.waitForTimeout(250));
  /** The two spots where the start differs from the bed before the swap. */
  const swapped = () => page.evaluate(() => {
    const p = neo.scene.game.puzzles[neo.scene.game.index];
    const out = [];
    p.start.forEach((row, r) => row.forEach((v, c) => { if (v !== p.solution[r][c]) out.push({ r, c, was: v, want: p.solution[r][c] }); }));
    return out;
  });
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 7, Mend the bed in portrait: replant a swapped flower where it was twice (two misses, the glow on the other), then mend.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('garden-rows', 7, 'Mia', 'school');
  await settle();
  let s = await state();
  assert.ok(s.bed.flat().every((v) => v !== null), 'level 7 starts full');
  let [a, b] = await swapped();
  assert.equal(a.r, b.r, 'the swapped pair share a row');
  await tapCell(a.r, a.c); // lift: free
  s = await state();
  assert.deepEqual([s.misses, s.bed[a.r][a.c]], [0, null], 'lifting a flower is free');
  await pick(a.was);
  await tapCell(a.r, a.c); // the same flower back: a column repeat
  await tapCell(a.r, a.c); // and again
  s = await state();
  assert.deepEqual([s.misses, s.hints], [2, 1], 'two repeat replants are two misses and one hint');
  assert.equal(s.bed[a.r][a.c], null, 'the repeat did not stay');
  assert.equal(s.hinted?.kind, 'fix', 'the hint names a mixed-up flower');
  assert.deepEqual([s.hinted.r, s.hinted.c], [b.r, b.c], 'the glow is on the other swapped flower');
  await screenshot('garden-rows-7-portrait');
  // Lift the glowing flower (free; its glow goes), then plant each where it belongs.
  await tapCell(b.r, b.c);
  await page.waitForTimeout(200);
  s = await state();
  assert.deepEqual([s.misses, s.hinted], [2, null], 'lifting the glowing flower is free and takes its glow');
  await pick(a.want); await tapCell(a.r, a.c);
  await pick(b.want); await tapCell(b.r, b.c);
  await settle();
  s = await state();
  assert.equal(s.index, 1, 'the mended bed blooms and the second bed comes');
  // The second bed: lift both swapped flowers and plant each where it belongs.
  [a, b] = await swapped();
  await tapCell(a.r, a.c); await tapCell(b.r, b.c);
  await pick(a.want); await tapCell(a.r, a.c);
  await pick(b.want); await tapCell(b.r, b.c);
  await finished('garden-rows');
  assert.deepEqual(await page.evaluate(() => { const h = kit.store.stats('garden-rows').history.at(-1); return [h.misses, h.hints]; }), [2, 1], 'level 7 saved 2 misses, 1 hint');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(400);

  // Level 3 with a flower set that is not the first four: the packets show the bed's kinds, and the bot's moves finish it.
  await launch('garden-rows', 3, 'Mia', 'school');
  await settle();
  s = await state();
  assert.equal(s.kinds.length, 4);
  const sets = [s.kinds.join()];
  for (let bed = 0; bed < 2; bed++) {
    await settle();
    sets.push((await state()).kinds.join());
    for (let i = 0; i < 40 && !(await page.evaluate(() => neo.scene.finished || neo.scene.game.busy)); i++) {
      const intent = await page.evaluate(() => { const t = neo.scene.game.autotouch(); if (!t) return null; const p = t.tap.x === undefined ? t.tap.on.getGlobalPosition() : t.tap.on.toGlobal({ x: t.tap.x, y: t.tap.y }); kit.tap(p.x, p.y); return true; });
      if (!intent) break;
      await page.waitForTimeout(120);
    }
  }
  await finished('garden-rows');
  assert.ok(sets.some((k) => k !== '0,1,2,3'), `a bed drew a non-default flower set (${sets.join(' | ')})`);
  log(`Garden Rows: level 7 in portrait (two repeat replants, the glow on the other swapped flower, a free lift, both beds mended, saved 2/1); level 3 flower sets ${sets.join(' | ')}; passed`);
}
return { gardenRowsPlay };
}
