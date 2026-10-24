import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished }) {
/** Ribbon Workshop: level 1 with two wrong checks (the glow and its one hint), both gifts by real taps; level 3's snip gift with its tempting too-long ribbon; portrait. */
async function ribbonPlay() {
  // Follow the hint path with real taps until the round finishes (the ghost finger's rule).
  const playOut = () => page.evaluate(async () => {
    for (let i = 0; i < 80 && !neo.scene.finished; i++) {
      const t = neo.scene.game.autotouch?.();
      if (t) kit.tapOn(t.tap.on);
      await kit.sleep(t ? 300 : 400);
    }
  });
  await launch('ribbon-workshop', 1);
  const first = await page.evaluate(async () => {
    const g = neo.scene.game, out = [];
    // An empty check counts nothing.
    kit.tapOn(g.bow); await kit.sleep(500); out.push([g.misses, g.hints]);
    // One quarter is too short for a whole: a miss, then a second, and the glow comes with one hint.
    const q = g.state.tray.find(p => p.size === 1);
    kit.tapOn(g.trayCards.get(q.id)); await kit.sleep(300);
    kit.tapOn(g.bow); await kit.sleep(500); out.push([g.misses, g.hints, g.tally.glow]);
    kit.tapOn(g.bow); await kit.sleep(500); out.push([g.misses, g.hints, g.tally.glow]);
    return out;
  });
  assert.deepEqual(first, [[0, 0], [1, 0, false], [2, 1, true]], 'empty check free; second miss brings the glow and one hint');
  await screenshot('ribbon-workshop-1-glow');
  await playOut();
  await finished('ribbon-workshop');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('ribbon-workshop').history.at(-1); return [r.level, r.misses, r.hints]; }), [1, 2, 1]);

  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('ribbon-workshop', 3);
  // Gift 1 by the hint path, then the snip gift by hand.
  await page.evaluate(async () => {
    for (let i = 0; i < 40 && neo.scene.game.gift === 0; i++) { const t = neo.scene.game.autotouch(); if (t) kit.tapOn(t.tap.on); await kit.sleep(t ? 300 : 400); }
  });
  await page.waitForFunction(() => neo.scene.game.gift === 1 && !neo.scene.game.busy);
  const snip = await page.evaluate(async () => {
    const g = neo.scene.game, out = [];
    const [a, b] = g.state.tray.map(p => p.id);
    kit.tapOn(g.trayCards.get(a)); await kit.sleep(250);
    kit.tapOn(g.trayCards.get(b)); await kit.sleep(250);
    kit.tapOn(g.bow); await kit.sleep(500); out.push(g.misses);
    kit.tapOn(g.benchPieces.get(b)); await kit.sleep(250);
    kit.tapOn(g.scissors); await kit.sleep(250); out.push(g.snipping);
    kit.tapOn(g.trayCards.get(b)); await kit.sleep(250); out.push(g.state.tray.map(p => p.size).join(''));
    kit.tapOn(g.trayCards.get(g.state.tray[0].id)); await kit.sleep(250);
    out.push(g.state.bench.map(p => p.size).join(''));
    return out;
  });
  assert.deepEqual(snip, [1, true, '11', '21'], 'two halves are too long; snip one and use a quarter');
  await screenshot('ribbon-workshop-3-portrait');
  await page.evaluate(() => kit.tapOn(neo.scene.game.bow));
  await finished('ribbon-workshop');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('ribbon-workshop').history.at(-1); return [r.level, r.misses, r.hints]; }), [3, 1, 0]);
  await page.setViewportSize({ width: 1024, height: 768 });
  log('Ribbon Workshop: level 1 glow and both gifts, level 3 snip gift, portrait passed');
}

return { ribbonPlay };
}
