import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished }) {
/** Meadow Pens: level 1 with an empty ring (uncounted), a three-square pen for four (a miss), a requested hint and the supported finish; level 2 with one wrong card (the row-by-row fill); level 3 with a straight six (the wrong fence), a requested hint and a portrait screenshot; every other pen by real taps on the ghost finger's path. */
async function meadowPlay() {
  if (process.env.MEADOW_LEVELS) {
    const levels = process.env.MEADOW_LEVELS.split(',').map(Number);
    assert.ok(levels.length && levels.every((n) => n === 4 || n === 5), 'MEADOW_LEVELS supports 4,5');
    return fixedPlay(levels);
  }
  const score = () => page.evaluate(() => { const r = kit.store.stats('meadow-pens').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
  const settle = async () => { await page.waitForTimeout(300); await page.waitForFunction(() => neo.scene.finished || neo.scene.game.finished || !neo.scene.game.busy, null, { timeout: 30000 }); await page.waitForTimeout(250); };
  const tapCell = (x, y) => page.evaluate(async ({ x, y }) => {
    const L = await import('/src/games/meadow-pens/logic.ts');
    const g = neo.scene.game;
    const p = g.board.toGlobal(L.centre(L.cellRect(g.lay, L.cellOf(x, y))));
    kit.tap(p.x, p.y);
  }, { x, y });
  const ring = async () => { await page.evaluate(() => kit.tapOn(neo.scene.game.bell)); await settle(); };
  const playOut = async () => {
    for (let i = 0; i < 120; i++) {
      await settle();
      if (await page.evaluate(() => neo.scene.finished || neo.scene.game.finished)) break;
      await page.evaluate(() => {
        const g = neo.scene.game;
        const t = g.autotouch();
        if (!t) return;
        if (t.tap.on === g.board) { const p = g.board.toGlobal({ x: t.tap.x, y: t.tap.y }); kit.tap(p.x, p.y); }
        else kit.tapOn(t.tap.on);
      });
      await page.waitForTimeout(150);
    }
  };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await launch('meadow-pens', 1);
  await settle();
  await ring();
  assert.deepEqual(await tally(), [0, 0], 'an empty ring is free');
  for (const [x, y] of [[1, 1], [2, 1], [3, 1]]) { await tapCell(x, y); await page.waitForTimeout(120); }
  assert.equal(await page.evaluate(() => neo.scene.game.painted.length), 3);
  await ring();
  assert.deepEqual(await tally(), [1, 0], 'three squares for four is one miss');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(300);
  assert.deepEqual([...await tally(), await page.evaluate(() => neo.scene.game.tally.glowing)], [1, 1, true], 'Show a hint glows and counts once');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(200);
  assert.deepEqual(await tally(), [1, 1], 'asking again counts nothing');
  await page.evaluate(() => kit.tapOn(neo.scene.game.bell));
  await page.waitForFunction(() => neo.scene.game.index === 1 || neo.scene.finished, null, { timeout: 20000 });
  await playOut();
  await finished('meadow-pens');
  assert.deepEqual(await score(), [1, 1]);
  await launch('meadow-pens', 2);
  await settle();
  await page.evaluate(() => { const g = neo.scene.game; kit.tapOn(g.cards.find((c) => c.value !== g.task.field.right)); });
  await settle();
  assert.deepEqual(await tally(), [1, 0], 'a wrong card is one miss');
  assert.equal(await page.evaluate(() => neo.scene.game.painted.length), 6, 'the wrong card fills the field row by row');
  await playOut();
  await finished('meadow-pens');
  assert.deepEqual(await score(), [1, 0]);
  await launch('meadow-pens', 3);
  await settle();
  for (let x = 0; x < 6; x++) { await tapCell(x, 0); await page.waitForTimeout(120); }
  await ring();
  assert.deepEqual(await tally(), [1, 0], 'six in a line needs fourteen pieces, not ten: one miss');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(300);
  assert.deepEqual(await tally(), [1, 1]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('meadow-pens-3-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  await playOut();
  await finished('meadow-pens');
  assert.deepEqual(await score(), [1, 1]);
  await fixedPlay([4, 5]);
  log('Meadow Pens 1-3: empty ring free, short pen miss, requested glow and supported finish, wrong card fill, wrong fence miss, portrait, saved scores passed');
}


async function fixedPlay(levels) {
  const settle = async () => {
    await page.waitForTimeout(180);
    await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 45000 });
    await page.waitForTimeout(170);
  };
  const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
  const choose = async (wrong = false) => {
    await page.evaluate(async (wrong) => {
      const { correctChoice } = await import('/src/games/meadow-pens/logic.ts');
      const g = neo.scene.game, right = correctChoice(g.task);
      kit.tapOn(g.cards.find((c) => (c.value === right) !== wrong));
    }, wrong);
    await settle();
  };
  const replay = async (p) => {
    await page.evaluate(async (p) => {
      const { centre, cellRect } = await import('/src/games/meadow-pens/logic.ts');
      const g = neo.scene.game, target = g.partTargets[p];
      const at = target.toGlobal(centre(cellRect(g.lay, g.task.parts[p][0]))); kit.tap(at.x, at.y);
    }, p);
    await settle();
  };
  for (const level of levels) {
    await launch('meadow-pens', level); await settle();
    assert.equal(await page.evaluate(() => neo.scene.game.task.id), level === 4 ? 'C1' : 'L1');
    await replay(0); await replay(1); assert.deepEqual(await tally(), [0, 0]);
    await choose(true); assert.deepEqual(await tally(), [1, 0]);
    await choose(true); assert.deepEqual(await tally(), [2, 1]);
    await page.evaluate(() => neo.scene.game.restart()); await settle();
    assert.deepEqual(await tally(), [2, 1]);
    await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => neo.scene.game.lay.tall), true);
    await screenshot(`meadow-pens-${level}-portrait`);
    await choose(true); assert.equal(await page.evaluate(() => neo.scene.game.index), 1, 'supported wrong card completes');
    assert.deepEqual(await tally(), [2, 1]);
    // Second question, now manual support; repeat help remains capped for this question.
    await page.evaluate(() => neo.scene.game.askForHint()); await settle();
    await page.evaluate(() => neo.scene.game.askForHint()); await settle();
    assert.deepEqual(await tally(), [2, 2]);
    await choose(true);
    await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
    for (let q = 2; q < 5; q++) { await choose(); }
    await finished('meadow-pens');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('meadow-pens').history.at(-1); return [r.misses, r.hints]; }), [2, 2]);
    if (level === 5) {
      // Exercise the largest authored field and the one-cell part through actual input at their full size.
      await launch('meadow-pens', 5); await settle();
      await page.evaluate(async () => {
        const { BENT_FIELDS, bentParts, fenceEdges } = await import('/src/games/meadow-pens/logic.ts');
        const g = neo.scene.game;
        g.tasks[0] = { kind: 'parts', id: 'L6', parts: bentParts(BENT_FIELDS[5]), cards: [18, 20, 24] }; g.build();
      }); await page.waitForTimeout(200);
      await replay(0); await replay(1); await choose();
      await page.evaluate(async () => {
        const { BENT_FIELDS, bentParts } = await import('/src/games/meadow-pens/logic.ts'); const g = neo.scene.game;
        g.tasks[g.index] = { kind: 'parts', id: 'L3', parts: bentParts(BENT_FIELDS[2]), cards: [10, 14, 12] }; g.build();
      }); await page.waitForTimeout(200);
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => { const g = neo.scene.game, c = g.task.parts[1][0]; return g.task.parts[1].length === 1 && g.partTargets[1].hitArea.contains(g.lay.grid.x + Math.floor(c / 6) * 106 + 50, g.lay.grid.y + c % 6 * 106 + 50); }), true);
      await replay(1); assert.deepEqual(await tally(), [0, 0]);
      await choose(); await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
      for (let q = 2; q < 5; q++) await choose(); await finished('meadow-pens');
    }
    log(`Meadow Pens ${level}: five questions, free counts, auto/manual capped hints, restart/resize, assisted cards and finish passed`);
  }
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; neo.go.land('rainbow-meadow'); });
  await scene('LandScene');
  // The existing land pages preserve full-sized landmarks; find this game's page.
  while (await page.evaluate(() => neo.scene.prevArrow?.visible)) { await page.evaluate(() => kit.tapOn(neo.scene.prevArrow)); await page.waitForTimeout(400); }
  while (await page.evaluate(() => !neo.scene.showing.some(m => m.mod.id === 'meadow-pens') && neo.scene.nextArrow?.visible)) { await page.evaluate(() => kit.tapOn(neo.scene.nextArrow)); await page.waitForTimeout(400); }
  const originPage = await page.evaluate(() => neo.scene.page);
  await page.evaluate(() => kit.tapOn(neo.scene.showing.find(m => m.mod.id === 'meadow-pens').node));
  await scene('GameScene');
  assert.ok([4, 5].includes(await page.evaluate(() => neo.scene.level)));
  await page.evaluate(() => neo.scene.home.press()); await scene('LandScene');
  assert.equal(await page.evaluate(() => neo.scene.page), originPage);
  log('Meadow Pens: Rainbow Meadow paging, school launch and return origin passed');
}

return { meadowPlay };
}
