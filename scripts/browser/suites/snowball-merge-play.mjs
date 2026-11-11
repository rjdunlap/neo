import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, turnToGame, launch, finished }) {
  /** Snowball Merge: real arrows, unjudged inert presses, revision, solver help and a finite finish. */
  async function snowballMergePlay() {
    const idle = () => page.waitForFunction(() => !neo.scene.game.busy);
    const direction = () => page.evaluate(() => neo.scene.game.route?.[0]);
    const press = async (d) => {
      await tap(`neo.scene.game.arrows.${d}`);
      await idle();
    };
    // SNOWBALL_LEVELS=7 (or 5,6) plays only those levels; unset plays them all and the land launch at the end.
    const only = process.env.SNOWBALL_LEVELS?.split(',').map(Number);
    const want = (level) => !only || only.includes(level);
    for (const level of [1, 4].filter(want)) {
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      await launch('snowball-merge', level);
      await page.waitForTimeout(300);
      const initial = await page.evaluate(() => neo.scene.game.board.slice());
      await press(await direction());
      const inert = await page.evaluate(async () => {
        const { DIRECTIONS, slide } = await import('/src/games/snowball-merge/logic.ts');
        return DIRECTIONS.find((d) => !slide(neo.scene.game.board, d).changed);
      });
      assert.ok(inert, 'a compacted edge offers an inert press');
      const compacted = await page.evaluate(() => neo.scene.game.board.slice());
      await press(inert);
      assert.deepEqual(await page.evaluate(() => neo.scene.game.board), compacted);
      assert.equal(await page.evaluate(() => neo.scene.game.misses), 0, 'exploration is not a wrong answer');
      assert.equal(await page.evaluate(() => neo.scene.game.slides), 1, 'inert presses add no slide');
      await tap('neo.scene.game.undoButton');
      assert.deepEqual(await page.evaluate(() => neo.scene.game.board), initial);
      if (level === 4) {
        // Two inert arrows in a row light the route's next arrow on their own, counted as one hint.
        await press(await direction());
        const stuckArrow = await page.evaluate(async () => {
          const { DIRECTIONS, slide } = await import('/src/games/snowball-merge/logic.ts');
          return DIRECTIONS.find((d) => !slide(neo.scene.game.board, d).changed);
        });
        assert.ok(stuckArrow, 'a compacted edge offers an inert press');
        await press(stuckArrow);
        assert.equal(
          await page.evaluate(() => neo.scene.game.hinted),
          null,
          'one inert press lights nothing',
        );
        await press(stuckArrow);
        assert.equal(await page.evaluate(() => neo.scene.game.hinted), await direction());
        await press(stuckArrow);
        assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'the glow counts once');
        await tap('neo.scene.game.undoButton');
        assert.equal(await page.evaluate(() => neo.scene.game.hinted), null);
        assert.equal(
          await page.evaluate(() => ['morning', 'dusk', 'flurry'].includes(neo.scene.game.look)),
          true,
        );
      }
      await tap('neo.scene.game.hintButton');
      const hint = await page.evaluate(() => neo.scene.game.hinted);
      assert.equal(hint, await direction());
      await tap('neo.scene.game.hintButton');
      assert.equal(
        await page.evaluate(() => neo.scene.game.hints),
        level === 4 ? 2 : 1,
        'same hint is counted once',
      );
      await press(hint);
      await tap('neo.scene.game.restartButton');
      assert.deepEqual(await page.evaluate(() => neo.scene.game.board), initial);
      assert.equal(
        await page.evaluate(() => neo.scene.game.hints),
        level === 4 ? 3 : 2,
        'restart preserves support accounting',
      );
      if (level === 4) {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(300);
        const boxes = await page.evaluate(() => {
          const g = neo.scene.game;
          return [...Object.values(g.arrows), g.undoButton, g.hintButton, g.restartButton].map((n) => ({
            x: n.x + n.hitArea.x,
            y: n.y + n.hitArea.y,
            w: n.hitArea.width,
            h: n.hitArea.height,
          }));
        });
        const view = await page.evaluate(() => ({ w: neo.view.w, h: neo.view.h }));
        for (const b of boxes) {
          assert.ok(b.w >= 100 && b.h >= 100);
          assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= view.w && b.y + b.h <= view.h);
          assert.ok(b.x >= 200 || b.y + b.h < view.h - 205, 'clear of the guide pet');
        }
        for (let i = 0; i < boxes.length; i++)
          for (const b of boxes.slice(i + 1)) {
            const a = boxes[i];
            assert.ok(
              a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y,
              'controls stay apart',
            );
          }
        await screenshot('snowball-merge-4-portrait');
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(250);
        await screenshot('snowball-merge-4-landscape');
      }
      for (let guard = 0; guard < 40 && !(await page.evaluate(() => neo.scene.game.finished)); guard++) {
        const d = await direction();
        assert.ok(d);
        await press(d);
      }
      const status = await page.evaluate(() => neo.scene.game.status.text);
      assert.match(status, /shortest route is \d+/, 'the par line shows after the finish');
      await finished('snowball-merge');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('snowball-merge').history.at(-1);
          return [r.misses, r.hints];
        }),
        [0, level === 4 ? 3 : 2],
      );
    }
    if (want(5)) {
      // Level 5, the ice rock: it stays in its cell, snowballs stop beside it (said once, no miss), and the round finishes.
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      await launch('snowball-merge', 5);
      await page.waitForTimeout(300);
      const rock = await page.evaluate(() => neo.scene.game.board.indexOf(-1));
      assert.ok(rock >= 0 && rock !== 4, 'level 5 has one ice rock away from the centre');
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(300);
      let rocked = 0;
      for (let guard = 0; guard < 40 && !(await page.evaluate(() => neo.scene.game.finished)); guard++) {
        const d = await direction();
        assert.ok(d);
        const stops = await page.evaluate(async (d) => {
          const { slide } = await import('/src/games/snowball-merge/logic.ts');
          return slide(neo.scene.game.board, d).rocked;
        }, d);
        await press(d);
        assert.equal(
          await page.evaluate(() => neo.scene.game.board.indexOf(-1)),
          rock,
          'the rock never moves',
        );
        if (stops && !rocked++) {
          assert.equal(await page.evaluate(() => neo.scene.game.rockSaid), true, 'the rock line is said');
          await screenshot('snowball-merge-5-portrait');
        }
      }
      assert.ok(rocked >= 3, 'the route rests snowballs against the rock');
      await page.setViewportSize({ width: 1024, height: 768 });
      await finished('snowball-merge');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('snowball-merge').history.at(-1);
          return [r.misses, r.hints];
        }),
        [0, 0],
        'stopping at the rock is neither a miss nor help',
      );
    }
    if (want(6)) {
      // Level 6, the snowman: the goal is three 16s. One join too many (two 16s) is said, lights Undo once, and Undo
      // takes it back; the round ends the moment only three 16s are left, stacked.
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      await launch('snowball-merge', 6);
      await page.waitForTimeout(300);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => neo.scene.game.title.text), 'Snowman: 16 + 16 + 16');
      const tooFar = () =>
        page.evaluate(async () => {
          const { DIRECTIONS, slide, overshot } = await import('/src/games/snowball-merge/logic.ts');
          const g = neo.scene.game;
          return DIRECTIONS.find((d) => {
            const next = slide(g.board, d);
            return next.changed && overshot(next.board, g.puzzle.goal);
          });
        });
      let overshoots = 0;
      for (let guard = 0; guard < 40 && !(await page.evaluate(() => neo.scene.game.finished)); guard++) {
        const wrong = overshoots ? null : await tooFar();
        if (wrong) {
          const kept = await page.evaluate(() => neo.scene.game.board.slice());
          await press(wrong);
          overshoots++;
          assert.ok(await page.evaluate(() => neo.scene.game.board.includes(32)), 'two 16s joined into a 32');
          assert.equal(await page.evaluate(() => neo.scene.game.finished), false);
          assert.equal(await page.evaluate(() => neo.scene.game.route), null, 'nothing unjoins');
          assert.equal(await page.evaluate(() => neo.scene.game.hinted), 'undo', 'Undo lights on its own');
          assert.match(await page.evaluate(() => neo.scene.game.status.text), /One join too many/);
          await screenshot('snowball-merge-6-portrait');
          await tap('neo.scene.game.undoButton');
          assert.deepEqual(await page.evaluate(() => neo.scene.game.board), kept);
          assert.equal(await page.evaluate(() => neo.scene.game.hinted), null);
        }
        const d = await direction();
        assert.ok(d);
        await press(d);
      }
      assert.equal(overshoots, 1, 'the route offers the join too many');
      assert.deepEqual(
        await page.evaluate(() => neo.scene.game.board.filter((v) => v > 0)),
        [16, 16, 16],
        'the round ends at exactly three 16s',
      );
      await page.waitForFunction(() => neo.scene.game.stacked);
      const stack = await page.evaluate(() =>
        [...neo.scene.game.nodes.values()].map((n) => [Math.round(n.x), Math.round(n.y)]),
      );
      assert.equal(new Set(stack.map((p) => p[0])).size, 1, 'the snowman stands in one column');
      assert.equal(new Set(stack.map((p) => p[1])).size, 3, 'one snowball on top of the other');
      await screenshot('snowball-merge-6-snowman');
      await page.setViewportSize({ width: 1024, height: 768 });
      await finished('snowball-merge');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('snowball-merge').history.at(-1);
          return [r.misses, r.hints];
        }),
        [0, 1],
        'the glow at the join too many counts as one hint, never a miss',
      );
    }
    if (want(7)) {
      // Level 7, a wider field: sixteen cells by the same rules. Hints come from the distance map built once for the
      // board; one glow lights on its own (Undo after a slide into a dead end, or the next arrow after two still
      // arrows: one hint, never a miss), and the round ends
      // at one 128 in exactly the map's slides.
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      await launch('snowball-merge', 7);
      await page.waitForTimeout(300);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(300);
      const g = await page.evaluate(() => {
        const g = neo.scene.game;
        return { cells: g.board.length, size: g.size, par: g.par, route: g.route.length, cell: g.cell };
      });
      assert.deepEqual([g.cells, g.size], [16, 4], 'the field is four cells a side');
      assert.ok(g.par >= 12 && g.par <= 16 && g.route === g.par, 'the map gives the starting route');
      const fits = await page.evaluate(() => {
        const g = neo.scene.game,
          w = g.cell * g.size;
        const controls = [...Object.values(g.arrows), g.undoButton, g.hintButton, g.restartButton];
        return (
          g.field.x - 14 >= 0 &&
          g.field.x + w + 14 <= neo.view.w &&
          controls.every((n) => n.y + 50 <= neo.view.h && n.y - 50 >= g.field.y + w + 14)
        );
      });
      assert.ok(fits, 'the wider field and both button rows fit, the buttons under the field');
      assert.ok(g.cell >= 120, 'cells stay large on an upright phone');
      const deadEnd = () =>
        page.evaluate(async () => {
          const { DIRECTIONS, slide } = await import('/src/games/snowball-merge/logic.ts');
          const g = neo.scene.game;
          return DIRECTIONS.find((d) => {
            const next = slide(g.board, d);
            return next.changed && !g.map.steps.has(next.board.join(','));
          });
        });
      let strays = 0,
        slides = 0;
      for (let guard = 0; guard < 40 && !(await page.evaluate(() => neo.scene.game.finished)); guard++) {
        const wrong = strays ? null : await deadEnd();
        if (wrong) {
          const kept = await page.evaluate(() => neo.scene.game.board.slice());
          await press(wrong);
          strays++;
          assert.equal(await page.evaluate(() => neo.scene.game.route), null, 'a dead end has no route');
          assert.equal(await page.evaluate(() => neo.scene.game.hinted), 'undo', 'Undo lights on its own');
          await screenshot('snowball-merge-7-portrait');
          await tap('neo.scene.game.undoButton');
          assert.deepEqual(await page.evaluate(() => neo.scene.game.board), kept);
          assert.equal(await page.evaluate(() => neo.scene.game.hinted), null);
        } else if (!strays && slides >= 3) {
          // No dead end is one slide off this board's route: two still arrows in a row light the next arrow instead.
          const still = await page.evaluate(async () => {
            const { DIRECTIONS, slide } = await import('/src/games/snowball-merge/logic.ts');
            return DIRECTIONS.find((d) => !slide(neo.scene.game.board, d).changed);
          });
          if (still) {
            await press(still);
            await press(still);
            strays++;
            assert.equal(await page.evaluate(() => neo.scene.game.hinted), await direction());
            await screenshot('snowball-merge-7-portrait');
          }
        }
        const left = await page.evaluate(() => neo.scene.game.route.length);
        const d = await direction();
        assert.ok(d);
        await press(d);
        slides++;
        if (!(await page.evaluate(() => neo.scene.game.finished)))
          assert.equal(
            await page.evaluate(() => neo.scene.game.route.length),
            left - 1,
            'each hinted slide is one closer',
          );
      }
      assert.equal(
        strays,
        1,
        'one glow lit on its own: Undo at a dead end, or the next arrow after two still arrows',
      );
      assert.equal(slides, g.par, 'the hints finish in the shortest route');
      assert.deepEqual(await page.evaluate(() => neo.scene.game.board.filter((v) => v > 0)), [128]);
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(250);
      await screenshot('snowball-merge-7-landscape');
      await finished('snowball-merge');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('snowball-merge').history.at(-1);
          return [r.misses, r.hints];
        }),
        [0, 1],
        'the glow counts as one hint, never a miss',
      );
    }
    if (only) {
      assert.deepEqual(errors, []);
      log(`Snowball Merge: level${only.length > 1 ? 's' : ''} ${only.join(', ')} passed (SNOWBALL_LEVELS)`);
      return;
    }
    await page.evaluate(() => neo.go.land('lantern-lake'));
    await scene('LandScene');
    await turnToGame('snowball-merge');
    await tap("neo.scene.showing.find(m => m.mod.id === 'snowball-merge').node");
    await scene('GameScene');
    await page.waitForTimeout(400);
    // Leave while a slide's scene-owned tween is in flight.
    const d = await direction();
    await page.evaluate((d) => {
      kit.tapOn(neo.scene.game.arrows[d]);
      neo.go.land('lantern-lake');
    }, d);
    await scene('LandScene');
    await page.waitForTimeout(350);
    assert.deepEqual(errors, []);
    log(
      'Snowball Merge: levels 1, 4, 5 (the ice rock stays put, said once, no miss) 6 (the snowman: one join too many, Undo, three 16s stacked) and 7 (the 4 × 4 field: one glow, the shortest route from the map), inert exploration, hint once, Undo/Restart, portrait controls, one sticker, land launch and leave during slide passed',
    );
  }

  return { snowballMergePlay };
}
