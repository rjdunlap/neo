import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  /**
   * Domino Run by touch: level 1 tipped by taps, level 8 with a stalled run, a requested hint and the rest by drags, level 5
   * upright, level 6 upright at sunset with a drop on a puddle, level 9 upright with a wrong guess and a requested hint,
   * level 10 upright with a giant stood too soon, level 11 upright with a tall refused under the pier. `DOMINO_LEVELS=10` (a comma list) plays only those levels.
   */
  async function dominoRunPlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          busy: g.busy,
          misses: g.misses,
          hints: g.hints,
          stalls: g.stalls,
          hinted: !!g.hinted,
          index: g.index,
        };
      });
    const idle = () =>
      page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, {
        timeout: 15000,
      });
    const tapNode = async (expr) => {
      const p = await page.evaluate((expr) => (0, eval)(expr).toGlobal({ x: 0, y: -40 }), expr);
      await page.evaluate(({ x, y }) => kit.tap(x, y), p);
      await page.waitForTimeout(200);
    };
    /** Play the hint's way to a ringing line by drags, tap the starter, and go on until the round ends. */
    const solveAll = async (untilIndex = Infinity) => {
      for (let guard = 0; guard < 60 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
        if ((await page.evaluate(() => neo.scene.game.index)) >= untilIndex) return;
        await idle();
        if (await page.evaluate(() => neo.scene.finished)) break;
        if ((await page.evaluate(() => neo.scene.game.index)) >= untilIndex) return;
        const step = await page.evaluate(async () => {
          const L = await import('/src/games/domino-run/logic.ts'),
            g = neo.scene.game;
          if (g.plan.tapAny) return { kind: 'tap1' };
          if (g.predicting) return { kind: 'guess', slot: L.stopsAt(g.line).slot };
          const h = L.hintPlacement(g.line, g.placed);
          if (h.kind !== 'place') return h;
          const p = g.pieces.find((q) => !q.at && q.size === h.size),
            l = g.lay.lanes[h.lane];
          return {
            kind: 'place',
            a: p.node.toGlobal({ x: 0, y: -60 }),
            to: { x: l.x0 + h.slot * L.PITCH, y: l.base },
          };
        });
        if (step.kind === 'tap1') await tapNode('neo.scene.game.nodes[0][1]');
        else if (step.kind === 'guess') await tapNode(`neo.scene.game.nodes[0][${step.slot}]`);
        else if (step.kind === 'run') await tapNode('neo.scene.game.starters[0]');
        else if (step.kind === 'remove')
          await tapNode(
            `neo.scene.game.pieces.find((q) => q.at && q.at.lane === ${step.lane} && q.at.slot === ${step.slot}).node`,
          );
        else if (step.kind === 'place') {
          const b = await page.evaluate(
            (to) => neo.scene.game.pieceLayer.parent.toGlobal({ x: to.x, y: to.y + 40 }),
            step.to,
          );
          await page.evaluate(({ a, b }) => kit.drag(kit.line([a.x, a.y], [b.x, b.y], 16)), { a: step.a, b });
          await page.waitForTimeout(350);
        }
        await page.waitForTimeout(250);
      }
      await page.waitForFunction(() => neo.scene.finished, null, { timeout: 30000 });
    };
    const want = (l) =>
      !process.env.DOMINO_LEVELS || process.env.DOMINO_LEVELS.split(',').map(Number).includes(l);
    const played = [];
    let st = null;
    // Level 1: three lines, each tipped by a tap on a domino; no misses or hints; one sticker.
    if (want(1)) {
      await launch('domino-run', 1);
      await idle();
      const stickers = await page.evaluate(() => kit.store.data.stickers.length);
      await solveAll();
      st = await state();
      assert.deepEqual([st.misses, st.hints], [0, 0], 'level 1 has no misses or hints');
      await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers, {
        timeout: 15000,
      });
      played.push('level 1 tipped by taps');
    }
    if (want(8)) {
      // Level 8: a run with gaps stalls (never a miss); Show a hint glows once and counts once; then the hint's way by drags.
      const stickers8 = await page.evaluate(() => kit.store.data.stickers.length);
      await launch('domino-run', 8);
      await idle();
      await tapNode('neo.scene.game.starters[0]');
      await idle();
      st = await state();
      assert.deepEqual([st.stalls, st.misses], [1, 0], 'a stalled run is counted as a stall, not a miss');
      await page.evaluate(() => neo.scene.game.askForHint());
      await page.waitForTimeout(200);
      st = await state();
      assert.deepEqual([st.hints, st.hinted], [1, true], 'a requested hint glows and counts once');
      await solveAll();
      st = await state();
      assert.equal(st.misses, 0);
      assert.ok(st.hints >= 1);
      await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers8, {
        timeout: 15000,
      });
      assert.deepEqual(errors, [], 'page errors');
      played.push('level 8 with a stall (no miss), a requested hint and drags');
    }
    await page.setViewportSize({ width: 768, height: 1024 });
    if (want(5)) {
      // Level 5 upright: two lanes and the tray row, one screenshot.
      await launch('domino-run', 5);
      await idle();
      await page.waitForTimeout(500);
      await screenshot('domino-run-5-portrait');
      played.push('level 5 upright');
    }
    if (want(6)) {
      // Level 6 upright: the second line is a seeded one with a puddle; at sunset, a domino dropped on the puddle springs back
      // (never a miss), then the round finishes with one sticker.
      const stickers6 = await page.evaluate(() => kit.store.data.stickers.length);
      await launch('domino-run', 6);
      await idle();
      const wet = await page.evaluate(async () => {
        const L = await import('/src/games/domino-run/logic.ts'),
          R = await import('/src/engine/random.ts'),
          g = neo.scene.game;
        for (let seed = 1; seed < 200; seed++) {
          const { line } = L.makeLine(L.planFor(6), new R.Rng(seed));
          if (L.puddles(line.lanes[0]).length) {
            g.lines[1] = line;
            return seed;
          }
        }
        return 0;
      });
      assert.ok(wet, 'a seeded level 6 line has a puddle');
      await solveAll(1);
      await idle();
      const pud = await page.evaluate(async () => {
        const L = await import('/src/games/domino-run/logic.ts'),
          g = neo.scene.game;
        g.mood = 'sunset';
        g.build();
        const r = L.puddles(g.line.lanes[0])[0],
          l = g.lay.lanes[0];
        const p = g.pieces.find((q) => !q.at);
        return {
          drawn: g.puddleNodes.length,
          a: p.node.toGlobal({ x: 0, y: -60 }),
          b: g.pieceLayer.parent.toGlobal({ x: l.x0 + r.from * L.PITCH, y: l.base + 40 }),
        };
      });
      assert.ok(pud.drawn >= 1, 'the puddle is drawn');
      await page.evaluate(({ a, b }) => kit.drag(kit.line([a.x, a.y], [b.x, b.y], 16)), pud);
      await page.waitForTimeout(500);
      st = await page.evaluate(() => {
        const g = neo.scene.game;
        return { misses: g.misses, hints: g.hints, inTray: g.pieces.every((q) => !q.at) };
      });
      assert.deepEqual(
        st,
        { misses: 0, hints: 0, inTray: true },
        'a domino dropped on a puddle springs back, never a miss',
      );
      await page.waitForTimeout(300);
      await screenshot('domino-run-6-portrait-sunset');
      await solveAll();
      await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers6, {
        timeout: 15000,
      });
      played.push('level 6 upright at sunset with a puddle drop that springs back');
    }
    if (want(9)) {
      // Level 9 upright: a wrong guess (the starter) runs the line as it stands, rings the real last domino and is never a
      // miss, a hint or one of her stalls; the tray waits until the guess. Then a requested hint, the fix, and line 2's guess.
      const stickers9 = await page.evaluate(() => kit.store.data.stickers.length);
      await launch('domino-run', 9);
      await idle();
      st = await page.evaluate(() => {
        const g = neo.scene.game;
        return { predicting: g.predicting, trayOff: g.pieces.every((p) => !p.handle.enabled) };
      });
      assert.deepEqual(
        st,
        { predicting: true, trayOff: true },
        'level 9 opens with a guess and the tray waits',
      );
      await page.evaluate(() => neo.scene.game.askForHint());
      await page.waitForTimeout(200);
      st = await state();
      assert.deepEqual([st.hints, st.hinted], [0, false], 'a hint asked for during the guess waits');
      await tapNode('neo.scene.game.starters[0]');
      await page.waitForTimeout(1500);
      await screenshot('domino-run-9-portrait-guess');
      await idle();
      st = await page.evaluate(async () => {
        const L = await import('/src/games/domino-run/logic.ts'),
          g = neo.scene.game;
        return {
          guess: g.guess,
          stop: L.stopsAt(g.line).slot,
          predicting: g.predicting,
          stalls: g.stalls,
          misses: g.misses,
          hints: g.hints,
          trayOn: g.pieces.every((p) => p.handle.enabled),
        };
      });
      assert.deepEqual(
        st,
        { guess: 0, stop: 2, predicting: false, stalls: 0, misses: 0, hints: 1, trayOn: true },
        'a wrong guess is flagged and never counted; the waiting hint shows once she builds',
      );
      await solveAll();
      st = await state();
      assert.deepEqual([st.misses, st.hints], [0, 1], 'level 9: no misses, the one requested hint');
      await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers9, {
        timeout: 15000,
      });
      played.push('level 9 upright with a wrong guess, a waiting hint and the fix');
    }
    if (want(10)) {
      // Level 10 upright: the first line has the two-wide puddle; the giant stood straight after the pinned small stalls too
      // heavy (a stall, never a miss); a requested hint sends it back, and the hint's way (tall, then giant) rings the bell.
      const stickers10 = await page.evaluate(() => kit.store.data.stickers.length);
      await launch('domino-run', 10);
      await idle();
      await page.waitForTimeout(500);
      const first = await page.evaluate(async () => {
        const L = await import('/src/games/domino-run/logic.ts'),
          g = neo.scene.game,
          l = g.lay.lanes[0];
        const p = g.pieces.find((q) => !q.at && q.size === 3);
        return {
          wet: L.puddles(g.line.lanes[0]),
          drawn: g.puddleNodes.length,
          a: p.node.toGlobal({ x: 0, y: -60 }),
          b: g.pieceLayer.parent.toGlobal({ x: l.x0 + 2 * L.PITCH, y: l.base + 40 }),
        };
      });
      assert.deepEqual(first.wet, [{ from: 4, to: 5 }], 'level 10 opens with the two-wide puddle');
      assert.equal(first.drawn, 1, 'one wide puddle is drawn');
      await screenshot('domino-run-10-portrait');
      await page.evaluate(({ a, b }) => kit.drag(kit.line([a.x, a.y], [b.x, b.y], 16)), first);
      await page.waitForTimeout(500);
      await tapNode('neo.scene.game.starters[0]');
      await idle();
      st = await page.evaluate(async () => {
        const L = await import('/src/games/domino-run/logic.ts'),
          g = neo.scene.game;
        return { stall: L.run(g.line, g.placed)[0].stall?.reason, stalls: g.stalls, misses: g.misses };
      });
      assert.deepEqual(
        st,
        { stall: 'too-heavy', stalls: 1, misses: 0 },
        'a giant straight after the small stalls too heavy, never a miss',
      );
      await page.evaluate(() => neo.scene.game.askForHint());
      await page.waitForTimeout(200);
      st = await state();
      assert.deepEqual([st.hints, st.hinted], [1, true], 'a requested hint glows and counts once');
      await solveAll();
      st = await state();
      assert.deepEqual([st.misses, st.hints], [0, 1], 'level 10: no misses, the one requested hint');
      await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers10, {
        timeout: 15000,
      });
      played.push('level 10 upright with a giant too soon, a requested hint and the fix');
    }
    if (want(11)) {
      // Level 11 upright: the first line has the pier at slot 3; the tall dropped under it springs back (never a miss, hint or
      // stall), and the hint's way (small under the pier, tall, giant) rings the gong.
      const stickers11 = await page.evaluate(() => kit.store.data.stickers.length);
      await launch('domino-run', 11);
      await idle();
      await page.waitForTimeout(500);
      const first = await page.evaluate(async () => {
        const L = await import('/src/games/domino-run/logic.ts'),
          g = neo.scene.game,
          l = g.lay.lanes[0];
        const p = g.pieces.find((q) => !q.at && q.size === 2);
        return {
          low: g.line.lanes[0].low,
          end: g.line.lanes[0].end,
          a: p.node.toGlobal({ x: 0, y: -60 }),
          b: g.pieceLayer.parent.toGlobal({ x: l.x0 + 3 * L.PITCH, y: l.base + 40 }),
        };
      });
      assert.deepEqual(
        [first.low, first.end],
        [[3], 'gong'],
        'level 11 opens with the pier at slot 3 and a gong',
      );
      await page.evaluate(({ a, b }) => kit.drag(kit.line([a.x, a.y], [b.x, b.y], 16)), first);
      await page.waitForTimeout(600);
      st = await page.evaluate(() => {
        const g = neo.scene.game;
        return {
          misses: g.misses,
          hints: g.hints,
          stalls: g.stalls,
          inTray: g.pieces.every((q) => !q.at),
          pier: g.placed[0][3],
        };
      });
      assert.deepEqual(
        st,
        { misses: 0, hints: 0, stalls: 0, inTray: true, pier: 0 },
        'a tall dropped under the pier springs back, never a miss',
      );
      await screenshot('domino-run-11-portrait');
      await solveAll();
      st = await state();
      assert.deepEqual([st.misses, st.hints], [0, 0], 'level 11: no misses, no hints');
      await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers11, {
        timeout: 15000,
      });
      played.push('level 11 upright with a refused tall under the pier and the climb to the gong');
    }
    await page.setViewportSize({ width: 1024, height: 768 });
    assert.deepEqual(errors, [], 'page errors');
    log(`Domino Run: ${played.join(', ')}`);
  }

  return { dominoRunPlay };
}
