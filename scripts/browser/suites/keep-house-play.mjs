import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function keepHousePlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('keep-house').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => { const t = neo.scene.game.tally; return [t.misses, t.hints]; });
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 30000 }); await page.waitForTimeout(150); };
  const tapOn = async (expr, dx = 0, dy = 0) => { await page.evaluate(([expr, dx, dy]) => kit.tapOn(Function(`return (${expr})`)(), dx, dy), [expr, dx, dy]); await page.waitForTimeout(150); };
  /** Drag the object `fromExpr` so that it lands on `toExpr`'s global position (plus an offset); the object rides 40 units above the finger. */
  const dragTo = async (fromExpr, toExpr, dx = 0, dy = 0) => {
    await page.evaluate(async ([fromExpr, toExpr, dx, dy]) => {
      const from = Function(`return (${fromExpr})`)();
      const to = Function(`return (${toExpr})`)();
      const p = to.getGlobalPosition();
      const lift = 40 * neo.view.scale;
      await kit.dragTo(from, { x: p.x + dx * neo.view.scale, y: p.y + dy * neo.view.scale + lift });
    }, [fromExpr, toExpr, dx, dy]);
    await page.waitForTimeout(200);
  };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  // KEEPHOUSE_FROM=5 skips the unchanged levels 1–4.
  const from = Number(process.env.KEEPHOUSE_FROM ?? 1);
  if (from <= 4) {

  // Level 1: a door, the well twice, a repeat tap (a wave), the rest of the doors; nothing counts.
  await launch('keep-house', 1, 'Mia', 'preschool');
  await settle();
  const doors = await page.evaluate(() => neo.scene.game.brief.doors.length);
  assert.equal(doors, 3, 'three doors at preschool');
  await tapOn('neo.scene.game.doorNodes[1]', 75, 100);
  let d = await page.evaluate(() => ({ ...neo.scene.game.doors }));
  assert.deepEqual(d.opened, [false, true, false], 'the middle door opened');
  await tapOn('neo.scene.game.wellNode', 0, -60);
  d = await page.evaluate(() => ({ ...neo.scene.game.doors }));
  assert.equal(d.bucket, 'up', 'the bucket comes up');
  await page.waitForTimeout(350);
  await tapOn('neo.scene.game.wellNode', 0, -60);
  d = await page.evaluate(() => ({ ...neo.scene.game.doors }));
  assert.deepEqual([d.bucket, d.opened], ['down', [false, true, false]], 'the well changes nothing that counts');
  await tapOn('neo.scene.game.doorNodes[1]', 75, 100);
  d = await page.evaluate(() => ({ ...neo.scene.game.doors }));
  assert.deepEqual(d.opened, [false, true, false], 'a repeat tap only waves');
  await screenshot('keep-house-1-landscape');
  await tapOn('neo.scene.game.doorNodes[0]', 75, 100);
  await tapOn('neo.scene.game.doorNodes[2]', 75, 100);
  await finished('keep-house');
  assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

  // Level 2: one figure dropped on a wrong room twice (free, then a miss), a second figure wrong twice (miss, glow and one hint), then every figure to its workplace; the second yard clean.
  await launch('keep-house', 2);
  await settle();
  const yard = await page.evaluate(() => JSON.parse(JSON.stringify(neo.scene.game.yardBrief)));
  const wp = await page.evaluate(async () => { const { workplaceOf } = await import('/src/games/keep-house/logic.ts'); return Object.fromEntries(['cook', 'groom', 'ringer', 'steward', 'horse', 'hens'].map((f) => [f, workplaceOf(f)])); });
  const roomIndex = (room) => yard.rooms.indexOf(room);
  const wrongRoom = (f) => yard.rooms.findIndex((r) => r !== wp[f]);
  const fig = (f) => `neo.scene.game.figureNodes.get('${f}').node`;
  const room = (i) => `neo.scene.game.roomNodes[${i}]`;
  const [a, b, c] = yard.figures;
  await dragTo(fig(a), room(wrongRoom(a)), 110, 150); await settle();
  let y = await page.evaluate(() => JSON.parse(JSON.stringify(neo.scene.game.yard)));
  assert.deepEqual([y.misses, y.hinted, Object.keys(y.placed)], [0, false, []], 'a first wrong room is free and the figure floats home');
  await dragTo(fig(a), room(wrongRoom(a)), 110, 150); await settle();
  y = await page.evaluate(() => JSON.parse(JSON.stringify(neo.scene.game.yard)));
  assert.deepEqual([y.misses, y.hinted], [1, false], 'the second wrong room is one miss');
  await dragTo(fig(b), room(wrongRoom(b)), 110, 150); await settle();
  await dragTo(fig(b), room(wrongRoom(b)), 110, 150); await settle();
  y = await page.evaluate(() => JSON.parse(JSON.stringify(neo.scene.game.yard)));
  assert.deepEqual([y.misses, y.hinted], [2, true], 'two misses light the glow (one hint)');
  assert.deepEqual(await tally(), [2, 1]);
  const glow = await page.evaluate(async () => { const { glowTarget } = await import('/src/games/keep-house/logic.ts'); const g = neo.scene.game; return glowTarget(g.yardBrief, g.yard, null); });
  assert.equal(glow.figure, a, 'the glow names the next unplaced figure');
  for (const f of [a, b, c]) { await dragTo(fig(f), room(roomIndex(wp[f])), 110, 150); await settle(); }
  assert.equal(await page.evaluate(() => neo.scene.game.yardIndex), 1, 'the first yard is done');
  const yard2 = await page.evaluate(() => JSON.parse(JSON.stringify(neo.scene.game.yardBrief)));
  for (const f of yard2.figures) { await dragTo(fig(f), `neo.scene.game.roomNodes[${yard2.rooms.indexOf(wp[f])}]`, 110, 150); await settle(); }
  await finished('keep-house');
  assert.deepEqual(await score(), [2, 1], 'level 2 saved 2 misses, 1 hint');

  // Level 3: the kitchen on the far spot (cold, never a miss), Keep it twice (one hint, the placement stands), then the stable on the near spot (hot).
  await launch('keep-house', 3);
  await settle();
  await dragTo('neo.scene.game.tileNode', 'neo.scene.game.spotNodes.far'); await settle();
  let pl = await page.evaluate(() => ({ ...neo.scene.game.placement, keepShown: neo.scene.game.keepShown }));
  assert.deepEqual([pl.spot, pl.arrived, pl.done, pl.refusals, pl.keepShown], ['far', 'cold', false, 0, true], 'the far spot arrives cold and Keep it appears');
  await tapOn('neo.scene.game.keepNode'); await settle();
  pl = await page.evaluate(() => ({ ...neo.scene.game.placement }));
  assert.deepEqual([pl.refusals, pl.hinted, pl.done], [1, false, false], 'the first Keep it replays the cold walk');
  await tapOn('neo.scene.game.keepNode'); await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.placementIndex), 1, 'the second Keep it finishes the kitchen as she left it');
  assert.deepEqual(await tally(), [0, 1], 'one hint, no miss');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('keep-house-3-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await dragTo('neo.scene.game.tileNode', 'neo.scene.game.spotNodes.near');
  await finished('keep-house');
  assert.deepEqual(await score(), [0, 1], 'level 3 saved 0 misses, 1 hint');

  // Level 4: an empty bell (no miss), a layout with unmet needs rung once (misses) and again (the glow, one hint), the glow followed to a solution; the second plan from the first solution.
  await launch('keep-house', 4);
  await settle();
  const logic = () => import('/src/games/keep-house/logic.ts');
  const tile = (r) => `neo.scene.game.planTiles.get('${r}').node`;
  const cell = (c) => `neo.scene.game.cellNodes[${c}]`;
  await tapOn('neo.scene.game.bellNode');
  let p = await page.evaluate(() => JSON.parse(JSON.stringify(neo.scene.game.plan)));
  assert.deepEqual([p.misses, Object.keys(p.layout)], [0, []], 'an empty bell press is not a miss');
  // A wrong layout: every room on the plan but in a layout the solver rejects, found by trying free cells in reverse.
  const bad = await page.evaluate(async () => {
    const { freeCells, check, PLAN_ROOMS } = await import('/src/games/keep-house/logic.ts');
    const b = neo.scene.game.boardNow;
    const free = freeCells(b).slice().reverse();
    const l = Object.fromEntries(PLAN_ROOMS.map((r, i) => [r, free[i]]));
    return { layout: l, unmet: check(b, l).map((n) => n.index) };
  });
  assert.ok(bad.unmet.length >= 1, 'the authored wrong layout has an unmet need');
  for (const [r, c] of Object.entries(bad.layout)) await dragTo(tile(r), cell(c), 60, 60);
  p = await page.evaluate(() => JSON.parse(JSON.stringify(neo.scene.game.plan)));
  assert.deepEqual(p.layout, bad.layout, 'every room landed in its cell');
  await tapOn('neo.scene.game.bellNode'); await settle();
  p = await page.evaluate(() => JSON.parse(JSON.stringify(neo.scene.game.plan)));
  assert.equal(p.misses, bad.unmet.length, 'one miss per unmet need');
  if (p.misses < 2) { await tapOn('neo.scene.game.bellNode'); await settle(); p = await page.evaluate(() => JSON.parse(JSON.stringify(neo.scene.game.plan))); }
  assert.equal(p.hinted, true, 'the second miss lights the glow (one hint)');
  const missesSoFar = p.misses;
  for (let guard = 0; guard < 8; guard++) {
    const h = await page.evaluate(async () => { const { hintFor } = await import('/src/games/keep-house/logic.ts'); const g = neo.scene.game; return hintFor(g.boardNow, g.plan.layout); });
    if (!h) break;
    if (h.to === 'tray') await dragTo(tile(h.room), `neo.scene.game.layoutNow && ({ getGlobalPosition: () => neo.scene.game.board.toGlobal({ x: neo.scene.game.layoutNow.tray[0].x + 55, y: neo.scene.game.layoutNow.tray[0].y + 55 }) })`);
    else await dragTo(tile(h.room), cell(h.to), 60, 60);
  }
  const unmetNow = await page.evaluate(async () => { const { check } = await import('/src/games/keep-house/logic.ts'); const g = neo.scene.game; return check(g.boardNow, g.plan.layout).length; });
  assert.equal(unmetNow, 0, 'following the glow reaches a solution');
  await tapOn('neo.scene.game.bellNode'); await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.planIndex), 1, 'the bell with every need met moves to the second plan');
  assert.deepEqual(await tally(), [missesSoFar, 1]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('keep-house-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  const sol = await page.evaluate(async () => { const { solutions } = await import('/src/games/keep-house/logic.ts'); return solutions(neo.scene.game.boardNow)[0]; });
  for (const [r, c] of Object.entries(sol)) await dragTo(tile(r), cell(c), 60, 60);
  await tapOn('neo.scene.game.bellNode');
  await finished('keep-house');
  assert.deepEqual(await score(), [missesSoFar, 1], 'level 4 saved the misses and one hint');
  void logic;
  log(`Keep House 1–4: three doors, the well and a wave (0/0); a figure wrong twice and another wrong twice then the glow (2/1); the far spot kept twice then the near spot (0/1); an empty bell, ${missesSoFar} misses over a wrong plan, the glow to a solution, the second plan solved (${missesSoFar}/1), two portrait screenshots, passed`);
  }

  // Level 5: a room looked at (free), one label wrong twice on another room (two misses, the glow: one hint), the glow followed, the second ruin clean.
  await launch('keep-house', 5, 'Mia', 'school');
  await settle();
  const label = (r) => `neo.scene.game.labelNodes.get('${r}').node`;
  const ruinCell = (c) => `neo.scene.game.ruinCells[${c}]`;
  const rooms = await page.evaluate(() => neo.scene.game.ruinBrief.rooms.map((r) => ({ room: r.room, cell: r.cell })));
  assert.equal(rooms.length, 4, 'four rooms in the ruin');
  await tapOn(ruinCell(rooms[0].cell), 60, 60);
  assert.equal(await page.evaluate(() => neo.scene.game.looked), true, 'a room was looked at');
  assert.deepEqual(await tally(), [0, 0], 'looking is free');
  await dragTo(label(rooms[1].room), ruinCell(rooms[0].cell), 60, 60); await settle();
  assert.deepEqual(await tally(), [1, 0], 'a wrong label is one miss');
  await dragTo(label(rooms[1].room), ruinCell(rooms[0].cell), 60, 60); await settle();
  assert.deepEqual(await tally(), [2, 1], 'the second miss lights the glow, one hint');
  for (let i = 0; i < 4; i++) {
    const h = await page.evaluate(async () => { const { ruinHint } = await import('/src/games/keep-house/logic.ts'); const g = neo.scene.game; return ruinHint(g.ruinBrief, g.ruin, null); });
    assert.ok(h && !h.spare, 'the glow names a room');
    await dragTo(label(h.label), ruinCell(h.cell), 60, 60); await settle();
  }
  assert.equal(await page.evaluate(() => neo.scene.game.ruinIndex), 1, 'following the glow finishes the first ruin');
  assert.deepEqual(await tally(), [2, 1]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('keep-house-5-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  const rooms2 = await page.evaluate(() => neo.scene.game.ruinBrief.rooms.map((r) => ({ room: r.room, cell: r.cell })));
  for (const r of rooms2) { await dragTo(label(r.room), ruinCell(r.cell), 60, 60); await settle(); }
  await finished('keep-house');
  assert.deepEqual(await score(), [2, 1], 'level 5 saved two misses and one hint');

  // Level 6: the first lord built the other way, Keep it twice (one hint, no miss); the second lord built the fitting way.
  await launch('keep-house', 6, 'Mia', 'school');
  await settle();
  const row = (b) => `neo.scene.game.rowNodes[${b === 'timber' ? 0 : 1}]`;
  const fitNow = () => page.evaluate(async () => { const { fits } = await import('/src/games/keep-house/logic.ts'); return fits(neo.scene.game.situation); });
  let want = await fitNow();
  const other = want === 'timber' ? 'stone' : 'timber';
  await tapOn(row(other)); await tapOn('neo.scene.game.buildNode'); await settle();
  let bs = await page.evaluate(() => ({ ...neo.scene.game.buildState, keepShown: neo.scene.game.keepShown }));
  assert.deepEqual([bs.choice, bs.done, bs.keepShown], [other, false, true], 'the other choice plays out and asks; Keep it appears');
  assert.deepEqual(await tally(), [0, 0], 'a choice is never a miss');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('keep-house-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await tapOn('neo.scene.game.keepNode'); await settle();
  bs = await page.evaluate(() => ({ ...neo.scene.game.buildState }));
  assert.deepEqual([bs.refusals, bs.hinted, bs.done], [1, false, false], 'the first Keep it replays the years');
  await tapOn('neo.scene.game.keepNode'); await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.buildIndex), 1, 'the second Keep it finishes the situation as she left it');
  assert.deepEqual(await tally(), [0, 1], 'one hint, no miss');
  want = await fitNow();
  await tapOn(row(want)); await tapOn('neo.scene.game.buildNode');
  await finished('keep-house');
  assert.deepEqual(await score(), [0, 1], 'level 6 saved 0 misses, 1 hint');
  log('Keep House 5–6: a look, a label wrong twice then the glow followed, the second ruin clean (2/1); the other build kept twice, then the fitting build (0/1); two portrait screenshots, passed');
}
return { keepHousePlay };
}
