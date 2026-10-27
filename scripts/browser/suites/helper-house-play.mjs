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

  // Level 1: a day with the eye on the bench is an observation; the same failure twice lights the eye and the door socket (one hint); the eye at the door finishes.
  await launch('helper-house', 1);
  await settle();
  let s = await state();
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
  log('Helper House 1 and 3: two failing days (glow once), a dragged eye, Step, portrait, Show me twice, passed');
}
return { helperHousePlay };
}
