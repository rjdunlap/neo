import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
  /** Adventure Walk: level 1 (three free choices); level 3 in portrait (one wrong way, a replay, a requested hint, then the calls); level 4 in portrait (the walk out, then the way home on the hook map); level 5 in portrait (which trail, there and back). */
  async function adventureWalkPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('adventure-walk').history.at(-1);
        return [r.misses, r.hints];
      });
    const st = () =>
      page.evaluate(() => {
        const s = neo.scene.game.state;
        return { stop: s.stop, misses: s.misses, hints: s.hints, glow: s.glow };
      });
    const idle = async () => {
      await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 8000 });
      await page.waitForTimeout(150);
    };
    const slot = (i) => page.evaluate((i) => kit.tapOn(neo.scene.game.zoneNodes[i]), i);
    const asked = () =>
      page.evaluate(() => {
        const g = neo.scene.game,
          s = g.state.route.stops[g.state.stop];
        return s.asked === s.first ? 0 : 1;
      });
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('adventure-walk', 1);
    await page.waitForTimeout(800);
    for (let i = 0; i < 3; i++) {
      await slot(i % 2);
      await page.waitForTimeout(2600);
    }
    await finished('adventure-walk');
    assert.deepEqual(await score(), [0, 0]);
    await launch('adventure-walk', 3);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await screenshot('adventure-walk-3-portrait');
    await page.evaluate(() => kit.tapOn(neo.scene.game.badgeNode));
    await page.waitForTimeout(300);
    await slot(1 - (await asked()));
    await page.waitForTimeout(1200);
    let a = await st();
    assert.equal(a.misses, 1);
    assert.equal(a.stop, 0);
    await page.evaluate(() => neo.scene.game.askForHint());
    a = await st();
    assert.equal(a.hints, 1);
    assert.equal(a.glow, true);
    await slot(await asked());
    await page.waitForTimeout(2600);
    for (let i = 0; i < 2; i++) {
      await slot(await asked());
      await page.waitForTimeout(2600);
    }
    await finished('adventure-walk');
    assert.deepEqual(await score(), [1, 1]);
    // Level 4 in portrait on the hook map: a free walk out, then a wrong tile, a requested hint, a passed tile, home.
    await launch('adventure-walk', 4);
    await page.waitForTimeout(500);
    const home = () =>
      page.evaluate(() => {
        const s = neo.scene.game.state;
        return { home: s.home, misses: s.misses, hints: s.hints, glow: s.homeGlow, taken: s.taken };
      });
    const tile = (i) => page.evaluate((i) => kit.tapOn(neo.scene.game.tileNodes[i]), i);
    await page.evaluate(() => {
      neo.scene.game.state.shape = 'hook';
      // On the walk out Show a hint does nothing (it used to throw where nobody calls the way).
      neo.scene.game.askForHint();
    });
    for (let i = 0; i < 3; i++) {
      await slot(i % 2);
      await page.waitForTimeout(2600);
    }
    await page.waitForFunction(() => neo.scene.game.tileNodes.length === 3 && !neo.scene.game.busy, null, {
      timeout: 15000,
    });
    await page.waitForTimeout(300);
    a = await home();
    assert.deepEqual([a.home, a.misses, a.hints], [0, 0, 0]);
    assert.ok(a.taken.every((t) => t === 0 || t === 1));
    await screenshot('adventure-walk-4-portrait-hook');
    await tile(0);
    await idle();
    a = await home();
    assert.deepEqual([a.home, a.misses], [0, 1]);
    await page.evaluate(() => neo.scene.game.askForHint());
    a = await home();
    assert.deepEqual([a.hints, a.glow], [1, true]);
    await tile(2);
    await idle();
    await tile(2);
    await idle();
    a = await home();
    assert.deepEqual([a.home, a.misses, a.glow], [1, 1, false]);
    await tile(1);
    await idle();
    await tile(0);
    await finished('adventure-walk');
    assert.deepEqual(await score(), [1, 1]);
    // Level 5 in portrait: a look, a wrong trail there (turned back, its reason free), a replay, the called trail, then
    // the way home (the trail she came by only looks, a requested hint, the called trail).
    await launch('adventure-walk', 5);
    await page.waitForTimeout(800);
    const tr = () =>
      page.evaluate(() => {
        const s = neo.scene.game.state;
        return {
          pick: s.pick,
          misses: s.misses,
          hints: s.hints,
          looking: s.looking,
          turned: [...s.turned],
          calls: [...s.calls],
          glow: s.trailGlow,
        };
      });
    const flag = async (t) => {
      await page.evaluate((t) => kit.tapOn(neo.scene.game.flagNodes[t]), t);
      await page.waitForTimeout(250);
    };
    a = await tr();
    const [there, back] = a.calls;
    const wrong = [0, 1, 2].find((t) => t !== there);
    assert.equal(
      await page.evaluate(() => neo.scene.game.tileNodes.length + neo.scene.game.flagNodes.length),
      6,
    );
    await screenshot('adventure-walk-5-portrait');
    await flag(wrong);
    a = await tr();
    assert.deepEqual([a.looking, a.misses, a.pick], [wrong, 0, 0]);
    await flag(wrong);
    await idle();
    a = await tr();
    assert.deepEqual([a.misses, a.pick, a.turned[wrong] !== null], [1, 0, true]);
    await page.evaluate(() => kit.tapOn(neo.scene.game.badgeNode));
    await page.waitForTimeout(300);
    // A second tap on the turned-back trail repeats its reason and counts nothing.
    await flag(wrong);
    a = await tr();
    assert.deepEqual([a.misses, a.hints, a.pick], [1, 0, 0]);
    await flag(there);
    assert.equal((await tr()).looking, there);
    await flag(there);
    await page.waitForFunction(() => neo.scene.game.state.pick === 1 && !neo.scene.game.busy, null, {
      timeout: 25000,
    });
    await page.waitForTimeout(300);
    await flag(there);
    await flag(there);
    a = await tr();
    assert.deepEqual([a.misses, a.pick, a.looking], [1, 1, there]);
    await page.evaluate(() => neo.scene.game.askForHint());
    a = await tr();
    assert.deepEqual([a.hints, a.glow], [1, back]);
    await flag(back);
    await flag(back);
    await finished('adventure-walk');
    assert.deepEqual(await score(), [1, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Adventure Walk 1, 3, 4 and 5: free choices, wrong way, replay, requested hint, calls followed, portrait, the way home on the hook map (wrong tile, requested hint, passed tile), which trail (a look, a wrong trail turned back, its reason free, the called trail, the way she came, a requested hint, a different way home), saved scores passed',
    );
  }

  return { adventureWalkPlay };
}
