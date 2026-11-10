import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, tap, screenshot, launch, finished }) {
  /** Pond Conga by touch: a touch sets the line off, swipes turn it, a bump, a hint, Start over, both ends of the ladder, buttons of at least 64 units upright and sideways. */
  async function congaTouchPlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          busy: g.busy,
          waiting: g.waiting,
          tries: g.tries,
          eaten: g.state.eaten,
          of: g.pond.crumbs.length,
          misses: g.misses,
          hints: g.hints,
          hinted: g.hinted,
          heading: g.state.heading,
          queue: g.queue.slice(),
          note: g.note.text,
        };
      });
    const ready = () =>
      page.waitForFunction(() => neo.scene.game?.pond && !neo.scene.game.busy, null, { timeout: 15000 });
    const tapSlot = (kind) =>
      page.evaluate((kind) => {
        const g = neo.scene.game,
          s = g.slots.find((s) => s.kind === kind),
          p = g.touchLayer.toGlobal({ x: s.x + s.w / 2, y: s.y + s.h / 2 });
        kit.tap(p.x, p.y);
      }, kind);
    /** A real finger: touch the middle of the pond and lift. */
    const touchPond = () =>
      page.evaluate(() => {
        const g = neo.scene.game,
          p = g.tapLayer.toGlobal({ x: (g.pond.cols * g.cell) / 2, y: (g.pond.rows * g.cell) / 2 });
        kit.tap(p.x, p.y);
      });
    /** Swipe steering for a whole round, in the page so the timing follows the game's own steps: after each step, swipe the way the next one has to turn. */
    /** `first`: a route to follow from the start until the first group is eaten (level 7's longer order), then the hint's way. */
    /** `bonk`: follow `first` only until the first bump, then stop (level 9's tail bonk). */
    const drive = (first = null, bonk = false) =>
      page.evaluate(
        async ([first, bonk]) => {
          const { hintPath } = await import('/src/games/pond-conga/logic.ts');
          const DX = [1, 0, -1, 0],
            DY = [0, 1, 0, -1];
          const swipe = async (g, dir) => {
            const w = (g.pond.cols * g.cell) / 2,
              h = (g.pond.rows * g.cell) / 2,
              a = g.tapLayer.toGlobal({ x: w, y: h }),
              b = g.tapLayer.toGlobal({ x: w + DX[dir] * 64, y: h + DY[dir] * 64 });
            await kit.drag(kit.line([a.x, a.y], [b.x, b.y], 4));
          };
          let last = -1;
          for (let guard = 0; guard < 4000 && !neo.scene.finished; guard++) {
            const g = neo.scene.game;
            if (!g?.pond || g.busy || g.finished) {
              await kit.sleep(40);
              continue;
            }
            if (bonk && g.misses >= 1) return;
            const plan =
              first && (bonk || g.state.eaten < 3)
                ? first.slice(g.tries)
                : g.onRoute
                  ? g.pond.route.slice(g.routeAt)
                  : hintPath(g.pond, g.state);
            if (g.waiting) {
              if (plan[0] !== undefined && plan[0] !== g.state.heading) await swipe(g, plan[0]);
              else {
                const p = g.tapLayer.toGlobal({ x: 10, y: 10 });
                kit.tap(p.x, p.y);
              }
              await kit.sleep(120);
              continue;
            }
            if (g.ticks !== last && g.queue.length === 0) {
              last = g.ticks;
              if (plan[0] !== undefined && plan[0] !== g.state.heading) await swipe(g, plan[0]);
            }
            await kit.sleep(15);
            if (first && !bonk && g.state.eaten >= 3) return;
          }
        },
        [first, bonk],
      );
    /** The pond is one target; Hint and Start over at least 64 logical units, on screen, apart from each other and the water. */
    const targets = (label) =>
      page.evaluate((label) => {
        const g = neo.scene.game,
          out = [],
          pond = { x: g.board.x, y: g.board.y, w: g.pond.cols * g.cell, h: g.pond.rows * g.cell };
        const rects = g.slots.map((s) => ({ name: s.kind, x: s.x, y: s.y, w: s.w, h: s.h }));
        if (rects.length !== 2) out.push(`${rects.length} buttons`);
        for (const r of rects) {
          if (r.w < 64 || r.h < 64) out.push(`${r.name} small ${r.w}x${r.h}`);
          if (r.x < 0 || r.y < 0 || r.x + r.w > neo.view.w || r.y + r.h > neo.view.h)
            out.push(`${r.name} off screen`);
          if (r.x < pond.x + pond.w && pond.x < r.x + r.w && r.y < pond.y + pond.h && pond.y < r.y + r.h)
            out.push(`${r.name} over the pond`);
        }
        const [a, b] = rects;
        if (a && b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h)
          out.push('the buttons overlap');
        if (pond.x < 0 || pond.y < 0 || pond.x + pond.w > neo.view.w || pond.y + pond.h > neo.view.h)
          out.push('pond off screen');
        // The home and help buttons fill the top-left corner (to about x 104, y 200): no crumb may hide behind them.
        if (pond.x < 108 && pond.y < 196) out.push('pond under the help button');
        return out.map((m) => `${label}: ${m} (${neo.view.w}x${neo.view.h}, scale ${neo.view.scale})`);
      }, label);
    /** Level 7: three bites show at once; eat the first group in a longer order (only steps, no miss), then one hint to a best-order bite, then the rest. */
    async function chooseTheOrder() {
      await launch('pond-conga', 7);
      await ready();
      const stickers = await page.evaluate(() => kit.store.data.stickers.length);
      const shown = await page.evaluate(() => {
        const g = neo.scene.game;
        return [
          g.pond.group,
          g.crumbNext.visible,
          g.crumbAfter.visible,
          g.crumbThird.visible,
          g.crumbAfter.alpha,
        ];
      });
      assert.deepEqual(
        shown,
        [3, true, true, true, 1],
        'a group of three shows at once, all at full strength',
      );
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      assert.deepEqual(await targets('level 7 portrait'), []);
      await screenshot('conga-touch-7-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);
      // The longest order of the first group that the line can paddle without a bump.
      const longer = await page.evaluate(async () => {
        const { solveRoute, bestStarts, startState } = await import('/src/games/pond-conga/logic.ts');
        const g = neo.scene.game,
          p = g.pond,
          best = bestStarts(p, startState(p));
        const orders = [
          [0, 1, 2],
          [0, 2, 1],
          [1, 0, 2],
          [1, 2, 0],
          [2, 0, 1],
          [2, 1, 0],
        ].filter((o) => !best.includes(o[0]));
        const routes = orders
          .map((o) => solveRoute({ ...p, group: 1, crumbs: o.map((k) => p.crumbs[k]) }))
          .filter(Boolean)
          .sort((a, b) => b.length - a.length);
        const bestFirstGroup = solveRoute({ ...p, crumbs: p.crumbs.slice(0, 3) });
        return { route: routes[0], best: bestFirstGroup.length };
      });
      assert.ok(
        longer.route && longer.route.length > longer.best,
        `a longer order exists (${longer.route?.length} vs ${longer.best})`,
      );
      await drive(longer.route);
      let st = await state();
      assert.deepEqual(
        [st.eaten, st.misses, st.hints],
        [3, 0, 0],
        'a longer order eats the group with no miss',
      );
      assert.equal(
        await page.evaluate(
          () =>
            [neo.scene.game.crumbNext, neo.scene.game.crumbAfter, neo.scene.game.crumbThird].filter(
              (c) => c.visible,
            ).length,
        ),
        3,
        'the next three appear',
      );
      await tapSlot('hint');
      await page.waitForTimeout(300);
      const aim = await page.evaluate(async () => {
        const { hintPath, bestStarts, step } = await import('/src/games/pond-conga/logic.ts');
        const g = neo.scene.game;
        let t = g.state;
        for (const d of hintPath(g.pond, t)) t = step(g.pond, t, d).state;
        const ate = g.pond.crumbs.findIndex((_, k) => t.got & (1 << k) && !(g.state.got & (1 << k)));
        return { ate, best: bestStarts(g.pond, g.state), dots: g.hintCells.length, hinted: g.hinted };
      });
      assert.ok(aim.hinted && aim.dots > 0, 'the hint shows its dots');
      assert.ok(
        aim.best.includes(aim.ate),
        `the hint leads to a bite that starts a best order (${aim.ate} of ${aim.best})`,
      );
      await drive();
      await finished('pond-conga');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
      const r = await page.evaluate(() => {
        const r = kit.store.stats('pond-conga').history.at(-1);
        return [r.misses, r.hints, neo.scene.game?.excess ?? r.score];
      });
      assert.deepEqual(r.slice(0, 2), [0, 1], 'no miss for the longer order, one hint');
      assert.ok(r[2] > 0, `the longer order costs steps over the fewest (${r[2]})`);
      assert.deepEqual(errors, []);
      log(
        `Pond Conga level 7: three bites at once, a longer first order with no miss, one hint to a best-order bite, ${r[2]} steps over the fewest, one sticker, portrait passed`,
      );
    }
    /** Level 8: nothing moves without input; a touch is a step straight on, a swipe a step that way; one bump, then step by step to the sticker. */
    async function stepByStep() {
      await launch('pond-conga', 8);
      await ready();
      const stickers = await page.evaluate(() => kit.store.data.stickers.length);
      const look = () =>
        page.evaluate(() => {
          const g = neo.scene.game;
          return JSON.stringify([g.state, g.tries, g.waiting]);
        });
      const before = await look();
      await page.waitForTimeout(2000);
      assert.equal(await look(), before, 'nothing moves before the first touch');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      assert.deepEqual(await targets('level 8 portrait'), []);
      await screenshot('conga-touch-8-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);
      /** One input, then wait for its step to land: a touch for straight on, a swipe for a turn. Bump: the first way that bonks. */
      const one = (bump) =>
        page.evaluate(async (bump) => {
          const { hintPath, step, opposite } = await import('/src/games/pond-conga/logic.ts');
          const DX = [1, 0, -1, 0],
            DY = [0, 1, 0, -1],
            g = neo.scene.game;
          let dir = g.onRoute ? g.pond.route[g.routeAt] : hintPath(g.pond, g.state)[0];
          if (bump)
            dir =
              [0, 1, 2, 3].find(
                (d) => d !== opposite(g.state.heading) && step(g.pond, g.state, d).event === 'bonk',
              ) ?? -1;
          if (dir === undefined || dir < 0) return false;
          const w = (g.pond.cols * g.cell) / 2,
            h = (g.pond.rows * g.cell) / 2,
            a = g.tapLayer.toGlobal({ x: w, y: h });
          const t0 = g.tries;
          if (dir === g.state.heading) kit.tap(a.x, a.y);
          else {
            const b = g.tapLayer.toGlobal({ x: w + DX[dir] * 64, y: h + DY[dir] * 64 });
            await kit.drag(kit.line([a.x, a.y], [b.x, b.y], 4));
          }
          await kit.until(
            () => neo.scene.finished || neo.scene.game.busy || neo.scene.game.tries === t0 + 1,
            3000,
          );
          await kit.sleep(220);
          return neo.scene.game?.tries === t0 + 1 || neo.scene.finished;
        }, bump);
      let bumped = false;
      for (let guard = 0; guard < 400 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
        if (
          await page.evaluate(() => {
            const g = neo.scene.game;
            return !g?.pond || g.busy || g.finished;
          })
        ) {
          await page.waitForTimeout(100);
          continue;
        }
        if (!bumped) {
          const t = await page.evaluate(() => neo.scene.game.tries);
          if (await one(true)) {
            bumped = true;
            const st = await state();
            assert.deepEqual([st.misses, st.tries], [1, t + 1], 'a bump is one miss and one step');
            const after = await look();
            await page.waitForTimeout(1200);
            assert.equal(await look(), after, 'no step after a bump without input');
            continue;
          }
        }
        assert.ok(await one(false), 'each input takes one step');
      }
      assert.ok(bumped, 'one bump was made');
      await finished('pond-conga');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
      const r = await page.evaluate(() => {
        const r = kit.store.stats('pond-conga').history.at(-1);
        return [r.misses, r.hints];
      });
      assert.deepEqual(r, [1, 0], 'one bump, no hint');
      // A pad taken up live: a press of the way it faces, the action button, then a turn are one step each, and nothing after.
      await launch('pond-conga', 8);
      await ready();
      const pad = await page.evaluate(async () => {
        const g = neo.scene.game,
          { idle } = await import('/src/engine/controller.ts'),
          out = [];
        const press = (d, action = false) => {
          const c = idle();
          Object.assign(c.players[0], { direction: d, action, active: true });
          g.control(c);
        };
        for (const k of ['ahead', 'action', 'turn']) {
          const t = g.tries;
          if (k === 'action') press(-1, true);
          else press(k === 'ahead' ? g.state.heading : (g.state.heading + 1) % 4);
          await kit.sleep(400);
          out.push(g.tries - t);
        }
        const t = g.tries;
        await kit.sleep(1500);
        out.push(g.tries - t, g.touch);
        return out;
      });
      assert.deepEqual(
        pad,
        [1, 1, 1, 0, false],
        'a pad press is one step, and nothing moves between presses',
      );
      assert.deepEqual(errors, []);
      log(
        'Pond Conga level 8: still without input (2 s, and after a bump), a touch a step straight on, a swipe a step that way, one bump, one sticker, a pad press a step, portrait passed',
      );
    }
    /** Level 9: the line starts seven long in an L; steer the leader into its own tail once (one miss), then swipe through to the sticker. */
    async function longConga() {
      await launch('pond-conga', 9);
      await ready();
      const stickers = await page.evaluate(() => kit.store.data.stickers.length);
      const start = await page.evaluate(() => {
        const g = neo.scene.game;
        return {
          len: g.state.body.length,
          of: g.pond.crumbs.length,
          ducks: g.ducks.filter((d) => d.visible).length,
        };
      });
      assert.deepEqual(start, { len: 7, of: 8, ducks: 7 }, 'seven ducklings from the start, eight bites');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      assert.deepEqual(await targets('level 9 portrait'), []);
      await screenshot('conga-touch-9-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);
      // The shortest turns from the start whose last step runs into the line itself (not a pad or the bank), every step before it a plain move.
      const into = await page.evaluate(async () => {
        const { step, startState, opposite } = await import('/src/games/pond-conga/logic.ts');
        const p = neo.scene.game.pond,
          DX = [1, 0, -1, 0],
          DY = [0, 1, 0, -1];
        let frontier = [{ dirs: [], s: startState(p) }];
        for (let depth = 0; depth < 6; depth++) {
          const next = [];
          for (const { dirs, s } of frontier)
            for (const d of [0, 1, 2, 3]) {
              if (d === opposite(s.heading)) continue;
              const r = step(p, s, d),
                to = { x: s.body[0].x + DX[d], y: s.body[0].y + DY[d] };
              if (r.event === 'bonk' && s.body.some((c) => c.x === to.x && c.y === to.y))
                return { dirs: [...dirs, d], to };
              if (r.event === 'move') next.push({ dirs: [...dirs, d], s: r.state });
            }
          frontier = next;
        }
        return null;
      });
      assert.ok(into, 'a short way into the tail exists');
      await drive(into.dirs, true);
      let st = await state();
      assert.deepEqual(
        [st.misses, st.hints, st.eaten],
        [1, 0, 0],
        `one bump into the tail at ${into.to.x},${into.to.y}, nothing lost`,
      );
      assert.equal(
        await page.evaluate(() => neo.scene.game.state.body.length),
        7,
        'the bump keeps every duckling',
      );
      await drive();
      await finished('pond-conga');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('pond-conga').history.at(-1);
          return [r.misses, r.hints];
        }),
        [1, 0],
      );
      assert.deepEqual(errors, []);
      log(
        `Pond Conga level 9: seven ducklings in an L, one bump into the tail (${into.dirs.length} steps), swiped through to one sticker, portrait passed`,
      );
    }
    if (process.env.CONGA_LEVELS === '9') return longConga();
    if (process.env.CONGA_LEVELS === '8') return stepByStep();
    if (process.env.CONGA_LEVELS === '7') return chooseTheOrder();
    // Level 1: the line waits for a touch, a bump into the bank is one miss, a hint counts once, Start over keeps the steps, then the pond is cleared.
    await launch('pond-conga', 1);
    await ready();
    const stickers = await page.evaluate(() => kit.store.data.stickers.length);
    let st = await state();
    assert.deepEqual([st.waiting, st.tries, st.of], [true, 0, 5], 'nothing moves before a touch');
    assert.ok(st.note.includes('Touch to set off'), 'the line of help says how to set off');
    assert.deepEqual(await targets('level 1 landscape'), []);
    await touchPond();
    await page.waitForFunction(() => neo.scene.game.misses >= 1, null, { timeout: 20000 });
    st = await state();
    assert.deepEqual(
      [st.waiting, st.misses],
      [false, 1],
      'a touch set it off, and straight on it bumped the bank once',
    );
    await tapSlot('hint');
    await page.waitForTimeout(250);
    st = await state();
    assert.deepEqual([st.hints, st.hinted], [1, true]);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    assert.deepEqual(await targets('level 1 portrait'), []);
    await screenshot('conga-touch-1-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    const before = (await state()).tries;
    await tapSlot('again');
    await page.waitForTimeout(300);
    st = await state();
    assert.deepEqual(
      [st.waiting, st.eaten, st.hinted],
      [true, 0, false],
      'start over puts the line back and waits for a touch',
    );
    assert.ok(st.tries >= before, 'the steps already taken keep counting');
    await drive();
    await finished('pond-conga');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('pond-conga').history.at(-1);
        return [r.misses, r.hints];
      }),
      [1, 1],
    );
    // Level 6 (the crowded pond): every target still 64 or more, sideways and upright, swiped through with no help.
    await launch('pond-conga', 6);
    await ready();
    assert.deepEqual(await targets('level 6 landscape'), []);
    await screenshot('conga-touch-6-landscape');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    assert.deepEqual(await targets('level 6 portrait'), []);
    await screenshot('conga-touch-6-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await drive();
    await finished('pond-conga');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 2);
    const last = await page.evaluate(() => {
      const r = kit.store.stats('pond-conga').history.at(-1);
      return [r.misses, r.hints];
    });
    assert.deepEqual(last, [0, 0], 'a swiped run with no help has no bumps');
    // Opening it from Lantern Lake plays it here, by touch; leaving mid-round is quiet.
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
      neo.go.land('lantern-lake');
    });
    await scene('LandScene');
    await page.evaluate(() => neo.go.game('pond-conga', 'grownup', undefined, false, 'lantern-lake'));
    await scene('GameScene');
    await ready();
    assert.equal(await page.evaluate(() => neo.scene.game.touch), true, 'the island plays it by touch');
    await touchPond();
    await page.waitForTimeout(800);
    await page.evaluate(() => neo.go.land('lantern-lake'));
    await scene('LandScene');
    await page.waitForTimeout(700);
    await page.evaluate(() => neo.go.hub());
    await scene('MapScene');
    assert.deepEqual(errors, []);
    log(
      'Pond Conga touch: first and last level, a touch to set off, swipes, one bump, one hint, start over, one sticker each, portrait and leaving mid-round passed',
    );
  }

  return { congaTouchPlay };
}
