import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Lost Layers by touch: level 1 with a red It fits (one miss), a fit stamped, a one-story claim (one miss, the other fit stamped with help) and a requested hint; level 2 with an uninformative Look (one miss); level 2 upright with the lens open. */
async function trackwayTalesPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { id: g.round.c.id, busy: g.busy, misses: g.misses, hints: g.hints, slot: g.slot, shown: g.shown, pos: g.pos, open: !!g.open, replay: !!g.replay, glow: g.state.helped }; });
  const idle = () => page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy && !neo.scene.game.replay), null, { timeout: 20000 });
  const sticker = (n) => page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });
  const tapNode = (expr, dy = 0) => page.evaluate(([expr, dy]) => { const g = neo.scene.game; const n = new Function('g', `return ${expr}`)(g); const p = n.toGlobal({ x: 0, y: dy }); kit.tap(p.x, p.y); }, [expr, dy]);
  const card = (id) => `g.cards.find((c) => c.id === '${id}')`;
  const botStep = () => page.evaluate(async () => {
    const g = neo.scene.game;
    if (!g || g.finished) { await kit.sleep(150); return 'done'; }
    const it = g.autotouch();
    if (!it) { await kit.sleep(150); return 'wait'; }
    const p = it.tap.on.toGlobal({ x: it.tap.x ?? 0, y: it.tap.y ?? 0 }); kit.tap(p.x, p.y);
    await kit.sleep(400);
    return 'move';
  });
  const playOut = async (n) => { for (let guard = 0; guard < 60 && !(await page.evaluate(() => neo.scene.finished)); guard++) await botStep(); await sticker(n); };

  // Level 1, the authored walk round: replay the hop, scrub it back, Check it (one miss), ask for a hint twice, then the bot finishes.
  await launch('trackway-tales', 1); await idle();
  let n = await page.evaluate(() => kit.store.data.stickers.length);
  let st = await state(); assert.equal(st.id, 'L1-walk', 'the authored first round');
  await tapNode(`${card('hop')}.play`); await page.waitForTimeout(200);
  assert.equal((await state()).replay, true, 'Play starts the replay at once');
  await idle();
  st = await state(); assert.deepEqual([st.shown, st.pos, st.misses], ['hop', 3, 0], 'the replay walks the strip and counts nothing');
  await page.evaluate(async () => { const L = neo.scene.game.L; const a = neo.scene.game.scrubArea.toGlobal({ x: L.practice.x + L.practice.w - 30, y: L.practice.y + 80 }); const b = neo.scene.game.scrubArea.toGlobal({ x: L.practice.x + 40, y: L.practice.y + 80 }); await kit.drag(kit.line([a.x, a.y], [b.x, b.y], 12)); });
  await page.waitForTimeout(200);
  st = await state(); assert.ok(st.pos < 1 && st.misses === 0, `scrubbing back moves the walker for free (pos ${st.pos})`);
  await tapNode(`${card('hop')}.face`, -70); await page.waitForTimeout(200);
  assert.equal((await state()).slot, 'hop', 'the hop card goes on the board');
  await tapNode('g.checkBtn'); await idle();
  st = await state(); assert.deepEqual([st.misses, st.slot], [1, null], 'a hop Check on walking marks is one miss and the card drops back');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(150);
  await page.evaluate(() => neo.scene.game.askForHint()); await idle();
  st = await state(); assert.deepEqual([st.hints, st.glow], [1, true], 'a requested hint counts once and lights the glow');
  await screenshot('trackway-tales-1');
  await playOut(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 1]);

  // Level 3, the authored puddle round: the bot replays every card and claims Can't tell, with nothing counted.
  await launch('trackway-tales', 3); await idle();
  n = await page.evaluate(() => kit.store.data.stickers.length);
  assert.equal((await state()).id, 'L3-pause');
  await tapNode(`${card('walk')}.face`, -70); await page.waitForTimeout(150);
  await tapNode('g.checkBtn'); await idle();
  st = await state(); assert.deepEqual([st.misses, st.slot], [0, null], 'a fitting card while another fits too is free');
  await playOut(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [0, 0]);

  // Level 3, the switch round (drawn by the seed): Can't tell is wrong there, one miss.
  for (let guard = 0; guard < 12; guard++) { await launch('trackway-tales', 3); await idle(); if ((await state()).id === 'L3-switch') break; }
  assert.equal((await state()).id, 'L3-switch', 'a switch round within twelve launches');
  n = await page.evaluate(() => kit.store.data.stickers.length);
  await tapNode(`${card('cant-tell')}.face`); await page.waitForTimeout(150);
  await tapNode('g.checkBtn'); await idle();
  assert.equal((await state()).misses, 1, "Can't tell when the marks do tell is one miss");
  await playOut(n);

  // Level 3 upright: the puddle, four cards and the board.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('trackway-tales', 3); await idle(); await page.waitForTimeout(300);
  await tapNode(`g.cards[0].play`); await page.waitForTimeout(900);
  await screenshot('trackway-tales-3-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, [], 'page errors');
  log("Trackway Tales: level 1 with a replay, a scrub, a wrong hop Check and a requested hint; level 3 Can't tell right and wrong; level 3 upright");
}

return { trackwayTalesPlay };
}
