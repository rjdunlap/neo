import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished }) {
/** Gear Garden: level 1 with a Turn-back and three blooms (0/0); level 3 opening B, a short drop that glides home, a requested hint (the gear goes in, one hint), a portrait screenshot of board B, then every case mended (0/1). */
async function gearsPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('gear-garden').history.at(-1); return [r.misses, r.hints]; });
  const settle = async () => { await page.waitForTimeout(200); await page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.busy && !neo.scene.game.anim), null, { timeout: 25000 }); await page.waitForTimeout(150); };
  /** Tap the machine face below its centre (clear of a gear in the middle socket). */
  const tapFace = () => page.evaluate(() => { const g = neo.scene.game; const f = g.layoutNow.face; const p = g.face.toGlobal({ x: f.x + f.w / 2, y: f.y + f.h / 2 + g.layoutNow.r * 0.9 }); kit.tap(p.x, p.y); });
  const gapGlobal = () => page.evaluate(() => { const g = neo.scene.game; const b = g.machine.spec.board; const s = b.sockets.find((k) => k.role === 'gap'); const l = g.layoutNow; return g.face.toGlobal({ x: l.origin.x + s.x * l.r, y: l.origin.y + s.y * l.r }); });
  const playOut = async () => {
    for (let i = 0; i < 80; i++) {
      await settle();
      const state = await page.evaluate(() => { const g = neo.scene.game; return neo.scene.finished || g.finished ? 'done' : !g.machine ? 'choose' : g.machine.hasGap && !g.machine.looseIn ? 'place' : 'turn'; });
      if (state === 'done') break;
      if (state === 'choose') await page.evaluate(() => kit.tapOn(neo.scene.game.panels[0]));
      else if (state === 'place') { const to = await gapGlobal(); await page.evaluate((to) => kit.dragTo(neo.scene.game.loose, to), to); }
      else await tapFace();
    }
  };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await launch('gear-garden', 1);
  await settle();
  await tapFace(); await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.machine.progress), 1, 'a tap on the face turns the flower a quarter');
  await page.evaluate(() => kit.tapOn(neo.scene.game.back)); await settle();
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.machine.progress, neo.scene.game.machine.turns[0]]), [2, 0], 'Turn-back turns back and still counts');
  await playOut();
  await finished('gear-garden');
  assert.deepEqual(await score(), [0, 0]);
  await launch('gear-garden', 3);
  await settle();
  await page.evaluate(() => kit.tapOn(neo.scene.game.panels[1])); await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.machine.spec.board.sockets.length), 4, 'panel B opens the four-gear machine');
  const gap = await gapGlobal();
  await page.evaluate((to) => kit.dragTo(neo.scene.game.loose, { x: to.x, y: to.y - 400 }), gap); await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => neo.scene.game.machine.looseIn), false, 'a drop away from the gap glides home');
  await tapFace(); await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.machine.progress), 0, 'a broken machine leaves the flower still');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(900);
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.machine.looseIn, neo.scene.game.tally.hints]), [true, 1], 'Show a hint puts the gear in and counts one');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await tapFace(); await settle();
  await screenshot('gear-garden-3-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  await playOut();
  await finished('gear-garden');
  assert.deepEqual(await score(), [0, 1]);
  log('Gear Garden 1 and 3: face tap, Turn-back, blooms, B opened, short drop home, still flower, requested hint, portrait, saved score passed');
}

return { gearsPlay };
}
