import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished, next }) {
  /** Number Nook: both ends, rejected tap, a hint counted once, the glide, revision, a portrait in a new look, shortest route and one sticker. */
  async function numberNookPlay() {
    // Set NOOK_LEVELS to run just the changed board.
    for (const level of (process.env.NOOK_LEVELS ?? '1,3,4,5,6,7').split(',').map(Number)) {
      await launch('number-nook', level);
      await page.waitForTimeout(400);
      // Level 1's portrait is taken in a look other than today's lantern paper.
      for (
        let tries = 0;
        level === 1 && tries < 8 && (await page.evaluate(() => neo.scene.game.look.name)) === 'lantern paper';
        tries++
      ) {
        await launch('number-nook', level);
        await page.waitForTimeout(400);
      }
      if (level === 5) {
        const goalProof = await page.evaluate(async () => {
          const { goal, solved, solutionStep } = await import('/src/games/number-nook/logic.ts');
          const g = neo.scene.game;
          return {
            target: g.targetBoard,
            miniature: g.target.children.map((c) => c.children?.[1]?.text ?? 0),
            rowGoalSolves: solved(goal(3, 3), g.targetBoard),
            wrongGoalHint: solutionStep(g.board, 3),
            distance: solutionStep(g.board, 3, 'columns').distance,
            instruction: neo.scene.instruction,
          };
        });
        assert.deepEqual(goalProof.target, [1, 4, 7, 2, 5, 8, 3, 6, 0]);
        assert.deepEqual(goalProof.miniature, ['1', '4', '7', '2', '5', '8', '3', '6', 0]);
        assert.equal(goalProof.rowGoalSolves, false);
        assert.equal(goalProof.wrongGoalHint, null);
        assert.equal(goalProof.distance, 14);
      }
      if (level >= 6) {
        const proof = await page.evaluate(() => {
          const g = neo.scene.game;
          return {
            cells: g.nodes.length,
            miniature: g.target.children.map((c) => c.children?.[1]?.text ?? 0),
            fewest: g.fewest,
            instruction: neo.scene.instruction?.id,
          };
        });
        const cells = level === 7 ? 16 : 12;
        assert.equal(proof.cells, cells);
        assert.deepEqual(proof.miniature, [...Array.from({ length: cells - 1 }, (_, i) => String(i + 1)), 0]);
        assert.equal(proof.fewest, level === 7 ? 30 : 24);
        assert.equal(proof.instruction, level === 7 ? 'nook.fifteen' : 'nook.twelve');
      }
      const original = await page.evaluate(() => neo.scene.game.board.slice());
      const wrong = await page.evaluate(async () => {
        // A tile outside the gap's row and column (diagonal): line slides make every in-line tap legal.
        const { lineSlide } = await import('/src/games/number-nook/logic.ts');
        const g = neo.scene.game;
        return g.board.findIndex((v, i) => v && !lineSlide(g.board, g.plan.cols, i));
      });
      await tap(`neo.scene.game.nodes[${wrong}]`);
      assert.equal(await page.evaluate(() => neo.scene.game.misses), 1);
      assert.deepEqual(await page.evaluate(() => neo.scene.game.board), original);
      await tap('neo.scene.game.hintButton');
      await tap('neo.scene.game.hintButton');
      assert.equal(
        await page.evaluate(() => neo.scene.game.hints),
        1,
        'a hint already showing is not counted again',
      );
      await page.evaluate(() => kit.tapOn(neo.scene.game.nodes[neo.scene.game.hinted]));
      assert.ok(await page.evaluate(() => neo.scene.game.glide !== null), 'the tile glides into the gap');
      await page.waitForTimeout(260);
      assert.equal(await page.evaluate(() => neo.scene.game.glide), null);
      await tap('neo.scene.game.undoButton');
      assert.deepEqual(await page.evaluate(() => neo.scene.game.board), original);
      await page.evaluate(async () => {
        const g = neo.scene.game;
        kit.tapOn(g.autotouch().tap.on);
      });
      await page.waitForTimeout(260);
      await tap('neo.scene.game.againButton');
      assert.deepEqual(await page.evaluate(() => neo.scene.game.board), original);
      assert.equal(await page.evaluate(() => neo.scene.game.moves), 2);
      if (level >= 3) {
        // A line slide: a tile two away in the gap's row or column moves both tiles, counts two slides and undoes whole.
        const far = await page.evaluate(async () => {
          const { lineSlide } = await import('/src/games/number-nook/logic.ts');
          const g = neo.scene.game,
            twoAway = () =>
              g.board.findIndex((_, i) => lineSlide(g.board, g.plan.cols, i)?.steps.length === 2);
          if (twoAway() < 0) {
            kit.tapOn(
              g.nodes[g.board.findIndex((_, i) => lineSlide(g.board, g.plan.cols, i)?.steps.length === 1)],
            );
            await kit.sleep(260);
          }
          const at = twoAway();
          return {
            at,
            before: g.board.slice(),
            moves: g.moves,
            expect: lineSlide(g.board, g.plan.cols, at).board,
          };
        });
        assert.equal(
          await page.evaluate(
            (at) => (kit.tapOn(neo.scene.game.nodes[at]), neo.scene.game.glide?.tiles.length),
            far.at,
          ),
          2,
          'both tiles glide',
        );
        await page.waitForTimeout(260);
        assert.deepEqual(await page.evaluate(() => neo.scene.game.board), far.expect);
        assert.equal(
          await page.evaluate(() => neo.scene.game.moves),
          far.moves + 2,
          'each tile moved is one slide',
        );
        assert.equal(await page.evaluate(() => neo.scene.game.misses), 1, 'a line slide is not a miss');
        await tap('neo.scene.game.undoButton');
        assert.deepEqual(
          await page.evaluate(() => neo.scene.game.board),
          far.before,
          'undo takes back the whole line',
        );
      }
      if (level === 7) {
        // Replay a legal detour to a board the exact search cannot solve within its node budget.
        const detour = await page.evaluate(async () => {
          const { fifteenRoute, neighbours, slide, solved } = await import('/src/games/number-nook/logic.ts');
          const { Rng } = await import('/src/engine/random.ts');
          const g = neo.scene.game;
          const rng = new Rng(78);
          for (let attempt = 0; attempt < 12; attempt++) {
            const moves = [];
            let board = g.board;
            let previous = -1;
            for (let i = 0; i < 60; i++) {
              const at = rng.pick(neighbours(board, 4).filter((cell) => cell !== previous));
              previous = board.indexOf(0);
              board = slide(board, 4, at);
              if (solved(board)) break;
              moves.push(at);
            }
            if (moves.length === 60 && fifteenRoute(board).distance === null) return { moves, board };
          }
          throw new Error('No detour triggered the budgeted fallback');
        });
        await page.evaluate(async (moves) => {
          const g = neo.scene.game;
          for (const at of moves) {
            kit.tapOn(g.nodes[at]);
            await kit.until(() => !g.glide);
          }
        }, detour.moves);
        assert.deepEqual(await page.evaluate(() => neo.scene.game.board), detour.board);
        await page.evaluate(() => {
          const g = neo.scene.game;
          const say = g.ctx.say;
          g.testHintLines = [];
          g.ctx.say = (line, ...args) => {
            g.testHintLines.push(line);
            return say(line, ...args);
          };
        });
        await tap('neo.scene.game.hintButton');
        await tap('neo.scene.game.hintButton');
        const proof = await page.evaluate(() => {
          const g = neo.scene.game;
          return { hints: g.hints, misses: g.misses, hinted: g.hinted, spoken: g.testHintLines };
        });
        assert.equal(proof.misses, 1, 'the detour is free exploration');
        assert.equal(proof.hints, 2, 'only one hint is counted on the detour board');
        assert.ok(proof.hinted >= 0);
        assert.deepEqual(proof.spoken, ['nook.borderHint', 'nook.borderHint']);
      }
      if (level === 1 || level >= 4) {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(300);
        assert.ok(await page.evaluate(() => neo.scene.game.cell >= 64));
        log(`Number Nook portrait look: ${await page.evaluate(() => neo.scene.game.look.name)}`);
        await screenshot(level === 1 ? 'number-nook-portrait' : `number-nook-portrait-${level}`);
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(300);
      }
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      const line = await page.evaluate(async () => {
        const g = neo.scene.game;
        for (let guard = 0; guard < 150 && !g.finished; guard++) {
          const intent = g.autotouch();
          if (!intent?.tap) throw new Error('Missing sliding route');
          kit.tapOn(intent.tap.on);
          await kit.until(() => !g.glide);
        }
        if (g.plan.order === 'columns') {
          const { solved } = await import('/src/games/number-nook/logic.ts');
          if (!solved(g.board, g.targetBoard) || solved(g.board)) throw new Error('Wrong goal completed');
        }
        return g.status.text;
      });
      assert.match(line, /fewest from the start: \d+/);
      if (level === 6) assert.match(line, /fewest from the start: 24$/);
      if (level === 7) assert.match(line, /fewest from the start: 30$/);
      await finished('number-nook');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
      log(`Number Nook level ${level}: touch, revision and reward passed`);
    }
  }

  return { numberNookPlay };
}
