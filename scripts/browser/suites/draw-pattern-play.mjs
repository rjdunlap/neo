import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  /** Draw the Pattern by touch: level 1 by marks (one touch during the pet's turn, one off the paper), two strays at 3 (a miss, then the glow), level 4's circle both ways, a level 5 portrait screenshot, a wrong candidate at 8, two strays at 9's rain and its finished picture. `DRAW_LEVELS=9` runs only level 9. */
  async function drawPatternPlay() {
    const only = process.env.DRAW_LEVELS?.split(',').map(Number);
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return { misses: g.misses, hints: g.hints, glow: g.glow, index: g.index };
      });
    const idle = () =>
      page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, {
        timeout: 25000,
      });
    const sticker = (n) =>
      page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });
    const stickers = () => page.evaluate(() => kit.store.data.stickers.length);
    /** Screen points along the stroke she is on, from where the crayon waits: way `order` (the chosen or continuing one by default). */
    const route = (order = null) =>
      page.evaluate(async (order) => {
        const L = await import('/src/games/draw-the-pattern/logic.ts');
        const g = neo.scene.game,
          t = g.tracks[g.cur];
        const o = order ?? t.stroke.right ?? t.order ?? 0;
        const from = t.order === o || t.order === null ? t.progress : 0;
        return L.botRoute(t.stroke, t.stroke.orders[o], from)
          .map((p) => g.paper.toGlobal({ x: p[0] * g.s, y: p[1] * g.s }))
          .map((p) => [p.x, p.y]);
      }, order);
    const dragAlong = (pts) =>
      page.evaluate((pts) => {
        const path = [];
        for (let i = 1; i < pts.length; i++) path.push(...kit.line(pts[i - 1], pts[i], 6));
        return kit.drag(path);
      }, pts);
    const done = () => page.evaluate(() => neo.scene.finished || neo.scene.game.finished);
    const drawOn = async (order = null) => {
      await idle();
      if (await done()) return;
      await dragAlong(await route(order));
      await page.waitForTimeout(150);
    };
    const finishRound = async (n) => {
      for (let guard = 0; guard < 16 && !(await page.evaluate(() => neo.scene.finished)); guard++)
        await drawOn();
      await sticker(n);
    };

    const stray = async () => {
      const pts = await route();
      const off = [pts[1][0], pts[1][1] + 260];
      await page.evaluate(({ a, b, c }) => kit.drag([...kit.line(a, b, 6), ...kit.line(b, c, 8)]), {
        a: pts[0],
        b: pts[1],
        c: off,
      });
      await page.waitForTimeout(200);
    };
    let n, st;
    if (!only || only.includes(1)) {
      // Level 1: four marks on each of three strips (a pat counts too); no misses or hints.
      await launch('draw-the-pattern', 1);
      /** A screen point off the paper and off the picture: level 1's surround, which draws too (P4). */
      const offPaper = () =>
        page.evaluate(() => {
          const g = neo.scene.game;
          for (const [x, y] of [
            [1.7, 1.45],
            [1.7, -0.45],
            [-0.15, 0.5],
            [3.55, 0.5],
          ]) {
            const p = g.paper.toGlobal({ x: x * g.s, y: y * g.s }),
              l = g.layer.toLocal(p);
            if (g.layer.hitArea.contains(l.x, l.y)) return [p.x, p.y];
          }
          return null;
        });
      // P4: a touch during the pet's turn rings rather than being dropped, and counts as nothing.
      await page.waitForFunction(() => neo.scene.game?.busy, null, { timeout: 10000 });
      {
        const at = await offPaper();
        assert.ok(at, 'level 1 has a surround off the paper and the picture');
        await page.evaluate((at) => kit.tap(at[0], at[1]), at);
        const held = await page.evaluate(() => ({
          heldAt: neo.scene.game.heldAt,
          lifts: neo.scene.game.lifts,
          marks: neo.scene.game.marks.length,
        }));
        assert.ok(held.heldAt >= 0, "a touch during the pet's turn is answered");
        assert.deepEqual(
          [held.lifts, held.marks],
          [0, 0],
          "a touch during the pet's turn draws and counts nothing",
        );
      }
      await idle();
      n = await stickers();
      // P4: a touch off the paper draws at the nearest place on it and counts as one of the four.
      {
        const at = await offPaper();
        await page.evaluate((at) => kit.tap(at[0], at[1]), at);
        await page.waitForTimeout(150);
        const g = await page.evaluate(() => ({
          lifts: neo.scene.game.lifts,
          marks: neo.scene.game.marks.length,
        }));
        assert.deepEqual([g.lifts, g.marks], [1, 1], 'a touch off the paper makes a mark on it');
      }
      // U7 R4: each strip's line starts as it rolls into the picture and times how long until the next strip is open.
      await page.evaluate(() => {
        const g = neo.scene.game,
          say = g.ctx.say.bind(g.ctx);
        window.drawR4 = [];
        g.ctx.say = (id, vars) => {
          if (String(id).startsWith('draw.picture.')) {
            const at = g.index,
              t = performance.now();
            void kit
              .until(() => g.finished || (g.index > at && !g.busy), 6000)
              .then(() => drawR4.push({ ms: performance.now() - t, last: g.finished }));
          }
          return say(id, vars);
        };
      });
      for (let guard = 0; guard < 20 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
        await idle();
        if (await done()) break;
        const pts = await page.evaluate((k) => {
          const g = neo.scene.game;
          return [0.5 + (k % 4) * 0.7, 0.9 + (k % 4) * 0.7]
            .map((x, i) => g.paper.toGlobal({ x: x * g.s, y: (0.3 + i * 0.3) * g.s }))
            .map((p) => [p.x, p.y]);
        }, guard);
        if (guard % 4 === 3) await page.evaluate(([a]) => kit.tap(a[0], a[1]), pts);
        else await dragAlong(pts);
        await page.waitForTimeout(150);
      }
      await sticker(n);
      st = await state();
      assert.deepEqual([st.misses, st.hints], [0, 0], 'level 1 has no misses or hints');
      // The unroll and the pet's 1.6 s marks come to about 2 s; with the strip's line awaited first it was about 3.5 s.
      const opens = (await page.evaluate(() => drawR4)).filter((o) => !o.last);
      assert.ok(opens.length >= 2, `R4: ${opens.length} strips timed`);
      assert.ok(
        opens.every((o) => o.ms < 2600),
        `R4: the next strip waited for the strip's line (${opens.map((o) => Math.round(o.ms)).join(', ')} ms)`,
      );
      log(
        `Draw the Pattern 1: R4, next strip open ${opens.map((o) => Math.round(o.ms)).join(', ')} ms after its line`,
      );
    }

    if (!only || only.includes(3)) {
      // Level 3: draw a little, wander off (one miss, progress kept), wander again (the glow, one hint), then finish.
      await launch('draw-the-pattern', 3);
      await idle();
      n = await stickers();
      const lead = await page.evaluate(() => neo.scene.game.tracks[0].stroke.lead);
      await stray();
      st = await state();
      assert.deepEqual([st.misses, st.hints], [1, 0], 'a stray is one miss');
      assert.ok(
        await page.evaluate((lead) => neo.scene.game.tracks[0].progress > lead, lead),
        'progress is kept after a stray',
      );
      await stray();
      st = await state();
      assert.deepEqual(
        [st.misses, st.hints, st.glow],
        [2, 1, true],
        'the second stray lights the way, one hint',
      );
      await finishRound(n);
    }

    if (!only || only.includes(4)) {
      // Level 4: the circle counterclockwise (the bot's way), then another round's circle clockwise by a kit drag.
      for (const way of [0, 1]) {
        await launch('draw-the-pattern', 4);
        await idle();
        n = await stickers();
        await drawOn(way);
        assert.equal(
          await page.evaluate(() => neo.scene.game.tracks[0].order),
          way,
          `the circle went ${way ? 'clockwise' : 'counterclockwise'}`,
        );
        await finishRound(n);
      }
    }

    if (!only || only.includes(5)) {
      // Level 5 upright: one screenshot once the dashes have faded.
      await page.setViewportSize({ width: 768, height: 1024 });
      await launch('draw-the-pattern', 5);
      await idle();
      await page.waitForTimeout(400);
      await screenshot('draw-the-pattern-5-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
    }

    if (!only || only.includes(8)) {
      // Level 8: draw the candidate that breaks the pattern past its divergence (one miss, the rule), then finish.
      await launch('draw-the-pattern', 8);
      await idle();
      n = await stickers();
      const wrong = await page.evaluate(() => {
        const t = neo.scene.game.tracks[0];
        return 1 - t.stroke.right;
      });
      await dragAlong(await route(wrong));
      await idle();
      st = await state();
      assert.equal(st.misses, 1, 'a wrong candidate is one miss');
      assert.equal(await page.evaluate(() => neo.scene.game.tracks[0].progress), 0, 'her wrong stroke fades');
      await finishRound(n);
      st = await state();
      assert.deepEqual([st.misses, st.hints], [1, 0]);
    }

    if (!only || only.includes(9)) {
      // Level 9 at pre-K: the pet draws the first rain line; she strays on the second (one miss, then the glow and a hint),
      // finishes the rain, then draws the X back-slash first; the picture shows rain and a kite or a treasure mark.
      await launch('draw-the-pattern', 9, 'Mia', 'prek');
      await idle();
      n = await stickers();
      const kinds = await page.evaluate(() => neo.scene.game.tracks.map((t) => t.stroke.kind));
      assert.deepEqual(kinds, ['slant', 'slant'], 'she draws the second and third rain lines');
      const lead9 = await page.evaluate(() => neo.scene.game.tracks[0].stroke.lead);
      await stray();
      st = await state();
      assert.deepEqual([st.misses, st.hints], [1, 0], 'a stray off a slanting line is one miss');
      assert.ok(
        await page.evaluate((lead) => neo.scene.game.tracks[0].progress > lead, lead9),
        'progress is kept after a stray',
      );
      await stray();
      st = await state();
      assert.deepEqual(
        [st.misses, st.hints, st.glow],
        [2, 1, true],
        'the second stray lights the way, one hint',
      );
      for (let guard = 0; guard < 8 && (await page.evaluate(() => neo.scene.game.index)) === 0; guard++)
        await drawOn();
      await idle();
      assert.deepEqual(
        await page.evaluate(() => neo.scene.game.tracks.map((t) => t.stroke.kind)),
        ['x-back', 'x-fwd'],
        'the X is back-slash, then forward-slash',
      );
      await finishRound(n);
      st = await state();
      assert.deepEqual([st.misses, st.hints], [2, 1]);
      assert.ok(['kite', 'treasure'].includes(await page.evaluate(() => neo.scene.game.strips[1].piece)));
      await screenshot('draw-the-pattern-9-picture');
    }
    if (!only || only.includes(10)) {
      // Level 10 at lap: dot to dot. A tap beside the shining dot and a drag that wanders off are never wrong; taps on the
      // shining dots draw the line, a drag along the dashes carries one gap of the zigzag, and the round ends with no misses.
      // Then a smooth toddler round steps the saved level along toddler's order, 10 to 2. One portrait screenshot.
      const dotAt = () =>
        page.evaluate(async () => {
          const L = await import('/src/games/draw-the-pattern/logic.ts');
          const g = neo.scene.game,
            t = g.tracks[g.cur];
          const i = L.nextDot(t.stroke, t.progress),
            p = t.stroke.orders[0][i];
          const q = g.paper.toGlobal({ x: p[0] * g.s, y: p[1] * g.s });
          return [q.x, q.y];
        });
      const tapDots = async (stop = () => false) => {
        for (let guard = 0; guard < 20 && !(await done()) && !(await stop()); guard++) {
          await idle();
          if (await done()) break;
          await page.waitForFunction(() => !neo.scene.game.tapping);
          const [x, y] = await dotAt();
          await page.evaluate(([x, y]) => kit.tap(x, y), [x, y]);
          await page.waitForTimeout(600);
        }
      };
      await page.setViewportSize({ width: 768, height: 1024 });
      await launch('draw-the-pattern', 10, 'Mia', 'lap');
      await idle();
      n = await stickers();
      const before = await page.evaluate(() => neo.scene.game.tracks[0].progress);
      const [dx, dy] = await dotAt();
      await page.evaluate(([x, y]) => kit.tap(x, y + 160), [dx, dy]);
      await page.waitForTimeout(300);
      await stray();
      st = await state();
      assert.deepEqual([st.misses, st.hints], [0, 0], 'a tap off the dot and a stray drag are not misses');
      await page.waitForFunction(() => !neo.scene.game.tapping);
      const after = await page.evaluate(() => neo.scene.game.tracks[0].progress);
      await page.evaluate(([x, y]) => kit.tap(x, y), [dx, dy]);
      await page.waitForTimeout(700);
      const dot = await page.evaluate(() => {
        const t = neo.scene.game.tracks[0];
        return { progress: t.progress, dots: t.stroke.dots };
      });
      assert.ok(
        after >= before && dot.progress === dot.dots[2],
        'a tap on the shining dot draws the crayon to it',
      );
      await tapDots(() => page.evaluate(() => neo.scene.game.index > 0));
      await idle();
      assert.equal(
        await page.evaluate(() => neo.scene.game.strip.strokes[0].kind),
        'zig',
        'the second strip is the zigzag',
      );
      await screenshot('draw-the-pattern-10-portrait');
      await drawOn();
      assert.ok(
        await page.evaluate(() => {
          const t = neo.scene.game.tracks[0];
          return t.progress > t.stroke.lead;
        }),
        'a drag along the dashes carries on too',
      );
      await tapDots();
      await sticker(n);
      st = await state();
      assert.deepEqual([st.misses, st.hints], [0, 0]);
      await page.setViewportSize({ width: 1024, height: 768 });
      // The lap round was one smooth round at 10; a smooth toddler round at 10 makes two, and toddler's order steps to 2.
      await launch('draw-the-pattern', 10, 'Mia', 'toddler');
      await page.evaluate(() => {
        delete kit.store.stats('draw-the-pattern').pinned;
      });
      await idle();
      n = await stickers();
      await tapDots();
      await sticker(n);
      await page.evaluate(() => neo.go.game('draw-the-pattern', 'toddler'));
      await page.waitForFunction(
        () =>
          !neo.switching &&
          neo.scene.mod?.id === 'draw-the-pattern' &&
          !neo.scene.finished &&
          neo.scene.level !== 10,
        null,
        { timeout: 15000 },
      );
      assert.equal(await page.evaluate(() => neo.scene.level), 2, 'the next toddler round opens at level 2');
      assert.equal(
        await page.evaluate(() => kit.store.stats('draw-the-pattern').level),
        2,
        'two smooth rounds at 10 step toddler up to 2',
      );
    }
    assert.deepEqual(errors, [], 'page errors');
    log(
      `Draw the Pattern: ${only ? `levels ${only.join(', ')}` : 'level 1 by marks, two strays and the glow at 3, the level-4 circle both ways, level 5 upright, a wrong candidate at 8, two strays and the picture at 9'}`,
    );
  }

  return { drawPatternPlay };
}
