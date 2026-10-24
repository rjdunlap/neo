import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished, useCompanion }) {
async function wardrobe7() {
  await page.setViewportSize({ width: 768, height: 1024 });
  if (process.env.WARDROBE_SPECIES) await useCompanion(process.env.WARDROBE_SPECIES);
  await launch('weather-wardrobe', 7);
  await page.waitForTimeout(700);
  await page.evaluate(async () => {
    const g = neo.scene.game;
    if (g.plan.mode !== 'change' || g.changePhase !== 'remove') throw new Error('Weather change did not start in the remove phase');
    await kit.until(() => g.worn.size > 0);
  });
  await screenshot('weather-wardrobe-7');
  await page.evaluate(async () => {
    const g = neo.scene.game;
    const trace = [];
    for (let step = 0; g.changePhase === 'remove' && step < 6; step++) {
      const item = g.outfit.remove.find((i) => g.worn.has(i));
      if (!item) throw new Error('No removable clothing remains');
      const [node] = g.worn.get(item);
      const p = node.toGlobal(g.wornCenters.get(item));
      kit.tap(p.x, p.y); await kit.sleep(350);
    }
    if (g.changePhase !== 'add') throw new Error('Taking off the old outfit did not reveal the new weather');
    const wrong = g.options.find((o) => !g.outfit.needed.includes(o.item));
    for (let i = 0; i < 2; i++) { kit.tapOn(wrong.node); await kit.sleep(100); if (!g.busy) throw new Error('No misfit shown'); await kit.until(() => !g.busy, 3000); await kit.sleep(50); }
    if (g.hints !== 1) throw new Error('Weather change hint missing');
    for (let step = 0; !g.done && step < 40; step++) {
      await kit.until(() => !g.busy || g.done, 15000);
      if (g.done) break;
      if (g.changePhase === 'remove') {
        const item = g.outfit.remove.find((i) => g.worn.has(i));
        const [node] = g.worn.get(item), p = node.toGlobal(g.wornCenters.get(item));
        kit.tap(p.x, p.y);
      } else {
        const option = g.options.find((o) => !o.used && g.outfit.needed.includes(o.item));
        if (!option) throw new Error('No remaining clothing choice');
        kit.tapOn(option.node);
      }
      await kit.sleep(450);
      trace.push({ q: g.q, phase: g.changePhase, worn: [...g.worn.keys()], used: g.options.filter((o) => o.used).map((o) => o.item) });
    }
    if (!g.done) throw new Error(`Weather change rounds did not finish: ${JSON.stringify({ q: g.q, phase: g.changePhase, worn: [...g.worn.keys()], used: g.options.filter((o) => o.used).map((o) => o.item), needed: g.outfit.needed, trace: trace.slice(-8) })}`);
  });
  await finished('weather-wardrobe');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('weather-wardrobe').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
  log('Weather Wardrobe 7: take off, dress for the changed weather, hint, saved round and sticker passed');
  await page.setViewportSize({ width: 1024, height: 768 });
}

return { wardrobe7 };
}
