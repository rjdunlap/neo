import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Species Comeback: level 1 with a forbidden pair, an undo and a requested hint; level 3 with an unsuitable site; portrait at the sites; 64-unit cards. */
async function comebackPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { phase: g.phase, misses: g.misses, hints: g.hints, plan: g.plan.map((p) => [...p]), lifted: g.lifted }; });
  const tapCard = (id) => page.evaluate((id) => { const c = neo.scene.game.cards.get(id), p = c.getGlobalPosition(); kit.tap(p.x, p.y); }, id);
  const tapObj = (expr) => page.evaluate((expr) => { const o = Function('g', `return (${expr})`)(neo.scene.game), p = o.getGlobalPosition(); kit.tap(p.x, p.y); }, expr);
  const until = (phase) => page.waitForFunction((phase) => neo.scene.finished || neo.scene.game.phase === phase, phase, { timeout: 20000 });
  const small = () => page.evaluate(() => [...neo.scene.game.cards.values()].filter((c) => c.size * c.scale.x * neo.view.scale < 64 * neo.view.scale - 0.5 && c.scale.x >= 1).length);
  const pairUp = async () => {
    for (let guard = 0; guard < 30; guard++) {
      const help = await page.evaluate(async () => { const L = await import('/src/games/species-comeback/logic.ts'), g = neo.scene.game; return g.plan.length >= g.target ? null : L.extend(g.round.tree, g.plan, g.depth, g.target)?.[g.plan.length] ?? null; });
      if (!help) break;
      await tapCard(help[0]); await page.waitForTimeout(150);
      await tapCard(help[1]); await page.waitForTimeout(450);
    }
    await tapObj('g.spring'); await page.waitForTimeout(200);
  };
  // Level 1: a forbidden pair is one miss, undoing a nest is free, a requested hint counts once.
  await launch('species-comeback', 1); await until('pair');
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  assert.equal(await small(), 0, 'cards at least 64 units');
  const tempt = await page.evaluate(async () => { const L = await import('/src/games/species-comeback/logic.ts'), g = neo.scene.game; return L.tempting(g.round.tree, g.depth)[0]; });
  await tapCard(tempt[0]); await page.waitForTimeout(150); await tapCard(tempt[1]); await page.waitForTimeout(300);
  let st = await state(); assert.deepEqual([st.misses, st.plan.length, st.lifted], [1, 0, null], 'a forbidden pair is one miss');
  await page.waitForTimeout(2200);
  const good = await page.evaluate(async () => { const L = await import('/src/games/species-comeback/logic.ts'), g = neo.scene.game; return L.extend(g.round.tree, [], g.depth, g.target)[0]; });
  await tapCard(good[0]); await page.waitForTimeout(150); await tapCard(good[1]); await page.waitForTimeout(450);
  assert.equal((await state()).plan.length, 1);
  await tapObj('g.nests[0]'); await page.waitForTimeout(450);
  st = await state(); assert.deepEqual([st.plan.length, st.misses], [0, 1], 'undo is free');
  await tapObj('g.spring'); await page.waitForTimeout(200);
  assert.equal((await state()).misses, 1, 'an early Spring is free');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(200);
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(200);
  assert.equal((await state()).hints, 1, 'a requested hint counts once per step');
  await pairUp(); await finished('species-comeback');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('species-comeback').history.at(-1); return [r.misses, r.hints]; }), [1, 1]);
  // Level 3: pairs, Spring, then a site missing a need is one miss and a suiting site finishes; the sites in portrait.
  await launch('species-comeback', 3); await until('pair');
  assert.equal(await small(), 0, 'level 3 cards at least 64 units');
  await screenshot('species-comeback-3-tree');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.equal(await small(), 0, 'level 3 cards at least 64 units upright');
  await screenshot('species-comeback-3-tree-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await pairUp(); await until('site'); await page.waitForTimeout(300);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  const off = await page.evaluate(() => neo.scene.game.sites.filter((c) => { const b = c.getBounds(); return b.x < 0 || b.y < 0 || b.x + b.width > innerWidth || b.y + b.height > innerHeight; }).length);
  assert.equal(off, 0, 'every site on screen upright');
  await screenshot('species-comeback-3-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await tapObj('g.sites.find((c) => c.site.features.length && !["water","logs","sand","plants"].every((f) => c.site.features.includes(f)))'); await page.waitForTimeout(300);
  assert.equal((await state()).misses, 1, 'a site missing a need is one miss');
  await screenshot('species-comeback-3-landscape');
  await tapObj('g.sites.find((c) => ["water","logs","sand","plants"].every((f) => c.site.features.includes(f)))');
  await finished('species-comeback');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('species-comeback').history.at(-1); return [r.misses, r.hints]; }), [1, 0]);
  assert.deepEqual(errors, []);
  log('Species Comeback: level 1 forbidden pair, undo, early Spring, one requested hint; level 3 unsuitable site; portrait sites; 64-unit cards; one sticker each passed');
}

return { comebackPlay };
}
