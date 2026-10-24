import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot, finished }) {
/**
 * Picture Logic's Pond Pictures course, played Just me with a (synthetic) controller: a fill that is not in the picture counts and
 * is never refused, emptying and crosses are free, a held button paints a run, a line's clue goes grey when done and red when
 * it cannot be right, the pause menu's hint names a wrong mark first and then a square one line decides, restart keeps the
 * fills, a reload resumes with them, then a fresh run the bot paints perfectly: exactly the picture's squares, one sticker and both badges.
 */
async function couchPictures() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const set = (button, on) => page.evaluate(({ button, on }) => { couchPads[0].buttons[button] = { pressed: on, value: on ? 1 : 0 }; }, { button, on });
  const press = async (button) => { await set(button, true); await page.waitForTimeout(100); await set(button, false); await page.waitForTimeout(100); };
  const [RIGHT, DOWN, LEFT, UP] = [15, 13, 14, 12], BOTTOM = 0, UNDO = 2, START = 9;
  const go = async (steps) => { for (const d of steps) await press(d); };
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(() => {
    const g = neo.scene.game, h = g.hinted;
    return { index: g.index, n: g.n, fills: g.fills, misses: g.misses, hints: g.hints, cursor: g.cursor, marks: g.marks.slice(), status: g.status.slice(), solution: g.puzzle.solution.slice(), par: g.puzzle.par, banner: g.banner.text, hinted: h ? { kind: h.kind, cell: h.cell, clue: h.clue ?? null, line: h.line ?? null } : null };
  });

  // --- Just me, the puzzle shelf, the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga', 'typing']);
  assert.equal(await page.locator('[data-course="pictures"] small').innerText(), 'Not finished yet · par 182');
  assert.equal(await page.locator('[data-course="bigpictures"] small').innerText(), 'Not finished yet · par 230');
  await page.locator('[data-course="pictures"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Pond Pictures');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest fills the whole course can take is 182/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 182 fills, every picture by its fewest\./);
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Picture Logic');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Picture 1 of 3/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Picture 1 of 3 · 0 fills so far · this picture's fewest 46 · course minimum 182/);
  let s = await state();
  assert.deepEqual({ index: s.index, n: s.n, fills: s.fills, par: s.par, cursor: s.cursor }, { index: 0, n: 10, fills: 0, par: 46, cursor: 55 });
  await screenshot('couch-pictures-play');

  // --- A fill that is not in the picture is not a miss and is not refused; emptying it is free; a cross is free and lifts.
  assert.equal(s.solution[55], false, 'the middle square is not in the sailboat');
  await press(BOTTOM);
  s = await state();
  assert.deepEqual({ fills: s.fills, misses: s.misses, mark: s.marks[55] }, { fills: 1, misses: 0, mark: 1 });
  assert.equal((await stored()).courses.pictures.run.attempts, 1, 'the fill is saved at once');
  await press(BOTTOM);
  s = await state();
  assert.deepEqual({ fills: s.fills, mark: s.marks[55] }, { fills: 1, mark: 0 }, 'a filled square empties for free, and the fill stays counted');
  await press(UNDO);
  assert.equal((await state()).marks[55], 2, 'the left button crosses an empty square');
  await press(UNDO);
  assert.equal((await state()).marks[55], 0, 'and lifts the cross');
  assert.equal((await state()).fills, 1, 'crosses never count');

  // --- A held button paints a run: row 6 of the sailboat is eight squares, columns 1 to 8.
  await go([DOWN, LEFT, LEFT, LEFT, LEFT]);
  assert.equal((await state()).cursor, 61);
  await set(BOTTOM, true); await page.waitForTimeout(100);
  await go([RIGHT, RIGHT, RIGHT, RIGHT, RIGHT, RIGHT, RIGHT]);
  await set(BOTTOM, false); await page.waitForTimeout(100);
  s = await state();
  assert.deepEqual(s.marks.slice(60, 70), [0, 1, 1, 1, 1, 1, 1, 1, 1, 0], 'one hold, eight squares');
  assert.equal(s.fills, 9, 'every square of the stroke counted once');
  assert.equal(s.status[6], 'done', 'the row\'s clue is satisfied');
  await page.waitForTimeout(200);
  // A ninth square in the run breaks the clue: it goes red, and taking the square out puts it right again.
  await go(Array(8).fill(LEFT));
  assert.equal((await state()).cursor, 60);
  await press(BOTTOM);
  s = await state();
  assert.equal(s.marks[60], 1);
  assert.equal(s.status[6], 'over', 'nine in a row cannot fit the clue 8');
  await screenshot('couch-pictures-over');
  await press(BOTTOM);
  assert.equal((await state()).status[6], 'done');

  // --- A wrong mark left for the hint to name first.
  await go([UP, UP, UP, UP, UP, UP]); // row 0 at col 0
  await press(BOTTOM);
  s = await state();
  assert.equal(s.marks[0], 1);
  assert.equal(s.solution[0], false);
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Empty this picture', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual({ kind: s.hinted.kind, cell: s.hinted.cell, hints: s.hints }, { kind: 'fix', cell: 0, hints: 1 }, 'a filled square outside the picture is named first');
  assert.notEqual(s.banner, '');
  assert.equal((await stored()).courses.pictures.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-pictures-hint');
  await press(BOTTOM); // take the wrong square out
  s = await state();
  assert.deepEqual({ hinted: s.hinted, mark: s.marks[0] }, { hinted: null, mark: 0 });
  // Then a square one line decides, with the line and its clue.
  await press(START); await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.ok(['fill', 'cross'].includes(s.hinted.kind), s.hinted.kind);
  assert.equal(s.solution[s.hinted.cell], s.hinted.kind === 'fill', 'the hint is right about the picture');
  assert.ok(Array.isArray(s.hinted.clue) && s.hinted.line, 'it names a line and its clue');
  assert.match(s.banner, /row \d+|column \d+/);
  assert.equal(s.cursor, s.hinted.cell);
  // Restart: the picture empties and nothing already filled is forgiven.
  const spent = s.fills;
  await press(START); await click('Empty this picture'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual({ filled: s.marks.filter(m => m === 1).length, fills: s.fills }, { filled: 0, fills: spent });

  // --- Leave in the middle of a picture: a reload restores the fills and keeps the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="pictures"]').click(); await screenIs('course');
  const run = (await stored()).courses.pictures.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: spent, assisted: true });
  await click('Resume · picture 1 of 3'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.equal((await state()).fills, spent, 'the fills spent before the reload still count');
  await makePads();

  // --- A fresh run, painted perfectly by the bot: one fill for each square of each picture.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.deepEqual({ fills: (await state()).fills, hints: (await state()).hints }, { fills: 0, hints: 0 });
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
  assert.equal(await page.locator('.couch-big b').innerText(), '182', 'the picture\'s own squares and no others');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Every fill right/);
  await screenshot('couch-pictures-result');
  const save = await stored();
  assert.equal(save.courses.pictures.run, null);
  assert.equal(save.courses.pictures.players[0].clean, 182);
  assert.equal(save.stickers['picture-logic'].count, 1, 'one sticker for the run, not one per picture');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="pictures"] small').innerText(), '182 fills · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Pond Pictures: shelf, course page, a wrong fill neither counted nor refused, free emptying and crosses, a held button painting a run, clues grey when done and red when impossible, a hint naming a wrong mark first and then a line, restart, reload resume, a perfect bot run with one sticker and both badges passed');
}

return { couchPictures };
}
