import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot }) {
/**
 * Optional player names: typed once on the Settings page (W, S, space and backspace are letters there, not paddles
 * and undo), kept in the couch save, and used for the choosers, results, course pages and the finale.
 */
async function couchNames() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const enter = async () => { await chooserEnter(); await page.waitForFunction(() => neo.scene.constructor.name === 'CouchScene' && !neo.switching); await page.waitForTimeout(450); };
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  await enter();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'settings');
  const inputs = page.locator('.couch-names input');
  assert.equal(await inputs.count(), 2);
  assert.deepEqual(await inputs.evaluateAll(n => n.map(x => x.placeholder)), ['Player 1', 'Player 2']);
  // Keys the couch uses for paddles (W, S), confirm (space) and undo (backspace) must type like any others here.
  await inputs.nth(0).click();
  await page.keyboard.type('Rowan Lee', { delay: 30 });
  for (let n = 0; n < 4; n++) await page.keyboard.press('Backspace');
  assert.equal(await inputs.nth(0).inputValue(), 'Rowan');
  await inputs.nth(1).click();
  await page.keyboard.type('Sam', { delay: 30 });
  assert.equal(await inputs.nth(1).inputValue(), 'Sam');
  assert.deepEqual((await stored()).names, ['Rowan', 'Sam']);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'settings', 'typing did not press any couch button');
  await screenshot('couch-names-settings');
  await page.getByRole('button', { name: 'Back to couch play', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'menu'); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Start a couch trip', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'mode'); await page.waitForTimeout(450);
  await page.locator('[data-mode="faceoff"]').click();
  await page.waitForFunction(() => neo.scene.screen === 'menu'); await page.waitForTimeout(450);
  assert.match(await page.locator('.couch-sheet').innerText(), /Rowan chooses\./);
  // Names survive a reload.
  await page.reload(); await ready(); await enter();
  assert.match(await page.locator('.couch-sheet').innerText(), /Rowan chooses\./);
  assert.deepEqual((await stored()).names, ['Rowan', 'Sam']);
  // The course page and the finale speak in names too.
  await page.getByRole('button', { name: 'Challenges', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
  assert.match(await page.locator('[data-course="ponds"]').innerText(), /Rowan: no finish yet · Sam: no finish yet/);
  await page.locator('[data-course="ponds"]').click();
  await page.waitForFunction(() => neo.scene.screen === 'course'); await page.waitForTimeout(450);
  assert.equal(await page.getByRole('button', { name: 'Rowan plays', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Sam plays', exact: true }).count(), 1);
  const rounds = [['penguin-slide', 0], ['bouncy-launch', 1], ['bumper-garden', 'team'], ['penguin-slide', 0], ['bouncy-launch', 0], ['bumper-garden', 'team']].map(([id, winner], i) => ({ id, seed: 10 + i, level: 3, misses: 0, hints: 0, winner, ...(id === 'bumper-garden' ? {} : { scores: winner === 0 ? [0, 2] : [2, 0] }) }));
  await page.evaluate((rounds) => { const save = JSON.parse(localStorage.getItem('neo.couch.v1')); save.trips = 1; save.party = { seed: 31, mode: 'faceoff', reroll: 0, turn: null, selected: null, rounds }; localStorage.setItem('neo.couch.v1', JSON.stringify(save)); }, rounds);
  await page.reload(); await ready(); await enter();
  await page.waitForFunction(() => neo.scene.finaleStage?.lanterns.every(l => l.lit), null, { timeout: 20000 });
  assert.equal(await page.locator('.couch-head .couch-intro').innerText(), 'Rowan wins 5 to 3, and you both lit all six lanterns!');
  assert.deepEqual(await page.locator('.couch-score-side small').allInnerTexts(), ['Rowan · ahead', 'Sam']);
  assert.match(await page.locator('.couch-recap').innerText(), /Rowan won/);
  assert.doesNotMatch(await page.locator('.couch-sheet').innerText(), /Player [12]/, 'no placeholder name is left once both have names');
  await screenshot('couch-names-finale');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child save is untouched');
  assert.deepEqual(errors, []);
  log('Couch names: typed on the Settings page without pressing couch buttons, saved, used in the chooser, the course pages and the finale, kept through a reload passed');
}

return { couchNames };
}
