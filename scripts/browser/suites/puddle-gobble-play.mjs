import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Puddle Gobble by touch: level 1 led by taps, level 8 with a too-big touch (never a miss), a refused overshoot (one miss), a requested hint (one hint), finished by taps; level 4 upright. */
async function puddleGobblePlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { misses: g.misses, hints: g.hints, puddle: g.state.puddle, left: g.state.left.length, glow: g.glow }; });
  /** Wait until the puddle has stopped gliding and nothing is sliding in or hopping out. */
  const still = async () => {
    await page.evaluate(async () => { window.PGL = await import('/src/games/puddle-gobble/logic.ts'); });
    await page.waitForFunction(() => {
      const g = neo.scene.game;
      if (neo.scene.finished) return true;
      // Gliding done, nothing sliding in or hopping out, and the puddle grown to its size.
      return g && !g.busy && Math.hypot(g.target.x - g.puddle.x, g.target.y - g.puddle.y) < 2 && !g.items.some((i) => i.where === 'moving') && Math.abs(g.diameter - window.PGL.puddleDiameter(g.plan, g.state.puddle)) < 1;
    }, null, { timeout: 15000 });
  };
  /** Tap on thing `id` (the puddle glides there), or a let-go token. */
  const tapThing = async (id) => {
    const p = await page.evaluate((id) => { const g = neo.scene.game; return g.ctx.stage.toGlobal(g.items[id].node.position); }, id);
    await page.evaluate(({ x, y }) => kit.tap(x, y), p); await page.waitForTimeout(200); await still();
  };
  /** Set the puddle down just beside thing `id`, clear of the rest, so the next tap reaches only it. */
  const besides = (id) => page.evaluate((id) => {
    const g = neo.scene.game, it = g.items[id], R = g.diameter / 2, f = g.field;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2, x = it.node.x + Math.cos(a) * (R + 24), y = it.node.y + Math.sin(a) * (R + 24);
      if (x < f.x0 || x > f.x1 || y < f.y0 || y > f.y1) continue;
      const mx = (x + it.node.x) / 2, my = (y + it.node.y) / 2;
      if (g.items.some((o) => o !== it && o.where === 'sand' && Math.min(Math.hypot(o.node.x - x, o.node.y - y), Math.hypot(o.node.x - mx, o.node.y - my)) < R + 20)) continue;
      g.puddle.position.set(x, y); g.target.x = x; g.target.y = y; return true;
    }
    return false;
  }, id);
  /** Tap what the hint names; `near` first sets the puddle beside it, so passing over something else cannot soak it on the way. */
  const followHint = async (near = false) => {
    const h = await page.evaluate(async () => { const L = await import('/src/games/puddle-gobble/logic.ts'); const g = neo.scene.game; return L.hintTarget(g.board, g.state); });
    if (!h) return;
    if ('letGo' in h) {
      const p = await page.evaluate((id) => { const g = neo.scene.game; return g.tokens.find((t) => t.id === id).node.toGlobal({ x: 0, y: 0 }); }, h.letGo);
      await page.evaluate(({ x, y }) => kit.tap(x, y), p); await page.waitForTimeout(200); await still();
    } else {
      if (near) await besides(h.soak);
      await tapThing(h.soak);
    }
  };
  const sticker = (n) => page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 20000 });

  // Level 1: tap each shell; the puddle glides over and soaks it. No misses or hints; one sticker.
  await launch('puddle-gobble', 1); await still();
  let n = await page.evaluate(() => kit.store.data.stickers.length);
  for (let guard = 0; guard < 12 && !(await page.evaluate(() => neo.scene.finished)); guard++) await followHint();
  await sticker(n);
  let st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0], 'level 1 has no misses or hints');

  // Level 8: a too-big touch wobbles and counts nothing; an overshoot is refused (one miss); a requested hint glows (one hint).
  await launch('puddle-gobble', 8); await still();
  n = await page.evaluate(() => kit.store.data.stickers.length);
  const big = await page.evaluate(() => { const g = neo.scene.game; return g.state.left.find((id) => g.items[id].thing.size > g.state.puddle); });
  assert.ok(big !== undefined, 'something is too big at the start');
  assert.ok(await besides(big)); await tapThing(big);
  st = await state(); assert.deepEqual([st.misses, st.hints, st.left], [0, 0, 6], 'a too-big touch is never a miss and soaks nothing');
  assert.equal(await page.evaluate((id) => neo.scene.game.items[id].where, big), 'sand');
  // Follow the hint until something that fits would pass the pail, then steer onto it.
  let over;
  for (let guard = 0; guard < 6; guard++) {
    over = await page.evaluate(() => { const g = neo.scene.game; return g.state.left.find((id) => { const v = g.items[id].thing.size; return v <= g.state.puddle && g.state.puddle + v > g.board.pail; }); });
    if (over !== undefined) break;
    await followHint(true);
  }
  assert.ok(over !== undefined, 'an overshoot became possible');
  const before = (await state()).puddle;
  assert.ok(await besides(over)); await tapThing(over);
  st = await state(); assert.deepEqual([st.misses, st.puddle], [1, before], 'the overshoot is refused and counts one miss');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(150);
  st = await state(); assert.equal(st.hints, 1, 'a requested hint counts once'); assert.ok(st.glow, 'and glows');
  await page.evaluate(() => neo.scene.game.askForHint());
  assert.equal((await state()).hints, 1, 'asking again under the same glow counts nothing');
  for (let guard = 0; guard < 12 && !(await page.evaluate(() => neo.scene.finished)); guard++) await followHint();
  await sticker(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 1]);
  assert.equal(await page.evaluate(() => neo.scene.game.state.puddle === neo.scene.game.board.pail), true, 'the puddle matches the pail');

  // Level 4 upright: the meter and the biggest things, one screenshot.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('puddle-gobble', 4); await still(); await page.waitForTimeout(400);
  await screenshot('puddle-gobble-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, [], 'page errors');
  log('Puddle Gobble: level 1 by taps, level 8 with a too-big touch, a refused overshoot and a requested hint, level 4 upright');
}

return { puddleGobblePlay };
}
