import assert from 'node:assert/strict';

export function createSuite({ page, ready, scene, finished, screenshot, log }) {
  const id = 'harbor-orders';
  const portrait = { width: 390, height: 625 };
  const landscape = { width: 625, height: 390 };

  async function tap(path) {
    const at = await page.evaluate((path) => {
      const node = Function(`return (${path})`)();
      const { x, y } = node.toGlobal({ x: 0, y: 0 });
      return { x, y };
    }, path);
    await page.touchscreen.tap(at.x, at.y);
    await page.waitForTimeout(145);
  }

  const tapButton = (i) => tap(`neo.scene.game.buttons[${i}].node`);
  const tapSquare = (i, j) => tap(`neo.scene.game.squares[${i}][${j}].node`);
  const state = () =>
    page.evaluate(() => {
      const { board, plan, credit, hint, noteText } = neo.scene.game;
      return { ...board, plan, score: credit.score, hint, noteText };
    });
  const stickers = () =>
    page.evaluate((id) => kit.store.data.stickers.filter((s) => s.game === id).length, id);
  const lastRound = () =>
    page.evaluate((id) => {
      const { misses, hints, level } = kit.store.stats(id).history.at(-1);
      return { misses, hints, level };
    }, id);

  async function open(level) {
    await page.setViewportSize(landscape);
    await page.evaluate(
      ({ id, level }) => {
        kit.store.entry.birth = null;
        kit.store.entry.startBand = kit.store.data.profile.band = 'grownup';
        kit.store.stats(id).pinned = level;
        kit.store.data.settings.showWords = true;
        kit.store.data.settings.howToCards = false;
        neo.go.hub();
      },
      { id, level },
    );
    await scene('MapScene');
    await tap("neo.scene.lands.find(({ def }) => def.id === 'lantern-lake').node");
    await scene('LandScene');
    for (let i = 0; i < 12; i++) {
      const selection = await page.evaluate(
        (id) => ({
          found: neo.scene.showing.some(({ mod }) => mod.id === id),
          page: neo.scene.page,
          more: neo.scene.nextArrow.visible,
        }),
        id,
      );
      if (selection.found) break;
      assert.equal(selection.more, true);
      await tap('neo.scene.nextArrow');
      await page.waitForFunction((p) => neo.scene.page !== p, selection.page);
    }
    const landPage = await page.evaluate(() => neo.scene.page);
    await tap("neo.scene.showing.find(({ mod }) => mod.id === 'harbor-orders').node");
    await scene('GameScene');
    await page.waitForFunction(() => neo.scene.game && neo.scene.place.mode !== 'none');
    assert.equal(await page.evaluate(() => neo.scene.level), level);
    await page.setViewportSize(portrait);
    await page.waitForFunction(() => neo.view.upright);
    return landPage;
  }

  async function playRow(i, [crates, boats], first = 0) {
    const row = (await state()).plan[i].slice(first);
    // Filled squares cannot go back to a closed door, so assign those squares first.
    const spots = row.map((_, j) => j).sort((a, b) => Number(row[a] === null) - Number(row[b] === null));
    assert.ok(row.filter((g) => g !== null).length <= crates + boats);
    for (const [k, j] of spots.slice(0, crates + boats).entries()) {
      const good = k < crates ? 0 : 1;
      if (row[j] === null) await tapSquare(i, j + first);
      if ((row[j] ?? 0) !== good) await tapSquare(i, j + first);
      assert.equal((await state()).plan[i][j + first], good);
    }
  }

  async function fullPlan() {
    const { solution } = await state();
    const target = solution.plans.find((plan) =>
      plan.every(([crates, boats]) => crates + boats === solution.mornings),
    );
    assert.ok(target);
    for (const [i, row] of target.entries()) await playRow(i, row);
  }

  async function back(landPage) {
    // The parent map and land still use landscape.
    await page.setViewportSize(landscape);
    await page.waitForFunction(() => neo.scene.after?.home);
    await tap('neo.scene.after.home');
    await scene('LandScene');
    assert.deepEqual(await page.evaluate(() => [neo.scene.land.id, neo.scene.page]), [
      'lantern-lake',
      landPage,
    ]);
  }

  async function harborOrdersPlay() {
    await ready();
    const before = await stickers();
    const p1 = await open(1);
    assert.equal(await page.evaluate(() => neo.scene.game.buttons[1].node.visible), false);
    await tapButton(3);
    assert.match((await state()).noteText, /still needs/);
    await fullPlan();
    await tapButton(3);
    await finished(id);
    assert.equal(await stickers(), before + 1);
    assert.deepEqual(await lastRound(), { misses: 0, hints: 0, level: 1 });
    await back(p1);

    const p2 = await open(2);
    const shortest = (await state()).solution.mornings;
    for (let n = 1; n <= shortest; n++) await tapButton(1);
    // Start the filling work in the second column, so shortening the plan takes away some work.
    const target = (await state()).solution.plans.find((plan) => plan.every(([a, b]) => a + b === shortest));
    assert.ok(target);
    for (const [i, row] of target.entries()) await playRow(i, row, 1);
    await tapButton(3);
    assert.deepEqual((await state()).score, { misses: 1, hints: 0 });
    assert.match((await state()).noteText, new RegExp(`${shortest} mornings are enough`));
    await tapButton(3);
    assert.deepEqual((await state()).score, { misses: 1, hints: 0 });

    await tapButton(2);
    assert.equal((await state()).hint.kind, 'remove');
    await screenshot('harbor-orders-level-2-portrait');
    const beforeTurn = await state();
    await page.setViewportSize(landscape);
    await page.waitForFunction(() => !neo.view.upright);
    assert.deepEqual((await state()).plan, beforeTurn.plan);
    await tapButton(0);
    let rowHints = 0;
    await tapButton(2);
    let hint = (await state()).hint;
    while (hint.kind === 'row') {
      assert.ok(++rowHints <= 2);
      await playRow(hint.row, hint.counts);
      await tapButton(2);
      hint = (await state()).hint;
    }
    assert.ok(rowHints >= 1);
    assert.equal(hint.kind, 'send');
    await tapButton(3);
    await finished(id);
    assert.equal(await stickers(), before + 2);
    assert.deepEqual(await lastRound(), { misses: 1, hints: 1 + rowHints, level: 2 });
    await back(p2);
    log(
      'Harbor Orders: Lantern Lake, fixed and open boards, free short check, spare morning, repeated send, Help, rotation and one sticker each.',
    );
  }

  return { harborOrdersPlay };
}
