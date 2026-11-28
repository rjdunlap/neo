import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot }) {
  /** Drags a job's tile onto a slot with a real touch (the piece rides 40 units above the finger, so aim below the slot). */
  const put = async (id, row, step) => {
    await page.evaluate(
      async ({ id, row, step }) => {
        const g = neo.scene.game;
        const tile = g.tiles.get(id).node;
        const slot = g.slots[row][step];
        const to = slot.getGlobalPosition();
        const lift = 40 * g.ctx.view.scale;
        await kit.dragTo(tile, { x: to.x, y: to.y + lift });
      },
      { id, row, step },
    );
    await page.waitForTimeout(350);
  };
  const state = () =>
    page.evaluate(() => {
      const g = neo.scene.game;
      return {
        misses: g.tally.misses,
        hints: g.tally.hints,
        bench: [...g.board.bench],
        cart: [...g.board.cart],
        busy: g.busy,
        cardOpen: g.cardOpen,
        finished: g.finished,
      };
    });
  const runPlan = async () => {
    await page.evaluate(() => kit.tapOn(neo.scene.game.buttons[3]));
    await page.waitForTimeout(400);
    await page.waitForFunction(
      () => !neo.scene.game.busy || neo.scene.game.cardOpen || neo.scene.game.finished,
      null,
      {
        timeout: 15000,
      },
    );
  };

  /** Village Planner: level 1 with a wrong-row drop (free), a plan that runs a job too soon (one miss), one hint and a fix; level 2 with a three-trip plan and the Trace Card (Try fewer trips, then Done); level 3 by the ghost finger. */
  async function villagePlannerPlay() {
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('village-planner', 1, 'Mia', 'grownup');
    await page.waitForTimeout(500);
    // A bench job dropped on the cart row goes home: no miss.
    await put('crates', 'cart', 0);
    let s = await state();
    assert.deepEqual(s.cart, [null, null, null, null], 'a bench job does not sit on the cart row');
    assert.equal(s.misses, 0);
    // Run plan with jobs still waiting is free.
    await runPlan();
    s = await state();
    assert.equal(s.misses, 0, 'running an incomplete plan is not a miss');
    // Dough before its grain: one miss, and the board stays editable.
    await put('dough', 'bench', 0);
    await put('mill', 'cart', 1);
    await put('bake', 'cart', 2);
    await put('crates', 'bench', 1);
    s = await state();
    assert.equal(s.bench[0], 'dough');
    await runPlan();
    s = await state();
    assert.equal(s.misses, 1, 'a plan that runs dough before the grain is one miss');
    assert.equal(s.busy, false, 'the board is editable again');
    // Run again unchanged: the same board is not a second miss.
    await runPlan();
    s = await state();
    assert.equal(s.misses, 1, 'the same failing board counts once');
    // A hint is counted, then the fix.
    await page.evaluate(() => kit.tapOn(neo.scene.game.buttons[2]));
    await page.waitForTimeout(300);
    s = await state();
    assert.equal(s.hints, 1, 'a hint is counted');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await screenshot('village-planner-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    await put('bake', 'cart', 3);
    await put('dough', 'bench', 2);
    await runPlan();
    await finished('village-planner');
    const r = await page.evaluate(() => kit.store.stats('village-planner').history.at(-1));
    assert.equal(r.misses, 1);
    assert.equal(r.hints, 1);

    // Level 2: a three-trip plan works, offers the Trace Card, and Try fewer trips is free.
    await launch('village-planner', 2, 'Mia', 'grownup');
    await page.waitForTimeout(500);
    await put('cut', 'cart', 0);
    await put('wheel', 'bench', 1);
    await put('grind', 'cart', 1);
    await put('mix', 'bench', 2);
    await put('loaf', 'cart', 3);
    await runPlan();
    s = await state();
    assert.equal(
      s.cardOpen,
      true,
      'a plan with more trips than the least offers the Trace Card ' + JSON.stringify(s),
    );
    await screenshot('village-planner-card');
    await page.evaluate(() => kit.tapOn(neo.scene.game.cardLayer.children[3]));
    await page.waitForTimeout(300);
    s = await state();
    assert.equal(s.cardOpen, false);
    assert.equal(s.misses, 0, 'trying fewer trips costs nothing');
    await runPlan();
    s = await state();
    assert.equal(s.cardOpen, true);
    await page.evaluate(() => kit.tapOn(neo.scene.game.cardLayer.children[2]));
    await finished('village-planner');

    // Level 3 by the ghost finger: drags every job into the fewest-trips plan, then Run plan.
    await launch('village-planner', 3, 'Mia', 'grownup');
    await page.waitForTimeout(500);
    for (let i = 0; i < 40; i++) {
      const done = await page.evaluate(() => neo.scene.finished || neo.scene.game.finished);
      if (done) break;
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const intent = g.autotouch();
        if (!intent) return;
        if (intent.tap) return kit.tapOn(intent.tap.on);
        const to = intent.to.on.getGlobalPosition();
        await kit.dragTo(intent.drag.on, { x: to.x, y: to.y + 40 * g.ctx.view.scale });
      });
      await page.waitForTimeout(500);
    }
    await finished('village-planner');
    const last = await page.evaluate(() => kit.store.stats('village-planner').history.at(-1));
    assert.equal(last.misses, 0);
    assert.equal(last.hints, 0);
  }
  return { villagePlannerPlay };
}
