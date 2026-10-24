import assert from 'node:assert/strict';

export function createSuite({ page, browser, errors, islandUrl, log, ready, scene, screenshot, launch }) {
/** The grown-ups' gear on "Who's playing?", Esc and the pause sheet in a game, and undoing a reset. */
async function grownUps() {
  const gear = page.locator('.gear:not(.gear--inline)');
  const holdOn = async (locator, ms) => {
    const box = await locator.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up();
  };
  const sceneName = () => page.evaluate(() => neo.scene.constructor.name);

  // "Who's playing?": a tap on the gear only hints, a two-second hold opens the page, and typing there must not choose a card.
  await page.evaluate(() => neo.go.start()); await scene('ChooserScene');
  await gear.waitFor();
  await holdOn(gear, 300);
  assert.equal(await page.locator('.parent').count(), 0, 'a tap opens nothing');
  assert.ok(await gear.evaluate((el) => el.classList.contains('gear--hint')), 'a tap shows the hint');
  await holdOn(gear, 2400);
  await page.locator('.parent').waitFor();
  assert.equal(await page.locator('[data-undo]').isVisible(), false, 'nothing to undo yet');
  await page.locator('#p-name').fill('');
  await page.locator('#p-name').pressSequentially('Cleo');
  assert.equal(await sceneName(), 'ChooserScene', 'typing in the name field does not leave the chooser');
  assert.equal(await page.evaluate(() => kit.store.data.profile.name), 'Cleo');
  await page.keyboard.press('Escape');
  await scene('ChooserScene');
  assert.equal(await page.locator('.parent').count(), 0, 'Esc closes the page');
  assert.equal(await page.locator('.pause').count(), 0, 'and does not also open the pause sheet');
  // The keyboard works too: hold Enter on the focused gear.
  await gear.focus(); await page.keyboard.down('Enter'); await page.waitForTimeout(2400); await page.keyboard.up('Enter');
  await page.locator('.parent').waitFor();
  await page.locator('[data-done]').click(); await scene('ChooserScene');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  assert.equal(await page.locator('.pause').count(), 0, 'Esc does nothing on the chooser');

  // In a game, Esc holds the round still; Esc again lets it go.
  await launch('bubble-pop', 1);
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.locator('.pause').waitFor();
  assert.equal(await page.evaluate(() => neo.paused), true);
  const frozen = await page.evaluate(() => neo.scene.seconds);
  await page.waitForTimeout(800);
  assert.equal(await page.evaluate(() => neo.scene.seconds), frozen, 'the round holds still while paused');
  assert.equal(await page.locator('.pause button.btn').count(), 1, 'a child\'s game whose help follows misses offers no entries of its own');
  await screenshot('pause-sheet');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
  await screenshot('pause-sheet-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.pause') && !neo.paused);
  await page.waitForFunction((s) => neo.scene.seconds > s, frozen);

  // A puzzle's own Start again and Show a hint, labelled as the couch labels them: by click, then by a pad (Start opens,
  // the d-pad moves, A presses on release).
  await launch('sudoku-garden', 1);
  await page.waitForFunction(() => neo.scene.game?.puzzle);
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape'); await page.locator('.pause').waitFor();
  assert.deepEqual(await page.locator('.pause button.btn').allTextContents(), ['Keep playing', 'Start this bed again', 'Show a hint']);
  await screenshot('pause-sheet-actions');
  await page.locator('.pause button.btn', { hasText: 'Show a hint' }).click();
  await page.waitForFunction(() => !neo.paused && !document.querySelector('.pause') && neo.scene.game.hints === 1);
  await page.evaluate(() => {
    const g = neo.scene.game, i = g.grid.findIndex((d) => !d);
    g.grid[i] = g.puzzle.solution[i];
    window.fakePad = { connected: true, axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
    navigator.getGamepads = () => [window.fakePad];
  });
  const padTap = async (i) => {
    await page.evaluate((i) => { fakePad.buttons[i].pressed = true; }, i); await page.waitForTimeout(150);
    await page.evaluate((i) => { fakePad.buttons[i].pressed = false; }, i); await page.waitForTimeout(150);
  };
  const focusedText = () => page.evaluate(() => document.activeElement?.textContent);
  await padTap(9); await page.locator('.pause').waitFor();
  await padTap(13); await padTap(13);
  assert.equal(await focusedText(), 'Show a hint');
  await padTap(13); assert.equal(await focusedText(), 'Keep playing', 'the ring wraps');
  await padTap(12); await padTap(12);
  assert.equal(await focusedText(), 'Start this bed again');
  await padTap(0);
  await page.waitForFunction(() => !neo.paused && !document.querySelector('.pause'));
  assert.deepEqual(await page.evaluate(() => neo.scene.game.grid), await page.evaluate(() => neo.scene.game.puzzle.start), 'the pad\'s A started the bed again');
  assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'and a restart is not a hint');
  await page.evaluate(() => { delete navigator.getGamepads; });
  await launch('bubble-pop', 1);
  await page.waitForTimeout(500);

  // From the pause sheet, holding its gear opens the page; Esc closes that to the island map and does not reopen the sheet.
  await page.keyboard.press('Escape');
  await page.locator('.pause').waitFor();
  await holdOn(page.locator('.pause .gear'), 2400);
  await page.locator('.parent').waitFor();
  assert.equal(await page.locator('.pause').count(), 0, 'the sheet gives way to the page');
  await page.keyboard.press('Escape');
  await scene('MapScene');
  assert.equal(await page.locator('.pause').count(), 0, 'the key that closed the page did not reopen the sheet');
  assert.equal(await page.evaluate(() => neo.paused), false);
  assert.equal(await page.evaluate(() => kit.store.data.settings.sessionMinutes), 0, 'no play timer');

  // On the map, which can pause, the Esc that closes the page must not also open the sheet.
  await holdOn(gear, 2400);
  await page.locator('.parent').waitFor();
  // Leaving the map removes a sheet in the same keypress, so only watching for it being added can tell.
  await page.evaluate(() => {
    window.pauseSheetAdded = false;
    new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach((n) => n.classList?.contains('pause') && (window.pauseSheetAdded = true)))).observe(document.body, { childList: true });
  });
  await page.keyboard.press('Escape'); await scene('MapScene');
  assert.equal(await page.evaluate(() => window.pauseSheetAdded), false, 'Esc on the page, from the map, never opens the sheet');
  assert.equal(await page.evaluate(() => neo.paused), false);

  // A reset can be undone, even after the app is closed and reopened.
  const base = await page.evaluate(() => kit.store.data.stickers.length);
  await page.evaluate(() => { kit.store.data.stickers.push({ game: 'bubble-pop', seed: 1, at: 1 }, { game: 'duck-pond', seed: 2, at: 2 }); kit.store.save(); kit.store.flush(); });
  await holdOn(gear, 2400);
  await page.locator('.parent').waitFor();
  page.once('dialog', (d) => d.accept());
  await page.locator('[data-reset]').click();
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), 0);
  await page.locator('[data-undo]').waitFor();
  await page.waitForTimeout(700);
  await page.reload(); await ready();
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), 0, 'the reset was saved');
  assert.notEqual(await page.evaluate(() => kit.store.undoAt), null, 'the snapshot survived the reload');
  await gear.waitFor();
  await holdOn(gear, 2400);
  await page.locator('.parent').waitFor();
  await page.locator('[data-undo]').click();
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), base + 2, 'undo brought the stickers back');
  await screenshot('parent-undo');
  await page.locator('[data-done]').click(); await scene('ChooserScene');

  // A finger, not only a mouse: the same hold with real touch events, on the map (once a child is playing, the iPad's only way in).
  const touchContext = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true });
  try {
    const finger = await touchContext.newPage();
    finger.on('pageerror', (error) => errors.push(error.message));
    await finger.goto(islandUrl(process.env.GAME_URL || 'http://127.0.0.1:5173'));
    await finger.waitForFunction(() => window.neo?.scene && !neo.switching && window.kit);
    await finger.evaluate(() => { kit.store.data.creatures = { owned: [{ id: 'pip0', species: 'sprout', name: 'Clover', look: { color: 'pink' }, metAt: 'start' }], companion: 'pip0' }; kit.store.data.settings.howToCards = false; neo.go.hub(); });
    await finger.waitForFunction(() => neo.scene.constructor.name === 'MapScene' && !neo.switching);
    await finger.waitForTimeout(500);
    const cdp = await touchContext.newCDPSession(finger);
    const box = await finger.locator('.gear').boundingBox();
    const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const touch = async (ms) => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [at] });
      await finger.waitForTimeout(ms);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    await touch(300);
    assert.equal(await finger.locator('.parent').count(), 0, 'a short touch opens nothing');
    assert.ok(await finger.locator('.gear').evaluate((el) => el.classList.contains('gear--hint')), 'a short touch shows the hint');
    await touch(2400);
    await finger.locator('.parent').waitFor({ timeout: 3000 });
  } finally {
    await touchContext.close();
  }
  assert.deepEqual(errors, []);
  log("The grown-ups' gear (tap, mouse hold, Enter hold, touch tap and hold), Esc and the pause sheet, no play timer, and undoing a reset after a reload passed");
}

return { grownUps };
}
