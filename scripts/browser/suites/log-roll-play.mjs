import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, turnToGame, launch, finished, next }) {
  /** Log Roll: both ends, rejected edge roll, solver hint, revision and upright completion. */
  async function logRollPlay() {
    for (const level of process.env.LOG_ROLL_LEVELS?.split(',').map(Number) ?? [1, 4, 5, 6, 7]) {
      await launch('log-roll', level);
      await page.waitForTimeout(400);
      const original = await page.evaluate(() => ({ ...neo.scene.game.state }));
      // Walk to an edge using legal rolls, then try an unsupported roll through its real button.
      const blocked = await page.evaluate(async (level) => {
        const { DIRECTIONS, roll, key, solved, refusesMoss } = await import('/src/games/log-roll/logic.ts');
        const g = neo.scene.game,
          queue = [{ state: g.state, route: [] }],
          seen = new Set();
        for (let head = 0; head < queue.length; head++) {
          const v = queue[head];
          for (const d of DIRECTIONS) {
            const n = roll(v.state, d, g.puzzle.plan.floor);
            if (!n && (level !== 6 || refusesMoss(v.state, d, g.puzzle.plan.floor))) return [...v.route, d];
            if (n && !seen.has(key(n)) && !solved(n, g.puzzle.plan.floor)) {
              seen.add(key(n));
              queue.push({ state: n, route: [...v.route, d] });
            }
          }
        }
        throw new Error('No unsupported roll found');
      }, level);
      for (const d of blocked.slice(0, -1)) {
        await tap(`neo.scene.game.directions.${d}`);
        await page.waitForTimeout(330);
      }
      const edgeState = await page.evaluate(() => ({ ...neo.scene.game.state }));
      await tap(`neo.scene.game.directions.${blocked.at(-1)}`);
      assert.deepEqual(await page.evaluate(() => neo.scene.game.state), edgeState);
      assert.equal(await page.evaluate(() => neo.scene.game.misses), 0);
      assert.match(
        await page.evaluate(() => neo.scene.game.status.text),
        level === 6 ? /Moss is too soft/ : /Both ends need stones/,
      );
      if (level === 5) {
        // Stand the log up on a cradle stone: it does not finish, costs nothing, and the status says to lie it down.
        const toCradle = await page.evaluate(async () => {
          const { DIRECTIONS, roll, key, standsOnCradle } = await import('/src/games/log-roll/logic.ts');
          const g = neo.scene.game,
            floor = g.puzzle.plan.floor,
            queue = [{ state: g.puzzle.start, route: [] }],
            seen = new Set([key(g.puzzle.start)]);
          for (let head = 0; head < queue.length; head++) {
            const v = queue[head];
            if (standsOnCradle(v.state, floor)) return v.route;
            for (const d of DIRECTIONS) {
              const n = roll(v.state, d, floor);
              if (n && !seen.has(key(n))) {
                seen.add(key(n));
                queue.push({ state: n, route: [...v.route, d] });
              }
            }
          }
          throw new Error('No way to stand on a cradle stone');
        });
        await tap('neo.scene.game.againButton');
        for (const d of toCradle) {
          await tap(`neo.scene.game.directions.${d}`);
          await page.waitForTimeout(330);
        }
        assert.equal(await page.evaluate(() => neo.scene.game.state.pose), 'up');
        assert.equal(
          await page.evaluate(() => neo.scene.game.finished),
          false,
          'standing on a cradle never finishes',
        );
        assert.equal(await page.evaluate(() => neo.scene.game.misses), 0);
        assert.match(
          await page.evaluate(() => neo.scene.game.status.text),
          /lie it across both cradle stones/,
        );
        assert.match(await page.evaluate(() => neo.scene.game.heading.text), /cradle/);
        await screenshot('log-roll-cradle-stand');
      }
      if (level === 7) {
        // Reach the switch lying down first: exploration costs nothing and does not open the bridge.
        const routeTo = async (kind) =>
          page.evaluate(async (kind) => {
            const { DIRECTIONS, roll, key, solved, liesOnSwitch } =
              await import('/src/games/log-roll/logic.ts');
            const g = neo.scene.game,
              floor = g.puzzle.plan.floor;
            const queue = [{ state: g.state, route: [] }],
              seen = new Set([key(g.state)]);
            for (let head = 0; head < queue.length; head++) {
              const v = queue[head];
              if (kind === 'lying' ? liesOnSwitch(v.state, floor) && !v.state.bridge : !!v.state.bridge)
                return v.route;
              for (const d of DIRECTIONS) {
                const n = roll(v.state, d, floor);
                if (!n || solved(n, floor) || seen.has(key(n)) || (kind === 'lying' && n.bridge)) continue;
                seen.add(key(n));
                queue.push({ state: n, route: [...v.route, d] });
              }
            }
            throw new Error('No switch route: ' + kind);
          }, kind);
        const walk = async (route) => {
          for (const d of route) {
            await tap(`neo.scene.game.directions.${d}`);
            await page.waitForTimeout(360);
          }
        };
        await tap('neo.scene.game.againButton');
        await walk(await routeTo('lying'));
        assert.equal(await page.evaluate(() => !!neo.scene.game.state.bridge), false);
        assert.match(await page.evaluate(() => neo.scene.game.status.text), /lying log does not press/);
        assert.equal(await page.evaluate(() => neo.scene.game.hints), 0);
        const press = await routeTo('standing');
        await walk(press.slice(0, -1));
        const prePress = await page.evaluate(() => ({ ...neo.scene.game.state }));
        await walk(press.slice(-1));
        assert.equal(await page.evaluate(() => neo.scene.game.state.bridge), true);
        await tap('neo.scene.game.undoButton');
        assert.deepEqual(await page.evaluate(() => neo.scene.game.state), prePress);
        assert.equal(
          await page.evaluate(() => !!neo.scene.game.state.bridge),
          false,
          'Undo lowers the bridge',
        );
        await walk(press.slice(-1));
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(300);
        await screenshot('log-roll-7-raised-portrait');
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(300);
      }
      await tap('neo.scene.game.againButton');
      assert.deepEqual(await page.evaluate(() => neo.scene.game.state), original);
      await tap('neo.scene.game.hintButton');
      await tap('neo.scene.game.hintButton');
      assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'a glowing hint counts once');
      await page.evaluate(() => {
        const g = neo.scene.game;
        kit.tapOn(g.directions[g.hinted]);
      });
      assert.ok(await page.evaluate(() => neo.scene.game.tip !== null), 'the log tips rather than jumping');
      assert.equal(await page.evaluate(() => neo.scene.game.autotouch()), null, 'the bot waits for the tip');
      await page.waitForTimeout(400);
      await tap('neo.scene.game.undoButton');
      assert.deepEqual(await page.evaluate(() => neo.scene.game.state), original);
      assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
      if (level === 4 || level >= 6) {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(300);
        assert.ok(await page.evaluate(() => neo.scene.game.cell >= 64));
        log(`Log Roll level ${level} look: ${await page.evaluate(() => neo.scene.game.look.name)}`);
        await screenshot(`log-roll-${level}-portrait`);
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(300);
        await screenshot(`log-roll-${level}-landscape`);
      }
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      await page.evaluate(async () => {
        const { solutionStep } = await import('/src/games/log-roll/logic.ts');
        const g = neo.scene.game;
        for (let guard = 0; guard < 40 && !g.finished; guard++) {
          const d = solutionStep(g.state, g.puzzle.plan.floor)?.next;
          if (!d) throw new Error('No Log Roll route');
          kit.tapOn(g.directions[d]);
          await kit.sleep(330);
        }
      });
      await finished('log-roll');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
      log(`Log Roll level ${level}: edge support, hint, Undo, reset and one sticker passed`);
    }
    await page.evaluate(() => neo.go.land('tinker-lab'));
    await scene('LandScene');
    await turnToGame('log-roll');
    await tap("neo.scene.showing.find(m => m.mod.id === 'log-roll').node");
    await scene('GameScene');
    assert.equal(await page.evaluate(() => neo.scene.mod.id), 'log-roll');
  }

  return { logRollPlay };
}
