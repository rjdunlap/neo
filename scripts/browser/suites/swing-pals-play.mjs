import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Swing Pals by touch: level 1 pushed to every bell by taps; level 6 with one wrong hook (one miss) and a requested glow (one hint); level 3 upright. */
async function swingPalsPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, misses: g.misses, hints: g.hints, line: g.line, glow: g.glowHook }; });
  const idle = () => page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, { timeout: 20000 });
  const tapAt = async (x, y) => {
    const p = await page.evaluate(({ x, y }) => neo.scene.game.ctx.stage.toGlobal({ x, y }), { x, y });
    await page.evaluate(({ x, y }) => kit.tap(x, y), p);
  };
  const tapHook = async (hook) => {
    const p = await page.evaluate((hook) => { const g = neo.scene.game; return g.layout.columns[1].pivot[hook]; }, hook);
    await idle(); await page.waitForTimeout(120); await tapAt(p.x, p.y); await page.waitForTimeout(250); await idle();
  };
  const sticker = (n) => page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });

  // Level 1: every tap pushes at once; four taps a friend ring the bell. No misses or hints.
  await launch('swing-pals', 1); await idle();
  let n = await page.evaluate(() => kit.store.data.stickers.length);
  for (let guard = 0; guard < 60 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
    const z = await page.evaluate(() => { const g = neo.scene.game; return g && !g.busy ? g.layout.columns[0].zone : null; });
    if (z) await tapAt(z.x + z.w / 2, z.y + z.h * 0.55);
    await page.waitForTimeout(600);
  }
  await sticker(n);
  let st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0], 'level 1 has no misses or hints');

  // Level 6: a hook that is neither the start nor the right one parts (one miss); a requested hint glows (one hint).
  await launch('swing-pals', 6); await idle();
  n = await page.evaluate(() => kit.store.data.stickers.length);
  const first = await page.evaluate(() => { const g = neo.scene.game, l = g.pairLine; return { right: l.petHook, start: l.hook }; });
  const wrong = ['short', 'middle', 'long'].find((h) => h !== first.right && h !== first.start);
  await tapHook(wrong);
  st = await state(); assert.deepEqual([st.misses, st.hints, st.line], [1, 0, 0], 'a wrong hook parts and counts one miss');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(150);
  st = await state(); assert.deepEqual([st.hints, st.glow], [1, first.right], 'a requested hint glows the right hook once');
  await page.evaluate(() => neo.scene.game.askForHint());
  assert.equal((await state()).hints, 1, 'asking again under the glow counts nothing');
  for (let guard = 0; guard < 6 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
    const right = await page.evaluate(() => neo.scene.game.pairLine.petHook);
    await tapHook(right);
  }
  await sticker(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 1]);

  // Level 3 upright: two swings, short and long, one screenshot.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('swing-pals', 3); await idle(); await page.waitForTimeout(400);
  for (const i of [0, 1]) {
    const z = await page.evaluate((i) => neo.scene.game.layout.columns[i].zone, i);
    await tapAt(z.x + z.w / 2, z.y + z.h * 0.55); await page.waitForTimeout(300);
  }
  await page.waitForTimeout(500);
  await screenshot('swing-pals-3-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, [], 'page errors');
  log('Swing Pals: level 1 by taps, level 6 with a wrong hook and a requested hint, level 3 upright');
}

return { swingPalsPlay };
}
