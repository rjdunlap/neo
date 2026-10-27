import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot }) {
/**
 * The couch Settings page: reached with a controller alone, "choose for me" following what is connected,
 * key caps and a keyboard diagram on a laptop and controller pictures on a TV, text size and volume applied at once
 * and kept through a reload, the pause menu's sound row, and the child's own volume given back on leaving.
 */
async function couchSettings() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const childVolume = await page.evaluate(() => kit.store.data.settings.volume);
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const makePads = () => page.evaluate(() => { window.couchPads = [{ index: 0, id: 'Synthetic standard 0', connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }]; });
  const press = async button => {
    await page.evaluate(button => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button); await page.waitForTimeout(120);
    await page.evaluate(button => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button); await page.waitForTimeout(120);
  };
  const unit = () => page.evaluate(() => getComputedStyle(document.querySelector('.couch')).getPropertyValue('--u').trim());
  const pad = () => page.evaluate(() => document.querySelector('svg.pad')?.getAttribute('aria-label'));
  const volume = () => page.evaluate(async () => (await import('/src/audio/engine.ts')).audio.getVolume());
  const hint = () => page.locator('.couch-keys').first().innerText();

  // A laptop-sized window with no controller: "choose for me" is the laptop.
  await enter();
  assert.match(await hint(), /arrow keys to choose · Enter to select/);
  await page.getByRole('button', { name: 'Settings', exact: true }).click(); await screenIs('settings');
  assert.equal(await page.locator('[data-key="place-auto"]').getAttribute('aria-pressed'), 'true', 'choose for me is the default');
  assert.match(await page.locator('.couch-setting-note').first().innerText(), /Right now: Laptop with keyboard, because no controller is connected/);
  assert.equal(await page.locator('.couch-names input').count(), 2, 'names are on this page now');
  await screenshot('couch-settings-laptop');

  // The how-to names keys and draws a keyboard.
  await page.getByRole('button', { name: 'Back to couch play', exact: true }).click(); await screenIs('menu');
  await page.getByRole('button', { name: 'How to play', exact: true }).click(); await screenIs('guide');
  await page.locator('[data-game="penguin-slide"]').click(); await screenIs('intro');
  assert.equal(await pad(), 'Keyboard diagram');
  assert.ok(await page.locator('.couch-rows kbd').count() >= 3, 'key caps name the controls');
  await screenshot('couch-howto-keyboard');
  await page.getByRole('button', { name: 'Back', exact: true }).first().click(); await screenIs('guide');
  await page.getByRole('button', { name: 'Back', exact: true }).click(); await screenIs('menu');

  // Connecting a controller flips the prompts at once, with nothing rebuilt; a firm choice ignores it.
  await makePads();
  await page.waitForFunction(() => /bottom button to select/.test(document.querySelector('.couch-keys').innerText));
  // Settings is reached with the d-pad alone, then confirm.
  for (let i = 0; i < 20 && await page.evaluate(() => document.activeElement?.textContent !== 'Settings'); i++) await press(13);
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Settings', 'a controller can reach Settings');
  await press(0); await screenIs('settings');
  assert.match(await page.locator('.couch-setting-note').first().innerText(), /Right now: TV with a controller, because a controller is connected/);

  // Text size: Large makes every couch length 1.2 times as big, on a controller alone, and survives a reload.
  assert.equal(await unit(), '1');
  for (let i = 0; i < 20 && await page.evaluate(() => document.activeElement?.dataset.key !== 'text-large'); i++) await press(13);
  await press(0); await page.waitForTimeout(450);
  assert.equal(await unit(), '1.2');
  assert.equal((await stored()).settings.text, 'large');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.key), 'text-large', 'focus stays where it was after a change');
  // Sound: two steps quieter, music off; the audio engine follows.
  await page.getByRole('button', { name: 'Quieter', exact: true }).click(); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Quieter', exact: true }).click(); await page.waitForTimeout(450);
  await page.getByRole('button', { name: /^Music: on/ }).click(); await page.waitForTimeout(450);
  assert.deepEqual((await stored()).settings, { place: 'auto', volume: 2, music: false, text: 'large', players: 'two' });
  assert.equal(await page.locator('.couch-meter i.on').count(), 2);
  assert.ok(Math.abs(await volume() - 0.4) < 0.01, 'the couch volume is in force');
  // A firm choice: Laptop keeps keys on screen even with a controller connected.
  await page.getByRole('button', { name: 'Laptop with keyboard', exact: true }).click(); await page.waitForTimeout(450);
  assert.match(await page.locator('.couch-setting-note').first().innerText(), /^Right now: Laptop with keyboard\./);
  await screenshot('couch-settings-large');

  // Kept through a reload, applied to the next screens.
  await page.reload(); await ready(); await makePads(); await enter();
  assert.equal(await unit(), '1.2');
  assert.match(await hint(), /arrow keys to choose/);
  assert.ok(Math.abs(await volume() - 0.4) < 0.01);
  // The pause menu has sound and text on it. Start a course run, pause, change both.
  await page.getByRole('button', { name: 'Challenges', exact: true }).click(); await screenIs('courses');
  await page.locator('[data-course="practice"]').click(); await screenIs('course');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('neo.couch.v1')); s.seen = ['penguin-slide']; localStorage.setItem('neo.couch.v1', JSON.stringify(s)); });
  await page.getByRole('button', { name: /plays$/ }).first().click();
  await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(600);
  assert.ok(await page.locator('.couch-game-help kbd').count() >= 1, 'the in-round help names keys on a laptop');
  await page.keyboard.press('Escape', { delay: 120 }); await screenIs('pause');
  await page.getByRole('button', { name: 'Louder', exact: true }).click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: /^Text: Large/ }).click(); await page.waitForTimeout(200);
  assert.equal(await page.getByRole('button', { name: /^Text:/ }).innerText(), 'Text: Extra large');
  assert.equal(await unit(), '1.4');
  const kept = (await stored()).settings;
  assert.equal(kept.volume, 3); assert.equal(kept.text, 'xlarge');
  await screenshot('couch-pause-sound');

  // Leaving gives the child's own volume back, and the child's save was never written.
  await page.getByRole('button', { name: 'Save and return to start', exact: true }).click(); await scene('ChooserScene');
  await page.waitForTimeout(300);
  assert.ok(Math.abs(await volume() - childVolume) < 0.01, 'the island has its own volume again');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child save is untouched');
  // An old couch save with no settings opens with the defaults.
  await page.evaluate(() => localStorage.setItem('neo.couch.v1', JSON.stringify({ version: 3, trips: 1, stickers: {}, seen: [], keepsake: { at: 1 }, party: null, courses: {}, names: ['', ''] })));
  await page.reload(); await ready(); await enter();
  assert.equal(await unit(), '1');
  await page.getByRole('button', { name: 'Settings', exact: true }).click(); await screenIs('settings');
  assert.equal(await page.locator('[data-key="text-normal"]').getAttribute('aria-pressed'), 'true');
  // The backup carries the settings, byte for byte, and restoring applies them.
  await page.getByRole('button', { name: 'Large', exact: true }).click(); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Couch backup', exact: true }).click(); await screenIs('backup');
  const saved = await page.evaluate(() => localStorage.getItem('neo.couch.v1'));
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download couch backup', exact: true }).click();
  await (await download).saveAs('test-results/couch-settings-backup.json');
  await page.getByRole('button', { name: 'Back to Settings', exact: true }).click(); await screenIs('settings');
  await page.getByRole('button', { name: 'Extra large', exact: true }).click(); await page.waitForTimeout(450);
  assert.equal(await unit(), '1.4');
  await page.getByRole('button', { name: 'Couch backup', exact: true }).click(); await screenIs('backup');
  await page.locator('input[type=file]').setInputFiles('test-results/couch-settings-backup.json'); await screenIs('menu');
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), saved, 'backup round trip');
  assert.equal(await unit(), '1.2', 'restoring a backup applies its text size');
  await page.getByRole('button', { name: 'Settings', exact: true }).click(); await screenIs('settings');
  assert.equal(await page.evaluate(() => document.querySelector('.couch').scrollWidth > window.innerWidth), false);
  await page.setViewportSize({ width: 820, height: 1180 }); await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => document.querySelector('.couch').scrollWidth > window.innerWidth), false, 'portrait: nothing runs off the side');
  await screenshot('couch-settings-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Couch settings: Settings reached and changed with a controller alone, prompts follow what is connected (key caps and a keyboard on a laptop, controller pictures on a TV), text size and volume applied at once and kept through a reload, the pause menu row, the island\'s volume given back, old saves open with defaults passed');
}

return { couchSettings };
}
