import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Domino Run by touch: level 1 tipped by taps, level 8 with a stalled run, a requested hint and the rest by drags, level 5 upright. */
async function dominoRunPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, misses: g.misses, hints: g.hints, stalls: g.stalls, hinted: !!g.hinted, index: g.index }; });
  const idle = () => page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, { timeout: 15000 });
  const tapNode = async (expr) => {
    const p = await page.evaluate((expr) => (0, eval)(expr).toGlobal({ x: 0, y: -40 }), expr);
    await page.evaluate(({ x, y }) => kit.tap(x, y), p); await page.waitForTimeout(200);
  };
  /** Play the hint's way to a ringing line by drags, tap the starter, and go on until the round ends. */
  const solveAll = async () => {
    for (let guard = 0; guard < 60 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
      await idle();
      if (await page.evaluate(() => neo.scene.finished)) break;
      const step = await page.evaluate(async () => {
        const L = await import('/src/games/domino-run/logic.ts'), g = neo.scene.game;
        if (g.plan.tapAny) return { kind: 'tap1' };
        const h = L.hintPlacement(g.line, g.placed);
        if (h.kind !== 'place') return h;
        const p = g.pieces.find((q) => !q.at && q.size === h.size), l = g.lay.lanes[h.lane];
        return { kind: 'place', a: p.node.toGlobal({ x: 0, y: -60 }), to: { x: l.x0 + h.slot * L.PITCH, y: l.base } };
      });
      if (step.kind === 'tap1') await tapNode('neo.scene.game.nodes[0][1]');
      else if (step.kind === 'run') await tapNode('neo.scene.game.starters[0]');
      else if (step.kind === 'remove') await tapNode(`neo.scene.game.pieces.find((q) => q.at && q.at.lane === ${step.lane} && q.at.slot === ${step.slot}).node`);
      else if (step.kind === 'place') {
        const b = await page.evaluate((to) => neo.scene.game.pieceLayer.parent.toGlobal({ x: to.x, y: to.y + 40 }), step.to);
        await page.evaluate(({ a, b }) => kit.drag(kit.line([a.x, a.y], [b.x, b.y], 16)), { a: step.a, b }); await page.waitForTimeout(350);
      }
      await page.waitForTimeout(250);
    }
    await page.waitForFunction(() => neo.scene.finished, null, { timeout: 30000 });
  };
  // Level 1: three lines, each tipped by a tap on a domino; no misses or hints; one sticker.
  await launch('domino-run', 1); await idle();
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  await solveAll();
  let st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0], 'level 1 has no misses or hints');
  await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers, { timeout: 15000 });
  // Level 8: a run with gaps stalls (never a miss); Show a hint glows once and counts once; then the hint's way by drags.
  const stickers8 = await page.evaluate(() => kit.store.data.stickers.length);
  await launch('domino-run', 8); await idle();
  await tapNode('neo.scene.game.starters[0]'); await idle();
  st = await state(); assert.deepEqual([st.stalls, st.misses], [1, 0], 'a stalled run is counted as a stall, not a miss');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(200);
  st = await state(); assert.deepEqual([st.hints, st.hinted], [1, true], 'a requested hint glows and counts once');
  await solveAll();
  st = await state(); assert.equal(st.misses, 0); assert.ok(st.hints >= 1);
  await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers8, { timeout: 15000 });
  assert.deepEqual(errors, [], 'page errors');
  // Level 5 upright: two lanes and the tray row, one screenshot.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('domino-run', 5); await idle(); await page.waitForTimeout(500);
  await screenshot('domino-run-5-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, [], 'page errors');
  log('Domino Run: level 1 tipped by taps, level 8 with a stall (no miss), a requested hint and drags, level 5 upright');
}

return { dominoRunPlay };
}
