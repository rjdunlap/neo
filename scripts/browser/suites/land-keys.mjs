import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene }) {
/** Lands stage C2: keys on the map and a land. Arrows show the ring first and then move it, Enter presses, a held Enter does not carry into the next scene, Backspace leaves a land, and a tap still works with the ring showing. */
async function landKeys() {
  const key = async (k) => { await page.keyboard.press(k, { delay: 130 }); await page.waitForTimeout(120); };
  const state = () => page.evaluate(() => ({ ring: neo.scene.keys.ring.visible, id: neo.scene.keys.focus.id, name: neo.scene.constructor.name }));
  await page.evaluate(() => { kit.store.data.profile.band = 'preschool'; neo.go.hub(); });
  await scene('MapScene'); await page.waitForTimeout(800);
  assert.equal((await state()).ring, false, 'a finger sees no ring');
  await key('ArrowRight');
  const first = await state();
  assert.equal(first.ring, true); // the first press only shows it
  await key('ArrowRight');
  assert.notEqual((await state()).id, first.id);
  await key('Backspace'); await page.waitForTimeout(400);
  assert.equal((await state()).name, 'MapScene', 'Backspace on the map does nothing');
  // Enter into a land, held (with auto-repeat) through the whole transition: the land must not read it as its own press.
  await page.evaluate(() => neo.scene.keys.focus.focusOn('barnyard'));
  await page.keyboard.down('Enter');
  for (let i = 0; i < 28; i++) { await page.waitForTimeout(100); await page.keyboard.down('Enter'); }
  await scene('LandScene');
  for (let i = 0; i < 10; i++) { await page.waitForTimeout(100); await page.keyboard.down('Enter'); }
  assert.equal(await page.evaluate(() => neo.scene.leaving), false, 'a held Enter does not leave the land');
  await page.keyboard.up('Enter'); await page.waitForTimeout(500);
  assert.equal((await state()).name, 'LandScene');
  await page.evaluate(() => neo.scene.keys.focus.focusOn('host'));
  await key('Enter');
  assert.ok(await page.evaluate(() => neo.scene.suggested), 'Enter on the host suggests a game');
  await page.waitForTimeout(1200);
  await page.evaluate(() => { neo.scene.suggested = null; kit.tapOn(neo.scene.host, 0, -60); }); await page.waitForTimeout(300);
  assert.ok(await page.evaluate(() => neo.scene.suggested), 'a tap works with the ring showing');
  assert.equal((await state()).ring, false, 'a touch hides the ring');
  await key('ArrowLeft'); await key('Backspace'); await scene('MapScene');
  await key('ArrowRight');
  await page.evaluate(() => kit.tapOn(neo.scene.lands[0].node)); await scene('LandScene');
  assert.deepEqual(errors, []);
  log('Land keys: the ring shows at the first key and moves at the next, Enter presses, a held Enter stays in the scene it began in, Backspace leaves a land and does nothing on the map, a tap works with the ring showing');
}

return { landKeys };
}
