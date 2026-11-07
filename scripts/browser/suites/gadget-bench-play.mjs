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
  // BENCH_LEVELS=4 plays only those levels (level 4 is Fix-It Day, 5 Little Gate, 6 New Box).
  const only = (process.env.BENCH_LEVELS ?? '').split(',').filter(Boolean).map(Number);
  const wants = (level) => only.length === 0 || only.includes(level);
  let s;

  if (wants(1)) {
  // Level 1: a free Try of the failing gadget, a wrong Give (one miss), then the right one; rounds 2–3 given straight.
  await launch('gadget-bench', 1);
  await settle();
  s = await state();
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
  }
  if (wants(2)) {

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
  }
  if (wants(3)) {

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

  if (wants(4)) {
  // Level 4: yesterday's cart rolls in; a free Try stops at the new puddle, the obvious fix (the float) stops at the bump
  // and speaks the conflict line, a failing Give is a miss, then the paddle wheels pass. Portrait screenshot.
  await launch('gadget-bench', 4);
  await page.evaluate(() => {
    const g = neo.scene.game;
    window.benchSpoken = [];
    const say = g.ctx.say.bind(g.ctx);
    g.ctx.say = (id, ...args) => { window.benchSpoken.push(id); return say(id, ...args); };
  });
  await settle();
  s = await state();
  assert.deepEqual(s.path, ['smooth', 'bump', 'puddle', 'dark'], "the authored first round is today's longer path");
  assert.deepEqual(s.gadget, { under: 'wheels', front: 'lantern' }, "yesterday's cart is on the bench");
  await tapOn('neo.scene.game.tryButton'); await settle();
  assert.deepEqual((await state()).strip, ['puddle'], 'the cart as given stops at the new puddle');
  assert.deepEqual(await tally(), [0, 0], 'that Try is free');
  await dragPart('float', 'under');
  assert.deepEqual((await state()).gadget, { under: 'float', front: 'lantern' }, 'the float swaps in for the big wheels');
  await tapOn('neo.scene.game.tryButton'); await settle();
  assert.equal((await state()).strip.at(-1), 'bump', 'the obvious fix stops at the bump');
  const spoken = await page.evaluate(() => window.benchSpoken);
  assert.equal(spoken.filter((id) => id === 'bench.conflict').length, 1, 'the conflict line is spoken once');
  assert.deepEqual(await tally(), [0, 0], 'the conflict line counts nothing');
  await tapOn('neo.scene.game.giveButton'); await settle();
  assert.deepEqual(await tally(), [1, 0], 'a failing Give is one miss');
  assert.deepEqual(await help(), { kind: 'install', part: 'paddles', socket: 'under', replaces: 'float', at: 'bump' }, 'help names the paddle wheels');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('gadget-bench-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await dragPart('paddles', 'under');
  assert.deepEqual((await state()).gadget, { under: 'paddles', front: 'lantern' }, 'the paddle wheels go underneath');
  await tapOn('neo.scene.game.tryButton'); await settle();
  assert.equal((await state()).strip.at(-1), null, 'the paddle wheels get all the way along');
  await tapOn('neo.scene.game.giveButton'); await settle();
  assert.equal((await state()).round, 1, 'the Give ends the round');
  for (let r = 1; r < 3; r++) await buildAndGive();
  await finished('gadget-bench');
  assert.deepEqual(await score(), [1, 0], 'level 4 saves one miss and no hints');
  log('Gadget Bench 4: yesterday\'s cart, a free stop at the new condition, the conflict line, a failing Give, the paddle wheels, portrait, passed');
  }

  if (wants(5)) {
  // Level 5: the familiar cart crosses the bump and the dark, then stops at the little gate (free, portrait screenshot of
  // the stop); help swaps in the roller belt and the low cart passes.
  await launch('gadget-bench', 5);
  await settle();
  s = await state();
  assert.deepEqual(s.path, ['smooth', 'bump', 'dark', 'gate'], 'the authored first round ends at the little gate');
  await dragPart('wheels', 'under');
  await dragPart('lantern', 'front');
  assert.deepEqual((await state()).gadget, { under: 'wheels', front: 'lantern' }, 'the familiar cart is built');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await tapOn('neo.scene.game.tryButton');
  await page.waitForTimeout(1700);
  await screenshot('gadget-bench-5-gate-portrait');
  await settle();
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  assert.deepEqual((await state()).strip, ['gate'], 'the familiar cart stops at the little gate');
  assert.deepEqual(await tally(), [0, 0], 'that Try is free');
  assert.deepEqual(await help(), { kind: 'install', part: 'rollers', socket: 'under', replaces: 'wheels', at: 'gate' }, 'help names the low twin');
  await dragPart('rollers', 'under');
  await tapOn('neo.scene.game.tryButton'); await settle();
  assert.equal((await state()).strip.at(-1), null, 'the low cart gets all the way to the gate');
  // The flag rides along on top: it does nothing there, but it is too tall, and Show a hint takes it out.
  await dragPart('flag', 'top');
  await tapOn('neo.scene.game.tryButton'); await settle();
  assert.equal((await state()).strip.at(-1), 'gate', 'the flag on top stops the cart at the gate');
  assert.deepEqual(await help(), { kind: 'out', part: 'flag', socket: 'top', at: 'gate' }, 'help takes the flag out');
  await page.evaluate(() => neo.scene.game.askForHint()); await settle();
  assert.deepEqual((await state()).gadget, { under: 'rollers', front: 'lantern' }, 'the flag went back to the tray');
  assert.deepEqual(await tally(), [0, 1], 'Show a hint counts one hint');
  await tapOn('neo.scene.game.giveButton'); await settle();
  assert.equal((await state()).round, 1, 'the Give ends the round');
  for (let r = 1; r < 3; r++) await buildAndGive();
  await finished('gadget-bench');
  assert.deepEqual(await score(), [0, 1], 'level 5 saves no misses and one hint');
  log('Gadget Bench 5: the familiar cart stops free at the little gate, portrait, the roller belt passes, the flag taken out by a hint, rounds 2–3, passed');
  }

  if (wants(6)) {
  // Level 6: the pet's cart crosses, its parts ride home, a new box arrives; the glow stones where the lantern hung fail a
  // Give (one miss), then on top they pass.
  await launch('gadget-bench', 6);
  await page.evaluate(() => {
    const g = neo.scene.game;
    window.benchSpoken = [];
    const say = g.ctx.say.bind(g.ctx);
    g.ctx.say = (id, ...args) => { window.benchSpoken.push(id); return say(id, ...args); };
  });
  await settle();
  s = await state();
  assert.deepEqual(s.path, ['smooth', 'bump', 'dark'], 'the authored first round is the bump and the dark');
  assert.deepEqual(s.gadget, {}, 'the bench is empty after the old parts went home');
  assert.deepEqual(await page.evaluate(() => neo.scene.game.parts.map((p) => p.id)), ['rollers', 'glowstones', 'raft', 'lid'], 'the tray is the new box');
  assert.ok((await page.evaluate(() => window.benchSpoken)).includes('bench.newkit'), 'the pet says the parts went home');
  assert.deepEqual(await tally(), [0, 0], 'the shown cart counts nothing');
  await dragPart('rollers', 'under');
  await dragPart('glowstones', 'front');
  await tapOn('neo.scene.game.giveButton'); await settle();
  assert.equal((await state()).strip.at(-1), 'dark', 'the glow stones where the lantern hung stop at the dark');
  assert.deepEqual(await tally(), [1, 0], 'a failing Give is one miss');
  assert.deepEqual(await help(), { kind: 'install', part: 'glowstones', socket: 'top', replaces: null, at: 'dark' }, 'help puts the glow stones on top');
  await dragPart('glowstones', 'top');
  await tapOn('neo.scene.game.tryButton'); await settle();
  assert.equal((await state()).strip.at(-1), null, 'the new box cart gets all the way along');
  await tapOn('neo.scene.game.giveButton'); await settle();
  assert.equal((await state()).round, 1, 'the Give ends the round');
  for (let r = 1; r < 3; r++) await buildAndGive();
  await finished('gadget-bench');
  assert.deepEqual(await score(), [1, 0], 'level 6 saves one miss and no hints');
  log('Gadget Bench 6: the pet\'s cart, the new box, the glow stones at the front as a miss, then on top, rounds 2–3, passed');
  }
}
return { gadgetBenchPlay };
}
