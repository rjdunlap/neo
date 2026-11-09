import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  /** Lift It by touch: level 1 hauled in strokes; level 6 with one wrong rig (one miss) and a requested glow (one hint), then the cards and the haul; level 3 upright with two wheels hung; level 4 replay; level 9 paws cards. FROM_LEVEL=7, 8 or 9 runs only that level. */
  async function liftItPlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          busy: g.busy,
          misses: g.misses,
          hints: g.hints,
          line: g.line,
          glow: g.glowRig,
          rig: g.rig,
          rung: g.haul.rung,
        };
      });
    const idle = () =>
      page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, {
        timeout: 20000,
      });
    const sticker = (n) =>
      page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });
    // In the page: real touches for one step of play (hang or move a wheel, answer a card, or one stroke), toward `want` (or the hint's rig).
    const step = (want) =>
      page.evaluate(async (want) => {
        const { bestRig, rigsFor, hooksOf, crateHook } = await import('/src/games/lift-it/logic.ts');
        const g = neo.scene.game;
        if (!g || g.busy || g.finished) {
          await kit.sleep(120);
          return 'wait';
        }
        const S = (x, y) => {
          const p = g.ctx.stage.toGlobal({ x, y });
          return [p.x, p.y];
        };
        const scale = neo.view.scale;
        if (g.question) {
          const c = g.cards.find((c) => c.value === g.question.answer);
          const p = c.node.getGlobalPosition();
          kit.tap(p.x, p.y);
          await kit.sleep(400);
          return 'card';
        }
        const rig = want ?? bestRig(g.cur, rigsFor(g.plan));
        if (!g.plan.prebuilt && g.rig !== rig) {
          const need = hooksOf(rig);
          const hookAt = (h) => (h === 'branch' ? g.layout.branchHook : crateHook(g.layout, 0));
          for (const h of g.plan.hooks)
            if (g.hooks[h] && !need[h]) {
              const w = g.wheels.find((o) => o.on === h);
              const t = g.layout.tray[w.slot];
              const a = w.node.getGlobalPosition();
              await kit.drag(kit.line([a.x, a.y], S(t.x, t.y + 40), 10));
              await kit.sleep(300);
              return 'unhang';
            }
          for (const h of g.plan.hooks)
            if (need[h] && !g.hooks[h]) {
              const w = g.wheels.find((o) => o.on === null);
              const t = hookAt(h);
              const a = w.node.getGlobalPosition();
              await kit.drag(kit.line([a.x, a.y], S(t.x, t.y + 40), 10));
              await kit.sleep(300);
              return 'hang';
            }
          if ((rig === 'three') !== g.tiedToCrate) {
            kit.tapOn(g.tieButton);
            await kit.sleep(300);
            return 'tie';
          }
        }
        const h = g.handle.getGlobalPosition();
        const down = g.rig === 'fixed' || g.rig === 'both';
        if (g.plan.ask !== 'none' && g.answeredFor !== g.rig) {
          kit.tap(h.x, h.y);
          await kit.sleep(500);
          return 'tap';
        }
        const len = (down ? 150 : -Math.min(150, g.handle.y - 20)) * scale;
        await kit.drag(kit.line([h.x, h.y], [h.x, h.y + len], 10));
        await kit.sleep(150);
        return 'stroke';
      }, want);
    const playOut = async (n) => {
      for (let guard = 0; guard < 200 && !(await page.evaluate(() => neo.scene.finished)); guard++)
        await step();
      await sticker(n);
    };

    const tapCard = (v) =>
      page.evaluate((v) => {
        const p = neo.scene.game.cards.find((c) => c.value === v).node.getGlobalPosition();
        kit.tap(p.x, p.y);
      }, v);

    // Level 9: the authored four-stone crate. The branch wheel hides its paws until she picks a card; a wrong card (2) is
    // one miss, the tug that follows is free, and a requested hint on the crate wheel's card glows the right one once.
    async function level9() {
      await launch('lift-it', 9);
      await idle();
      const m = await page.evaluate(() => kit.store.data.stickers.length);
      assert.deepEqual(
        await page.evaluate(() => {
          const l = neo.scene.game.cur;
          return [l.w, l.h, l.g, l.l, l.ask];
        }),
        [4, 1, 2, 2, undefined],
        'level 9: the authored first parcel',
      );
      await step('fixed');
      await idle();
      await page.waitForTimeout(200);
      assert.deepEqual(
        await page.evaluate(() => [neo.scene.game.rig, neo.scene.game.paws.children.length]),
        ['fixed', 0],
        'the paws are hidden until the card',
      );
      assert.equal(await step('fixed'), 'tap');
      await page.waitForFunction(() => neo.scene.game.question?.kind === 'paws', null, { timeout: 5000 });
      assert.deepEqual(
        await page.evaluate(() => [neo.scene.game.question.values, neo.scene.game.question.answer]),
        [[2, 3, 4], 4],
        'the branch wheel asks 4 paws',
      );
      await tapCard(2);
      await page.waitForFunction(() => !neo.scene.game.question && !neo.scene.game.busy, null, {
        timeout: 15000,
      });
      await page.waitForTimeout(200);
      st = await state();
      assert.deepEqual([st.misses, st.hints], [1, 0], 'a wrong paws card is one miss');
      assert.equal(
        await page.evaluate(() => neo.scene.game.paws.children.length),
        4,
        'the four paws show after the card',
      );
      assert.equal(await step('fixed'), 'stroke');
      await idle();
      await page.waitForTimeout(300);
      st = await state();
      assert.deepEqual([st.misses, st.rung], [1, 0], 'the tug on a rig too heavy is free and moves nothing');
      await step('movable');
      await idle();
      await step('movable');
      await idle();
      assert.equal((await state()).rig, 'movable');
      assert.equal(await step('movable'), 'tap');
      await page.waitForFunction(() => neo.scene.game.question?.kind === 'paws', null, { timeout: 5000 });
      assert.equal(
        await page.evaluate(() => neo.scene.game.question.answer),
        2,
        'the crate wheel asks 2 paws',
      );
      await screenshot('lift-it-9-paws-card');
      await page.evaluate(() => neo.scene.game.askForHint());
      await page.evaluate(() => neo.scene.game.askForHint());
      assert.deepEqual(
        await page.evaluate(() => [neo.scene.game.hints, neo.scene.game.cardGlow]),
        [1, 2],
        'a requested hint glows the right card once',
      );
      await playOut(m);
      st = await state();
      assert.deepEqual([st.misses, st.hints], [1, 1], 'level 9: one miss, one hint');
    }
    async function threeRopes(level) {
      if (level === 7) await page.setViewportSize({ width: 768, height: 1024 });
      await launch('lift-it', level);
      await idle();
      const n = await page.evaluate(() => kit.store.data.stickers.length);
      await step('both');
      assert.equal(
        await page.evaluate(() => neo.scene.game.tieButton.visible),
        false,
        'one wheel cannot move the knot',
      );
      await step('both');
      assert.equal((await state()).rig, 'both');
      if (level === 7) {
        await step('both');
        await step('both');
        assert.equal((await state()).misses, 1, 'the same failed rig counts once');
        await page.evaluate(() => neo.scene.game.askForHint());
        assert.deepEqual([(await state()).hints, (await state()).glow], [1, 'three']);
      }
      assert.equal(await step('three'), 'tie');
      assert.equal((await state()).rig, 'three');
      if (level === 7) {
        await tap('neo.scene.game.tieButton');
        assert.equal((await state()).rig, 'both', 'the same ring returns the knot to the branch');
        await step('three');
        assert.equal((await state()).misses, 1, 'moving the knot is free');
        await screenshot('lift-it-7-three-ropes-portrait');
      } else {
        assert.equal(
          await page.evaluate(() => neo.scene.game.paws.children.length),
          0,
          'paws hidden until answered',
        );
        assert.equal(await step('three'), 'tap');
        const question = () =>
          page.evaluate(() => {
            const { kind, values, answer } = neo.scene.game.question;
            return { kind, values, answer };
          });
        assert.deepEqual(await question(), { kind: 'paws', values: [2, 3, 6], answer: 2 });
        await tapCard(3);
        await page.waitForFunction(() => neo.scene.game.question?.kind === 'knots');
        assert.deepEqual(await question(), { kind: 'knots', values: [3, 6, 9], answer: 9 });
      }
      await playOut(n);
      const st = await state();
      assert.deepEqual([st.misses, st.hints], [1, level === 7 ? 1 : 0]);
      log(`Lift It level ${level}: tied to the crate and delivered all parcels with one miss`);
    }

    let st;
    if (['7', '8'].includes(process.env.FROM_LEVEL)) {
      await threeRopes(Number(process.env.FROM_LEVEL));
      assert.deepEqual(errors, [], 'page errors');
      return;
    }
    if (process.env.FROM_LEVEL === '9') {
      await level9();
      assert.deepEqual(errors, [], 'page errors');
      log('Lift It: level 9 with a wrong paws card, a free tug and a requested card glow');
      return;
    }

    // Level 1: the rope hangs over the branch wheel; strokes down haul each parcel up. No misses or hints.
    await launch('lift-it', 1);
    await idle();
    let n = await page.evaluate(() => kit.store.data.stickers.length);
    // Show a hint pulls one stroke with the pet's paw on the handle.
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(150);
    assert.deepEqual(
      await page.evaluate(() => [
        neo.scene.game.helperPaw.visible,
        neo.scene.game.hints,
        neo.scene.game.haul.rung > 0,
      ]),
      [true, 1, true],
      "the hint's stroke is pulled by the pet's paw",
    );
    await page.waitForTimeout(800);
    assert.equal(
      await page.evaluate(() => neo.scene.game.helperPaw.visible),
      false,
      'the paw lets go after the stroke',
    );
    await playOut(n);
    st = await state();
    assert.deepEqual([st.misses, st.hints], [0, 1], 'level 1: no misses, the one requested hint');

    // Level 6: the authored six-stone crate; the branch wheel alone needs six paws (one miss on the tug), a requested hint glows both hooks once.
    await launch('lift-it', 6);
    await idle();
    n = await page.evaluate(() => kit.store.data.stickers.length);
    assert.deepEqual(
      await page.evaluate(() => {
        const l = neo.scene.game.cur;
        return [l.w, l.g, l.h, l.ask];
      }),
      [6, 3, 3, 'ground'],
      'the authored first parcel',
    );
    await step('fixed');
    await idle();
    assert.equal((await state()).rig, 'fixed');
    await step('fixed');
    await idle();
    await page.waitForTimeout(300);
    st = await state();
    assert.deepEqual(
      [st.misses, st.hints, st.rung],
      [1, 0, 0],
      'a tug on a rig that cannot lift counts one miss and moves nothing',
    );
    await step('fixed');
    await idle();
    assert.equal((await state()).misses, 1, 'tugging the same rig again is free');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(150);
    st = await state();
    assert.deepEqual([st.hints, st.glow], [1, 'both'], 'a requested hint glows the two-wheel rig once');
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.equal((await state()).hints, 1, 'asking again under the glow counts nothing');
    await playOut(n);
    st = await state();
    assert.deepEqual([st.misses, st.hints], [1, 1]);

    // Level 3 upright in the autumn look (relaunched until the round picks it): both wheels hung, one screenshot.
    await page.setViewportSize({ width: 768, height: 1024 });
    for (let i = 0; i < 20; i++) {
      await launch('lift-it', 3);
      await idle();
      if ((await page.evaluate(() => neo.scene.game.look)) === 'autumn') break;
    }
    assert.equal(await page.evaluate(() => neo.scene.game.look), 'autumn');
    const l3 = await page.evaluate(() => {
      const l = neo.scene.game.cur;
      return [l.w, l.g, l.l, l.parcel];
    });
    assert.ok(
      [3, 4].includes(l3[0]) && l3[1] === 2 && l3[2] === 2 && ['pumpkin', 'books', 'teapot'].includes(l3[3]),
      `a heavy level 3 parcel: ${l3}`,
    );
    await page.waitForTimeout(400);
    await step('both');
    await idle();
    await step('both');
    await idle();
    await page.waitForTimeout(400);
    assert.equal((await state()).rig, 'both', 'two wheels hung');
    await screenshot('lift-it-3-portrait');

    // Level 4 upright: deliver one parcel, then the replay button hauls it again with the knots counted, changing nothing.
    await launch('lift-it', 4);
    await idle();
    n = await page.evaluate(() => kit.store.data.stickers.length);
    assert.equal(
      await page.evaluate(() => neo.scene.game.replayButton.visible),
      false,
      'no replay before a parcel',
    );
    for (let guard = 0; guard < 80 && (await state()).line === 0; guard++) await step();
    await idle();
    await page.waitForTimeout(300);
    const before = await state();
    const shown = await page.evaluate(() => {
      const g = neo.scene.game;
      return { visible: g.replayButton.visible, knots: g.last && g.last.line.h, cur: g.cur.w };
    });
    assert.equal(shown.visible, true, 'the replay button shows after the first parcel');
    await screenshot('lift-it-4-replay-portrait');
    await page.evaluate(() => {
      const p = neo.scene.game.replayButton.getGlobalPosition();
      kit.tap(p.x, p.y);
    });
    await page.waitForFunction(() => neo.scene.game.replaying, null, { timeout: 3000 });
    const during = await page.evaluate(() => [
      neo.scene.game.cur === neo.scene.game.last.line,
      neo.scene.game.replayButton.visible,
    ]);
    assert.deepEqual(during, [true, false], 'the replay shows the last parcel and hides its button');
    await page.waitForFunction(() => neo.scene.game.haul.knots >= 1, null, { timeout: 8000 });
    await idle();
    const after = await state();
    assert.deepEqual(
      [after.line, after.misses, after.hints, after.rig, after.rung],
      [before.line, before.misses, before.hints, before.rig, 0],
      'the replay changes no parcel, miss, hint or wheel',
    );
    assert.equal(await page.evaluate(() => neo.scene.game.cur.w), shown.cur, 'her own parcel is back');
    await playOut(n);
    await page.waitForTimeout(500);
    assert.equal(
      await page.evaluate(() => kit.store.data.stickers.length),
      n + 1,
      'one sticker for the round',
    );
    await page.setViewportSize({ width: 1024, height: 768 });
    await level9();
    assert.deepEqual(errors, [], 'page errors');
    log(
      'Lift It: level 1 by strokes, level 6 with a wrong rig and a requested hint, level 3 upright in the autumn look with a heavy parcel and two wheels, level 4 upright replaying the first parcel, level 9 with a wrong paws card and a card glow',
    );
  }

  return { liftItPlay };
}
