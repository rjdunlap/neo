import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, turnToGame, launch, finished, next }) {
  /** Mossy Path: real steps, free experiments, recovery help, both ends, reward and land return. */
  async function mossyPathPlay() {
    if (process.env.MOSSY_ONLY === 'look') {
      await mossyLookPlay();
      return;
    }
    if (process.env.MOSSY_ONLY === 'patch') {
      await mossyPatchPlay();
      return;
    }
    if (process.env.MOSSY_ONLY === 'snacks') {
      await mossySnacksPlay();
      return;
    }
    if (process.env.MOSSY_ONLY === 'plan') {
      await mossyPlanPlay();
      return;
    }
    for (const level of process.env.MOSSY_ONLY === 'navigation' ? [] : [1, 3]) {
      await launch('mossy-path', level);
      await page.waitForTimeout(350);
      const initial = await page.evaluate(() => neo.scene.game.path.slice());
      const wrong = await page.evaluate(async () => {
        const L = await import('/src/games/mossy-path/logic.ts'),
          g = neo.scene.game;
        return g.board.tiles.find((at) => at !== g.path.at(-1) && L.moveError(g.board, g.path, at) === 'far');
      });
      await tap(`neo.scene.game.nodes[${wrong}]`);
      await tap(`neo.scene.game.nodes[${wrong}]`);
      assert.deepEqual(await page.evaluate(() => neo.scene.game.path), initial);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 1]);
      await tap('neo.scene.game.hintButton');
      assert.equal(
        await page.evaluate(() => neo.scene.game.hints),
        1,
        'repeat help on the same path is counted once',
      );
      await page.evaluate(() => kit.tapOn(neo.scene.game.nodes[neo.scene.game.hinted]));
      await page.waitForTimeout(180);
      await tap('neo.scene.game.undoButton');
      assert.deepEqual(await page.evaluate(() => neo.scene.game.path), initial);
      if (level === 3) {
        const dead = await page.evaluate(async () => {
          const L = await import('/src/games/mossy-path/logic.ts'),
            g = neo.scene.game;
          const find = (path) => {
            if (!L.completion(g.board, path)) return path;
            for (const at of g.board.tiles) {
              const next = L.step(g.board, path, at);
              if (next && !L.solved(g.board, next)) {
                const result = find(next);
                if (result) return result;
              }
            }
            return null;
          };
          return find([g.board.start]);
        });
        assert.ok(dead, 'top level offers free route experiments');
        for (const at of dead.slice(1)) await tap(`neo.scene.game.nodes[${at}]`);
        assert.equal(await page.evaluate(() => neo.scene.game.misses), 2, 'a legal dead end is free');
        await tap('neo.scene.game.hintButton');
        assert.equal(await page.evaluate(() => neo.scene.game.hinted), -1, 'help asks for revision');
        await page.evaluate(async () => {
          const L = await import('/src/games/mossy-path/logic.ts'),
            g = neo.scene.game;
          for (let guard = 0; guard < 16 && L.helpFor(g.board, g.path).undo; guard++) {
            kit.tapOn(g.undoButton);
            await kit.sleep(170);
          }
        });
        assert.ok(
          await page.evaluate(() => neo.scene.game.hinted >= 0),
          'Undo reveals the next completing tile',
        );
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(350);
        assert.ok(await page.evaluate(() => neo.scene.game.cell >= 100));
        await screenshot('mossy-path-portrait');
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(350);
        await screenshot('mossy-path-landscape');
      }
      const counts = await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);
      await tap('neo.scene.game.againButton');
      assert.deepEqual(await page.evaluate(() => neo.scene.game.path), initial);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), counts);
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      await page.evaluate(async () => {
        const L = await import('/src/games/mossy-path/logic.ts'),
          g = neo.scene.game;
        for (const at of L.completion(g.board, g.path)) {
          kit.tapOn(g.nodes[at]);
          await kit.sleep(170);
        }
      });
      await finished('mossy-path');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
      log(`Mossy Path ${level}: misses, stable hint, revision and one sticker passed`);
    }
    for (const level of process.env.MOSSY_ONLY === 'navigation' ? [] : [4, 7]) {
      await launch('mossy-path', level);
      await page.waitForTimeout(350);
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      if (level === 4) {
        // One slide from the turtle along the whole hedge maze steps every tile (drag stepping).
        await page.evaluate(async () => {
          const L = await import('/src/games/mossy-path/logic.ts'),
            g = neo.scene.game;
          const route = L.routeBetween(g.board, g.board.start, g.board.pond).map((at) =>
            g.nodes[at].getGlobalPosition(),
          );
          const points = route.slice(1).flatMap((p, i) => kit.line([route[i].x, route[i].y], [p.x, p.y], 6));
          await kit.drag(points, 1, 30);
        });
        assert.equal(await page.evaluate(() => neo.scene.game.misses), 0, 'level 4 has no misses');
      } else {
        const plan = await page.evaluate(async () => {
          const L = await import('/src/games/mossy-path/logic.ts'),
            g = neo.scene.game,
            b = g.board;
          const line = L.mainline(b),
            route = L.routeBetween(b, b.start, b.pond);
          // A wrong branch hanging off the route before the berry's fork, and the route up to it.
          const fork = route.find((at) => L.neighbours(b, at).some((z) => !line.has(z)));
          const wrong = L.neighbours(b, fork).find((z) => !line.has(z));
          return { toFork: L.routeBetween(b, b.start, fork).slice(1), wrong };
        });
        for (const at of plan.toFork) await tap(`neo.scene.game.nodes[${at}]`);
        await tap(`neo.scene.game.nodes[${plan.wrong}]`);
        assert.equal(await page.evaluate(() => neo.scene.game.misses), 1, 'a wrong branch counts one miss');
        await tap(`neo.scene.game.nodes[${plan.toFork.at(-1) ?? 'neo.scene.game.board.start'}]`);
        await tap(`neo.scene.game.nodes[${plan.wrong}]`);
        assert.equal(await page.evaluate(() => neo.scene.game.misses), 1, 'walking in again is free');
        await tap('neo.scene.game.hintButton');
        assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'Hint counts once');
        await tap('neo.scene.game.hintButton');
        assert.equal(
          await page.evaluate(() => neo.scene.game.hints),
          1,
          'repeat help on the same trail counts once',
        );
        await page.evaluate(() => kit.tapOn(neo.scene.game.nodes[neo.scene.game.hinted]));
        await page.waitForTimeout(200);
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(350);
        assert.ok(
          await page.evaluate(() => neo.scene.game.cell >= 100),
          'portrait maze cells stay at least 100 units',
        );
        await screenshot('mossy-path-7-portrait');
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(350);
        await page.evaluate(async () => {
          const L = await import('/src/games/mossy-path/logic.ts'),
            g = neo.scene.game;
          for (let guard = 0; guard < 40 && !g.finished; guard++) {
            const s = g.maze_;
            kit.tapOn(g.nodes[L.nextToward(g.board, s.path.at(-1), L.goalOf(g.board, s.berry))]);
            await kit.sleep(170);
          }
        });
        assert.ok(
          await page.evaluate(() => neo.scene.game.maze_.berry),
          'the berry was collected before the pond',
        );
      }
      await finished('mossy-path');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
      log(`Mossy Path ${level}: maze ${level === 4 ? 'slide' : 'miss, hint, berry'} and one sticker passed`);
    }
    await page.evaluate(() => {
      kit.store.data.profile.band = 'school';
      neo.go.land('puzzle-peaks');
    });
    await scene('LandScene');
    await page.waitForTimeout(600);
    await turnToGame('mossy-path');
    await tap("neo.scene.showing.find(m => m.mod.id === 'mossy-path').node");
    await scene('GameScene');
    assert.equal(await page.evaluate(() => neo.scene.mod.id), 'mossy-path');
    await page.evaluate(async () => {
      const p = neo.scene.home.getGlobalPosition();
      await kit.drag(
        [
          [p.x, p.y],
          [p.x, p.y],
        ],
        1,
        750,
      );
    });
    await scene('LandScene');
    assert.equal(await page.evaluate(() => neo.scene.land.id), 'puzzle-peaks');
    log('Mossy Path: land launch and home return passed');
  }

  /** Level 6 in the autumn look: a counted wrong branch, the way back and a finish, with one portrait screenshot. */
  async function mossyLookPlay() {
    await launch('mossy-path', 6);
    await page.waitForTimeout(350);
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await page.evaluate(() => {
      const g = neo.scene.game;
      g.look = { season: 'autumn', berry: 'strawberry' };
      g.resize(neo.view);
    });
    const plan = await page.evaluate(async () => {
      const L = await import('/src/games/mossy-path/logic.ts'),
        b = neo.scene.game.board,
        line = L.mainline(b),
        route = L.routeBetween(b, b.start, b.pond);
      const fork = route.find((at) => L.neighbours(b, at).some((z) => !line.has(z)));
      return {
        toFork: L.routeBetween(b, b.start, fork).slice(1),
        wrong: L.neighbours(b, fork).find((z) => !line.has(z)),
      };
    });
    for (const at of plan.toFork) await tap(`neo.scene.game.nodes[${at}]`);
    await tap(`neo.scene.game.nodes[${plan.wrong}]`);
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 1, 'a wrong branch counts one miss');
    await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'Hint counts once');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(350);
    assert.ok(
      await page.evaluate(() => neo.scene.game.cell >= 100),
      'portrait maze cells stay at least 100 units',
    );
    assert.equal(await page.evaluate(() => neo.scene.game.look.season), 'autumn');
    await screenshot('mossy-path-6-autumn-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(350);
    await page.evaluate(async () => {
      const L = await import('/src/games/mossy-path/logic.ts'),
        g = neo.scene.game;
      for (let guard = 0; guard < 40 && !g.finished; guard++) {
        if (g.walkTo >= 0) {
          await kit.sleep(170);
          continue;
        }
        kit.tapOn(g.nodes[L.nextToward(g.board, g.maze_.path.at(-1), g.board.pond)]);
        await kit.sleep(170);
      }
    });
    await finished('mossy-path');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    log('Mossy Path 6 (autumn look): one counted branch, hint, finish and one sticker passed');
    // Level 7 in snow with a strawberry: the snowy hedge tops and the berry on its bush and in the badge.
    await launch('mossy-path', 7);
    await page.waitForTimeout(350);
    await page.evaluate(() => {
      const g = neo.scene.game;
      g.look = { season: 'snow', berry: 'strawberry' };
      g.resize(neo.view);
    });
    await screenshot('mossy-path-7-snow');
  }

  /** Level 8, a little patch: a free far tap that pulses, one counted visited tap, a finish and one sticker. */
  async function mossyPatchPlay() {
    await launch('mossy-path', 8);
    await page.waitForTimeout(350);
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    const far = await page.evaluate(async () => {
      const L = await import('/src/games/mossy-path/logic.ts'),
        g = neo.scene.game;
      return g.board.tiles.find((at) => at !== g.path.at(-1) && L.moveError(g.board, g.path, at) === 'far');
    });
    await tap(`neo.scene.game.nodes[${far}]`);
    assert.deepEqual(
      await page.evaluate(() => [
        neo.scene.game.path.length,
        neo.scene.game.misses,
        neo.scene.game.pulseTime > 0,
      ]),
      [1, 0, true],
      'a far tap at level 8 is free and pulses the tiles beside the turtle',
    );
    const first = await page.evaluate(async () => {
      const L = await import('/src/games/mossy-path/logic.ts'),
        g = neo.scene.game;
      return L.completion(g.board, g.path)[0];
    });
    await tap(`neo.scene.game.nodes[${first}]`);
    await tap(`neo.scene.game.nodes[${await page.evaluate(() => neo.scene.game.board.start)}]`);
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 1, 'a visited tap still counts one miss');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(350);
    assert.ok(
      await page.evaluate(() => neo.scene.game.cell >= 100),
      'portrait patch cells stay at least 100 units',
    );
    await screenshot('mossy-path-8-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(350);
    await page.evaluate(async () => {
      const L = await import('/src/games/mossy-path/logic.ts'),
        g = neo.scene.game;
      for (const at of L.completion(g.board, g.path)) {
        kit.tapOn(g.nodes[at]);
        await kit.sleep(170);
      }
    });
    await finished('mossy-path');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    log('Mossy Path 8: free far tap, counted visited tap, finish and one sticker passed');
  }

  /** Level 9: the farther berry first, an early pond refused once, then the nearer berry and the pond. */
  async function mossySnacksPlay() {
    await launch('mossy-path', 9);
    await page.waitForTimeout(350);
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    const plan = await page.evaluate(async () => {
      const L = await import('/src/games/mossy-path/logic.ts'),
        b = neo.scene.game.board,
        d = (t) => L.routeBetween(b, b.start, t).length;
      const [near, far] = L.berriesOf(b).sort((x, y) => d(x) - d(y));
      return { near, far, toFar: L.routeBetween(b, b.start, far).slice(1) };
    });
    for (const at of plan.toFar) await tap(`neo.scene.game.nodes[${at}]`);
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.maze_.eaten),
      [plan.far],
      'the farther berry first',
    );
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 0, 'a berry spur is never a miss');
    // Walk to the pond's edge with one berry: the pond refuses once and counts one miss.
    const toPond = await page.evaluate(async () => {
      const L = await import('/src/games/mossy-path/logic.ts'),
        g = neo.scene.game,
        b = g.board;
      return L.routeBetween(b, g.path.at(-1), b.pond).slice(1);
    });
    for (const at of toPond) await tap(`neo.scene.game.nodes[${at}]`);
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.finished]),
      [1, false],
      'the pond waits for both berries',
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(350);
    assert.ok(
      await page.evaluate(() => neo.scene.game.cell >= 100),
      'portrait maze cells stay at least 100 units',
    );
    await screenshot('mossy-path-9-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(350);
    await page.evaluate(async () => {
      const L = await import('/src/games/mossy-path/logic.ts'),
        g = neo.scene.game;
      for (let guard = 0; guard < 60 && !g.finished; guard++) {
        const s = g.maze_,
          here = s.path.at(-1);
        kit.tapOn(g.nodes[L.nextToward(g.board, here, L.goalOf(g.board, s.berry, here, s.eaten))]);
        await kit.sleep(170);
      }
    });
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.maze_.eaten.slice().sort()),
      [plan.near, plan.far].sort(),
      'both berries before the pond',
    );
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 1);
    await finished('mossy-path');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    log(
      'Mossy Path 9: farther berry first, early pond refused once, both berries, finish and one sticker passed',
    );
  }

  /** Level 10: a short plan and a Go, a plan into a wrong branch (one miss), a Hint's gold prints, then the rest and finish. */
  async function mossyPlanPlay() {
    await launch('mossy-path', 10);
    await page.waitForTimeout(350);
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    const routeFromTurtle = () =>
      page.evaluate(async () => {
        const L = await import('/src/games/mossy-path/logic.ts'),
          g = neo.scene.game;
        return L.routeBetween(g.board, g.path.at(-1), g.board.pond);
      });
    const goAndWait = async () => {
      await tap(`neo.scene.game.nodes[${await page.evaluate(() => neo.scene.game.path.at(-1))}]`);
      await page.waitForFunction(() => !neo.scene.game.going, null, { timeout: 8000 });
      await page.waitForTimeout(200);
    };
    // A short plan: two prints, nothing moves until the turtle is tapped.
    const route = await routeFromTurtle();
    for (const at of route.slice(1, 3)) await tap(`neo.scene.game.nodes[${at}]`);
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.plan, neo.scene.game.path]), [
      route.slice(0, 3),
      [route[0]],
    ]);
    await goAndWait();
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.path, neo.scene.game.misses]), [
      route.slice(0, 3),
      0,
    ]);
    // A plan into the nearest wrong branch counts one miss, however deep it goes.
    const wrong = await page.evaluate(async () => {
      const L = await import('/src/games/mossy-path/logic.ts'),
        g = neo.scene.game,
        b = g.board,
        here = g.path.at(-1),
        line = L.mainline(b);
      const entries = b.tiles
        .filter((t) => !line.has(t) && L.neighbours(b, t).some((n) => line.has(n)))
        .sort((x, y) => L.routeBetween(b, here, x).length - L.routeBetween(b, here, y).length);
      return L.routeBetween(b, here, entries[0]).slice(1);
    });
    for (const at of wrong) await tap(`neo.scene.game.nodes[${at}]`);
    await goAndWait();
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 1, 'a wrong branch counts once');
    // Hint: three gold prints toward the pond, counted once.
    await tap('neo.scene.game.hintButton');
    const hint = await page.evaluate(() => [neo.scene.game.plan.length, neo.scene.game.hints]);
    assert.ok(hint[0] >= 2 && hint[0] <= 4, 'the hint draws up to three prints');
    assert.equal(hint[1], 1);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(350);
    assert.ok(
      await page.evaluate(() => neo.scene.game.cell >= 100),
      'portrait maze cells stay at least 100 units',
    );
    await screenshot('mossy-path-10-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(350);
    // Draw on from the gold prints to the pond, then go.
    const rest = await page.evaluate(async () => {
      const L = await import('/src/games/mossy-path/logic.ts'),
        g = neo.scene.game;
      return L.routeBetween(g.board, g.plan.at(-1), g.board.pond).slice(1);
    });
    for (const at of rest) await tap(`neo.scene.game.nodes[${at}]`);
    assert.equal(await page.evaluate(() => neo.scene.game.plan.at(-1)), (await routeFromTurtle()).at(-1));
    await goAndWait();
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 1);
    await finished('mossy-path');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    log('Mossy Path 10: short plan, wrong-branch plan (one miss), gold hint, finish and one sticker passed');
  }

  return { mossyPathPlay };
}
