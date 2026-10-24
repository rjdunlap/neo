import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot, finished }) {
/**
 * Island Bridges' Island Hopping course, played Just me with a (synthetic) controller: the highlight between islands, the bottom
 * button arming an island to lay planks toward a neighbour (two at most, a third bumping), a push toward nothing doing nothing,
 * the left button arming it to take planks off for free, the pause menu's hint (a plank that does not belong first, marking the
 * run helped) and clear (planks laid still count), a reload that resumes, then a fresh bot run that lays exactly the answer's
 * planks in all five seas: one sticker, both badges, and the shelf showing par.
 */
async function couchBridges() {
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
  const PAD = [15, 13, 14, 12], BOTTOM = 0, UNDO = 2, START = 9;
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(() => {
    const g = neo.scene.game, h = g.hinted;
    return { index: g.index, entries: g.entries, misses: g.misses, hints: g.hints, focus: g.focus, mode: g.mode, planks: g.planks.slice(), solution: g.puzzle.solution.slice(), par: g.puzzle.par, islands: g.layout.islands.length, hinted: h ? { kind: h.kind, edge: h.edge } : null };
  });
  const walkTo = async (island) => {
    const path = await page.evaluate(async (to) => { const L = await import('/src/games/island-bridges/logic.ts'), g = neo.scene.game; return L.focusPath(g.layout, g.focus, to); }, island);
    for (const dir of path) await press(PAD[dir]);
    assert.equal((await state()).focus, island);
  };
  /** An edge worth testing: its first island, the direction to the other. `wrong` is a bridge where laying planks puts one more than the answer has (one plank on an edge the answer leaves empty, else two on an edge it gives one). */
  const edgeInfo = (pick) => page.evaluate(async (pick) => {
    const L = await import('/src/games/island-bridges/logic.ts'), g = neo.scene.game, lay = g.layout;
    const info = (k, laying) => ({ edge: k, from: lay.edges[k].a, dir: L.directionOf(lay, lay.edges[k].a, k), laying });
    if (pick === 'double') { const k = lay.edges.findIndex((_, i) => g.puzzle.solution[i] === 2); return k < 0 ? null : info(k, 2); }
    const none = lay.edges.findIndex((_, i) => g.puzzle.solution[i] === 0 && L.canAdd(lay, g.planks, i));
    if (none >= 0) return info(none, 1);
    const one = lay.edges.findIndex((e, i) => g.puzzle.solution[i] === 1 && lay.islands[e.a].n >= 2 && lay.islands[e.b].n >= 2);
    return one < 0 ? null : info(one, 2);
  }, pick);

  // --- Just me, the puzzle shelf (twelve puzzles), the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga', 'typing']);
  assert.equal(await page.locator('[data-course="bridges"] small').innerText(), 'Not finished yet · par 120');
  await page.locator('[data-course="bridges"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Island Hopping');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest planks the whole course can take is 120/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 120 planks, every sea by its fewest\./);
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Island Bridges');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Sea 1 of 5/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Sea 1 of 5 · 0 planks so far · this sea's fewest 11 · course minimum 120/);
  let s = await state();
  assert.deepEqual({ index: s.index, entries: s.entries, mode: s.mode, par: s.par, islands: s.islands }, { index: 0, entries: 0, mode: 'move', par: 11, islands: 8 });
  await screenshot('couch-bridges-play');

  // --- Arm an island and lay planks: two at most, a third bumps; a push toward nothing does nothing.
  const dbl = await edgeInfo('double');
  assert.ok(dbl, 'sea 1 has a double bridge in its answer');
  await walkTo(dbl.from);
  await press(BOTTOM);
  s = await state();
  assert.equal(s.mode, 'add', 'the bottom button arms laying planks');
  assert.equal(s.entries, 0, 'arming counts nothing');
  await press(PAD[dbl.dir]);
  s = await state();
  assert.deepEqual({ plank: s.planks[dbl.edge], entries: s.entries }, { plank: 1, entries: 1 });
  assert.equal((await stored()).courses.bridges.run.attempts, 1, 'the plank is saved at once');
  await press(PAD[dbl.dir]);
  assert.deepEqual({ plank: (await state()).planks[dbl.edge], entries: (await state()).entries }, { plank: 2, entries: 2 });
  await press(PAD[dbl.dir]);
  assert.deepEqual({ plank: (await state()).planks[dbl.edge], entries: (await state()).entries }, { plank: 2, entries: 2 }, 'a third plank on one bridge is refused and costs nothing');
  // Taking planks off is free: the left button arms removing, and the same push takes one off.
  await press(UNDO);
  assert.equal((await state()).mode, 'remove');
  await press(PAD[dbl.dir]);
  s = await state();
  assert.deepEqual({ plank: s.planks[dbl.edge], entries: s.entries }, { plank: 1, entries: 2 }, 'a plank taken off is not given back to the count');
  await press(PAD[dbl.dir]);
  assert.equal((await state()).planks[dbl.edge], 0);
  await press(UNDO); // let go
  assert.equal((await state()).mode, 'move');
  await page.waitForFunction(() => /2 planks so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  await screenshot('couch-bridges-laid');

  // --- The pause menu: a plank that does not belong is named first, and a hint marks the run helped for good.
  const wrong = await edgeInfo('wrong');
  assert.ok(wrong, 'a bridge where one plank too many can be laid');
  await walkTo(wrong.from);
  await press(BOTTOM);
  for (let n = 0; n < wrong.laying; n++) await press(PAD[wrong.dir]);
  s = await state();
  assert.ok(s.planks[wrong.edge] > s.solution[wrong.edge], 'more planks than the answer has');
  assert.deepEqual({ misses: s.misses, entries: s.entries }, { misses: 0, entries: 2 + wrong.laying });
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Clear this sea', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual(s.hinted, { kind: 'fix', edge: wrong.edge }, 'a plank that does not belong is named first');
  assert.equal(s.hints, 1);
  assert.equal((await stored()).courses.bridges.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-bridges-hint');
  await press(UNDO); await press(PAD[wrong.dir]);
  s = await state();
  assert.deepEqual({ over: s.planks[wrong.edge] > s.solution[wrong.edge], hinted: s.hinted, entries: s.entries }, { over: false, hinted: null, entries: 2 + wrong.laying });
  // A hint with nothing wrong points at a plank the answer needs.
  await press(START); await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.ok(['forced', 'next'].includes(s.hinted.kind), s.hinted.kind);
  assert.ok(s.planks[s.hinted.edge] < s.solution[s.hinted.edge], 'the edge really needs a plank');
  // Clear: the sea is bare again and nothing already laid is forgiven.
  await press(START); await click('Clear this sea'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual({ laid: s.planks.filter(Boolean).length, entries: s.entries, hinted: s.hinted }, { laid: 0, entries: 2 + wrong.laying, hinted: null });
  const spent = s.entries;

  // --- Leave in the middle of a sea: a reload restores the planks laid and keeps the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="bridges"]').click(); await screenIs('course');
  const run = (await stored()).courses.bridges.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: spent, assisted: true });
  await click('Resume · sea 1 of 5'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.equal((await state()).entries, spent, 'the planks laid before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: exactly the answer's planks, sea after sea.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.deepEqual({ entries: (await state()).entries, hints: (await state()).hints }, { entries: 0, hints: 0 });
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
  assert.equal(await page.locator('.couch-big b').innerText(), '120', 'exactly the answer\'s planks');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Every plank right/);
  await screenshot('couch-bridges-result');
  const save = await stored();
  assert.equal(save.courses.bridges.run, null);
  assert.equal(save.courses.bridges.players[0].clean, 120);
  assert.equal(save.stickers['island-bridges'].count, 1, 'one sticker for the run, not one per sea');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="bridges"] small').innerText(), '120 planks · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Island Hopping: shelf, course page, arming an island and laying planks (two at most), planks taken off free, a wrong plank named first by the hint, clear, reload resume, a perfect bot run with one sticker and both badges passed');
}

return { couchBridges };
}
