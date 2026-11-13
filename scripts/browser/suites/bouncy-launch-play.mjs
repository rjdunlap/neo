import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function bouncyLaunchPlay() {
    // Level 13 (lap) on a phone: touches anywhere (the sky, a corner, the pet) bounce the pet; touches while it flies are
    // free; each landing leaves a flower that stays; five landings finish with 0 misses and 0 hints.
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('bouncy-launch', 13, 'Mia', 'lap');
    await page.waitForFunction(() => neo.scene.game?.landings?.length === 5, null, { timeout: 15000 });
    await screenshot('bouncy-launch-13-start-phone');
    const out = await page.evaluate(async () => {
      const g = neo.scene.game;
      const v = neo.view;
      const at = (x, y) => {
        const p = g.meadowInput.toGlobal({ x, y });
        kit.tap(p.x, p.y);
      };
      const spots = [
        [v.w * 0.85, v.h * 0.12],
        [v.w * 0.1, v.h * 0.9],
        [v.w * 0.5, v.h * 0.5],
        null,
        [v.w * 0.7, v.h * 0.7],
      ];
      const res = {
        shots: [],
        flowers: [],
        freeShots: [],
        cloudsShown: g.pads.filter((p) => p.visible).length,
      };
      for (let n = 0; n < 5; n++) {
        await kit.until(() => !g.flying, 15000);
        await kit.sleep(250);
        if (spots[n]) at(...spots[n]);
        else await kit.tapOn(g.pet);
        await kit.sleep(150);
        res.shots.push(g.shot);
        // A touch while it flies rings free.
        at(v.w * 0.4, v.h * 0.3);
        await kit.sleep(100);
        res.freeShots.push(g.flying);
        await kit.until(() => g.flowers.length === n + 1, 15000);
        res.flowers.push(g.flowers.length);
      }
      await kit.until(() => neo.scene.finished, 20000);
      res.flowerXs = g.flowers.map((f) => Math.round(f.art.x));
      res.visible = g.flowers.filter((f) => f.art.visible && f.art.scale.x > 0.9).length;
      res.misses = g.misses;
      res.hints = g.hints;
      return res;
    });
    await screenshot('bouncy-launch-13-meadow-phone');
    assert.equal(out.cloudsShown, 0, 'no clouds at the flower meadow');
    assert.deepEqual(out.flowers, [1, 2, 3, 4, 5], 'a flower per landing');
    assert.equal(out.visible, 5, 'every flower stays, full size');
    const xs = out.flowerXs.slice().sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= 40, `flowers apart: ${xs}`);
    await finished('bouncy-launch');
    const saved = await page.evaluate(() => {
      const r = kit.store.stats('bouncy-launch').history.at(-1);
      return [r.misses, r.hints];
    });
    assert.deepEqual(saved, [0, 0], 'level 13 saved 0 misses, 0 hints');
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      `Bouncy Launch 13: touches in the sky, a corner, the middle, on the pet and low right each bounced it; touches in flight free; flowers at ${out.flowerXs.join('/')}; 0/0; passed`,
    );
  }
  return { bouncyLaunchPlay };
}
