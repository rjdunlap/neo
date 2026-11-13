import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished }) {
  /** Sand Table: level 1 (pour, scoop, flag); level 3 in portrait (spill into the pail and back, an empty-bucket pour, a requested hint, Show); level 4 in portrait (breeze, one wrong pad, one hint, the right pad). */
  async function sandTablePlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('sand-table').history.at(-1);
        return [r.misses, r.hints];
      });
    const st = () =>
      page.evaluate(() => {
        const s = neo.scene.game.state;
        return { bucket: s.bucket, pail: s.pail, sum: s.h.reduce((a, b) => a + b, 0), flag: s.flag };
      });
    const tap = async (name, i = 0) => {
      await page.evaluate(
        ([name, i]) => kit.tapOn(neo.scene.game[name][i] ?? neo.scene.game[name]),
        [name, i],
      );
      await page.waitForTimeout(450);
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('sand-table', 1, 'Mia', 'toddler');
    await page.waitForTimeout(800);
    assert.equal((await st()).flag, false);
    await tap('bayNodes', 0);
    let a = await st();
    assert.equal(a.bucket, 33);
    assert.equal(a.flag, true);
    await tap('paddleNodes', 0);
    a = await st();
    assert.equal(a.bucket, 36);
    await tap('flagNode');
    await finished('sand-table');
    assert.deepEqual(await score(), [0, 0]);
    // Level 1 at lap: no scoop paddle, a touch on the sky, the bucket or the frame pours onto the one heap, and the round
    // finishes after eight pours without the flag.
    // The shell's grown-up tip sits over the bucket (top centre) for its first nine seconds, and a touch there closes it.
    await page.evaluate(() => {
      kit.store.data.settings.coplayHints = false;
    });
    await launch('sand-table', 1, 'Mia', 'lap');
    await page.waitForTimeout(800);
    const lap = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          pours: g.state.pours,
          bucket: g.state.bucket,
          paddle: g.paddleNodes[0].visible,
          flag: g.flagNode.visible,
        };
      });
    a = await lap();
    assert.equal(a.paddle, false, 'no scoop at lap');
    // mid-height at the sides (the sky beside the tray, the frame), then the bucket and the sand
    const spots = [
      [0.04, 0.5],
      [0.96, 0.5],
      [0.04, 0.3],
    ];
    for (let i = 0; i < 8; i++) {
      if (i < 3) await page.evaluate(([x, y]) => kit.tap(innerWidth * x, innerHeight * y), spots[i]);
      else if (i % 2) await page.evaluate(() => kit.tapOn(neo.scene.game.bucket));
      else await page.evaluate(() => kit.tapOn(neo.scene.game.bayNodes[0]));
      await page.waitForTimeout(450);
      a = await lap();
      assert.equal(a.pours, i + 1, `touch ${i + 1} poured`);
      assert.ok(a.bucket > 0, 'the bucket never runs dry');
      assert.equal(a.flag, false, 'no flag at lap');
    }
    await screenshot('sand-table-1-lap');
    await finished('sand-table');
    assert.deepEqual(await score(), [0, 0]);
    await launch('sand-table', 3);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    for (let k = 0; k < 40 && (await st()).pail === 0; k++) await tap('bayNodes', 0);
    assert.ok((await st()).pail > 0, 'a spill reached the pail');
    await screenshot('sand-table-3-portrait');
    await tap('pailNode');
    assert.equal((await st()).pail, 0);
    await page.evaluate(() => {
      neo.scene.game.state.bucket = 0;
      neo.scene.game.state.h.fill(0);
      neo.scene.game.state.pail = 0;
      neo.scene.game.state.h[0] = 0;
    });
    const before = await st();
    await tap('bayNodes', 1);
    assert.equal((await st()).sum, before.sum, 'an empty-bucket pour moves nothing');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(500);
    await tap('flagNode');
    await finished('sand-table');
    assert.deepEqual(await score(), [0, 0]);
    // Level 4 (school) in portrait: Breeze, one wrong pad, the dotted-path hint, the right pad; saved 1 miss, 1 hint.
    await launch('sand-table', 4);
    await page.waitForTimeout(600);
    const four = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        const s = g.state;
        return {
          puffed: !!s.puff,
          playing: g.playing,
          pads: g.padNodes.map((p) => p.visible),
          wind: s.wind,
          before: s.puff?.before,
          after: s.puff?.after,
          bays: s.plan.bays,
          quiz: { ...s.quiz },
        };
      });
    assert.equal((await four()).puffed, false);
    await tap('bayNodes', 1);
    assert.equal((await four()).puffed, false, 'a tray tap before the puff does not blow or pour');
    await tap('breezeNode');
    await page.waitForFunction(() => !neo.scene.game.playing && neo.scene.game.padNodes[0].visible, null, {
      timeout: 8000,
    });
    let f = await four();
    const sums = (h) => f.bays.map(([a, b]) => h.slice(a, b + 1).reduce((x, y) => x + y, 0));
    const gained = sums(f.after).map((v, i) => v - sums(f.before)[i]);
    const right = gained.findIndex((d) => d > 0);
    const wrong = gained.findIndex((d) => d <= 0);
    await screenshot('sand-table-4-portrait');
    await tap('padNodes', wrong);
    assert.deepEqual((await four()).quiz.misses, 1);
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForFunction(() => !neo.scene.game.playing, null, { timeout: 8000 });
    assert.equal((await four()).quiz.hints, 1);
    await tap('padNodes', right);
    await finished('sand-table');
    assert.deepEqual(await score(), [1, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Sand Table 1, 3 and 4: pour, scoop, flag, spill and pail, empty bucket, requested hint, Show, portrait; level 4 breeze, wrong pad, path hint, right pad, saved 1/1 passed',
    );
  }

  return { sandTablePlay };
}
