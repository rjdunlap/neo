import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function gadgetBenchPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('gadget-bench').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.busy && !neo.scene.game.showing), null, { timeout: 30000 }); await page.waitForTimeout(200); };
  const tapOn = async (expr) => { await page.evaluate((expr) => kit.tapOn(Function(`return (${expr})`)()), expr); await page.waitForTimeout(200); };
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { round: g.roundIndex, strip: g.strip.map((e) => e.failedAt), glow: g.tally.glowing, gadget: { ...g.gadget }, path: [...g.round.path], passing: g.round.pair ? g.round.pair.passing : null, finished: neo.scene.finished === true }; });
  /** Drag a tray part onto a socket by its real pointer path. */
  const dragPart = async (id, socket) => {
    await page.evaluate(async ([id, socket]) => {
      const g = neo.scene.game;
      const part = g.parts.find((p) => p.id === id);
      const to = g.socketNodes.get(socket).getGlobalPosition();
      await kit.dragTo(part.node, { x: to.x, y: to.y + 20 }, 14);
    }, [id, socket]);
    await page.waitForTimeout(400);
  };
  const help = () => page.evaluate(() => neo.scene.game.nextHelp());
  const buildAndGive = async () => {
    for (let guard = 0; guard < 4; guard++) {
      const h = await help();
      if (h.kind !== 'install') break;
      await dragPart(h.part, h.socket);
    }
    assert.equal((await help()).kind, 'done', 'the cart passes after the needed parts are in');
    await tapOn('neo.scene.game.giveButton'); await settle();
  };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1: a free Try of the failing gadget, a wrong Give (one miss), then the right one; rounds 2–3 given straight.
  await launch('gadget-bench', 1);
  await settle();
  let s = await state();
  assert.equal(s.passing, 0, 'the authored first round puts the passing gadget on the left');
  assert.deepEqual(s.path, ['smooth', 'rain'], 'the authored first round is rain');
  await tapOn('neo.scene.game.boardNodes[1]'); await settle();
  s = await state();
  assert.deepEqual(s.strip, ['rain'], 'the failing Try stops at the rain and leaves a strip picture');
  assert.deepEqual(await tally(), [0, 0], 'a failing Try is free');
  await tapOn('neo.scene.game.handNodes[1]'); await settle();
  assert.deepEqual(await tally(), [1, 0], 'a failing Give is one miss');
  assert.equal((await state()).round, 0, 'the round goes on after a miss');
  await tapOn('neo.scene.game.handNodes[0]'); await settle();
  assert.equal((await state()).round, 1, 'the passing Give ends the round');
  for (let r = 1; r < 3; r++) {
    const passing = (await state()).passing;
    await tapOn(`neo.scene.game.handNodes[${passing}]`); await settle();
  }
  await finished('gadget-bench');
  assert.deepEqual(await score(), [1, 0], 'level 1 saves one miss, no hints');

  // Level 2: the pet's demonstration, a free failing Try of the unchanged cart, the swap by a real drag, a passing Give.
  await launch('gadget-bench', 2);
  await settle();
  s = await state();
  assert.deepEqual(s.gadget, { under: 'wheels' }, 'the pet left the big wheels under the cart');
  assert.deepEqual(s.path, ['smooth', 'puddle'], 'the authored first pair is bump then puddle');
  await tapOn('neo.scene.game.tryButton'); await settle();
  s = await state();
  assert.deepEqual(s.strip, ['puddle'], 'the unchanged cart stops at the puddle');
  assert.deepEqual(await tally(), [0, 0], 'that Try is free');
  await dragPart('float', 'under');
  s = await state();
  assert.deepEqual(s.gadget, { under: 'float' }, 'dropping the float on the wheels swaps them');
  await tapOn('neo.scene.game.giveButton'); await settle();
  assert.equal((await state()).round, 1, 'the changed cart passes and the round ends');
  for (let r = 1; r < 3; r++) await buildAndGive();
  await finished('gadget-bench');
  assert.deepEqual(await score(), [0, 0], 'level 2 saves no misses and no hints');

  // Level 3: a swapped placement Try (position matters), a portrait screenshot, Show a hint (one hint), the right build, Give.
  await launch('gadget-bench', 3);
  await settle();
  s = await state();
  assert.deepEqual(s.path, ['smooth', 'rain', 'dark'], 'the authored first round is rain then dark');
  await dragPart('umbrella', 'front');
  await dragPart('lantern', 'top');
  assert.deepEqual((await state()).gadget, { front: 'umbrella', top: 'lantern' }, 'both parts sit in the wrong sockets');
  await tapOn('neo.scene.game.tryButton'); await settle();
  s = await state();
  assert.deepEqual(s.strip, ['rain'], 'the swapped build stops at the rain');
  assert.deepEqual(await tally(), [0, 0], 'a failing Try is free');
  await screenshot('gadget-bench-3-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('gadget-bench-3-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await page.evaluate(() => neo.scene.game.askForHint()); await settle();
  s = await state();
  assert.deepEqual(await tally(), [0, 1], 'Show a hint counts one hint');
  assert.equal(s.gadget.top, 'umbrella', 'the hint puts the umbrella on top');
  assert.equal(s.gadget.front, undefined, 'the umbrella left the front socket');
  await dragPart('lantern', 'front');
  assert.deepEqual((await state()).gadget, { top: 'umbrella', front: 'lantern' }, 'the lantern goes at the front');
  await tapOn('neo.scene.game.tryButton'); await settle();
  assert.equal((await state()).strip.at(-1), null, 'the right build gets all the way along');
  await tapOn('neo.scene.game.giveButton'); await settle();
  assert.equal((await state()).round, 1, 'the Give ends the round');
  for (let r = 1; r < 3; r++) await buildAndGive();
  await finished('gadget-bench');
  assert.deepEqual(await score(), [0, 1], 'level 3 saves no misses and one hint');
  log('Gadget Bench 1–3: a free failing Try and a wrong Give, the swap, a swapped placement, Show a hint, portrait, passed');
}
return { gadgetBenchPlay };
}
