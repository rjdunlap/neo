import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot }) {
/**
 * Couch play for one grown-up: the "Who is playing?" choice, the start page and puzzle shelf without Player 2, the standing
 * above par, the page of a course with one player card, Watch the best routes (the demo bot replaying the solver's route on
 * a single pond, only when nothing is half played), the Players section and single name on Settings, a Together-only trip, and
 * going back to two players.
 */
async function couchSolo() {
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const text = () => page.locator('.couch').innerText();
  const click = async (name, exact = true) => { await page.getByRole('button', { name, exact }).first().click(); await page.waitForTimeout(450); };
  const overflow = () => page.evaluate(() => document.querySelector('.couch').scrollWidth > window.innerWidth);
  /** Edit the saved couch data in place, then load it fresh. */
  const seed = async (edit) => {
    await page.evaluate((edit) => { const s = JSON.parse(localStorage.getItem('neo.couch.v1')); Function('s', edit)(s); localStorage.setItem('neo.couch.v1', JSON.stringify(s)); }, edit);
    await page.reload(); await ready(); await enter();
  };
  const finishedPractice = 's.courses = { practice: { version: 1, run: null, players: [{ runs: 1, clean: 21, assisted: null, recent: [{ slides: 21, assisted: false, at: 1 }], badges: ["finish"] }, { runs: 0, clean: null, assisted: null, recent: [], badges: [] }], retired: [] } };';

  // Two players is how couch play began, and the start page offers the choice.
  await enter();
  assert.equal(await page.locator('h1').innerText(), 'An evening on the island');
  assert.equal(await page.locator('[data-key="players-two"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByRole('button', { name: 'Start a couch trip', exact: true }).count(), 1);
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);

  // Just me: its own start page, kept in the save, with the focus still on the choice.
  assert.equal(await page.locator('h1').innerText(), 'Just for you');
  assert.equal((await stored()).settings.players, 'one');
  assert.equal(await page.getByRole('button', { name: 'Start a couch trip', exact: true }).count(), 0);
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.key), 'players-one');
  assert.doesNotMatch(await text(), /Player 2|face off|Face-off/i);
  await screenshot('couch-solo-start');

  // The shelf: every puzzle open, nothing played, par under each.
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('h1').innerText(), 'Puzzle shelf');
  const marks = await page.locator('.couch-course-card small').allInnerTexts();
  assert.deepEqual(marks, ['Not finished yet · par 18', 'Not finished yet · par 30', 'Not finished yet · par 12', 'Not finished yet · par 124', 'Not finished yet · par 149', 'Not finished yet · par 36', 'Not finished yet · par 182', 'Not finished yet · par 230', 'Not finished yet · par 64', 'Not finished yet · par 25', 'Not finished yet · par 24', 'Not finished yet · par 120', 'Not finished yet · par 259']);
  assert.doesNotMatch(await text(), /Player/);
  await screenshot('couch-solo-shelf');
  // A course page has one card of marks, par, and no answer to peek at.
  await page.locator('[data-course="practice"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-player').count(), 1);
  assert.match(await page.locator('.couch-player h2').innerText(), /^Your marks$/);
  assert.match(await text(), /Par is 18 slides, every pond by its best route\. Not finished yet · par 18\./);
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes', exact: true }).count(), 0, 'no answer before a finish');
  assert.equal(await page.getByRole('button', { name: 'Play', exact: true }).count(), 1);
  assert.doesNotMatch(await text(), /Player|plays$/m);

  // A finished run puts her standing on the shelf, and opens the best routes.
  await seed(finishedPractice);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('.couch-course-card small').allInnerTexts(), ['21 slides · 3 above par (18)', 'Not finished yet · par 30', 'Not finished yet · par 12', 'Not finished yet · par 124', 'Not finished yet · par 149', 'Not finished yet · par 36', 'Not finished yet · par 182', 'Not finished yet · par 230', 'Not finished yet · par 64', 'Not finished yet · par 25', 'Not finished yet · par 24', 'Not finished yet · par 120', 'Not finished yet · par 259']);
  await page.locator('[data-course="practice"]').click(); await screenIs('course');
  assert.match(await text(), /21 slides · 3 above par \(18\)\./);
  assert.equal(await page.getByRole('button', { name: 'Play again', exact: true }).count(), 1);
  await screenshot('couch-solo-course');

  // Watch the best routes: the bot replays the solver's route on one pond, and stops when it is eaten.
  await click('Watch the best routes'); await screenIs('route');
  assert.equal(await page.evaluate(() => neo.scene.demo.game.index), 0);
  await page.waitForFunction(() => neo.scene.demo.done, null, { timeout: 20000 });
  assert.equal(await page.evaluate(() => neo.scene.demo.game.moves), 2, 'pond 1 takes its best route of 2 slides');
  await screenshot('couch-solo-route');
  await click('Pond 3');
  await page.waitForFunction(() => neo.scene.screen === 'route' && neo.scene.demo.game.index === 2);
  await page.waitForFunction(() => neo.scene.demo.done, null, { timeout: 25000 });
  assert.equal(await page.evaluate(() => neo.scene.demo.game.moves), 4, 'pond 3 takes its best route of 4 slides');
  assert.equal(await page.locator('[data-key="part-2"]').getAttribute('aria-pressed'), 'true');
  // Nothing was scored or saved by watching, and a replay starts over by itself.
  assert.equal(JSON.stringify((await stored()).courses.practice.players), JSON.stringify([{ runs: 1, clean: 21, assisted: null, recent: [{ slides: 21, assisted: false, at: 1 }], badges: ['finish'] }, { runs: 0, clean: null, assisted: null, recent: [], badges: [] }]));
  assert.equal(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('neo.couch.v1')).stickers).length), 0);
  await page.waitForFunction(() => neo.scene.demo.game.index === 2 && !neo.scene.demo.done && neo.scene.demo.game.moves < 2, null, { timeout: 8000 });
  await page.setViewportSize({ width: 820, height: 1180 }); await page.waitForTimeout(500);
  await screenshot('couch-solo-route-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  await click('Back to the course page'); await screenIs('course');
  assert.equal(await page.evaluate(() => neo.scene.demo ?? null), null, 'the demo is gone');
  assert.equal(await page.evaluate(() => neo.scene.introLayer.visible), false);

  // Half way through a run, the answer is not offered, and the resume button has no name on it.
  await seed(`${finishedPractice} s.courses.practice.run = { player: 0, token: 5, slides: [2], attempts: 1, assisted: false };`);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.ok((await page.locator('.couch-course-card em').allInnerTexts()).includes('IN PROGRESS'));
  await page.locator('[data-course="practice"]').click(); await screenIs('course');
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes', exact: true }).count(), 0, 'not in the middle of a run');
  assert.equal(await page.getByRole('button', { name: 'Resume · pond 2 of 5', exact: true }).count(), 1);
  await page.keyboard.press('Escape', { delay: 120 }); await screenIs('menu');

  // Settings: the same choice, one name, and a Together trip with nobody to pass the controller to.
  await click('Settings'); await screenIs('settings');
  assert.equal(await page.locator('[data-key="players-one"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.couch-names input').count(), 1);
  assert.equal(await page.locator('.couch-names h2').innerText(), 'Your name');
  await page.locator('.couch-names input').fill('Mia'); await page.waitForTimeout(200);
  assert.equal((await stored()).names[0], 'Mia');
  assert.equal(await overflow(), false);
  await click('Back to couch play'); await screenIs('menu');
  await click('Start a trip'); await screenIs('menu');
  assert.equal(await page.locator('h1').innerText(), 'Choose stop 1 of 6');
  assert.match(await text(), /Pick the next game\./);
  assert.doesNotMatch(await text(), /Player|chooses/);
  assert.equal((await stored()).party.mode, 'together');
  assert.equal(await page.getByRole('button', { name: 'Puzzle shelf', exact: true }).count(), 1);
  await screenshot('couch-solo-trip');

  // Back to two players: the pairs of cards, the names and the trip choice all come back, and nothing was lost.
  await click('Settings'); await screenIs('settings');
  await page.locator('[data-key="players-two"]').click(); await page.waitForTimeout(450);
  assert.equal((await stored()).settings.players, 'two');
  assert.equal(await page.locator('.couch-names input').count(), 2);
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.key), 'players-two');
  await click('Back to couch play'); await screenIs('menu');
  await click('Challenges'); await screenIs('courses');
  assert.match(await page.locator('[data-course="practice"] small').innerText(), /Mia|Player 1: 21/);
  await page.locator('[data-course="practice"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-player').count(), 2);
  // The half-played run is still there, and with two players it names whose it is.
  assert.equal(await page.getByRole('button', { name: 'Resume · Mia · pond 2 of 5', exact: true }).count(), 1);
  assert.equal(await overflow(), false);
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child save is untouched');
  assert.deepEqual(errors, []);
  log('Couch solo: Who is playing? on the start page and Settings, Just me start page and puzzle shelf with par standings and no Player 2, one-card course page, Watch the best routes (solver route replayed per pond, not offered mid-run or before a finish, nothing saved), a Together-only trip, back to two players passed');
}

return { couchSolo };
}
