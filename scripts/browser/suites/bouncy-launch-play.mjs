import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function bouncyLaunchPlay() {
    if (process.env.LAUNCH_LEVEL === '10') return lineLevel();
    if (process.env.LAUNCH_LEVEL === 'notches') return notchLevels();
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
  async function notchLevels() {
    // Levels 1 and 3 on a phone held sideways: the five taps of level 1 visit five different clouds (the seeded bag) and
    // each ring a note; at level 3 five notch pegs sit on the spring, a pull to the star cloud's notch reaches it (so a
    // tick has sounded for each notch passed), the landing leaves a footprint and the round finishes 0/0.
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('bouncy-launch', 1, 'Mia', 'toddler');
    await page.waitForFunction(() => neo.scene.game?.bag?.length === 5, null, { timeout: 15000 });
    const one = await page.evaluate(async () => {
      const g = neo.scene.game;
      const bag = g.bag.slice();
      const landed = [];
      for (let n = 0; n < 5; n++) {
        await kit.until(() => !g.flying && g.shot === n, 15000);
        await kit.sleep(300);
        await kit.tapOn(g.pet);
        await kit.until(() => g.prints.length === n + 1, 15000);
        landed.push(g.prints[n]);
      }
      await kit.until(() => neo.scene.finished, 20000);
      return { bag, landed, misses: g.misses };
    });
    assert.deepEqual(
      one.bag.slice().sort(),
      [0, 1, 2, 3, 4],
      `bag visits five clouds: ${JSON.stringify(one)}`,
    );
    assert.deepEqual(
      one.landed.map((f) => Math.round(f * 5 - 0.5)),
      one.bag,
      'each tap lands on its cloud in the bag',
    );
    await finished('bouncy-launch');
    await launch('bouncy-launch', 3, 'Mia', 'preschool');
    await page.waitForFunction(() => neo.scene.game?.targets?.length === 3, null, { timeout: 15000 });
    await page.waitForTimeout(1500);
    await screenshot('bouncy-launch-3-notches-idle-phone');
    // Hold a pull past three notches (no finger needed) and look at the pegs.
    await page.evaluate(() => {
      const g = neo.scene.game;
      g.grab = { id: 99, from: { x: 0, y: 0 } };
      const r = 110;
      g.pull(g.seat.x - (0.35 / Math.hypot(0.35, 0.94)) * r, g.seat.y + (0.94 / Math.hypot(0.35, 0.94)) * r);
    });
    await page.waitForTimeout(300);
    await screenshot('bouncy-launch-3-notches-pulling-phone');
    await page.evaluate(() => {
      const g = neo.scene.game;
      g.grab = null;
      g.notchSeen = 0;
      g.returnToSeat();
    });
    await page.waitForTimeout(600);
    const three = await page.evaluate(async () => {
      const g = neo.scene.game;
      const res = { ticks: [], prints: [], notchesDrawn: 0 };
      for (let n = 0; n < 3; n++) {
        await kit.until(() => !g.flying && g.shot === n && !g.grab, 15000);
        await kit.sleep(400);
        const t = g.targets[n];
        const pull = 44 + 28 * t;
        const o = { x: g.seat.x + g.pet.touch.x * 0.5, y: g.seat.y + g.pet.touch.y * 0.5 };
        const d = { x: -0.35, y: 0.94 };
        const len = Math.hypot(d.x, d.y);
        const a = g.ctx.stage.toGlobal(o);
        const b = g.ctx.stage.toGlobal({ x: o.x + (d.x / len) * pull, y: o.y + (d.y / len) * pull });
        if (n === 0) res.notchesDrawn = Math.round(g.notches.getLocalBounds().height);
        const drag = kit.drag(kit.line([a.x, a.y], [b.x, b.y], 20));
        await kit.sleep(20 * 16 + 40);
        res.ticks.push(g.notchSeen);
        await drag;
        await kit.until(() => g.shot === n + 1, 15000);
        res.prints.push(g.prints.length);
        if (n === 0) res.shotReady = true;
      }
      await kit.until(() => neo.scene.finished, 20000);
      res.misses = g.misses;
      res.hints = g.hints;
      return res;
    });
    assert.deepEqual(three.prints, [1, 2, 3], `a footprint per landing: ${JSON.stringify(three)}`);
    assert.ok(
      three.ticks.every((n, i) => n >= 1),
      `a tick sounded for the notches passed: ${JSON.stringify(three)}`,
    );
    assert.ok(three.notchesDrawn !== 0, 'notch pegs drawn');
    assert.deepEqual([three.misses, three.hints], [0, 0], 'pulling to the notches landed every star');
    await finished('bouncy-launch');
    log(
      `Bouncy Launch 1 and 3: the five taps landed on five different clouds from the bag; at level 3 pulls to each notch ticked (${three.ticks.join('/')}), left a footprint each and finished 0/0; passed`,
    );
  }
  async function lineLevel() {
    // Level 10 (school) on a phone held sideways: a shown pull, a tap over the number line picks the nearest tick (far off,
    // high above the line, then right on it), the pull flies, the gap bar and line follow; three shots finish 0/0.
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('bouncy-launch', 10, 'Mia', 'school');
    await page.waitForFunction(() => neo.scene.game?.targets?.length === 3, null, { timeout: 15000 });
    const out = await page.evaluate(async () => {
      const g = neo.scene.game;
      const res = { targets: g.targets.slice(), picks: [], gaps: [], ticksShown: 0, clouds: g.pads.length };
      // Far off, high above the line, then on the right number.
      const pickFor = (t, n) => (n === 0 ? (t < 5 ? 9 : 0) : t);
      for (let n = 0; n < 3; n++) {
        await kit.until(() => !g.flying && g.prediction === undefined && g.shot === n, 15000);
        await kit.sleep(300);
        const t = g.targets[n];
        const want = pickFor(t, n);
        const sx = g.strip.x0 + ((want + 0.5) / 10) * (g.strip.x1 - g.strip.x0) + (n === 1 ? 20 : 0);
        const sy = n === 1 ? g.strip.y - 180 : g.strip.y + 70;
        const p = g.lineInput.toGlobal({ x: sx, y: sy });
        kit.tap(p.x, p.y);
        await kit.until(() => g.prediction !== undefined, 3000);
        res.picks.push(g.prediction);
        res.ticksShown = g.lineNumbers.children.length;
        await kit.until(() => g.shot === n + 1, 15000);
        res.gaps.push(g.lineGap ? [g.lineGap.said, g.lineGap.landed] : null);
      }
      await kit.until(() => neo.scene.finished, 20000);
      res.misses = g.misses;
      res.hints = g.hints;
      return res;
    });
    await screenshot('bouncy-launch-10-line-phone');
    const want = out.targets.map((t, n) => (n === 0 ? (t < 5 ? 9 : 0) : t));
    assert.deepEqual(out.picks, want, `taps route to the nearest tick: ${JSON.stringify(out)}`);
    assert.deepEqual(
      out.gaps,
      out.targets.map((t, n) => [want[n], t]),
      'each shot marks the pick and the landing',
    );
    assert.equal(out.ticksShown, 10, 'ten numbers on the line');
    assert.equal(out.clouds, 0, 'no clouds at level 10');
    assert.deepEqual([out.misses, out.hints], [0, 0], 'a far-off estimate is not a miss');
    await finished('bouncy-launch');
    const saved = await page.evaluate(() => {
      const r = kit.store.stats('bouncy-launch').history.at(-1);
      return [r.level, r.misses, r.hints];
    });
    assert.deepEqual(saved, [10, 0, 0], 'level 10 saved 0 misses, 0 hints');
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      `Bouncy Launch 10: targets ${out.targets.map((t) => t + 1).join('/')}, picks ${out.picks.map((t) => t + 1).join('/')} (far off, above the line, exact); gap bars marked; 0/0; passed`,
    );
  }
  return { bouncyLaunchPlay };
}
