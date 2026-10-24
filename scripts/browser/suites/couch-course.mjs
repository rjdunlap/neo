import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot, finished, next }) {
/**
 * The challenge courses (The Five Ponds in Penguin Slide, Cloud Hopper in Bouncy Launch): entered from the Challenges
 * menu, played with a controller, scored in tries (undone slides and missed launches count), resumed after a reload with
 * their tries kept, helped and unhelped bests kept apart, badges earned once, one sticker per finished run, and the
 * child's save left untouched.
 */
async function couchCourse() {
  await page.addInitScript(() => {
    window.couchPads = [];
    Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true });
  });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button, player = 0) => {
    await page.evaluate(({ button, player }) => { couchPads[player].buttons[button] = { pressed: true, value: 1 }; }, { button, player });
    await page.waitForTimeout(100);
    await page.evaluate(({ button, player }) => { couchPads[player].buttons[button] = { pressed: false, value: 0 }; }, { button, player });
    await page.waitForTimeout(100);
  };
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const stickers = async () => Object.values((await stored()).stickers).reduce((n, v) => n + v.count, 0);
  const onCourse = async () => { await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'course'); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await page.waitForFunction(() => neo.scene.constructor.name === 'CouchScene' && !neo.switching); await page.waitForTimeout(450); };
  const toCourse = async (id) => {
    await enter();
    await page.getByRole('button', { name: 'Challenges', exact: true }).first().click();
    await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
    await page.locator(`[data-course="${id}"]`).click();
    await onCourse();
  };
  // Penguin Slide: the solver's next slide from where the penguin is now, and the d-pad press for it.
  const next = () => page.evaluate(async () => { const S = await import('/src/games/penguin-slide/logic.ts'); const g = neo.scene.game; return S.solve(g.puzzle, g.at, g.have, g.blocks).first; });
  const dpad = [15, 13, 14, 12];
  /** Slide optimally until this pond is eaten, and wait for the next one (or the end of the course). */
  const clearPond = async () => {
    const index = await page.evaluate(() => neo.scene.game.index);
    for (let n = 0; n < 40; n++) {
      await page.waitForFunction(() => neo.scene.screen !== 'game' || !neo.scene.game.busy, null, { timeout: 30000 });
      if (await page.evaluate((i) => neo.scene.screen !== 'game' || neo.scene.game.index !== i || neo.scene.game.finished, index)) break;
      const dir = await next();
      await press(dpad[dir]);
      await page.waitForTimeout(250);
    }
    await page.waitForFunction((i) => neo.scene.screen !== 'game' || neo.scene.game.index > i, index, { timeout: 30000 });
  };
  // Bouncy Launch: hold the stick until the spring is at this power, then launch. Feedback only steers the stick:
  // sideways (axis 0) or down and up (axis 1: down squashes the spring for more power).
  const hop = async (power, axis = 0) => {
    await page.waitForFunction(() => neo.scene.screen !== 'game' || !neo.scene.game.flying, null, { timeout: 30000 });
    await page.evaluate(async ({ target, axis }) => {
      const g = neo.scene.game, start = performance.now();
      while (Math.abs(g.controllerPower - target) > 0.012 && performance.now() - start < 6000) { couchPads[0].axes[axis] = Math.sign(target - g.controllerPower); await kit.sleep(16); }
      couchPads[0].axes[axis] = 0;
    }, { target: power, axis });
    // A spring squashes straight down, by the power: the pet never leans to the side (90 is the game's SQUASH).
    const pose = await page.evaluate(() => { const g = neo.scene.game; return { dx: g.pet.x - g.seat.x, dy: g.pet.y - g.seat.y, power: g.controllerPower }; });
    assert.ok(Math.abs(pose.dx) < 0.5, `the spring squashes straight down (sideways ${pose.dx})`);
    assert.ok(Math.abs(pose.dy - pose.power * 90) < 1.5, `and by the power (down ${pose.dy} at ${pose.power})`);
    await press(0);
    await page.waitForFunction(() => neo.scene.screen !== 'game' || !neo.scene.game.flying, null, { timeout: 30000 });
  };
  const padPower = (pad) => (pad + 0.5) / 5;

  // --- entering: the mode screen offers challenges beside the two trips, and nothing is written by looking.
  await enter();
  assert.equal(await page.getByRole('button', { name: 'Challenges', exact: true }).count(), 1, 'the start page offers the challenges');
  await page.getByRole('button', { name: 'Start a couch trip', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'mode');
  assert.deepEqual(await page.locator('[data-mode]').evaluateAll(n => n.map(x => x.dataset.mode)), ['together', 'faceoff', 'course']);
  await screenshot('couch-course-modes');
  await page.locator('[data-mode="course"]').click();
  await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga', 'typing']);
  await screenshot('couch-course-menu');
  await page.locator('[data-course="ponds"]').click();
  await onCourse();
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'The Five Ponds');
  assert.equal(await page.locator('.couch-player').count(), 2);
  assert.equal(await page.locator('.couch-badges li.earned').count(), 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), null, 'looking at the courses writes nothing');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest slides the whole course can take is 30/);
  await screenshot('couch-course-fresh');

  // --- run A, Player 2: wasted slides trigger a hint, so the run is helped; the undo button doesn't erase slides.
  await page.getByRole('button', { name: 'Player 2 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'intro');
  await page.waitForTimeout(450);
  await makePads(); await page.waitForTimeout(150);
  await press(0);
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(600);
  assert.match(await page.locator('.couch-hud strong').innerText(), /The Five Ponds · Player 2/);
  const first = await page.evaluate(() => ({ best: neo.scene.game.puzzle.best, index: neo.scene.game.index, course: !!neo.scene.game.course }));
  assert.deepEqual(first, { best: 3, index: 0, course: true });
  await page.waitForFunction(() => /Pond 1 of 5/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Pond 1 of 5 · 0 slides so far · this pond's best route 3 · course minimum 30/);
  // A slide the solver would not choose, then undo it: the slide still counts.
  const wasted = async () => {
    await page.waitForFunction(() => !neo.scene.game.busy);
    const dir = await page.evaluate(async () => { const S = await import('/src/games/penguin-slide/logic.ts'); const g = neo.scene.game; const best = S.solve(g.puzzle, g.at, g.have, g.blocks).first; return [0, 1, 2, 3].find(d => d !== best && S.slide(g.puzzle, g.at, d).passed.length > 0); });
    await press(dpad[dir]); await page.waitForTimeout(500);
    await page.waitForFunction(() => !neo.scene.game.busy);
    await press(2); await page.waitForTimeout(450);
  };
  await wasted();
  assert.equal(await page.evaluate(() => neo.scene.game.moves), 1, 'the undone slide still counts');
  assert.equal((await stored()).courses.ponds.run.attempts, 1, 'and is already saved');
  assert.equal(await page.evaluate(() => neo.scene.game.at.x + ',' + neo.scene.game.at.y === neo.scene.game.puzzle.start.x + ',' + neo.scene.game.puzzle.start.y), true, 'undo put the penguin back');
  // Pause menu in a course: back to the course page rather than "a different game".
  await press(9);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Back to the course page', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Choose a different game', exact: true }).count(), 0);
  await press(0); // Resume round is first in the list
  await page.waitForFunction(() => neo.scene.screen === 'game');
  await wasted(); await wasted();
  assert.equal(await page.evaluate(() => neo.scene.game.moves), 3);
  // Leave in the middle of a pond: a reload restores the slides, restarts the pond, and keeps the player.
  await page.reload(); await ready(); await makePads();
  await toCourse('ponds');
  assert.deepEqual((await stored()).courses.ponds.run, { player: 1, token: (await stored()).courses.ponds.run.token, slides: [], attempts: 3, assisted: false });
  const resume = page.getByRole('button', { name: /^Resume · Player 2 · pond 1 of 5$/ });
  assert.equal(await resume.count(), 1);
  await screenshot('couch-course-resume');
  await resume.click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => neo.scene.game.moves), 3, 'the slides spent before the reload still count');
  await makePads(); await page.waitForTimeout(150);
  // Seven slides is more than three over the best: the hint arrow appears and the run is marked helped.
  await wasted(); await wasted();
  for (let n = 0; n < 2; n++) { await page.waitForFunction(() => !neo.scene.game.busy); await press(dpad[await next()]); await page.waitForTimeout(450); }
  await page.waitForFunction(() => neo.scene.game.hints === 1);
  assert.equal((await stored()).courses.ponds.run.assisted, true, 'a shown hint marks the run helped');
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-course-playing');
  await clearPond();
  assert.deepEqual((await stored()).courses.ponds.run.slides, [8], 'five wasted slides and three good ones');
  assert.equal(await page.evaluate(() => neo.scene.game.index), 1);
  assert.equal(await page.evaluate(() => neo.scene.game.puzzle.best), 5);
  assert.equal(await page.evaluate(() => neo.scene.game.moves), 0, 'the next pond starts at zero');
  for (let pond = 1; pond < 5; pond++) await clearPond();
  await onCourse();
  assert.equal(await stickers(), 1, 'one sticker for the run, not one per pond');
  assert.equal(await page.locator('.couch-big b').innerText(), '35');
  assert.match(await page.locator('.couch-outcome-line').innerText(), /Player 2 · course minimum 30\. Your first finish \(with help\)/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /NEW BADGE\s*Finished$/);
  assert.equal(await page.locator('.couch-pond-scores li').count(), 5);
  assert.deepEqual(await page.locator('.couch-pond-scores li').allInnerTexts(), ['Pond 1: 8 slides · best route 3', 'Pond 2: 5 slides · best route 5', 'Pond 3: 6 slides · best route 6', 'Pond 4: 7 slides · best route 7', 'Pond 5: 9 slides · best route 9']);
  let save = await stored();
  assert.equal(save.courses.ponds.run, null);
  assert.deepEqual({ clean: save.courses.ponds.players[1].clean, assisted: save.courses.ponds.players[1].assisted, runs: save.courses.ponds.players[1].runs, badges: save.courses.ponds.players[1].badges }, { clean: null, assisted: 35, runs: 1, badges: ['finish'] });
  assert.deepEqual(save.courses.ponds.players[0], { runs: 0, clean: null, assisted: null, recent: [], badges: [] }, 'the other player has nothing');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child save is untouched');
  await screenshot('couch-course-result-helped');

  // A reload (or a second finish of the same run) cannot award twice.
  const afterA = await page.evaluate(() => localStorage.getItem('neo.couch.v1'));
  await page.reload(); await ready(); await makePads(); await toCourse('ponds');
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), afterA);
  assert.equal(await page.locator('.couch-outcome').count(), 0, 'the fanfare is not replayed after a reload');

  // --- run B, Player 1: no hint, the fewest slides possible: both badges, and a best with no help.
  await page.getByRole('button', { name: 'Player 1 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && (neo.scene.screen === 'game' || neo.scene.screen === 'intro'));
  assert.equal(await page.evaluate(() => neo.scene.screen), 'game', 'Penguin Slide has been explained, so the run starts at once');
  await page.waitForTimeout(600); await makePads(); await page.waitForTimeout(150);
  for (let pond = 0; pond < 5; pond++) await clearPond();
  await onCourse();
  assert.equal(await stickers(), 2);
  assert.equal(await page.locator('.couch-big b').innerText(), '30');
  assert.match(await page.locator('.couch-outcome-line').innerText(), /The fewest slides possible: perfect!/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished and Perfect route/);
  save = await stored();
  assert.deepEqual(save.courses.ponds.players[0].badges, ['finish', 'minimum']);
  assert.equal(save.courses.ponds.players[0].clean, 30);
  assert.equal(save.courses.ponds.players[1].assisted, 35, 'Player 2 keeps their own mark');
  assert.equal(await page.locator('.couch-badges li.earned').count(), 3);
  await screenshot('couch-course-result-perfect');

  // --- Cloud Hopper (Bouncy Launch), Player 2: two misses at the first cloud bring the hint and so a helped run.
  await page.getByRole('button', { name: 'All challenges', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
  assert.match(await page.locator('[data-course="ponds"]').innerText(), /Player 1: 30 · Player 2: 35 with help/);
  await page.locator('[data-course="clouds"]').click();
  await onCourse();
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Cloud Hopper');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest launches the whole course can take is 12/);
  await screenshot('couch-clouds-fresh');
  await page.getByRole('button', { name: 'Player 2 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'intro');
  await page.waitForTimeout(450); await makePads(); await page.waitForTimeout(150);
  await press(0);
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(800);
  assert.match(await page.locator('.couch-hud strong').innerText(), /Cloud Hopper · Player 2/);
  const clouds = await page.evaluate(() => ({ targets: neo.scene.game.targets.slice(), course: !!neo.scene.game.course, shot: neo.scene.game.shot }));
  assert.equal(clouds.course, true);
  assert.equal(clouds.targets.length, 12);
  await page.waitForFunction(() => /Cloud 1 of 12/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Cloud 1 of 12 · 0 launches so far · course minimum 12/);
  const away = (pad) => pad < 2 ? 0.95 : 0.05;
  await hop(away(clouds.targets[0]));
  assert.equal(await page.evaluate(() => neo.scene.game.shot), 0, 'a miss stays on the same cloud');
  assert.equal((await stored()).courses.clouds.run.attempts, 1, 'the missed launch is saved');
  // Leave mid-cloud: a reload keeps the launch that was spent, and the run keeps its player.
  await page.reload(); await ready(); await makePads();
  await toCourse('clouds');
  const run = (await stored()).courses.clouds.run;
  assert.deepEqual({ player: run.player, slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { player: 1, slides: [], attempts: 1, assisted: false });
  assert.equal(await page.locator('.couch-lanterns .lit').count(), 0);
  await page.getByRole('button', { name: /^Resume · Player 2 · cloud 1 of 12$/ }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(800); await makePads(); await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => neo.scene.game.tries), 1, 'the launch spent before the reload still counts');
  assert.match(await page.locator('.couch-hud-stats').innerText(), /1 launch so far/);
  await hop(away(clouds.targets[0]));
  await page.waitForFunction(() => neo.scene.game.hints === 1);
  assert.equal((await stored()).courses.clouds.run.assisted, true, 'two misses bring the hint, and mark the run helped');
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-clouds-hint');
  await hop(padPower(clouds.targets[0]));
  assert.deepEqual((await stored()).courses.clouds.run.slides, [3], 'two misses and a hit');
  for (let cloud = 1; cloud < 12; cloud++) await hop(padPower(clouds.targets[cloud]), cloud % 2);
  await onCourse();
  assert.equal(await stickers(), 3);
  assert.equal(await page.locator('.couch-big b').innerText(), '14');
  assert.match(await page.locator('.couch-outcome-line').innerText(), /Player 2 · course minimum 12\. Your first finish \(with help\)/);
  assert.equal(await page.locator('.couch-pond-scores li').count(), 12);
  assert.equal((await page.locator('.couch-pond-scores li').first().innerText()), 'Cloud 1: 3 launches');
  assert.equal(await page.locator('.couch-pond-scores li.perfect').count(), 11);
  save = await stored();
  assert.deepEqual({ clean: save.courses.clouds.players[1].clean, assisted: save.courses.clouds.players[1].assisted, badges: save.courses.clouds.players[1].badges }, { clean: null, assisted: 14, badges: ['finish'] });
  assert.equal(save.stickers['bouncy-launch'].count, 1);
  assert.equal(save.courses.ponds.players[1].assisted, 35, 'the other course is untouched');
  await screenshot('couch-clouds-result');

  // --- Cloud Hopper, Player 1: a first-launch landing on every cloud, no hint: the perfect badge.
  await page.getByRole('button', { name: 'Player 1 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(800); await makePads(); await page.waitForTimeout(150);
  for (let cloud = 0; cloud < 12; cloud++) await hop(padPower(clouds.targets[cloud]), cloud % 2);
  await onCourse();
  assert.equal(await stickers(), 4);
  assert.equal(await page.locator('.couch-big b').innerText(), '12');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished and Perfect landings/);
  save = await stored();
  assert.deepEqual({ clean: save.courses.clouds.players[0].clean, badges: save.courses.clouds.players[0].badges, runs: save.courses.clouds.players[0].runs }, { clean: 12, badges: ['finish', 'minimum'], runs: 1 });

  // --- Pond Practice, Player 1: the gentle course is the same Penguin Slide with easier ponds and its own minimum.
  await page.getByRole('button', { name: 'All challenges', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
  await page.locator('[data-course="practice"]').click();
  await onCourse();
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Pond Practice');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest slides the whole course can take is 18/);
  await page.getByRole('button', { name: 'Player 1 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(700); await makePads(); await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => neo.scene.game.puzzle.best), 2, 'the first practice pond takes two slides');
  assert.match(await page.locator('.couch-hud strong').innerText(), /Pond Practice · Player 1/);
  for (let pond = 0; pond < 5; pond++) await clearPond();
  await onCourse();
  assert.equal(await stickers(), 5);
  assert.equal(await page.locator('.couch-big b').innerText(), '18');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished and Perfect route/);
  save = await stored();
  assert.deepEqual({ clean: save.courses.practice.players[0].clean, runs: save.courses.practice.players[0].runs }, { clean: 18, runs: 1 });
  assert.equal(save.courses.ponds.players[0].clean, 30, 'the Five Ponds record is separate');
  await screenshot('couch-practice-result');

  // --- Pause, "Start this pond again": the penguin goes home with every fish back, the slides still count, and the pond can still be finished.
  // (The round arrow beside the pond is not drawn on the couch: the couch takes no pointer input, so it could only look like a restart.)
  await page.getByRole('button', { name: 'Player 2 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(700); await makePads(); await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => neo.scene.game.undo.visible), false, 'no round arrow that cannot be clicked');
  const homeNow = () => page.evaluate(() => { const g = neo.scene.game; return { moves: g.moves, home: g.at.x === g.puzzle.start.x && g.at.y === g.puzzle.start.y, have: g.have, history: g.history.length }; });
  await page.waitForFunction(() => !neo.scene.game.busy);
  await press(dpad[await next()]); await page.waitForTimeout(600);
  await page.waitForFunction(() => !neo.scene.game.busy);
  assert.deepEqual({ ...await homeNow(), have: 0 }, { moves: 1, home: false, have: 0, history: 1 });
  await press(9);
  const restart = page.getByRole('button', { name: 'Start this pond again', exact: true });
  assert.equal(await restart.count(), 1, 'the pause menu offers a restart');
  await screenshot('couch-pause-restart');
  await restart.click();
  await page.waitForFunction(() => neo.scene.screen === 'game' && !neo.scene.game.busy);
  assert.deepEqual(await homeNow(), { moves: 1, home: true, have: 0, history: 0 }, 'back at the start, the slide still counted');
  assert.equal((await stored()).courses.practice.run.attempts, 1, 'and it is still saved');
  // A restart asked for in the middle of a slide waits for the penguin to stop, then puts it home.
  const mid = await page.evaluate(async () => { const S = await import('/src/games/penguin-slide/logic.ts'); const g = neo.scene.game; const slid = g.go(S.solve(g.puzzle, g.at, g.have, g.blocks).first); const busy = g.busy; g.restart(); await slid; await kit.sleep(700); return { busy }; });
  assert.equal(mid.busy, true, 'the slide was under way');
  assert.deepEqual(await homeNow(), { moves: 2, home: true, have: 0, history: 0 }, 'a restart asked for mid-slide still happens');
  await clearPond();
  assert.equal(await page.evaluate(() => neo.scene.game.index), 1, 'the pond can still be finished');

  // --- a run left after its last part was finished, but before its result, settles when it is resumed.
  for (const [id, parts, player] of [['clouds', Array(12).fill(1), 0], ['practice', [2, 3, 4, 4, 5], 1]]) {
    await page.evaluate(({ id, parts, player }) => { const s = JSON.parse(localStorage.getItem('neo.couch.v1')); s.courses[id].run = { player, token: 4242, slides: parts, attempts: 0, assisted: false }; localStorage.setItem('neo.couch.v1', JSON.stringify(s)); }, { id, parts, player });
    const before = await stickers();
    await page.reload(); await ready(); await makePads(); await toCourse(id);
    await page.getByRole('button', { name: /^Resume · / }).click();
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'course' && document.querySelector('.couch-outcome'), null, { timeout: 30000 });
    await page.waitForTimeout(450); // a new scene ignores input for its first moments
    assert.equal(await stickers(), before + 1, `${id}: a finished run settles once`);
    assert.equal((await stored()).courses[id].run, null);
    assert.equal(await page.locator('.couch-big b').innerText(), String(parts.reduce((a, b) => a + b, 0)));
  }

  // --- The Frozen Ponds, Player 1: ice blocks read from the board, pushed with the d-pad, a push counted as a slide.
  await page.reload(); await ready(); await makePads(); await toCourse('frozen');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'The Frozen Ponds');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest slides the whole course can take is 31/);
  const frozenBefore = await stickers();
  await page.getByRole('button', { name: 'Player 1 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(600); await makePads(); await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(() => neo.scene.game.blocks), [{ x: 5, y: 3 }], 'the first pond has its block');
  await screenshot('couch-course-frozen');
  for (let pond = 0; pond < 5; pond++) await clearPond();
  await onCourse();
  assert.equal(await stickers(), frozenBefore + 1, 'one sticker for the frozen run');
  assert.equal(await page.locator('.couch-big b').innerText(), '31');
  assert.match(await page.locator('.couch-outcome-line').innerText(), /The fewest slides possible: perfect!/);
  assert.deepEqual((await stored()).courses.frozen.players[0].badges, ['finish', 'minimum']);

  // --- backup and restore carry every course, byte for byte; the child's save was never touched.
  const finalSave = await page.evaluate(() => localStorage.getItem('neo.couch.v1'));
  await page.getByRole('button', { name: 'All challenges', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Back to couch play', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'menu'); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'settings'); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Couch backup', exact: true }).click();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download couch backup', exact: true }).click();
  await (await download).saveAs('test-results/couch-course-backup.json');
  await page.locator('input[type=file]').setInputFiles('test-results/couch-course-backup.json');
  await page.waitForFunction(() => neo.scene.screen === 'menu');
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), finalSave, 'backup round trip');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child save is untouched');
  assert.deepEqual(errors, []);
  log('Couch courses: Challenges menu, controller play in both games, the gentle course and the frozen ponds (block pushes), undone slides and missed launches counted, resume after reload with tries kept, hints mark a run helped, one sticker per run, separate records and badges per player and course, backup round trip, child isolation passed');
}

return { couchCourse };
}
