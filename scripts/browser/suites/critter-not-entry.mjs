import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished }) {
  /** Story Theater: creative choices are free; only a watched show can take a bow. */
  /** Marble Jump: real taps, both ladder ends, revision, hint, portrait and one sticker. */
  async function critterNotEntry() {
    await launch('critter-crossing', 8);
    await page.waitForFunction(() => !!neo.scene.game.round && !neo.scene.game.busy);
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    assert.deepEqual(
      await page.evaluate(() => {
        const g = neo.scene.game;
        return [g.plan.mode, g.round.gate.kind, g.hidden, g.bulb.visible];
      }),
      ['visible', 'not', false, false],
    );
    await screenshot('critter-not-entry-landscape');
    // The same refused critter returns to its bank spot; two misses offer supported completion.
    for (let i = 0; i < 2; i++) {
      await page.evaluate(async () => {
        const { passes } = await import('/src/games/critter-crossing/logic.ts');
        const g = neo.scene.game,
          s = g.slots.find((s) => !passes(s.c, g.round.gate));
        const p = s.node.toGlobal({ x: 0, y: -120 });
        kit.tap(p.x, p.y);
      });
      await page.waitForFunction((n) => !neo.scene.game.busy && neo.scene.game.misses === n, i + 1, {
        timeout: 12000,
      });
    }
    assert.deepEqual(
      await page.evaluate(() => {
        const g = neo.scene.game;
        return [g.misses, g.hints, g.hinting?.kind, g.hinting?.slot.state];
      }),
      [2, 1, 'test', 'waiting'],
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await screenshot('critter-not-entry-portrait');
    await page.evaluate(async () => {
      const { passes } = await import('/src/games/critter-crossing/logic.ts');
      const g = neo.scene.game;
      for (let guard = 0; guard < 15 && !neo.scene.finished; guard++) {
        if (!(await kit.until(() => !g.busy || neo.scene.finished, 15000)))
          throw new Error('crossing stayed busy');
        if (neo.scene.finished) break;
        const s = g.slots.find((s) => s.state === 'waiting' && passes(s.c, g.round.gate));
        if (!s) throw new Error('no passing critter');
        const p = s.node.toGlobal({ x: 0, y: -120 });
        kit.tap(p.x, p.y);
        await kit.sleep(200);
      }
    });
    await finished('critter-crossing');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('critter-crossing').history.at(-1);
        return [r.level, r.misses, r.hints, kit.store.data.stickers.length];
      }),
      [8, 2, 1, before + 1],
    );
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Critter Crossing 8: visible slash sign, two refused taps, passing-critter hint, two rounds and one sticker passed',
    );
  }

  /**
   * Critter Crossing 9, Be the gate with Two of us at 390 × 844: seat choice, her rule under a lid (a free peek), one wrong
   * Cross or Wait (a miss), a partner's contradicted guess (never counted), then the swap and her own solve to one sticker
   * recorded as supported (at least one hint).
   */
  async function critterBeTheGate() {
    await page.setViewportSize({ width: 390, height: 844 });
    await launch('critter-crossing', 9, 'Mia', 'school');
    await page.waitForFunction(() => neo.scene.game.phase === 'seats' && !neo.scene.game.busy, null, {
      timeout: 15000,
    });
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await screenshot('critter-gate-seats-portrait');
    await page.evaluate(() => kit.tapOn(neo.scene.game.together));
    await page.waitForFunction(() => neo.scene.game.phase === 'pick-rule' && !neo.scene.game.busy);
    await page.evaluate(() => kit.tapOn(neo.scene.game.cards[0].node));
    await page.waitForFunction(() => neo.scene.game.phase === 'judge' && !neo.scene.game.busy);
    // A peek under the lid is free, and a second tap shuts it again.
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const sign = g.sign.getGlobalPosition();
      kit.tap(sign.x, sign.y);
      await kit.sleep(400);
      if (g.lidShut) throw new Error('the lid did not lift for a peek');
      kit.tap(sign.x, sign.y);
      await kit.sleep(400);
      if (!g.lidShut) throw new Error('the lid did not shut again');
    });
    // The partner sends a critter; her wrong answer is a miss.
    await page.evaluate(() => {
      const g = neo.scene.game;
      const p = g.slots[0].node.toGlobal({ x: 0, y: -120 });
      kit.tap(p.x, p.y);
    });
    await page.waitForFunction(() => !!neo.scene.game.pendingSlot && !neo.scene.game.busy, null, {
      timeout: 12000,
    });
    await screenshot('critter-gate-judge-portrait');
    await page.evaluate(async () => {
      const { passes } = await import('/src/games/critter-crossing/logic.ts');
      const g = neo.scene.game;
      kit.tapOn(passes(g.pendingSlot.c, g.round.gate) ? g.waitBtn : g.crossBtn);
    });
    await page.waitForFunction(() => neo.scene.game.misses === 1);
    // Play on with the ghost finger until the bulb is open, then the partner guesses a card the evidence rules out.
    const partner = await page.evaluate(async () => {
      const { passes } = await import('/src/games/critter-crossing/logic.ts');
      const g = neo.scene.game;
      const tapIntent = (m) => {
        const p = m.tap.on.toGlobal({ x: m.tap.x ?? 0, y: m.tap.y ?? 0 });
        kit.tap(p.x, p.y);
      };
      for (let guard = 0; guard < 40; guard++) {
        if (!(await kit.until(() => !g.busy, 15000))) throw new Error('crossing stayed busy');
        if (g.open) break;
        const move = g.autotouch();
        if (!move) throw new Error('no move in the first half');
        tapIntent(move);
        await kit.sleep(250);
      }
      const ev = g.slots
        .filter((s) => s.state !== 'waiting')
        .map((s) => ({ c: s.c, passed: s.state === 'crossed' }));
      const wrong = g.cards.find((c) => ev.some((e) => passes(e.c, c.gate) !== e.passed));
      if (!wrong) throw new Error('no ruled-out card to guess');
      const misses = g.misses;
      kit.tapOn(wrong.node);
      await kit.sleep(300);
      await kit.until(() => !g.busy, 15000);
      return [misses, g.misses, g.hints];
    });
    assert.equal(partner[1], partner[0], "the partner's wrong guess never counts");
    // The rest by the ghost finger: the partner's right guess, the swap, the partner's pick and her own solve.
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const tapIntent = (m) => {
        const p = m.tap.on.toGlobal({ x: m.tap.x ?? 0, y: m.tap.y ?? 0 });
        kit.tap(p.x, p.y);
      };
      for (let guard = 0; guard < 60 && !neo.scene.finished; guard++) {
        if (!(await kit.until(() => !g.busy || neo.scene.finished, 20000)))
          throw new Error('crossing stayed busy');
        if (neo.scene.finished) break;
        const move = g.autotouch();
        if (move) tapIntent(move);
        await kit.sleep(300);
      }
    });
    await finished('critter-crossing');
    const r = await page.evaluate(() => {
      const r = kit.store.stats('critter-crossing').history.at(-1);
      return [r.level, r.misses, r.hints, kit.store.data.stickers.length];
    });
    assert.equal(r[0], 9);
    assert.ok(r[1] >= 1, 'her wrong Cross or Wait counts');
    assert.ok(r[2] >= 1, 'two seats record supported completion');
    assert.equal(r[3], before + 1);
    // Just me: the pet tries critters, she answers each one by her visible rule, and the pet names it to end round 1.
    await launch('critter-crossing', 9, 'Mia', 'school');
    await page.waitForFunction(() => neo.scene.game.phase === 'seats' && !neo.scene.game.busy, null, {
      timeout: 15000,
    });
    const solo = await page.evaluate(async () => {
      const { passes } = await import('/src/games/critter-crossing/logic.ts');
      const g = neo.scene.game;
      kit.tapOn(g.alone);
      if (!(await kit.until(() => g.phase === 'pick-rule' && !g.busy, 10000)))
        throw new Error('no rule cards');
      await kit.sleep(500);
      kit.tapOn(g.cards[1].node);
      if (!(await kit.until(() => g.phase === 'judge', 10000))) throw new Error('no judging');
      const lidShown = g.lid.visible;
      let answered = 0;
      for (let guard = 0; guard < 30 && g.index === 0; guard++) {
        await kit.until(() => (!!g.pendingSlot && !g.busy) || g.index > 0, 20000);
        if (g.index > 0) break;
        kit.tapOn(passes(g.pendingSlot.c, g.round.gate) ? g.crossBtn : g.waitBtn);
        answered++;
        await kit.sleep(300);
      }
      return [g.seats, lidShown, answered, g.index, g.misses, g.hints];
    });
    assert.equal(solo[0], 'solo');
    assert.equal(solo[1], false, 'alone, her rule stays on the sign');
    assert.ok(solo[2] >= 2 && solo[2] <= 6, `the pet tried ${solo[2]} critters`);
    assert.equal(solo[3], 1, 'the pet named the rule and round 2 began');
    assert.deepEqual(solo.slice(4), [0, 0]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      `Critter Crossing 9: seats, peek, a judged miss, an unscored partner guess, the swap and one sticker (${r[1]} misses, ${r[2]} hints); Just me round 1 by the pet passed`,
    );
  }

  return { critterNotEntry, critterBeTheGate };
}
