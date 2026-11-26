import assert from 'node:assert/strict';

/** RW11 slice 3: the lamp in creature play, with a sprout wearing the moon blossom, then one wearing the sun blossom. */
export async function homeLamp({ page, errors, log, ready, scene, pickFirst, tap, screenshot }) {
  await page.goto(new URL('/', process.env.GAME_URL || 'http://127.0.0.1:5173').href);
  await ready();
  await scene('ChooserScene');
  await page.evaluate(() => {
    kit.store.entry.startBand = 'prek';
    kit.store.data.profile = { name: 'Mia', band: 'prek' };
    kit.store.data.world.band = 'prek';
    kit.store.data.settings.speech = false;
    kit.store.data.settings.howToCards = false;
    kit.store.meet('sprout', 'Clover', 'pink', 'start');
    kit.growForm('sprout:moon', 'sprout:sun');
    kit.store.setForm(kit.store.data.creatures.owned[0].id, 'sprout:moon');
    neo.go.start();
  });
  await pickFirst();
  await scene('HomeScene');
  await tap('neo.scene.play');
  await scene('PlayScene');
  const state = () =>
    page.evaluate(() => ({
      evening: neo.scene.lamp.evening,
      dim: neo.scene.lamp.dim.alpha,
      glow: neo.scene.lamp.glow.alpha,
      last: neo.scene.lamp.last,
      walking: neo.scene.lamp.walking,
      bloom: neo.scene.pet.rig.constructor.name,
    }));
  assert.equal((await state()).evening, false, 'the room starts as day');
  await screenshot('lamp-day');
  await tap('neo.scene.lamp.node');
  await page.waitForFunction(() => neo.scene.lamp.last === 'glow', null, { timeout: 10000 });
  await page.waitForTimeout(1500);
  const evening = await state();
  assert.equal(evening.evening, true);
  assert.ok(evening.dim > 0.3, 'the room is dimmed');
  assert.ok(evening.glow > 0.5, 'the moon blossom lights the floor');
  await screenshot('lamp-evening-moon');
  await tap('neo.scene.lamp.node');
  await page.waitForFunction(() => neo.scene.lamp.evening === false && neo.scene.lamp.last === 'glow', null, {
    timeout: 10000,
  });
  await page.waitForTimeout(1500);
  const day = await state();
  assert.ok(day.dim < 0.05 && day.glow < 0.05, 'day again: no dimming, no glow');
  // The ball still works after the lamp: her friend goes back to chasing it.
  await tap('neo.scene.toy.ball');
  await page.waitForFunction(() => neo.scene.toy.fetches >= 1, null, { timeout: 15000 });
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), 0, 'the lamp awards nothing');
  assert.deepEqual(errors, [], 'no page errors');
  log('PASS: the lamp turns the room to evening and back; the moon blossom glows');
}
