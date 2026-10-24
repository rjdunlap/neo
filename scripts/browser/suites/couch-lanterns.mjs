import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot, finished }) {
/**
 * Lantern Lights' Dusk on the Pond course, played Just me with a (synthetic) controller: pressing flips a lantern and its
 * neighbours and counts, taking a press back is free but the press stays counted, the pause menu's hint points into a
 * fewest-press way and marks the run helped, restart keeps the presses, a reload resumes the pond with them, then a fresh
 * run the bot plays perfectly: exactly the fewest presses, one sticker, both badges, and the shelf showing par.
 */
async function couchLanterns() {
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
  const [RIGHT, UNDO, BOTTOM, START] = [15, 2, 0, 9];
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(async () => {
    const L = await import('/src/games/lantern-lights/logic.ts'), g = neo.scene.game;
    return { index: g.index, n: g.n, presses: g.presses, hints: g.hints, cursor: g.cursor, hinted: g.hinted, lit: g.lit.slice(), start: g.pond.board.slice(), par: g.pond.par, fewest: L.fewestPresses(g.lit, g.n), history: g.history.length, ways: L.solve(g.lit, g.n)?.best.flat() ?? [] };
  });

  // --- Just me, the puzzle shelf, the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga', 'typing']);
  assert.equal(await page.locator('[data-course="lanterns"] small').innerText(), 'Not finished yet · par 36');
  await page.locator('[data-course="lanterns"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Dusk on the Pond');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest presses the whole course can take is 36/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 36 presses, every pond by its fewest\./);
  await screenshot('couch-lanterns-course');
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Lantern Lights');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Pond 1 of 5/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Pond 1 of 5 · 0 presses so far · this pond's fewest 4 · course minimum 36/);
  let s = await state();
  assert.deepEqual({ index: s.index, n: s.n, presses: s.presses, par: s.par, fewest: s.fewest }, { index: 0, n: 4, presses: 0, par: 4, fewest: 4 });
  await screenshot('couch-lanterns-play');

  // --- A press flips the lantern and its neighbours, and counts at once; taking it back is free but never uncounts it.
  const at = s.cursor;
  await press(BOTTOM);
  const after = await state();
  assert.equal(after.presses, 1);
  const flipped = after.lit.map((on, i) => (on !== s.lit[i] ? i : -1)).filter(i => i >= 0);
  const r = Math.floor(at / 4), c = at % 4, around = [at, r > 0 && at - 4, r < 3 && at + 4, c > 0 && at - 1, c < 3 && at + 1].filter(x => x !== false).sort((a, b) => a - b);
  assert.deepEqual(flipped, around, 'the lantern and the ones beside it, no others');
  assert.equal((await stored()).courses.lanterns.run.attempts, 1, 'the press is saved at once');
  await page.waitForFunction(() => /1 press so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  await press(UNDO);
  s = await state();
  assert.deepEqual({ lit: s.lit, presses: s.presses, history: s.history }, { lit: s.start, presses: 1, history: 0 });
  await press(UNDO);
  assert.equal((await state()).presses, 1, 'with nothing to take back, nothing happens');
  await press(RIGHT);
  assert.equal((await state()).cursor, at + 1, 'the d-pad moves one lantern');

  // --- Help comes from the pause menu: a lantern in a fewest-press way, and the run is helped for good.
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Start this pond again', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.ok(s.hinted !== null && s.ways.includes(s.hinted), 'the hinted lantern is in a fewest-press way');
  assert.equal(s.cursor, s.hinted, 'the cursor goes to it');
  assert.equal(s.hints, 1);
  assert.equal((await stored()).courses.lanterns.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-lanterns-hint');
  const before = s.fewest;
  await press(BOTTOM);
  s = await state();
  assert.equal(s.fewest, before - 1, 'pressing the hinted lantern brings the fewest down by one');
  assert.equal(s.presses, 2);
  assert.equal(s.hinted, null);
  // Restart: the pond goes back to its start and nothing already pressed is forgiven.
  await press(START); await click('Start this pond again'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(400);
  s = await state();
  assert.deepEqual({ lit: s.lit, presses: s.presses, history: s.history }, { lit: s.start, presses: 2, history: 0 });

  // --- Leave in the middle of a pond: a reload restores the presses, puts the pond back, and keeps the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="lanterns"]').click(); await screenIs('course');
  const run = (await stored()).courses.lanterns.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: 2, assisted: true });
  await click('Resume · pond 1 of 5'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.equal((await state()).presses, 2, 'the presses spent before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: exactly the fewest presses.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.deepEqual({ presses: (await state()).presses, hints: (await state()).hints }, { presses: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 300000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '36', 'the fewest presses, pond after pond');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Fewest presses/);
  await screenshot('couch-lanterns-result');
  const save = await stored();
  assert.equal(save.courses.lanterns.run, null);
  assert.equal(save.courses.lanterns.players[0].clean, 36);
  assert.equal(save.stickers['lantern-lights'].count, 1, 'one sticker for the run, not one per pond');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="lanterns"] small').innerText(), '36 presses · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Dusk on the Pond: shelf, course page, a press and its neighbours, a taken-back press still counted, a hint into a fewest-press way, restart, reload resume, a perfect bot run with one sticker and both badges passed');
}

return { couchLanterns };
}
