import assert from 'node:assert/strict';

export function createSuite({ page, log, launch, finished, screenshot }) {
  async function wardrobe10() {
    // First existing level stays a complete experience.
    await launch('weather-wardrobe', 1);
    await page.waitForTimeout(700);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let i = 0; i < 6; i++) { kit.tap(500, 200); await kit.sleep(600); }
    });
    await finished('weather-wardrobe');
    await launch('weather-wardrobe', 10, 'Mia', 'prek');
    await page.waitForTimeout(600);
    await screenshot('weather-wardrobe-10-landscape');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await screenshot('weather-wardrobe-10-portrait');
    const proof = await page.evaluate(async () => {
      const { friendFor } = await import('/src/games/weather-wardrobe/logic.ts');
      const g = neo.scene.game;
      const point = (node, y = 0) => node.toGlobal({ x: 0, y });
      const drag = async (o, f) => {
        const a = point(o.node), b = point(f.node, -150);
        await kit.drag(kit.line([a.x, a.y], [b.x, b.y + 40], 18));
        await kit.sleep(120);
      };
      if (g.friends.length !== 2 || g.options.length !== 4) throw new Error('Missing friends or choices');
      if (Math.abs(g.friends[0].node.x - g.friends[1].node.x) < 348) throw new Error('Friend areas overlap');
      // Empty-space drops must not count.
      const o = g.options[0];
      const start = point(o.node);
      await kit.drag(kit.line([start.x, start.y], [neo.view.w / 2, 100], 18));
      await kit.sleep(550);
      if (g.misses || o.used) throw new Error('Empty space scored');
      const wrong = g.friends[1 - friendFor(g.outfit, o.item)];
      for (let i = 0; i < 2; i++) {
        await drag(o, wrong);
        await kit.until(() => !g.busy, 6000);
        await kit.sleep(80);
        if (o.used || Math.hypot(o.node.x - o.handle.home.x, o.node.y - o.handle.home.y) > 2) throw new Error('Wrong item did not return');
      }
      if (g.misses !== 2 || g.hints !== 1 || !g.glow.context.instructions.length || g.glow.eventMode !== 'none') throw new Error('Paired hint or scores wrong');
      const hinted = g.options.find((o) => o.item === g.outfit.needed[0]);
      await drag(hinted, g.friends[friendFor(g.outfit, hinted.item)]);
      if (!hinted.used) throw new Error('Glow swallowed drag');
      const seen = [];
      for (let i = 0; i < 40 && !g.done; i++) {
        await kit.until(() => !g.busy || g.done, 8000);
        if (g.done) break;
        const o = g.options.find((o) => !o.used);
        if (o) {
          await drag(o, g.friends[friendFor(g.outfit, o.item)]);
          if (!o.used) throw new Error('Fitting friend refused item');
          if (g.options.every((o) => o.used)) seen.push(g.friends.map((f) => f.worn.size));
        }
      }
      if (!g.done) throw new Error('Friends did not finish');
      return seen;
    });
    assert.deepEqual(proof, [[2, 2], [2, 2], [2, 2]]);
    await finished('weather-wardrobe');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('weather-wardrobe').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
    log('Weather Wardrobe 1/10: real drags, empty-space return, wrong friend twice, paired glow, three dressed pairs, saved 2/1 and sticker; portrait/landscape captured');
    await page.setViewportSize({ width: 1024, height: 768 });
  }
  return { wardrobe10 };
}
