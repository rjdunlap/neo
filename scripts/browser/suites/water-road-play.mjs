import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function waterRoadPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('water-road').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => { const t = neo.scene.game.tally; return [t.misses, t.hints]; });
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 40000 }); await page.waitForTimeout(150); };
  const tapOn = async (expr) => { await page.evaluate((expr) => kit.tapOn(Function(`return (${expr})`)()), expr); await page.waitForTimeout(150); };
  // A tap on the stage below the pile, in logical units scaled to the screen.
  const tapPile = async () => { await page.evaluate(() => { const g = neo.scene.game; const p = g.layoutNow.pile[0]; const s = neo.view.scale; kit.tapOn(g.tapLayer, p.x * s, (p.y + 60) * s); }); await page.waitForTimeout(120); };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1 at toddler: three stones; a pull before the ring is closed wobbles; every tap places a stone from the ends inward; the last is the keystone; the frame comes away and the pet walks through; nothing counts.
  await launch('water-road', 1, 'Mia', 'toddler');
  await settle();
  let plan = await page.evaluate(() => ({ stones: neo.scene.game.plan.stones, level: neo.scene.game.plan.level }));
  assert.equal(plan.stones, 3, 'three stones at toddler');
  await tapOn('neo.scene.game.handleNodes[0]');
  assert.deepEqual(await page.evaluate(() => ({ ...neo.scene.game.ks })), { placed: 0, pulled: false }, 'a pull before the ring is closed changes nothing');
  for (let i = 0; i < 3; i++) { await tapPile(); await page.waitForTimeout(500); }
  assert.equal(await page.evaluate(() => neo.scene.game.ks.placed), 3, 'three taps close the ring');
  await screenshot('water-road-1-landscape');
  await tapPile();
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => neo.scene.game.ks.pulled), true, 'a toddler tap anywhere pulls the closed ring');
  await finished('water-road');
  assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

  // Level 1 at preschool: five or seven stones; the handle pulls.
  await launch('water-road', 1, 'Mia', 'preschool');
  await settle();
  plan = await page.evaluate(() => ({ stones: neo.scene.game.plan.stones }));
  assert.ok(plan.stones === 5 || plan.stones === 7, 'five or seven stones at preschool');
  for (let i = 0; i < plan.stones; i++) { await tapPile(); await page.waitForTimeout(350); }
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => neo.scene.game.ks.placed), plan.stones, 'every stone is on');
  await tapPile();
  assert.equal(await page.evaluate(() => neo.scene.game.ks.pulled), false, 'a preschool tap off the handle does not pull');
  await tapOn('neo.scene.game.handleNodes[0]');
  await finished('water-road');
  assert.deepEqual(await score(), [0, 0], 'level 1 at preschool saved 0/0');

  // Level 2: both frames of each free pair pulled (the open one first, then the closed one: nothing counts); on the asked pair the open ring twice (miss, then glow and hint), then the closed one; a portrait screenshot of the asked pair.
  await launch('water-road', 2, 'Mia', 'prek');
  await settle();
  const pairInfo = () => page.evaluate(() => { const g = neo.scene.game; const p = g.plan.pairs[g.ps.pair]; return { pair: g.ps.pair, closed: p.closed, gap: p.arches[1 - p.closed].gap, pulled: g.ps.pulled.slice(), done: g.ps.done }; });
  for (let p = 0; p < 2; p++) {
    let info = await pairInfo();
    assert.equal(info.pair, p, `pair ${p}`);
    await tapOn(`neo.scene.game.frames[${1 - info.closed}].box`); await settle();
    info = await pairInfo();
    assert.equal(info.pair, p, 'the open ring fell; still this pair');
    assert.deepEqual(await tally(), [0, 0], 'a free pull counts nothing');
    await tapOn(`neo.scene.game.frames[${info.closed}].box`); await settle();
  }
  let info = await pairInfo();
  assert.equal(info.pair, 2, 'the asked pair');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('water-road-2-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  info = await pairInfo();
  await tapOn(`neo.scene.game.frames[${1 - info.closed}].box`); await page.waitForTimeout(300);
  assert.deepEqual(await tally(), [1, 0], 'the open ring is one miss');
  assert.deepEqual((await pairInfo()).pulled, [false, false], 'both frames stay');
  await tapOn(`neo.scene.game.frames[${1 - info.closed}].box`); await page.waitForTimeout(300);
  assert.deepEqual(await tally(), [2, 1], 'the second miss glows (one hint)');
  assert.equal(await page.evaluate(() => neo.scene.game.tallies.glowing), true, 'the closed ring glows');
  await tapOn(`neo.scene.game.frames[${info.closed}].box`);
  await finished('water-road');
  assert.deepEqual(await score(), [2, 1], 'level 2 saved 2 misses, 1 hint');

  // Level 3: a pull with the block in the tray spreads (miss), the block on the wrong side spreads (miss, glow, hint), then the block to the glowing side and the pull stands; the second arch straight.
  await launch('water-road', 3, 'Mia', 'prek');
  await settle();
  const archInfo = () => page.evaluate(async () => { const { hintFor } = await import('/src/games/water-road/logic.ts'); const g = neo.scene.game; return { arch: g.bs.arch, block: g.bs.block, standing: g.bs.standing, need: hintFor(g.plan.arches[g.bs.arch]) }; });
  const dragBlock = async (where) => {
    await page.evaluate((where) => { const g = neo.scene.game; const l = g.layoutNow; const r = where === 'tray' ? l.tray : l.slots[where]; return kit.dragTo(g.blockNode, { x: r.x + r.w / 2, y: r.y + r.h / 2 + 40 }, 12); }, where);
    await page.waitForTimeout(400);
  };
  let a = await archInfo();
  assert.equal(a.arch, 0);
  assert.ok(a.need === 'left' || a.need === 'right', 'the first arch has one open side');
  await tapOn('neo.scene.game.handleNodes[0]'); await settle();
  assert.deepEqual(await tally(), [1, 0], 'a pull with nothing placed spreads: one miss');
  const wrong = a.need === 'left' ? 'right' : 'left';
  await dragBlock(wrong);
  a = await archInfo();
  assert.equal(a.block, wrong, 'the block sits in the wrong slot (free)');
  await tapOn('neo.scene.game.handleNodes[0]'); await settle();
  assert.deepEqual(await tally(), [2, 1], 'the second spread glows (one hint)');
  a = await archInfo();
  assert.equal(a.block, 'tray', 'the block floated home');
  await dragBlock(a.need);
  a = await archInfo();
  assert.equal(a.block, a.need, 'the block is on the open side');
  await tapOn('neo.scene.game.handleNodes[0]'); await settle();
  a = await archInfo();
  assert.equal(a.arch, 1, 'the first arch stood; the second is up');
  assert.deepEqual(await tally(), [2, 1], 'the second arch starts with the round totals');
  if (a.need) await dragBlock(a.need);
  await tapOn('neo.scene.game.handleNodes[0]');
  await finished('water-road');
  assert.deepEqual(await score(), [2, 1], 'level 3 saved 2 misses, 1 hint');
  log('Water Road 1–3: three stones and any tap pulls at toddler, the handle at preschool (0/0), free pulls then the open ring twice on the asked pair (2/1), a bare pull and the wrong side then the glowing side (2/1), a portrait screenshot, passed');
}
async function waterFlowPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('water-road').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => { const t = neo.scene.game.tally; return [t.misses, t.hints]; });
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 40000 }); await page.waitForTimeout(150); };
  const tap = async (expr) => { await page.evaluate((expr) => kit.tapOn(Function(`return (${expr})`)()), expr); await page.waitForTimeout(150); };
  const open = async () => { await tap('neo.scene.game.openNode'); await settle(); };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Pre-K level 4: Open with no channel is free; the climbing channel pools (one miss, the choice stays); the falling one runs; the second road straight.
  await launch('water-road', 4, 'Mia', 'prek');
  await settle();
  const road = () => page.evaluate(() => { const g = neo.scene.game; return { kind: g.plan.kind, road: g.ds.road, chosen: g.ds.chosen, good: g.plan.roads[g.ds.road].good }; });
  let r = await road();
  assert.equal(r.kind, 'cards', 'pre-K picks a whole channel');
  await open();
  assert.deepEqual(await tally(), [0, 0], 'opening with no channel is free');
  await tap(`neo.scene.game.cardNodes[${1 - r.good}]`);
  await tap(`neo.scene.game.cardNodes[${r.good}]`);
  await tap(`neo.scene.game.cardNodes[${1 - r.good}]`);
  assert.deepEqual(await tally(), [0, 0], 'choosing and swapping channels is free');
  await open();
  assert.deepEqual(await tally(), [1, 0], 'the climbing channel pools: one miss');
  assert.equal((await road()).chosen, 1 - r.good, 'the chosen channel stays');
  await screenshot('water-road-4-prek');
  await tap(`neo.scene.game.cardNodes[${r.good}]`);
  await open();
  r = await road();
  assert.equal(r.road, 1, 'the falling channel reached the fountain; the second road');
  await tap(`neo.scene.game.cardNodes[${r.good}]`);
  await tap('neo.scene.game.openNode');
  await finished('water-road');
  assert.deepEqual(await score(), [1, 0], 'pre-K level 4 saved 1 miss, 0 hints');

  // School level 4: two pooled openings (two misses, the glow: one hint), then the arrows along the glow to a falling road; the second road by the hint, no misses.
  await launch('water-road', 4, 'Mia', 'school');
  await settle();
  const hint = () => page.evaluate(async () => { const { pierHint, roadNow, falls } = await import('/src/games/water-road/logic.ts'); const g = neo.scene.game; const rd = roadNow(g.plan, g.ds); return { road: g.ds.road, piers: rd.piers.slice(), falls: falls(rd), hint: pierHint(rd) }; });
  let h = await hint();
  assert.equal(h.falls, false, 'road 1 starts wrong');
  assert.equal(h.hint.dir, -1, 'road 1 starts with a hump: the first hint is down');
  await open();
  assert.deepEqual(await tally(), [1, 0], 'a pooled opening is one miss');
  assert.deepEqual((await hint()).piers, h.piers, 'nothing she set moves');
  await screenshot('water-road-4-school');
  await open();
  assert.deepEqual(await tally(), [2, 1], 'the second pooled opening glows (one hint)');
  assert.equal(await page.evaluate(() => neo.scene.game.tallies.glowing), true, 'the arrow glows');
  for (let i = 0; i < 12 && !(h = await hint()).falls; i++) await tap(`neo.scene.game.arrowNodes[${h.hint.pier}].${h.hint.dir === 1 ? 'up' : 'down'}`);
  assert.equal((await hint()).falls, true, 'following the glow reaches a falling road');
  assert.deepEqual(await tally(), [2, 1], 'presses are free');
  await open();
  h = await hint();
  assert.equal(h.road, 1, 'the second road');
  assert.equal(h.hint.dir, 1, 'road 2 starts with a dip: the first hint is up');
  for (let i = 0; i < 12 && !(h = await hint()).falls; i++) await tap(`neo.scene.game.arrowNodes[${h.hint.pier}].${h.hint.dir === 1 ? 'up' : 'down'}`);
  await tap('neo.scene.game.openNode');
  await finished('water-road');
  assert.deepEqual(await score(), [2, 1], 'school level 4 saved 2 misses, 1 hint');

  // Level 5: a second valley with four spans (relaunched until the seed draws one); on the first valley every arch across and the one block on the rock end: the earth end slides (one miss); Help glows the block to move (one hint); then it stands.
  let spans = 0;
  for (let i = 0; i < 10 && spans !== 4; i++) {
    await launch('water-road', 5, 'Mia', 'school');
    await settle();
    spans = await page.evaluate(() => neo.scene.game.plan.valleys[1].spans);
  }
  assert.equal(spans, 4, 'a second valley with four spans');
  const valley = () => page.evaluate(() => { const g = neo.scene.game; const v = g.plan.valleys[g.vs.valley]; return { valley: g.vs.valley, spans: v.spans, ends: v.ends, arcade: JSON.parse(JSON.stringify(g.vs.arcade)), pieces: g.pieces.map(p => ({ kind: p.kind, where: p.where })) }; });
  const drag = async (kind, from, to) => {
    await page.evaluate(({ kind, from, to }) => {
      const g = neo.scene.game; const l = g.layoutNow;
      const p = g.pieces.find(p => p.kind === kind && p.where === from);
      const r = typeof to === 'number' ? l.spans[to] : to === 'tray' ? (kind === 'arch' ? l.trayArches[p.spot] : l.trayAbutments[p.spot]) : l.ends[to];
      return kit.dragTo(p.node, p.node.parent.toGlobal({ x: r.x + r.w / 2, y: r.y + r.h / 2 + 40 }), 12);
    }, { kind, from, to });
    await page.waitForTimeout(400);
  };
  let v = await valley();
  assert.equal(v.spans, 3, 'the first valley has three spans');
  const rock = v.ends.near === 'rock' ? 'near' : 'far';
  const earth = rock === 'near' ? 'far' : 'near';
  for (let i = 0; i < v.spans; i++) await drag('arch', 'tray', i);
  await drag('abutment', 'tray', 'tray');
  await drag('abutment', 'tray', rock);
  v = await valley();
  assert.deepEqual(v.arcade, { arches: [true, true, true], abut: { [rock]: true, [earth]: false } }, 'every arch across and the block on the rock end (free)');
  assert.deepEqual(await tally(), [0, 0], 'drags are free');
  await open();
  assert.deepEqual(await tally(), [1, 0], 'the earth end slid: one miss');
  v = await valley();
  const endArch = earth === 'near' ? 0 : 2;
  assert.equal(v.arcade.arches[endArch], false, 'the end arch slid back to the tray');
  assert.equal(v.arcade.arches.filter(Boolean).length, 2, 'the held arches stayed');
  assert.equal(v.arcade.abut[rock], true, 'the block stayed on the rock end');
  await page.evaluate(() => neo.scene.game.askForHint());
  assert.deepEqual(await tally(), [1, 1], 'Help glows (one hint)');
  const glowMove = await page.evaluate(async () => { const { valleyHint } = await import('/src/games/water-road/logic.ts'); const g = neo.scene.game; return valleyHint(g.plan.valleys[g.vs.valley], g.vs.arcade); });
  assert.deepEqual(glowMove, { kind: 'span', span: endArch }, 'the glow names the empty span first');
  await drag('arch', 'tray', endArch);
  assert.deepEqual(await page.evaluate(async () => { const { valleyHint } = await import('/src/games/water-road/logic.ts'); const g = neo.scene.game; return valleyHint(g.plan.valleys[g.vs.valley], g.vs.arcade); }), { kind: 'move', from: rock, to: earth }, 'then the block on the rock end glows to move');
  await drag('abutment', rock, earth);
  await open();
  v = await valley();
  assert.equal(v.valley, 1, 'the first valley stood; the second is up');
  assert.equal(v.spans, 4, 'four spans');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(1200);
  for (let i = 0; i < 2; i++) await drag('arch', 'tray', i);
  assert.deepEqual((await valley()).arcade.arches, [true, true, false, false], 'two arches placed in portrait');
  await screenshot('water-road-5-portrait');
  assert.ok(await page.evaluate(() => !!neo.scene.game.layoutNow), 'four spans fit the portrait view');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  for (let i = 2; i < 4; i++) await drag('arch', 'tray', i);
  for (const e of ['near', 'far']) if (v.ends[e] === 'earth') await drag('abutment', 'tray', e);
  await tap('neo.scene.game.openNode');
  await finished('water-road');
  assert.deepEqual(await score(), [1, 1], 'level 5 saved 1 miss, 1 hint');
  log('Water Road 4–5: pre-K free no-channel opening and swaps, the climbing channel pooled (1/0); school two pooled openings, the glow to a falling road, a dip road (2/1); level 5 the block on the rock end slid the earth end, Help, the move, a four-span valley in portrait (1/1), passed');
}
return { waterRoadPlay, waterFlowPlay };
}
