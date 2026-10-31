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
return { tideLinePlay };
}
