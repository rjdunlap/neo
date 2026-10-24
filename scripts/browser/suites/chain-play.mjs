import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
async function chainPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('chain-reaction').history.at(-1); return [r.misses, r.hints]; });
  const readyMachine = (index) => page.waitForFunction((index) => { const g = neo.scene.game; return g.index === index && !g.busy; }, index, { timeout: 30000 });
  const put = (piece, socket) => page.evaluate(async ({ piece, socket }) => {
    const g = neo.scene.game;
    const p = g.diagram.toGlobal({ ...g.socketPosition(socket), y: g.socketPosition(socket).y + 40 });
    await kit.dragTo(g.parts[piece].node, p, 14);
    await kit.sleep(180);
  }, { piece, socket });
  const home = (piece) => page.evaluate(async (piece) => {
    const g = neo.scene.game, h = g.parts[piece].home;
    const p = g.diagram.toGlobal({ x: h.x, y: h.y + 40 });
    await kit.dragTo(g.parts[piece].node, p, 14);
    await kit.sleep(180);
  }, piece);
  const arrange = async (layout) => {
    for (let piece = 0; piece < layout.length; piece++) await home(piece);
    for (let piece = 0; piece < layout.length; piece++) await put(piece, layout[piece]);
  };

  // CHAIN_LEVELS=7 plays only tap-to-turn; the default plays 1, 6, 7, 8 and 9.
  const chainLevels = (process.env.CHAIN_LEVELS ?? '1,6,7,8,9').split(',').map(Number);
  const tapBell = (col) => page.evaluate(async (col) => {
    const g = neo.scene.game, b = g.bellNodes.find((n) => n.col === col).node.getGlobalPosition();
    await kit.tap(b.x, b.y - 10); await kit.sleep(150);
  }, col);
  if (chainLevels.includes(7)) {
    const stickers = await page.evaluate(() => kit.store.data.stickers.filter((s) => s.game === 'chain-reaction').length);
    await launch('chain-reaction', 7);
    for (let index = 0; index < 2; index++) {
      await readyMachine(index);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.turnNodes.length, neo.scene.game.parts.length]), [2, 0]);
      if (index === 0) {
        await tap('neo.scene.game.runButton');
        await readyMachine(index);
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0], 'a failed turn experiment is free');
        assert.ok(await page.evaluate(() => neo.scene.game.trail.bounds.width > 0), 'failed run leaves its trail');
        await tap('neo.scene.game.helpButton');
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.turnGlow !== null]), [0, 1, true]);
        await screenshot('chain-reaction-7');
      }
      for (let step = 0; step < 3; step++) {
        const piece = await page.evaluate(async () => {
          const g = neo.scene.game, { turnHint } = await import('/src/games/chain-reaction/logic.ts');
          return turnHint(g.machine, g.flipped);
        });
        if (piece === null) break;
        await tap(`neo.scene.game.turnNodes[${piece}]`);
        await page.waitForTimeout(200);
      }
      assert.equal(await page.evaluate(async () => { const g = neo.scene.game, { trace } = await import('/src/games/chain-reaction/logic.ts'); return trace(g.machine, [], g.flipped).success; }), true);
      await tap('neo.scene.game.runButton');
    }
    await finished('chain-reaction');
    assert.deepEqual(await score(), [0, 1]);
    assert.equal(await page.evaluate(() => kit.store.data.stickers.filter((s) => s.game === 'chain-reaction').length), stickers + 1);
    await launch('chain-reaction', 7); await readyMachine(0);
    await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
    assert.ok(await page.evaluate(() => {
      const g = neo.scene.game;
      return [...g.turnNodes, g.runButton, g.helpButton].every((node) => {
        const b = node.getBounds();
        return b.x >= 0 && b.y >= 0 && b.x + b.width <= innerWidth && b.y + b.height <= innerHeight;
      }) && g.turnNodes.every((n) => n.hitArea.width >= 100 && n.hitArea.height >= 100);
    }), 'portrait turn targets and controls fit and keep 100-unit areas');
    await screenshot('chain-reaction-7-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    log('Chain Reaction 7: free failed experiment, counted useful flip hint, real ramp taps, both machines, one sticker and portrait fit passed');
  }

  if (chainLevels.includes(8)) {
    const stickers = await page.evaluate(() => kit.store.data.stickers.filter((s) => s.game === 'chain-reaction').length);
    await launch('chain-reaction', 8);
    const machines = await page.evaluate(() => neo.scene.game.boards.length);
    assert.equal(machines, 3);
    for (let index = 0; index < machines; index++) {
      await readyMachine(index);
      const { target, bells } = await page.evaluate(() => ({ target: neo.scene.game.machine.target, bells: neo.scene.game.machine.bells }));
      assert.equal(bells.length, 3);
      assert.ok(await page.evaluate(() => neo.scene.game.parts.length === 0), 'nothing to place at level 8');
      if (index === 0) {
        // Running before predicting just asks for a bell; the help glows the start and counts nothing.
        await tap('neo.scene.game.runButton');
        await tap('neo.scene.game.helpButton');
        assert.ok(await page.evaluate(() => neo.scene.game.glow.bounds.width > 0), 'help glows the start cup');
        assert.ok(await page.evaluate(() => neo.scene.game.bellNodes.every((b) => { const r = b.node.getBounds(); return r.width >= 84 && b.node.hitArea.width >= 100 && b.node.hitArea.height >= 100; })), 'bells are large targets');
        await tapBell(bells.find((c) => c !== target));
        assert.notEqual(await page.evaluate(() => neo.scene.game.picked), null, 'a tapped bell is chosen');
        await screenshot('chain-reaction-8');
        await tap('neo.scene.game.runButton');
        await page.waitForFunction(() => neo.scene.game.trail.bounds.width > 0, null, { timeout: 15000 });
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0], 'another bell is not a miss');
      } else {
        await tapBell(target);
        assert.equal(await page.evaluate(() => neo.scene.game.picked), target);
        await tap('neo.scene.game.runButton');
      }
      await page.waitForFunction((index) => neo.scene.finished || neo.scene.game.index > index, index, { timeout: 30000 });
    }
    await finished('chain-reaction');
    assert.deepEqual(await score(), [0, 0]);
    assert.equal(await page.evaluate(() => kit.store.data.stickers.filter((s) => s.game === 'chain-reaction').length), stickers + 1);
    await launch('chain-reaction', 8); await readyMachine(0);
    await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
    assert.ok(await page.evaluate(() => {
      const g = neo.scene.game;
      return [...g.bellNodes.map((b) => b.node), g.runButton, g.helpButton].every((node) => { const b = node.getBounds(); return b.x >= 0 && b.y >= 0 && b.x + b.width <= innerWidth && b.y + b.height <= innerHeight; });
    }), 'portrait bells and controls fit');
    await screenshot('chain-reaction-8-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    log('Chain Reaction 8: run-before-predicting prompt, uncounted follow-the-marble help, a different bell rang without a miss and kept its trail, three predicted machines, one sticker, portrait fit passed');
  }

  if (chainLevels.includes(9)) {
    const stickers = await page.evaluate(() => kit.store.data.stickers.filter((s) => s.game === 'chain-reaction').length);
    await launch('chain-reaction', 9);
    const machines = await page.evaluate(() => neo.scene.game.boards.length);
    assert.equal(machines, 2);
    for (let index = 0; index < machines; index++) {
      await readyMachine(index);
      assert.ok(await page.evaluate(() => { const m = neo.scene.game.machine; return !!m.blue && m.blue.target !== m.target && neo.scene.game.blueBell !== null; }), 'two marbles, two bells');
      if (index === 0) {
        // A placement that rings one marble's bell while the other misses is a free experiment that leaves both trails.
        const oneOnly = await page.evaluate(async () => {
          const g = neo.scene.game, { traces } = await import('/src/games/chain-reaction/logic.ts');
          const n = g.machine.sockets.length;
          for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
            if (a === b) continue;
            const t = traces(g.machine, [a, b]);
            if (t[0].success !== t[1].success) return [a, b];
          }
          return null;
        });
        assert.ok(oneOnly, 'a one-marble placement exists');
        await arrange(oneOnly);
        await tap('neo.scene.game.runButton');
        await page.waitForFunction(() => neo.scene.game.busy, null, { timeout: 5000 });
        await readyMachine(index);
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0], 'a one-marble run is not a miss');
        assert.equal(await page.evaluate(() => neo.scene.game.lastTraces.length), 2, 'both marbles ran');
        assert.ok(await page.evaluate(() => neo.scene.game.trail.bounds.width > 0), 'the miss leaves its trails');
        await tap('neo.scene.game.helpButton');
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, !!neo.scene.game.hinted]), [0, 1, true]);
        await screenshot('chain-reaction-9');
      }
      const solution = await page.evaluate(() => neo.scene.game.machine.solution.slice());
      await arrange(solution);
      assert.equal(await page.evaluate(async () => { const g = neo.scene.game, { works } = await import('/src/games/chain-reaction/logic.ts'); return works(g.machine, g.placement); }), true);
      await tap('neo.scene.game.runButton');
      await page.waitForFunction((index) => neo.scene.finished || neo.scene.game.index > index, index, { timeout: 30000 });
    }
    await finished('chain-reaction');
    assert.deepEqual(await score(), [0, 1]);
    assert.equal(await page.evaluate(() => kit.store.data.stickers.filter((s) => s.game === 'chain-reaction').length), stickers + 1);
    await launch('chain-reaction', 9); await readyMachine(0);
    await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
    assert.ok(await page.evaluate(() => {
      const g = neo.scene.game;
      return [...g.parts.map((p) => p.node), g.runButton, g.helpButton, g.targetBell, g.blueBell, g.startCup].every((node) => { const b = node.getBounds(); return b.x >= 0 && b.y >= 0 && b.x + b.width <= innerWidth && b.y + b.height <= innerHeight; });
    }), 'portrait cups, bells, tray and controls fit');
    await screenshot('chain-reaction-9-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    log('Chain Reaction 9: one-marble experiment is free with both trails, a counted hint, both machines ring both bells, one sticker, portrait fit passed');
  }

  for (const level of [1, 6].filter((l) => chainLevels.includes(l))) {
    await launch('chain-reaction', level);
    const machines = await page.evaluate(() => neo.scene.game.boards.length);
    for (let index = 0; index < machines; index++) {
      await readyMachine(index);
      if (index === 0 && level === 1) {
        // Running with the piece still in its tray is explained, but it is not recorded as a mistake.
        await tap('neo.scene.game.runButton');
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
        assert.ok(await page.evaluate(() => !!neo.scene.game.hinted), 'the first machine begins with a glowing placement');
        await screenshot('chain-reaction-1');
      }
      if (index === 0 && level === 6) {
        const wrong = await page.evaluate(async () => {
          const g = neo.scene.game, { trace } = await import('/src/games/chain-reaction/logic.ts');
          const work = Array(g.machine.loose.length).fill(0);
          const go = (piece, used) => {
            if (piece === work.length) return trace(g.machine, work).success ? null : work.slice();
            for (let socket = 0; socket < g.machine.sockets.length; socket++) if (!used.has(socket)) {
              work[piece] = socket; used.add(socket);
              const found = go(piece + 1, used); if (found) return found;
              used.delete(socket);
            }
            return null;
          };
          return go(0, new Set());
        });
        assert.ok(wrong, 'there is an arrangement to revise');
        await arrange(wrong);
        await tap('neo.scene.game.runButton');
        await readyMachine(index);
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0], 'a failed experiment is not a miss');
        assert.ok(await page.evaluate(() => neo.scene.game.trail.bounds.width > 0), 'a missed run leaves its trail');
        await page.evaluate(() => { const g = neo.scene.game, p = g.diagram.toGlobal({ x: g.colX(g.machine.start), y: g.top - 25 }); kit.tap(p.x, p.y); });
        await page.waitForFunction(() => neo.scene.game.busy, null, { timeout: 5000 });
        await readyMachine(index);
        assert.ok(await page.evaluate(() => neo.scene.game.trail.bounds.width > 0), 'watching again keeps the trail');
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0], 'watching again counts nothing');
        await tap('neo.scene.game.helpButton');
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 1]);
        assert.ok(await page.evaluate(() => !!neo.scene.game.hinted), 'help glows one ramp and socket');
        await screenshot('chain-reaction-6');
      }
      const solution = await page.evaluate(() => neo.scene.game.machine.solution.slice());
      await arrange(solution);
      assert.equal(await page.evaluate(async () => { const g = neo.scene.game, { trace } = await import('/src/games/chain-reaction/logic.ts'); return trace(g.machine, g.placement).success; }), true);
      await tap('neo.scene.game.runButton');
      await page.waitForFunction((index) => neo.scene.finished || neo.scene.game.index > index, index, { timeout: 30000 });
    }
    await finished('chain-reaction');
    assert.deepEqual(await score(), level === 1 ? [0, 0] : [0, 1]);
    assert.ok(await page.evaluate(() => kit.store.data.stickers.some((s) => s.game === 'chain-reaction')));
    log(`Chain Reaction ${level}: large-piece dragging, ${level === 1 ? 'starting glow and incomplete run' : 'failed experiment, explicit hint, chime'}, replay, two machines, saved score and sticker passed`);
  }

  // The tallest board keeps its controls, tray and sockets on screen in portrait.
  if (!chainLevels.includes(6)) return void assert.deepEqual(errors, []);
  await launch('chain-reaction', 6); await readyMachine(0);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.ok(await page.evaluate(() => {
    const g = neo.scene.game;
    return [...g.parts.map((p) => p.node), g.runButton, g.helpButton].every((node) => { const b = node.getBounds(); return b.x >= 0 && b.y >= 0 && b.x + b.width <= innerWidth && b.y + b.height <= innerHeight; });
  }), 'portrait controls and pieces fit');
  await screenshot('chain-reaction-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
}

return { chainPlay };
}
