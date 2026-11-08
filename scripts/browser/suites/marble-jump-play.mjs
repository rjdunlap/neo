import assert from 'node:assert/strict';

export function createSuite({
  page,
  errors,
  log,
  scene,
  tap,
  screenshot,
  turnToGame,
  launch,
  finished,
  next,
}) {
  async function marbleJumpPlay() {
    const tapHole = async (i) => {
      await page.evaluate((i) => kit.tapOn(neo.scene.game.nodes[i]), i);
      await page.waitForFunction(() => !neo.scene.game.flight);
      await page.waitForTimeout(120);
    };
    await page.setViewportSize({ width: 768, height: 1024 });
    let look = 'oak';
    for (let tries = 0; look === 'oak' && tries < 12; tries++) {
      await launch('marble-jump', 2);
      await page.waitForTimeout(300);
      look = await page.evaluate(() => neo.scene.game.look.name);
    }
    assert.notEqual(look, 'oak', 'a new tray look comes up within a few rounds');
    const opening = await page.evaluate(
      async () => (await import('/src/games/marble-jump/logic.ts')).solve(neo.scene.game.board)[0],
    );
    await tapHole(opening.from);
    await tapHole(opening.to);
    await screenshot(`marble-jump-2-${look}-portrait`);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    for (const level of [1, 2, 6]) {
      await launch('marble-jump', level);
      await page.waitForTimeout(400);
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      const start = await page.evaluate(() => neo.scene.game.board);
      const pair = await page.evaluate(async () => {
        const L = await import('/src/games/marble-jump/logic.ts'),
          g = neo.scene.game;
        for (let a = 0; a < 15; a++)
          for (let b = 0; b < 15; b++)
            if (
              L.occupied(g.board, a) &&
              !L.occupied(g.board, b) &&
              !L.moves(g.board).some((j) => j.from === a && j.to === b)
            )
              return [a, b];
      });
      await tapHole(pair[0]);
      await tapHole(pair[1]);
      assert.equal(await page.evaluate(() => neo.scene.game.misses), 1);
      assert.equal(await page.evaluate(() => neo.scene.game.board), start);
      await tap('neo.scene.game.hintButton');
      assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
      await tap('neo.scene.game.hintButton');
      assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'repeating the same hint counts once');
      const first = await page.evaluate(() => neo.scene.game.hinted);
      const colour = await page.evaluate((i) => neo.scene.game.colors[i], first.from);
      await page.evaluate((i) => kit.tapOn(neo.scene.game.nodes[i]), first.from);
      await page.waitForTimeout(160);
      await page.evaluate((i) => kit.tapOn(neo.scene.game.nodes[i]), first.to);
      assert.ok(
        await page.evaluate(() => !!neo.scene.game.flight),
        'the jump is shown, not swapped in one redraw',
      );
      await page.waitForFunction(() => !neo.scene.game.flight);
      assert.equal(
        await page.evaluate((i) => neo.scene.game.colors[i], first.to),
        colour,
        'the marble keeps its colour as it lands',
      );
      assert.equal(
        await page.evaluate(() => neo.scene.game.taken.length),
        1,
        'the jumped marble is in the pocket',
      );
      await tap('neo.scene.game.undoButton');
      assert.equal(await page.evaluate(() => neo.scene.game.board), start);
      await tap('neo.scene.game.restartButton');
      if (level === 6) {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(350);
        assert.ok(
          await page.evaluate(() =>
            neo.scene.game.nodes.every((n) => (n.hitArea.radius * n.worldTransform.a) / neo.view.scale >= 32),
          ),
        );
        await screenshot('marble-jump-6-portrait');
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(350);
      }
      if (level === 6) {
        const route = await page.evaluate(async () => {
          const L = await import('/src/games/marble-jump/logic.ts');
          function seek(board) {
            for (const j of L.moves(board)) {
              const after = L.jump(board, j);
              if (L.solve(after) === null) return [j];
              const rest = seek(after);
              if (rest) return [j, ...rest];
            }
            return null;
          }
          return seek(neo.scene.game.board);
        });
        assert.ok(route, 'the full triangle permits a legal route that needs revision');
        for (const j of route) {
          await tapHole(j.from);
          await tapHole(j.to);
        }
        assert.equal(await page.evaluate(() => neo.scene.game.misses), 1, 'legal experiments add no miss');
        const expected = await page.evaluate(async () => {
          const L = await import('/src/games/marble-jump/logic.ts'),
            g = neo.scene.game;
          return g.history[L.recovery(g.history.map((s) => s.board))].board;
        });
        await tap('neo.scene.game.hintButton');
        assert.equal(
          await page.evaluate(() => neo.scene.game.board),
          expected,
          'hint returns to the nearest clearing route',
        );
        assert.ok(await page.evaluate(() => neo.scene.game.hinted !== null));
      }
      let jumps = 0;
      while (!(await page.evaluate(() => neo.scene.finished))) {
        const next = await page.evaluate(async () => {
          const L = await import('/src/games/marble-jump/logic.ts');
          return L.solve(neo.scene.game.board)[0];
        });
        await tapHole(next.from);
        await tapHole(next.to);
        assert.ok(++jumps <= 13);
      }
      await finished('marble-jump');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('marble-jump').history.at(-1);
          return [r.misses, r.hints];
        }),
        [1, level === 6 ? 2 : 1],
      );
    }
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await launch('marble-jump', 7);
    await page.waitForTimeout(400);
    {
      // Three of the star pairs can only ever finish on the star, so relaunch until one can finish off it.
      const offStar = () =>
        page.evaluate(async () => {
          const L = await import('/src/games/marble-jump/logic.ts'),
            g = neo.scene.game;
          function off(b) {
            if (L.count(b) === 1) return b === 1 << g.goal ? null : [];
            for (const j of L.moves(b)) {
              if (L.solve(L.jump(b, j)) === null) continue;
              const rest = off(L.jump(b, j));
              if (rest) return [j, ...rest];
            }
            return null;
          }
          return off(g.board);
        });
      let route = await offStar();
      for (let tries = 0; !route && tries < 8; tries++) {
        await launch('marble-jump', 7);
        await page.waitForTimeout(400);
        route = await offStar();
      }
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      const goal = await page.evaluate(() => neo.scene.game.goal);
      assert.ok(goal >= 0, 'level 7 has a star hole');
      assert.ok(route, 'a legal route can finish off the star');
      for (const j of route) {
        await tapHole(j.from);
        await tapHole(j.to);
      }
      assert.equal(
        await page.evaluate(() => neo.scene.finished),
        false,
        'one marble off the star is not a finish',
      );
      assert.equal(await page.evaluate(() => neo.scene.game.misses), 0, 'a legal route adds no miss');
      assert.match(await page.evaluate(() => neo.scene.game.status.text), /not on the star/);
      await screenshot('marble-jump-7-off-star-portrait');
      await tap('neo.scene.game.hintButton');
      assert.ok(
        await page.evaluate(async () => {
          const L = await import('/src/games/marble-jump/logic.ts'),
            g = neo.scene.game;
          return L.solve(g.board, g.goal) !== null && L.count(g.board) > 1;
        }),
        'hint returns to a board that can still finish on the star',
      );
      let jumps = 0;
      while (!(await page.evaluate(() => neo.scene.finished))) {
        const next = await page.evaluate(async () => {
          const L = await import('/src/games/marble-jump/logic.ts'),
            g = neo.scene.game;
          return L.solve(g.board, g.goal)[0];
        });
        await tapHole(next.from);
        await tapHole(next.to);
        assert.ok(++jumps <= 13);
      }
      assert.equal(
        await page.evaluate(() => neo.scene.game.board),
        1 << goal,
        'the last marble is on the star',
      );
      assert.match(
        await page.evaluate(() => neo.scene.game.status.text),
        /^\d+ moves · fewest possible \d+$/,
      );
      await finished('marble-jump');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    }
    await launch('marble-jump', 8);
    await page.waitForTimeout(400);
    {
      const gold = () => page.evaluate(() => neo.scene.game.gold);
      assert.ok((await gold()) >= 0, 'level 8 has a gold marble');
      assert.equal(await page.evaluate(() => neo.scene.game.title.text), 'Keep the gold marble');
      // Find clearing jumps that lead to a board where a jump over the gold marble is on offer, then try it.
      const { path, over } = await page.evaluate(async () => {
        const L = await import('/src/games/marble-jump/logic.ts'),
          g = neo.scene.game;
        function find(b, gold) {
          const over = L.moves(b).find((j) => j.over === gold);
          if (over) return { path: [], over };
          for (const j of L.allowed(b, gold)) {
            const next = L.jump(b, j),
              moved = L.goldAfter(gold, j);
            if (L.solve(next, L.ANY, moved) === null) continue;
            const rest = find(next, moved);
            if (rest) return { path: [j, ...rest.path], over: rest.over };
          }
          return null;
        }
        return find(g.board, g.gold) ?? { path: [], over: null };
      });
      for (const j of path) {
        await tapHole(j.from);
        await tapHole(j.to);
      }
      assert.ok(over, 'a jump over the gold marble comes up');
      const board = await page.evaluate(() => neo.scene.game.board);
      await tapHole(over.from);
      await tapHole(over.to);
      assert.equal(await page.evaluate(() => neo.scene.game.board), board, 'the jump over gold is refused');
      assert.equal(await page.evaluate(() => neo.scene.game.misses), 1, 'the refused jump counts a miss');
      await screenshot('marble-jump-8-gold-portrait');
      await tap('neo.scene.game.hintButton');
      const hinted = await page.evaluate(() => neo.scene.game.hinted);
      assert.ok(hinted && hinted.over !== (await gold()), 'the hint never jumps gold');
      assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
      let jumps = 0;
      while (!(await page.evaluate(() => neo.scene.finished))) {
        const next = await page.evaluate(async () => {
          const L = await import('/src/games/marble-jump/logic.ts'),
            g = neo.scene.game;
          return L.solve(g.board, g.goal, g.gold)[0];
        });
        await tapHole(next.from);
        await tapHole(next.to);
        assert.ok(++jumps <= 8);
      }
      assert.equal(
        await page.evaluate(() => neo.scene.game.board),
        1 << (await gold()),
        'the gold marble is the last one left',
      );
      await finished('marble-jump');
    }
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    await page.evaluate(() => neo.go.land('puzzle-peaks'));
    await scene('LandScene');
    await turnToGame('marble-jump');
    await tap("neo.scene.showing.find(m => m.mod.id === 'marble-jump').node");
    await scene('GameScene');
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => neo.scene.mod.id), 'marble-jump');
    await page.evaluate(() => neo.go.land('puzzle-peaks'));
    await scene('LandScene');
    await page.waitForTimeout(400);
    assert.deepEqual(errors, []);
    log(
      'Marble Jump: first/last, level 7 off-star finish and star finish, level 8 refused jump over gold and gold finish, illegal jump, hint recovery, undo/restart, portrait, land launch/leave and one sticker passed',
    );
  }

  return { marbleJumpPlay };
}
