import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Recipe Workshop: level 1's free empty Serve and uncounted hint, level 2's two failed Serves (glow, one hint) and a requested hint, level 3 dragging into the right bowl and serving it first, portrait. */
async function recipeWorkshopPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game, s = g.state; return { misses: s.misses, hints: s.hints, active: s.active, done: s.done, glow: s.slots.map((x) => x.glow), served: s.slots.map((x) => x.served), loose: s.slots.map((x) => x.bowl.loose.join(',')) }; });
  const tapBox = (which, i = 0) => page.evaluate(({ which, i }) => { const g = neo.scene.game; const b = which === 'spoon' || which === 'undo' || which === 'card' ? g.L[which] : g.L[which][i]; const p = g.tapLayer.toGlobal({ x: b.x + b.w / 2, y: b.y + b.h / 2 }); kit.tap(p.x, p.y); }, { which, i });
  const stickers = () => page.evaluate(() => kit.store.data.stickers.length);
  const playOut = () => page.evaluate(async () => {
    for (let i = 0; i < 80 && !neo.scene.finished; i++) {
      const t = neo.scene.game.autotouch?.();
      if (t) { const p = t.tap.on.toGlobal({ x: t.tap.x, y: t.tap.y }); kit.tap(p.x, p.y); }
      await kit.sleep(t ? 250 : 300);
    }
  });

  // Level 1: an empty Serve only invites, a requested hint counts nothing, and any bowl is served.
  await launch('recipe-workshop', 1); await page.waitForTimeout(300);
  let n = await stickers();
  await tapBox('serves'); await page.waitForTimeout(200);
  let st = await state(); assert.deepEqual([st.misses, st.done], [0, false], 'an empty Serve is free');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(100);
  st = await state(); assert.deepEqual([st.hints, st.glow[0]], [0, true], 'level 1 glows a pot and counts nothing');
  await tapBox('pots', 0); await page.waitForTimeout(150); await tapBox('pots', 0); await page.waitForTimeout(150);
  assert.equal((await state()).loose[0], 'berries,berries', 'each pot tap adds one dollop');
  await screenshot('recipe-workshop-1');
  await tapBox('serves'); await finished('recipe-workshop');
  assert.equal(await stickers(), n + 1);
  st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0]);

  // Level 2: the base alone, served twice, is two misses, a glow and one hint; asking again counts nothing more.
  await launch('recipe-workshop', 2); await page.waitForTimeout(300);
  await tapBox('pots', 1); await page.waitForTimeout(150);
  await tapBox('serves'); await page.waitForTimeout(250);
  await tapBox('serves'); await page.waitForTimeout(250);
  st = await state(); assert.deepEqual([st.misses, st.hints, st.glow[0]], [2, 1, true], 'two failed Serves glow the next step and count one hint');
  await page.evaluate(() => neo.scene.game.askForHint());
  assert.equal((await state()).hints, 1, 'a bowl counts one hint at most');
  await screenshot('recipe-workshop-2-glow');
  await playOut(); await finished('recipe-workshop');
  st = await state(); assert.deepEqual([st.misses, st.hints], [2, 1]);

  // Level 3 upright: drag the fruit into the right-hand bowl, serve it unmixed (one miss on that bowl), then finish it first.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('recipe-workshop', 3); await page.waitForTimeout(400);
  const path = await page.evaluate(() => { const g = neo.scene.game, a = g.L.pots[0], b = g.L.bowls[1]; const p = g.tapLayer.toGlobal({ x: a.x + a.w / 2, y: a.y + a.h / 2 }), q = g.tapLayer.toGlobal({ x: b.x + b.w / 2, y: b.y + b.h / 2 + 30 }); return [p, q]; });
  await page.evaluate(([p, q]) => kit.drag(kit.line([p.x, p.y], [q.x, q.y], 14)), path); await page.waitForTimeout(300);
  st = await state(); assert.deepEqual([st.active, st.loose[0], st.loose[1] !== ''], [1, '', true], 'a dragged dollop lands in the bowl under it and selects it');
  await tapBox('serves', 1); await page.waitForTimeout(250);
  st = await state(); assert.deepEqual([st.misses, st.served], [1, [false, false]], 'a bowl that does not match stays, one miss');
  await screenshot('recipe-workshop-3-portrait');
  await playOut(); await finished('recipe-workshop');
  st = await state(); assert.deepEqual([st.misses, st.hints, st.served], [1, 0, [true, true]]);
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, [], 'page errors');
  log('Recipe Workshop: level 1 free empty Serve and uncounted hint, level 2 two misses with glow and one hint, level 3 upright drag into the right bowl, a miss there and both bowls served right first');
}

return { recipeWorkshopPlay };
}
