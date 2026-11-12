import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  /** Fruit Slice by touch: level 1 by taps, two wrong-kind swipes at 3 (two misses, one glow), level 7's boards by straight lines (portrait screenshot), level 3 at sunset with a new fruit (portrait screenshot), level 8 by swipes, the bowl and the pair board, level 9 upright with a stranding first line and a requested hint (portrait screenshot), level 10 upright with a stuck total, a hinted put-back (portrait screenshot) and an overshoot, level 11 upright with an early bowl tap (portrait screenshot) and an overshoot. `FRUIT_LEVELS=10` (a comma list) plays only those levels. */
  async function fruitSlicePlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return { misses: g.misses, hints: g.hints, glow: g.glow?.kind ?? null, index: g.index };
      });
    const idle = () =>
      page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, {
        timeout: 15000,
      });
    /** Wait for a hanging fruit that is right (or wrong) now; returns its place on screen. */
    const hanging = async (right) => {
      await page.evaluate(async () => {
        window.FS = await import('/src/games/fruit-slice/logic.ts');
      });
      const h = await page.waitForFunction(
        (right) => {
          const L = window.FS,
            g = neo.scene.game;
          if (neo.scene.finished || (g && L.met(g.current))) return 'done';
          if (!g || g.busy) return null;
          const f = g.flyers.find(
            (q) =>
              !q.gone &&
              q.t > L.RISE + 0.15 &&
              q.t < L.RISE + L.HANG - 0.6 &&
              g.rightNow(q.toss.kind) === right,
          );
          return f ? g.ctx.stage.toGlobal({ x: f.node.x, y: f.node.y }) : null;
        },
        right,
        { timeout: 20000, polling: 50 },
      );
      return h.jsonValue();
    };
    const swipe = async (p) => {
      if (p === 'done') return;
      const s = await page.evaluate(() => neo.scene.game.ctx.stage.worldTransform.a);
      await page.evaluate(({ p, d }) => kit.drag(kit.line([p.x - d, p.y], [p.x + d, p.y], 10)), {
        p,
        d: 100 * s,
      });
      await page.waitForTimeout(150);
    };
    const tapBowl = async () => {
      await page.evaluate(async () => {
        window.FS = await import('/src/games/fruit-slice/logic.ts');
      });
      await page.waitForFunction(
        () => {
          const g = neo.scene.game;
          return !g.busy && window.FS.met(g.current);
        },
        null,
        { timeout: 15000 },
      );
      const p = await page.evaluate(() => neo.scene.game.bowl.toGlobal({ x: 0, y: -10 }));
      await page.evaluate(({ x, y }) => kit.tap(x, y), p);
      await page.waitForTimeout(300);
    };
    const drawSolution = async () => {
      await idle();
      const l = await page.evaluate(() => {
        const g = neo.scene.game,
          l = g.solution();
        const st = g.ctx.stage;
        return { a: st.toGlobal(g.boardPoint(l.a)), b: st.toGlobal(g.boardPoint(l.b)) };
      });
      await page.evaluate(({ a, b }) => kit.drag(kit.line([a.x, a.y], [b.x, b.y], 14)), l);
      await page.waitForTimeout(400);
    };
    const want = (l) =>
      !process.env.FRUIT_LEVELS || process.env.FRUIT_LEVELS.split(',').map(Number).includes(l);
    /** Level 10: wait for a hanging fruit of this kind (or, for 'good', one the hint would cut; for 'any', any). */
    const hangingKind = async (kind) => {
      await page.evaluate(async () => {
        window.FS = await import('/src/games/fruit-slice/logic.ts');
      });
      const h = await page.waitForFunction(
        (kind) => {
          const L = window.FS,
            g = neo.scene.game;
          if (!g || g.busy) return null;
          const f = g.flyers.find(
            (q) =>
              !q.gone &&
              q.t > L.RISE + 0.15 &&
              q.t < L.RISE + L.HANG - 0.6 &&
              (kind === 'any' || (kind === 'good' ? g.goodNow(q.toss.kind) : q.toss.kind === kind)),
          );
          return f ? g.ctx.stage.toGlobal({ x: f.node.x, y: f.node.y }) : null;
        },
        kind,
        { timeout: 30000, polling: 50 },
      );
      return h.jsonValue();
    };
    const sticker = async (n) =>
      page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 20000 });

    let n, st;
    if (want(1)) {
      // Level 1: a tap on each fruit slices it; no misses or hints; one sticker.
      await launch('fruit-slice', 1);
      await idle();
      n = await page.evaluate(() => kit.store.data.stickers.length);
      for (let guard = 0; guard < 12 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
        const p = await hanging(true);
        if (p === 'done') break;
        await page.evaluate(({ x, y }) => kit.tap(x, y), p);
        await page.waitForTimeout(250);
      }
      st = await state();
      assert.deepEqual([st.misses, st.hints], [0, 0], 'level 1 has no misses or hints');
      await sticker(n);
    }

    if (want(3)) {
      // Level 3: two swipes through the wrong kind bounce (two misses) and the second lights the glow (one hint); then the right ones.
      await launch('fruit-slice', 3);
      await idle();
      n = await page.evaluate(() => kit.store.data.stickers.length);
      await swipe(await hanging(false));
      st = await state();
      assert.deepEqual([st.misses, st.hints], [1, 0], 'a wrong-kind swipe is one miss');
      await swipe(await hanging(false));
      st = await state();
      assert.deepEqual(
        [st.misses, st.hints, st.glow],
        [2, 1, 'fruit'],
        'the second miss glows the next right one, one hint',
      );
      for (let guard = 0; guard < 14 && !(await page.evaluate(() => neo.scene.finished)); guard++)
        await swipe(await hanging(true));
      await sticker(n);
      st = await state();
      assert.deepEqual([st.misses, st.hints], [2, 1]);
    }

    if (want(7)) {
      // Level 7 upright: four boards, each solved by one straight line; one screenshot of the first board.
      await page.setViewportSize({ width: 768, height: 1024 });
      await launch('fruit-slice', 7);
      await idle();
      await page.waitForTimeout(500);
      await screenshot('fruit-slice-7-portrait');
      n = await page.evaluate(() => kit.store.data.stickers.length);
      // U7 R4: "Yes! One line through …" (2.4 s when muted) never holds the next board: it arrives once the halves
      // land (0.7 s) and can be cut at once; with the line awaited it was 2.4 s.
      await drawSolution();
      await page.waitForFunction(() => neo.scene.game.index === 1 && !neo.scene.game.busy, null, {
        timeout: 1300,
      });
      for (let guard = 0; guard < 8 && !(await page.evaluate(() => neo.scene.finished)); guard++)
        await drawSolution();
      await sticker(n);
      st = await state();
      assert.deepEqual([st.misses, st.hints], [0, 0], 'level 7 solved by the hint lines');
    }

    if (want(3)) {
      // Level 3 upright in the sunset mood, asking for one of the new fruit; one screenshot, then sliced to the end.
      const NEW = ['strawberry', 'banana', 'plum'];
      let look = null;
      for (let tries = 0; tries < 40; tries++) {
        await launch('fruit-slice', 3);
        await idle();
        look = await page.evaluate(() => ({
          mood: neo.scene.game.mood,
          kind: neo.scene.game.current.rows[0].kind,
        }));
        if (look.mood === 'sunset' && NEW.includes(look.kind)) break;
      }
      assert.equal(look.mood, 'sunset', 'a sunset round comes up');
      assert.ok(NEW.includes(look.kind), 'a new fruit is asked for');
      await page.waitForTimeout(3200);
      await screenshot('fruit-slice-3-sunset-portrait');
      n = await page.evaluate(() => kit.store.data.stickers.length);
      for (let guard = 0; guard < 14 && !(await page.evaluate(() => neo.scene.finished)); guard++)
        await swipe(await hanging(true));
      await sticker(n);
      st = await state();
      assert.deepEqual([st.misses, st.hints], [0, 0], `level 3 with ${look.kind} at sunset, no misses`);
      await page.setViewportSize({ width: 1024, height: 768 });
    }

    if (want(8)) {
      // Level 8: two signs by swipes and the bowl, then the pair board by straight lines and the bowl.
      await launch('fruit-slice', 8);
      await idle();
      n = await page.evaluate(() => kit.store.data.stickers.length);
      for (let sign = 0; sign < 2; sign++) {
        for (let guard = 0; guard < 10; guard++) {
          if (
            await page.evaluate(async () => {
              const L = await import('/src/games/fruit-slice/logic.ts');
              return L.met(neo.scene.game.current);
            })
          )
            break;
          await swipe(await hanging(true));
        }
        await tapBowl();
        await idle();
      }
      assert.equal(
        await page.evaluate(() => neo.scene.game.current.board),
        true,
        'the last sign is a still board',
      );
      for (let guard = 0; guard < 8; guard++) {
        if (
          await page.evaluate(async () => {
            const L = await import('/src/games/fruit-slice/logic.ts');
            return L.met(neo.scene.game.current);
          })
        )
          break;
        await drawSolution();
      }
      await tapBowl();
      await sticker(n);
      st = await state();
      assert.deepEqual([st.misses, st.hints], [0, 0], 'level 8 with no misses');
    }

    if (want(9)) {
      // Level 9 upright: a first line that strands the rest is one miss and the board comes back whole; a requested hint
      // dashes a cover's first line (portrait screenshot); then four boards by two lines each.
      await page.setViewportSize({ width: 768, height: 1024 });
      n = await page.evaluate(() => kit.store.data.stickers.length);
      await launch('fruit-slice', 9);
      await idle();
      await page.waitForTimeout(400);
      const stuck = await page.evaluate(async () => {
        const L = await import('/src/games/fruit-slice/logic.ts');
        const g = neo.scene.game,
          f = g.board.fruit,
          st = g.ctx.stage;
        const l = L.coverLines(f).find((l) => {
          const h = L.lineHits(l.a, l.b, f);
          return h.length && L.coverStep(f, [], h, 1) === 'stuck';
        });
        return { a: st.toGlobal(g.boardPoint(l.a)), b: st.toGlobal(g.boardPoint(l.b)) };
      });
      await page.evaluate(({ a, b }) => kit.drag(kit.line([a.x, a.y], [b.x, b.y], 14)), stuck);
      await page.waitForTimeout(200);
      await idle();
      st = await page.evaluate(() => {
        const g = neo.scene.game;
        return {
          misses: g.misses,
          hints: g.hints,
          cut: g.stills.filter((s) => s.cut).length,
          used: g.linesUsed,
        };
      });
      assert.deepEqual(
        st,
        { misses: 1, hints: 0, cut: 0, used: 0 },
        'level 9: a stranding first line is one miss and the fruit come back',
      );
      await page.evaluate(() => neo.scene.game.askForHint());
      st = await state();
      assert.deepEqual(
        [st.misses, st.hints, st.glow],
        [1, 1, 'line'],
        'level 9: a requested hint dashes a line',
      );
      await page.waitForTimeout(300);
      await screenshot('fruit-slice-9-portrait-hint');
      for (let guard = 0; guard < 12 && !(await page.evaluate(() => neo.scene.finished)); guard++)
        await drawSolution();
      await sticker(n);
      st = await state();
      assert.deepEqual([st.misses, st.hints], [1, 1], 'level 9: the one stranding line and the one hint');
    }

    // Level 10 upright: two oranges leave one piece short (no miss; a bowl tap says so); a requested hint glows a token
    // (portrait screenshot) and the put-back frees the round; an orange past the sign is one miss; then every sign.
    if (want(10)) {
      await page.setViewportSize({ width: 768, height: 1024 });
      await launch('fruit-slice', 10);
      await idle();
      n = await page.evaluate(() => kit.store.data.stickers.length);
      assert.equal(
        await page.evaluate(() => neo.scene.game.current.rows[0].n),
        7,
        'level 10: the first sign is 7',
      );
      await swipe(await hangingKind('orange'));
      await swipe(await hangingKind('orange'));
      const landed = () =>
        page.waitForFunction(
          () => {
            const g = neo.scene.game;
            return g.bowlFruit.every((b) => b.landed);
          },
          null,
          { timeout: 5000 },
        );
      await landed();
      st = await page.evaluate(() => {
        const g = neo.scene.game;
        return {
          misses: g.misses,
          stuck: g.isStuck,
          tokens: g.strip.children.length,
          chips: g.bowlFill.children.length,
        };
      });
      assert.deepEqual(
        st,
        { misses: 0, stuck: true, tokens: 2, chips: 6 },
        'level 10: one piece short is never a miss; two tokens, six pieces',
      );
      const bowlAt = await page.evaluate(() => neo.scene.game.bowl.toGlobal({ x: 0, y: -10 }));
      await page.evaluate(({ x, y }) => kit.tap(x, y), bowlAt);
      await page.waitForTimeout(300);
      await page.evaluate(() => neo.scene.game.askForHint());
      st = await state();
      assert.deepEqual(
        [st.misses, st.hints, st.glow],
        [0, 1, 'token'],
        'level 10: a requested hint glows a token',
      );
      await page.waitForTimeout(300);
      await screenshot('fruit-slice-10-portrait-put-back');
      const token = await page.evaluate(() => {
        const g = neo.scene.game,
          t = g.tokenFor(g.glow.token);
        return t.toGlobal({ x: 0, y: 0 });
      });
      await page.evaluate(({ x, y }) => kit.tap(x, y), token);
      await page.waitForTimeout(400);
      st = await page.evaluate(async () => {
        const L = await import('/src/games/fruit-slice/logic.ts');
        const g = neo.scene.game;
        return { left: L.left(g.current), bowl: g.bowlKinds, misses: g.misses };
      });
      assert.deepEqual(
        st,
        { left: 4, bowl: ['orange'], misses: 0 },
        'level 10: the put-back is free and gives the pieces back',
      );
      await swipe(await hangingKind('apple'));
      await swipe(await hangingKind('orange'));
      st = await state();
      assert.deepEqual([st.misses, st.hints], [1, 1], 'level 10: an orange past the sign is one miss');
      for (let sign = 0; sign < 3; sign++) {
        for (let guard = 0; guard < 10; guard++) {
          if (
            await page.evaluate(async () => {
              const L = await import('/src/games/fruit-slice/logic.ts');
              return L.met(neo.scene.game.current);
            })
          )
            break;
          await swipe(await hangingKind('good'));
        }
        await tapBowl();
        await idle();
      }
      await sticker(n);
      st = await state();
      assert.deepEqual([st.misses, st.hints], [1, 1], 'level 10: the one overshoot and the one hint');
      await page.setViewportSize({ width: 1024, height: 768 });
    }

    if (want(11)) {
      // Level 11 upright: two aloft and a sign of 2 (portrait screenshot); an early bowl tap is free; a cut past the full
      // bowl is one miss; then the signs of 3 and 3.
      await page.setViewportSize({ width: 768, height: 1024 });
      await launch('fruit-slice', 11);
      await idle();
      n = await page.evaluate(() => kit.store.data.stickers.length);
      st = await page.evaluate(() => {
        const g = neo.scene.game;
        return { aloft: g.plan.aloft, n: g.current.rows[0].n };
      });
      assert.deepEqual(st, { aloft: 2, n: 2 }, 'level 11: two aloft and a first sign of 2');
      await swipe(await hanging(true));
      const bowlAt = await page.evaluate(() => neo.scene.game.bowl.toGlobal({ x: 0, y: -10 }));
      await page.evaluate(({ x, y }) => kit.tap(x, y), bowlAt);
      await page.waitForTimeout(300);
      st = await state();
      assert.deepEqual(
        [st.misses, st.hints, st.index],
        [0, 0, 0],
        'level 11: an early bowl tap is free and sends nothing',
      );
      await screenshot('fruit-slice-11-portrait');
      for (let guard = 0; guard < 6; guard++) {
        if (
          await page.evaluate(async () => {
            const L = await import('/src/games/fruit-slice/logic.ts');
            return L.met(neo.scene.game.current);
          })
        )
          break;
        await swipe(await hanging(true));
      }
      await swipe(await hangingKind('any'));
      st = await state();
      assert.deepEqual([st.misses, st.hints], [1, 0], 'level 11: a cut past the full bowl is one miss');
      await tapBowl();
      await idle();
      for (let sign = 1; sign < 3; sign++) {
        assert.equal(
          await page.evaluate(() => neo.scene.game.current.rows[0].n),
          3,
          'level 11: then signs of 3',
        );
        for (let guard = 0; guard < 8; guard++) {
          if (
            await page.evaluate(async () => {
              const L = await import('/src/games/fruit-slice/logic.ts');
              return L.met(neo.scene.game.current);
            })
          )
            break;
          await swipe(await hanging(true));
        }
        await tapBowl();
        await idle();
      }
      await sticker(n);
      st = await state();
      assert.deepEqual([st.misses, st.hints], [1, 0], 'level 11: the one overshoot');
      await page.setViewportSize({ width: 1024, height: 768 });
    }

    assert.deepEqual(errors, [], 'page errors');
    log(
      'Fruit Slice: level 1 by taps, two wrong-kind swipes and a glow at 3, level 7 by lines (upright), level 3 at sunset with a new fruit (upright), level 8 by swipes, the bowl and the pair board, level 9 upright with a stranding line, a hint and two lines a board, level 10 upright with a stuck total, a hinted put-back and an overshoot, level 11 upright with an early bowl tap and an overshoot',
    );
  }

  return { fruitSlicePlay };
}
