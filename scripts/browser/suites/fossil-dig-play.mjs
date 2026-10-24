import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Fossil Dig by touch: level 1 with a flag tapped before the print shows (free), a wrong flag and a wrong leaf (two misses); level 2 with a requested hint (one hint) and a wrong leaf (one miss); level 2 upright with the magnifier open on the print. */
async function fossilDigPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, misses: g.misses, hints: g.hints, shown: g.state.shown, where: g.state.where, like: g.state.like, open: g.open, done: g.state.done }; });
  const idle = () => page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, { timeout: 20000 });
  const sticker = (n) => page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });
  const tapNode = (expr) => page.evaluate((expr) => { const g = neo.scene.game; const n = new Function('g', `return ${expr}`)(g); const p = n.getGlobalPosition(); kit.tap(p.x, p.y); }, expr);
  const botStep = () => page.evaluate(async () => {
    const g = neo.scene.game;
    if (!g || g.finished) { await kit.sleep(150); return 'done'; }
    const it = g.autotouch();
    if (!it) { await kit.sleep(150); return 'wait'; }
    const p = it.tap.on.toGlobal({ x: it.tap.x ?? 0, y: it.tap.y ?? 0 });
    kit.tap(p.x, p.y);
    await kit.sleep(250);
    return 'move';
  });
  const brushOut = async () => { for (let guard = 0; guard < 30 && !(await state()).shown; guard++) await botStep(); await idle(); };
  const playOut = async (n) => { for (let guard = 0; guard < 80 && !(await page.evaluate(() => neo.scene.finished)); guard++) await botStep(); await sticker(n); };
  const flag = (i) => `g.flagNodes[${i}]`;
  const card = (leaf) => `g.cards.find((c) => c.leaf === '${leaf}').node`;

  // Level 1: the authored star print in the blue-triangle square.
  await launch('fossil-dig', 1); await idle();
  let n = await page.evaluate(() => kit.store.data.stickers.length);
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.round.caseId, neo.scene.game.round.site]), ['L1-star', 1], 'the authored first find');
  await tapNode(flag(1)); await page.waitForTimeout(300);
  let st = await state(); assert.deepEqual([st.where, st.misses], [null, 0], 'a flag before the print shows is free');
  await brushOut();
  assert.equal((await state()).shown, true, 'brushing shows the print');
  await tapNode(flag(0)); await idle();
  st = await state(); assert.deepEqual([st.where, st.misses], [null, 1], 'the red circle flag is a miss');
  await tapNode(flag(1)); await idle();
  assert.equal((await state()).where, 'blue', 'the blue triangle flag is stamped');
  await tapNode(card('ribbon')); await page.waitForTimeout(250);
  assert.equal((await state()).like, 'ribbon', 'a leaf goes in the Like slot');
  await tapNode('g.checkBtn'); await idle();
  st = await state(); assert.deepEqual([st.misses, st.hints, st.like], [2, 0, null], 'the ribbon leaf: one more miss, leaf back');
  await playOut(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [2, 0]);

  // Level 2: the authored saw-star print. A requested hint glows the saw-star and opens the print's edge; a smooth leaf is a miss.
  await launch('fossil-dig', 2); await idle();
  n = await page.evaluate(() => kit.store.data.stickers.length);
  await brushOut();
  await tapNode(flag(2)); await idle();
  assert.equal((await state()).where, 'yellow');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(150);
  await page.evaluate(() => neo.scene.game.askForHint());
  st = await state(); assert.deepEqual([st.misses, st.hints, st.open], [0, 1, 'print'], 'a requested hint counts once and opens the print');
  await tapNode(card('star')); await page.waitForTimeout(250);
  await tapNode('g.checkBtn'); await idle();
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 1], 'the smooth star leaf is a miss');
  await playOut(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 1]);

  // Level 2 upright, the magnifier open on the print's teeth.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('fossil-dig', 2); await idle(); await page.waitForTimeout(300);
  await brushOut();
  await tapNode(`g.flagNodes[g.round.site]`); await idle();
  await tapNode('g.stoneNode'); await page.waitForTimeout(600);
  assert.equal((await state()).open, 'print', 'the print is in the magnifier');
  await screenshot('fossil-dig-2-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, [], 'page errors');
  log('Fossil Dig: level 1 with an early flag, a wrong flag and a wrong leaf, level 2 with a requested hint and a wrong leaf, level 2 upright with the magnifier');
}

return { fossilDigPlay };
}
