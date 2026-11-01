import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function shellRowsPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('shell-rows').history.at(-1); return [r.misses, r.hints]; });
  const state = () => page.evaluate(() => neo.scene.game.state);
  const until = async (fn, arg) => page.waitForFunction(fn, arg, { timeout: 40000 });
  // Her turn, with the last frame drawn so hit-testing sees the squares.
  const turn = async () => { await until(() => neo.scene.finished || neo.scene.game.state.phase === 'turn'); await page.waitForTimeout(250); };
  const tap = async (i) => { await page.evaluate((i) => kit.tapOn(neo.scene.game.squares[i]), i); await page.waitForTimeout(150); };
  const emptyWrong = (s, not = []) => s.board.findIndex((v, i) => v === null && i !== s.right && !not.includes(i));
  const full = (s) => s.board.findIndex((v) => v !== null);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1 (pre-K): a full square counts nothing; one wrong square (the pet takes the gap, the board rewinds), a second
  // (the glow, one hint), then the right square moves on to the next position; the other two straight.
  await launch('shell-rows', 1, 'Mia', 'prek');
  await turn();
  let s = await state();
  assert.equal(s.index, 0);
  const before = s.board.slice();
  await tap(full(s));
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.phase], [0, 0, 'turn'], 'a full square counts nothing');
  await tap(emptyWrong(s));
  s = await state();
  assert.equal(s.phase, 'replay', 'a wrong square plays the pet\'s reply');
  assert.deepEqual([s.misses, s.hints], [1, 0]);
  await until(() => neo.scene.game.state.reply && neo.scene.game.state.board.filter((v) => v === 'pebble').length > 2);
  s = await state();
  assert.equal(s.reply.pebble, s.right, 'at level 1 the pet takes her gap');
  await turn();
  s = await state();
  assert.deepEqual(s.board, before, 'the board rewinds to her turn');
  await tap(emptyWrong(s));
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.glowing], [2, 1, true], 'a second wrong square lights the glow: one hint');
  await turn();
  await screenshot('shell-rows-1-glow');
  s = await state();
  await tap(s.right);
  await until(() => neo.scene.finished || neo.scene.game.state.index === 1);
  s = await state();
  assert.deepEqual([s.index, s.misses, s.hints, s.glowing], [1, 2, 1, false], 'the right square moves on; the glow does not carry');
  for (let k = 1; k < 3; k++) { await turn(); s = await state(); await tap(s.right); await until((k) => neo.scene.finished || neo.scene.game.state.index > k, k); }
  await finished('shell-rows');
  assert.deepEqual(await score(), [2, 1], 'level 1 saved 2 misses, 1 hint');

  // Level 3 (school), portrait: the block is a miss and the pet takes her three; then the right square, to the sticker.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await launch('shell-rows', 3, 'Mia', 'school');
  await turn();
  s = await state();
  const block = s.board.findIndex((v, i) => v === null && i !== s.right && (() => {
    const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    return L.some((l) => l.includes(i) && l.filter((j) => s.board[j] === 'pebble').length === 2 && l.every((j) => j === i || s.board[j] === 'pebble'));
  })());
  assert.ok(block >= 0, 'level 3 has a block square');
  await tap(block);
  await until(() => neo.scene.game.state.reply && neo.scene.game.state.board.filter((v) => v === 'pebble').length > neo.scene.game.state.board.filter((v) => v === 'shell').length - 1);
  await page.waitForTimeout(300);
  s = await state();
  assert.equal(s.reply.pebble, s.right, 'the block: the pet takes the three she could have had');
  await screenshot('shell-rows-3-portrait-replay');
  await turn();
  for (let k = 0; k < 3; k++) { await turn(); s = await state(); await tap(s.right); await until((k) => neo.scene.finished || neo.scene.game.state.index > k, k); }
  await finished('shell-rows');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');
  log('Shell Rows 1 and 3: level 1 a full square free, two wrong squares with the reply and rewind, the glow (2/1); portrait level 3 the block answered by the pet taking her three (1/0); passed');
}
return { shellRowsPlay };
}
