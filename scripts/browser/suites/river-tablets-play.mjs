import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function riverTabletsPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('river-tablets').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => { const t = neo.scene.game.tally; return [t.misses, t.hints]; });
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 30000 }); await page.waitForTimeout(150); };
  const tapOn = async (expr) => { await page.evaluate((expr) => kit.tapOn(Function(`return (${expr})`)()), expr); await page.waitForTimeout(150); };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  const fromLevel = Number(process.env.FROM_LEVEL || 1);
  if (fromLevel <= 3) await riverTablets13({ score, tally, settle, tapOn });
  await riverTablets45({ score, tally, settle, tapOn });
}

async function riverTablets13({ score, tally, settle, tapOn }) {

  // Level 1: a token per sheep (a tap while the next sheep walks only wobbles), then the tip; nothing counts.
  await launch('river-tablets', 1);
  await settle();
  const sheep = await page.evaluate(() => neo.scene.game.brief.sheep);
  assert.ok(sheep >= 3 && sheep <= 5, 'three to five sheep');
  let pen = await page.evaluate(() => ({ ...neo.scene.game.pen }));
  assert.deepEqual([pen.arrived, pen.tokens, pen.walking], [1, 0, false], 'the first sheep walked in on its own');
  for (let i = 0; i < sheep; i++) {
    await tapOn('neo.scene.game.jarNode');
    pen = await page.evaluate(() => ({ ...neo.scene.game.pen }));
    assert.equal(pen.tokens, i + 1, `token ${i + 1} dropped in`);
    if (i + 1 < sheep) {
      assert.equal(pen.walking, true, 'the next sheep set off');
      await tapOn('neo.scene.game.jarNode');
      const during = await page.evaluate(() => ({ ...neo.scene.game.pen }));
      assert.equal(during.tokens, i + 1, 'a tap while a sheep walks changes nothing');
    }
    await settle();
  }
  pen = await page.evaluate(() => ({ ...neo.scene.game.pen }));
  assert.deepEqual([pen.arrived, pen.tokens, pen.tipped], [sheep, sheep, false], 'every sheep has its token');
  await screenshot('river-tablets-1-landscape');
  await tapOn('neo.scene.game.jarNode');
  await finished('river-tablets');
  assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

  // Level 2: peek, one mark short, two wrong cracks (one miss each, the glow after the second: one hint), the glowing cell, a match; the second envelope exact.
  await launch('river-tablets', 2);
  await settle();
  let tokens = await page.evaluate(() => neo.scene.game.envelope.tokens);
  await page.evaluate(() => { const g = neo.scene.game; const p = g.ballNode.toGlobal({ x: 0, y: -g.layoutNow.ball.h / 2 + 36 }); kit.tap(p.x, p.y); });
  await page.waitForTimeout(150);
  assert.ok(await page.evaluate(() => neo.scene.game.peekLeft > 0), 'tapping the ball peeks');
  for (let i = 0; i < tokens - 1; i++) await tapOn(`neo.scene.game.cellNodes[${i}]`);
  assert.equal(await page.evaluate(() => neo.scene.game.envelope.marks.filter(Boolean).length), tokens - 1, 'one mark short');
  await tapOn('neo.scene.game.crackNode'); await settle();
  let e = await page.evaluate(() => ({ ...neo.scene.game.envelope }));
  assert.deepEqual([e.misses, e.glowing, e.matched], [1, false, false], 'a wrong crack is one miss and no glow');
  assert.equal(e.marks.filter(Boolean).length, tokens - 1, 'her marks are kept');
  await tapOn('neo.scene.game.crackNode'); await settle();
  e = await page.evaluate(() => ({ ...neo.scene.game.envelope }));
  assert.deepEqual([e.misses, e.glowing, e.hinted], [2, true, true], 'the second miss glows (one hint)');
  assert.deepEqual(await tally(), [2, 1]);
  const hint = await page.evaluate(async () => { const { hintFor } = await import('/src/games/river-tablets/logic.ts'); return hintFor(neo.scene.game.envelope); });
  assert.equal(hint.action, 'press', 'the glow points at an empty cell');
  await tapOn(`neo.scene.game.cellNodes[${hint.cell}]`);
  await tapOn('neo.scene.game.crackNode'); await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.envelopeIndex), 1, 'the match moved to the second envelope');
  tokens = await page.evaluate(() => neo.scene.game.envelope.tokens);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('river-tablets-2-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  for (let i = 0; i < tokens; i++) await tapOn(`neo.scene.game.cellNodes[${i}]`);
  await tapOn('neo.scene.game.crackNode');
  await finished('river-tablets');
  assert.deepEqual(await score(), [2, 1], 'level 2 saved 2 misses, 1 hint');

  // Level 3: a wrong row (one miss), the same good wrong again (the mark moved, one hint, the heading glows), then every good in its row; the second tablet clean.
  await launch('river-tablets', 3);
  await settle();
  const rowOf = (kind) => `neo.scene.game.rowNodes[${kind === 'sheep' ? 0 : 1}]`;
  const other = (kind) => (kind === 'sheep' ? 'jar' : 'sheep');
  let good = await page.evaluate(async () => { const { waiting } = await import('/src/games/river-tablets/logic.ts'); return waiting(neo.scene.game.tablet); });
  await tapOn(rowOf(other(good))); await settle();
  let t = await page.evaluate(() => ({ ...neo.scene.game.tablet }));
  assert.deepEqual([t.misses, t.placed, t.hinted], [1, 0, false], 'a wrong row bounces the mark back');
  await tapOn(rowOf(other(good))); await settle();
  t = await page.evaluate(() => ({ ...neo.scene.game.tablet }));
  assert.deepEqual([t.misses, t.placed, t.hinted, t.glowing], [2, 1, true, good], 'the second wrong press moves the mark (one hint)');
  for (let guard = 0; guard < 14; guard++) {
    const s = await page.evaluate(async () => { const { waiting } = await import('/src/games/river-tablets/logic.ts'); const g = neo.scene.game; return { good: waiting(g.tablet), index: g.tabletIndex, finished: neo.scene.finished === true }; });
    if (s.finished) break;
    if (s.good === null) { await settle(); continue; }
    await tapOn(rowOf(s.good)); await settle();
  }
  await finished('river-tablets');
  assert.deepEqual(await score(), [2, 1], 'level 3 saved 2 misses, 1 hint');
  log('River Tablets 1–3: a token per sheep and the tip (0/0), a short envelope cracked twice then the glowing cell (2/1), a wrong row twice then the moved mark (2/1), a portrait screenshot, passed');
}

// Level 4: one wrong Hand in, a second (the glow, one hint), the glow followed to a match; the second cart written the long way (accepted).
// Level 5: one wrong number (a miss), then the right verdict and number; the second cart answered right. Portrait screenshots of both.
async function riverTablets45({ score, tally, settle, tapOn }) {
  const logic = '/src/games/river-tablets/logic.ts';
  await launch('river-tablets', 4);
  await settle();
  let s = await page.evaluate(() => ({ ...neo.scene.game.tensNow }));
  assert.ok(s.n >= 12 && s.n <= 29, 'a count of 12–29');
  // The yard count and reading the tablet are free.
  await page.evaluate(() => { const g = neo.scene.game; const l = g.layoutNow; const p = g.yardNode.toGlobal({ x: l.baskets.x - l.lane.x + 20, y: 30 }); kit.tap(p.x, p.y); });
  await page.waitForTimeout(200);
  assert.ok(await page.evaluate(() => neo.scene.game.yardCounted), 'the yard is being counted');
  await settle();
  // One ten-mark only: wrong.
  await tapOn('neo.scene.game.stampNodes[0]');
  await tapOn('neo.scene.game.handInNode'); await settle();
  s = await page.evaluate(() => ({ ...neo.scene.game.tensNow }));
  assert.deepEqual([s.misses, s.glowing, s.tens, s.ones], [1, false, 1, 0], 'a wrong Hand in is one miss, her marks kept');
  await tapOn('neo.scene.game.handInNode'); await settle();
  s = await page.evaluate(() => ({ ...neo.scene.game.tensNow }));
  assert.deepEqual([s.misses, s.glowing, s.hinted], [2, true, true], 'the second miss glows (one hint)');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('river-tablets-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  for (let guard = 0; guard < 30; guard++) {
    const h = await page.evaluate(async (logic) => { const { tensHint } = await import(logic); const g = neo.scene.game; return g.tensNow.done ? null : tensHint(g.tensNow); }, logic);
    if (h === null) break;
    const node = { handIn: 'neo.scene.game.handInNode', liftTen: 'neo.scene.game.stripNodes[0]', liftOne: 'neo.scene.game.stripNodes[1]', stampTen: 'neo.scene.game.stampNodes[0]', stampOne: 'neo.scene.game.stampNodes[1]' }[h];
    await tapOn(node);
    if (h === 'handIn') await settle();
  }
  await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.cartIndex), 1, 'the match moved to the second cart');
  assert.deepEqual(await tally(), [2, 1]);
  // The second cart the long way: one fewer ten, ten more small marks. Right, no miss.
  const n2 = await page.evaluate(() => neo.scene.game.tensNow.n);
  const tens = Math.floor(n2 / 10);
  const longTens = Math.max(0, tens - 1);
  const longOnes = n2 - 10 * longTens;
  for (let i = 0; i < longTens; i++) await tapOn('neo.scene.game.stampNodes[0]');
  for (let i = 0; i < longOnes; i++) await tapOn('neo.scene.game.stampNodes[1]');
  if (longOnes > 19) throw new Error('long reading over the cap');
  await tapOn('neo.scene.game.handInNode');
  await finished('river-tablets');
  assert.deepEqual(await score(), [2, 1], 'level 4 saved 2 misses, 1 hint');

  await launch('river-tablets', 5);
  await settle();
  const want = await page.evaluate(async (logic) => { const { verdictFor } = await import(logic); const c = neo.scene.game.check; return verdictFor(c.t, c.c); }, logic);
  const vIndex = (v) => ['short', 'right', 'extra'].indexOf(v);
  // One wrong number: pick short or extra (the right one if the cart is off), then a wrong count.
  const off = want.verdict === 'right' ? 'short' : want.verdict;
  await tapOn(`neo.scene.game.verdictNodes[${vIndex(off)}]`);
  assert.equal(await page.evaluate(() => neo.scene.game.check.open), off, 'short or extra opens the numbers');
  assert.equal(await page.evaluate(() => neo.scene.game.check.misses), 0, 'choosing a verdict is free');
  const wrongBy = want.verdict === 'right' ? 1 : (want.by % 3) + 1;
  await tapOn(`neo.scene.game.numberNodes[${wrongBy - 1}]`); await settle();
  let c = await page.evaluate(() => ({ ...neo.scene.game.check }));
  assert.deepEqual([c.misses, c.done, c.lined], [1, false, false], 'a wrong number is one miss');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('river-tablets-5-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  for (let guard = 0; guard < 6; guard++) {
    const st = await page.evaluate(async (logic) => { const { verdictFor } = await import(logic); const g = neo.scene.game; if (neo.scene.finished) return null; const c = g.check; return { want: verdictFor(c.t, c.c), open: c.open }; }, logic);
    if (!st) break;
    if (st.want.verdict === 'right') await tapOn(`neo.scene.game.verdictNodes[1]`);
    else {
      await tapOn(`neo.scene.game.verdictNodes[${vIndex(st.want.verdict)}]`);
      await tapOn(`neo.scene.game.numberNodes[${st.want.by - 1}]`);
    }
    await settle();
  }
  await finished('river-tablets');
  assert.deepEqual(await score(), [1, 0], 'level 5 saved 1 miss, 0 hints');
  log('River Tablets 4–5: the yard counted, two wrong tablets then the glow to a match (2/1), a long reading accepted; a wrong number then two right checks (1/0), two portrait screenshots, passed');
}
return { riverTabletsPlay };
}
