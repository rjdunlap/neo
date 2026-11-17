import assert from 'node:assert/strict';

export function createSuite({ page, context, log, launch, finished, screenshot }) {
  /**
   * Picnic Pantry level 1 (its first and last level): a bell on an empty blanket and a third card on a full one are free; a bell
   * on the pair that does not fit is one miss and leaves the plan; the pause sheet's Show a hint names the dish to put back
   * (one hint); the picnic is laid; Another way? rings the pair that does not fit again (free) and lays the other menu; the
   * second picnic is played by the demonstration bot; one sticker. One portrait screenshot with the outlines showing.
   */
  async function picnicPantryPlay() {
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('picnic-pantry', 1);
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          misses: g.t.misses,
          hints: g.t.hints,
          selection: [...g.selection],
          phase: g.phase,
          again: g.again,
          laid: g.laid.length,
          at: g.at,
          hint: g.hintStep,
        };
      });
    const tapNode = (expr) =>
      page.evaluate(async (e) => {
        const g = neo.scene.game;
        kit.tapOn(new Function('g', `return ${e}`)(g));
        await kit.until(() => !g.fx.children.length);
        await new Promise((r) => setTimeout(r, 180));
      }, expr);
    const plan = await page.evaluate(async () => {
      const { PAIRS, fits, menusThatFit } = await import('/src/games/picnic-pantry/logic.ts');
      const c = neo.scene.game.picnic.case;
      const menus = menusThatFit(c);
      return { bad: PAIRS.find((p) => !fits(c, p)), menus, id: c.id };
    });
    const [badFirst, badSecond] = plan.bad;
    const hub = plan.menus[0].find((d) => plan.menus[1].includes(d));

    // Free: the bell with nothing placed.
    await tapNode('g.bell');
    let st = await state();
    assert.deepEqual([st.misses, st.hints, st.phase], [0, 0, 'plan'], 'a bell on an empty blanket is free');

    // The pair that does not fit, then the third card on a full blanket (free).
    await tapNode(`g.cardOf(${badFirst})`);
    await tapNode(`g.cardOf(${badSecond})`);
    await tapNode(`g.cardOf(${hub})`);
    st = await state();
    assert.deepEqual(st.selection, [badFirst, badSecond], 'the blanket holds two dishes');
    assert.deepEqual([st.misses, st.hints], [0, 0], 'placing and the full-blanket wobble are free');
    const outlines = await page.evaluate(() => {
      const g = neo.scene.game;
      return g.slotArt.map((slots) => slots.filter((s) => !s.filled).length);
    });
    assert.equal(outlines[0], 0, 'the dish placed first has all its tokens');
    assert.ok(outlines[1] > 0, 'the second dish shows an outline for each token the jar could not give');

    await tapNode('g.bell');
    st = await state();
    assert.deepEqual(
      [st.misses, st.hints, st.phase],
      [1, 0, 'plan'],
      'a bell on the pair that does not fit is one miss',
    );
    assert.deepEqual(st.selection, [badFirst, badSecond], 'the plan stays as she left it');

    // A phone held upright, the focus of current playtests.
    const touch = await context.newCDPSession(page);
    await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    const fit = await page.evaluate(async () => {
      const { uprightProblems } = await import('/src/games/upright-check.ts');
      const g = neo.scene.game;
      const l = g.layout;
      const targets = [
        ...l.jars.map((b, i) => ({ what: `jar ${i}`, ...b })),
        ...l.places.map((b, i) => ({ what: `place ${i}`, ...b })),
        ...l.cards.map((b, i) => ({ what: `card ${i}`, ...b })),
        { what: 'bell', ...l.bell },
      ];
      const placed = g.cards.every(
        (c, i) => Math.abs(c.x - l.cards[i].x) < 1 && Math.abs(c.y - l.cards[i].y) < 1,
      );
      return { problems: uprightProblems(neo.view, targets), placed, upright: !!neo.view.upright };
    });
    assert.deepEqual(fit.problems, [], 'portrait targets fit');
    assert.ok(fit.upright, 'the game lays out on the upright area');
    assert.ok(fit.placed, 'the cards sit where the layout says');
    await screenshot('picnic-pantry-portrait');
    await touch.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);

    // The pause sheet's hint: one repair step, the dish placed second goes back.
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Show a hint', exact: true }).click();
    await page.waitForTimeout(300);
    st = await state();
    assert.deepEqual([st.misses, st.hints], [1, 1], 'a shown hint is one hint');
    assert.deepEqual(st.hint, { putBack: badSecond }, 'the hint puts back the dish placed second');
    await page.evaluate(() => neo.scene.game.askForHint());
    st = await state();
    assert.equal(st.hints, 1, 'the same hint asked again is not counted twice');
    await tapNode(`g.places[g.slots.indexOf(${badSecond})]`);
    st = await state();
    assert.deepEqual(st.selection, [badFirst], 'she makes the tap herself');
    assert.equal(st.hint, null, 'the glow clears when the plan changes');

    // Lay a menu that fits.
    await tapNode(`g.cardOf(${hub})`);
    await tapNode('g.bell');
    st = await state();
    assert.deepEqual([st.phase, st.laid, st.misses, st.hints], ['laid', 1, 1, 1], 'the picnic is laid');
    assert.ok(
      await page.evaluate(() => neo.scene.game.friends.every((f) => f.visible)),
      'four friends sit down',
    );
    await page.waitForTimeout(900);
    await screenshot('picnic-pantry-laid');

    // Another way?: unjudged. The pair that does not fit explains itself for free; the other menu compares leftovers.
    await tapNode('g.anotherButton');
    st = await state();
    assert.deepEqual([st.phase, st.again, st.selection.length], ['plan', true, 0], 'the dishes go back');
    await tapNode(`g.cardOf(${badFirst})`);
    await tapNode(`g.cardOf(${badSecond})`);
    await tapNode('g.bell');
    st = await state();
    assert.deepEqual([st.misses, st.hints, st.phase], [1, 1, 'plan'], 'nothing in Another way? is a miss');
    await tapNode(`g.cardOf(${badFirst})`);
    await tapNode(`g.cardOf(${hub})`);
    await tapNode('g.bell');
    st = await state();
    assert.deepEqual(
      [st.phase, st.laid, st.misses, st.hints],
      ['laid', 2, 1, 1],
      'the other menu is laid too',
    );
    await page.waitForTimeout(500);
    await tapNode('g.nextButton');
    st = await state();
    assert.deepEqual(
      [st.at, st.phase, st.again, st.laid],
      [1, 'plan', false, 0],
      'the second picnic starts fresh',
    );
    assert.notEqual(await page.evaluate(() => neo.scene.game.picnic.case.id), plan.id, 'a different case');

    // The second picnic, as the demonstration plays it: only real taps, no wrong bell.
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let guard = 0; guard < 12 && !g.finished; guard++) {
        await kit.until(() => !g.fx.children.length);
        const intent = g.autotouch();
        if (!intent?.tap) throw new Error('The demonstration has no next touch');
        kit.tapOn(intent.tap.on);
        await new Promise((r) => setTimeout(r, 450));
      }
      if (!g.finished) throw new Error('The second picnic did not finish');
      if (g.t.misses !== 1 || g.t.hints !== 1)
        throw new Error(`Tally ${g.t.misses}/${g.t.hints}, expected 1/1`);
    });
    await finished('picnic-pantry');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1, 'one sticker');
    log(
      'Picnic Pantry level 1: free taps, one miss, one hint, Another way?, both picnics and one sticker passed',
    );
  }
  return { picnicPantryPlay };
}
