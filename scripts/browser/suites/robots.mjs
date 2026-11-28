import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
  async function robots() {
    if (process.env.DRIVE_ONLY) return drive();
    for (
      let level = Number(process.env.FROM_LEVEL || 1);
      level <= Number(process.env.TO_LEVEL || 15);
      level++
    ) {
      if (level >= 11) await page.setViewportSize({ width: 768, height: 1024 });
      await launch('robot-path', level);
      if (level === 11) {
        await page.evaluate(async () => {
          const g = neo.scene.game;
          if (!g.prediction || !g.program.length) throw new Error('Prediction program was not built');
          // A wrong prediction is a free experiment; the robot then shows the real stop.
          kit.tapOn(g.predictionCells[4]);
          await kit.sleep(250);
          if (!g.play.visible || g.queue.children.length !== g.plan.limit)
            throw new Error('Prediction controls or shown program are missing');
        });
        await page.waitForTimeout(250);
        await screenshot('robot-path-prediction');
        await page.evaluate(async () => {
          const g = neo.scene.game;
          kit.tapOn(g.play);
          if (!(await kit.until(() => g.done, 12000))) throw new Error('Prediction playback did not finish');
          if (g.misses !== 0 || g.hints !== 0) throw new Error('A prediction was counted as a miss or hint');
        });
        await finished('robot-path');
        log('Robot Path level 11: a free prediction, step-through playback, and reward passed');
        continue;
      }
      if (level === 12) {
        await page.evaluate(async () => {
          const g = neo.scene.game;
          if (!g.fixPlan || g.program.length !== g.fixPlan.solution.slots.length)
            throw new Error('Repair program was not built');
          kit.tapOn(g.play);
          if (!(await kit.until(() => g.watched && !g.running, 12000)))
            throw new Error('Free first watch did not finish');
          if (g.misses !== 0 || g.hints !== 0) throw new Error('The first watch was counted');
        });
        await screenshot('robot-path-12');
        await page.evaluate(async () => {
          const g = neo.scene.game;
          for (let i = 0; i < 2; i++) {
            kit.tapOn(g.play);
            if (!(await kit.until(() => !g.running))) throw new Error('Failed repair run did not finish');
          }
          if (g.hints !== 1) throw new Error('Two failed repairs did not show the slot hint');
          kit.tapOn(g.slotTargets[g.fixPlan.fixSlot]);
          await kit.sleep(250);
          kit.tapOn(g.arrows.find((a) => a.dir === g.fixPlan.solution.slots[g.fixPlan.fixSlot].dir).button);
          await kit.sleep(250);
          kit.tapOn(g.play);
          if (!(await kit.until(() => g.done, 12000)))
            throw new Error('Fixed program did not reach the star');
          if (g.misses !== 2 || g.hints !== 1)
            throw new Error('Repair misses or hint were not accounted for');
        });
        await finished('robot-path');
        log('Robot Path level 12: free watch, two repair misses, slot hint, and fixed program passed');
        continue;
      }
      if (level === 14) {
        await page.evaluate(async () => {
          const g = neo.scene.game;
          const f = g.fixPlan;
          if (!f || f.mode !== 'loop' || g.loop !== f.brokenLoop || !g.loopButton.visible)
            throw new Error('Looped repair program was not built');
          kit.tapOn(g.play);
          if (!(await kit.until(() => g.watched && !g.running, 15000)))
            throw new Error('Free first watch did not finish');
          if (g.misses !== 0 || g.hints !== 0) throw new Error('The first watch was counted');
          // An unchanged run, then a wrong edit (one more of the first step): two misses and the glow.
          kit.tapOn(g.play);
          if (!(await kit.until(() => !g.running, 15000))) throw new Error('Unchanged run did not finish');
          kit.tapOn(g.slotTargets[0]);
          await kit.sleep(250);
          kit.tapOn(g.arrows.find((a) => a.dir === g.program[0].dir).button);
          await kit.sleep(450);
          kit.tapOn(g.play);
          if (!(await kit.until(() => !g.running, 15000))) throw new Error('Wrong mend did not finish');
          if (g.misses !== 2 || g.hints !== 1)
            throw new Error(`Two failed mends gave ${g.misses} misses and ${g.hints} hints`);
        });
        await screenshot('robot-path-14');
        await page.evaluate(async () => {
          const g = neo.scene.game;
          // Follow the glow from the wrong edit back to a mended loop.
          for (let i = 0; i < 30 && !g.done; i++) {
            if (g.running) {
              await kit.until(() => !g.running || g.done, 15000);
              continue;
            }
            const target = g.nextHelp();
            kit.tapOn(target);
            await kit.sleep(450);
            if (target === g.play) await kit.until(() => !g.running || g.done, 15000);
          }
          if (!g.done) throw new Error('Following the glow did not mend the loop');
          if (g.misses !== 2 || g.hints !== 1)
            throw new Error(`Mend accounting was ${g.misses} misses and ${g.hints} hints`);
        });
        await finished('robot-path');
        log(
          'Robot Path level 14: free watch, an unchanged run and a wrong mend, the glow, and the mended loop passed',
        );
        continue;
      }
      if (level === 15) {
        await page.evaluate(async () => {
          const g = neo.scene.game;
          const tapTile = async (tile) => {
            kit.tapOn(g.palette.find((p) => p.tile === tile).button);
            await kit.sleep(450);
          };
          if (g.plan.corridor.length !== 6) throw new Error('A routine board was not built');
          // Free incomplete tries: Play with an empty Start here row, and a call with nothing to run.
          kit.tapOn(g.play);
          await kit.sleep(300);
          if (g.running || g.misses !== 0 || g.flash?.row !== 'main-first')
            throw new Error('An empty Start here row was not a free pointer');
          if (!g.plan.routine.length) {
            await tapTile('call');
            if (g.editor.main.length || g.flash?.row !== 'main')
              throw new Error('A call in the routine row did not point at Start here');
          } else {
            g.editor.sel = { row: 'routine', i: 0 };
            g.editor.routine = [];
            await tapTile('call');
            if (g.editor.main.length) throw new Error('A call with an empty routine was placed');
            g.editor.routine = [...g.plan.routine];
          }
          // Undo restores the slot and the selection.
          kit.tapOn(g.targets.get('main0'));
          await kit.sleep(300);
          await tapTile('call');
          if (g.editor.main[0] !== 'call') throw new Error('The call did not land in Start here');
          kit.tapOn(g.undo);
          await kit.sleep(450);
          if (g.editor.main.length) throw new Error('Undo did not take the call back out');
          // Two walks that bump: free of the routine's content, each a gentle miss, then the glow.
          if (!g.editor.routine.length) {
            kit.tapOn(g.targets.get('routine0'));
            await kit.sleep(300);
            await tapTile('up');
          }
          kit.tapOn(g.targets.get('main0'));
          await kit.sleep(300);
          await tapTile('up');
          for (let k = 0; k < 2; k++) {
            kit.tapOn(g.play);
            if (!(await kit.until(() => !g.running, 20000))) throw new Error('A bump did not finish');
          }
          if (g.misses !== 2 || g.hints !== 1)
            throw new Error(`Two bumps gave ${g.misses} misses and ${g.hints} hints`);
        });
        await screenshot('robot-path-15');
        // Rotation keeps both rows.
        const before = await page.evaluate(() => JSON.stringify(neo.scene.game.editor));
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(500);
        await screenshot('robot-path-15-sideways');
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(500);
        if ((await page.evaluate(() => JSON.stringify(neo.scene.game.editor))) !== before)
          throw new Error('Rotation changed the program');
        await page.evaluate(async () => {
          const g = neo.scene.game;
          // Follow the glow (the ghost finger's own presses) to a winning program.
          for (let i = 0; i < 40 && !g.done; i++) {
            if (g.running) {
              await kit.until(() => !g.running || g.done, 20000);
              continue;
            }
            const intent = g.autotouch();
            if (!intent) break;
            kit.tapOn(intent.tap.on);
            await kit.sleep(450);
          }
          if (!g.done) throw new Error('Following the glow did not reach the star');
          if (g.misses !== 2 || g.hints !== 1)
            throw new Error(`Routine accounting was ${g.misses} misses and ${g.hints} hints`);
        });
        await finished('robot-path');
        log(
          'Robot Path level 15: free incomplete tries, Undo, two bumps, the glow, rotation and the reward passed',
        );
        continue;
      }
      if (level === 13) await screenshot('robot-path-13');
      await page.evaluate(async (level) => {
        const g = neo.scene.game;
        const spoken = [];
        if (level === 6) {
          const say = g.ctx.say;
          g.ctx.say = (id, ...args) => {
            spoken.push(id);
            return say(id, ...args);
          };
          kit.tapOn(g.play);
          await kit.sleep(500);
          if (!spoken.includes('robot.empty') || g.misses !== 0)
            throw new Error('Empty program feedback or accounting failed');
          kit.tapOn(g.arrows.find((a) => a.dir === g.solution[0].dir).button);
          await kit.sleep(450);
          kit.tapOn(g.play);
          if (!(await kit.until(() => !g.running, 12000))) throw new Error('Short run stuck');
          if (!spoken.includes('robot.short') || g.misses !== 1)
            throw new Error('Short program was not explained');
          if (g.nextHelp() === g.clear) throw new Error('Hint discarded a useful prefix');
        }
        if (level === 13) {
          // The plain way to the star forgets the apple: a gentle miss that names it and makes it glow.
          const say = g.ctx.say;
          g.ctx.say = (id, ...args) => {
            spoken.push(id);
            return say(id, ...args);
          };
          const { shortestPath, compress } = await import('/src/games/robot-path/logic.ts');
          for (const slot of compress(shortestPath(g.plan)))
            for (let k = 0; k < slot.n; k++) {
              kit.tapOn(g.arrows.find((a) => a.dir === slot.dir).button);
              await kit.sleep(450);
            }
          kit.tapOn(g.play);
          if (!(await kit.until(() => !g.running, 20000))) throw new Error('Straight run stuck');
          if (g.misses !== 1 || !spoken.includes('robot.forgot'))
            throw new Error('Forgetting the apple was not a named miss');
          if (!g.apple.visible) throw new Error('The apple did not come back after the miss');
        }
        for (let i = 0; i < (level === 6 ? 1 : level === 13 ? 1 : 2); i++) {
          kit.tapOn(g.clear);
          await kit.sleep(450);
          kit.tapOn(g.arrows.find((a) => a.dir === 'left').button);
          await kit.sleep(180);
          kit.tapOn(g.play);
          if (!(await kit.until(() => !g.running, 12000))) throw new Error('Robot return stuck');
        }
        if (level === 6 && !spoken.includes('robot.bump')) throw new Error('Collision was not explained');
      }, level);
      assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
      if (level === 6) await screenshot('robot-path');
      await page.evaluate(async () => {
        const g = neo.scene.game;
        kit.tapOn(g.clear);
        await kit.sleep(450);
        // Counted slots: tap an arrow once per step (the buttons ignore taps within 400 ms). Loops: tap the loop button.
        for (const slot of g.solution)
          for (let k = 0; k < slot.n; k++) {
            kit.tapOn(g.arrows.find((a) => a.dir === slot.dir).button);
            await kit.sleep(450);
          }
        for (let k = 1; k < (g.plan.solution?.loop ?? 1); k++) {
          kit.tapOn(g.loopButton);
          await kit.sleep(450);
        }
        kit.tapOn(g.play);
      });
      if (level === 9) {
        await page.waitForTimeout(1200);
        await screenshot('robot-path-9-running');
      }
      await finished('robot-path');
      log(
        `Robot Path level ${level}: collisions, hint, ${level > 6 ? 'counted steps and loops, step-through playback, ' : ''}and reward passed`,
      );
    }
  }

  /** Level 16, Drive the robot, on a phone held upright: a rock and the edge stop it gently, then the arrows reach the star. */
  async function drive() {
    await page.setViewportSize({ width: 390, height: 844 });
    await launch('robot-path', 16);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (!g.plan || g.arrows.length !== 4) throw new Error('Drive the robot did not start');
      if ('play' in g || 'queue' in g) throw new Error('Drive the robot has a program or play button');
      const tap = async (dir) => {
        kit.tapOn(g.arrows.find((a) => a.dir === dir).button);
        await kit.sleep(450);
        await kit.until(() => !g.moving, 3000);
      };
      // The top edge: the robot stays put.
      const before = g.robot.position.y;
      await tap('up');
      if (g.at[0] !== 0 || g.at[1] !== 0 || Math.abs(g.robot.position.y - before) > 1)
        throw new Error('The edge moved the robot');
    });
    await screenshot('robot-path-16-start');
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const tap = async (dir) => {
        kit.tapOn(g.arrows.find((a) => a.dir === dir).button);
        await kit.sleep(450);
        await kit.until(() => !g.moving, 3000);
      };
      // Walk next to the rock and push into it, then drive the shortest way home.
      const [rx, ry] = g.plan.rocks[0];
      const besides = [
        [rx - 1, ry, 'right'],
        [rx, ry - 1, 'down'],
      ].find(([x, y]) => x >= 0 && y >= 0 && !(x === g.plan.goal[0] && y === g.plan.goal[1]));
      if (besides) {
        const [bx, by, into] = besides;
        for (let k = 0; k < bx; k++) await tap('right');
        for (let k = 0; k < by; k++) await tap('down');
        const at = g.at.join();
        await tap(into);
        if (g.at.join() !== at) throw new Error('The rock let the robot through');
      }
      // The how-to finger's next arrow is the bot's shortest route.
      for (let k = 0; k < 8 && !g.done; k++) {
        const next = g.autotouch();
        if (!next) throw new Error(`No next arrow at ${g.at}`);
        kit.tapOn(next.tap.on);
        await kit.sleep(450);
        await kit.until(() => !g.moving, 3000);
      }
      if (!(await kit.until(() => g.done, 6000)))
        throw new Error(
          `The robot did not reach the star: at ${g.at} goal ${g.plan.goal} rock ${g.plan.rocks[0]} moving ${g.moving}`,
        );
    });
    await finished('robot-path');
    log(
      'Robot Path level 16: edge and rock stop gently, the arrows drive it to the star, no program or play button',
    );
  }

  return { robots };
}
