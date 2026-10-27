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
return { waterRoadPlay };
}
