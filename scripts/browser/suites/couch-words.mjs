import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot, finished }) {
/**
 * Word Search's Pond Words course, played Just me with a (synthetic) controller: a crooked mark that cannot be checked and costs
 * nothing, letting go of a mark for free, a wrong line that counts as a guess, a right line that finds a word, the pause menu's
 * hint (the first letter of a word, marking the run helped) and restart (guesses kept), a reload that resumes, then a fresh bot
 * run that finds every word with exactly one guess each: one sticker, both badges, and the shelf showing par.
 */
async function couchWords() {
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
  const state = () => page.evaluate(() => {
    const g = neo.scene.game;
    return { index: g.index, n: g.n, guesses: g.guesses, misses: g.misses, hints: g.hints, cursor: g.cursor, anchor: g.anchor, found: [...g.found], hinted: g.hinted ? { ...g.hinted } : null, words: g.grid.words.map((w) => ({ word: w.word, r: w.r, c: w.c, dr: w.dr, dc: w.dc, len: w.word.length })) };
  });
  /** Walk the highlight to a square with the d-pad: columns first, then rows. */
  const walkTo = async (cell) => {
    for (let guard = 0; guard < 60; guard++) {
      const { cursor, n } = await state();
      if (cursor === cell) return;
      const [r, c, tr, tc] = [Math.floor(cursor / n), cursor % n, Math.floor(cell / n), cell % n];
      await press(c !== tc ? (tc > c ? RIGHT : LEFT) : tr > r ? DOWN : UP);
    }
    throw new Error('the highlight did not reach the square');
  };
  const ends = (w, n) => ({ first: w.r * n + w.c, last: (w.r + w.dr * (w.len - 1)) * n + (w.c + w.dc * (w.len - 1)) });
  /** Mark a word's first and last letters, which checks it. */
  const find = async (i) => {
    const s = await state(), { first, last } = ends(s.words[i], s.n);
    await walkTo(first); await press(BOTTOM);
    await walkTo(last); await press(BOTTOM);
  };

  // --- Just me, the puzzle shelf (eleven puzzles), the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga', 'typing']);
  assert.equal(await page.locator('[data-course="words"] small').innerText(), 'Not finished yet · par 25');
  assert.equal(await page.locator('[data-course="bigwords"] small').innerText(), 'Not finished yet · par 24');
  await page.locator('[data-course="words"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Pond Words');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest guesses the whole course can take is 25/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 25 guesses, every grid by its fewest\./);
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Word Search');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Grid 1 of 3/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Grid 1 of 3 · 0 guesses so far · this grid's fewest 7 · course minimum 25/);
  let s = await state();
  assert.deepEqual({ index: s.index, n: s.n, guesses: s.guesses, anchor: s.anchor, words: s.words.length }, { index: 0, n: 10, guesses: 0, anchor: null, words: 7 });
  await screenshot('couch-words-play');

  // --- A crooked mark cannot be checked and costs nothing; letting go of a mark is free.
  const start = s.cursor;
  await press(BOTTOM);
  assert.equal((await state()).anchor, start, 'the bottom button marks the first letter');
  await press(RIGHT); await press(DOWN); await press(DOWN);
  await press(BOTTOM);
  s = await state();
  assert.deepEqual({ anchor: s.anchor, guesses: s.guesses }, { anchor: start, guesses: 0 }, 'one across and two down is not a line: nothing is checked, nothing counts');
  await press(UNDO);
  s = await state();
  assert.deepEqual({ anchor: s.anchor, guesses: s.guesses }, { anchor: null, guesses: 0 }, 'the left button lets go of the mark');

  // --- A wrong line is a guess; a right line finds a word.
  await press(BOTTOM); await press(RIGHT); await press(BOTTOM);
  s = await state();
  assert.deepEqual({ guesses: s.guesses, misses: s.misses, found: s.found.length, anchor: s.anchor }, { guesses: 1, misses: 1, found: 0, anchor: null }, 'no word has two letters');
  assert.equal((await stored()).courses.words.run.attempts, 1, 'the guess is saved at once');
  await find(3);
  s = await state();
  assert.deepEqual({ guesses: s.guesses, found: s.found }, { guesses: 2, found: [3] });
  await page.waitForFunction(() => /2 guesses so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  await screenshot('couch-words-found');

  // --- A word can be marked from its last letter to its first.
  const second = s.words[0], { first: f0, last: l0 } = ends(second, s.n);
  await walkTo(l0); await press(BOTTOM); await walkTo(f0); await press(BOTTOM);
  s = await state();
  assert.deepEqual({ guesses: s.guesses, found: s.found.sort() }, { guesses: 3, found: [0, 3] }, 'read backwards it is the same word');

  // --- The pause menu: a hint names a word and shows its first letter, and marks the run helped for good.
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Search this grid again', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.ok(s.hinted && !s.found.includes(s.hinted.word), 'a word not found yet');
  assert.equal(s.hinted.cell, ends(s.words[s.hinted.word], s.n).first, 'the first letter of that word');
  assert.equal(s.cursor, s.hinted.cell);
  assert.equal(s.hints, 1);
  assert.equal((await stored()).courses.words.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-words-hint');
  const hinted = s.hinted.word;
  await find(hinted);
  s = await state();
  assert.deepEqual({ hinted: s.hinted, has: s.found.includes(hinted) }, { hinted: null, has: true });
  // Restart: the grid is searched again and the guesses stay counted.
  const spent = s.guesses;
  await press(START); await click('Search this grid again'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual({ found: s.found.length, guesses: s.guesses }, { found: 0, guesses: spent });

  // --- Leave in the middle of a grid: a reload restores the guesses and keeps the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="words"]').click(); await screenIs('course');
  const run = (await stored()).courses.words.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: spent, assisted: true });
  await click('Resume · grid 1 of 3'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.equal((await state()).guesses, spent, 'the guesses spent before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: one guess for each word.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.deepEqual({ guesses: (await state()).guesses, hints: (await state()).hints }, { guesses: 0, hints: 0 });
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
  assert.equal(await page.locator('.couch-big b').innerText(), '25', 'one guess for each word');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Every guess right/);
  await screenshot('couch-words-result');
  const save = await stored();
  assert.equal(save.courses.words.run, null);
  assert.equal(save.courses.words.players[0].clean, 25);
  assert.equal(save.stickers['word-search'].count, 1, 'one sticker for the run, not one per grid');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="words"] small').innerText(), '25 guesses · par: the fewest possible');
  await screenshot('couch-words-shelf');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Pond Words: shelf, course page, a crooked mark costing nothing, letting go free, a wrong line counted, a word found both ways, a hint naming a word, restart, reload resume, a perfect bot run with one sticker and both badges passed');
}

return { couchWords };
}
