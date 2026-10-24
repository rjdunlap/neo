import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot, finished, next }) {
/**
 * Ferry Jam on the couch, in its Busy Harbors course, played Just me with a (synthetic) controller: the highlight moves between
 * boats, the bottom button picks one up and sets it down (a slide counts when it ends somewhere new), the left button puts a
 * held boat back for nothing or takes the last slide back (still counted), the pause menu's hint is the solver's next slide and
 * marks the run helped, restart keeps the slides, a reload resumes the harbor with them, the best routes replay once a run is
 * finished, and a fresh bot run clears every harbor in exactly the fewest slides.
 */
async function couchHarbors() {
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
  const settled = () => page.waitForFunction(() => neo.scene.game && !neo.scene.game.busy, null, { timeout: 30000 });
  const state = () => page.evaluate(async () => {
    const L = await import('/src/games/ferry-jam/logic.ts'), g = neo.scene.game;
    const way = L.solve(g.harbor, g.layout) ?? [];
    return { index: g.index, moves: g.moves, hints: g.hints, focus: g.focus, grab: g.grab ? { boat: g.grab.boat, p: g.grab.p, min: g.grab.min, max: g.grab.max } : null, layout: g.layout.slice(), start: L.start(g.harbor), boats: g.harbor.boats.map(b => ({ dir: b.dir, len: b.len })), hinted: g.hinted ? { ...g.hinted } : null, next: way[0] ?? null, fewest: L.solve(g.harbor, L.start(g.harbor)).length, undo: g.undoStack.length };
  });
  const laneKey = (dir, sign) => (dir === 'h' ? (sign > 0 ? RIGHT : LEFT) : sign > 0 ? DOWN : UP);

  // --- Just me, the puzzle shelf (nine puzzles), the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga', 'typing']);
  assert.equal(await page.locator('[data-course="harbors"] small').innerText(), 'Not finished yet · par 64');
  await screenshot('couch-harbors-shelf');
  await page.locator('[data-course="harbors"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Busy Harbors');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest slides the whole course can take is 64/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 64 slides, every harbor by its best way\./);
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes' }).count(), 0, 'not before a first finish');
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Ferry Jam');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Harbor 1 of 5/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Harbor 1 of 5 · 0 slides so far · this harbor's best way 8 · course minimum 64/);
  let s = await state();
  assert.deepEqual({ index: s.index, moves: s.moves, focus: s.focus, grab: s.grab, fewest: s.fewest }, { index: 0, moves: 0, focus: 0, grab: null, fewest: 8 });
  assert.equal(await page.evaluate(() => neo.scene.game.undoButton.visible), false, 'the round arrow is not drawn where nothing can press it');
  await screenshot('couch-harbors-play');

  // --- Move the highlight, pick a boat up, slide it, set it down: one slide, saved at once.
  const toward = await page.evaluate(async () => { const L = await import('/src/games/ferry-jam/logic.ts'), g = neo.scene.game; return L.boatToward(g.harbor, g.layout, g.focus, 0); });
  assert.notEqual(toward, null);
  await press(RIGHT);
  assert.equal((await state()).focus, toward, 'the stick moves the highlight to the next boat that way');
  // Find a boat that can slide (any boat with room), highlight it, and slide it by one cell.
  const mover = await page.evaluate(async () => { const L = await import('/src/games/ferry-jam/logic.ts'), g = neo.scene.game; return g.harbor.boats.map((_, i) => i).filter(i => i !== 0).find(i => { const r = L.reach(g.harbor, g.layout, i); return r.max > g.layout[i] || r.min < g.layout[i]; }) ?? 0; });
  const path = await page.evaluate(async (to) => { const L = await import('/src/games/ferry-jam/logic.ts'), g = neo.scene.game; return L.focusPath(g.harbor, g.layout, g.focus, to); }, mover);
  for (const dir of path) await press([RIGHT, DOWN, LEFT, UP][dir]);
  assert.equal((await state()).focus, mover);
  const room = await page.evaluate(async (i) => { const L = await import('/src/games/ferry-jam/logic.ts'), g = neo.scene.game, r = L.reach(g.harbor, g.layout, i); return { up: r.max > g.layout[i], down: r.min < g.layout[i] }; }, mover);
  const sign = room.up ? 1 : -1;
  await press(BOTTOM);
  s = await state();
  assert.equal(s.grab.boat, mover, 'the bottom button picks the boat up');
  assert.equal(s.moves, 0, 'picking up counts nothing');
  await press(laneKey(s.boats[mover].dir, sign));
  s = await state();
  assert.equal(s.grab.p, s.start[mover] + sign, 'the stick slides it one cell along its lane');
  // The wrong axis does nothing.
  await press(laneKey(s.boats[mover].dir === 'h' ? 'v' : 'h', 1));
  assert.equal((await state()).grab.p, s.start[mover] + sign);
  await press(UNDO);
  s = await state();
  assert.deepEqual({ grab: s.grab, layout: s.layout, moves: s.moves }, { grab: null, layout: s.start, moves: 0 }, 'the left button puts a held boat back: nothing was slid, nothing counts');
  await settled();
  await press(BOTTOM); await press(laneKey(s.boats[mover].dir, sign)); await press(BOTTOM);
  await settled();
  s = await state();
  assert.deepEqual({ grab: s.grab, moves: s.moves, at: s.layout[mover], undo: s.undo }, { grab: null, moves: 1, at: s.start[mover] + sign, undo: 1 });
  assert.equal((await stored()).courses.harbors.run.attempts, 1, 'the slide is saved at once');
  await page.waitForFunction(() => /1 slide so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  // Setting a boat down where it was picked up is not a slide.
  await press(BOTTOM); await press(BOTTOM);
  assert.equal((await state()).moves, 1);
  // The left button takes the last slide back; it stays counted.
  await press(UNDO); await settled();
  s = await state();
  assert.deepEqual({ layout: s.layout, moves: s.moves }, { layout: s.start, moves: 1 }, 'taken back, still counted');

  // --- The pause menu: a hint is the solver's next slide, and marks the run helped for good.
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Start this harbor again', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual(s.hinted, s.next, 'the hint is the first slide of a fewest-slides way from here');
  assert.equal(s.hints, 1);
  assert.equal(s.focus, s.hinted.boat, 'the highlight goes to that boat');
  assert.equal((await stored()).courses.harbors.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-harbors-hint');
  // Restart: the boats go home and nothing already slid is forgiven.
  await press(BOTTOM); await press(laneKey(s.boats[s.hinted.boat].dir, s.hinted.to > s.layout[s.hinted.boat] ? 1 : -1)); await press(BOTTOM); await settled();
  assert.equal((await state()).moves, 2);
  await press(START); await click('Start this harbor again'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(500);
  s = await state();
  assert.deepEqual({ layout: s.layout, moves: s.moves }, { layout: s.start, moves: 2 });

  // --- Leave in the middle of a harbor: a reload puts the boats back and keeps the slides and the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="harbors"]').click(); await screenIs('course');
  const run = (await stored()).courses.harbors.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: 2, assisted: true });
  await click('Resume · harbor 1 of 5'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.equal((await state()).moves, 2, 'the slides spent before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: exactly the fewest slides, harbor after harbor.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.deepEqual({ moves: (await state()).moves, hints: (await state()).hints }, { moves: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 600000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '64', 'the fewest slides, harbor after harbor');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Fewest slides/);
  await screenshot('couch-harbors-result');
  const save = await stored();
  assert.equal(save.courses.harbors.run, null);
  assert.equal(save.courses.harbors.players[0].clean, 64);
  assert.equal(save.stickers['ferry-jam'].count, 1, 'one sticker for the run, not one per harbor');
  // Once a run is finished the best routes can be watched: the demo bot plays the solver's way on the real harbor.
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes' }).count(), 1);
  await click('Watch the best routes'); await screenIs('route');
  await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
  await screenshot('couch-harbors-route');
  await click('Back to the course page'); await screenIs('course');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="harbors"] small').innerText(), '64 slides · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Busy Harbors: shelf, course page, highlight between boats, pick up, slide and set down, put back for free, a taken-back slide still counted, the solver\'s hint, restart, reload resume, a perfect bot run with one sticker and both badges, the best routes replayed passed');
}

return { couchHarbors };
}
