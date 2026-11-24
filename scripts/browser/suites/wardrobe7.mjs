import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished, useCompanion }) {
  async function wardrobe7() {
    await page.setViewportSize({ width: 768, height: 1024 });
    if (process.env.WARDROBE_SPECIES) await useCompanion(process.env.WARDROBE_SPECIES);
    // Level 7 takes everything off; level 11 (Keep what still fits) keeps boots or a raincoat on.
    for (const level of [7, 11]) {
      await launch('weather-wardrobe', level);
      await page.waitForTimeout(700);
      await page.evaluate(async () => {
        const g = neo.scene.game;
        if (g.plan.mode !== 'change' || g.changePhase !== 'remove')
          throw new Error('Weather change did not start in the remove phase');
        await kit.until(() => g.worn.size > 0);
      });
      await screenshot(`weather-wardrobe-${level}`);
      await page.evaluate(async (level) => {
        const g = neo.scene.game;
        const trace = [];
        if (level === 11) {
          // Taking off a keeper is a miss that leaves it on; the second in a row is one hint.
          const keeper = g.outfit.keep[0];
          // Worn clothes overlap on a small pet, so aim at the keeper's lower middle until its own miss registers.
          const [node] = g.worn.get(keeper);
          const box = node.getBounds();
          const aims = [0.85, 0.7, 0.55, 0.4].map((f) => [box.x + box.width / 2, box.y + box.height * f]);
          for (let i = 0; i < 2; i++) {
            const before = g.misses;
            for (const [x, y] of aims) {
              kit.tap(x, y);
              await kit.sleep(300);
              if (g.misses > before) break;
            }
          }
          if (!g.worn.has(keeper) || g.misses !== 2 || g.hints !== 1)
            throw new Error(
              'Keeper accounting wrong ' +
                JSON.stringify({
                  keeper,
                  worn: [...g.worn.keys()],
                  m: g.misses,
                  h: g.hints,
                  w: g.wrong,
                  weathers: g.outfit.weathers,
                  rm: g.outfit.remove,
                }),
            );
        }
        for (let step = 0; g.changePhase === 'remove' && step < 6; step++) {
          const item = g.outfit.remove.find((i) => g.worn.has(i));
          if (!item) throw new Error('No removable clothing remains');
          const [node] = g.worn.get(item);
          const p = node.toGlobal(g.wornCenters.get(item));
          kit.tap(p.x, p.y);
          await kit.sleep(350);
        }
        if (g.changePhase !== 'add')
          throw new Error(
            'Taking off the old outfit did not reveal the new weather ' +
              JSON.stringify({
                level,
                phase: g.changePhase,
                worn: [...g.worn.keys()],
                remove: g.outfit.remove,
                busy: g.busy,
              }),
          );
        const wrong = g.options.find((o) => !g.outfit.needed.includes(o.item));
        for (let i = 0; i < (level === 11 ? 0 : 2); i++) {
          kit.tapOn(wrong.node);
          await kit.sleep(100);
          if (!g.busy) throw new Error('No misfit shown');
          await kit.until(() => !g.busy, 3000);
          await kit.sleep(50);
        }
        if (g.hints !== 1) throw new Error('Weather change hint missing');
        for (let step = 0; !g.done && step < 40; step++) {
          await kit.until(() => !g.busy || g.done, 15000);
          if (g.done) break;
          if (g.changePhase === 'remove') {
            const item = g.outfit.remove.find((i) => g.worn.has(i));
            const [node] = g.worn.get(item),
              p = node.toGlobal(g.wornCenters.get(item));
            kit.tap(p.x, p.y);
          } else {
            const option = g.options.find((o) => !o.used && g.outfit.needed.includes(o.item));
            if (!option) throw new Error('No remaining clothing choice');
            kit.tapOn(option.node);
          }
          await kit.sleep(450);
          trace.push({
            q: g.q,
            phase: g.changePhase,
            worn: [...g.worn.keys()],
            used: g.options.filter((o) => o.used).map((o) => o.item),
          });
        }
        if (!g.done)
          throw new Error(
            `Weather change rounds did not finish: ${JSON.stringify({ q: g.q, phase: g.changePhase, worn: [...g.worn.keys()], used: g.options.filter((o) => o.used).map((o) => o.item), needed: g.outfit.needed, trace: trace.slice(-8) })}`,
          );
      }, level);
      await finished('weather-wardrobe');
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('weather-wardrobe').history.at(-1);
          return [r.misses, r.hints];
        }),
        [2, 1],
      );
      log(
        `Weather Wardrobe ${level}: take off, dress for the changed weather, hint, saved round and sticker passed`,
      );
    }
    await page.setViewportSize({ width: 1024, height: 768 });
  }

  return { wardrobe7 };
}
