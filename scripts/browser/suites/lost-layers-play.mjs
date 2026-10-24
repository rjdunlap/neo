import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
async function lostLayersPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, misses: g.misses, hints: g.hints, rows: g.state.rows.join(','), stamped: g.state.stamped.length, looked: g.state.looked, open: g.open, slot: g.slot }; });
  const idle = () => page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, { timeout: 20000 });
  const sticker = (n) => page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });
  const tapNode = (expr) => page.evaluate((expr) => { const g = neo.scene.game; const n = new Function('g', `return ${expr}`)(g); const p = n.getGlobalPosition(); kit.tap(p.x, p.y); }, expr);
  const dragNode = (expr, to) => page.evaluate(async ([expr, to]) => {
    const g = neo.scene.game; const n = new Function('g', `return ${expr}`)(g);
    const a = n.getGlobalPosition(); const b = neo.scene.game.pieces[0].node.parent.toGlobal({ x: to.x, y: to.y + 40 });
    await kit.drag(kit.line([a.x, a.y], [b.x, b.y], 10));
  }, [expr, to]);
  const botStep = () => page.evaluate(async () => {
    const g = neo.scene.game;
    if (!g || g.finished) { await kit.sleep(150); return 'done'; }
    const it = g.autotouch();
    if (!it) { await kit.sleep(150); return 'wait'; }
    const at = (s) => s.on.toGlobal({ x: s.x ?? 0, y: s.y ?? 0 });
    if (it.tap) { const p = at(it.tap); kit.tap(p.x, p.y); }
    else if (it.drag) { const a = at(it.drag); const b = it.to.on.toGlobal({ x: it.to.x, y: it.to.y + 40 }); await kit.drag(kit.line([a.x, a.y], [b.x, b.y], 10)); }
    await kit.sleep(500);
    return 'move';
  });
  const playOut = async (n) => { for (let guard = 0; guard < 60 && !(await page.evaluate(() => neo.scene.finished)); guard++) await botStep(); await sticker(n); };
  const rowAt = (r) => page.evaluate((r) => { const g = neo.scene.game; const L = g.L; return { x: L.coveX + 90, y: L.bottom - (r - 0.5) * 100 }; }, r);

  // Level 1: the authored round. It fits with the lower wavy line squeezed, then row 3, then claim that story while the other still fits.
  await launch('lost-layers', 1); await idle();
  let n = await page.evaluate(() => kit.store.data.stickers.length);
  let st = await state(); assert.equal(st.rows, '1,2,6', 'the mud starts squeezing the lower wavy line');
  await tapNode('g.actionBtn'); await idle();
  st = await state(); assert.deepEqual([st.misses, st.stamped], [1, 0], 'It fits with a red band is one miss');
  await tapNode('g.cantTellBtn'); await page.waitForTimeout(200);
  assert.equal((await state()).misses, 1, "Can't tell is hidden before a card and counts nothing");
  await dragNode('g.pieces[1].node', await rowAt(3)); await page.waitForTimeout(700);
  assert.equal((await state()).rows, '1,3,6', 'the mud snaps to row 3');
  await tapNode('g.actionBtn'); await idle();
  assert.equal((await state()).stamped, 1, 'the first story card stamps');
  await screenshot('lost-layers-1');
  await tapNode('g.cantTellBtn'); await idle();
  assert.equal((await state()).misses, 1, "Can't tell with one card is free");
  await tapNode('g.cards[0].node'); await idle();
  st = await state(); assert.deepEqual([st.misses, st.stamped, st.rows], [2, 2, '1,4,6'], 'one story while the other fits: a miss, and the other fit stamps with help');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(150);
  await page.evaluate(() => neo.scene.game.askForHint());
  assert.equal((await state()).hints, 1, 'a requested hint counts once');
  await playOut(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [2, 1]);

  // Level 2: the authored stripe round. The wavy look first (one miss), then the bot makes the mud look and claims.
  await launch('lost-layers', 2); await idle();
  n = await page.evaluate(() => kit.store.data.stickers.length);
  await tapNode("g.looks.find((l) => l.look === 'lens-wavy').node"); await page.waitForTimeout(300);
  assert.equal((await state()).misses, 0, 'a tapped look card only previews');
  await dragNode("g.looks.find((l) => l.look === 'lens-wavy').node", await page.evaluate(() => neo.scene.game.L.slot));
  await page.waitForTimeout(600);
  assert.equal((await state()).slot, 'lens-wavy', 'the wavy look goes in the slot');
  await tapNode('g.actionBtn'); await idle();
  st = await state(); assert.deepEqual([st.misses, st.looked, st.slot], [1, false, null], 'the wavy look cannot help: one miss, the slot frees');
  await playOut(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 0]);

  // Level 2 upright, the lens open on the mud.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('lost-layers', 2); await idle(); await page.waitForTimeout(300);
  for (let guard = 0; guard < 10 && !(await state()).open; guard++) await botStep();
  await page.waitForTimeout(600);
  assert.equal((await state()).open, 'lens-mud', 'the lens is open on the mud');
  await screenshot('lost-layers-2-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, [], 'page errors');
  log('Lost Layers: level 1 with a red It fits, a one-story claim and a requested hint, level 2 with an uninformative look, level 2 upright with the lens');
}

return { lostLayersPlay };
}
