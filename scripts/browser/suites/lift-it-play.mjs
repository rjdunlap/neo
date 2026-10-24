import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Lift It by touch: level 1 hauled in strokes; level 6 with one wrong rig (one miss) and a requested glow (one hint), then the cards and the haul; level 3 upright with two wheels hung. */
async function liftItPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, misses: g.misses, hints: g.hints, line: g.line, glow: g.glowRig, rig: g.rig, rung: g.haul.rung }; });
  const idle = () => page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, { timeout: 20000 });
  const sticker = (n) => page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });
  // In the page: real touches for one step of play (hang or move a wheel, answer a card, or one stroke), toward `want` (or the hint's rig).
  const step = (want) => page.evaluate(async (want) => {
    const { bestRig, rigsFor, hooksOf, crateHook } = await import('/src/games/lift-it/logic.ts');
    const g = neo.scene.game;
    if (!g || g.busy || g.finished) { await kit.sleep(120); return 'wait'; }
    const S = (x, y) => { const p = g.ctx.stage.toGlobal({ x, y }); return [p.x, p.y]; };
    const scale = neo.view.scale;
    if (g.question) {
      const c = g.cards.find((c) => c.value === g.question.answer); const p = c.node.getGlobalPosition(); kit.tap(p.x, p.y); await kit.sleep(400); return 'card';
    }
    const rig = want ?? bestRig(g.cur, rigsFor(g.plan));
    if (!g.plan.prebuilt && g.rig !== rig) {
      const need = hooksOf(rig);
      const hookAt = (h) => (h === 'branch' ? g.layout.branchHook : crateHook(g.layout, 0));
      for (const h of g.plan.hooks) if (g.hooks[h] && !need[h]) {
        const w = g.wheels.find((o) => o.on === h); const t = g.layout.tray[w.slot];
        const a = w.node.getGlobalPosition(); await kit.drag(kit.line([a.x, a.y], S(t.x, t.y + 40), 10)); await kit.sleep(300); return 'unhang';
      }
      for (const h of g.plan.hooks) if (need[h] && !g.hooks[h]) {
        const w = g.wheels.find((o) => o.on === null); const t = hookAt(h);
        const a = w.node.getGlobalPosition(); await kit.drag(kit.line([a.x, a.y], S(t.x, t.y + 40), 10)); await kit.sleep(300); return 'hang';
      }
    }
    const h = g.handle.getGlobalPosition();
    const down = g.rig === 'fixed' || g.rig === 'both';
    if (g.plan.ask !== 'none' && g.answeredFor !== g.rig) { kit.tap(h.x, h.y); await kit.sleep(500); return 'tap'; }
    const len = (down ? 150 : -Math.min(150, g.handle.y - 20)) * scale;
    await kit.drag(kit.line([h.x, h.y], [h.x, h.y + len], 10)); await kit.sleep(150); return 'stroke';
  }, want);
  const playOut = async (n) => { for (let guard = 0; guard < 200 && !(await page.evaluate(() => neo.scene.finished)); guard++) await step(); await sticker(n); };

  // Level 1: the rope hangs over the branch wheel; strokes down haul each parcel up. No misses or hints.
  await launch('lift-it', 1); await idle();
  let n = await page.evaluate(() => kit.store.data.stickers.length);
  await playOut(n);
  let st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0], 'level 1 has no misses or hints');

  // Level 6: the authored six-stone crate; the branch wheel alone needs six paws (one miss on the tug), a requested hint glows both hooks once.
  await launch('lift-it', 6); await idle();
  n = await page.evaluate(() => kit.store.data.stickers.length);
  assert.deepEqual(await page.evaluate(() => { const l = neo.scene.game.cur; return [l.w, l.g, l.h, l.ask]; }), [6, 3, 3, 'ground'], 'the authored first parcel');
  await step('fixed'); await idle();
  assert.equal((await state()).rig, 'fixed');
  await step('fixed'); await idle(); await page.waitForTimeout(300);
  st = await state(); assert.deepEqual([st.misses, st.hints, st.rung], [1, 0, 0], 'a tug on a rig that cannot lift counts one miss and moves nothing');
  await step('fixed'); await idle();
  assert.equal((await state()).misses, 1, 'tugging the same rig again is free');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(150);
  st = await state(); assert.deepEqual([st.hints, st.glow], [1, 'both'], 'a requested hint glows the two-wheel rig once');
  await page.evaluate(() => neo.scene.game.askForHint());
  assert.equal((await state()).hints, 1, 'asking again under the glow counts nothing');
  await playOut(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 1]);

  // Level 3 upright: both wheels hung, one screenshot.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('lift-it', 3); await idle(); await page.waitForTimeout(400);
  await step('both'); await idle(); await step('both'); await idle(); await page.waitForTimeout(400);
  assert.equal((await state()).rig, 'both', 'two wheels hung');
  await screenshot('lift-it-3-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, [], 'page errors');
  log('Lift It: level 1 by strokes, level 6 with a wrong rig and a requested hint, level 3 upright with two wheels');
}

return { liftItPlay };
}
