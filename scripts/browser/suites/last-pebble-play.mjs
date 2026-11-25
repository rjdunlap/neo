import assert from 'node:assert/strict';

export function createSuite({ page, ready, launch, finished, screenshot, log }) {
  const state = () => page.evaluate(() => neo.scene.game.state);
  const until = (fn, arg) => page.waitForFunction(fn, arg, { timeout: 40000 });
  const turn = async () => {
    await until(() => neo.scene.finished || neo.scene.game.state.phase === 'turn');
    await page.waitForTimeout(200);
  };
  const tapSpot = async (spotNum) => {
    const { x, y } = await page.evaluate((n) => {
      const node = neo.scene.game.spots[n - 1];
      const p = node.getGlobalPosition();
      return { x: p.x, y: p.y };
    }, spotNum);
    await page.touchscreen.tap(x, y);
    await page.waitForTimeout(160);
  };
  const stickers = () =>
    page.evaluate(() => kit.store.data.stickers.filter((s) => s.game === 'last-pebble').length);
  const lastHistory = () =>
    page.evaluate(() => {
      const r = kit.store.stats('last-pebble').history.at(-1);
      return { misses: r.misses, hints: r.hints, level: r.level };
    });

  async function lastPebblePlay() {
    await ready();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
      kit.store.data.settings.showWords = true;
    });
    const before = await stickers();

    // Level 1 (school, upright phone): invalid tap is free, 2 wrong moves trigger show-me-why + glow, then finish 3 crossings.
    await launch('last-pebble', 1, 'Mia', 'school');
    await page.waitForFunction(() => neo.view.upright);
    await turn();
    let s = await state();
    assert.equal(s.level, 1);
    assert.equal(s.crossingsTotal, 3);
    assert.equal(s.bestSpot, s.target);

    // Tapping an already-laid spot counts nothing.
    await tapSpot(s.pos);
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.phase], [0, 0, 'turn']);

    // Crossing 1 wrong move (+1 instead of +2): show-me-why reply reaches T, then rewinds.
    const wrong1 = s.pos + 1;
    await tapSpot(wrong1);
    assert.equal((await state()).phase, 'replay');
    await turn();
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.glowSpot], [1, 0, null]);

    // Second wrong move on Crossing 1 lights the glow (1 hint).
    await tapSpot(wrong1);
    await turn();
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.glowSpot], [2, 1, s.target]);

    // Finish Crossing 1, 2, and 3 by playing bestSpot on each turn.
    for (let step = 0; step < 12; step++) {
      await turn();
      s = await state();
      if (s.finished) break;
      assert.ok(s.bestSpot !== null, 'level 1 should have a winning bestSpot after rewind');
      await tapSpot(s.bestSpot);
    }
    await finished('last-pebble');
    assert.equal(await stickers(), before + 1);
    assert.deepEqual(await lastHistory(), { misses: 2, hints: 1, level: 1 });

    // Level 2 (grownup, upright phone): play a losing move until pet wins -> rewind -> Show me rewind -> finish.
    await launch('last-pebble', 2, 'Mia', 'grownup');
    await page.waitForFunction(() => neo.view.upright);
    await turn();
    s = await state();
    assert.equal(s.level, 2);
    assert.equal(s.pos, 0);

    // Deliberately avoid bestSpot so the pet takes control and reaches T.
    for (let step = 0; step < 12; step++) {
      await turn();
      s = await state();
      if (s.misses > 0) break;
      const nonBest = s.pos + (s.bestSpot === s.pos + 1 ? 2 : 1);
      await tapSpot(Math.min(s.target, nonBest));
      // Wait for either rewind-completion (misses === 1) or next turn
      await until(() => neo.scene.game.state.misses > 0 || neo.scene.game.state.phase === 'turn');
    }
    await turn();
    s = await state();
    assert.equal(s.misses, 1);
    assert.equal(s.pos, 0, 'pet win rewinds back to the turning point at pos 0');

    // Now make one non-best move so we land in a losing position, then use Show me to rewind and glow.
    const badStart = s.bestSpot === 1 ? 2 : 1;
    await tapSpot(badStart);
    await turn();
    s = await state();
    assert.equal(s.bestSpot, null, 'after a bad move + pet reply, her position is losing');

    await page.evaluate(() => neo.scene.game.askForHint());
    await turn();
    s = await state();
    assert.equal(s.pos, 0, 'Show me in a losing position rewinds to turning point');
    assert.equal(s.hints, 1);
    assert.equal(s.glowSpot, s.bestSpot);

    // Second Show me tap plays the glowing stone, then take an upright portrait screenshot mid-crossing.
    await page.evaluate(() => neo.scene.game.askForHint());
    await turn();
    s = await state();
    assert.equal(s.hints, 1, 'second Show me tap plays the glowing spot with no extra hint');
    await screenshot('last-pebble-portrait');

    // Play out the rest of the crossing via bestSpot to finish and earn the 2nd sticker.
    for (let step = 0; step < 12; step++) {
      await turn();
      s = await state();
      if (s.finished) break;
      assert.ok(s.bestSpot !== null, 'optimal play preserves a winning bestSpot');
      await tapSpot(s.bestSpot);
    }
    await finished('last-pebble');
    assert.equal(await stickers(), before + 2);
    assert.deepEqual(await lastHistory(), { misses: 1, hints: 1, level: 2 });

    log(
      'Last Pebble: upright levels 1–2 (show-me-why rewinds, Show me rewind, portrait shot, 2 stickers) passed',
    );
  }

  return { lastPebblePlay };
}
