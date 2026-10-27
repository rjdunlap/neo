import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished }) {
/** Food Web Workshop: level 1 with an extra arrow (one miss), Undo and the right web; level 2's turn and a portrait screenshot; level 3 with one requested hint. */
async function foodWebPlay() {
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
  const link = (from, to) => page.evaluate(async ([from, to]) => {
    const g = neo.scene.game;
    const a = g.stations.find((st) => st.organism === from), b = g.stations.find((st) => st.organism === to);
    await kit.dragTo(a.badge, b.node.getGlobalPosition(), 12);
    await kit.sleep(650);
  }, [from, to]);
  const arrows = () => page.evaluate(() => neo.scene.game.s.arrows.map((a) => `${a.from}>${a.to}`).sort());
  const records = () => page.evaluate(() => neo.scene.game.cards.map((c) => [c.record.from, c.record.to]));
  const result = (id) => page.evaluate((id) => { const r = kit.store.stats(id).history.at(-1); return [r.misses, r.hints]; }, 'food-web-workshop');

  await launch('food-web-workshop', 1); await idle();
  const [r1, r2] = await records();
  await tap('neo.scene.game.cards[0].node'); await page.waitForTimeout(400);
  await link(...r1); await link(...r2);
  // An arrow on no card: from the top eater back to the plant.
  await link(r2[1], r1[0]);
  assert.equal((await arrows()).length, 3);
  await tap('neo.scene.game.showButton'); await idle();
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.s.misses, neo.scene.finished]), [1, false], 'a wrong web is one miss');
  await tap('neo.scene.game.undoButton'); await page.waitForTimeout(300);
  assert.deepEqual(await arrows(), [r1.join('>'), r2.join('>')].sort(), 'Undo takes back the extra arrow');
  await tap('neo.scene.game.showButton');
  await finished('food-web-workshop');
  assert.deepEqual(await result(), [1, 0]);
  log('Food Web Workshop 1: real drags, extra arrow miss, Undo and a matching web passed');

  await launch('food-web-workshop', 2); await idle();
  const rev = await page.evaluate(() => { const g = neo.scene.game; const r = g.cards.find((c) => c.record.id === g.s.round.reversed).record; return [r.from, r.to]; });
  await link(...rev);
  assert.ok((await arrows()).includes(rev.join('>')), 'dragging the food onto the eater turns the arrow');
  assert.equal((await arrows()).length, 2);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.ok(await page.evaluate(() => { const g = neo.scene.game; const k = g.ctx.stage.worldTransform.a; return [...g.cards.map((c) => c.node), ...g.stations.map((s) => s.badge), g.showButton, g.undoButton].every((n) => Math.min(n.getBounds().width, n.getBounds().height) / k >= 100); }), 'every target stays at least 100 logical units in portrait');
  await screenshot('food-web-workshop-2-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(450);
  await tap('neo.scene.game.showButton');
  await finished('food-web-workshop');
  assert.deepEqual(await result(), [0, 0]);
  log('Food Web Workshop 2: the turned arrow, portrait targets and a clean finish passed');

  await launch('food-web-workshop', 3); await idle();
  const [b1, b2] = await records();
  assert.equal(b1[0], b2[0], 'level 3 branches from one food');
  await link(...b1);
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(500);
  assert.deepEqual(await arrows(), [b1.join('>'), b2.join('>')].sort(), 'the hint draws the missing arrow');
  await tap('neo.scene.game.showButton');
  await finished('food-web-workshop');
  assert.deepEqual(await result(), [0, 1]);
  log('Food Web Workshop 3: branching arrows, one counted hint and the finish passed');
}

return { foodWebPlay };
}
