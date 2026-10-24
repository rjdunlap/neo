import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot, finished }) {
/**
 * Pond Conga on the puzzle shelf: Just me, Crumb Trail's page, a line that waits for the first turn, a bonk that turns the whole
 * line about and counts a step, a hint that marks the run helped, restart that keeps the steps, a reload that resumes the pond,
 * and a fresh bot run of all four ponds in exactly the fewest steps.
 */
async function couchConga() {
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
  const PAD = [15, 13, 14, 12], START = 9;
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(() => {
    const g = neo.scene.game, head = g.state.body[0];
    return { index: g.index, tries: g.tries, misses: g.misses, hints: g.hints, waiting: g.waiting, heading: g.state.heading, eaten: g.state.eaten, length: g.state.body.length, head: [head.x, head.y], tail: [g.state.body.at(-1).x, g.state.body.at(-1).y], par: g.pond.par, hinted: g.hinted, dots: g.hintCells.length, breather: g.breather };
  });

  // --- Just me, the puzzle shelf (thirteen puzzles), the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga', 'typing']);
  assert.equal(await page.locator('[data-course="conga"] small').innerText(), 'Not finished yet · par 259');
  await page.locator('[data-course="conga"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Crumb Trail');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest steps the whole course can take is 259/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 259 steps, every pond by its fewest\./);
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Pond Conga');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Pond 1 of 4/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Pond 1 of 4 · 0 steps so far · this pond's fewest 34 · course minimum 259/);
  let s = await state();
  assert.deepEqual({ index: s.index, tries: s.tries, waiting: s.waiting, heading: s.heading, length: s.length, par: s.par }, { index: 0, tries: 0, waiting: true, heading: 0, length: 3, par: 34 });
  // Nothing moves before somebody is ready.
  await page.waitForTimeout(1500);
  s = await state();
  assert.deepEqual({ tries: s.tries, waiting: s.waiting, head: s.head }, { tries: 0, waiting: true, head: [3, 3] }, 'the line waits for the first turn of the stick');
  await screenshot('couch-conga-play');

  // --- Set off, straight on to the bank: a bonk turns the whole line about, keeps every duckling, and counts a step.
  await press(PAD[0]);
  await page.waitForFunction(() => neo.scene.game.misses === 1, null, { timeout: 15000 });
  s = await state();
  assert.deepEqual({ waiting: s.waiting, misses: s.misses, heading: s.heading, length: s.length, tail: s.tail }, { waiting: false, misses: 1, heading: 2, length: 3, tail: [10, 3] }, 'the line turned about at the bank with all three ducklings, the old leader now last');
  assert.equal(s.tries, 8, 'seven steps and the bonk each count');
  assert.ok(s.breather > 0, 'a breather after a bonk');
  assert.equal((await stored()).courses.conga.run.attempts, 8, 'the steps are saved as they are taken');
  await screenshot('couch-conga-bonk');
  // Straight back on a stick is ignored: the line only turns by a right angle.
  await press(PAD[2]);
  await page.waitForTimeout(1200);
  s = await state();
  assert.equal(s.heading, 2, 'a turn straight back does nothing');

  // --- The pause menu: a hint (dots to the next crumb, the run marked helped for good) and a restart that keeps the steps.
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Start this pond again', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual({ hinted: s.hinted, hints: s.hints }, { hinted: true, hints: 1 });
  assert.ok(s.dots >= 1, 'dots show the way');
  assert.equal((await stored()).courses.conga.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await page.waitForTimeout(300);
  await screenshot('couch-conga-hint');
  const spent = (await state()).tries;
  await press(START); await click('Start this pond again'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(400);
  s = await state();
  assert.deepEqual({ waiting: s.waiting, head: s.head, heading: s.heading, length: s.length, eaten: s.eaten, hinted: s.hinted }, { waiting: true, head: [3, 3], heading: 0, length: 3, eaten: 0, hinted: false }, 'the line is back at the start');
  assert.equal(s.tries, spent, 'the steps already taken still count: a restart never improves a score');

  // --- Leave in the middle of a pond: a reload keeps the steps and the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="conga"]').click(); await screenIs('course');
  const run = (await stored()).courses.conga.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: spent, assisted: true });
  await click('Resume · pond 1 of 4'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.equal((await state()).tries, spent, 'the steps taken before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: exactly the fewest steps, pond after pond.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.deepEqual({ tries: (await state()).tries, hints: (await state()).hints }, { tries: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 900000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '259', 'exactly the fewest steps');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Fewest steps/);
  await screenshot('couch-conga-result');
  const save = await stored();
  assert.equal(save.courses.conga.run, null);
  assert.equal(save.courses.conga.players[0].clean, 259);
  assert.equal(save.stickers['pond-conga'].count, 1, 'one sticker for the run, not one per pond');
  // Once a run is finished the best routes can be watched: the demo bot paddles the fewest-steps way on the real pond.
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes' }).count(), 1);
  await click('Watch the best routes'); await screenIs('route');
  await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
  await screenshot('couch-conga-route');
  await click('Back to the course page'); await screenIs('course');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="conga"] small').innerText(), '259 steps · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Crumb Trail: shelf, course page, a line that waits for the first turn, a bonk that turns the whole line about and counts a step, straight back ignored, a hint with dots (run marked helped), restart keeping the steps, reload resume, a perfect bot run with one sticker and both badges, the best routes replayed passed');
}

return { couchConga };
}
