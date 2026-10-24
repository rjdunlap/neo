import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot, finished }) {
/**
 * Sudoku Garden's Six Beds course, played Just me with a (synthetic) controller: the number tray, a wrong entry that counts
 * and is taken back for free, pencil marks, the pause menu's hint (which marks the run helped, and points at a wrong number
 * first) and restart (entries still count), a reload that resumes the bed with its entries, then a fresh run that the bot
 * plays perfectly: one entry for each empty square, one sticker, both badges, and the shelf showing par.
 */
async function couchBeds() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button) => {
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button);
    await page.waitForTimeout(100);
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button);
    await page.waitForTimeout(100);
  };
  const [RIGHT, DOWN, LEFT, UP] = [15, 13, 14, 12], BOTTOM = 0, UNDO = 2, START = 9;
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { index: g.index, entries: g.entries, misses: g.misses, hints: g.hints, mode: g.mode, cursor: g.cursor, n: g.n, trayAt: g.trayAt, noting: g.noting, cell: g.grid[g.cursor], notes: g.notes[g.cursor], blanks: g.grid.filter(d => !d).length, hinted: g.hinted ? { kind: g.hinted.kind, cell: g.hinted.cell } : null }; });
  const truth = () => page.evaluate(() => { const g = neo.scene.game; return { solution: g.puzzle.solution[g.cursor], given: g.given[g.cursor] }; });
  /** Move the tray's highlight to a tile (a digit's, or n for the pencil) with the d-pad, then press the bottom button. */
  const trayTo = async (tile, choose = true) => {
    for (let guard = 0; guard < 12; guard++) {
      const { trayAt, n } = await state();
      if (trayAt === tile) break;
      const r = Math.floor(trayAt / 3), c = trayAt % 3, wantR = tile === n ? Math.ceil(n / 3) : Math.floor(tile / 3), wantC = tile === n ? 0 : tile % 3;
      await press(r !== wantR ? (wantR > r ? DOWN : UP) : wantC > c ? RIGHT : LEFT);
    }
    assert.equal((await state()).trayAt, tile);
    if (choose) await press(BOTTOM);
  };

  // --- Just me, the puzzle shelf, the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga', 'typing']);
  assert.equal(await page.locator('[data-course="beds"] small').innerText(), 'Not finished yet · par 124');
  assert.equal(await page.locator('[data-course="bigbeds"] small').innerText(), 'Not finished yet · par 149');
  await page.locator('[data-course="beds"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Six Beds');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest entries the whole course can take is 124/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 124 entries, every bed by its fewest\./);
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes' }).count(), 0, 'a puzzle with no route to replay does not offer one');
  await screenshot('couch-beds-course');
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Sudoku Garden');
  assert.equal(await page.locator('.couch-rows li').count(), 4);
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  await makePads(); await page.waitForTimeout(150);
  assert.match(await page.locator('.couch-hud strong').innerText(), /^Six Beds$/);
  await page.waitForFunction(() => /Bed 1 of 6/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Bed 1 of 6 · 0 entries so far · this bed's fewest 14 · course minimum 124/);
  let s = await state();
  assert.deepEqual({ index: s.index, n: s.n, blanks: s.blanks, entries: s.entries, mode: s.mode }, { index: 0, n: 6, blanks: 14, entries: 0, mode: 'board' });
  await screenshot('couch-beds-play');

  // --- The tray: opens on a square, closes with the left button, and a wrong number counts but is never refused.
  await press(BOTTOM);
  assert.equal((await state()).mode, 'tray');
  await press(UNDO);
  assert.equal((await state()).mode, 'board', 'the left button closes the tray');
  await press(BOTTOM);
  const { solution } = await truth();
  const wrong = solution === 1 ? 2 : 1;
  await trayTo(wrong - 1);
  s = await state();
  assert.deepEqual({ cell: s.cell, entries: s.entries, misses: s.misses, mode: s.mode }, { cell: wrong, entries: 1, misses: 1, mode: 'board' });
  await page.waitForFunction(() => /1 entry so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.equal((await stored()).courses.beds.run.attempts, 1, 'the entry is saved at once');
  await press(UNDO);
  s = await state();
  assert.deepEqual({ cell: s.cell, entries: s.entries }, { cell: 0, entries: 1 }, 'taking a number out is free, and the entry stays counted');
  await press(BOTTOM); await trayTo(solution - 1);
  s = await state();
  assert.deepEqual({ cell: s.cell, entries: s.entries, misses: s.misses }, { cell: solution, entries: 2, misses: 1 });
  // The same number again changes nothing and counts nothing.
  await press(BOTTOM); await trayTo(solution - 1);
  assert.equal((await state()).entries, 2);

  // --- Pencil marks: free, and they never count as entries.
  const open = await page.evaluate(() => { const g = neo.scene.game; for (let i = 0; i < g.grid.length; i++) if (!g.grid[i]) return i; return -1; });
  await page.evaluate((i) => { neo.scene.game.cursor = i; neo.scene.game.dirty = true; }, open);
  await press(BOTTOM);
  await trayTo(6);
  assert.equal((await state()).noting, true, 'the pencil switches marks on');
  await trayTo(1, false); await press(BOTTOM);
  await trayTo(4, false); await press(BOTTOM);
  s = await state();
  assert.deepEqual({ notes: s.notes, entries: s.entries, cell: s.cell, mode: s.mode }, { notes: 2 | 16, entries: 2, cell: 0, mode: 'tray' }, 'two marks, and the tray stays open for more');
  await trayTo(6); // pencil off again
  assert.equal((await state()).noting, false);
  await press(UNDO); await press(UNDO);
  assert.equal((await state()).notes, 0, 'the left button clears marks, free');
  assert.equal((await state()).entries, 2);

  // --- Help comes from the pause menu: a wrong number is named first, and a hint marks the run helped for good.
  await page.evaluate((i) => { neo.scene.game.cursor = i; }, open);
  await press(BOTTOM);
  const bad = (await truth()).solution === 3 ? 4 : 3;
  await trayTo(bad - 1);
  assert.equal((await state()).entries, 3);
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Start this bed again', exact: true }).count(), 1);
  await screenshot('couch-beds-pause');
  await click('Show a hint');
  await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual(s.hinted, { kind: 'fix', cell: open }, 'a number that cannot be right is named before anything else');
  assert.equal(s.hints, 1);
  assert.notEqual(await page.evaluate(() => neo.scene.game.banner.text), '', 'the hint is written on screen as well as spoken');
  assert.equal((await stored()).courses.beds.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-beds-hint');
  await press(UNDO); // take the wrong number out
  s = await state();
  assert.deepEqual({ hinted: s.hinted, cell: s.cell, entries: s.entries }, { hinted: null, cell: 0, entries: 3 });
  // Another hint now names a number to place, with a reason.
  await press(START); await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.ok(['lone', 'place'].includes(s.hinted.kind), `then a number to place (${s.hinted.kind})`);
  assert.equal(s.hints, 2);
  // Restart: the bed goes back to its start, and nothing already entered is forgiven.
  await press(START); await click('Start this bed again'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual({ blanks: s.blanks, entries: s.entries, hinted: s.hinted }, { blanks: 14, entries: 3, hinted: null });

  // --- Leave in the middle of a bed: a reload restores the entries, restarts the bed, and keeps the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  assert.equal(await page.locator('h1').innerText(), 'Just for you');
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="beds"]').click(); await screenIs('course');
  let run = (await stored()).courses.beds.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: 3, assisted: true });
  await screenshot('couch-beds-resume');
  await click('Resume · bed 1 of 6'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.equal((await state()).entries, 3, 'the entries spent before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: one entry for each empty square.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.deepEqual({ entries: (await state()).entries, hints: (await state()).hints }, { entries: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 420000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '124', 'a perfect run: one entry for each empty square');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Every entry right/);
  await screenshot('couch-beds-result');
  const save = await stored();
  assert.equal(save.courses.beds.run, null);
  assert.equal(save.courses.beds.players[0].clean, 124);
  assert.equal(save.stickers['sudoku-garden'].count, 1, 'one sticker for the run, not one per bed');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="beds"] small').innerText(), '124 entries · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Six Beds: shelf, course page, tray and entries counted, free erase, pencil marks, hint after a wrong number, restart, reload resume, a perfect bot run with one sticker and both badges passed');
}

return { couchBeds };
}
