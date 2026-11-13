import assert from 'node:assert/strict';

export function createSuite({ page, log, launch, finished, screenshot }) {
  async function seesawEntry() {
    for (const band of ['lap', 'toddler']) {
      await launch('seesaw-balance', 12, 'Mia', band);
      if (band === 'lap') {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(450);
        await screenshot('seesaw-12-phone-portrait');
      }
      const result = await page.evaluate(async () => {
        const g = neo.scene.game;
        const { other } = await import('/src/games/seesaw-balance/logic.ts');
        await kit.until(() => !g.busy, 10000);
        // Touch points down each half: the middle, just below the shell's top banner, and near the bottom of the view.
        const heights = [0.5, 0.22, 0.92, 0.5];
        const touch = (side, at = 0.5) => {
          const target = g.bounceTargets[side];
          const p = target.toGlobal({ x: neo.view.w / 4, y: neo.view.h * at });
          kit.tap(p.x, p.y);
        };
        const size = g.bounceTargets.left.hitArea;
        if (size.width < neo.view.w / 2 || size.height < neo.view.h || g.bounceTargets.left.y !== 0)
          throw new Error('Bounce targets do not cover the whole view');
        // The first rider is a duck; rider-half pokes never consume the round or adaptation.
        if (g.round.fixed[0].face !== 'duck') throw new Error('Missing first duck');
        touch(g.round.fixedSide);
        await kit.sleep(250);
        if (g.index !== 0 || g.misses || g.hints || g.items.some((i) => !i.fixed && i.side))
          throw new Error('Rider poke scored');
        const opens = [];
        for (let r = 0; r < 4; r++) {
          const start = performance.now();
          await kit.until(() => !g.busy, 10000);
          opens.push(performance.now() - start);
          if (g.index !== r) throw new Error('Wrong bounce index');
          const side = other(g.round.fixedSide);
          touch(side, heights[r]);
          // Touch-down feedback is immediate, before animation or speech.
          if (!g.busy || !g.items.some((i) => !i.fixed && i.side === side)) {
            const p = g.bounceTargets[side].toGlobal({ x: neo.view.w / 4, y: neo.view.h * heights[r] });
            const hit = g.ctx.renderer.events.rootBoundary.hitTest(p.x, p.y);
            throw new Error(
              `Empty-half touch did not lift in round ${r} at ${heights[r]} (${Math.round(p.x)},${Math.round(p.y)}, view ${neo.view.w}x${neo.view.h}): busy ${g.busy}, owner ${Object.keys(
                neo.scene,
              )
                .filter((k) => {
                  const o = neo.scene[k];
                  for (let n = hit; n; n = n.parent) if (n === o) return true;
                  return false;
                })
                .join('/')}`,
            );
          }
          await kit.until(() => g.index > r || g.finished, 12000);
        }
        // Rounds 2-4 open within the 0.4 s pop-in, well before the instruction's muted pacing (over 2 s) ends.
        if (opens.slice(1).some((ms) => ms > 1200)) throw new Error(`Input waited for the line: ${opens}`);
        return [g.misses, g.hints, g.observations.has('heavy-down')];
      });
      assert.deepEqual(result, [0, 0, true]);
      await finished('seesaw-balance');
      assert.deepEqual(
        await page.evaluate(() => {
          const h = kit.store.stats('seesaw-balance').history.at(-1);
          return [h.misses, h.hints];
        }),
        [0, 0],
      );
      await page.setViewportSize({ width: 1024, height: 768 });
    }
    await launch('seesaw-balance', 13, 'Mia', 'preschool');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    const proof = await page.evaluate(async () => {
      const g = neo.scene.game;
      const touch = (item) => {
        const p = item.node.toGlobal({ x: 0, y: -item.height / 2 });
        kit.tap(p.x, p.y);
      };
      await kit.until(() => !g.busy, 10000);
      if (g.items.some((i) => i.drag)) throw new Error('Comparison should be taps only');
      const wrong = g.items.find((i) => i.thing.weight !== g.round.answer);
      for (let i = 0; i < 2; i++) {
        touch(wrong);
        await kit.until(() => !g.busy, 10000);
        await kit.sleep(450);
      }
      if (g.misses !== 2 || g.hints !== 1 || g.hintItem?.thing.weight !== g.round.answer)
        throw new Error('Comparison support counts wrong');
      return g.items.map((i) => ({
        diameter: i.node.hitArea.radius * 2,
        y: i.node.y - i.height,
        x: i.node.x,
      }));
    });
    for (const target of proof) {
      assert.ok(target.diameter >= 100);
      assert.ok(target.y > 100);
    }
    await screenshot('seesaw-13-help-portrait');
    const asked = await page.evaluate(async () => {
      const g = neo.scene.game,
        seen = [];
      for (let r = 0; r < 3; r++) {
        await kit.until(() => !g.busy, 10000);
        seen.push(g.round.asked);
        const item = g.items.find((i) => i.thing.weight === g.round.answer);
        const p = item.node.toGlobal({ x: 0, y: -item.height / 2 });
        kit.tap(p.x, p.y);
        await kit.until(() => g.index > r || g.finished, 12000);
      }
      return seen;
    });
    assert.deepEqual(asked, ['heavier', 'lighter', 'heavier']);
    await finished('seesaw-balance');
    assert.deepEqual(
      await page.evaluate(() => {
        const h = kit.store.stats('seesaw-balance').history.at(-1);
        return [h.misses, h.hints];
      }),
      [2, 1],
    );
    log(
      'Seesaw 12 lap/toddler: whole-view halves, four empty-half touches at top/middle/bottom while the line is spoken, free rider poke, saved 0/0; 13: heavier/lighter/heavier, two misses/one glow, supported finish saved 2/1; phone/tablet portrait targets >=100',
    );
    await page.setViewportSize({ width: 1024, height: 768 });
  }
  return { seesawEntry };
}
