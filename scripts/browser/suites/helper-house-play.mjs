import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function helperHousePlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('helper-house').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.run && !neo.scene.game.busy), null, { timeout: 30000 }); await page.waitForTimeout(200); };
  const tapOn = async (expr) => { await page.evaluate((expr) => kit.tapOn(Function(`return (${expr})`)()), expr); await page.waitForTimeout(200); };
  const watch = async () => { await tapOn('neo.scene.game.watchButton'); await settle(); };
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { sensor: { ...g.board.sensor }, rows: g.board.rows.map((r) => r.reading), days: g.daysPlayed, glow: g.tally.glowing, offered: g.offered, running: !!g.run, finished: neo.scene.finished === true }; });
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  // HH_LEVELS picks which of the checked levels play (default 1, 3 and 4).
  let s;
  const levels = (process.env.HH_LEVELS ?? '1,3,4').split(',').map(Number);

  if (levels.includes(1)) {
  // Level 1: a day with the eye on the bench is an observation; the same failure twice lights the eye and the door socket (one hint); the eye at the door finishes.
  await launch('helper-house', 1);
  await settle();
  s = await state();
  assert.deepEqual(s.sensor, { kind: 'eye', socket: null }, 'level 1 opens with the eye on the bench');
  await watch();
  s = await state();
  assert.equal(s.days, 1, 'the first day completed');
  assert.deepEqual(await tally(), [0, 0], 'a day that does not meet the goal counts nothing');
  assert.equal(s.glow, null, 'one failure does not glow');
  await watch();
  s = await state();
  assert.deepEqual(await tally(), [0, 1], 'the same failure twice counts one hint');
  assert.equal(s.glow, 'sensor', 'the eye and the door socket glow');
  await page.evaluate(async () => {
    const g = neo.scene.game;
    const tile = g.tiles.find((t) => t.kind === 'eye');
    const socket = g.socketNodes[g.brief.sockets.indexOf('door')].getGlobalPosition();
    await kit.dragTo(tile.node, { x: socket.x, y: socket.y + 40 }, 14);
  });
  await page.waitForTimeout(500);
  s = await state();
  assert.equal(s.sensor.socket, 'door', 'the dragged eye snaps into the door socket');
  assert.equal(s.glow, null, 'changing the lit piece puts the glow out');
  await screenshot('helper-house-1-landscape');
  await watch();
  await finished('helper-house');
  assert.deepEqual(await score(), [0, 1], 'level 1 saved 0 misses, 1 hint');
  }
  if (levels.includes(3)) {

  // Level 3: the first Watch shows the lamp still on in the morning; Step pauses after one step; a portrait look; Show me fills the row; Watch finishes.
  await launch('helper-house', 3);
  await settle();
  s = await state();
  assert.deepEqual(s.rows, ['dark', null], 'level 3 opens with the given row and an empty row');
  await tapOn('neo.scene.game.stepButton'); await page.waitForTimeout(1500);
  s = await page.evaluate(() => ({ step: neo.scene.game.run?.step, paused: neo.scene.game.run?.paused }));
  assert.deepEqual(s, { step: 1, paused: true }, 'Step shows one step and pauses');
  await tapOn('neo.scene.game.watchButton'); await settle();
  s = await state();
  assert.equal(s.days, 1, 'resumed to the end of the day');
  assert.deepEqual(await tally(), [0, 0], 'the lamp left on in the morning counts nothing');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('helper-house-3-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(400);
  s = await state();
  assert.deepEqual(s.rows, ['dark', 'bright'], 'Show me adds bright → off');
  assert.deepEqual(await tally(), [0, 1], 'Show me counts one hint');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(300);
  assert.deepEqual(await tally(), [0, 1], 'a second Show me on a finished board changes nothing and counts nothing');
  assert.deepEqual((await state()).rows, ['dark', 'bright']);
  await watch();
  await finished('helper-house');
  assert.deepEqual(await score(), [0, 1], 'level 3 saved 0 misses, 1 hint');
  }
  if (levels.includes(4)) {
  // Level 4: cool → on dragged, hot → off tapped; the nook overshoots to 5 twice (one hint, the off row glows); a
  // portrait look; Show me swaps the off row to warm; Watch finishes with 0 misses and 2 hints.
  await launch('helper-house', 4);
  await settle();
  s = await state();
  assert.deepEqual(s.rows, [null, null], 'level 4 opens with two empty rows');
  assert.deepEqual(s.sensor, { kind: 'thermo', socket: 'nook' }, 'the thermometer is fixed in the nook');
  await page.evaluate(async () => {
    const g = neo.scene.game;
    const tile = g.tiles.find((t) => t.chip === 'cool');
    const row = g.rowNodes[0].reading.getGlobalPosition();
    await kit.dragTo(tile.node, { x: row.x, y: row.y + 40 }, 14);
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => { const g = neo.scene.game; g.tapChip(g.tiles.find((t) => t.chip === 'hot')); });
  await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual(s.rows, ['cool', 'hot'], 'the dragged chip fills the on row and the tapped chip the empty off row');
  await watch();
  const peak = await page.evaluate(async () => {
    const { runDay } = await import('/src/games/helper-house/logic.ts');
    const g = neo.scene.game;
    return Math.max(...runDay(g.board, g.brief.day).trace.map((t) => t.warmth));
  });
  assert.equal(peak, 5, 'the nook overshoots to hot during the day');
  assert.deepEqual(await tally(), [0, 0], 'a too-warm day counts nothing');
  await watch();
  s = await state();
  assert.deepEqual(await tally(), [0, 1], 'the same failure twice counts one hint');
  assert.equal(s.glow, 1, 'the off row glows');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('helper-house-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(400);
  s = await state();
  assert.deepEqual(s.rows, ['cool', 'warm'], 'Show me puts warm in the off row');
  assert.equal(s.glow, null, 'changing the lit row puts the glow out');
  assert.deepEqual(await tally(), [0, 2], 'Show me counts one hint');
  await watch();
  await finished('helper-house');
  assert.deepEqual(await score(), [0, 2], 'level 4 saved 0 misses, 2 hints');
  }
  if (levels.includes(5)) {
  // Level 5: the sensor starts under the lamp and the lamp flickers twice (one hint, the sensor glows); dragged into
  // the shed the lamp stays on into the morning; Show me moves it to the roof and Watch finishes with 2 hints.
  await launch('helper-house', 5);
  await settle();
  s = await state();
  assert.deepEqual(s.sensor, { kind: 'sun', socket: 'lamp' }, 'level 5 opens with the sun sensor under the lamp');
  assert.deepEqual(s.rows, ['dark', 'bright'], 'both rows are given');
  await watch();
  const lit = await page.evaluate(async () => {
    const { runDay } = await import('/src/games/helper-house/logic.ts');
    const g = neo.scene.game;
    return runDay(g.board, g.brief.day).failure;
  });
  assert.equal(lit, 'lamp-flickers', 'under the lamp it flickers');
  assert.deepEqual(await tally(), [0, 0], 'a flickering day counts nothing');
  await watch();
  s = await state();
  assert.deepEqual(await tally(), [0, 1], 'the same failure twice counts one hint');
  assert.equal(s.glow, 'sensor', 'the sensor glows');
  await page.evaluate(async () => {
    const g = neo.scene.game;
    const tile = g.tiles.find((t) => t.kind === 'sun');
    const shed = g.socketNodes[2].getGlobalPosition();
    await kit.dragTo(tile.node, { x: shed.x, y: shed.y + 40 }, 14);
  });
  await page.waitForTimeout(500);
  s = await state();
  assert.equal(s.sensor.socket, 'shed', 'the dragged sensor lands in the shed');
  assert.equal(s.glow, null, 'moving the sensor puts the glow out');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await tapOn('neo.scene.game.stepButton');
  for (let i = 0; i < 8; i++) { await tapOn('neo.scene.game.stepButton'); await page.waitForTimeout(950); }
  await screenshot('helper-house-5-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(400);
  s = await state();
  assert.equal(s.sensor.socket, 'roof', 'Show me puts the sensor on the roof');
  assert.deepEqual(await tally(), [0, 2], 'Show me counts one hint');
  await watch();
  await finished('helper-house');
  assert.deepEqual(await score(), [0, 2], 'level 5 saved 0 misses, 2 hints');
  }
  const lines = () => page.evaluate(() => ({ ...neo.scene.game.board.lines }));
  // A point on the gauge at a gap, in screen coordinates: dx from the column's left edge (−55 is the left lane's middle).
  const gapPoint = (gap, dx) => page.evaluate(([gap, dx]) => { const c = neo.scene.game.gaugeColumn; const p = c.toGlobal({ x: dx, y: (7 - gap) * 64 }); return { x: p.x, y: p.y }; }, [gap, dx]);
  if (levels.includes(6)) {
  // Level 6: the line starts at the top; the hare guess starts a too-warm day (nothing counted), Watch again glows the
  // line (one hint); dragged down to gap 2 the nook never warms; Show me puts it at 3 and Watch finishes with 2 hints.
  await launch('helper-house', 6);
  await settle();
  assert.deepEqual(await lines(), { on: 6, off: 6 }, 'level 6 opens with the line at the top');
  assert.equal(await page.evaluate(() => neo.scene.game.guessButtons.length), 2, 'the guess offers two picture buttons');
  await tapOn('neo.scene.game.guessButtons[0]');
  await settle();
  s = await state();
  assert.equal(s.days, 1, 'the guess started the first day');
  assert.equal(await page.evaluate(() => neo.scene.game.guessOpen), false, 'the guess closes after the first day starts');
  assert.deepEqual(await tally(), [0, 0], 'the guess and a too-warm day count nothing');
  await watch();
  s = await state();
  assert.deepEqual(await tally(), [0, 1], 'the same failure twice counts one hint');
  assert.equal(s.glow, 'line', 'the line glows');
  const to2 = await gapPoint(2, -55);
  await page.evaluate(async (to) => { const n = neo.scene.game.lineNodes[0].node; await kit.dragTo(n, { x: to.x, y: to.y + 40 }, 16); }, to2);
  await page.waitForTimeout(500);
  assert.deepEqual(await lines(), { on: 2, off: 2 }, 'the dragged line snaps to gap 2');
  assert.equal((await state()).glow, null, 'moving the line puts the glow out');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(400);
  assert.deepEqual(await lines(), { on: 3, off: 3 }, 'Show me moves the line up to the nearer comfy gap');
  assert.deepEqual(await tally(), [0, 2], 'Show me counts one hint');
  await watch();
  await finished('helper-house');
  assert.deepEqual(await score(), [0, 2], 'level 6 saved 0 misses, 2 hints');
  }
  if (levels.includes(7)) {
  // Level 7: two lines together at gap 3 keep the nook comfy but the heater clicks 11 times (a pebble rolls out);
  // twice glows the off line (one hint); a tap high on the gauge pulls the off line to 5 (too warm); a portrait look
  // mid-day; Show me puts the off line at 4 and Watch finishes with 2 hints.
  await launch('helper-house', 7);
  await settle();
  assert.deepEqual(await lines(), { on: 3, off: 3 }, 'level 7 opens with both lines at gap 3');
  await watch();
  assert.equal(await page.evaluate(() => neo.scene.game.pebbles), 11, 'eleven pebbles: three roll out of the jar');
  await watch();
  s = await state();
  assert.deepEqual(await tally(), [0, 1], 'the same failure twice counts one hint');
  assert.equal(s.glow, 'off-line', 'the off line glows');
  const at5 = await gapPoint(5, 55);
  await page.evaluate((p) => kit.tap(p.x, p.y), at5);
  await page.waitForTimeout(400);
  assert.deepEqual(await lines(), { on: 3, off: 5 }, 'a tap above the lines pulls the off line up');
  assert.equal((await state()).glow, null, 'moving the line puts the glow out');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await tapOn('neo.scene.game.stepButton');
  for (let i = 0; i < 7; i++) { await tapOn('neo.scene.game.stepButton'); await page.waitForTimeout(950); }
  await screenshot('helper-house-7-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(400);
  assert.deepEqual(await lines(), { on: 3, off: 4 }, 'Show me sets the off line at 4');
  assert.deepEqual(await tally(), [0, 2], 'Show me counts one hint');
  await watch();
  await finished('helper-house');
  assert.deepEqual(await score(), [0, 2], 'level 7 saved 0 misses, 2 hints');
  }
  log(`Helper House ${levels.join(', ')}: failing days glow once, drags and taps, Step, portrait, Show me, passed`);
}
return { helperHousePlay };
}
