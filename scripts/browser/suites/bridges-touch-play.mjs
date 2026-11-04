import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Island Bridges by touch: both ends of the ladder, a plank that does not belong, Take off, a hint, targets of at least 64 units upright and sideways. */
async function bridgesTouchPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, size: g.puzzle.size, misses: g.misses, hints: g.hints, entries: g.entries, planks: g.planks.slice(), sol: g.puzzle.solution.slice(), hinted: !!g.hinted, taking: g.taking }; });
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 15000 });
  const tapEdge = (k) => page.evaluate(async (k) => { const L = await import('/src/games/island-bridges/logic.ts'), g = neo.scene.game, w = L.waterOf(g.layout, g.cell, k), p = g.board.toGlobal(w); kit.tap(p.x, p.y); }, k);
  const tapSlot = (kind) => page.evaluate((kind) => { const g = neo.scene.game, s = g.slots.find((s) => s.kind === kind), p = g.touchLayer.toGlobal({ x: s.x + s.w / 2, y: s.y + s.h / 2 }); kit.tap(p.x, p.y); }, kind);
  const solveAll = async () => {
    for (let guard = 0; guard < 120 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
      await idle();
      const st = await state();
      if (st.taking) { await tapSlot('take'); await page.waitForTimeout(80); continue; }
      const k = st.sol.findIndex((n, i) => st.planks[i] < n);
      if (k < 0) { await page.waitForTimeout(300); continue; }
      await tapEdge(k); await page.waitForTimeout(100);
    }
  };
  /** The sea's water and every button: at least 64 logical units, on screen, buttons apart from each other and the sea. */
  const targets = (label) => page.evaluate((label) => {
    const g = neo.scene.game, out = [], size = g.puzzle.size, sea = { x: g.board.x, y: g.board.y, w: size * g.cell, h: size * g.cell };
    if (g.cell < 64) out.push(`cell ${g.cell}`);
    const rects = g.slots.map((s) => ({ name: s.kind, x: s.x, y: s.y, w: s.w, h: s.h }));
    for (const r of rects) {
      if (r.w < 64 || r.h < 64) out.push(`${r.name} small ${r.w}x${r.h}`);
      if (r.x < 0 || r.y < 0 || r.x + r.w > neo.view.w || r.y + r.h > neo.view.h) out.push(`${r.name} off screen`);
      if (r.x < sea.x + sea.w && sea.x < r.x + r.w && r.y < sea.y + sea.h && sea.y < r.y + r.h) out.push(`${r.name} over the sea`);
    }
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) out.push(`${a.name} overlaps ${b.name}`);
    }
    if (sea.x < 0 || sea.y < 0 || sea.x + sea.w > neo.view.w || sea.y + sea.h > neo.view.h) out.push('sea off screen');
    return out.map((m) => `${label}: ${m} (${neo.view.w}x${neo.view.h}, scale ${neo.view.scale})`);
  }, label);
  // Level 6 (Keep them joined), alone under BRIDGES_ONLY=6: in portrait, ask for hints and lay each until one is keep-them-joined
  // (its line, the dashed group), screenshot the ring, then finish the sea for one sticker with only hints counted.
  if (process.env.BRIDGES_ONLY === '6') {
    await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
    await launch('island-bridges', 6); await idle();
    const before6 = await page.evaluate(() => kit.store.data.stickers.length);
    assert.equal((await state()).size, 9);
    assert.deepEqual(await targets('level 6 portrait'), []);
    await page.evaluate(() => { const g = neo.scene.game, say = g.ctx.say; g.spoken = []; g.ctx.say = (id, ...args) => { g.spoken.push(id); return say(id, ...args); }; });
    let joined = null, asked = 0;
    for (let guard = 0; guard < 60 && !joined; guard++) {
      await idle();
      await tapSlot('hint'); await page.waitForTimeout(250); asked++;
      const h = await page.evaluate(() => { const g = neo.scene.game; return g.hinted && { ...g.hinted, spoken: g.spoken.at(-1) }; });
      assert.ok(h && h.kind !== 'next' && h.kind !== 'fix', `a counted or joined hint each time: ${JSON.stringify(h)}`);
      if (h.kind === 'joined') { joined = h; break; }
      await tapEdge(h.edge); await page.waitForTimeout(150);
    }
    assert.ok(joined, 'the hints reach a keep-them-joined step');
    assert.equal(joined.spoken, joined.closing === joined.edge ? 'bridges.hint-joined-same' : 'bridges.hint-joined');
    assert.ok(joined.group.length >= 2, 'a group of at least two islands is ringed');
    await page.waitForTimeout(400);
    await screenshot('bridges-touch-6-joined-portrait');
    await solveAll(); await finished('island-bridges');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before6 + 1, 'one sticker at level 6');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('island-bridges').history.at(-1); return [r.misses, r.hints]; }), [0, asked]);
    log(`Island Bridges level 6: ${asked} hints to a keep-them-joined step (${joined.spoken}, group of ${joined.group.length}), portrait ring, one sticker passed`);
    assert.deepEqual(errors, []); return;
  }
  // Level 5 (5 by 5, the entry): one hint names its reason in its spoken line, targets upright and sideways, one sticker.
  await launch('island-bridges', 5); await idle();
  const before5 = await page.evaluate(() => kit.store.data.stickers.length);
  assert.equal((await state()).size, 5);
  assert.deepEqual(await targets('level 5 landscape'), []);
  await page.evaluate(() => { const g = neo.scene.game, say = g.ctx.say; g.spoken = []; g.ctx.say = (id, ...args) => { g.spoken.push(id); return say(id, ...args); }; });
  await tapSlot('hint'); await page.waitForTimeout(300);
  const named = await page.evaluate(() => { const g = neo.scene.game; return { kind: g.hinted?.kind, why: g.hinted?.why, spoken: g.spoken.slice(), hints: g.hints }; });
  assert.equal(named.kind, 'forced', 'an empty small sea has an island that forces a plank');
  assert.ok(named.spoken.includes(`bridges.hint-${named.why}`), `the named line for ${named.why}: ${named.spoken}`);
  assert.equal(named.hints, 1);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 5 portrait'), []);
  await screenshot('bridges-touch-5-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await solveAll(); await finished('island-bridges');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before5 + 1, 'one sticker at level 5');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('island-bridges').history.at(-1); return [r.misses, r.hints]; }), [0, 1]);
  log(`Island Bridges level 5: 5 by 5, a ${named.why} hint with its line, 64-unit targets both ways, one sticker passed`);
  if (process.env.BRIDGES_ONLY === '5') { assert.deepEqual(errors, []); return; }
  // Level 1 (7 by 7): a plank that is not in the answer is not a miss (decided 2026-10-23), Take off lifts it for free, a hint counts once, then the sea is joined.
  await launch('island-bridges', 1); await idle();
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  let st = await state();
  assert.equal(st.size, 7);
  assert.deepEqual(await targets('level 1 landscape'), []);
  // The first stretch of water that can hold one plank more than the answer: its last plank is the stray one.
  const wrong = await page.evaluate(async () => {
    const L = await import('/src/games/island-bridges/logic.ts'), g = neo.scene.game, sol = g.puzzle.solution;
    return sol.findIndex((n, k) => n < 2 && L.canAdd(g.layout, sol.map((m, j) => (j === k ? n : 0)), k));
  });
  assert.ok(wrong >= 0, 'a sea has a stretch that can take a stray plank');
  const right = st.sol[wrong];
  for (let i = 0; i <= right; i++) { await tapEdge(wrong); await page.waitForTimeout(150); }
  st = await state(); assert.deepEqual([st.planks[wrong], st.misses, st.entries], [right + 1, 0, right + 1], 'a plank beyond the answer is not a miss');
  await tapSlot('take'); await page.waitForTimeout(120);
  assert.equal((await state()).taking, true);
  await tapEdge(wrong); await page.waitForTimeout(150);
  st = await state(); assert.deepEqual([st.planks[wrong], st.misses], [right, 0], 'taking it off is free');
  await tapSlot('take'); await page.waitForTimeout(120);
  assert.equal((await state()).taking, false);
  await tapSlot('hint'); await page.waitForTimeout(300);
  st = await state(); assert.deepEqual([st.hints, st.hinted], [1, true]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 1 portrait'), []);
  await screenshot('bridges-touch-1-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  // A bridge the answer wants and the sea has none on yet (the stray plank's bridge may be the first one).
  st = await state();
  const first = st.sol.findIndex((n, k) => n > 0 && st.planks[k] === 0);
  await tapEdge(first); await page.waitForTimeout(150);
  assert.equal((await state()).planks[first], 1);
  await tapSlot('again'); await page.waitForTimeout(300);
  assert.ok((await state()).planks.every((n) => n === 0), 'start over clears the sea');
  await solveAll(); await finished('island-bridges');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('island-bridges').history.at(-1); return [r.misses, r.hints]; }), [0, 1]);
  // Level 4 (11 by 11): every target still 64 or more, sideways and upright, solved by touch with no help.
  await launch('island-bridges', 4); await idle();
  assert.equal((await state()).size, 11);
  assert.deepEqual(await targets('level 4 landscape'), []);
  await screenshot('bridges-touch-4-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 4 portrait'), []);
  await screenshot('bridges-touch-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await solveAll(); await finished('island-bridges');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('island-bridges').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // From Lantern Lake it plays here, by touch, and leaving mid-round is quiet.
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; neo.go.land('lantern-lake'); }); await scene('LandScene');
  await page.evaluate(() => neo.go.game('island-bridges', 'grownup', undefined, false, { land: 'lantern-lake' })); await scene('GameScene'); await idle();
  await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene'); await page.waitForTimeout(500);
  assert.deepEqual(errors, []);
  log('Island Bridges touch: first and last level, a stray plank, Take off, one hint, start over, 64-unit targets upright and sideways, one sticker each passed');
}

return { bridgesTouchPlay };
}
