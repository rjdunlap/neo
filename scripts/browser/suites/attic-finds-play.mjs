import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
/** Attic Finds by touch: level 1 with a free prediction and two wrong picks (a glow, one hint, no misses); level 2 with one unsupported Check (one miss) and a requested hint; level 2 upright with the magnifier open. */
async function atticFindsPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, misses: g.misses, hints: g.hints, side: g.side, open: g.open, index: g.index, tried: g.state.tried, slot: g.state.slot }; });
  const idle = () => page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy && !neo.scene.game.flipping && neo.scene.game.turnT === null), null, { timeout: 20000 });
  const sticker = (n) => page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });
  // Real touches: a spot on the attic thing, a card, a chip, Turn or Check.
  const tapSpot = (x, y) => page.evaluate(([x, y]) => { const p = neo.scene.game.objNode.toGlobal({ x, y }); kit.tap(p.x, p.y); }, [x, y]);
  const tapNode = (expr) => page.evaluate((expr) => { const g = neo.scene.game; const n = new Function('g', `return ${expr}`)(g); const p = n.getGlobalPosition(); kit.tap(p.x, p.y); }, expr);
  // One move of the game's own bot, played as real touches.
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
  const playOut = async (n) => { for (let guard = 0; guard < 120 && !(await page.evaluate(() => neo.scene.finished)); guard++) await botStep(); await sticker(n); };

  // Level 1: the authored bird box, front first. Look at the star, turn it, guess wrong (free), pick wrong twice (glow, one hint).
  await launch('attic-finds', 1); await idle();
  let n = await page.evaluate(() => kit.store.data.stickers.length);
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.cur.object, neo.scene.game.side]), ['bird-box', 'front'], 'the authored first find');
  await tapSpot(-45, 40); await page.waitForTimeout(300);
  assert.equal((await state()).open, 'bird-box:star', 'the star opens in the magnifier');
  await tapNode('g.turnBtn'); await page.waitForTimeout(600);
  assert.equal((await state()).side, 'back', 'Turn shows the back');
  await tapNode("g.cards.find((c) => c.effect === 'roll').node"); await idle();
  let st = await state(); assert.deepEqual([st.tried, st.misses, st.hints], [true, 0, 0], 'a prediction is free');
  await tapNode("g.cards.find((c) => c.effect === 'roll').node"); await idle();
  await tapNode("g.cards.find((c) => c.effect === 'roll').node"); await idle();
  st = await state(); assert.deepEqual([st.misses, st.hints], [0, 1], 'two wrong picks glow the right card once and never miss');
  await playOut(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [0, 1]);

  // Level 2: the authored fish churn. Look at the door, slot it, Check (one miss); a requested hint glows the rod once.
  await launch('attic-finds', 2); await idle();
  n = await page.evaluate(() => kit.store.data.stickers.length);
  const door = "g.chips.find((c) => c.clue === 'fish-churn:door').node";
  await tapNode('g.checkBtn'); await page.waitForTimeout(300);
  assert.equal((await state()).misses, 0, 'Check with an empty slot is free');
  await tapNode(door); await page.waitForTimeout(400);
  assert.equal((await state()).open, 'fish-churn:door', 'a "?" chip opens its part');
  await tapNode(door); await page.waitForTimeout(500);
  assert.equal((await state()).slot, 'fish-churn:door', 'a looked-at chip goes in the slot');
  await tapNode('g.checkBtn'); await idle();
  st = await state(); assert.deepEqual([st.misses, st.hints, st.slot], [1, 0, null], 'the door does not prove it: one miss, chip back');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(150);
  await page.evaluate(() => neo.scene.game.askForHint());
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 1], 'a requested hint counts once');
  await playOut(n);
  st = await state(); assert.deepEqual([st.misses, st.hints], [1, 1]);

  // Level 2 upright, the magnifier open on the rod.
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('attic-finds', 2); await idle(); await page.waitForTimeout(300);
  await tapNode("g.chips.find((c) => c.clue.endsWith(':rod')).node"); await idle(); await page.waitForTimeout(500);
  assert.match((await state()).open ?? '', /:rod$/, 'the rod is in the magnifier');
  await screenshot('attic-finds-2-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, [], 'page errors');
  log('Attic Finds: level 1 with a free guess and two wrong picks, level 2 with an unsupported Check and a requested hint, level 2 upright');
}

return { atticFindsPlay };
}
