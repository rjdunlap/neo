import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  /** Puddle Gobble by touch: level 1 led by taps, level 8 with a too-big touch (never a miss), a refused overshoot (one miss), a requested hint (one hint), finished by taps; level 9 with one bigger number first (one miss); level 10 with a too-big touch and the 5 → 10 → 6 step; level 11 under the pail and a requested hint; level 4 upright; level 5 upright in the evening mood; level 12 (two pails) upright with a lead onto the wrong pail, a refused overshoot, a pour, a tip back and a requested hint. `PUDDLE_ONLY=12` plays level 12 alone. */
  async function puddleGobblePlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          misses: g.misses,
          hints: g.hints,
          puddle: g.state.puddle,
          left: g.state.left.length,
          glow: g.glow,
        };
      });
    /** Wait until the puddle has stopped gliding and nothing is sliding in or hopping out. */
    const still = async () => {
      await page.evaluate(async () => {
        window.PGL = await import('/src/games/puddle-gobble/logic.ts');
      });
      await page.waitForFunction(
        () => {
          const g = neo.scene.game;
          if (neo.scene.finished) return true;
          // Gliding done, nothing sliding in or hopping out, and the puddle grown to its size.
          return (
            g &&
            !g.busy &&
            Math.hypot(g.target.x - g.puddle.x, g.target.y - g.puddle.y) < 2 &&
            !g.items.some((i) => i.where === 'moving') &&
            Math.abs(g.diameter - window.PGL.puddleDiameter(g.plan, g.state.puddle)) < 1
          );
        },
        null,
        { timeout: 15000 },
      );
    };
    /** Tap on thing `id` (the puddle glides there), or a let-go token. */
    const tapThing = async (id) => {
      const p = await page.evaluate((id) => {
        const g = neo.scene.game;
        return g.ctx.stage.toGlobal(g.items[id].node.position);
      }, id);
      await page.evaluate(({ x, y }) => kit.tap(x, y), p);
      await page.waitForTimeout(200);
      await still();
    };
    /** Set the puddle down just beside thing `id`, clear of the rest, so the next tap reaches only it. */
    const besides = (id) =>
      page.evaluate((id) => {
        const g = neo.scene.game,
          it = g.items[id],
          R = g.diameter / 2,
          f = g.field;
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2,
            x = it.node.x + Math.cos(a) * (R + 24),
            y = it.node.y + Math.sin(a) * (R + 24);
          if (x < f.x0 || x > f.x1 || y < f.y0 || y > f.y1) continue;
          const mx = (x + it.node.x) / 2,
            my = (y + it.node.y) / 2;
          if (
            g.items.some(
              (o) =>
                o !== it &&
                o.where === 'sand' &&
                Math.min(Math.hypot(o.node.x - x, o.node.y - y), Math.hypot(o.node.x - mx, o.node.y - my)) <
                  R + 20,
            )
          )
            continue;
          g.puddle.position.set(x, y);
          g.target.x = x;
          g.target.y = y;
          return true;
        }
        return false;
      }, id);
    /** Tap what the hint names; `near` first sets the puddle beside it, so passing over something else cannot soak it on the way. */
    const followHint = async (near = false) => {
      const h = await page.evaluate(async () => {
        const L = await import('/src/games/puddle-gobble/logic.ts');
        const g = neo.scene.game;
        return L.hintTarget(g.board, g.state);
      });
      if (!h) return;
      if ('pour' in h) {
        await besidePail(h.pour);
        await tapPail(h.pour);
      } else if ('tip' in h) {
        await tapPail(h.tip);
      } else if ('letGo' in h) {
        const p = await page.evaluate((id) => {
          const g = neo.scene.game;
          return g.tokens.find((t) => t.id === id).node.toGlobal({ x: 0, y: 0 });
        }, h.letGo);
        await page.evaluate(({ x, y }) => kit.tap(x, y), p);
        await page.waitForTimeout(200);
        await still();
      } else {
        if (near) await besides(h.soak);
        await tapThing(h.soak);
      }
    };
    const sticker = (n) =>
      page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 20000 });

    /** Level 12: set the puddle down just below pail i, clear of the things, so a tap on the pail reaches only it. */
    const besidePail = (i) =>
      page.evaluate(async (i) => {
        const L = await import('/src/games/puddle-gobble/logic.ts');
        const g = neo.scene.game,
          at = L.pailSpots(g.plan, g.field)[i],
          R = g.diameter / 2;
        for (const a of [Math.PI / 2, (Math.PI * 2) / 3, Math.PI / 3, (Math.PI * 5) / 6, Math.PI]) {
          const x = at.x + Math.cos(a) * (R + 40),
            y = at.y + Math.sin(a) * (R + 40);
          if (g.items.some((o) => o.where === 'sand' && Math.hypot(o.node.x - x, o.node.y - y) < R + 70))
            continue;
          g.puddle.position.set(x, y);
          g.target.x = x;
          g.target.y = y;
          return true;
        }
        return false;
      }, i);
    /** Tap pail i: an open one steers the puddle onto it, a full one tips back. */
    const tapPail = async (i) => {
      const p = await page.evaluate(async (i) => {
        const L = await import('/src/games/puddle-gobble/logic.ts');
        const g = neo.scene.game;
        return g.ctx.stage.toGlobal(L.pailSpots(g.plan, g.field)[i]);
      }, i);
      await page.evaluate(({ x, y }) => kit.tap(x, y), p);
      await page.waitForTimeout(300);
      await still();
    };
    const sizeId = (v) => page.evaluate((v) => neo.scene.game.board.things.find((t) => t.size === v).id, v);
    const filled = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return g.state.filled.map((f) =>
          f ? f.map((id) => g.items[id].thing.size).sort((a, b) => a - b) : null,
        );
      });

    // Level 12 upright, the authored round: pails 9 (left) and 11, puddle 3, things 1, 2, 3, 4, 5 and 7.
    async function twoPails() {
      await page.setViewportSize({ width: 1024, height: 1365 });
      await launch('puddle-gobble', 12);
      await still();
      const n = await page.evaluate(() => kit.store.data.stickers.length);
      let st = await state();
      assert.deepEqual([st.puddle, st.left], [3, 6], 'two pails: puddle 3 with six on the sand');
      assert.deepEqual(await page.evaluate(() => neo.scene.game.board.pails), [9, 11]);
      // A lead onto the wrong pail: nothing moves, never a miss.
      assert.ok(await besidePail(1));
      await tapPail(1);
      st = await state();
      assert.deepEqual(
        [st.misses, st.puddle, st.left],
        [0, 3, 6],
        'a lead onto the wrong pail changes nothing',
      );
      assert.deepEqual(await filled(), [null, null]);
      // Smallest first to 9, then the 7 would pass the bigger pail: refused, one miss.
      for (const v of [1, 2, 3]) {
        const id = await sizeId(v);
        assert.ok(await besides(id));
        await tapThing(id);
      }
      st = await state();
      assert.equal(st.puddle, 9, '1 + 2 + 3 makes the puddle 9');
      const seven = await sizeId(7);
      assert.ok(await besides(seven));
      await tapThing(seven);
      st = await state();
      assert.deepEqual([st.misses, st.puddle], [1, 9], 'the 7 would pass 11: refused, one miss');
      // Pour into the 9; the puddle drops to 3 and the 11 is now stranded.
      assert.ok(await besidePail(0));
      await tapPail(0);
      st = await state();
      assert.deepEqual(await filled(), [[1, 2, 3], null], 'the 9 is full of 1, 2 and 3');
      assert.equal(st.puddle, 3, 'the puddle is back to 3');
      await page.waitForTimeout(400);
      await screenshot('puddle-gobble-12-portrait');
      // Tip it back: free, never a miss.
      await tapPail(0);
      st = await state();
      assert.deepEqual([st.misses, st.hints, st.left], [1, 0, 6], 'tipping back is free');
      assert.deepEqual(await filled(), [null, null]);
      await page.evaluate(() => neo.scene.game.askForHint());
      await page.waitForTimeout(150);
      st = await state();
      assert.equal(st.hints, 1, 'a requested hint counts once');
      assert.ok(st.glow, 'and glows');
      for (let guard = 0; guard < 16 && !(await page.evaluate(() => neo.scene.finished)); guard++)
        await followHint(true);
      await sticker(n);
      st = await state();
      assert.deepEqual([st.misses, st.hints], [1, 1], 'level 12 finishes with one miss and one hint');
      assert.deepEqual(await filled(), [
        [2, 4],
        [3, 5],
      ]);
      await page.setViewportSize({ width: 1024, height: 768 });
    }
    if (process.env.PUDDLE_ONLY === '12') {
      await twoPails();
      assert.deepEqual(errors, [], 'page errors');
      log(
        'Puddle Gobble level 12: a wrong pail, a refused overshoot, a pour, a tip back and a requested hint, upright',
      );
      return;
    }

    // Level 1: tap each shell; the puddle glides over and soaks it. No misses or hints; one sticker.
    await launch('puddle-gobble', 1);
    await still();
    let n = await page.evaluate(() => kit.store.data.stickers.length);
    for (let guard = 0; guard < 12 && !(await page.evaluate(() => neo.scene.finished)); guard++)
      await followHint();
    await sticker(n);
    let st = await state();
    assert.deepEqual([st.misses, st.hints], [0, 0], 'level 1 has no misses or hints');

    // Level 8: a too-big touch wobbles and counts nothing; an overshoot is refused (one miss); a requested hint glows (one hint).
    await launch('puddle-gobble', 8);
    await still();
    n = await page.evaluate(() => kit.store.data.stickers.length);
    const big = await page.evaluate(() => {
      const g = neo.scene.game;
      return g.state.left.find((id) => g.items[id].thing.size > g.state.puddle);
    });
    assert.ok(big !== undefined, 'something is too big at the start');
    assert.ok(await besides(big));
    await tapThing(big);
    st = await state();
    assert.deepEqual(
      [st.misses, st.hints, st.left],
      [0, 0, 6],
      'a too-big touch is never a miss and soaks nothing',
    );
    assert.equal(await page.evaluate((id) => neo.scene.game.items[id].where, big), 'sand');
    // Follow the hint until something that fits would pass the pail, then steer onto it.
    let over;
    for (let guard = 0; guard < 6; guard++) {
      over = await page.evaluate(() => {
        const g = neo.scene.game;
        return g.state.left.find((id) => {
          const v = g.items[id].thing.size;
          return v <= g.state.puddle && g.state.puddle + v > g.board.pail;
        });
      });
      if (over !== undefined) break;
      await followHint(true);
    }
    assert.ok(over !== undefined, 'an overshoot became possible');
    const before = (await state()).puddle;
    assert.ok(await besides(over));
    await tapThing(over);
    st = await state();
    assert.deepEqual([st.misses, st.puddle], [1, before], 'the overshoot is refused and counts one miss');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(150);
    st = await state();
    assert.equal(st.hints, 1, 'a requested hint counts once');
    assert.ok(st.glow, 'and glows');
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.equal((await state()).hints, 1, 'asking again under the same glow counts nothing');
    for (let guard = 0; guard < 12 && !(await page.evaluate(() => neo.scene.finished)); guard++)
      await followHint();
    await sticker(n);
    st = await state();
    assert.deepEqual([st.misses, st.hints], [1, 1]);
    assert.equal(
      await page.evaluate(() => neo.scene.game.state.puddle === neo.scene.game.board.pail),
      true,
      'the puddle matches the pail',
    );

    // Level 9: steering onto a bigger number while a smaller is left is refused (one miss); then smallest first to the sticker.
    await launch('puddle-gobble', 9);
    await still();
    n = await page.evaluate(() => kit.store.data.stickers.length);
    st = await state();
    assert.equal(st.puddle, 20, 'the puddle is 20');
    const later = await page.evaluate(() => {
      const g = neo.scene.game;
      const small = Math.min(...g.state.left.map((id) => g.items[id].thing.size));
      return g.state.left.find((id) => g.items[id].thing.size > small);
    });
    assert.ok(await besides(later));
    await tapThing(later);
    st = await state();
    assert.deepEqual(
      [st.misses, st.hints, st.left, st.puddle],
      [1, 0, 6, 20],
      'a bigger number first is refused and counts one miss',
    );
    for (let guard = 0; guard < 12 && !(await page.evaluate(() => neo.scene.finished)); guard++)
      await followHint(true);
    await sticker(n);
    st = await state();
    assert.deepEqual(
      [st.misses, st.hints, st.puddle],
      [1, 0, 20],
      'level 9 finishes with one miss and the puddle still 20',
    );

    // Level 10: dots under every numeral and on the puddle; a too-big touch counts nothing; the hint plays it to the sticker.
    await launch('puddle-gobble', 10);
    await still();
    n = await page.evaluate(() => kit.store.data.stickers.length);
    st = await state();
    assert.deepEqual([st.puddle, st.left], [2, 5], 'the puddle is 2 with five on the sand');
    assert.equal(await page.evaluate(() => neo.scene.game.plan.dots), true, 'level 10 shows dots');
    await page.waitForTimeout(300);
    await screenshot('puddle-gobble-10');
    const six = await page.evaluate(() => {
      const g = neo.scene.game;
      return g.state.left.find((id) => g.items[id].thing.size === 6);
    });
    assert.ok(await besides(six));
    await tapThing(six);
    st = await state();
    assert.deepEqual([st.misses, st.hints, st.left], [0, 0, 5], 'the 6 is too big and never a miss');
    for (let guard = 0; guard < 12 && !(await page.evaluate(() => neo.scene.finished)); guard++)
      await followHint(true);
    await sticker(n);
    st = await state();
    assert.deepEqual([st.misses, st.hints, st.puddle], [0, 0, 7], 'level 10 finishes clean at 7');
    // Pre-K and school step 5, 10, 6 with the registered game's own ranges.
    const steps = await page.evaluate(async () => {
      const D = await import('/src/progress/difficulty.ts');
      const { puddleGobble } = await import('/src/games/puddle-gobble/index.ts');
      return ['prek', 'school'].map((band) => {
        const r = puddleGobble.levels(band);
        return [D.stepLevel(5, 1, r), D.stepLevel(10, 1, r), D.stepLevel(6, -1, r)];
      });
    });
    assert.deepEqual(
      steps,
      [
        [10, 6, 10],
        [10, 6, 10],
      ],
      'pre-K and school step 5 → 10 → 6',
    );

    // Level 11: the puddle starts at 24 holding 4, 9, 3 and 6 for a pail of 14. Letting go the 9 and the 4 goes under (11):
    // never a miss, no finish. A requested hint counts one; the hint lets the 6 go and soaks the 9 back to finish.
    await launch('puddle-gobble', 11);
    await still();
    n = await page.evaluate(() => kit.store.data.stickers.length);
    st = await state();
    assert.deepEqual([st.puddle, st.left], [24, 0], 'too full: 24 with the sand empty');
    await page.waitForTimeout(300);
    await screenshot('puddle-gobble-11');
    const tapToken = async (size) => {
      const p = await page.evaluate((size) => {
        const g = neo.scene.game;
        return g.tokens.find((t) => g.items[t.id].thing.size === size).node.toGlobal({ x: 0, y: 0 });
      }, size);
      await page.evaluate(({ x, y }) => kit.tap(x, y), p);
      await page.waitForTimeout(200);
      await still();
    };
    await tapToken(9);
    await tapToken(4);
    st = await state();
    assert.deepEqual(
      [st.misses, st.hints, st.puddle, st.left],
      [0, 0, 11, 2],
      'under the pail is allowed and counts nothing',
    );
    assert.equal(await page.evaluate(() => neo.scene.finished), false);
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(150);
    st = await state();
    assert.equal(st.hints, 1, 'a requested hint counts once');
    assert.ok(st.glow && 'letGo' in st.glow, 'and glows on a token');
    for (let guard = 0; guard < 12 && !(await page.evaluate(() => neo.scene.finished)); guard++)
      await followHint(true);
    await sticker(n);
    st = await state();
    assert.deepEqual([st.misses, st.hints, st.puddle], [0, 1, 14], 'level 11 matches the pail');

    // Level 4 upright: the meter and the biggest things, one screenshot.
    await page.setViewportSize({ width: 768, height: 1024 });
    await launch('puddle-gobble', 4);
    await still();
    await page.waitForTimeout(400);
    await screenshot('puddle-gobble-4-portrait');

    // Level 5 upright in the evening mood: the low sun and pink rim over a board that may hold the new kinds, played to its sticker.
    // The first launch is the authored midday round; the second is seeded, so it can show the new kinds.
    await launch('puddle-gobble', 5);
    await still();
    await launch('puddle-gobble', 5);
    await still();
    n = await page.evaluate(() => kit.store.data.stickers.length);
    const kinds = await page.evaluate(() => {
      const g = neo.scene.game;
      const before = JSON.stringify(g.board);
      g.setMood('evening');
      return { same: before === JSON.stringify(g.board), mood: g.mood };
    });
    assert.deepEqual(kinds, { same: true, mood: 'evening' }, 'the evening look changes nothing on the sand');
    await page.waitForTimeout(400);
    await screenshot('puddle-gobble-5-evening-portrait');
    for (let guard = 0; guard < 12 && !(await page.evaluate(() => neo.scene.finished)); guard++)
      await followHint(true);
    await sticker(n);
    await page.setViewportSize({ width: 1024, height: 768 });
    await twoPails();
    assert.deepEqual(errors, [], 'page errors');
    log(
      'Puddle Gobble: level 1 by taps, level 8 with a too-big touch, a refused overshoot and a requested hint, level 9 with a bigger number first, level 10 with dots, level 11 too full, level 4 upright, level 5 upright in the evening, level 12 two pails upright',
    );
  }

  return { puddleGobblePlay };
}
