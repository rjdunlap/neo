import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function tideLinePlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('tide-line').history.at(-1); return [r.misses, r.hints]; });
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { sea: g.sea.h, cycles: g.counter.cycles, index: g.index, misses: g.misses, hints: g.hints, busy: g.busy, high: g.high, glow: g.turns[g.index]?.glow ?? false, inTray: !!g.pail && !g.pail.at }; });
  const settle = async () => { await page.waitForTimeout(300); await page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.busy && !!neo.scene.game.pail && !neo.scene.game.pail.at && neo.scene.game.pail.node.scale.x > 0.99), null, { timeout: 30000 }); await page.waitForTimeout(500); };
  /** A shore height and an x fraction to a CSS point on the canvas. */
  const at = (fx, h, dy = 0) => page.evaluate(({ fx, h, dy }) => { const g = neo.scene.game; const L = g.L; const p = g.board.toGlobal({ x: g.view.w * fx, y: L.low - h * (L.low - L.dunes) + dy }); return [p.x, p.y]; }, { fx, h, dy });
  /** Pull the sea from the low-water edge up to `h` and let go. */
  const pull = async (h) => {
    const a = await at(0.6, 0, 10);
    const b = await at(0.6, h);
    await page.evaluate(async ({ a, b }) => { const path = kit.line(a, b, 14); for (let i = 0; i < 18; i++) path.push(b); await kit.drag(path, 1, 30); }, { a, b });
  };
  /** Carry the pail so its feet land at height `h` (the finger is 40 logical units below them). */
  const carry = async (fx, h) => {
    const to = await at(fx, h, 40);
    await page.evaluate(async (to) => { const g = neo.scene.game; const p = g.pail.node.getGlobalPosition(); const s = g.view.scale; const path = kit.line([p.x, p.y - 60 * s], to, 16); for (let i = 0; i < 4; i++) path.push(to); await kit.drag(path, 1, 30); }, to);
  };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1 (toddler): two pulls up the sand, each let go, are the two cycles; nothing is counted.
  await launch('tide-line', 1, 'Mia', 'toddler');
  await page.waitForTimeout(800);
  await pull(0.9);
  let s = await state();
  assert.ok(s.sea > 0.6, `the sea follows the finger up the sand (${s.sea.toFixed(2)})`);
  await page.waitForFunction(() => neo.scene.game.sea.h < 0.05, null, { timeout: 5000 });
  s = await state();
  assert.equal(s.cycles, 1, 'one pull and let go is one cycle');
  await pull(0.85);
  await finished('tide-line');
  assert.deepEqual(await score(), [0, 0], 'level 1 counts nothing');

  // Level 2 (preschool), pail 1: below the line it floats and is fetched (one miss), twice (the glow, one hint); then dry.
  await launch('tide-line', 2, 'Mia', 'preschool');
  await settle();
  s = await state();
  const wet = s.high - 0.12;
  await carry(0.45, wet);
  await settle();
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.glow, s.inTray], [1, 0, false, true], 'a floated pail is one miss, fetched back to the rocks');
  await carry(0.4, wet);
  await settle();
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.glow], [2, 1, true], 'the second float glows the line: one hint');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(900);
  await screenshot('tide-line-2-portrait');
  await carry(0.5, (s.high + 1) / 2 + 0.04);
  await settle();
  s = await state();
  assert.deepEqual([s.index, s.misses, s.hints, s.glow], [1, 2, 1, false], 'above the line the pail stays dry; the second pail is up');
  // Pail 2, straight above the line.
  await carry(0.3, (s.high + 1) / 2);
  await finished('tide-line');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  assert.deepEqual(await score(), [2, 1], 'level 2 saved 2 misses, 1 hint');
  log('Tide Line 1–2: two pulls finish level 1 (0/0); level 2 floats twice (fetched, then the glow), a dry pail in portrait and a second dry pail (2/1); passed');
}
async function tideLine34Play() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('tide-line').history.at(-1); return [r.misses, r.hints]; });
  const st = () => page.evaluate(() => { const g = neo.scene.game; const r = g.rounds[g.round]; return { round: g.round, lines: r?.lines ?? [], misses: g.misses, hints: g.hints, busy: g.busy, glow: r?.glow ?? false, items: g.items.map((it) => ({ kind: it.kind, h: it.at?.h ?? null, settled: it.settled })) }; });
  const idle = async () => { await page.waitForTimeout(300); await page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.busy && neo.scene.game.items.every((it) => !it.handle.dragging)), null, { timeout: 30000 }); await page.waitForTimeout(900); };
  /** Carry a thing so its feet land at shore height `h`, `fx` across the sand (the finger rides 40 units below its feet). */
  const carry = async (kind, fx, h) => {
    await page.evaluate(async ({ kind, fx, h }) => {
      const g = neo.scene.game; const it = g.items.find((i) => i.kind === kind); const L = g.L; const s = g.view.scale;
      const from = it.node.getGlobalPosition(); const to = g.board.toGlobal({ x: L.sand.x + L.sand.w * fx, y: L.low - h * (L.low - L.dunes) + 40 });
      const path = kit.line([from.x, from.y - 50 * s], [to.x, to.y], 16); for (let i = 0; i < 4; i++) path.push([to.x, to.y]); await kit.drag(path, 1, 30);
    }, { kind, fx, h });
    await page.waitForTimeout(400);
  };
  const wave = () => page.evaluate(() => kit.tapOn(neo.scene.game.waveBtn, 65 * neo.scene.game.view.scale, 60 * neo.scene.game.view.scale));
  const dryH = (lines) => (Math.max(...lines) + 0.025 + 1) / 2;
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 3 (pre-K). Round 1: the wave tapped too early is not counted; then all three above the line stay dry.
  await launch('tide-line', 3, 'Mia', 'prek');
  await idle();
  let s = await st();
  assert.equal(s.lines.length, 1, 'round 1 has one line');
  await carry('pail', 0.3, dryH(s.lines));
  await wave();
  await page.waitForTimeout(600);
  s = await st();
  assert.deepEqual([s.misses, s.busy], [0, false], 'the wave before all three are placed is not counted and does not run');
  await carry('flag', 0.5, dryH(s.lines));
  await carry('towel', 0.72, dryH(s.lines));
  await wave();
  await page.waitForFunction(() => neo.scene.game.round === 1 && !neo.scene.game.busy, null, { timeout: 15000 });
  await page.waitForTimeout(900);
  s = await st();
  assert.equal(s.lines.length, 2, 'round 2 has the windy-day line too');
  assert.equal(s.misses, 0, 'round 1 all dry');
  // Round 2: the pail between the lines floats (one miss) and is fetched; the other two stay put.
  const between = (Math.min(...s.lines) + 0.025 + Math.max(...s.lines) - 0.025) / 2;
  await carry('pail', 0.3, between);
  await carry('flag', 0.5, dryH(s.lines));
  await carry('towel', 0.72, dryH(s.lines));
  await screenshot('tide-line-3-two-lines');
  await wave();
  await page.waitForTimeout(1200);
  await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 15000 });
  s = await st();
  assert.deepEqual([s.misses, s.hints, s.glow], [1, 0, false], 'the pail between the lines is one miss, no glow yet');
  assert.deepEqual(s.items.map((i) => [i.kind, i.h === null, i.settled]), [['pail', true, false], ['flag', false, true], ['towel', false, true]], 'the pail is back on the rocks; the dry flag and towel stay');
  await carry('pail', 0.3, dryH(s.lines));
  await wave();
  await finished('tide-line');
  assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');

  // Level 4 (pre-K), the authored strip (in, out, in, gap; the answer is out): two wrong cards (the second glows), then right.
  await launch('tide-line', 4, 'Mia', 'prek');
  await page.waitForTimeout(1200);
  const tapCard = (kind) => page.evaluate((kind) => kit.tapOn(neo.scene.game.cards.find((c) => c.kind === kind).node), kind);
  const st4 = () => page.evaluate(() => { const g = neo.scene.game; const t = g.strips[g.index]; return { index: g.index, misses: g.misses, hints: g.hints, glow: t?.glow ?? false, busy: g.busy }; });
  await tapCard('high');
  await page.waitForTimeout(700);
  let t = await st4();
  assert.deepEqual([t.misses, t.hints, t.glow], [1, 0, false], 'a wrong card is one miss');
  await tapCard('mid');
  await page.waitForTimeout(700);
  t = await st4();
  assert.deepEqual([t.misses, t.hints, t.glow], [2, 1, true], 'the halfway card is wrong too; the second glows the right card (one hint)');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(900);
  await screenshot('tide-line-4-portrait');
  await tapCard('low');
  await page.waitForFunction(() => neo.scene.finished || (neo.scene.game.index === 1 && !neo.scene.game.busy), null, { timeout: 15000 });
  t = await st4();
  assert.equal(t.index, 1, 'the right card finishes the first strip');
  await page.evaluate(() => { const g = neo.scene.game; const ans = g.strips[g.index].strip.pics[g.strips[g.index].strip.gap]; kit.tapOn(g.cards.find((c) => c.kind === ans).node); });
  await finished('tide-line');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  assert.deepEqual(await score(), [2, 1], 'level 4 saved 2 misses, 1 hint');
  log('Tide Line 3–4: level 3 an early wave not counted, round 1 dry, round 2 a pail between the lines floats and is fetched (1/0); level 4 two wrong cards then the glow in portrait, two strips (2/1); passed');
}
return { tideLinePlay, tideLine34Play };
}
