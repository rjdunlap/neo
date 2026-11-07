import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Bolt Boards by touch: level 1 solved by taps, level 7 with a covered tap and a covered hole (two misses, one hint), level 8's authored swing and free covered hole, level 6 upright, level 9 built upright; one sticker each. */
async function boltBoardsPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, misses: g.misses, hints: g.hints, state: g.state.join(','), lifted: g.lifted, hinted: !!g.hinted, finished: g.finished }; });
  const idle = () => page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, { timeout: 15000 });
  const tapAt = async (x, y) => {
    const p = await page.evaluate(({ x, y }) => neo.scene.game.hitLayer.toGlobal({ x, y }), { x, y });
    await page.evaluate(({ x, y }) => kit.tap(x, y), p); await page.waitForTimeout(160);
  };
  const tapWall = async (q) => { const v = await page.evaluate(async (q) => { const L = await import('/src/games/bolt-boards/logic.ts'); return L.toView(neo.scene.game.layout, q); }, q); await tapAt(v.x, v.y); };
  /** Follow the ghost finger's own choice until the round ends. */
  const solveAll = async () => {
    for (let guard = 0; guard < 120 && !(await page.evaluate(() => neo.scene.finished || neo.scene.game.finished)); guard++) {
      await idle();
      const t = await page.evaluate(() => { const g = neo.scene.game, i = g.autotouch(); return i ? (i.tap.on === g.hitLayer ? { x: i.tap.x, y: i.tap.y } : { undo: true }) : null; });
      if (!t) { await page.waitForTimeout(200); continue; }
      if (t.undo) { await page.evaluate(() => neo.scene.game.undoButton.press()); await page.waitForTimeout(200); continue; }
      await tapAt(t.x, t.y);
      await page.waitForTimeout(250);
    }
    await page.waitForFunction(() => neo.scene.finished, null, { timeout: 20000 });
  };
  // Level 1: two scenes of hanging boards, every tap drops one; no misses.
  await launch('bolt-boards', 1); await idle(); await page.waitForTimeout(300);
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  await solveAll();
  let st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0], 'level 1 solved by taps without a miss');
  await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers, { timeout: 15000 });
  // Level 7: a covered bolt is one miss and changes nothing; a covered hole springs the bolt back, a second miss lights the hint.
  await launch('bolt-boards', 7); await idle(); await page.waitForTimeout(400);
  const stickers7 = await page.evaluate(() => kit.store.data.stickers.length);
  const pick = await page.evaluate(async () => {
    const L = await import('/src/games/bolt-boards/logic.ts'), g = neo.scene.game, p = g.puzzle, s = g.state;
    const covered = p.bolts.map((_, b) => b).find((b) => L.covered(p, s, b));
    const free = L.freeBolts(p, s)[0];
    const open = L.openHoles(p, s);
    let closed = -1;
    for (let h = 0; h < L.holeCount(p); h++) if (!s.includes(h) && !open.includes(h)) closed = h;
    return { covered: covered === undefined ? null : p.bolts[covered], free: p.bolts[free], closed: closed < 0 ? null : L.holeAt(p, closed) };
  });
  assert.ok(pick.covered && pick.closed, 'level 7 starts with a covered bolt and a covered hole');
  const before = (await state()).state;
  await tapWall(pick.covered); await page.waitForTimeout(300);
  st = await state(); assert.deepEqual([st.misses, st.state], [1, before], 'a covered bolt is one miss and stays');
  await tapWall(pick.free);
  assert.notEqual((await state()).lifted, null, 'a tap lifts a free bolt');
  await tapWall(pick.closed); await page.waitForTimeout(300);
  st = await state();
  assert.deepEqual([st.misses, st.hints, st.hinted, st.lifted, st.state], [2, 1, true, null, before], 'a covered hole springs the bolt back, one miss, and the second miss lights the hint');
  await solveAll();
  st = await state(); assert.deepEqual([st.misses, st.hints], [2, 1], 'level 7 solved with the two misses and one hint');
  await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers7, { timeout: 15000 });
  // Level 8: the authored first board; a swing covers one of three holes, a covered hole is free, no wander hint.
  await launch('bolt-boards', 8); await idle(); await page.waitForTimeout(400);
  const stickers8 = await page.evaluate(() => kit.store.data.stickers.length);
  const first = await page.evaluate(async () => {
    const L = await import('/src/games/bolt-boards/logic.ts'), g = neo.scene.game, p = g.puzzle, s = g.state;
    return { boards: p.boards.length, open: L.openHoles(p, s).length, bolt: p.bolts[0], hole: L.holeAt(p, p.bolts.length) };
  });
  assert.deepEqual([first.boards, first.open], [2, 3], 'level 8 starts on the authored board: two boards, three open holes');
  await tapWall(first.bolt); await tapWall(first.hole); await idle(); await page.waitForTimeout(700);
  const swung = await page.evaluate(async () => {
    const L = await import('/src/games/bolt-boards/logic.ts'), g = neo.scene.game, p = g.puzzle, s = g.state, open = L.openHoles(p, s);
    let closed = -1;
    for (let h = 0; h < L.holeCount(p); h++) if (!s.includes(h) && !open.includes(h)) closed = h;
    return { free: L.freeBolts(p, s).map((b) => p.bolts[b])[0], closed: closed < 0 ? null : L.holeAt(p, closed), extraOpen: open.filter((h) => h >= p.bolts.length).length };
  });
  assert.ok(swung.closed && swung.extraOpen === 1, 'the swing covers one hole; one of the three still glows');
  await screenshot('bolt-boards-8-swing');
  await tapWall(swung.free); await tapWall(swung.closed); await page.waitForTimeout(300);
  st = await state(); assert.deepEqual([st.misses, st.hints, st.lifted], [0, 0, null], 'a covered hole at level 8 is free');
  await solveAll();
  st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0], 'level 8 solved over two scenes with no miss and no wander hint');
  await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers8, { timeout: 15000 });
  // Level 6 upright: one screenshot.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('bolt-boards', 6); await idle(); await page.waitForTimeout(600);
  await screenshot('bolt-boards-6-portrait');
  // Level 9 upright, Put it back: the authored board; a covered hole twice (two misses, the glow), a dead end that is free, undo, then both scenes.
  await launch('bolt-boards', 9); await idle(); await page.waitForTimeout(600);
  const stickers9 = await page.evaluate(() => kit.store.data.stickers.length);
  const b9 = () => page.evaluate(() => { const g = neo.scene.game; return { state: g.state.join(','), picked: g.picked, dead: g.dead, misses: g.misses, hints: g.hints, hinted: !!g.hinted }; });
  const tapSlot = async (i) => { const r = await page.evaluate((i) => neo.scene.game.slots[i], i); await tapAt(r.x + r.w / 2, r.y + r.h / 2); };
  const tapHole = async (b) => { await tapWall(await page.evaluate((b) => neo.scene.game.puzzle.bolts[b], b)); await page.waitForTimeout(250); };
  const tapBody = async (i) => { const q = await page.evaluate((i) => neo.scene.game.pickPoint(i), i); await tapAt(q.x, q.y); };
  let s9 = await b9();
  assert.deepEqual([s9.state, await page.evaluate(() => neo.scene.game.puzzle.boards.length)], ['-1,-1,-1,-1,-1,-1', 3], 'level 9 starts on the authored board, every board on the woodpile');
  await tapSlot(0); assert.equal((await b9()).picked, 0, 'a slot picks its board');
  await tapHole(0); await tapSlot(2); await tapHole(4); await page.waitForTimeout(700);
  s9 = await b9(); assert.deepEqual([s9.state, s9.dead, s9.misses], ['0,-1,-1,-1,4,-1', false, 0], 'two placements, the big board hanging, still finishable');
  await screenshot('bolt-boards-9-portrait');
  await tapSlot(1); await tapHole(3); await page.waitForTimeout(300); await tapHole(3); await page.waitForTimeout(300);
  s9 = await b9(); assert.deepEqual([s9.state, s9.misses, s9.hints, s9.hinted], ['0,-1,-1,-1,4,-1', 2, 1, true], 'a covered hole twice: two misses, and the glow counts one hint');
  await tapBody(2); assert.equal((await b9()).picked, 2, 'tapping a hanging board picks it');
  await tapHole(5); await page.waitForTimeout(700);
  s9 = await b9(); assert.deepEqual([s9.state, s9.dead, s9.misses], ['0,-1,-1,-1,4,5', true, 2], 'pinning the big board early is a dead end, not a miss');
  await tapSlot(1); await tapHole(2); await page.waitForTimeout(300);
  s9 = await b9(); assert.deepEqual([s9.misses, s9.hints], [2, 1], 'a covered hole at a dead end is free');
  await page.evaluate(() => neo.scene.game.undoButton.press()); await page.waitForTimeout(500);
  s9 = await b9(); assert.deepEqual([s9.state, s9.dead], ['0,-1,-1,-1,4,-1', false], 'undo takes back the last bolt and the wall can finish again');
  await solveAll();
  s9 = await b9(); assert.deepEqual([s9.misses, s9.hints], [2, 1], 'level 9 built over two scenes with the two misses and one hint');
  await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers9, { timeout: 15000 });
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, [], 'page errors');
  log('Bolt Boards: level 1 by taps; level 7 with a covered bolt, a covered hole and the hint, solved; level 8 authored swing, free covered hole, two scenes; level 6 upright; level 9 upright with two misses, the glow, a free dead end and undo, both scenes built');
}

return { boltBoardsPlay };
}
