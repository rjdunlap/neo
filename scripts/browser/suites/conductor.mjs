import assert from 'node:assert/strict';

export function createSuite({ page, log, ready, scene, tap, screenshot, launch, finished, conductorSign }) {
/**
 * Little Conductor levels 1–2: an early Done, a change inside a beat, the heard gate, the bow and one sticker; level 2 in portrait.
 * Level 3 (portrait): Check with no pick, a wrong Check, a requested hint, both halves matched. `CONDUCTOR_LEVELS=3` picks levels.
 */
async function conductor() {
  for (const level of (process.env.CONDUCTOR_LEVELS || '1,2,3').split(',').map(Number)) {
    if (level >= 2) await page.setViewportSize({ width: 768, height: 1024 });
    if (level === 3) { await conductorSign(); continue; }
    await launch('little-conductor', level);
    await page.waitForFunction(() => neo.scene.game.ready, null, { timeout: 20000 });
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    const state = () => page.evaluate(() => { const g = neo.scene.game; return { pace: g.score.pace, pending: g.score.pending, heard: g.score.heard, ever: g.score.heardEver, performing: g.performing, alpha: g.done.alpha, blink: g.blink }; });
    const heardAt = (pace, n) => page.waitForFunction(({ pace, n }) => { const s = neo.scene.game.score; return s.pace === pace && !s.pending && s.heard[pace] >= n; }, { pace, n }, { timeout: 15000 });
    // Done before any tap: nothing happens but a reminder.
    await tap('neo.scene.game.done');
    assert.equal((await state()).performing, false);
    await tap('neo.scene.game.pads.rabbit');
    await heardAt('rabbit', 2);
    // A change inside a beat waits for the next one and closes the gate at once.
    await tap('neo.scene.game.pads.turtle');
    let s = await state();
    assert.equal(s.pending, 'turtle'); assert.equal(s.pace, 'rabbit'); assert.ok(s.alpha < 1);
    await heardAt('turtle', 1);
    // An early Done: the unheard marks blink, nothing is counted and the band plays on.
    await tap('neo.scene.game.done');
    s = await state();
    assert.equal(s.performing, false); assert.ok(s.blink > 0);
    await heardAt('turtle', 4);
    if (level === 2) {
      assert.ok((await state()).alpha < 1, 'level 2 waits for the other way too');
      await tap('neo.scene.game.pads.rabbit');
      await heardAt('rabbit', 4);
      s = await state();
      assert.deepEqual(s.ever, { turtle: true, rabbit: true });
      await screenshot('little-conductor-2-portrait');
    }
    assert.equal((await state()).alpha, 1);
    await tap('neo.scene.game.done');
    assert.equal((await state()).performing, true);
    await finished('little-conductor');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('little-conductor').history.at(-1); return [r.level, r.misses, r.hints, kit.store.data.stickers.length]; }), [level, 0, 0, before + 1]);
    log(`Little Conductor ${level}: early Done, a change inside a beat, the heard gate, the bow and one sticker passed`);
  }
  await page.setViewportSize({ width: 1024, height: 768 });
}

return { conductor };
}
