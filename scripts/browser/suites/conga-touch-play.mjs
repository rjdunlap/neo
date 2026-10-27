import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, tap, screenshot, launch, finished }) {
/** Pond Conga by touch: a touch sets the line off, swipes turn it, a bump, a hint, Start over, both ends of the ladder, buttons of at least 64 units upright and sideways. */
async function congaTouchPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, waiting: g.waiting, tries: g.tries, eaten: g.state.eaten, of: g.pond.crumbs.length, misses: g.misses, hints: g.hints, hinted: g.hinted, heading: g.state.heading, queue: g.queue.slice(), note: g.note.text }; });
  const ready = () => page.waitForFunction(() => neo.scene.game?.pond && !neo.scene.game.busy, null, { timeout: 15000 });
  const tapSlot = (kind) => page.evaluate((kind) => { const g = neo.scene.game, s = g.slots.find((s) => s.kind === kind), p = g.touchLayer.toGlobal({ x: s.x + s.w / 2, y: s.y + s.h / 2 }); kit.tap(p.x, p.y); }, kind);
  /** A real finger: touch the middle of the pond and lift. */
  const touchPond = () => page.evaluate(() => { const g = neo.scene.game, p = g.tapLayer.toGlobal({ x: g.pond.cols * g.cell / 2, y: g.pond.rows * g.cell / 2 }); kit.tap(p.x, p.y); });
  /** Swipe steering for a whole round, in the page so the timing follows the game's own steps: after each step, swipe the way the next one has to turn. */
  const drive = () => page.evaluate(async () => {
    const { hintPath } = await import('/src/games/pond-conga/logic.ts');
    const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
    const swipe = async (g, dir) => {
      const w = g.pond.cols * g.cell / 2, h = g.pond.rows * g.cell / 2, a = g.tapLayer.toGlobal({ x: w, y: h }), b = g.tapLayer.toGlobal({ x: w + DX[dir] * 64, y: h + DY[dir] * 64 });
      await kit.drag(kit.line([a.x, a.y], [b.x, b.y], 4));
    };
    let last = -1;
    for (let guard = 0; guard < 4000 && !neo.scene.finished; guard++) {
      const g = neo.scene.game;
      if (!g?.pond || g.busy || g.finished) { await kit.sleep(40); continue; }
      const plan = g.onRoute ? g.pond.route.slice(g.routeAt) : hintPath(g.pond, g.state);
      if (g.waiting) {
        if (plan[0] !== undefined && plan[0] !== g.state.heading) await swipe(g, plan[0]);
        else { const p = g.tapLayer.toGlobal({ x: 10, y: 10 }); kit.tap(p.x, p.y); }
        await kit.sleep(120);
        continue;
      }
      if (g.ticks !== last && g.queue.length === 0) {
        last = g.ticks;
        if (plan[0] !== undefined && plan[0] !== g.state.heading) await swipe(g, plan[0]);
      }
      await kit.sleep(15);
    }
  });
  /** The pond is one target; Hint and Start over at least 64 logical units, on screen, apart from each other and the water. */
  const targets = (label) => page.evaluate((label) => {
    const g = neo.scene.game, out = [], pond = { x: g.board.x, y: g.board.y, w: g.pond.cols * g.cell, h: g.pond.rows * g.cell };
    const rects = g.slots.map((s) => ({ name: s.kind, x: s.x, y: s.y, w: s.w, h: s.h }));
    if (rects.length !== 2) out.push(`${rects.length} buttons`);
    for (const r of rects) {
      if (r.w < 64 || r.h < 64) out.push(`${r.name} small ${r.w}x${r.h}`);
      if (r.x < 0 || r.y < 0 || r.x + r.w > neo.view.w || r.y + r.h > neo.view.h) out.push(`${r.name} off screen`);
      if (r.x < pond.x + pond.w && pond.x < r.x + r.w && r.y < pond.y + pond.h && pond.y < r.y + r.h) out.push(`${r.name} over the pond`);
    }
    const [a, b] = rects;
    if (a && b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) out.push('the buttons overlap');
    if (pond.x < 0 || pond.y < 0 || pond.x + pond.w > neo.view.w || pond.y + pond.h > neo.view.h) out.push('pond off screen');
    // The home and help buttons fill the top-left corner (to about x 104, y 200): no crumb may hide behind them.
    if (pond.x < 108 && pond.y < 196) out.push('pond under the help button');
    return out.map((m) => `${label}: ${m} (${neo.view.w}x${neo.view.h}, scale ${neo.view.scale})`);
  }, label);
  // Level 1: the line waits for a touch, a bump into the bank is one miss, a hint counts once, Start over keeps the steps, then the pond is cleared.
  await launch('pond-conga', 1); await ready();
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  let st = await state();
  assert.deepEqual([st.waiting, st.tries, st.of], [true, 0, 5], 'nothing moves before a touch');
  assert.ok(st.note.includes('Touch the pond'), 'the line of help says how to set off');
  assert.deepEqual(await targets('level 1 landscape'), []);
  await touchPond();
  await page.waitForFunction(() => neo.scene.game.misses >= 1, null, { timeout: 20000 });
  st = await state(); assert.deepEqual([st.waiting, st.misses], [false, 1], 'a touch set it off, and straight on it bumped the bank once');
  await tapSlot('hint'); await page.waitForTimeout(250);
  st = await state(); assert.deepEqual([st.hints, st.hinted], [1, true]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 1 portrait'), []);
  await screenshot('conga-touch-1-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  const before = (await state()).tries;
  await tapSlot('again'); await page.waitForTimeout(300);
  st = await state(); assert.deepEqual([st.waiting, st.eaten, st.hinted], [true, 0, false], 'start over puts the line back and waits for a touch');
  assert.ok(st.tries >= before, 'the steps already taken keep counting');
  await drive(); await finished('pond-conga');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('pond-conga').history.at(-1); return [r.misses, r.hints]; }), [1, 1]);
  // Level 6 (the crowded pond): every target still 64 or more, sideways and upright, swiped through with no help.
  await launch('pond-conga', 6); await ready();
  assert.deepEqual(await targets('level 6 landscape'), []);
  await screenshot('conga-touch-6-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 6 portrait'), []);
  await screenshot('conga-touch-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await drive(); await finished('pond-conga');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 2);
  const last = await page.evaluate(() => { const r = kit.store.stats('pond-conga').history.at(-1); return [r.misses, r.hints]; });
  assert.deepEqual(last, [0, 0], 'a swiped run with no help has no bumps');
  // Opening it from Lantern Lake plays it here, by touch; leaving mid-round is quiet.
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; neo.go.land('lantern-lake'); }); await scene('LandScene');
  await page.evaluate(() => neo.go.game('pond-conga', 'grownup', undefined, false, 'lantern-lake')); await scene('GameScene'); await ready();
  assert.equal(await page.evaluate(() => neo.scene.game.touch), true, 'the island plays it by touch');
  await touchPond(); await page.waitForTimeout(800);
  await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene'); await page.waitForTimeout(700);
  await page.evaluate(() => neo.go.hub()); await scene('MapScene');
  assert.deepEqual(errors, []);
  log('Pond Conga touch: first and last level, a touch to set off, swipes, one bump, one hint, start over, one sticker each, portrait and leaving mid-round passed');
}

return { congaTouchPlay };
}
