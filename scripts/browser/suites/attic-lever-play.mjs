import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch }) {
/** Attic Finds levels 3-4 by touch: fast taps on the giant handle queue one turn, Finish waits for the third turn, level 4's door opens and closes free, and Finish ends the round with no misses or hints; level 4 upright with the door open. */
async function atticLeverPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { turns: g.lever.turns, up: g.lever.up, doorOpen: g.lever.doorOpen, finish: !!g.finishBtn, busy: g.busy, misses: g.misses, hints: g.hints }; });
  const sticker = (n) => page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });
  const tapAt = (expr) => page.evaluate((expr) => { const g = neo.scene.game; const q = new Function('g', `return ${expr}`)(g); const p = g.bg.toGlobal(q); kit.tap(p.x, p.y); }, expr);
  const settle = () => page.waitForFunction(() => neo.scene.game.halfT === null && !neo.scene.game.lever.turning, null, { timeout: 5000 });
  const tapFinish = () => page.evaluate(() => { const p = neo.scene.game.finishBtn.getGlobalPosition(); kit.tap(p.x, p.y); });

  // Level 3: a swat anywhere turns the handle; four fast touches make two turns (one queued), never four.
  await launch('attic-finds', 3, 'Mia', 'lap'); await page.waitForTimeout(400);
  let n = await page.evaluate(() => kit.store.data.stickers.length);
  await tapAt('({ x: 120, y: 330 })'); await tapAt('({ x: 120, y: 330 })'); await tapAt('({ x: 120, y: 330 })'); await tapAt('({ x: 120, y: 330 })');
  await page.waitForTimeout(1600); await settle();
  let st = await state();
  assert.equal(st.turns, 2, 'a run of fast touches makes one turn and one queued turn');
  assert.equal(st.finish, false, 'Finish is absent before the third turn');
  await tapAt('g.L.handle'); await page.waitForTimeout(900); await settle();
  st = await state();
  assert.deepEqual([st.turns, st.finish, st.up], [3, true, true], 'the third turn brings the Finish picture');
  await tapFinish();
  await sticker(n);
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0], 'every touch is play');

  // Level 4: the door opens and closes free; the handle turns with the door open.
  await launch('attic-finds', 4); await page.waitForTimeout(400);
  n = await page.evaluate(() => kit.store.data.stickers.length);
  await tapAt('({ x: g.L.door.x + g.L.door.w / 2, y: g.L.door.y + g.L.door.h / 2 })'); await page.waitForTimeout(500);
  assert.equal((await state()).doorOpen, true, 'a tap on the door opens it');
  await tapAt('g.L.handle'); await page.waitForTimeout(900); await settle();
  assert.equal((await state()).turns, 1, 'the handle turns with the door open');
  await tapAt('({ x: g.L.door.x + g.L.door.w / 2, y: g.L.door.y + g.L.door.h / 2 })'); await page.waitForTimeout(300);
  assert.equal((await state()).doorOpen, false, 'a tap on the open door closes it');
  await tapAt('({ x: 40, y: 400 })'); await page.waitForTimeout(300);
  assert.equal((await state()).turns, 1, 'the empty attic only puffs dust at level 4');
  await tapAt('({ x: g.L.door.x + g.L.door.w / 2, y: g.L.door.y + g.L.door.h / 2 })');
  await tapAt('g.L.handle'); await page.waitForTimeout(800); await settle();
  await tapAt('g.L.handle'); await page.waitForTimeout(800); await settle();
  assert.equal((await state()).finish, true, 'Finish after three turns');

  // Upright with the door open.
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await screenshot('attic-finds-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(300);
  await tapFinish();
  await sticker(n);
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
  assert.deepEqual(errors, [], 'page errors');
  log('Attic Finds levels 3-4: queued fast touches, Finish after three turns, the peek door free, upright with the door open');
}

return { atticLeverPlay };
}
