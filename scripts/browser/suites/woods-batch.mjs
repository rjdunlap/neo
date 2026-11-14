import { selectValue } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished, next }) {
  // Wonder Woods and the newest games: every level driven like a finger, with misses, hints, the saved score and the sticker.
  async function woodsBatch() {
    const only = process.env.WOODS_ONLY;
    if (only !== undefined)
      selectValue(
        only,
        [
          'light',
          'materials',
          'penguin',
          'peek',
          'code',
          'hop',
          'shop',
          'grow',
          'clock',
          'families',
          'word-end',
          'pixels',
          'bits',
          'bits12',
          'night',
          'snack',
          'beat',
          'rhyme',
          'bonds',
          'go',
          'ramp',
          'sort',
          'pair',
          'predict',
          'map',
          'opp',
          'graph',
          'worm',
          'helpers',
          'boxes',
          'twoboxes',
          'mailmap',
          'lemon',
        ],
        'WOODS_ONLY',
      );
    // R4: stretching one confirmation makes it possible to check that the next move opens during it.
    const stretchFeedback = (prefix) =>
      page.evaluate((prefix) => {
        const g = neo.scene.game;
        const say = g.ctx.say.bind(g.ctx);
        g.stretched = 'waiting';
        g.ctx.say = (line, vars) => {
          const spoken = say(line, vars);
          if (!line.startsWith(prefix) || g.stretched !== 'waiting') return spoken;
          g.stretched = 'playing';
          return Promise.all([spoken, kit.sleep(4000)]).then(() => {
            g.stretched = 'done';
          });
        };
      }, prefix);
    const feedbackStillPlaying = async (move) =>
      assert.equal(await page.evaluate(() => neo.scene.game.stretched), 'playing', move);
    const fromLevel = Number(process.env.FROM_LEVEL || 1);
    const score = (id) =>
      page.evaluate((id) => {
        const r = kit.store.stats(id).history.at(-1);
        return [r.misses, r.hints];
      }, id);
    // Ready for round n; then a beat, since things built this frame aren't hit-testable until they're drawn.
    const idle = async (n) => {
      await page.waitForFunction(
        (n) => {
          const g = neo.scene.game;
          return neo.scene.finished || (g.index === n && !g.busy);
        },
        n,
        { timeout: 20000 },
      );
      await page.waitForTimeout(120);
    };
    const counts = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);

    if (!only || only === 'light')
      for (let level = fromLevel; level <= 7; level++) {
        await launch('light-lab', level);
        const plan = await page.evaluate(() => ({
          mode: neo.scene.game.plan.mode,
          puzzles: neo.scene.game.plan.puzzles,
        }));
        for (let n = 0; n < plan.puzzles; n++) {
          await idle(n);
          if (plan.mode === 'predict' && n < 3) {
            if (n === 0) {
              await page.waitForTimeout(300);
              await screenshot('light-lab-7-predict');
            }
            await page.evaluate(async (wrong) => {
              const L = await import('/src/games/light-lab/logic.ts');
              const g = neo.scene.game;
              const choices = L.predictionChoices(g.puzzle, g.tilts);
              if (choices.length < 3 || !g.predictionMarks.has(choices[0].key))
                throw new Error('Three prediction targets are shown');
              kit.tapOn(g.predictionMarks.get(choices[wrong ? 1 : 0].key));
            }, n === 0);
            await page.waitForFunction((n) => neo.scene.finished || neo.scene.game.index > n, n, {
              timeout: 20000,
            });
            assert.deepEqual(await counts(), [0, 0], 'beam predictions are experiments, not misses or hints');
            continue;
          }
          if (plan.mode === 'plan' && n === 0) {
            // Shining before planning: two gentle misses that show where the light went, then a glowing mirror.
            for (let k = 0; k < 2; k++) {
              await tap('neo.scene.game.sun');
              await page.waitForTimeout(300);
              await idle(0);
            }
            assert.deepEqual(await counts(), [2, 1]);
            assert.ok(await page.evaluate(() => neo.scene.game.hinted >= 0), 'a mirror glows');
          }
          for (let k = 0; k < 12; k++) {
            const m = await page.evaluate(async (n) => {
              const L = await import('/src/games/light-lab/logic.ts');
              const g = neo.scene.game;
              return g.index !== n || L.solved(g.puzzle, g.tilts) ? -1 : L.hintMirror(g.puzzle, g.tilts);
            }, n);
            if (m < 0) break;
            await tap(`neo.scene.game.mirrors.get(${m})`);
          }
          if (plan.mode === 'plan' || (plan.mode === 'predict' && n >= 3)) await tap('neo.scene.game.sun');
          if (level === 5 && n === 0) {
            await page.waitForTimeout(600);
            await screenshot('light-lab-5');
          }
        }
        await finished('light-lab');
        assert.deepEqual(await score('light-lab'), plan.mode === 'plan' ? [2, 1] : [0, 0]);
        const play =
          plan.mode === 'predict'
            ? 'three unscored predictions and a final plan, '
            : plan.mode === 'plan'
              ? 'missed shines explained, hint glow, '
              : 'live beam, ';
        log(`Light Lab ${level}: mirrors turned like a finger, ${play}saved score and sticker passed`);
      }

    if (!only || only === 'materials') {
      // Light Lab 11, Through, bounce or stop? (school portrait): a guess that differs from what happens (no miss), a shine
      // caught with its shadow or dim beam, then on the first choice two wrong things (the second raises the glow) and the right one.
      await page.setViewportSize({ width: 768, height: 1024 });
      await launch('light-lab', 11, 'Mia', 'school');
      const cardFor = (n) =>
        page.evaluate((n) => {
          const g = neo.scene.game;
          const r = g.round;
          if (n >= 3) return r.choices[n - 3].answer;
          const m = r.guesses[n].material;
          return ['through', 'bounce', 'stop'].indexOf(
            m === 'shiny' ? 'bounce' : m === 'solid' ? 'stop' : 'through',
          );
        }, n);
      const shot = await page.evaluate(() =>
        neo.scene.game.round.guesses.findIndex((g) => g.material === 'solid' || g.material === 'cloudy'),
      );
      for (let n = 0; n < 5; n++) {
        await idle(n);
        const right = await cardFor(n);
        if (n === 0) await tap(`neo.scene.game.cards[${(right + 1) % 3}]`);
        else if (n === 3) {
          for (const k of [0, 1, 2].filter((k) => k !== right)) {
            await tap(`neo.scene.game.cards[${k}]`);
            await page.waitForTimeout(300);
            await idle(3);
          }
          assert.deepEqual(
            await counts(),
            [2, 1],
            'two wrong things are two misses, and the glow is one hint',
          );
          assert.equal(
            await page.evaluate(() => neo.scene.game.hintCard),
            right,
            'the thing that works glows',
          );
          await tap(`neo.scene.game.cards[${right}]`);
        } else await tap(`neo.scene.game.cards[${right}]`);
        if (n === shot) {
          await page.waitForTimeout(1500);
          await screenshot('light-lab-11-portrait');
        }
        if (n < 3) {
          await page.waitForFunction((n) => neo.scene.finished || neo.scene.game.index > n, n, {
            timeout: 20000,
          });
          assert.deepEqual(await counts(), [0, 0], 'guesses are experiments, never misses');
        }
      }
      await finished('light-lab');
      assert.deepEqual(await score('light-lab'), [2, 1]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log(
        'Light Lab 11: a mismatched guess with no miss, the shine with its shadow or dim beam, two wrong things then the glow, saved score and sticker passed',
      );
    }

    if (!only || only === 'penguin')
      for (let level = fromLevel; level <= Number(process.env.TO_LEVEL || 9); level++) {
        if (level === 11) {
          // Where will it stop? (preschool, after level 2): tap the cell where the shown slide will stop.
          await launch('penguin-slide', 11);
          await page.setViewportSize({ width: 768, height: 1024 });
          const guess = async (right) => {
            const before = await page.evaluate(() => [neo.scene.game.index, neo.scene.game.step]);
            await page.evaluate((right) => {
              const g = neo.scene.game;
              const s = g.shown[g.step];
              // A wrong guess: the cell beside the penguin on the other side, or any other free cell.
              const cells = [];
              for (let x = 0; x < g.puzzle.cols; x++)
                for (let y = 0; y < g.puzzle.rows; y++) cells.push({ x, y });
              const c = right
                ? s.to
                : cells.find(
                    (c) => !(c.x === s.to.x && c.y === s.to.y) && !(c.x === g.at.x && c.y === g.at.y),
                  );
              const at = g.board.toGlobal({ x: (c.x + 0.5) * 100, y: (c.y + 0.5) * 100 });
              kit.tap(at.x, at.y);
            }, right);
            await page.waitForFunction(
              (b) => {
                const g = neo.scene.game;
                return neo.scene.finished || (!g.busy && (g.index !== b[0] || g.step !== b[1]));
              },
              before,
              { timeout: 20000 },
            );
          };
          await idle(0);
          assert.equal(
            await page.evaluate(() => neo.scene.game.undo.visible),
            false,
            'no undo on prediction ponds',
          );
          await screenshot('penguin-slide-11-portrait');
          await guess(false);
          assert.deepEqual(await counts(), [0, 0], 'a wrong prediction is never a miss');
          assert.equal(await page.evaluate(() => neo.scene.game.step), 1, 'the slide still went');
          await stretchFeedback('slide.predict.right');
          await guess(true);
          await feedbackStillPlaying('the next penguin prediction opens during the right line');
          await guess(true);
          await idle(1);
          for (let k = 0; k < 3; k++) await guess(true);
          await finished('penguin-slide');
          assert.deepEqual(await score('penguin-slide'), [0, 0]);
          await page.setViewportSize({ width: 1024, height: 768 });
          log(
            'Penguin Slide 11: a wrong prediction (no miss) then right ones, both ponds, saved score and sticker passed',
          );
          continue;
        }
        if (level === 12) {
          // A block onto the star (school): get the block stuck where it can never reach the star, undo, then solve both ponds.
          await launch('penguin-slide', 12);
          await page.setViewportSize({ width: 768, height: 1024 });
          const step = async (dir) => {
            await page.evaluate((dir) => {
              const g = neo.scene.game;
              const p = g.penguin;
              const at = g.board.toGlobal({
                x: p.x + [1, 0, -1, 0][dir] * 90,
                y: p.y + [0, 1, 0, -1][dir] * 90,
              });
              kit.tap(at.x, at.y);
            }, dir);
            await page.waitForTimeout(120);
            await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
              timeout: 15000,
            });
          };
          let stuckSeen = false;
          for (let n = 0; n < 2; n++) {
            await idle(n);
            if (!stuckSeen) {
              // The shortest run of moves from here to a state the star can no longer be reached from.
              const path = await page.evaluate(async () => {
                const S = await import('/src/games/penguin-slide/logic.ts');
                const g = neo.scene.game;
                const k = (s) => `${s.at.x},${s.at.y};${s.blocks.map((b) => `${b.x},${b.y}`).join(';')}`;
                const queue = [{ at: g.at, blocks: g.blocks, path: [] }];
                const seen = new Set([k(queue[0])]);
                while (queue.length) {
                  const s = queue.shift();
                  if (S.solve(g.puzzle, s.at, 0, s.blocks).moves === -1) return s.path;
                  for (const d of [0, 1, 2, 3]) {
                    const m = S.move(g.puzzle, s.at, d, s.blocks);
                    if (!m || S.solved(g.puzzle, 0, m.blocks)) continue;
                    const t = { at: m.to, blocks: m.blocks, path: [...s.path, d] };
                    if (!seen.has(k(t))) {
                      seen.add(k(t));
                      queue.push(t);
                    }
                  }
                }
                return null;
              });
              if (path) {
                for (const d of path) await step(d);
                await page.waitForTimeout(200);
                assert.equal(
                  await page.evaluate(() => neo.scene.game.stuck),
                  true,
                  'a stuck block makes undo glow',
                );
                await screenshot('penguin-slide-12-portrait');
                await tap('neo.scene.game.undo');
                await page.waitForTimeout(400);
                assert.equal(await page.evaluate(() => neo.scene.game.stuck), false, 'undo frees the block');
                stuckSeen = true;
              }
            }
            for (let k = 0; k < 30; k++) {
              const dir = await page.evaluate(async (n) => {
                const g = neo.scene.game;
                if (neo.scene.finished || g.index !== n) return -2;
                const S = await import('/src/games/penguin-slide/logic.ts');
                return S.solve(g.puzzle, g.at, g.have, g.blocks).first;
              }, n);
              if (dir === -2) break;
              if (dir === -1) {
                await tap('neo.scene.game.undo');
                await page.waitForTimeout(300);
                continue;
              }
              await step(dir);
            }
          }
          assert.ok(stuckSeen, 'one of the two ponds had a way to get the block stuck');
          await finished('penguin-slide');
          assert.equal((await score('penguin-slide'))[0], 0, 'no misses on the star ponds');
          await page.setViewportSize({ width: 1024, height: 768 });
          log(
            'Penguin Slide 12: a stuck block, undo, the block onto the star in both ponds, saved score and sticker passed',
          );
          continue;
        }
        if (level === 13) {
          // Two penguins (school): wasted slides bring the arrow (one hint), then follow it, choosing a penguin by tapping it.
          await launch('penguin-slide', 13);
          await page.setViewportSize({ width: 768, height: 1024 });
          const step = async (dir) => {
            await page.evaluate((dir) => {
              const g = neo.scene.game;
              const p = g.penguin;
              const at = g.board.toGlobal({
                x: p.x + [1, 0, -1, 0][dir] * 90,
                y: p.y + [0, 1, 0, -1][dir] * 90,
              });
              kit.tap(at.x, at.y);
            }, dir);
            await page.waitForTimeout(120);
            await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
              timeout: 15000,
            });
          };
          let switches = 0;
          for (let n = 0; n < 2; n++) {
            await idle(n);
            if (n === 0) {
              // Slides that neither eat the fish nor strand the penguins, until the yellow arrow comes.
              for (let k = 0; k < 20 && !(await page.evaluate(() => neo.scene.game.hinting)); k++) {
                const dir = await page.evaluate(async () => {
                  const S = await import('/src/games/penguin-slide/logic.ts');
                  const g = neo.scene.game;
                  return (
                    [0, 1, 2, 3].find((d) => {
                      const m = S.movePair(g.puzzle, g.spots, g.who, d);
                      return m && !S.eaten(g.puzzle, m.passed) && S.solvePair(g.puzzle, m.spots, 0).moves > 0;
                    }) ?? -1
                  );
                });
                assert.ok(dir >= 0, 'the chosen penguin has a harmless slide');
                await step(dir);
              }
              assert.deepEqual(
                await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]),
                [0, 1],
                'wasted slides are no miss; the arrow counts as one hint',
              );
            }
            for (let k = 0; k < 30; k++) {
              const next = await page.evaluate(async (n) => {
                const g = neo.scene.game;
                if (neo.scene.finished || g.index !== n) return null;
                const S = await import('/src/games/penguin-slide/logic.ts');
                return S.solvePair(g.puzzle, g.spots, g.have).first;
              }, n);
              if (!next) break;
              const who = await page.evaluate(() => neo.scene.game.who);
              if (next.who !== who) {
                const moves = await page.evaluate(() => neo.scene.game.moves);
                await tap(`neo.scene.game.penguins[${next.who}]`);
                await page.waitForTimeout(250);
                assert.equal(
                  await page.evaluate(() => neo.scene.game.who),
                  next.who,
                  'tapping the other penguin chooses it',
                );
                assert.equal(
                  await page.evaluate(() => neo.scene.game.moves),
                  moves,
                  'choosing is not a slide',
                );
                if (!switches++) await screenshot('penguin-slide-13-portrait');
                continue;
              }
              await step(next.dir);
            }
          }
          assert.ok(switches > 0, 'a route needed a change of penguin');
          await finished('penguin-slide');
          assert.deepEqual(await score('penguin-slide'), [0, 1], 'no misses; the arrow was the one hint');
          await page.setViewportSize({ width: 1024, height: 768 });
          log(
            'Penguin Slide 13: wasted slides, the arrow (one hint), tapping a penguin to choose it, both ponds, saved score and sticker passed',
          );
          continue;
        }
        await launch('penguin-slide', level);
        if (level === 3 || level >= 6) await page.setViewportSize({ width: 768, height: 1024 });
        const puzzles = await page.evaluate(() => neo.scene.game.plan.puzzles);
        // Tap the ice a little way from the penguin, in the direction to slide.
        const slideTo = async (dir) => {
          await page.evaluate((dir) => {
            const g = neo.scene.game;
            const p = g.penguin;
            const at = g.board.toGlobal({
              x: p.x + [1, 0, -1, 0][dir] * 90,
              y: p.y + [0, 1, 0, -1][dir] * 90,
            });
            kit.tap(at.x, at.y);
          }, dir);
          await page.waitForTimeout(120);
          await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
            timeout: 15000,
          });
        };
        for (let n = 0; n < puzzles; n++) {
          await idle(n);
          if (n === 0) {
            // Wander without finishing until the hint arrow appears, then undo a slide.
            for (let k = 0; k < 14 && !(await page.evaluate(() => neo.scene.game.hinting)); k++) {
              const dir = await page.evaluate(async () => {
                const S = await import('/src/games/penguin-slide/logic.ts');
                const g = neo.scene.game;
                const all = (1 << g.puzzle.fish.length) - 1;
                for (const d of [0, 1, 2, 3]) {
                  const m = S.move(g.puzzle, g.at, d, g.blocks);
                  if (m && (g.have | S.eaten(g.puzzle, m.passed)) !== all) return d;
                }
                return -1;
              });
              if (dir < 0) break;
              await slideTo(dir);
            }
            assert.deepEqual(await counts(), [0, 1], 'extra slides bring one hint, never a miss');
            const before = await page.evaluate(() => neo.scene.game.history.length);
            await tap('neo.scene.game.undo');
            await page.waitForTimeout(300);
            assert.equal(
              await page.evaluate(() => neo.scene.game.history.length),
              before - 1,
              'undo steps back',
            );
            if (level === 3 || level >= 6) await screenshot(`penguin-slide-${level}-portrait`);
          }
          for (let k = 0; k < 30; k++) {
            const dir = await page.evaluate(async (n) => {
              const g = neo.scene.game;
              if (neo.scene.finished || g.index !== n) return -2;
              const S = await import('/src/games/penguin-slide/logic.ts');
              return S.solve(g.puzzle, g.at, g.have, g.blocks).first;
            }, n);
            if (dir === -2) break;
            if (dir === -1) {
              await tap('neo.scene.game.undo');
              await page.waitForTimeout(300);
              continue;
            }
            await slideTo(dir);
          }
        }
        await finished('penguin-slide');
        assert.deepEqual(await score('penguin-slide'), [0, 1]);
        await page.setViewportSize({ width: 1024, height: 768 });
        log(
          `Penguin Slide ${level}: taps on the ice, bumps, ${level >= 6 ? 'pushed blocks, ' : ''}undo, hint arrow, saved score and sticker passed`,
        );
      }

    if (!only || only === 'peek')
      for (let level = fromLevel; level <= Math.min(5, Number(process.env.TO_LEVEL || 5)); level++) {
        // Level 5 plays in portrait, where the four-picture card is tightest.
        if (level === 5) await page.setViewportSize({ width: 768, height: 1024 });
        await launch('peekaround-island', level);
        const mode = await page.evaluate(() => neo.scene.game.plan.mode);
        const behind = () =>
          page.evaluate(async () => {
            const L = await import('/src/games/peekaround-island/logic.ts');
            const g = neo.scene.game;
            const f = g.friends.find((x) => x.name === g.hider);
            return L.whereIs(f.spot, g.turns) === 'behind';
          });
        if (mode === 'find' || mode === 'named' || mode === 'who') {
          for (let n = 0; n < 3; n++) {
            await idle(n);
            if (n === 0 && mode === 'named')
              for (let k = 0; k < 2; k++) {
                await tap('neo.scene.game.friends.find((f) => f.name !== neo.scene.game.hider).node');
                await page.waitForTimeout(350);
              }
            if (n === 0 && mode === 'who')
              for (let k = 0; k < 2; k++) {
                await tap('neo.scene.game.tiles.find((t) => t.name !== neo.scene.game.hider).node');
                await page.waitForTimeout(450);
              }
            if (n === 0 && mode !== 'find') assert.deepEqual(await counts(), [2, 1]);
            if (mode === 'who') {
              await tap('neo.scene.game.tiles.find((t) => t.name === neo.scene.game.hider).node');
              continue;
            }
            const ringAt = () =>
              page.evaluate(() => {
                const g = neo.scene.game;
                const b = g.glow.getLocalBounds();
                return b.width > 0 ? b.x + b.width / 2 : null;
              });
            if (n === 0 && mode === 'named')
              assert.equal(
                Math.round(await ringAt()),
                Math.round(await page.evaluate(() => neo.scene.game.right.x - 400)),
                'the hint rings the arrows while the friend is hidden',
              );
            for (let k = 0; k < 4 && (await behind()); k++) {
              await tap('neo.scene.game.right');
              await page.waitForTimeout(250);
              await idle(n);
            }
            await page.waitForTimeout(100);
            // In view now: the ring moves from the arrows to the friend asked for.
            if (n === 0 && mode === 'named')
              assert.ok(
                Math.abs(
                  (await ringAt()) -
                    (await page.evaluate(
                      () => neo.scene.game.friends.find((f) => f.name === neo.scene.game.hider).node.x,
                    )),
                ) < 20,
                'the hint rings the friend once in view',
              );
            if (n === 0) await stretchFeedback('around.found');
            await tap('neo.scene.game.friends.find((f) => f.name === neo.scene.game.hider).node');
            if (n === 0) {
              await idle(1);
              await feedbackStillPlaying('the next Peekaround scene opens during the right line');
            }
          }
        } else {
          // Drag each waiting friend to a spot that fits its direction (the first, twice to a wrong spot).
          const dropAt = async (name, fitting) => {
            const target = await page.evaluate(
              async ({ name, fitting }) => {
                const L = await import('/src/games/peekaround-island/logic.ts');
                const g = neo.scene.game;
                const f = g.friends.find((x) => x.name === name);
                const s = [0, 1, 2, 3]
                  .filter((s) => !g.friends.some((x) => x.spot === s))
                  .find((s) => L.fits(f.want, s, g.turns) === fitting);
                const p = g.ctx.stage.toGlobal(g.at(s));
                return { x: p.x, y: p.y + 40 };
              },
              { name, fitting },
            );
            await page.evaluate(
              async ({ name, target }) => {
                const f = neo.scene.game.friends.find((x) => x.name === name);
                await kit.dragTo(f.node, target, 14);
              },
              { name, target },
            );
            await page.waitForTimeout(700);
          };
          let first = true;
          for (let k = 0; k < 6; k++) {
            await page.waitForFunction(
              () =>
                neo.scene.finished || (!neo.scene.game.busy && neo.scene.game.friends.some((f) => f.want)),
              null,
              { timeout: 20000 },
            );
            if (await page.evaluate(() => neo.scene.finished)) break;
            const names = await page.evaluate(() =>
              neo.scene.game.friends.filter((f) => f.want).map((f) => f.name),
            );
            for (const name of names) {
              if (first) {
                await dropAt(name, false);
                await dropAt(name, false);
                assert.deepEqual(await counts(), [2, 1]);
                first = false;
              }
              await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
              if (level === 5 && k === 0 && name === names.at(-1)) await stretchFeedback('around.placed');
              await dropAt(name, true);
            }
            if (level === 5) {
              // Before the half turn she guesses who will be in front: first a wrong picture (counted as nothing), then the right one.
              await page.waitForFunction(
                () => neo.scene.game.tiles.length > 0 && !neo.scene.game.busy,
                null,
                { timeout: 20000 },
              );
              if (k === 0) await feedbackStillPlaying('the guess cards open during the placement line');
              await screenshot(`peekaround-5-guess-${k + 1}-portrait`);
              // The card's pictures never overlap and stay clear of the corner buttons.
              const xs = await page.evaluate(() =>
                neo.scene.game.tiles.map((t) => t.node.x).sort((a, b) => a - b),
              );
              for (let i = 1; i < xs.length; i++)
                assert.ok(xs[i] - xs[i - 1] >= 128, `picture card tiles overlap: ${xs}`);
              assert.ok(xs[0] - 64 > 110, `picture card reaches the corner buttons: ${xs}`);
              const before = await counts();
              const right = await page.evaluate(async () => {
                const L = await import('/src/games/peekaround-island/logic.ts');
                return L.frontAfterHalfTurn(neo.scene.game.friends, neo.scene.game.turns).name;
              });
              await tap(
                `neo.scene.game.tiles.find((t) => t.name ${k === 0 ? '!==' : '==='} ${JSON.stringify(right)}).node`,
              );
              await page.waitForTimeout(450);
              assert.deepEqual(await counts(), before, 'a prediction is never a miss');
              await page.waitForFunction(
                (r) =>
                  neo.scene.finished ||
                  neo.scene.game.friends.find(
                    (f) =>
                      f.name === r && f.spot >= 0 && (((f.spot + neo.scene.game.turns) % 4) + 4) % 4 === 0,
                  ),
                right,
                { timeout: 20000 },
              );
            }
          }
        }
        await finished('peekaround-island');
        assert.deepEqual(await score('peekaround-island'), mode === 'find' ? [0, 0] : [2, 1]);
        if (level === 5) await page.setViewportSize({ width: 1024, height: 768 });
        log(
          `Peekaround Island ${level} (${mode}): turning, hiding, picture card, placing by direction, misses, hints, saved score and sticker passed`,
        );
      }

    if (!only || only === 'code')
      for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12].filter(
        (l) => l >= fromLevel && l <= Number(process.env.TO_LEVEL || 12),
      )) {
        await launch('secret-code', level);
        if (level === 12) {
          // Swap seats, Two of us, in portrait: she makes a code under a lid and marks seat 2's tries (one wrong mark), then breaks seat 2's code (one ignored clue).
          await page.setViewportSize({ width: 768, height: 1024 });
          const at = (phase) =>
            page
              .waitForFunction(
                (phase) => neo.scene.finished || (neo.scene.game.phase === phase && !neo.scene.game.busy),
                phase,
                { timeout: 20000 },
              )
              .then(() => page.waitForTimeout(150));
          const right = () =>
            page.evaluate(async () => {
              const g = neo.scene.game;
              const C = await import('/src/games/secret-code/logic.ts');
              return C.score(g.code, g.petStones, true);
            });
          const markAs = async (want) => {
            for (let i = 0; i < want.length; i++)
              for (let k = 0; k < 4; k++) {
                if ((await page.evaluate((i) => neo.scene.game.marks[i], i)) === want[i]) break;
                await tap(`neo.scene.game.discs[${i}]`);
              }
          };
          const enter = async (stones) => {
            const filled = await page.evaluate(() => neo.scene.game.guess.map((g) => g !== null));
            for (let i = 0; i < filled.length; i++) if (filled[i]) await tap(`neo.scene.game.slots[${i}]`);
            for (const c of stones) await tap(`neo.scene.game.tray[${c}]`);
            await tap('neo.scene.game.key');
            await page.waitForTimeout(300);
            await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
              timeout: 20000,
            });
            await page.waitForTimeout(150);
          };
          const markRight = async () => {
            await markAs(await right());
            await tap('neo.scene.game.show');
            await page.waitForTimeout(300);
            await page.waitForFunction(
              () => neo.scene.finished || (!neo.scene.game.busy && neo.scene.game.phase !== 'mark'),
              null,
              { timeout: 20000 },
            );
            await page.waitForTimeout(150);
          };
          await at('seats');
          await screenshot('secret-code-12-seats-portrait');
          await tap('neo.scene.game.together');
          await at('make');
          for (const c of [1, 1, 3]) await tap(`neo.scene.game.tray[${c}]`);
          await tap('neo.scene.game.ready');
          await at('break');
          assert.deepEqual(
            await page.evaluate(() => neo.scene.game.code),
            [1, 1, 3],
            'her code is the one she made',
          );
          assert.ok(
            await page.evaluate(
              () => neo.scene.game.lid.visible && neo.scene.game.slots.every((s) => s.children.length === 1),
            ),
            'the lid hides her code and the door is empty',
          );
          await screenshot('secret-code-12-lid-portrait');
          // Seat 2's first try; she gives one wrong mark (a miss), then the right ones.
          await enter([0, 0, 0]);
          await at('mark');
          const r = await right();
          await markAs([r[0] === 'green' ? 'gray' : 'green', ...r.slice(1)]);
          await tap('neo.scene.game.show');
          await page.waitForTimeout(300);
          await at('mark');
          assert.deepEqual(await counts(), [1, 0], 'a wrong mark is her miss');
          await markRight();
          // Seat 2 ignores a clue (red again in slot 1): seat 2's tries never count.
          await enter([0, 1, 2]);
          await at('mark');
          assert.deepEqual(await counts(), [1, 0], 'seat 2 ignoring a clue is not a miss');
          await markRight();
          for (let k = 0; k < 10 && (await page.evaluate(() => neo.scene.game.half === 1)); k++) {
            const idea = await page.evaluate(async () => {
              const g = neo.scene.game;
              const C = await import('/src/games/secret-code/logic.ts');
              return C.suggestion(g.plan, g.history, g.code);
            });
            await enter(idea);
            await at('mark');
            await markRight();
          }
          // Swap: seat 2 makes a code; she breaks it with the island's marks, ignoring one clue.
          await at('make2');
          for (const c of [2, 0, 2]) await tap(`neo.scene.game.tray[${c}]`);
          await tap('neo.scene.game.ready');
          await page.waitForFunction(
            () => neo.scene.game.half === 2 && neo.scene.game.phase === null && !neo.scene.game.busy,
            null,
            { timeout: 20000 },
          );
          await page.waitForTimeout(150);
          assert.ok(
            await page.evaluate(() => neo.scene.game.lid.visible && neo.scene.game.key.visible),
            'the lid hides the grown-up code',
          );
          await enter([3, 3, 3]);
          await enter([3, 1, 1]);
          assert.deepEqual(await counts(), [2, 0], 'an ignored clue in her half is a miss');
          for (let k = 0; k < 12; k++) {
            const idea = await page.evaluate(async () => {
              const g = neo.scene.game;
              if (neo.scene.finished || g.index !== 0) return null;
              const C = await import('/src/games/secret-code/logic.ts');
              return C.suggestion(g.plan, g.history, g.code);
            });
            if (!idea) break;
            await enter(idea);
          }
          await finished('secret-code');
          const saved = await score('secret-code');
          assert.ok(saved[0] >= 2 && saved[1] >= 1, `a two-seat round is supported completion: ${saved}`);
          await page.setViewportSize({ width: 1024, height: 768 });
          log(
            `Secret Code 12: seat question, her code under the lid, a wrong mark (miss), seat 2's ignored clue (not a miss), swap, an ignored clue (miss), saved ${saved} and sticker passed`,
          );
          continue;
        }
        if (level === 9) {
          // Be the door, in portrait: she makes a code with a repeat (an unfilled check is only a reminder), then marks the pet's tries.
          await page.setViewportSize({ width: 768, height: 1024 });
          const ready = () =>
            page
              .waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 20000 })
              .then(() => page.waitForTimeout(150));
          const right = () =>
            page.evaluate(async () => {
              const g = neo.scene.game;
              const C = await import('/src/games/secret-code/logic.ts');
              return C.score(g.code, g.petStones, true);
            });
          const markAs = async (want) => {
            for (let i = 0; i < want.length; i++)
              for (let k = 0; k < 4; k++) {
                if ((await page.evaluate((i) => neo.scene.game.marks[i], i)) === want[i]) break;
                await tap(`neo.scene.game.discs[${i}]`);
              }
          };
          for (let n = 0; n < 2; n++) {
            await idle(n);
            const made = n === 0 ? [0, 0, 2] : [3, 1, 2];
            await tap(`neo.scene.game.tray[${made[0]}]`);
            if (n === 0) {
              await tap('neo.scene.game.ready');
              await page.waitForTimeout(200);
              assert.equal(await page.evaluate(() => neo.scene.game.phase), 'make', 'a part-made code waits');
            }
            for (const c of made.slice(1)) await tap(`neo.scene.game.tray[${c}]`);
            await tap('neo.scene.game.ready');
            await page.waitForFunction(() => neo.scene.game.phase === 'mark' && !neo.scene.game.busy, null, {
              timeout: 20000,
            });
            await page.waitForTimeout(150);
            assert.deepEqual(
              await page.evaluate(() => neo.scene.game.code),
              made,
              'her code is the one she made',
            );
            if (n === 0) {
              const r = await right();
              const wrong = [r[0] === 'green' ? 'gray' : 'green', ...r.slice(1)];
              await markAs(wrong);
              for (let k = 0; k < 2; k++) {
                await tap('neo.scene.game.show');
                await page.waitForTimeout(300);
                await ready();
              }
              assert.deepEqual(await counts(), [2, 1], 'two wrong marks: two misses, one glow');
              await screenshot('secret-code-9-portrait');
            }
            for (let k = 0; k < 10; k++) {
              if (await page.evaluate((n) => neo.scene.finished || neo.scene.game.index !== n, n)) break;
              await markAs(await right());
              await tap('neo.scene.game.show');
              await page.waitForTimeout(300);
              await ready();
              await page.waitForFunction(
                (n) =>
                  neo.scene.finished ||
                  neo.scene.game.index !== n ||
                  (neo.scene.game.phase === 'mark' && !neo.scene.game.busy),
                n,
                { timeout: 20000 },
              );
              await page.waitForTimeout(150);
            }
          }
          await finished('secret-code');
          assert.deepEqual(await score('secret-code'), [2, 1]);
          await page.setViewportSize({ width: 1024, height: 768 });
          log(
            'Secret Code 9: made codes, an unfilled check, two wrong marks (misses) and the glow, right marks until the pet cracked both, saved score and sticker passed',
          );
          continue;
        }
        if (level === 4 || level === 7 || level === 11)
          await page.setViewportSize({ width: 768, height: 1024 });
        const codes = await page.evaluate(() => neo.scene.game.plan.codes);
        // Empty the slots like a finger, tap the stones in order, then the key.
        const enter = async (stones) => {
          const filled = await page.evaluate(() => neo.scene.game.guess.map((g) => g !== null));
          for (let i = 0; i < filled.length; i++) if (filled[i]) await tap(`neo.scene.game.slots[${i}]`);
          for (const c of stones) await tap(`neo.scene.game.tray[${c}]`);
          await tap('neo.scene.game.key');
          await page.waitForTimeout(300);
          await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
            timeout: 20000,
          });
        };
        for (let n = 0; n < codes; n++) {
          await idle(n);
          if (n === 0) {
            // Detective doors already have evidence: both wrong tries contradict it. Other doors teach on the first try.
            const wrong = await page.evaluate(() => {
              const g = neo.scene.game;
              return Array(g.plan.slots).fill((g.code[0] + 1) % g.plan.colors);
            });
            if (level === 11) {
              // The bigger detective door: three clues, every one drawn at full strength.
              const rows = await page.evaluate(() =>
                neo.scene.game.past.children.map((r) => [r.visible, r.alpha]),
              );
              assert.equal(rows.length, 3, `clue rows: ${rows.length}`);
              assert.ok(
                rows.every(([v, a]) => v && a === 1),
                JSON.stringify(rows),
              );
            }
            for (let k = 0; k < (level === 7 || level === 11 ? 2 : 3); k++) await enter(wrong);
            assert.deepEqual(await counts(), [2, 1]);
            if (level === 4 || level === 7 || level === 11) await screenshot(`secret-code-${level}-portrait`);
          }
          for (let k = 0; k < 12; k++) {
            const idea = await page.evaluate(async (n) => {
              const g = neo.scene.game;
              if (neo.scene.finished || g.index !== n) return null;
              const C = await import('/src/games/secret-code/logic.ts');
              return C.suggestion(g.plan, g.history, g.code);
            }, n);
            if (!idea) break;
            await enter(idea);
          }
        }
        await finished('secret-code');
        assert.deepEqual(await score('secret-code'), [2, 1]);
        await page.setViewportSize({ width: 1024, height: 768 });
        log(
          `Secret Code ${level}: stones placed and cleared, marks, ignored clues as misses, suggestion hint, doors opened, saved score and sticker passed`,
        );
      }

    if (!only || only === 'hop')
      for (const level of process.env.HOP_LEVELS?.split(',').map(Number) ||
        Array.from({ length: Math.max(0, 11 - fromLevel) }, (_, i) => fromLevel + i)) {
        await launch('frog-hop', level);
        await page.waitForFunction(() => neo.scene.game.index === 0 && !neo.scene.game.busy);
        await page.waitForTimeout(100); // Hit testing uses the last rendered transforms.
        // U7 R4: a right answer's line starts and the next question opens before it ends (its ask waits behind it).
        await page.evaluate(() => {
          const g = neo.scene.game,
            say = g.ctx.say.bind(g.ctx);
          window.hopR4 = [];
          g.ctx.say = (id, vars) => {
            const line = say(id, vars);
            if (['hop.yay', 'hop.frac.also', 'hop.frac.same'].includes(String(id))) {
              const at = g.index,
                t = performance.now(),
                o = { id, last: at + 1 >= g.questions.length };
              hopR4.push(o);
              void line.then(() => (o.ends = performance.now() - t));
              void kit
                .until(() => g.finished || (g.index > at && !g.busy), 8000)
                .then(() => {
                  o.opens = performance.now() - t;
                  // The second right answer: a tap on the guide while the ask waits says this question's ask.
                  if (hopR4.length !== 2 || o.last || g.finished) return;
                  const waiting = !!g.unasked;
                  kit.tapOn(neo.scene.pet);
                  o.pet = { waiting, said: !g.unasked, index: g.index };
                });
            }
            return line;
          };
        });
        const mode = await page.evaluate(() => neo.scene.game.plan.mode);
        if (mode === 'gap' || mode === 'make-ten' || mode === 'back-ten') {
          await page.evaluate(async () => {
            const g = neo.scene.game;
            for (let i = 0; i < 2; i++) {
              kit.tapOn(g.pads[0]);
              await kit.sleep(350);
            }
          });
          assert.deepEqual(await counts(), [0, 0], 'pad nudges are free');
          assert.equal(await page.evaluate(() => neo.scene.game.inertTaps), 2);
        }
        if (mode === 'make-ten')
          assert.equal(
            await page.evaluate(() => {
              const g = neo.scene.game;
              return g.signText.text === `${g.q.start} + ${g.q.hops}`;
            }),
            true,
            'the whole sum appears before the split',
          );
        // Answer by tapping a lily pad, a number card on the gap level, or both for make-ten.
        const answer = async (right) => {
          await page.evaluate((right) => {
            const g = neo.scene.game;
            const q = g.questions[g.index];
            if (g.plan.mode === 'gap') {
              const n = Math.abs(q.hops);
              kit.tapOn(g.cards.find((c) => (right ? c.n === n : c.n !== n)).node);
              return;
            }
            if (g.plan.mode === 'frac-match' && g.matchStage === 'count') {
              kit.tapOn(g.cards.find((c) => (right ? c.n === q.answer2 : c.n !== q.answer2)).node);
              return;
            }
            if ((g.plan.mode === 'make-ten' || g.plan.mode === 'back-ten') && g.makeTenStage === 'bridge') {
              const n = q.toTen;
              kit.tapOn(g.cards.find((c) => (right ? c.n === n : c.n !== n)).node);
              return;
            }
            const pad = g.pads.find((p) => (right ? p.n === q.target : p.n !== q.target && p.n !== q.start));
            kit.tapOn(pad);
          }, right);
          await page.waitForTimeout(250);
          await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
            timeout: 30000,
          });
          if (right && (mode === 'make-ten' || mode === 'back-ten')) {
            if (await page.evaluate(() => neo.scene.game.index === 0)) {
              assert.equal(
                await page.evaluate(() => {
                  const g = neo.scene.game;
                  const o = g.plan.mode === 'back-ten' ? '−' : '+';
                  return g.signText.text === `${g.q.start} ${o} ${g.q.toTen} ${o} ${g.q.remaining}`;
                }),
                true,
              );
              await answer(false);
              await answer(false);
              assert.deepEqual(await counts(), [4, 1], 'help in both stages charges one hint');
              await page.setViewportSize({ width: 768, height: 1024 });
              await page.waitForTimeout(250);
              await screenshot('frog-hop-7-portrait');
              await page.setViewportSize({ width: 1024, height: 768 });
              await page.waitForTimeout(250);
            }
            await page.evaluate(() => {
              const g = neo.scene.game;
              const q = g.questions[g.index];
              kit.tapOn(g.pads.find((p) => p.n === q.target));
            });
            await page.waitForTimeout(250);
            await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
              timeout: 30000,
            });
          }
        };
        for (let n = 0; n < 5; n++) {
          await idle(n);
          if (n === 0 && mode === 'frac-match') {
            // One wrong pad, the right pad plants the flag, then two wrong cards bring the counted hops and the glow.
            await answer(false);
            await answer(true);
            assert.equal(await page.evaluate(() => neo.scene.game.matchStage), 'count');
            assert.equal(await page.evaluate(() => neo.scene.game.signText.text), '? hops of ¼');
            await answer(false);
            await answer(false);
            assert.deepEqual(await counts(), [3, 1], 'help across both stages charges one hint');
            await screenshot(`frog-hop-${level}`);
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.waitForTimeout(250);
            await screenshot(`frog-hop-${level}-portrait`);
            await page.setViewportSize({ width: 1024, height: 768 });
            await page.waitForTimeout(250);
          } else if (n === 0) {
            await answer(false);
            await answer(false);
            assert.deepEqual(await counts(), [2, 1]);
            if (level >= 5) await screenshot(`frog-hop-${level}`);
          }
          if (mode === 'frac-match' && n > 0) await answer(true);
          await answer(true);
        }
        await finished('frog-hop');
        const hopOpens = (await page.evaluate(() => hopR4)).filter((o) => !o.last);
        assert.ok(hopOpens.length >= 3, `R4: ${hopOpens.length} right answers timed`);
        assert.ok(
          hopOpens.every((o) => o.opens < o.ends),
          `R4: the next question waited for the right answer's line (${hopOpens.map((o) => `${Math.round(o.opens)}/${Math.round(o.ends)}`).join(', ')} ms)`,
        );
        const pet = (await page.evaluate(() => hopR4)).find((o) => o.pet)?.pet;
        assert.ok(pet?.waiting && pet.said, `R4: a guide tap says the waiting ask (${JSON.stringify(pet)})`);
        log(
          `Frog Hop ${level}: R4, next question open ${hopOpens.map((o) => Math.round(o.opens)).join(', ')} ms after ${hopOpens[0].id} started`,
        );
        await finished('frog-hop');
        assert.deepEqual(await score('frog-hop'), [
          mode === 'make-ten' || mode === 'back-ten' ? 4 : mode === 'frac-match' ? 3 : 2,
          1,
        ]);
        log(
          `Frog Hop ${level} (${mode}): pads and cards tapped, wrong answers, counted demonstration and glow, saved score and sticker passed`,
        );
      }

    if (!only || only === 'shop')
      for (
        let level = fromLevel;
        level <=
        (await page.evaluate(async () => (await import('/src/games/market-stall/logic.ts')).PLANS.length));
        level++
      ) {
        await launch('market-stall', level);
        const plan = await page.evaluate(() => ({
          mode: neo.scene.game.plan.mode,
          orders: neo.scene.game.orders.length,
        }));
        const ring = async () => {
          await tap('neo.scene.game.bell');
          await page.waitForTimeout(300);
          await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
            timeout: 20000,
          });
        };
        // Put coins down by tapping the purse, take them back by tapping them on the mat.
        const putDown = async (coins) => {
          while (await page.evaluate(() => neo.scene.game.onMat.length))
            await tap('neo.scene.game.onMat[0].node');
          for (const v of coins) await tap(`neo.scene.game.purse.find((p) => p.value === ${v}).node`);
        };
        const wanted = () =>
          page.evaluate(async () => {
            const S = await import('/src/games/market-stall/logic.ts');
            const g = neo.scene.game;
            return S.target(g.plan, g.order);
          });
        for (let n = 0; n < plan.orders; n++) {
          await idle(n);
          const want = await wanted();
          const first = await page.evaluate(async (want) => {
            const S = await import('/src/games/market-stall/logic.ts');
            return S.fewest(want, neo.scene.game.plan.coins);
          }, want);
          if (n === 0) {
            if (plan.mode === 'fewest') {
              await putDown(Array(want).fill(1));
              await ring();
              assert.deepEqual(await counts(), [0, 0]);
              await ring();
              assert.deepEqual(await counts(), [1, 0]);
              await ring();
              assert.deepEqual(await counts(), [2, 1]);
              await putDown(first);
              await ring();
              if (level === 7) await screenshot('market-stall-7');
            } else {
              await putDown(Array(want + 1).fill(1));
              await ring();
              await ring();
              assert.deepEqual(await counts(), [2, 1]);
              if (level === 6) await screenshot('market-stall-6');
            }
          }
          // The first fewest-mode order was already paid after its supported retry.
          if (!(plan.mode === 'fewest' && n === 0)) (await putDown(first), await ring());
          if (plan.mode === 'ways') {
            const second = await page.evaluate(
              async ({ want, first }) => {
                const S = await import('/src/games/market-stall/logic.ts');
                return S.anotherWay(want, neo.scene.game.plan.coins, first);
              },
              { want, first },
            );
            if (n === 0) {
              await putDown(first);
              await ring();
              await ring();
              assert.deepEqual(await counts(), [4, 1], 'second-way help stays within the order');
              assert.ok(await page.evaluate(() => neo.scene.game.ghost.children.length > 0));
            }
            await putDown(second);
            await ring();
          }
        }
        await finished('market-stall');
        assert.deepEqual(await score('market-stall'), [plan.mode === 'ways' ? 4 : 2, 1]);
        log(
          `Market Stall ${level} (${plan.mode}): coins tapped down and back, too much, hint coins, ${plan.mode === 'ways' ? 'a second way, ' : ''}saved score and sticker passed`,
        );
      }

    if (!only || only === 'grow')
      for (let level = fromLevel; level <= 8; level++) {
        await launch('garden-grow', level);
        const plan = await page.evaluate(() => ({
          mode: neo.scene.game.plan.mode,
          requests: neo.scene.game.requests.length,
        }));
        const settle = async () => {
          await page.waitForTimeout(250);
          await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
            timeout: 20000,
          });
        };
        const bed = async (i) => {
          await tap(`neo.scene.game.beds[${i}].node`);
          await settle();
        };
        const packet = async (color) => {
          await tap(`neo.scene.game.packets.find((p) => p.color === '${color}').node`);
          await settle();
        };
        const cloud = async () => {
          await tap('neo.scene.game.cloud');
          await page.waitForTimeout(650);
          await settle();
        };
        if (plan.mode === 'big') {
          // Every touch moves the flower on one stage: five per flower, and one more to put each of the first two in the vase.
          for (let n = 0; n < 15; n++) {
            await tap('neo.scene.game.tapLayer');
            await page.waitForTimeout(150);
            if (n === 3) await screenshot('garden-grow-8');
          }
        } else if (plan.mode === 'plant') for (let i = 0; i < 6; i++) await bed(i);
        else if (plan.mode === 'water') {
          for (let i = 0; i < 3; i++) await bed(i);
          await cloud();
          await screenshot('garden-grow-2');
          for (let i = 3; i < 6; i++) await bed(i);
          await cloud();
        } else
          for (let n = 0; n < plan.requests; n++) {
            await idle(n);
            const want = await page.evaluate(() => Object.entries(neo.scene.game.request.want));
            const right = want.flatMap(([c, k]) => Array(k).fill(c));
            if (level === 7 && n === 0) await screenshot('garden-grow-7');
            if (plan.mode === 'color') {
              if (n === 0) {
                const other = await page.evaluate(
                  (w) => neo.scene.game.packets.find((p) => p.color !== w).color,
                  want[0][0],
                );
                await packet(other);
                await packet(other);
                assert.deepEqual(await counts(), [2, 1]);
              }
              await packet(want[0][0]);
              continue;
            }
            if (n === 0) {
              // One seed short, or the right number in the wrong colors: two gentle misses, then glowing beds.
              const wrong =
                plan.mode === 'count' || plan.mode === 'more'
                  ? right.slice(1)
                  : plan.mode === 'array'
                    ? [
                        await page.evaluate(
                          (c) => neo.scene.game.packets.find((p) => p.color !== c).color,
                          right[0],
                        ),
                        ...right.slice(1),
                      ]
                    : right.map(() => right[0]);
              for (const c of wrong) await packet(c);
              await cloud();
              await cloud();
              assert.deepEqual(await counts(), [2, 1]);
              if (level === 5) await screenshot('garden-grow-5');
              for (let i = 0; i < 6; i++)
                if (await page.evaluate((i) => !!neo.scene.game.beds[i].seed, i)) await bed(i);
            }
            for (const c of right) await packet(c);
            await cloud();
          }
        await finished('garden-grow');
        assert.deepEqual(
          await score('garden-grow'),
          ['plant', 'water', 'big'].includes(plan.mode) ? [0, 0] : [2, 1],
        );
        log(
          `Garden Grow ${level} (${plan.mode}): soil, seed packets, taking seeds back, rain, misses and glowing hints, saved score and sticker passed`,
        );
      }

    if (!only || only === 'clock')
      for (const level of process.env.CLOCK_LEVELS
        ? process.env.CLOCK_LEVELS.split(',').map(Number)
        : Array.from({ length: 8 - fromLevel }, (_, i) => i + fromLevel)) {
        await launch('clock-tower', level);
        const mode = await page.evaluate(() => neo.scene.game.plan.mode);
        // U7 R4: a right answer's line (`clock.yay`, `clock.itis`, level 6's example) never holds the tower. Each is
        // stretched to at least 6 s of game time (the chime and sweep run on game time too, so a slow headless frame rate
        // cannot blur them), and the next task must open before the line ends; its instruction is still said (at the
        // line's end or at her first touch), and the last task's line is heard out.
        await page.evaluate(() => {
          const g = neo.scene.game;
          const say = g.ctx.say.bind(g.ctx);
          const instruct = g.ctx.instruct.bind(g.ctx);
          g.rightLines = [];
          const asked = () => {
            const prev = g.rightLines.at(-1);
            if (prev && prev.asked === undefined) prev.asked = performance.now() - prev.at;
          };
          g.ctx.instruct = (id, vars) => {
            asked();
            return instruct(id, vars);
          };
          g.ctx.say = (id, vars) => {
            const line = say(id, vars);
            const key = String(id);
            const prev = g.rightLines.at(-1);
            if (key === 'clock.done' && prev && prev.done === undefined)
              prev.done = performance.now() - prev.at;
            if (key !== 'clock.yay' && key !== 'clock.itis' && key !== 'clock.later.example') return line;
            const index = g.index;
            const rec = { id: key, at: performance.now(), last: index + 1 >= g.tasks.length };
            g.rightLines.push(rec);
            const watch = () => {
              if (rec.opens !== undefined) return;
              if (g.finished || (!g.busy && g.index > index)) rec.opens = performance.now() - rec.at;
              else if (performance.now() - rec.at < 20000) requestAnimationFrame(watch);
            };
            void Promise.resolve().then(watch);
            return Promise.all([line, g.ctx.tw.wait(6)]).then(() => {
              rec.ended = performance.now() - rec.at;
            });
          };
        });
        const settle = async () => {
          await page.waitForTimeout(250);
          await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
            timeout: 20000,
          });
        };
        // Turn a hand with a finger: the long hand from the outer ring, the short one from the middle.
        const turn = async (radius, turns) => {
          const path = await page.evaluate(
            ({ radius, turns }) => {
              const f = neo.scene.game.face;
              const pts = [];
              for (let i = 0; i <= 10; i++) {
                const a = (turns - 0.2 + (0.2 * i) / 10) * Math.PI * 2;
                const p = f.toGlobal({ x: Math.sin(a) * radius, y: -Math.cos(a) * radius });
                pts.push([p.x, p.y]);
              }
              return pts;
            },
            { radius, turns },
          );
          await page.evaluate((path) => kit.drag(path), path);
          await page.waitForTimeout(150);
        };
        const setTo = async (time) => {
          const minute = time % 60;
          const hour = Math.floor(time / 60) % 12;
          if (mode !== 'hour') await turn(165, minute / 60);
          await turn(80, (hour + minute / 60) / 12);
        };
        const ring = async () => {
          await tap('neo.scene.game.bell');
          await settle();
        };
        for (let n = 0; n < 4; n++) {
          await idle(n);
          const time = await page.evaluate(() => neo.scene.game.task.time);
          if (mode !== 'read') {
            const before = await counts();
            const shown = await page.evaluate(() => {
              const g = neo.scene.game;
              return { text: g.requestTime.text, time: g.plan.mode === 'later' ? g.task.from : g.task.time };
            });
            assert.equal(
              shown.text,
              `${Math.floor(shown.time / 60) % 12 || 12}:${String(shown.time % 60).padStart(2, '0')}`,
            );
            await tap('neo.scene.game.request');
            await settle();
            assert.deepEqual(await counts(), before, 'replay is free');
          }
          if (mode === 'read') {
            const before = await counts();
            const board = await page.evaluate(() => {
              const g = neo.scene.game;
              return g.task.options.map((a) => {
                const c = g.choices.find((c) => c.id === a.id);
                return {
                  ...a,
                  labels: c.replay.children.filter((child) => 'text' in child).map((child) => child.text),
                };
              });
            });
            assert.equal(board.length, 3);
            assert.equal(new Set(board.map((a) => a.time)).size, 3);
            assert.equal(board.filter((a) => a.time === time).length, 1);
            for (let j = 0; j < 3; j++) {
              const a = board[j];
              assert.ok(
                a.labels.includes(
                  `${Math.floor(a.time / 60) % 12 || 12}:${String(a.time % 60).padStart(2, '0')}`,
                ),
              );
              await tap(`neo.scene.game.choices[${j}].replay`);
              assert.equal(await page.evaluate(() => neo.scene.game.index), n, 'replay never chooses');
              assert.deepEqual(await counts(), before, 'appointment replay is free');
            }
            if (n === 0) {
              await page.setViewportSize({ width: 768, height: 1024 });
              await page.waitForTimeout(200);
              await screenshot('clock-tower-5-appointments-portrait');
              await page.setViewportSize({ width: 1024, height: 768 });
              await page.waitForTimeout(200);
              for (let k = 0; k < 2; k++) {
                await tap('neo.scene.game.choices.find((c) => !neo.scene.game.isRight(c.id)).node');
                await settle();
              }
              assert.deepEqual(await counts(), [2, 1]);
            }
            await tap('neo.scene.game.choices.find((c) => neo.scene.game.isRight(c.id)).node');
            continue;
          }
          if (n === 0) {
            await ring();
            await ring();
            assert.deepEqual(await counts(), [2, 1]);
            if (level === 6 || level === 7) {
              const evidence = await page.evaluate(() => {
                const g = neo.scene.game;
                const digital = (t) => `${Math.floor(t / 60) % 12 || 12}:${String(t % 60).padStart(2, '0')}`;
                return {
                  comparing: g.comparison.visible,
                  before: g.oldTime.text,
                  after: g.newTime.text,
                  from: digital(g.task.from ?? 0),
                  target: digital(g.task.time),
                  oldAlpha: g.oldClock.alpha,
                  hour: g.example.hour,
                  hourEnd:
                    (Math.floor((g.task.from ?? 0) / 60) % 12) * 5 + ((g.task.from ?? 0) % 60) / 12 + 5,
                  arc: g.example.arc,
                  minute: g.task.time % 60,
                  rim: g.face.children.filter((child) => 'text' in child).map((child) => child.text),
                };
              });
              if (level === 6) {
                assert.equal(evidence.comparing, true);
                assert.equal(evidence.before, evidence.from);
                assert.equal(evidence.after, evidence.target);
                assert.equal(evidence.hour, evidence.hourEnd, 'worked example moves forwards one hour');
                assert.ok(evidence.oldAlpha < 1, 'old clock is faint');
              } else {
                assert.equal(evidence.comparing, false);
                assert.equal(evidence.arc, evidence.minute, 'help arc reaches the requested minute');
                assert.ok(evidence.rim.includes('0'));
                assert.ok(!evidence.rim.includes('60'), 'minute zero belongs at 12');
              }
              await page.setViewportSize({ width: 768, height: 1024 });
              await page.waitForTimeout(200);
              await screenshot(`clock-tower-${level}-explanation-portrait`);
              await page.setViewportSize({ width: 1024, height: 768 });
              await page.waitForTimeout(200);
            }
            if (level === 4 || level === 7) await screenshot(`clock-tower-${level}-hint`);
          }
          await setTo(time);
          assert.equal(await page.evaluate(() => neo.scene.game.shown), time, `hands set to ${time}`);
          await ring();
        }
        await finished('clock-tower');
        assert.deepEqual(await score('clock-tower'), [2, 1]);
        const rights = await page.evaluate(() =>
          neo.scene.game.rightLines.map((r) => ({
            id: r.id,
            last: r.last,
            opens: Math.round(r.opens ?? -1),
            ended: Math.round(r.ended ?? -1),
            asked: Math.round(r.asked ?? -1),
            done: Math.round(r.done ?? -1),
          })),
        );
        const early = rights.filter((r) => !r.last);
        // Level 6's example starts with its 0.8 s sweep and the chime rings over it, so its next task opens later, but
        // still well before the line ends.
        if (early.length !== 3 || early.some((r) => r.opens < 0 || r.ended < 0 || r.opens > r.ended - 1000))
          throw new Error(`R4: a right answer's line held the next task: ${JSON.stringify(rights)}`);
        if (early.some((r) => r.asked < 0))
          throw new Error(`R4: a waiting instruction was never said: ${JSON.stringify(rights)}`);
        if (rights.filter((r) => r.last).some((r) => r.done < r.ended))
          throw new Error(`R4: the last task's line was not heard out: ${JSON.stringify(rights)}`);
        log(
          `Clock Tower ${level} R4: the next task opened ${early.map((r) => `${r.opens}/${r.ended}`).join(', ')} ms into the line`,
        );
        log(
          `Clock Tower ${level} (${mode}): ${mode === 'read' ? 'visible appointment times, free replay, picture choices' : 'hands turned and snapped'}, two misses, one hint, saved score and sticker passed`,
        );
      }

    if (!only || only === 'families') {
      await launch('word-monsters', 7);
      // Drag a first-sound monster into the empty first slot (it rides above the finger, so aim below).
      const drop = async (right) => {
        await page.evaluate(async (right) => {
          const g = neo.scene.game;
          const q = g.questions[g.index];
          const m = g.monsters.find(
            (x) => !x.placed && (right ? x.letter === q.answer[0] : x.letter !== q.answer[0]),
          );
          const slot = g.slotAt(0);
          await kit.dragTo(m, { x: slot.x, y: slot.y + 40 }, 14);
        }, right);
        await page.waitForTimeout(500);
        await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
          timeout: 20000,
        });
      };
      for (let n = 0; n < 6; n++) {
        await idle(n);
        if (n === 0) {
          await drop(false);
          await drop(false);
          assert.deepEqual(await counts(), [2, 1]);
          await screenshot('word-monsters-7');
        }
        await drop(true);
      }
      await finished('word-monsters');
      assert.deepEqual(await score('word-monsters'), [2, 1]);
      log(
        'Word Monsters 7: word families with the ending in place, first sounds dragged in, wrong sounds, glow hint, saved score and sticker passed',
      );
    }

    if (!only || only === 'word-end') {
      await launch('word-monsters', 8);
      const drop = async (right) => {
        await page.evaluate(async (right) => {
          const g = neo.scene.game;
          const q = g.questions[g.index];
          const m = g.monsters.find(
            (x) => !x.placed && (right ? x.letter === q.answer[2] : x.letter !== q.answer[2]),
          );
          const slot = g.slotAt(g.filled);
          await kit.dragTo(m, { x: slot.x, y: slot.y + 40 }, 14);
        }, right);
        await page.waitForTimeout(500);
        await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
          timeout: 20000,
        });
      };
      for (let n = 0; n < 3; n++) {
        await idle(n);
        if (n === 0) {
          await drop(false);
          await drop(false);
          assert.deepEqual(await counts(), [2, 1]);
          await screenshot('word-monsters-8');
        }
        await drop(true);
      }
      await finished('word-monsters');
      assert.deepEqual(await score('word-monsters'), [2, 1]);
      log(
        'Word Monsters 8: keep the first two sounds, change the end, wrong sounds, glow hint, saved score and sticker passed',
      );
    }

    if (!only || only === 'pixels')
      for (let level = fromLevel; level <= Number(process.env.TO_LEVEL || 9); level++) {
        // Levels 8 and 9 play in portrait: the model beside the 6 by 6 board, the swatches under the 4 by 4 one.
        await page.setViewportSize(
          level === 8 || level === 9 ? { width: 768, height: 1024 } : { width: 1024, height: 768 },
        );
        await launch('pixel-pictures', level);
        const plan = await page.evaluate(() => ({
          mode: neo.scene.game.plan.mode,
          pictures: neo.scene.game.pictures.length,
        }));
        const cellTap = async (x, y) => {
          await page.evaluate(
            ({ x, y }) => {
              const g = neo.scene.game;
              const p = g.board.toGlobal({ x: x * 100 + 50, y: y * 100 + 50 });
              kit.tap(p.x, p.y);
            },
            { x, y },
          );
          await page.waitForTimeout(110);
        };
        for (let n = 0; n < plan.pictures; n++) {
          await idle(n);
          const { target, mode } = await page.evaluate(() => ({
            target: neo.scene.game.target,
            mode: neo.scene.game.plan.mode,
          }));
          const size = target.length;
          // Squares drawn before she starts: the left half on level 3, the top-left quarter on level 7.
          const given = (x, y) =>
            (mode === 'mirror' && x < size / 2) || (mode === 'mirror2' && x < size / 2 && y < size / 2);
          const todo = target
            .flatMap((row, y) => row.map((c, x) => ({ x, y, c })))
            .filter(({ x, y, c }) => c && !given(x, y));
          if (n === 0) {
            // Two squares that stay empty: gentle misses, then a glowing square.
            const empty = target
              .flatMap((row, y) => row.map((c, x) => ({ x, y, c })))
              .filter(({ x, y, c }) => !c && !given(x, y));
            for (const e of empty.slice(0, 2)) await cellTap(e.x, e.y);
            await page.waitForTimeout(300);
            assert.deepEqual(await counts(), [2, 1]);
            const glow = await page.evaluate(() => neo.scene.game.hinted);
            // Level 7 glows one square whose mirror is drawn; level 8 glows every square of one 2×2 block.
            if (mode === 'mirror2')
              assert.ok(
                glow.length === 1 && !given(glow[0].x, glow[0].y) && target[glow[0].y][glow[0].x],
                'level 7 glows one open picture square',
              );
            if (mode === 'big')
              assert.ok(
                glow.length === 4 &&
                  glow.every(
                    (g) => g.x >> 1 === glow[0].x >> 1 && g.y >> 1 === glow[0].y >> 1 && target[g.y][g.x],
                  ),
                'level 8 glows one whole block',
              );
            // Two-color copying: the glow comes with its square's color in hand.
            if (level === 2 || level === 9)
              assert.equal(
                await page.evaluate(() => neo.scene.game.color),
                target[glow[0].y][glow[0].x],
                'the glow picks its color',
              );
            if (level === 8) await screenshot('pixel-pictures-8-block-hint');
            if (level === 4) await screenshot('pixel-pictures-4-hint');
            if (level === 6) await screenshot('pixel-pictures-6-color-clues');
            if (level === 9) await screenshot('pixel-pictures-9-two-colors-small');
          }
          for (const t of todo) {
            // Two-color copying: pick the square's color from the palette first.
            await page.evaluate((c) => {
              const g = neo.scene.game;
              if (g.palette.length && g.color !== c) kit.tapOn(g.palette.find((p) => p.letter === c).node);
            }, t.c);
            await page.waitForTimeout(60);
            await cellTap(t.x, t.y);
          }
        }
        await finished('pixel-pictures');
        assert.deepEqual(await score('pixel-pictures'), [2, 1]);
        await page.setViewportSize({ width: 1024, height: 768 });
        log(
          `Pixel Pictures ${level} (${plan.mode}): squares tapped like a finger${plan.mode === 'copy' || plan.mode === 'colorClues' ? ', palette colors' : ''}, empty squares as misses, glowing hint, revealed pictures, saved score and sticker passed`,
        );
      }

    if (!only || only === 'bits') {
      // Level 11, ones and zeros, on an upright phone: four cards, a free arrow and a check.
      await page.setViewportSize({ width: 390, height: 844 });
      await launch('pixel-pictures', 11);
      const read = () =>
        page.evaluate(() => {
          const g = neo.scene.game;
          return {
            bits: [...g.bits],
            target: [...g.target],
            glowing: g.glowing,
            decoded: g.decoded,
            shown: g.shown,
          };
        });
      // The arrow's reading of the cards has finished (and, after a check, been judged).
      const settled = async () => {
        await page.waitForFunction(
          () => neo.scene.finished || (!neo.scene.game.run && !neo.scene.game.busy),
          null,
          {
            timeout: 20000,
          },
        );
        await page.waitForTimeout(450);
      };
      const press = async (what) => {
        await tap(`neo.scene.game.${what}`);
        await settled();
      };
      const flip = async (i) => {
        await tap(`neo.scene.game.cards[${i}]`);
        await page.waitForTimeout(140);
      };
      const finishRow = async () => {
        const { bits, target } = await read();
        for (let i = 0; i < 4; i++) if (bits[i] !== target[i]) await flip(i);
        // Looking is free: the arrow shows the row and counts nothing.
        const before = await counts();
        await press('arrow');
        const seen = await read();
        assert.ok(seen.decoded, 'the arrow shows the row the cards make');
        assert.deepEqual(seen.bits, seen.target);
        assert.deepEqual(await counts(), before, 'flips and the arrow are never misses');
        await tap('neo.scene.game.check');
      };
      assert.equal(await page.evaluate(() => neo.scene.game.rows.length), 3);
      // Row 1: two checks that do not match (every row has a filled square, so 0000 never matches), then the glow.
      await idle(0);
      const first = (await read()).target.indexOf(true);
      await press('check');
      assert.deepEqual(await counts(), [1, 0]);
      assert.equal((await read()).glowing, null);
      await press('check');
      assert.deepEqual(await counts(), [2, 1]);
      assert.equal((await read()).glowing, first, 'the first card that differs glows');
      await screenshot('pixel-pictures-11-ones-and-zeros');
      await flip(first);
      const flipped = await read();
      assert.equal(flipped.glowing, null, 'the glow goes when she flips its card');
      assert.equal(flipped.shown, 0, 'a flip clears her row');
      await finishRow();
      // Row 2: a glow left alone is flipped for her on the next hint, and the check is still hers.
      await idle(1);
      const want = (await read()).target.indexOf(true);
      for (let n = 0; n < 4; n++) await press('check');
      assert.deepEqual(await counts(), [6, 3]);
      const helped = await read();
      assert.equal(helped.bits[want], true, 'the hint flipped the glowing card');
      assert.equal(helped.glowing, null);
      assert.equal(await page.evaluate(() => neo.scene.game.index), 1, 'help never ends a row');
      await finishRow();
      await idle(2);
      await finishRow();
      await finished('pixel-pictures');
      assert.deepEqual(await score('pixel-pictures'), [6, 3]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log(
        'Pixel Pictures 11 (ones and zeros): upright, failed checks as misses, the glowing card, a card flipped as help, free flips and arrow, three rows, saved score and sticker passed',
      );
    }

    if (!only || only === 'bits12') {
      // Level 12, a whole picture, on an upright phone: the same four cards write two pictures a row at a time.
      await page.setViewportSize({ width: 390, height: 844 });
      // Two of five pictures are drawn; relaunch until one has an empty row (a smile or a plus), a real case to check.
      for (let tries = 0; tries < 12; tries++) {
        await launch('pixel-pictures', 12);
        if (await page.evaluate(() => neo.scene.game.rows.some((r) => !r.bits.some(Boolean)))) break;
      }
      const read = () =>
        page.evaluate(() => {
          const g = neo.scene.game;
          return {
            bits: [...g.bits],
            target: [...g.target],
            glowing: g.glowing,
            decoded: g.decoded,
            kept: g.kept,
            index: g.index,
          };
        });
      const settled = async () => {
        await page.waitForFunction(
          () => neo.scene.finished || (!neo.scene.game.run && !neo.scene.game.busy),
          null,
          { timeout: 20000 },
        );
        await page.waitForTimeout(450);
      };
      const press = async (what) => {
        await tap(`neo.scene.game.${what}`);
        await settled();
      };
      const flip = async (i) => {
        await tap(`neo.scene.game.cards[${i}]`);
        await page.waitForTimeout(140);
      };
      const shape = await page.evaluate(() => ({
        rows: neo.scene.game.rows.length,
        names: neo.scene.game.pictures.map((p) => p.name),
        empties: neo.scene.game.rows.map((r) => !r.bits.some(Boolean)),
      }));
      assert.equal(shape.rows, 8);
      assert.equal(new Set(shape.names).size, 2);
      assert.ok(shape.empties.includes(true), 'this round has an empty row');
      let failed = false;
      let emptyChecked = 0;
      for (let n = 0; n < 8; n++) {
        await idle(n);
        const start = await read();
        assert.deepEqual(start.bits, [false, false, false, false], 'the cards start at 0000 for every row');
        assert.equal(start.kept, n % 4, 'finished rows stay on the board and the marker moves down');
        if (shape.empties[n]) {
          // An empty row is right as the cards stand: she checks it without a flip, and it is no miss.
          const before = await counts();
          await tap('neo.scene.game.check');
          await page.waitForFunction((n) => neo.scene.game.index > n || neo.scene.game.kept === 4, n, {
            timeout: 20000,
          });
          assert.deepEqual(await counts(), before, 'an empty row checked as it stands is right');
          emptyChecked++;
          continue;
        }
        if (!failed) {
          // Two checks that do not match on the first row with a filled square: two misses, then the glow.
          failed = true;
          const first = start.target.indexOf(true);
          await press('check');
          assert.deepEqual(await counts(), [1, 0]);
          await press('check');
          assert.deepEqual(await counts(), [2, 1]);
          assert.equal((await read()).glowing, first, 'the first card that differs glows');
          assert.equal((await read()).index, n, 'help never ends a row');
          await screenshot('pixel-pictures-12-whole-picture');
        }
        const { bits, target } = await read();
        for (let i = 0; i < 4; i++) if (bits[i] !== target[i]) await flip(i);
        const before = await counts();
        await press('arrow');
        assert.ok((await read()).decoded, 'the arrow shows the row on the board');
        assert.deepEqual(await counts(), before, 'flips and the arrow are never misses');
        await tap('neo.scene.game.check');
        if (n % 4 === 3)
          await page.waitForFunction(() => neo.scene.game.kept === 4, null, { timeout: 20000 });
      }
      assert.ok(emptyChecked >= 1);
      await finished('pixel-pictures');
      assert.deepEqual(await score('pixel-pictures'), [2, 1]);
      // The last finished picture is offered for the treehouse and kept only when she says so.
      await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 25000 });
      await page.waitForTimeout(700);
      assert.ok(
        await page.evaluate(() => !!neo.scene.after.keep),
        'the written picture is offered for the treehouse',
      );
      const last = await page.evaluate(
        () => neo.scene.game.pictures[1].rows.join('').replace(/\./g, '').length,
      );
      await tap('neo.scene.after.keep');
      await page.waitForTimeout(300);
      const keptPicture = await page.evaluate(() =>
        JSON.parse(JSON.stringify(kit.store.data.creations.picture.current)),
      );
      assert.equal(keptPicture.size, 4);
      assert.equal(keptPicture.pixels.length, last, 'the kept picture is the last one she wrote');
      await page.setViewportSize({ width: 1024, height: 768 });
      log(
        'Pixel Pictures 12 (a whole picture): upright, two pictures of four rows, an empty row checked as it stands, failed checks as misses, the glowing card, saved score, sticker and a kept picture passed',
      );
    }

    if (!only || only === 'night')
      for (let level = fromLevel; level <= Number(process.env.TO_LEVEL || 10); level++) {
        if (level === 1 || process.env.NIGHT_ROOM)
          await page.evaluate(
            async ({ level, room }) => {
              const { goodnightRoom } = await import('/src/games/goodnight-room/index.ts');
              const { Rng } = await import('/src/engine/random.ts');
              const { makeNight, planFor } = await import('/src/games/goodnight-room/logic.ts');
              let seed = 1;
              const wanted = room || 'barn';
              while (seed < 1000 && makeNight(planFor(level), new Rng(seed)).setting.id !== wanted) seed++;
              if (seed === 1000) throw new Error(`No seeded ${wanted} room at level ${level}`);
              const create = goodnightRoom.create;
              goodnightRoom.create = (ctx) => {
                goodnightRoom.create = create;
                return create({ ...ctx, rng: new Rng(seed) });
              };
            },
            { level, room: process.env.NIGHT_ROOM },
          );
        await launch('goodnight-room', level);
        const mode = await page.evaluate(() => neo.scene.game.plan.mode);
        if (process.env.NIGHT_ROOM)
          assert.equal(await page.evaluate(() => neo.scene.game.setting.id), process.env.NIGHT_ROOM);
        if (mode === 'except')
          await page.evaluate(() => {
            const g = neo.scene.game;
            const say = g.ctx.say.bind(g.ctx);
            g.exceptionSpeech = [];
            g.ctx.say = (id, params) => {
              if (id === 'night.keepAwake' || id === 'night.exceptDone')
                g.exceptionSpeech.push({
                  id,
                  light: params.light,
                  awake: g.sleepers.filter((s) => !s.asleep).map((s) => s.thing),
                });
              if (id === 'night.exceptDone') {
                g.exceptionFinal = true;
                return new Promise((resolve) => {
                  g.releaseExceptionFinal = resolve;
                }).then(() => say(id, params));
              }
              return say(id, params);
            };
          });
        // Tap the middle of a thing, the way a finger would.
        const touch = async (thing) => {
          await page.evaluate((thing) => {
            const s = neo.scene.game.sleepers.find((x) => x.thing === thing);
            const b = s.getBounds();
            kit.tap(b.x + b.width / 2, b.y + b.height / 2);
          }, thing);
          await page.waitForTimeout(250);
          await page.waitForFunction(
            () => !neo.scene.game.busy || neo.scene.game.exceptionFinal || neo.scene.finished,
            null,
            { timeout: 20000 },
          );
          await page.waitForTimeout(420);
        };
        await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
        await page.waitForTimeout(150);
        if (level >= 5) {
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(250);
          await screenshot(`goodnight-room-${process.env.NIGHT_ROOM || 'random'}-${level}-portrait`);
        }
        if (level === 1) {
          assert.equal(
            await page.evaluate(() => neo.scene.game.setting.id),
            process.env.NIGHT_ROOM || 'barn',
          );
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(250);
          await screenshot('goodnight-room-barn-portrait');
        }
        if (mode === 'count') {
          const { target, friends } = await page.evaluate(() => ({
            target: neo.scene.game.targetCount,
            friends: neo.scene.game.friends,
          }));
          assert.ok(target >= 2 && target <= 4);
          // Watch the scene's speech boundary to prove every chosen goodnight is counted,
          // and the extra friends are still awake when the requested count is reached.
          await page.evaluate(() => {
            const g = neo.scene.game;
            const say = g.ctx.say.bind(g.ctx);
            g.countSpeech = [];
            g.ctx.say = (id, params) => {
              if (id === 'night.counted' || id === 'night.countDone')
                g.countSpeech.push({ id, n: params.n, asleep: g.sleepers.filter((s) => s.asleep).length });
              return say(id, params);
            };
          });
          const chosen = [...friends].reverse().slice(0, target);
          await touch(chosen[0]);
          // An already sleeping friend contributes nothing and is never a mistake.
          await touch(chosen[0]);
          assert.equal(await page.evaluate(() => neo.scene.game.sleepers.filter((s) => s.asleep).length), 1);
          for (const t of chosen.slice(1)) await touch(t);
          assert.deepEqual(await page.evaluate(() => neo.scene.game.countSpeech), [
            ...Array.from({ length: target }, (_, i) => ({ id: 'night.counted', n: i + 1, asleep: i + 1 })),
            { id: 'night.countDone', n: target, asleep: target },
          ]);
        } else if (mode === 'all') {
          for (const t of await page.evaluate(() => neo.scene.game.sleepers.map((s) => s.thing)))
            await touch(t);
        } else if (mode === 'tour') {
          // Three distinct rooms, the bedroom first; the big arrow appears only when a room is asleep and leads on.
          const tour = await page.evaluate(() => neo.scene.game.tour.map((r) => r.id));
          assert.equal(tour.length, 3);
          assert.equal(new Set(tour).size, 3);
          assert.equal(tour[0], 'bedroom');
          for (const [n, id] of tour.entries()) {
            assert.equal(await page.evaluate(() => neo.scene.game.setting.id), id);
            const things = await page.evaluate(() => neo.scene.game.sleepers.map((s) => s.thing));
            for (const t of things.slice(0, -1)) await touch(t);
            assert.equal(await page.evaluate(() => neo.scene.game.arrow.visible), false);
            await touch(things.at(-1));
            if (n === tour.length - 1) break;
            assert.equal(await page.evaluate(() => neo.scene.game.arrow.visible), true);
            if (n === 0) await screenshot('goodnight-room-10-arrow-portrait');
            await page.evaluate(() => {
              const b = neo.scene.game.arrow.getBounds();
              kit.tap(b.x + b.width / 2, b.y + b.height / 2);
            });
            await page.waitForFunction(
              (next) => neo.scene.game.setting.id === next && !neo.scene.game.busy,
              tour[n + 1],
              { timeout: 20000 },
            );
            await page.waitForTimeout(300);
            assert.equal(await page.evaluate(() => neo.scene.game.sleepers.every((s) => !s.asleep)), true);
          }
        } else {
          const requests = await page.evaluate(() => neo.scene.game.requests);
          for (const [n, r] of requests.entries()) {
            await idle(n);
            if (n === 0) {
              // A wrong friend, or the right two in the wrong order: gentle misses, then a glow.
              const wrong =
                mode === 'lightLast'
                  ? r[r.length - 1]
                  : mode === 'two'
                    ? r[1]
                    : await page.evaluate(
                        (w) => neo.scene.game.sleepers.find((s) => !w.includes(s.thing) && !s.asleep).thing,
                        r,
                      );
              await touch(wrong);
              await touch(wrong);
              assert.deepEqual(await counts(), [2, 1]);
            }
            const order =
              mode === 'lightLast'
                ? [...r.slice(0, -1).reverse(), r[r.length - 1]]
                : mode === 'animals' || mode === 'color' || mode === 'except'
                  ? [...r].reverse()
                  : r;
            if (mode === 'lightLast')
              assert.equal(
                await page.evaluate(
                  (light) => neo.scene.game.sleepers.find((s) => s.thing === light).asleep,
                  r[r.length - 1],
                ),
                false,
              );
            for (const t of order) await touch(t);
          }
        }
        if (mode === 'except') {
          const state = await page.evaluate(() => {
            const g = neo.scene.game;
            const light = g.sleepers.find((s) => s.thing === 'lamp' || s.thing === 'lantern');
            return {
              light: light.thing,
              awake: g.sleepers.filter((s) => !s.asleep).map((s) => s.thing),
              speech: g.exceptionSpeech,
              glowing: !light.glow.destroyed && light.glow.getLocalBounds().width > 0,
            };
          });
          assert.deepEqual(state.awake, [state.light]);
          assert.equal(state.glowing, true, 'The night-light keeps its warm glow');
          assert.deepEqual(
            state.speech.map((s) => s.id),
            ['night.keepAwake', 'night.keepAwake', 'night.exceptDone'],
          );
          assert.deepEqual(state.speech.at(-1).awake, [state.light]);
          await screenshot('goodnight-room-9-night-light-portrait');
          await page.evaluate(() => neo.scene.game.releaseExceptionFinal());
        }
        if (level === 2) (await page.waitForTimeout(400), await screenshot('goodnight-room-asleep'));
        await finished('goodnight-room');
        assert.deepEqual(
          await score('goodnight-room'),
          mode === 'all' || mode === 'count' || mode === 'tour' ? [0, 0] : [2, 1],
        );
        if (level === 1 || level >= 5) await page.setViewportSize({ width: 1024, height: 768 });
        log(
          `Goodnight Room ${level} (${mode}): goodnights by tapping, ${mode === 'count' ? 'free choices counted aloud with the others left awake briefly' : mode === 'tour' ? 'three distinct rooms from the bedroom, the arrow only once a room sleeps' : mode === 'all' ? 'the room going dark' : 'wrong friends and order as misses, glow hint'}, saved score and sticker passed`,
        );
      }

    if (!only || only === 'snack')
      for (let level = fromLevel; level <= Math.min(5, Number(process.env.TO_LEVEL || 5)); level++) {
        await launch('animal-snack', level);
        const mode = await page.evaluate(() => neo.scene.game.plan.mode);
        const settle = async () => {
          await page.waitForTimeout(250);
          await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
            timeout: 20000,
          });
          await page.waitForTimeout(380);
        };
        const tapAnimal = async (name) => {
          await page.evaluate(
            (name) => kit.tapOn(neo.scene.game.friends.find((f) => f.name === name).node, 0, -120),
            name,
          );
          await settle();
        };
        const tapSnack = async () => {
          await page.evaluate(() => kit.tapOn(neo.scene.game.snacks.find((s) => !s.eaten).node));
          await settle();
        };
        // Drag a snack to an animal; it rides above the finger, so aim a little below the face.
        const give = async (food, name) => {
          await page.evaluate(
            async ({ food, name }) => {
              const g = neo.scene.game;
              const s = g.snacks.find((x) => !x.eaten && x.food === food);
              const f = g.friends.find((x) => x.name === name);
              await kit.dragTo(s.node, { x: f.node.x, y: f.node.y - 80 }, 14);
            },
            { food, name },
          );
          await settle();
        };
        await idle(0);
        if (level === 1 || level === 2) {
          await page.evaluate(() => {
            neo.scene.game.idle = 6;
          });
          await page.waitForTimeout(80);
          assert.equal(
            await page.evaluate(() => neo.scene.game.nudgeIndex),
            1,
            'free play gets a gentle invitation',
          );
          assert.deepEqual(await counts(), [0, 0]);
        }
        if (level === 3 || level === 5) {
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(300);
          await screenshot(`animal-snack-${level}-portrait`);
          assert.ok(
            await page.evaluate(() => {
              const g = neo.scene.game;
              return g.snacks.every((s, i) => i === 0 || s.node.x - g.snacks[i - 1].node.x >= 132);
            }),
            'portrait snacks keep their full hit areas apart',
          );
        }
        if (level === 4) {
          // The seed picks a scene; every scene keeps the animals and snacks placed and shows its own feeding spot.
          for (const name of ['meadow', 'orchard', 'garden', 'dusk']) {
            await page.evaluate((name) => neo.scene.game.showScene(name), name);
            await page.waitForTimeout(250);
            await screenshot(`animal-snack-scene-${name}`);
            assert.ok(
              await page.evaluate(
                () =>
                  neo.scene.game.friends.every((f) => f.node.parent) &&
                  neo.scene.game.snacks.every((s) => s.node.parent),
              ),
              `the ${name} keeps the animals and snacks placed`,
            );
          }
        }
        if (level === 3) {
          // Put two bodies close enough that the later drawing receives a touch nearer the first.
          // Observe the recipient through the real Pixi event without answering a puzzle.
          await page.evaluate(() => {
            const g = neo.scene.game;
            g.savedTapFriend = g.tapFriend;
            g.tapFriend = (f) => {
              g.tappedName = f.name;
            };
            g.friends.forEach((f, i) => {
              f.node.x = [400, 520, 800][i];
            });
          });
          await page.waitForTimeout(80);
          await page.evaluate(() => {
            const p = neo.scene.game.friends[0].node.toGlobal({ x: 40 / 0.6, y: -125 });
            kit.tap(p.x, p.y);
          });
          assert.equal(
            await page.evaluate(() => neo.scene.game.tappedName),
            await page.evaluate(() => neo.scene.game.friends[0].name),
            'overlapping taps choose the closest animal',
          );
          await page.evaluate(() => {
            const g = neo.scene.game;
            g.tapFriend = g.savedTapFriend;
            delete g.savedTapFriend;
            g.resize(neo.view);
          });
          await page.waitForTimeout(400);
        }
        if (level === 5) {
          assert.equal(
            await page.evaluate(
              () => neo.scene.game.bubble.children.find((c) => typeof c.text === 'string')?.text,
            ),
            String(await page.evaluate(() => neo.scene.game.round.n)),
          );
        }
        // The animals must stand in the meadow, where a finger can reach them (at level 1 they once sat unplaced in the top-left corner).
        assert.ok(
          await page.evaluate(() =>
            neo.scene.game.friends.every((f) => {
              const p = f.node.getGlobalPosition();
              return p.x > 100 && p.x < innerWidth - 100 && p.y > innerHeight * 0.4;
            }),
          ),
          `animal snack level ${level}: the animals are on screen`,
        );
        if (level === 1) {
          // Lap's one big animal: a touch far from it (out of a tap's reach) feeds it; a touch while it eats only
          // squishes; a friend walks in after the second and fourth snacks; then a touch on the meadow feeds the nearest.
          const state = () =>
            page.evaluate(() => {
              const g = neo.scene.game;
              return {
                eaten: g.eatenCount,
                friends: g.friends.length,
                scale: g.friends[0].node.scale.x,
                busy: g.busy,
              };
            });
          assert.deepEqual(
            [(await state()).friends, (await state()).scale > 0.9],
            [1, true],
            'level 1 starts with one big animal',
          );
          await page.setViewportSize({ width: 390, height: 844 });
          await page.waitForTimeout(300);
          await screenshot('animal-snack-1-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(300);
          const far = () =>
            page.evaluate(() => {
              const f = neo.scene.game.friends[0].node.getGlobalPosition();
              const x = f.x > innerWidth / 2 ? f.x - 280 : f.x + 280;
              kit.tap(x, innerHeight * 0.4);
            });
          await far();
          await page.waitForTimeout(120);
          assert.ok((await state()).busy, 'a touch far from the big animal feeds it');
          await far();
          await page.waitForTimeout(80);
          await settle();
          assert.deepEqual(
            [(await state()).eaten, (await state()).friends],
            [1, 1],
            'a touch while it eats is not fed',
          );
          await far();
          await settle();
          assert.deepEqual(
            [(await state()).eaten, (await state()).friends],
            [2, 2],
            'a friend walks in after two',
          );
          for (let k = 0; k < 2; k++) {
            await page.evaluate((k) => {
              const p = neo.scene.game.friends[k].node.getGlobalPosition();
              kit.tap(p.x, Math.min(innerHeight - 20, p.y + 60));
            }, k);
            await settle();
          }
          assert.deepEqual(
            [(await state()).eaten, (await state()).friends],
            [4, 3],
            'the third walks in after four',
          );
          for (let k = 0; k < 2; k++)
            await tapAnimal(await page.evaluate((k) => neo.scene.game.friends[k + 1].name, k));
        } else if (mode === 'munch')
          for (let k = 0; k < 6; k++)
            await tapAnimal(await page.evaluate((k) => neo.scene.game.friends[k % 3].name, k));
        else if (mode === 'float') {
          // A second snack touched while the first is being eaten wiggles, and is not queued or fed.
          await page.evaluate(() => kit.tapOn(neo.scene.game.snacks.find((s) => !s.eaten).node));
          await page.waitForTimeout(120);
          assert.ok(await page.evaluate(() => neo.scene.game.busy), 'the first snack is being eaten');
          await page.evaluate(() => {
            const g = neo.scene.game;
            g.wiggled = g.snacks.find((s) => !s.eaten);
            kit.tapOn(g.wiggled.node);
          });
          await page.waitForTimeout(40);
          assert.notEqual(
            await page.evaluate(() => neo.scene.game.wiggled.node.children[0].rotation),
            0,
            'a busy touch wiggles the snack',
          );
          await settle();
          assert.deepEqual(
            await page.evaluate(() => {
              const g = neo.scene.game;
              return [
                g.eatenCount,
                g.snacks.filter((s) => s.eaten).length,
                g.wiggled.eaten,
                g.wiggled.node.scale.x,
              ];
            }),
            [1, 1, false, 1.2],
            'a busy touch feeds nothing',
          );
          assert.deepEqual(await counts(), [0, 0]);
          for (let k = 1; k < 6; k++) await tapSnack();
        } else if (mode === 'match') {
          const pairs = await page.evaluate(async () => {
            const L = await import('/src/games/animal-snack/logic.ts');
            return neo.scene.game.snacks.map((s) => [s.food, L.eaterOf(s.food)]);
          });
          const others = await page.evaluate(() => neo.scene.game.friends.map((f) => f.name));
          const [food0, eater0] = pairs[0];
          const wrong = others.find((n) => n !== eater0);
          await give(food0, wrong);
          await give(food0, wrong);
          assert.deepEqual(await counts(), [2, 1]);
          for (const [food, eater] of pairs) await give(food, eater);
        } else {
          const rounds = await page.evaluate(() => neo.scene.game.rounds);
          for (const [n, r] of rounds.entries()) {
            await idle(n);
            if (mode === 'who') {
              if (n === 0) {
                const wrong = r.animals.find((a) => a !== r.ask);
                await tapAnimal(wrong);
                await tapAnimal(wrong);
                assert.deepEqual(await counts(), [2, 1]);
              }
              if (n === 1) {
                // A wrong animal touched while the right one eats is poked, not counted as a miss.
                await page.evaluate(
                  (name) => kit.tapOn(neo.scene.game.friends.find((f) => f.name === name).node, 0, -120),
                  r.ask,
                );
                await page.waitForTimeout(150);
                await page.evaluate(
                  (name) => kit.tapOn(neo.scene.game.friends.find((f) => f.name === name).node, 0, -120),
                  r.animals.find((a) => a !== r.ask),
                );
                await settle();
                assert.deepEqual(await counts(), [2, 1], 'a busy touch is not a miss');
              } else await tapAnimal(r.ask);
            } else {
              const ring = async () => {
                await tap('neo.scene.game.bell');
                await settle();
              };
              if (n === 0) {
                for (let k = 0; k < r.n - 1; k++) await tapSnack();
                await ring();
                await ring();
                assert.deepEqual(await counts(), [2, 1]);
                await tapSnack();
              } else for (let k = 0; k < r.n; k++) await tapSnack();
              if (n === 0) {
                // U7 R4: the right count's line never holds the next ask; it follows the bell's beat.
                await tap('neo.scene.game.bell');
                await page.waitForFunction(() => neo.scene.game.index === 1 && !neo.scene.game.busy, null, {
                  timeout: 1200,
                });
              } else await ring();
            }
          }
        }
        await finished('animal-snack');
        assert.deepEqual(await score('animal-snack'), mode === 'munch' || mode === 'float' ? [0, 0] : [2, 1]);
        if (level === 3 || level === 5) await page.setViewportSize({ width: 1024, height: 768 });
        log(
          `Animal Snack ${level} (${mode}): animals and snacks tapped and dragged, wrong eaters as misses, glow hint, saved score and sticker passed`,
        );
      }

    if (!only || only === 'beat')
      for (let level = fromLevel; level <= 5; level++) {
        await launch('beat-builder', level);
        const plan = await page.evaluate(() => ({
          mode: neo.scene.game.plan.mode,
          beats: neo.scene.game.plan.beats,
        }));
        const cell = async (r, s) => {
          await page.evaluate(
            ({ r, s }) => {
              const g = neo.scene.game;
              const p = g.grid.toGlobal({ x: s * 100 + 50, y: r * 100 + 50 });
              kit.tap(p.x, p.y);
            },
            { r, s },
          );
          await page.waitForTimeout(140);
        };
        const settle = async () => {
          await page.waitForTimeout(250);
          await page.waitForFunction(
            () => neo.scene.finished || (!neo.scene.game.busy && neo.scene.game.playingTarget === 0),
            null,
            { timeout: 20000 },
          );
        };
        const fill = async () => {
          const todo = await page.evaluate(() => {
            const g = neo.scene.game;
            return g.target
              .flatMap((row, r) => row.map((on, s) => ({ r, s, on, have: g.beat[r][s] })))
              .filter((c) => c.on !== c.have);
          });
          for (const c of todo) await cell(c.r, c.s);
        };
        if (level === 5) {
          await settle();
          await page.evaluate(() => {
            const g = neo.scene.game;
            g.replaySounds = [];
            const sound = g.sound.bind(g);
            g.sound = (row, step) => {
              if (g.playingTarget > 0) g.replaySounds.push([row, step]);
              sound(row, step);
            };
          });
          await tap('neo.scene.game.listen');
          const before = await page.evaluate(() => JSON.stringify(neo.scene.game.beat));
          await cell(0, 0);
          await tap('neo.scene.game.check');
          assert.equal(
            await page.evaluate(() => JSON.stringify(neo.scene.game.beat)),
            before,
            'editing waits for replay',
          );
          assert.deepEqual(await counts(), [0, 0], 'checking during replay is free and ignored');
          await settle();
          const replay = await page.evaluate(() => {
            const g = neo.scene.game;
            const loop = Array.from({ length: g.plan.steps }, (_, step) =>
              g.target.flatMap((row, r) => (row[step] ? [[r, step]] : [])),
            ).flat();
            return { actual: g.replaySounds, expected: [...loop, ...loop] };
          });
          assert.deepEqual(
            replay.actual,
            replay.expected,
            'every target hit sounds in each of two complete loops',
          );
        }
        if (plan.mode === 'free') {
          await idle(0);
          await cell(0, 0);
          await cell(1, 1);
          await cell(0, 2);
          await page.waitForFunction(() => neo.scene.game.check.visible, null, { timeout: 15000 });
          await tap('neo.scene.game.check');
        } else
          for (let n = 0; n < plan.beats; n++) {
            await idle(n);
            if (n === 0) {
              if (plan.mode === 'hear') {
                await settle();
                await tap('neo.scene.game.check');
                await settle(); // Missing sounds.
                if (level === 5) {
                  await fill();
                  const extra = await page.evaluate(() => {
                    const g = neo.scene.game;
                    return g.target
                      .flatMap((row, r) => row.map((on, s) => ({ r, s, on })))
                      .find((c) => !c.on);
                  });
                  await cell(extra.r, extra.s);
                }
                await tap('neo.scene.game.check');
                await settle(); // Extra sound at 5.
                if (level === 5) {
                  assert.equal(await page.evaluate(() => neo.scene.game.helped), true);
                  const hasMove = await page.evaluate(() => !!neo.scene.game.autotouch());
                  assert.ok(hasMove, 'bot proposes a repair of the extra hit');
                  await screenshot('beat-builder-5-repair');
                }
              } else {
                // Squares that aren't in the beat: gentle misses that leave the square off.
                const off = await page.evaluate(() => {
                  const g = neo.scene.game;
                  return g.target
                    .flatMap((row, r) => row.map((on, s) => ({ r, s, on })))
                    .filter((c) => !c.on && !(g.plan.mode === 'repeat' && c.s < g.plan.steps / 2))
                    .slice(0, 2);
                });
                for (const c of off) await cell(c.r, c.s);
              }
              assert.deepEqual(await counts(), [2, plan.mode === 'see' ? 0 : 1]);
              if (level === 3) await screenshot('beat-builder-3-hint');
            }
            await fill();
            if (plan.mode === 'hear') {
              await tap('neo.scene.game.check');
            }
            await settle();
          }
        await finished('beat-builder');
        assert.deepEqual(
          await score('beat-builder'),
          plan.mode === 'free' ? [0, 0] : plan.mode === 'see' ? [2, 0] : [2, 1],
        );
        log(
          `Beat Builder ${level} (${plan.mode}): squares toggled on the grid, ${plan.mode === 'free' ? 'free play and the green check' : 'copying, misses, hints'}, saved score and sticker passed`,
        );
      }

    // Level 9 (the preschool opening) plays at preschool in portrait: two pictures, three scenes, the one wrong picture tapped twice for the glow.
    if (!only || only === 'rhyme')
      for (const level of [1, 2, 3, 4, 8, 9].filter(
        (l) => l >= fromLevel && l <= Number(process.env.TO_LEVEL || 99),
      )) {
        if (level === 9) await page.setViewportSize({ width: 820, height: 1180 });
        await launch('rhyme-time', level, 'Mia', level === 9 ? 'preschool' : undefined);
        const mode = await page.evaluate(() => neo.scene.game.plan.mode);
        const card = async (word) => {
          await tap(`neo.scene.game.cards.find((c) => c.word === '${word}').node`);
          await page.waitForTimeout(200);
          await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
            timeout: 20000,
          });
          await page.waitForTimeout(380);
        };
        const rounds = await page.evaluate(() => neo.scene.game.questions.length);
        for (let n = 0; n < rounds; n++) {
          await idle(n);
          const q = await page.evaluate(() => neo.scene.game.questions[neo.scene.game.index]);
          const others = q.words.filter((w) => !q.answer.includes(w));
          if (n === 0) {
            if (mode === 'pair') {
              // Two pairs that don't rhyme: a word from the pair with a distractor, then the two distractors.
              await card(q.answer[0]);
              await card(others[0]);
              await card(others[0]);
              await card(others[1]);
            } else {
              await card(others[0]);
              await card(others[1] ?? others[0]);
            }
            assert.deepEqual(await counts(), [2, 1]);
            if (level === 3) await screenshot('rhyme-time-3-hint');
            if (level === 4) await screenshot('rhyme-time-4-hint');
            if (level === 8) await screenshot('rhyme-time-8-hint');
            if (level === 9) await screenshot('rhyme-time-9-hint-portrait');
          }
          for (const w of q.answer) await card(w);
        }
        await finished('rhyme-time');
        assert.deepEqual(await score('rhyme-time'), [2, 1]);
        log(
          `Rhyme Time ${level} (${mode}): picture cards tapped, non-rhymes as misses, glowing hint, saved score and sticker passed`,
        );
      }

    // Level 10, Rhyme baskets (school only): drag pictures into baskets by rhyme; a wrong basket, a free drop on empty grass, a second wrong basket for the glow.
    if ((!only || only === 'rhyme') && fromLevel <= 10 && Number(process.env.TO_LEVEL || 99) >= 10) {
      await page.setViewportSize({ width: 768, height: 1024 });
      await launch('rhyme-time', 10, 'Mia', 'school');
      assert.equal(await page.evaluate(() => neo.scene.game.plan.mode), 'baskets');
      const settle = async () => {
        await page.waitForTimeout(200);
        await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
          timeout: 20000,
        });
        await page.waitForTimeout(380);
      };
      // The next picture, the basket it rhymes with, and the basket after that (a wrong one).
      const nextMove = () =>
        page.evaluate(() => {
          const g = neo.scene.game;
          const t = g.autotouch();
          const right = g.baskets.findIndex((b) => b.node === t.to.on);
          return { word: g.cards.find((c) => c.node === t.drag.on).word, right, wrong: (right + 1) % 3 };
        });
      const drop = async (word, basket) => {
        await page.evaluate(
          ({ word, basket }) => {
            const g = neo.scene.game;
            return kit.dragTo(
              g.cards.find((c) => c.word === word).node,
              g.baskets[basket].node.getGlobalPosition(),
              14,
            );
          },
          { word, basket },
        );
        await settle();
      };
      for (let n = 0; n < 2; n++) {
        await idle(n);
        if (n === 0) {
          const m = await nextMove();
          await drop(m.word, m.wrong);
          assert.deepEqual(await counts(), [1, 0]);
          // A drop on the grass beside its slot floats home for free.
          await page.evaluate((word) => {
            const c = neo.scene.game.cards.find((x) => x.word === word).node;
            const p = c.getGlobalPosition();
            return kit.drag(kit.line([p.x, p.y], [p.x + 60, p.y + 20], 8));
          }, m.word);
          await settle();
          assert.deepEqual(await counts(), [1, 0]);
          await drop(m.word, m.wrong);
          assert.deepEqual(await counts(), [2, 1]);
          assert.equal(
            await page.evaluate(() => neo.scene.game.baskets.indexOf(neo.scene.game.basketGlow?.basket)),
            m.right,
          );
          await screenshot('rhyme-time-10-hint');
        }
        for (
          let k = 0;
          k < 6 && (await page.evaluate((n) => neo.scene.game.index === n && !neo.scene.finished, n));
          k++
        ) {
          const m = await nextMove();
          await drop(m.word, m.right);
        }
      }
      await finished('rhyme-time');
      assert.deepEqual(await score('rhyme-time'), [2, 1]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log(
        'Rhyme Time 10 (baskets): pictures dragged into rhyme baskets, a wrong basket as a miss, a free drop, the glowing basket, two trays, saved score and sticker passed',
      );
    }

    if (!only || only === 'bonds')
      for (const level of [10, 11]) {
        await launch('bubble-pop', level);
        await page.waitForTimeout(600);
        // The total the pairs make is on a sign at the top, above where any bubble can drift, and takes no touches.
        assert.deepEqual(
          await page.evaluate(() => {
            const g = neo.scene.game;
            return [
              g.sign.parent === g.backdrop.parent,
              g.sign.eventMode,
              g.sign.y + g.sign.height <= 110,
              g.sign.x === g.view.w / 2,
            ];
          }),
          [true, 'none', true, true],
          `bubbles ${level}: sign`,
        );
        // Tap a drifting bubble where it is now.
        const pop = async (i) => {
          await page.evaluate((i) => kit.tapOn(neo.scene.game.bubbles[i]), i);
          await page.waitForTimeout(330);
        };
        const live = () =>
          page.evaluate(() =>
            neo.scene.game.bubbles
              .map((b, i) => ({ i, n: b.number, popped: b.popped, rainbow: b.rainbow }))
              .filter((b) => !b.popped && !b.rainbow),
          );
        const sum = await page.evaluate(() => neo.scene.game.plan.sum);
        for (let k = 0; k < 2; k++) {
          const bs = await live();
          const a = bs[0];
          const b = bs.find((x) => x.i !== a.i && x.n + a.n !== sum);
          await pop(a.i);
          await pop(b.i);
        }
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 1]);
        await screenshot(`bubble-pop-${level}-hint`);
        for (let k = 0; k < 12; k++) {
          const bs = await live();
          if (!bs.length) break;
          const a = bs[0];
          const b = bs.find((x) => x.i !== a.i && x.n + a.n === sum);
          await pop(a.i);
          await pop(b.i);
          await page.waitForTimeout(200);
        }
        // The rainbow bubble floats up at the end: pop it.
        await page.waitForFunction(() => neo.scene.game.bubbles.some((b) => b.rainbow && !b.popped), null, {
          timeout: 15000,
        });
        await page.waitForTimeout(1400);
        await page.evaluate(() => kit.tapOn(neo.scene.game.bubbles.find((b) => b.rainbow)));
        await finished('bubble-pop');
        assert.deepEqual(await score('bubble-pop'), [2, 1]);
        log(
          `Bubble Pop ${level}: pairs that make ${sum} popped together, wrong pairs as misses, glowing pair hint, rainbow bubble, saved score and sticker passed`,
        );
      }

    if (!only || only === 'go')
      for (const level of [1, 2, 3, 4, 5, 6, 9].filter((l) => l >= fromLevel)) {
        await launch('stop-and-go', level);
        const mode = await page.evaluate(() => neo.scene.game.plan.mode);
        const lightIs = (l) =>
          page.waitForFunction((l) => neo.scene.game.light.light === l, l, { timeout: 15000 });
        await page.waitForTimeout(500);
        if (mode === 'lamps') {
          // Lap level 9: one big lamp; a touch anywhere turns it (green sets the looping car rolling, red brakes it), the
          // car toots; eight touches and no miss. Touches land on the sky, the lamp and the grass, not the top centre (the tip card).
          const rolling = () => page.evaluate(() => neo.scene.game.rolling);
          const lampIs = () => page.evaluate(() => neo.scene.game.lamp.lamp);
          const anywhere = (k) =>
            page.evaluate((k) => {
              const at = [
                [0.88, 0.45],
                [0.12, 0.3],
                [0.7, 0.92],
              ][k % 3];
              kit.tap(innerWidth * at[0], innerHeight * at[1]);
            }, k);
          assert.equal(await lampIs(), 'red', 'the lamp starts red with the car still');
          await anywhere(0);
          await page.waitForTimeout(500);
          assert.equal(await rolling(), true, 'a touch on the sky turns it green and sets the car going');
          assert.equal(await lampIs(), 'green');
          const x0 = await page.evaluate(() => neo.scene.game.cars[0].x);
          await page.waitForTimeout(400);
          assert.notEqual(await page.evaluate(() => neo.scene.game.cars[0].x), x0, 'the car moves on green');
          await tap('neo.scene.game.lamp');
          await page.waitForTimeout(500);
          assert.equal(await rolling(), false, 'a touch on the lamp turns it red and stops the car');
          assert.equal(await lampIs(), 'red');
          await tap('neo.scene.game.cars[0]');
          await page.waitForTimeout(350);
          assert.equal(await rolling(), false, 'the car toots and does not turn the lamp');
          assert.equal(
            await page.evaluate(() => neo.scene.game.done),
            3,
            'the background, the lamp and the car count',
          );
          await screenshot('stop-and-go-9');
          for (let k = 0; k < 5; k++) {
            await anywhere(k + 1);
            await page.waitForTimeout(350);
          }
        } else if (mode === 'toy') {
          // The car answers too: a tap on it counts as one of the eight touches.
          await tap('neo.scene.game.cars[0]');
          await page.waitForTimeout(300);
          assert.equal(
            await page.evaluate(() => neo.scene.game.done),
            1,
            'a car tap counts at the toy level',
          );
          for (let k = 0; k < 7; k++) {
            await tap('neo.scene.game.light');
            await page.waitForTimeout(260);
          }
        } else if (mode === 'lanes') {
          // Whose light? Each vehicle answers only to its own lane's light: a send on its own red is a miss, whatever the other light shows.
          const lightOf = (lane) => `neo.scene.game.${lane === 'car' ? 'light' : 'light2'}.light`;
          await page.waitForFunction(() => neo.scene.game.light.light === 'red', null, { timeout: 15000 });
          await page.waitForTimeout(300);
          await tap(`neo.scene.game.cars.find((c) => c.lane === 'car')`);
          await page.waitForTimeout(450);
          await tap(`neo.scene.game.cars.find((c) => c.lane === 'car')`);
          assert.deepEqual(await counts(), [2, 1]);
          await screenshot('stop-and-go-5');
          for (let k = 0; k < 60 && !(await page.evaluate(() => neo.scene.game.finished)); k++) {
            const lane = await page.evaluate(() =>
              neo.scene.game.light.light === 'green'
                ? 'car'
                : neo.scene.game.light2.light === 'green'
                  ? 'bike'
                  : '',
            );
            if (!lane) {
              await page.waitForTimeout(150);
              continue;
            }
            await tap(`neo.scene.game.cars.find((c) => c.lane === '${lane}')`);
            await page.waitForTimeout(650);
          }
        } else if (mode === 'busy') {
          // Busy crossing: cars arrive with clouds; both roads green is the one miss; then hand the roads over by the ghost hand's rule.
          await page.waitForFunction(() => neo.scene.game.cars.length >= 2, null, { timeout: 15000 });
          assert.ok(
            await page.evaluate(() => neo.scene.game.cars[0].children.length > 1),
            'a waiting car shows its thought cloud',
          );
          await tap('neo.scene.game.light');
          await page.waitForTimeout(350);
          for (let k = 0; k < 3; k++) {
            await tap('neo.scene.game.light2');
            await page.waitForTimeout(400);
          }
          assert.deepEqual(await counts(), [2, 1], 'both roads green twice');
          await tap('neo.scene.game.light2');
          await page.waitForTimeout(300);
          await screenshot('stop-and-go-6');
          for (let k = 0; k < 150 && !(await page.evaluate(() => neo.scene.game.finished)); k++) {
            const w = await page.evaluate(() => {
              const i = neo.scene.game.autotouch();
              return i && i.tap ? (i.tap.on === neo.scene.game.light ? 1 : 2) : 0;
            });
            if (w) await tap(w === 1 ? 'neo.scene.game.light' : 'neo.scene.game.light2');
            await page.waitForTimeout(450);
          }
        } else if (mode === 'send' || mode === 'walk') {
          const act = mode === 'send' ? 'neo.scene.game.cars[0]' : 'neo.scene.game.step';
          // Going on red: two gentle misses, then the light glows when it turns green.
          await lightIs('red');
          await page.waitForTimeout(300);
          await tap(act);
          await page.waitForTimeout(450);
          await tap(act);
          assert.deepEqual(await counts(), [2, 1]);
          if (mode === 'send') {
            // A car further back only toots: neither a send nor a miss.
            await tap('neo.scene.game.cars[1]');
            await page.waitForTimeout(300);
            assert.deepEqual(await counts(), [2, 1], 'a back car is not a miss');
          }
          // The glow sits on the thing to touch, once the light is green.
          await lightIs('green');
          await page.waitForTimeout(100);
          assert.ok(
            await page.evaluate((send) => {
              const g = neo.scene.game.glow.getBounds(),
                b = (send ? neo.scene.game.cars[0] : neo.scene.game.step).getBounds();
              return g.width > 0 && Math.abs(g.x + g.width / 2 - (b.x + b.width / 2)) < 20;
            }, mode === 'send'),
            'the hint glows on the car or the feet on green',
          );
          // The game's own flag: the light stops once the round's ending begins.
          for (let k = 0; k < 40 && !(await page.evaluate(() => neo.scene.game.finished)); k++) {
            await lightIs('green');
            await tap(act);
            await page.waitForTimeout(450);
          }
          if (level === 3) await screenshot('stop-and-go-3');
        } else {
          await tap('neo.scene.game.light');
          await page.waitForTimeout(350);
          for (let k = 0; k < 3; k++) {
            await tap('neo.scene.game.light2');
            await page.waitForTimeout(400);
          }
          assert.deepEqual(await counts(), [2, 1], 'both roads green twice');
          await tap('neo.scene.game.light2');
          await page.waitForTimeout(300);
          await page.waitForFunction(() => !neo.scene.game.cars.some((c) => c.road === 'ew'), null, {
            timeout: 15000,
          });
          await tap('neo.scene.game.light');
          await page.waitForTimeout(350);
          await tap('neo.scene.game.light2');
          await screenshot('stop-and-go-4');
        }
        await finished('stop-and-go');
        assert.deepEqual(await score('stop-and-go'), mode === 'toy' || mode === 'lamps' ? [0, 0] : [2, 1]);
        log(
          `Stop and Go ${level} (${mode}): ${mode === 'lamps' ? 'one big lamp turned by a touch anywhere (sky, lamp, grass) and the car tooting, eight touches and no miss' : mode === 'toy' ? 'the light as a toy' : 'the light cycling or switched by hand'}, waiting for green, going on red as a miss, glow hint, saved score and sticker passed`,
        );
      }

    if (!only || only === 'ramp')
      for (let level = fromLevel; level <= Number(process.env.TO_LEVEL || 7); level++) {
        await launch('ramp-race', level);
        const mode = await page.evaluate(() => neo.scene.game.plan.mode);
        const settle = async () => {
          await page.waitForTimeout(250);
          await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
            timeout: 20000,
          });
          await page.waitForTimeout(150);
        };
        // Tap the ramp to change its height, the floor to change its surface (inside each one's touch area).
        const touch = async (lane, what) => {
          await page.evaluate(
            ({ lane, what }) => {
              const l = neo.scene.game.lanes[lane];
              const p =
                what === 'ramp'
                  ? l.toGlobal({ x: l.rampEnd - 130, y: l.floorY - 30 })
                  : l.toGlobal({ x: l.rampEnd + 120, y: l.floorY + 17 });
              kit.tap(p.x, p.y);
            },
            { lane, what },
          );
          await page.waitForTimeout(320);
        };
        const setTo = async (lane, setup) => {
          for (
            let k = 0;
            k < 3 &&
            (await page.evaluate((lane) => neo.scene.game.lanes[lane].setup.height, lane)) !== setup.height;
            k++
          )
            await touch(lane, 'ramp');
          for (
            let k = 0;
            k < 3 &&
            (await page.evaluate((lane) => neo.scene.game.lanes[lane].setup.floor, lane)) !== setup.floor;
            k++
          )
            await touch(lane, 'floor');
          assert.deepEqual(await page.evaluate((lane) => neo.scene.game.lanes[lane].setup, lane), setup);
        };
        const go = async () => {
          await tap('neo.scene.game.go');
          await settle();
        };
        if (mode === 'tell') {
          const tile = async (claim) => {
            await page.evaluate((claim) => {
              const g = neo.scene.game;
              const t = g.tiles[['floor', 'height', 'both'].indexOf(claim)];
              const p = t.toGlobal({ x: 100, y: 75 });
              kit.tap(p.x, p.y);
            }, claim);
            await page.waitForTimeout(300);
          };
          const truth = () =>
            page.evaluate(async () => {
              const R = await import('/src/games/ramp-race/logic.ts');
              const [a, b] = neo.scene.game.records;
              return R.changed(a.setup, b.setup);
            });
          const kinds = [];
          await page.evaluate(() => {
            const g = neo.scene.game,
              say = g.ctx.say,
              instruct = g.ctx.instruct;
            g.spoken = [];
            g.ctx.say = (id, ...args) => {
              g.spoken.push(id);
              return say(id, ...args);
            };
            g.ctx.instruct = (id, ...args) => {
              g.spoken.push(id);
              return instruct(id, ...args);
            };
          });
          for (let n = 0; n < 2; n++) {
            await idle(n);
            assert.deepEqual(
              await page.evaluate(() => [
                neo.scene.game.step,
                neo.scene.game.lanes.map((l) => l.visible),
                neo.scene.game.tiles.map((t) => t.visible),
                neo.scene.game.cards.length,
              ]),
              ['claim', [false, false], [true, true, true], 2],
            );
            const actual = await truth();
            kinds.push(actual === 'both' ? 'confounded' : 'controlled');
            const wrong = ['floor', 'height', 'both'].filter((c) => c !== actual);
            if (n === 0) {
              // Go with nothing chosen is a nudge; choosing and changing tiles, and the lanes' controls, are free.
              await go();
              assert.equal(await page.evaluate(() => neo.scene.game.spoken.at(-1)), 'ramp.tell.pick');
              await tile(wrong[0]);
              await tile(wrong[1]);
              await touch(1, 'ramp');
              assert.deepEqual(await counts(), [0, 0]);
              await page.setViewportSize({ width: 768, height: 1024 });
              await page.waitForTimeout(400);
              await screenshot('ramp-race-7-tiles-portrait');
              await page.setViewportSize({ width: 1024, height: 768 });
              await page.waitForTimeout(400);
              await go();
              assert.deepEqual(await counts(), [1, 0]);
              assert.ok((await page.evaluate(() => neo.scene.game.spoken.at(-1))).startsWith('ramp.why.'));
              await tile(wrong[0]);
              await go();
              assert.deepEqual(await counts(), [2, 1]);
              assert.equal(await page.evaluate(() => neo.scene.game.claimGlow), true);
              assert.equal(await page.evaluate(() => neo.scene.game.spoken.at(-1)), 'ramp.tell.hint');
            }
            await tile(actual);
            await go();
            if (actual === 'both') {
              assert.deepEqual(
                await page.evaluate(() => [
                  neo.scene.game.step,
                  neo.scene.game.lanes.map((l) => l.visible),
                  neo.scene.game.tiles.map((t) => t.visible),
                ]),
                ['repair', [true, true], [false, false, false]],
              );
              const before = await counts();
              // Lane A is locked; a Check on lanes still different in both is a miss.
              await touch(0, 'ramp');
              assert.equal(await page.evaluate(() => neo.scene.game.spoken.at(-1)), 'ramp.keepblue');
              await go();
              assert.deepEqual(await counts(), [before[0] + 1, before[1]]);
              assert.equal(await page.evaluate(() => neo.scene.game.spoken.at(-1)), 'ramp.unfair.tell');
              for (let k = 0; k < 4; k++) {
                const fix = await page.evaluate(async () => {
                  const R = await import('/src/games/ramp-race/logic.ts');
                  const [a, b] = neo.scene.game.lanes;
                  return R.tellRepair(a.setup, b.setup);
                });
                if (!fix) break;
                await touch(1, fix);
              }
              const cardA = await page.evaluate(() => neo.scene.game.records[0].setup);
              await go();
              assert.deepEqual(
                await page.evaluate(() => [
                  neo.scene.game.step,
                  neo.scene.game.records[0].setup,
                  neo.scene.game.records[1].setup,
                  neo.scene.game.cards.length,
                ]),
                ['claim', cardA, await page.evaluate(() => neo.scene.game.lanes[1].setup), 2],
                'card B is the repaired roll; card A stays',
              );
              const now = await truth();
              assert.notEqual(now, 'both');
              await tile(now);
              await go();
            }
          }
          assert.deepEqual(kinds.sort(), ['confounded', 'controlled']);
          assert.deepEqual(
            await page.evaluate(async () => {
              const { tally } = await import('/src/games/ramp-race/logic.ts');
              const g = neo.scene.game;
              const t = g.events.map(tally);
              return [t.reduce((s, x) => s + x.misses, 0), t.reduce((s, x) => s + x.hints, 0)];
            }),
            await counts(),
          );
        } else if (mode === 'change') {
          const card = async (k) => {
            await page.evaluate((k) => {
              const c = neo.scene.game.cards[k];
              const p = c.toGlobal({ x: 230, y: 52 });
              kit.tap(p.x, p.y);
            }, k);
            await settle();
          };
          for (let n = 0; n < 2; n++) {
            await idle(n);
            const compare = await page.evaluate(() => neo.scene.game.questions[neo.scene.game.index].compare);
            assert.deepEqual(await page.evaluate(() => neo.scene.game.lanes[0].setup), {
              height: 3,
              floor: 'wood',
            });
            // Blue stays locked on both controls, and orange starts confounded.
            await touch(0, 'ramp');
            await touch(0, 'floor');
            assert.deepEqual(await page.evaluate(() => neo.scene.game.lanes[0].setup), {
              height: 3,
              floor: 'wood',
            });
            if (n === 0) {
              assert.deepEqual(await counts(), [0, 0]);
              await go();
              assert.deepEqual(await counts(), [1, 0]);
              await go();
              assert.deepEqual(await counts(), [2, 1]);
              await go();
              assert.deepEqual(await counts(), [3, 1], 'setup help counts once');
              assert.ok(await page.evaluate(() => neo.scene.game.fairGlow));
              // Identical lanes are a free nudge; editing does not count.
              await setTo(1, { height: 3, floor: 'wood' });
              await go();
              assert.deepEqual(await counts(), [3, 1]);
            }
            const target =
              compare === 'floor'
                ? { height: 3, floor: n === 0 ? 'carpet' : 'ice' }
                : { height: n === 0 ? 2 : 4, floor: 'wood' };
            await setTo(1, target);
            await go();
            assert.deepEqual(
              await page.evaluate(() => [
                neo.scene.game.records.length,
                neo.scene.game.phase,
                neo.scene.game.sign.visible,
                neo.scene.game.fairGlow,
              ]),
              [2, 'ask', false, false],
            );
            const right = await page.evaluate(() => {
              const [a, b] = neo.scene.game.records;
              return b.stop > a.stop ? 1 : 0;
            });
            // Controls and go cannot mutate the evidence while the cards ask.
            await touch(1, 'ramp');
            await touch(1, 'floor');
            await go();
            assert.deepEqual(await page.evaluate(() => neo.scene.game.lanes[1].setup), target);
            if (n === 0) {
              await card(1 - right);
              assert.deepEqual(await counts(), [4, 1]);
              await card(1 - right);
              assert.deepEqual(await counts(), [5, 2]);
              await card(1 - right);
              assert.deepEqual(await counts(), [6, 2], 'reading help counts once');
              assert.ok(await page.evaluate(() => neo.scene.game.ring));
              await page.setViewportSize({ width: 768, height: 1024 });
              await page.waitForTimeout(400);
              await screenshot('ramp-race-6-cards-portrait');
              await page.setViewportSize({ width: 1024, height: 768 });
              await page.waitForTimeout(400);
              assert.deepEqual(
                await page.evaluate(async () => {
                  const { tally } = await import('/src/games/ramp-race/logic.ts');
                  const g = neo.scene.game;
                  const t = g.events.map(tally);
                  return [t.reduce((s, x) => s + x.misses, 0), t.reduce((s, x) => s + x.hints, 0)];
                }),
                await counts(),
              );
            }
            await card(right);
          }
        } else if (mode === 'shelf') {
          const card = async (k) => {
            await page.evaluate((k) => {
              const c = neo.scene.game.cards[k];
              const p = c.toGlobal({ x: 230, y: 52 });
              kit.tap(p.x, p.y);
            }, k);
            await settle();
          };
          const right = () =>
            page.evaluate(() => {
              const [a, b] = neo.scene.game.records;
              return b.stop > a.stop ? 1 : 0;
            });
          for (let n = 0; n < 2; n++) {
            await idle(n);
            if (n === 0) {
              await page.evaluate(() => {
                const g = neo.scene.game,
                  say = g.ctx.say,
                  instruct = g.ctx.instruct;
                g.spoken = [];
                g.ctx.say = (id, ...args) => {
                  g.spoken.push(id);
                  return say(id, ...args);
                };
                g.ctx.instruct = (id, ...args) => {
                  g.spoken.push(id);
                  return instruct(id, ...args);
                };
              });
              // The ramp is locked until the first card lands: a nudge, and the height stays.
              const start = await page.evaluate(() => neo.scene.game.lanes[0].setup.height);
              await touch(0, 'ramp');
              assert.equal(
                await page.evaluate(() => neo.scene.game.lanes[0].setup.height),
                start,
                'locked before the first card',
              );
              assert.equal(await page.evaluate(() => neo.scene.game.spoken.at(-1)), 'ramp.shelf.first');
              await go();
              assert.deepEqual(
                await page.evaluate(() => [neo.scene.game.records.length, neo.scene.game.phase]),
                [1, 'change'],
              );
              // The same ramp again: a nudge, nothing rolls, nothing counts.
              await go();
              assert.equal(await page.evaluate(() => neo.scene.game.spoken.at(-1)), 'ramp.shelf.same');
              assert.deepEqual(await counts(), [0, 0]);
              await touch(0, 'ramp');
              // A guess on the side the taller-goes-farther rule says, placed in the guess zone.
              await page.evaluate(async () => {
                const R = await import('/src/games/ramp-race/logic.ts');
                const g = neo.scene.game;
                const side = g.lanes[0].setup.height > g.records[0].setup.height ? 'past' : 'before';
                const z = R.shelfLayout(neo.view, g.records[0].stop).guess[side];
                const p = g.guessHit.toGlobal({ x: z.x + z.w / 2, y: g.lanes[0].floorY - 40 });
                kit.tap(p.x, p.y);
              });
              await page.waitForTimeout(250);
              assert.ok(await page.evaluate(() => !!neo.scene.game.guess), 'a paw is placed');
              await go();
              assert.ok(
                (await page.evaluate(() => neo.scene.game.spoken)).includes('ramp.guess.right'),
                'the guess is told, never counted',
              );
              assert.deepEqual(
                await page.evaluate(() => [
                  neo.scene.game.records.length,
                  neo.scene.game.phase,
                  neo.scene.game.records[1].guess !== undefined,
                ]),
                [2, 'ask', true],
              );
              await page.setViewportSize({ width: 768, height: 1024 });
              await page.waitForTimeout(400);
              await screenshot('ramp-race-5-cards-portrait');
              await page.setViewportSize({ width: 1024, height: 768 });
              await page.waitForTimeout(400);
              // Two wrong cards: two misses, then the ring on the farther card as one hint.
              const r = await right();
              await card(1 - r);
              assert.deepEqual(await counts(), [1, 0]);
              await card(1 - r);
              assert.deepEqual(await counts(), [2, 1]);
              assert.ok(await page.evaluate(() => neo.scene.game.ring), 'the farther card rings');
              assert.equal(await page.evaluate(() => neo.scene.game.spoken.at(-1)), 'ramp.shelf.hint');
              await card(r);
            } else {
              await go();
              await touch(0, 'ramp');
              await go();
              await card(await right());
            }
          }
        } else if (mode === 'explore') {
          for (let k = 0; k < 4; k++) {
            await touch(0, 'ramp');
            await go();
          }
        } else if (mode === 'height' || mode === 'both') {
          for (let n = 0; n < 3; n++) {
            await idle(n);
            const { star, ways, setup } = await page.evaluate(async (mode) => {
              const R = await import('/src/games/ramp-race/logic.ts');
              const g = neo.scene.game;
              const star = g.stars[g.index];
              return {
                star,
                ways: R.waysTo(star, mode === 'height' ? ['wood'] : R.FLOORS),
                setup: g.lanes[0].setup,
              };
            }, mode);
            if (n === 0) {
              // Make sure the first two rolls miss the star, then roll twice.
              if (ways.some((w) => w.height === setup.height && w.floor === setup.floor))
                await touch(0, 'ramp');
              await go();
              await go();
              assert.deepEqual(await counts(), [2, 1]);
              if (level === 3) await screenshot('ramp-race-3-hint');
            }
            await setTo(0, ways[0]);
            await go();
          }
        } else {
          for (let n = 0; n < 3; n++) {
            await idle(n);
            const compare = await page.evaluate(() => neo.scene.game.questions[neo.scene.game.index].compare);
            if (n === 0) {
              await page.evaluate(() => {
                const g = neo.scene.game,
                  say = g.ctx.say;
                g.spoken = [];
                g.ctx.say = (id, ...args) => {
                  g.spoken.push(id);
                  return say(id, ...args);
                };
              });
              // Change both things on the second lane: not a fair test. Then only the wrong thing: a miss that names what
              // actually changed, and the second unfair Check turns on the corrective glow (lane B's part to change).
              await setTo(1, { height: 4, floor: 'ice' });
              await go();
              await setTo(
                1,
                compare === 'floor' ? { height: 2, floor: 'wood' } : { height: 3, floor: 'carpet' },
              );
              await go();
              assert.deepEqual(await counts(), [2, 1]);
              assert.deepEqual(
                await page.evaluate(() => neo.scene.game.spoken.slice(-3)),
                [`ramp.unfair.${compare}`, `ramp.wrong.${compare}`, 'ramp.fairhint'],
                'the kind lines, then the glow announced once',
              );
              assert.deepEqual(
                await page.evaluate(async () => {
                  const R = await import('/src/games/ramp-race/logic.ts');
                  const g = neo.scene.game;
                  return [g.fairGlow, R.fairRepair(g.questions[g.index], g.lanes[0].setup, g.lanes[1].setup)];
                }),
                [true, compare === 'floor' ? 'ramp' : 'floor'],
                'the glow points at the thing to match',
              );
              await screenshot('ramp-race-4');
              // A third unfair Check counts a hint but never re-announces the glow.
              await go();
              assert.deepEqual(await counts(), [3, 2]);
              assert.equal(await page.evaluate(() => neo.scene.game.spoken.at(-1)), `ramp.wrong.${compare}`);
            }
            await setTo(0, { height: 3, floor: 'wood' });
            await setTo(1, compare === 'floor' ? { height: 3, floor: 'ice' } : { height: 4, floor: 'wood' });
            if (n === 0)
              assert.deepEqual(
                await page.evaluate(async () => {
                  const R = await import('/src/games/ramp-race/logic.ts');
                  const g = neo.scene.game;
                  return [g.fairGlow, R.fairRepair(g.questions[g.index], g.lanes[0].setup, g.lanes[1].setup)];
                }),
                [true, null],
                'a repaired pair rings the go button',
              );
            await go();
            if (n === 0)
              assert.equal(
                await page.evaluate(() => neo.scene.game.fairGlow),
                false,
                'next question clears the glow',
              );
          }
        }
        await finished('ramp-race');
        assert.deepEqual(
          await score('ramp-race'),
          mode === 'explore'
            ? [0, 0]
            : mode === 'tell'
              ? [3, 1]
              : mode === 'change'
                ? [6, 2]
                : mode === 'fair'
                  ? [3, 2]
                  : [2, 1],
        );
        log(
          `Ramp Race ${level} (${mode}): ramps and floors changed by tapping, rolls, ${mode === 'tell' ? 'free tiles and nudge, two wrong claims and the tile glow, locked blue lane, a confounded repair miss, the fair repair replacing card B, Check-only accounting' : mode === 'change' ? 'locked blue control, confounded repairs, Check-only misses and capped hints, inert lanes during reading' : mode === 'shelf' ? 'locked first ramp, same-height nudge, free guess, two wrong cards and the ring' : mode === 'fair' ? 'unfair tests as misses' : mode === 'explore' ? 'free exploring' : 'short and long rolls as misses, ghost-ramp hint'}, saved score and sticker passed`,
        );
      }

    if (!only || only === 'sort')
      for (let level = fromLevel; level <= Number(process.env.TO_LEVEL || 5); level++) {
        await launch('critter-sort', level);
        const { mode, rounds } = await page.evaluate(() => neo.scene.game.plan);
        const settle = async () => {
          await page.waitForTimeout(250);
          await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
            timeout: 20000,
          });
          await page.waitForTimeout(250);
        };
        // Drag a critter (it rides above the finger) so its feet land on a spot in a part of the diagram.
        const dropTo = async (i, place) => {
          await page.evaluate(
            async ({ i, place }) => {
              const g = neo.scene.game;
              const s = g.sorters[i];
              const p = g.spotFor(place);
              await kit.dragTo(s.node, g.ctx.stage.toGlobal({ x: p.x, y: p.y + 40 }), 14);
            },
            { i, place },
          );
          await settle();
        };
        for (let n = 0; n < rounds; n++) {
          await idle(n);
          if (mode === 'guess') {
            const { right, options } = await page.evaluate(() => {
              const g = neo.scene.game;
              return { right: g.round.rules[0], options: g.round.options };
            });
            if (n === 0) {
              for (const o of options.filter((o) => o !== right)) {
                await tap(`neo.scene.game.options.find((x) => x.rule === '${o}').node`);
                await settle();
              }
              assert.deepEqual(await counts(), [2, 1]);
              await screenshot('critter-sort-4');
            }
            await tap(`neo.scene.game.options.find((x) => x.rule === '${right}').node`);
            await settle();
            continue;
          }
          if (level === 8) {
            const original = await page.evaluate(() => {
              const g = neo.scene.game;
              window.sortEightNodes = g.sorters.map((s) => s.node);
              return { critters: g.round.critters, rule: g.round.rules[0] };
            });
            for (let pass = 0; pass < 2; pass++) {
              const places = await page.evaluate(async () => {
                const L = await import('/src/games/critter-sort/logic.ts');
                const g = neo.scene.game;
                return g.sorters.map((s) => L.placeOf(s.c, g.round.rules));
              });
              assert.ok(places.includes('left') && places.includes('out'));
              assert.equal(
                await page.evaluate(() =>
                  neo.scene.game.sorters.every(
                    (s, i) => s.node === window.sortEightNodes[i] && !s.placed && s.drag.enabled,
                  ),
                ),
                true,
              );
              if (pass === 0) {
                const outsider = places.indexOf('out');
                await page.evaluate(async (i) => {
                  const g = neo.scene.game;
                  await kit.dragTo(
                    g.sorters[i].node,
                    g.ctx.stage.toGlobal({ x: neo.view.w / 2, y: neo.view.h - 5 }),
                    14,
                  );
                }, outsider);
                await settle();
                assert.deepEqual(await counts(), [0, 0]);
                await dropTo(outsider, 'left');
                await dropTo(outsider, 'left');
                assert.deepEqual(await counts(), [2, 1]);
                assert.equal(
                  await page.evaluate((i) => neo.scene.game.hinting === neo.scene.game.sorters[i], outsider),
                  true,
                );
              } else {
                assert.deepEqual(await page.evaluate(() => neo.scene.game.round.critters), original.critters);
                assert.notEqual(await page.evaluate(() => neo.scene.game.round.rules[0]), original.rule);
                await screenshot('critter-sort-8-new-sign');
                await page.setViewportSize({ width: 768, height: 1024 });
                await page.waitForTimeout(400);
                await screenshot('critter-sort-8-portrait');
              }
              for (const [i, place] of places.entries()) if (place === 'left') await dropTo(i, place);
              assert.equal(
                await page.evaluate(
                  (pass) => !neo.scene.game.busy && neo.scene.game.pass === pass && !neo.scene.game.finished,
                  pass,
                ),
                true,
              );
              for (const [i, place] of places.entries()) if (place === 'out') await dropTo(i, place);
              if (pass === 0) {
                assert.equal(await page.evaluate(() => neo.scene.game.pass), 1);
                assert.equal(await page.evaluate(() => neo.scene.game.finished), false);
              }
            }
            continue;
          }
          if (level === 11) {
            const countTap = async (i) => {
              await page.evaluate((i) => {
                const p = neo.scene.game.sorters[i].node.toGlobal({ x: 0, y: -120 });
                kit.tap(p.x, p.y);
              }, i);
              await settle();
            };
            const data = await page.evaluate(async () => {
              const L = await import('/src/games/critter-sort/logic.ts');
              const g = neo.scene.game;
              const totals = L.countParts(g.round.critters, g.round.rules);
              return {
                places: g.sorters.map((s) => L.placeOf(s.c, g.round.rules)),
                totals,
                right: L.morePart(totals),
              };
            });
            assert.deepEqual(Object.values(data.totals).sort(), [1, 2, 3]);
            // Sorting remains required; no sticker or comparison until the mat is sorted too.
            for (const [i, place] of data.places.entries()) if (place !== 'out') await dropTo(i, place);
            assert.equal(await page.evaluate(() => neo.scene.game.counting), false);
            for (const [i, place] of data.places.entries()) if (place === 'out') await dropTo(i, place);
            assert.equal(
              await page.evaluate(() => neo.scene.game.counting && !neo.scene.game.finished),
              true,
            );
            assert.equal(await page.evaluate(() => neo.scene.game.sorters.every((s) => !s.drag)), true);
            for (let i = 0; i < data.places.length; i++) {
              await countTap(i);
            }
            assert.deepEqual(
              await page.evaluate(() => {
                const g = neo.scene.game;
                return Object.fromEntries(
                  ['left', 'right', 'out'].map((p) => [
                    p,
                    [...g.counted.keys()].filter((s) => s.placed === p).length,
                  ]),
                );
              }),
              data.totals,
            );
            await countTap(0);
            assert.equal(await page.evaluate(() => neo.scene.game.counted.size), 6);
            assert.deepEqual(await counts(), n === 0 ? [0, 0] : [2, 1]);
            if (n === 0) {
              const wrong = Object.keys(data.totals).find((p) => p !== data.right);
              await tap(`neo.scene.game.comparisons.find(o => o.place === '${wrong}').node`);
              await settle();
              await tap(`neo.scene.game.comparisons.find(o => o.place === '${wrong}').node`);
              await settle();
              assert.deepEqual(await counts(), [2, 1]);
              assert.equal(await page.evaluate(() => neo.scene.game.comparisonHint), true);
              await screenshot('critter-sort-11-counts');
              await page.setViewportSize({ width: 768, height: 1024 });
              await page.waitForTimeout(400);
              // Count targets survive resize; replay stays free.
              await countTap(0);
              assert.deepEqual(await counts(), [2, 1]);
              await screenshot('critter-sort-11-portrait');
              await page.setViewportSize({ width: 1024, height: 768 });
              await page.waitForTimeout(300);
            }
            await tap(`neo.scene.game.comparisons.find(o => o.place === '${data.right}').node`);
            await settle();
            continue;
          }
          if (level === 9) {
            const data = await page.evaluate(async () => {
              const L = await import('/src/games/critter-sort/logic.ts');
              const { fits } = await import('/src/learning/sorting/rules.ts');
              const g = neo.scene.game;
              const [a, b] = g.round.rules;
              return {
                places: g.sorters.map((s) => L.placeOf(s.c, g.round.rules, 'butnot')),
                both: g.sorters.findIndex((s) => fits(s.c, a) && fits(s.c, b)),
                neither: g.sorters.findIndex((s) => !fits(s.c, a) && !fits(s.c, b)),
                centers: g.centers().length,
              };
            });
            assert.equal(data.centers, 1);
            assert.ok(data.both >= 0 && data.neither >= 0 && data.places.includes('left'));
            if (n === 0) {
              await page.evaluate(async (i) => {
                const g = neo.scene.game;
                await kit.dragTo(
                  g.sorters[i].node,
                  g.ctx.stage.toGlobal({ x: neo.view.w / 2, y: neo.view.h - 5 }),
                  14,
                );
              }, data.both);
              await settle();
              assert.deepEqual(await counts(), [0, 0]);
              await dropTo(data.both, 'left');
              await dropTo(data.neither, 'left');
              assert.deepEqual(await counts(), [2, 1]);
              assert.equal(
                await page.evaluate(
                  (i) => neo.scene.game.hinting === neo.scene.game.sorters[i],
                  data.neither,
                ),
                true,
              );
              await screenshot('critter-sort-9-hint');
              await page.setViewportSize({ width: 768, height: 1024 });
              await page.waitForTimeout(400);
              await screenshot('critter-sort-9-portrait');
            }
            for (const [i, place] of data.places.entries()) if (place === 'left') await dropTo(i, place);
            assert.equal(
              await page.evaluate(
                (n) => !neo.scene.game.busy && neo.scene.game.index === n && !neo.scene.game.finished,
                n,
              ),
              true,
            );
            for (const [i, place] of data.places.entries()) if (place === 'out') await dropTo(i, place);
            continue;
          }
          const places = await page.evaluate(async () => {
            const L = await import('/src/games/critter-sort/logic.ts');
            const g = neo.scene.game;
            return g.sorters.map((s) =>
              s.placed ? 'example' : L.placeOf(s.c, g.round.rules, g.plan.mode === 'not'),
            );
          });
          if (level === 7) {
            const i = await page.evaluate(() => neo.scene.game.round.newcomer);
            assert.equal(places.filter((p) => p === 'example').length, 5);
            assert.equal(await page.evaluate(() => neo.scene.game.sorters.filter((s) => s.drag).length), 1);
            if (n === 0) {
              await page.evaluate(async (i) => {
                const g = neo.scene.game;
                await kit.dragTo(
                  g.sorters[i].node,
                  g.ctx.stage.toGlobal({ x: neo.view.w / 2, y: neo.view.h - 5 }),
                  14,
                );
              }, i);
              await settle();
              assert.deepEqual(await counts(), [0, 0]);
              const wrong = places[i] === 'left' ? 'right' : 'left';
              await dropTo(i, wrong);
              await dropTo(i, wrong);
              assert.deepEqual(await counts(), [2, 1]);
              assert.equal(
                await page.evaluate((i) => neo.scene.game.hinting === neo.scene.game.sorters[i], i),
                true,
              );
              await screenshot('critter-sort-7-hint');
              await page.setViewportSize({ width: 768, height: 1024 });
              await page.waitForTimeout(400);
              await screenshot('critter-sort-7-portrait');
            }
            await dropTo(i, places[i]);
            continue;
          }
          const mat = ['two', 'venn', 'not'].includes(mode);
          // Worked examples start in their places; one is in every round.
          assert.ok(places.includes('example'));
          if (n === 0) {
            const outsider = places.indexOf('out');
            // Returning a critter to the loose grass costs nothing.
            await page.evaluate(async (i) => {
              const g = neo.scene.game;
              await kit.dragTo(
                g.sorters[i].node,
                g.ctx.stage.toGlobal({ x: neo.view.w / 2, y: neo.view.h - 5 }),
                14,
              );
            }, outsider);
            await settle();
            assert.deepEqual(await counts(), [0, 0]);
            await dropTo(outsider, 'left');
            await dropTo(outsider, 'left');
            assert.deepEqual(await counts(), [2, 1]);
            if (mat)
              assert.equal(
                await page.evaluate((i) => neo.scene.game.hinting === neo.scene.game.sorters[i], outsider),
                true,
              );
            if (level === 3 || level === 5) await screenshot(`critter-sort-${level}-hint`);
            if (level === 12) await screenshot('critter-sort-12-landscape');
            if (level === 3 || level === 13) {
              await page.setViewportSize({ width: 768, height: 1024 });
              await page.waitForTimeout(400);
              await screenshot(level === 13 ? 'critter-sort-13-portrait' : 'critter-sort-neither-portrait');
            }
          }
          for (const [i, place] of places.entries())
            if (place !== 'out' && place !== 'example') await dropTo(i, place);
          if (mat) {
            // Sorting the hoops alone must not silently finish while the outside critters are loose.
            assert.equal(
              await page.evaluate((n) => !neo.scene.game.busy && neo.scene.game.index === n, n),
              true,
            );
            for (const [i, place] of places.entries()) if (place === 'out') await dropTo(i, place);
          }
        }
        await finished('critter-sort');
        assert.deepEqual(await score('critter-sort'), [2, 1]);
        log(
          `Critter Sort ${level} (${mode}): critters dragged into hoops, the middle and the leaf mat where present, bare-grass drops free, wrong places explained as misses, glow hint, ${mode === 'guess' ? 'rules guessed, ' : ''}saved score and sticker passed`,
        );
      }

    if (!only || only === 'pair') {
      await launch('egg-catch', 7);
      const readyPair = async () => {
        await page.waitForFunction(() => neo.scene.game.pairReady || neo.scene.game.finished, null, {
          timeout: 25000,
        });
        await page.waitForTimeout(150);
      };
      await readyPair();
      // The dealt board is unsolved; gates stay frozen until both eggs have rolled.
      for (let k = 0; k < 2; k++) {
        const before = await page.evaluate(() => [...neo.scene.game.gates]);
        await tap('neo.scene.game.goButton');
        await page.waitForTimeout(300);
        await tap('neo.scene.game.gateHits[0]');
        assert.deepEqual(await page.evaluate(() => neo.scene.game.gates), before);
        await readyPair();
      }
      assert.deepEqual(await counts(), [2, 1]);
      await screenshot('egg-catch-7-hint');
      for (let n = 0; n < 3; n++) {
        for (let k = 0; k < 3; k++) {
          const gate = await page.evaluate(async () => {
            const { pairGateToFlip } = await import('/src/games/egg-catch/logic.ts');
            const g = neo.scene.game;
            return pairGateToFlip(g.pairBoards[g.routed], g.gates);
          });
          if (gate === null) break;
          await tap(`neo.scene.game.gateHits[${gate}]`);
          await page.waitForTimeout(300);
        }
        await tap('neo.scene.game.goButton');
        await readyPair();
      }
      await finished('egg-catch');
      assert.deepEqual(await score('egg-catch'), [2, 1]);
      log(
        'Egg Catch 7: unsolved pair retried, rolling gates locked, hint, three pairs and saved result passed',
      );
    }

    if (!only || only === 'predict') {
      await launch('egg-catch', 6);
      for (let k = 0; k < 12; k++) {
        await page.waitForFunction(() => neo.scene.game.waiting || neo.scene.game.finished, null, {
          timeout: 20000,
        });
        if (await page.evaluate(() => neo.scene.game.finished)) break;
        await page.waitForTimeout(200);
        // Say where it will land by tapping a bin: wrong for the first two eggs, then right.
        await page.evaluate(async (k) => {
          const { exitFor } = await import('/src/games/egg-catch/logic.ts');
          const g = neo.scene.game;
          const exit = exitFor(g.gates);
          kit.tapOn(g.exits.children[k < 2 ? (exit + 1) % 4 : exit]);
        }, k);
        await page.waitForTimeout(400);
        if (k === 1) {
          await page.waitForFunction(() => neo.scene.game.waiting, null, { timeout: 20000 });
          assert.deepEqual(await counts(), [2, 1]);
          await screenshot('egg-catch-6-hint');
        }
      }
      await finished('egg-catch');
      assert.deepEqual(await score('egg-catch'), [2, 1]);
      log(
        'Egg Catch 6: locked gates, bins tapped as predictions, wrong guesses as misses, glowing path hint, saved score and sticker passed',
      );
    }

    if (!only || only === 'map')
      for (let level = fromLevel; level <= Math.min(5, Number(process.env.TO_LEVEL || 6)); level++) {
        await launch('treasure-map', level);
        const mode = await page.evaluate(() => neo.scene.game.plan.mode);
        const dig = async (col, row) => {
          await page.evaluate(
            ({ col, row }) => {
              const g = neo.scene.game;
              const p = g.grid.toGlobal(g.cellAt({ col, row }));
              kit.tap(p.x, p.y);
            },
            { col, row },
          );
          await page.waitForTimeout(250);
          await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
            timeout: 20000,
          });
          await page.waitForTimeout(300);
        };
        if (level === 1)
          // U7 R4: a right find's line never holds the next find. `map.found` is stretched to at least 4 s here, so the
          // next find opening sooner shows the line no longer gates it; the last find's line is still heard out.
          await page.evaluate(() => {
            const g = neo.scene.game;
            const say = g.ctx.say.bind(g.ctx);
            g.foundLines = [];
            g.ctx.say = (id, vars) => {
              const line = say(id, vars);
              if (id !== 'map.found') return line;
              const index = g.index;
              const rec = { at: performance.now(), last: index === g.finds.length - 1 };
              g.foundLines.push(rec);
              const watch = () => {
                if (rec.opens !== undefined) return;
                if (g.finished || (g.index !== index && !g.busy)) rec.opens = performance.now() - rec.at;
                else if (performance.now() - rec.at < 10000) requestAnimationFrame(watch);
              };
              void Promise.resolve().then(watch);
              return Promise.all([line, kit.sleep(4000)]).then(() => undefined);
            };
          });
        for (let n = 0; n < 4; n++) {
          await idle(n);
          const { col, row, size } = await page.evaluate(() => ({
            ...neo.scene.game.find.square,
            size: neo.scene.game.plan.size,
          }));
          if (n === 0) {
            // Right column, wrong row; then wrong column, right row.
            await dig(col, (row + 1) % size);
            await dig((col + 1) % size, row);
            assert.deepEqual(await counts(), [2, 1]);
            if (level === 5) await screenshot('treasure-map-5-two-clue-hint');
            // Level 4's hint lights the first leg from the pet, not the answer's column and row.
            if (level === 4) await screenshot('treasure-map-4-first-leg-hint');
            if (level === 1) {
              // The picture headers are drawn per round, and the sign and voice read them.
              const headers = await page.evaluate(() => neo.scene.game.headers);
              assert.equal(new Set(headers.rows).size, 4);
              await page.setViewportSize({ width: 768, height: 1024 });
              await page.waitForTimeout(400);
              await screenshot('treasure-map-1-portrait');
              await page.setViewportSize({ width: 1024, height: 768 });
              await page.waitForTimeout(400);
            }
          }
          await dig(col, row);
        }
        await finished('treasure-map');
        assert.deepEqual(await score('treasure-map'), [2, 1]);
        if (level === 1) {
          const found = await page.evaluate(() =>
            neo.scene.game.foundLines.map((r) => ({ last: r.last, opens: Math.round(r.opens ?? -1) })),
          );
          const early = found.filter((r) => !r.last);
          if (early.length !== 3 || early.some((r) => r.opens < 0 || r.opens > 1500))
            throw new Error(`R4: a right find's line held the next find: ${JSON.stringify(found)}`);
          if (found.filter((r) => r.last).some((r) => r.opens >= 0 && r.opens < 3900))
            throw new Error(`R4: the last find's line was not heard out: ${JSON.stringify(found)}`);
          log(
            `Treasure Map 1 R4: the next find opened ${early.map((r) => r.opens).join(', ')} ms into its line`,
          );
        }
        log(
          `Treasure Map ${level} (${mode}): squares tapped on the grid, row and column hints spoken, ${mode === 'clues' ? 'two landmark lines glowing, ' : mode === 'steps' ? 'the first leg glowing, ' : 'glowing column and row, '}${mode === 'steps' ? 'the pet walking the directions, ' : ''}saved score and sticker passed`,
        );
      }

    if ((!only || only === 'map') && fromLevel <= 6 && Number(process.env.TO_LEVEL || 6) >= 6) {
      // Level 6, Write the card: tiles set the two lines, footprints follow, Go walks the pet.
      await launch('treasure-map', 6);
      const KINDS = ['across', 'acrossWay', 'upDown', 'upDownWay'];
      const setCard = async (want) => {
        for (const kind of KINDS) {
          for (
            let i = 0;
            i < 4 && (await page.evaluate((k) => neo.scene.game.card[k], kind)) !== want[kind];
            i++
          )
            await tap(`neo.scene.game.tiles.get('${kind}')`);
          assert.equal(await page.evaluate((k) => neo.scene.game.card[k], kind), want[kind]);
        }
      };
      const go = async () => {
        await tap(`neo.scene.game.tiles.get('go')`);
        await page.waitForTimeout(250);
        await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
          timeout: 20000,
        });
        await page.waitForTimeout(300);
      };
      for (let n = 0; n < 4; n++) {
        await idle(n);
        const want = await page.evaluate(() => {
          const f = neo.scene.game.find;
          return {
            across: Math.abs(f.right),
            acrossWay: Math.sign(f.right),
            upDown: Math.abs(f.up),
            upDownWay: Math.sign(f.up),
          };
        });
        if (n === 0) {
          // Go on an unfinished card asks for both lines and is not a try.
          await go();
          assert.deepEqual(await counts(), [0, 0]);
          // The up-or-down line one too many (or one too few at three): a miss with its reason.
          await setCard({ ...want, upDown: want.upDown < 3 ? want.upDown + 1 : want.upDown - 1 });
          await go();
          assert.deepEqual(await counts(), [1, 0]);
          // Across the wrong way: the second miss, and the across line glows from the pet.
          await setCard({ ...want, acrossWay: -want.acrossWay });
          await go();
          assert.deepEqual(await counts(), [2, 1]);
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(400);
          await screenshot('treasure-map-6-card-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(400);
          await screenshot('treasure-map-6-card-landscape');
        }
        await setCard(want);
        await go();
      }
      await finished('treasure-map');
      assert.deepEqual(await score('treasure-map'), [2, 1]);
      log(
        'Treasure Map 6 (write): an unfinished Go free, an up line one off and a wrong-way across as misses, the across glow, the pet walking each card, saved score and sticker passed',
      );
    }

    if ((!only || only === 'map') && fromLevel <= 7 && Number(process.env.TO_LEVEL || 7) >= 7) {
      // Level 7, How far?: a hidden chest; digs that fit every distance are free, a ruled-out dig is a miss.
      await launch('treasure-map', 7);
      const dig = async (s) => {
        await page.evaluate((s) => {
          const g = neo.scene.game;
          const p = g.grid.toGlobal(g.cellAt(s));
          kit.tap(p.x, p.y);
        }, s);
        await page.waitForTimeout(250);
        await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
          timeout: 20000,
        });
        await page.waitForTimeout(300);
      };
      const dist = (a, b) => Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
      const squares = [];
      for (let col = 0; col < 4; col++) for (let row = 0; row < 4; row++) squares.push({ col, row });
      const same = (a, b) => a.col === b.col && a.row === b.row;
      const fits = (s, digs) => digs.every((d) => dist(s, d.square) === dist(d.square, d.chest));
      for (let n = 0; n < 3; n++) {
        await idle(n);
        const chest = await page.evaluate(() => ({ ...neo.scene.game.find.square }));
        if (n === 0) {
          // Two fitting digs (not the chest), then two squares they rule out.
          let plan = null;
          for (const a of squares)
            for (const b of squares) {
              if (plan || same(a, chest) || same(b, chest) || same(a, b) || dist(b, a) !== dist(chest, a))
                continue;
              const digs = [
                { square: a, chest },
                { square: b, chest },
              ];
              const out = squares.filter(
                (s) => !same(s, a) && !same(s, b) && !same(s, chest) && !fits(s, digs),
              );
              if (out.length >= 2) plan = { a, b, out };
            }
          await dig(plan.a);
          await dig(plan.b);
          const state = await page.evaluate(() => ({
            digs: neo.scene.game.digs.map((d) => d.said),
            busy: neo.scene.game.busy,
          }));
          assert.equal(state.digs.length, 2, 'two fitting digs recorded');
          assert.deepEqual(await counts(), [0, 0], 'fitting digs are exploring, never misses');
          await dig(plan.out[0]);
          assert.deepEqual(await counts(), [1, 0], 'a ruled-out dig is a miss');
          await dig(plan.out[0]);
          assert.deepEqual(
            await counts(),
            [1, 0],
            'a second tap on a crossed-out square repeats the reason, not a second miss',
          );
          // U7 R4: a re-dig's `map.faragain` (stretched to 4 s here) is read with input open, never holding the hunt.
          const reread = await page.evaluate(async (s) => {
            const g = neo.scene.game;
            const say = g.ctx.say;
            g.ctx.say = (id, vars) => {
              const line = say.call(g.ctx, id, vars);
              return id === 'map.faragain'
                ? Promise.all([line, kit.sleep(4000)]).then(() => undefined)
                : line;
            };
            const p = g.grid.toGlobal(g.cellAt(s));
            kit.tap(p.x, p.y);
            await kit.sleep(300);
            g.ctx.say = say;
            return g.busy;
          }, plan.a);
          assert.equal(reread, false, "R4: a re-dig's distance line held the hunt");
          assert.deepEqual(await counts(), [1, 0], 'digging a dug square again only repeats its distance');
          await dig(plan.out[1]);
          assert.deepEqual(await counts(), [2, 1], 'the second ruled-out dig lights what still fits');
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(400);
          await screenshot('treasure-map-7-footprints-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(400);
        }
        await dig(chest);
      }
      await finished('treasure-map');
      assert.deepEqual(await score('treasure-map'), [2, 1]);
      log(
        'Treasure Map 7 (far): two fitting digs free with their footprint stacks, a re-dig free, two ruled-out digs as misses, the still-fits glow, saved score and sticker passed',
      );
    }

    if ((!only || only === 'map') && fromLevel <= 8 && Number(process.env.TO_LEVEL || 8) >= 8) {
      // Level 8, Slide it: tap where the raft's flag lands, then pick the slid raft's outline card.
      await launch('treasure-map', 8);
      const settle = async () => {
        await page.waitForTimeout(250);
        await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
          timeout: 20000,
        });
        await page.waitForTimeout(300);
      };
      const dig = async (s) => {
        await page.evaluate((s) => {
          const g = neo.scene.game;
          const p = g.grid.toGlobal(g.cellAt(s));
          kit.tap(p.x, p.y);
        }, s);
        await settle();
      };
      const pick = async (kind) => {
        const i = await page.evaluate(
          (kind) => neo.scene.game.find.outlines.findIndex((o) => o.kind === kind),
          kind,
        );
        await tap(`neo.scene.game.outlineCards[${i}]`);
        await settle();
      };
      for (let n = 0; n < 3; n++) {
        await idle(n);
        const { col, row } = await page.evaluate(() => ({ ...neo.scene.game.find.square }));
        if (n === 0) {
          // A square in the right column but the wrong row: a miss.
          await dig({ col, row: row === 0 ? 1 : row - 1 });
          assert.deepEqual(await counts(), [1, 0], 'a wrong landing square is a miss');
        }
        await dig({ col, row });
        assert.equal(
          await page.evaluate(() => neo.scene.game.part),
          'cards',
          'the right square moves the question to the cards',
        );
        if (n === 0) {
          // A map tap during the cards is nothing; the turned-over raft is the second miss and lights the flag's walk.
          await dig({ col, row });
          assert.deepEqual(await counts(), [1, 0], 'a map tap while the cards ask is free');
          await pick('flipped');
          assert.deepEqual(
            await counts(),
            [2, 1],
            'the turned-over outline is a miss, and the second lights the walk',
          );
          await pick('flipped');
          assert.deepEqual(await counts(), [2, 1], 'a tried card repeats its reason, not a second miss');
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(400);
          await screenshot('treasure-map-8-outline-cards-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(400);
        }
        await pick('right');
      }
      await finished('treasure-map');
      assert.deepEqual(await score('treasure-map'), [2, 1]);
      log(
        'Treasure Map 8 (slide): a wrong landing square and a turned-over outline as misses, a free map tap and re-tap, the flag-walk glow, three rafts slid, saved score and sticker passed',
      );
    }

    if (!only || only === 'opp')
      // Level 6 is lap's big card (grove-cut-lines plays it); level 7 is pre-K's In between, 8 Line them up.
      for (const level of [1, 2, 3, 4, 5, 7, 8].filter((l) => l >= fromLevel)) {
        await launch('opposites', level);
        const mode = await page.evaluate(() => neo.scene.game.plan.mode);
        const card = async (i) => {
          await tap(`neo.scene.game.cards[${i}].node`);
          await page.waitForTimeout(200);
          await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, {
            timeout: 20000,
          });
          await page.waitForTimeout(380);
        };
        const rounds = await page.evaluate(() => neo.scene.game.rounds.length);
        for (let n = 0; n < rounds; n++) {
          await idle(n);
          if (mode === 'switch') {
            await card(0);
            continue;
          }
          if (mode === 'order') {
            // The cards in the order to tap them, from the end named first.
            const inOrder = await page.evaluate(async () => {
              const L = await import('/src/games/opposites/logic.ts');
              const r = neo.scene.game.round;
              return [0, 1, 2].map((d) => r.cards.findIndex((c) => L.degree(c, r.ask.side) === d));
            });
            if (n === 0) {
              // Out of turn twice: the last one first, then the middle first (a miss each, the glow after two).
              await card(inOrder[2]);
              await card(inOrder[1]);
              assert.deepEqual(await counts(), [2, 1]);
              const glow = await page.evaluate(() => neo.scene.game.cards.indexOf(neo.scene.game.glowing));
              assert.equal(glow, inOrder[0], 'the first one in turn glows');
              await screenshot('opposites-8-hint');
            }
            for (const [k, i] of inOrder.entries()) {
              await card(i);
              if (n === 0 && k === 1) {
                // A lined-up card stays in its place on the line, left of the next one.
                const xs = await page.evaluate(() => neo.scene.game.cards.map((c) => [c.node.x, c.node.y]));
                assert.ok(xs[inOrder[0]][0] < xs[inOrder[1]][0], 'the line runs left to right');
                assert.equal(xs[inOrder[0]][1], xs[inOrder[1]][1], 'lined-up cards share the line');
                await screenshot('opposites-8-line');
              }
            }
            continue;
          }
          const { right, others, pairs } = await page.evaluate(async () => {
            const L = await import('/src/games/opposites/logic.ts');
            const g = neo.scene.game;
            const r = g.round;
            const ok = (c) =>
              g.plan.mode === 'find'
                ? L.word(c) === L.word(r.ask)
                : g.plan.mode === 'between'
                  ? !!c.mid
                  : L.opposites(c, r.ask);
            const idx = r.cards.map((c, i) => i);
            if (g.plan.mode === 'spot') {
              const pr = idx.filter((i) => idx.some((j) => j !== i && L.opposites(r.cards[i], r.cards[j])));
              return { pairs: [pr], others: idx.filter((i) => !pr.includes(i)) };
            }
            if (g.plan.mode === 'pairs')
              return {
                pairs: idx
                  .filter((i) => idx.some((j) => j > i && L.opposites(r.cards[i], r.cards[j])))
                  .map((i) => [i, idx.find((j) => j > i && L.opposites(r.cards[i], r.cards[j]))]),
              };
            return { right: idx.find((i) => ok(r.cards[i])), others: idx.filter((i) => !ok(r.cards[i])) };
          });
          if (mode === 'spot') {
            if (n === 0) {
              // Two decoys that aren't opposites: a miss, then a second miss for the glow.
              await card(others[0]);
              await card(others[1]);
              await card(others[0]);
              await card(others[2]);
              assert.deepEqual(await counts(), [2, 1]);
              await screenshot('opposites-5-hint');
            }
            await card(pairs[0][0]);
            await card(pairs[0][1]);
            continue;
          }
          if (mode === 'pairs') {
            if (n === 0) {
              // Two pairs that aren't opposites.
              await card(pairs[0][0]);
              await card(pairs[1][0]);
              await card(pairs[0][0]);
              await card(pairs[2][0]);
              assert.deepEqual(await counts(), [2, 1]);
              await screenshot('opposites-4-hint');
            }
            for (const [a, b] of pairs) {
              await card(a);
              await card(b);
            }
            continue;
          }
          if (n === 0) {
            await card(others[0]);
            await card(others[others.length - 1]);
            assert.deepEqual(await counts(), [2, 1]);
            if (mode === 'between') {
              // The cards stand in true order: the glowing middle is the one between the two ends.
              const xs = await page.evaluate(() => neo.scene.game.cards.map((c) => c.node.x));
              const [lo, hi] = others.map((i) => xs[i]).sort((a, b) => a - b);
              assert.ok(xs[right] > lo && xs[right] < hi, 'the middle stands between the ends');
              await screenshot('opposites-7-hint');
            }
          }
          await card(right);
        }
        await finished('opposites');
        assert.deepEqual(await score('opposites'), mode === 'switch' ? [0, 0] : [2, 1]);
        log(
          `Opposites ${level} (${mode}): picture cards tapped and flipped, wrong picks as misses, glow hint, saved score and sticker passed`,
        );
      }

    if (!only || only === 'graph')
      for (let level = fromLevel; level <= 7; level++) {
        await launch('picture-graph', level);
        const mode = await page.evaluate(() => neo.scene.game.plan.mode);
        const per = await page.evaluate(() => neo.scene.game.plan.per);
        const prebuilt = mode === 'read' || mode === 'scaleread';
        // Waits for input and for the next question's ask, which a right answer's line holds back (U7 R4).
        const settle = async () => {
          await page.waitForTimeout(250);
          await page.waitForFunction(
            () => (!neo.scene.game.busy && !neo.scene.game.unasked) || neo.scene.finished,
            null,
            { timeout: 20000 },
          );
          await page.waitForTimeout(250);
        };
        // U7 R4: a right answer's or a built graph's line starts, and the next question on the same graph opens before it ends.
        await page.evaluate(() => {
          const g = neo.scene.game,
            say = g.ctx.say.bind(g.ctx);
          window.graphR4 = [];
          g.ctx.say = (id, vars) => {
            const line = say(id, vars);
            if (id === 'graph.yay' || id === 'graph.built' || /^graph\.claim\..*yay$/.test(id)) {
              const t = performance.now(),
                o = { id, at: g.index };
              graphR4.push(o);
              void line.then(() => (o.ends = performance.now() - t));
              void kit
                .until(() => g.finished || !g.busy, 8000)
                .then(() => {
                  o.opens = performance.now() - t;
                  o.same = !g.finished && g.index === o.at;
                });
            }
            return line;
          };
        });
        // Tap just above a bar to add a block.
        const add = async (i) => {
          await page.evaluate((i) => {
            const g = neo.scene.game;
            const p = g.columns[i].toGlobal({ x: 0, y: -(g.bars[i] + 1) * 34 - 12 });
            kit.tap(p.x, p.y);
          }, i);
          await page.waitForTimeout(170);
        };
        const addTally = async (i) => {
          await page.evaluate((i) => {
            const p = neo.scene.game.columns[i].toGlobal({ x: 0, y: -64 });
            kit.tap(p.x, p.y);
          }, i);
          await page.waitForTimeout(170);
        };
        const column = async (i) => {
          await page.evaluate((i) => {
            const p = neo.scene.game.columns[i].toGlobal({ x: 0, y: -100 });
            kit.tap(p.x, p.y);
          }, i);
          await settle();
        };
        const pad = async (n) => {
          await tap(`neo.scene.game.pads.find((p) => p.n === ${n}).node`);
          await settle();
        };
        let missed = false;
        for (let n = 0; n < 2; n++) {
          await idle(n);
          const counts0 = await page.evaluate(() => neo.scene.game.graph.counts);
          if (!prebuilt) {
            if (mode === 'tally' && (await page.evaluate(() => neo.scene.game.phase === 'tally'))) {
              if (!missed) {
                await tap('neo.scene.game.check');
                await settle();
                await tap('neo.scene.game.check');
                await settle();
                missed = true;
                assert.deepEqual(await counts(), [2, 1]);
                await screenshot('picture-graph-7-tally-hint');
              }
              for (const [i, count] of counts0.entries()) for (let k = 0; k < count; k++) await addTally(i);
              await tap('neo.scene.game.check');
              await settle();
              assert.equal(await page.evaluate(() => neo.scene.game.phase), 'graph');
            }
            if (mode === 'build' && !missed) {
              for (let k = 0; k < 2; k++) {
                await tap('neo.scene.game.check');
                await settle();
              }
              missed = true;
              assert.deepEqual(await counts(), [2, 1]);
            }
            for (const [i, c] of counts0.entries()) for (let k = 0; k < c / per; k++) await add(i);
            await tap('neo.scene.game.check');
            await settle();
          }
          // Questions about the graph.
          for (let k = 0; k < 3; k++) {
            const q = await page.evaluate(() => {
              const g = neo.scene.game;
              return g.index === g.index && g.questions[g.q];
            });
            if (!q || (await page.evaluate((n) => neo.scene.game.index !== n || neo.scene.finished, n)))
              break;
            if (q.ask === 'most' || q.ask === 'fewest') {
              if (!missed) {
                const wrong = (q.answer + 1) % counts0.length;
                await column(wrong);
                await column(wrong);
                missed = true;
                assert.deepEqual(await counts(), [2, 1]);
              }
              await column(q.answer);
            } else if (q.ask === 'same') {
              // A double tap on one bar lifts it, then lowers it: free, with the pick visible meanwhile.
              const before = await counts();
              await column(q.answer[0]);
              assert.equal(await page.evaluate(() => neo.scene.game.firstSame), q.answer[0]);
              await column(q.answer[0]);
              assert.equal(await page.evaluate(() => neo.scene.game.firstSame), null);
              assert.deepEqual(await counts(), before);
              await column(q.answer[0]);
              await column(q.answer[1]);
            } else if (level === 7) {
              // The taller bar's count is offered; picking it gets its own line, a second wrong answer the why-hint.
              const g = await page.evaluate(() => {
                const g = neo.scene.game;
                return { pads: g.pads.map((p) => p.n), taller: g.graph.counts[g.questions[g.q].a] };
              });
              assert.ok(g.pads.includes(g.taller), 'the taller count is a choice');
              const other = g.pads.find((x) => x !== g.taller && x !== q.answer);
              await pad(g.taller);
              await pad(other);
              assert.deepEqual(await counts(), [4, 2]);
              await screenshot('picture-graph-7-why-hint');
              await pad(q.answer);
            } else {
              if (!missed) {
                const wrongs = await page.evaluate(
                  (a) => neo.scene.game.pads.map((p) => p.n).filter((x) => x !== a),
                  q.answer,
                );
                await pad(wrongs[0]);
                await pad(wrongs[1]);
                missed = true;
                assert.deepEqual(await counts(), [2, 1]);
                if (level === 3 || level === 5 || level === 6)
                  await screenshot(`picture-graph-${level}-hint`);
              }
              await pad(q.answer);
            }
          }
        }
        await finished('picture-graph');
        const graphTimed = await page.evaluate(() => graphR4.filter((o) => o.same));
        if (level >= 2) {
          assert.ok(graphTimed.length >= 1, `R4: ${graphTimed.length} Picture Graph lines timed`);
          const late = graphTimed.filter((o) => o.ends !== undefined && o.opens >= o.ends && o.ends > 300);
          assert.equal(
            late.length,
            0,
            `R4: a question waited for a line (${late.map((o) => `${o.id} ${Math.round(o.opens)}/${Math.round(o.ends)}`).join(', ')} ms)`,
          );
          log(
            `Picture Graph ${level}: R4, ${graphTimed.map((o) => `${o.id} opens ${Math.round(o.opens)} ms`).join(', ')}`,
          );
        }
        assert.deepEqual(await score('picture-graph'), level === 7 ? [4, 2] : [2, 1]);
        log(
          `Picture Graph ${level} (${mode}): bars built block by block, graph checked, questions answered on bars and number pads, misses, glow hint, saved score and sticker passed`,
        );
      }

    if (!only || only === 'worm')
      for (let level = fromLevel; level <= Number(process.env.TO_LEVEL || 10); level++) {
        // Level 7 (big worms, then little worms), 8 (the broken ruler), 9 (one worm, hop by hop) and 10 (longer than the ruler) play in portrait.
        if (level >= 7) await page.setViewportSize({ width: 768, height: 1024 });
        await launch('inchworm', level);
        const mode = await page.evaluate(() => neo.scene.game.plan.mode);
        const onRuler = mode.startsWith('ruler') || mode === 'broken';
        const settle = async () => {
          await page.waitForTimeout(250);
          // After a right answer the next measure opens at once and its instruction waits for the line (U7 R4).
          await page.waitForFunction(
            () => (!neo.scene.game.busy && !neo.scene.game.unasked) || neo.scene.finished,
            null,
            { timeout: 20000 },
          );
          await page.waitForTimeout(250);
        };
        // Drag a worm from the bucket onto a row (it rides above the finger, so aim just below the row).
        const lay = async (row) => {
          await page.evaluate(async (row) => {
            const g = neo.scene.game;
            const r = g.rows[row];
            const w = g.bucket[0];
            // Logical to screen (portrait scales the view), aiming at the row's last filled or next slot.
            const at = r.node.parent.toGlobal({
              x: g.x0() + (r.start + Math.min(r.worms, r.length - 1) * r.size) * g.u + (r.size * g.u) / 2,
              y: r.y + 40,
            });
            await kit.dragTo(w.node, at, 12);
          }, row);
          await page.waitForTimeout(260);
        };
        const pad = async (n) => {
          await tap(`neo.scene.game.pads.find((p) => p.n === ${n}).node`);
          await settle();
        };
        const wrongPads = () =>
          page.evaluate(async () => {
            const L = await import('/src/games/inchworm/logic.ts');
            const g = neo.scene.game;
            const a = L.answerOf(g.m, g.plan.mode);
            return g.pads.map((p) => p.n).filter((n) => n !== a);
          });
        const answer = () =>
          page.evaluate(async () => {
            const L = await import('/src/games/inchworm/logic.ts');
            const g = neo.scene.game;
            return L.answerOf(g.m, g.plan.mode);
          });
        const rounds = await page.evaluate(() => neo.scene.game.measures.length);
        // Level 3: exactly one round is two jumps in the sand pit.
        if (mode === 'compare')
          assert.equal(await page.evaluate(() => neo.scene.game.measures.filter((m) => m.jump).length), 1);
        for (let n = 0; n < rounds; n++) {
          await idle(n);
          if (await page.evaluate(() => !!neo.scene.game.m.jump)) await screenshot('inchworm-3-jump');
          if (mode === 'slide') {
            // Longer than the ruler: lay the ruler with its 0 at `mark` (the finger is 40 below what it carries), `dx` units off.
            const layAt = async (mark, dx = 0) => {
              await page.evaluate(
                async ({ mark, dx }) => {
                  const g = neo.scene.game;
                  const at = g.slotSpot(mark);
                  await kit.dragTo(
                    g.slider.node,
                    g.rows[0].node.parent.toGlobal({ x: at.x + dx, y: at.y + 40 }),
                    12,
                  );
                },
                { mark, dx },
              );
              await page.waitForTimeout(700);
            };
            const ruler = await page.evaluate(() => neo.scene.game.m.ruler);
            if (n === 0) {
              // A drop well away from the start slides back: no lay, no miss.
              await layAt(0, 3 * 74);
              assert.deepEqual(
                [await page.evaluate(() => neo.scene.game.rows[0].worms), ...(await counts())],
                [0, 0, 0],
              );
            }
            await layAt(0);
            assert.deepEqual(
              await page.evaluate(() => [
                neo.scene.game.rows[0].worms,
                neo.scene.game.chalk.children.length,
                neo.scene.game.pads.length,
              ]),
              [1, 2, 0],
            );
            if (n === 0) await screenshot('inchworm-10-chalk');
            await layAt(ruler);
            assert.equal(await page.evaluate(() => neo.scene.game.rows[0].worms), 2);
            await settle();
          } else if (mode === 'hop') {
            // One worm, hop by hop: tap it along; it stops by itself at the end, and the pads come only then.
            const length = await page.evaluate(() => neo.scene.game.m.length);
            for (let k = 0; k < length; k++) {
              assert.equal(await page.evaluate(() => neo.scene.game.pads.length), 0);
              await tap('neo.scene.game.hopper');
              if (n === 0 && k === 1) await screenshot('inchworm-9-mid-hop');
              await settle();
            }
            assert.deepEqual(await page.evaluate(() => [neo.scene.game.rows[0].worms]), [length]);
            // A tap at the end does nothing: no hop, no miss.
            const before = await counts();
            await tap('neo.scene.game.hopper');
            await settle();
            assert.deepEqual(
              [await page.evaluate(() => neo.scene.game.rows[0].worms), ...(await counts())],
              [length, ...before],
            );
          } else if (!onRuler) {
            const lens = await page.evaluate(() => neo.scene.game.rows.map((r) => r.length));
            const order = lens.map((l, i) => i).sort((a, b) => lens[a] - lens[b]);
            for (const [k, row] of order.entries()) {
              for (let w = 0; w < lens[row]; w++) await lay(row);
              if (mode === 'compare' && n === 0 && k === 0) {
                // One too many on the shorter one: it would hang off the end. Twice.
                await lay(row);
                await lay(row);
                assert.deepEqual(await counts(), [2, 1]);
                await screenshot('inchworm-3-hint');
              }
              if (mode === 'units' && n === 0 && k === 0) {
                // The big worms' row is full: a little worm dropped on it would hang off the end.
                assert.deepEqual(
                  await page.evaluate(() => [
                    neo.scene.game.rows.map((r) => r.worms),
                    neo.scene.game.bucket.map((b) => Math.round(b.node.width)),
                    neo.scene.game.rows[1].node.alpha,
                  ]),
                  [[await page.evaluate(() => neo.scene.game.m.length), 0], [89, 89, 89], 1],
                );
                await lay(0);
                assert.deepEqual(await counts(), [1, 0]);
              }
            }
            await settle();
          }
          if (mode === 'lay') continue;
          await page.waitForFunction((n) => neo.scene.game.pads.length === n, mode === 'units' ? 2 : 3, {
            timeout: 15000,
          });
          if (n === 0 && mode === 'units') {
            // One wrong count after the overhang: the second miss on this stick lights the glow and the see-through big worm.
            const [a] = await wrongPads();
            await pad(a);
            assert.deepEqual(await counts(), [2, 1]);
            assert.equal(await page.evaluate(() => neo.scene.game.bucket.length), 0);
            await page.waitForTimeout(300);
            await screenshot('inchworm-7-hint');
          } else if (n === 0 && mode === 'broken') {
            // The end mark first, then the marks counted (one more than the spaces): the second miss lights the spaces.
            const m = await page.evaluate(() => {
              const m = neo.scene.game.m;
              return { end: m.start + m.length, marks: m.length + 1 };
            });
            await pad(m.end);
            await pad(m.marks);
            assert.deepEqual(await counts(), [2, 1]);
            await page.waitForTimeout(300);
            await screenshot('inchworm-8-broken');
          } else if (n === 0 && mode === 'hop') {
            // One wrong count, a second for the glow: the ticks get their numbers.
            const [a, b] = await wrongPads();
            await pad(a);
            await pad(b);
            assert.deepEqual(await counts(), [2, 1]);
            const length = await page.evaluate(() => neo.scene.game.m.length);
            assert.equal(await page.evaluate(() => neo.scene.game.chalk.children.length), length + 1);
            await page.waitForTimeout(300);
            await screenshot('inchworm-9-hint');
          } else if (n === 0 && mode === 'slide') {
            // The second part alone first (a miss), then the other wrong pad: the second miss lights both parts and the chalk mark.
            const m = await page.evaluate(() => {
              const m = neo.scene.game.m;
              return { second: m.length - m.ruler, whole: m.length };
            });
            await pad(m.second);
            assert.deepEqual(await counts(), [1, 0]);
            const [other] = (await wrongPads()).filter((x) => x !== m.second);
            await pad(other);
            assert.deepEqual(await counts(), [2, 1]);
            await page.waitForTimeout(300);
            await screenshot('inchworm-10-hint');
          } else if (n === 0 && mode !== 'compare') {
            const [a, b] = await wrongPads();
            await pad(a);
            await pad(b);
            assert.deepEqual(await counts(), [2, 1]);
          }
          await pad(await answer());
        }
        if (level >= 7) await page.setViewportSize({ width: 1024, height: 768 });
        await finished('inchworm');
        assert.deepEqual(await score('inchworm'), mode === 'lay' ? [0, 0] : [2, 1]);
        log(
          `Inchworm Measure ${level} (${mode}): worms dragged end to end, ${onRuler ? 'ruler readings' : 'lengths counted'}, misses, hints, saved score and sticker passed`,
        );
      }

    if (!only || only === 'helpers') {
      // Level 6 (teams she builds), 7 (Everyone helps, in portrait) and 8 (Strong helpers): tap a fruit to send its team a helper.
      for (const level of [6, 7, 8]) {
        if (level === 7) await page.setViewportSize({ width: 768, height: 1024 });
        await launch('little-helpers', level);
        for (let k = 0; k < 4; k++) {
          await idle(k);
          const parts = await page.evaluate(() => {
            const g = neo.scene.game;
            return (
              g.fruit.parts ?? Array.from({ length: g.fruit.groups }, () => g.fruit.need / g.fruit.groups)
            );
          });
          const need = await page.evaluate(() => neo.scene.game.fruit.need);
          const settle = () => page.waitForFunction(() => !neo.scene.game.helpers.some((h) => h.moving));
          // Tap fruit `g` of a bunch or pair, as a finger would: the tap goes to the nearest fruit.
          const sendTeam = async (g, n) => {
            for (let i = 0; i < n; i++) {
              await page.evaluate((g) => {
                const G = neo.scene.game;
                kit.tapOn(G.fruitNode, G.groupX(g, G.fruit), -60);
              }, g);
              await page.waitForTimeout(300);
            }
            await settle();
          };
          // Level 8: touch the helpers themselves, big ones or small, until the team adds up.
          const sendKind = async (big, n) => {
            for (let i = 0; i < n; i++) {
              await page.evaluate((big) => {
                const h = neo.scene.game.helpers.find((x) => x.big === big && x.slot < 0 && x.visible);
                kit.tapOn(h, 0, -28);
              }, big);
              await page.waitForTimeout(300);
            }
            await settle();
          };
          const whistle = async () => {
            await tap('neo.scene.game.whistle');
            await page.waitForTimeout(450);
            await idle(0);
          };
          if (level === 8) {
            if (k === 0) {
              // Too strong first (an extra walks back), then too light: two counted, one hint.
              await sendKind(true, 3);
              await sendKind(false, need - 6 > 0 ? need - 6 + 1 : 1);
              await whistle();
              await page.waitForTimeout(800);
              await page.evaluate(() => {
                const g = neo.scene.game;
                for (const h of g.carrying) g.recall(h);
              });
              await page.waitForTimeout(600);
              await settle();
              await sendKind(false, 1);
              await whistle();
              assert.deepEqual(await counts(), [2, 1]);
              await page.evaluate(() => {
                const g = neo.scene.game;
                for (const h of g.carrying) g.recall(h);
              });
              await page.waitForTimeout(600);
              await settle();
              await screenshot('little-helpers-8-hint');
            }
            // Any exact mix is right: bigs first, then smalls.
            const bigs = Math.min(3, Math.floor(need / 2));
            await sendKind(true, bigs);
            await sendKind(false, need - bigs * 2);
            await settle();
          } else if (k === 0) {
            // Fill every team but one helper, then whistle twice; a full team says so and takes no more.
            for (let g = 0; g < parts.length; g++)
              await sendTeam(g, g === parts.length - 1 ? parts[g] - 1 : parts[g]);
            if (level === 6) {
              await sendTeam(0, 1);
              assert.equal(
                await page.evaluate(() => neo.scene.game.carrying.length),
                need - 1,
                'a full team took another helper',
              );
            }
            for (let m = 0; m < 2; m++) await whistle();
            assert.deepEqual(await counts(), [2, 1]);
            await screenshot(`little-helpers-${level}-hint`);
            await sendTeam(parts.length - 1, 1);
          } else for (let g = 0; g < parts.length; g++) await sendTeam(g, parts[g]);
          await tap('neo.scene.game.whistle');
        }
        // Every fruit reached the basket.
        await page.waitForFunction(
          () => {
            const g = neo.scene.game;
            return g.pile.children.length === g.fruits.reduce((n, f) => n + f.groups, 0);
          },
          null,
          { timeout: 20000 },
        );
        await finished('little-helpers');
        assert.deepEqual(await score('little-helpers'), [2, 1]);
        log(
          `Little Helpers ${level}: ${level === 8 ? 'big helpers count two, any exact mix lifts' : level === 7 ? 'a crowd split between two fruits' : 'equal teams under each fruit of a bunch'}, wrong whistles, hint, saved score and sticker passed`,
        );
        if (level === 7) await page.setViewportSize({ width: 1024, height: 768 });
      }
    }

    // Seesaw Balance 8–10: take the same off both sides until a box is alone, or two boxes share the blocks.
    if (!only || only === 'boxes')
      for (let level = Math.max(8, fromLevel); level <= 10; level++) {
        await launch('seesaw-balance', level);
        if (level === 9) await page.setViewportSize({ width: 768, height: 1024 });
        const rounds = await page.evaluate(() => neo.scene.game.rounds.length);
        // Drag a thing off a tray onto the grass, or from the grass onto a tray (aiming below, since it rides above the finger).
        const move = (pick, to) =>
          page.evaluate(
            async ({ pick, to }) => {
              const g = neo.scene.game;
              const fs = g.round.fixedSide;
              const os = fs === 'left' ? 'right' : 'left';
              const side = { fixed: fs, other: os, grass: null }[pick.side];
              const item = g.items.find((i) => i.side === side && i.thing.kind === pick.kind);
              const s = neo.view.scale;
              const r = document.querySelector('canvas').getBoundingClientRect();
              const at =
                to === 'grass'
                  ? { x: 512, y: neo.view.h - 20 }
                  : (() => {
                      const t = g.trayTop(to === 'fixed' ? fs : os);
                      return { x: t.x, y: t.y + 10 };
                    })();
              await kit.dragTo(item.node, { x: r.left + at.x * s, y: r.top + at.y * s }, 10);
              await kit.sleep(250);
              await kit.until(() => !g.busy, 8000);
              await kit.sleep(700);
            },
            { pick, to },
          );
        for (let n = 0; n < rounds; n++) {
          await idle(n);
          if (n === 0) {
            // Two blocks off one side only: it tips twice, which is said aloud but never a miss; then a glow.
            await move({ side: 'other', kind: 'block' }, 'grass');
            await move({ side: 'other', kind: 'block' }, 'grass');
            assert.deepEqual(
              await page.evaluate(() => {
                const g = neo.scene.game;
                return [g.tips, g.misses, g.hints, !!g.hintItem];
              }),
              [2, 0, 1, true],
            );
            await screenshot(`seesaw-balance-${level}-tipped`);
            // Back on again: level, and the glow goes.
            await move({ side: 'grass', kind: 'block' }, 'other');
            await move({ side: 'grass', kind: 'block' }, 'other');
            assert.deepEqual(await page.evaluate(() => [neo.scene.game.tips, !!neo.scene.game.hintItem]), [
              0,
              false,
            ]);
          }
          if (level >= 9) {
            await move({ side: 'fixed', kind: 'box' }, 'grass');
            await move({ side: 'other', kind: 'box' }, 'grass');
          }
          while (
            await page.evaluate(() => {
              const g = neo.scene.game;
              return g.items.some((i) => i.side === g.round.fixedSide && i.thing.kind === 'block');
            })
          ) {
            await move({ side: 'fixed', kind: 'block' }, 'grass');
            await move({ side: 'other', kind: 'block' }, 'grass');
          }
          await page.waitForFunction(() => neo.scene.game.pads.length === 3 && !neo.scene.game.busy, null, {
            timeout: 15000,
          });
          assert.equal(
            await page.evaluate(() => {
              const g = neo.scene.game;
              const boxes = g.items.filter((i) => i.side && i.thing.kind === 'box').length;
              const blocks = g.items.filter((i) => i.side && i.thing.kind === 'block').length;
              return blocks === boxes * g.round.answer;
            }),
            true,
            'the blocks show one equal group for each remaining box',
          );
          if (n === 0) {
            await tap('neo.scene.game.pads.find((p) => p.value !== neo.scene.game.round.answer)');
            await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
            await screenshot(`seesaw-balance-${level}`);
          }
          await tap('neo.scene.game.pads.find((p) => p.value === neo.scene.game.round.answer)');
        }
        await finished('seesaw-balance');
        assert.deepEqual(await score('seesaw-balance'), [1, 1]);
        await page.setViewportSize({ width: 1024, height: 768 });
        log(
          `Seesaw Balance ${level} (${level === 8 ? 'box and blocks' : level === 9 ? 'boxes on both sides' : 'two-box sharing'}): same off both sides, tips explained without misses, glow, putting back, visible block groups, saved score and sticker passed`,
        );
      }

    // Seesaw Balance 11: read the square box, then take the same off both sides, the tagged box worth its number.
    if (!only || only === 'twoboxes') {
      await launch('seesaw-balance', 11);
      await page.setViewportSize({ width: 768, height: 1024 });
      const rounds = await page.evaluate(() => neo.scene.game.rounds.length);
      assert.equal(rounds, 4, 'two pairs of a reading and a weighing');
      // Drag a thing (picked by where it is and what it is) to the grass or onto a tray, then wait for the pet.
      const move = (pick, to) =>
        page.evaluate(
          async ({ pick, to }) => {
            const g = neo.scene.game;
            const fs = g.round.fixedSide;
            const os = fs === 'left' ? 'right' : 'left';
            const side = { fixed: fs, other: os, grass: null }[pick.side];
            const item = g.items.find(
              (i) =>
                i.side === side && (pick.shape ? i.thing.shape === pick.shape : i.thing.kind === 'block'),
            );
            const s = neo.view.scale;
            const r = document.querySelector('canvas').getBoundingClientRect();
            const at =
              to === 'grass'
                ? { x: neo.view.w / 2, y: neo.view.h - 20 }
                : (() => {
                    const t = g.trayTop(to === 'fixed' ? fs : os);
                    return { x: t.x, y: t.y + 10 };
                  })();
            await kit.dragTo(item.node, { x: r.left + at.x * s, y: r.top + at.y * s }, 10);
            await kit.sleep(250);
            await kit.until(() => !g.busy, 8000);
            await kit.sleep(900);
          },
          { pick, to },
        );
      const state = () =>
        page.evaluate(() => {
          const g = neo.scene.game;
          const sq = g.items.find((i) => i.thing.shape === 'square');
          const rd = g.items.find((i) => i.thing.shape === 'round');
          return {
            misses: g.misses,
            hints: g.hints,
            tips: g.tips,
            glow: !!g.hintItem,
            square: sq?.sign.text,
            round: rd?.sign.text,
            pads: g.pads.length,
          };
        });
      let burst = false;
      for (let n = 0; n < rounds; n++) {
        await idle(n);
        const phase = await page.evaluate(() => neo.scene.game.round.phase);
        if (phase === 'read') {
          // The reading shows its pads at once; nothing on the trays drags.
          await page.waitForFunction(() => neo.scene.game.pads.length === 3, null, { timeout: 15000 });
          assert.equal(
            await page.evaluate(() => neo.scene.game.items.every((i) => !i.drag)),
            true,
            'nothing drags on the reading',
          );
          if (n === 0) {
            await tap('neo.scene.game.pads.find((p) => p.value !== neo.scene.game.round.answer)');
            await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
            assert.deepEqual(await counts(), [1, 0]);
          }
          await tap('neo.scene.game.pads.find((p) => p.value === neo.scene.game.round.answer)');
          await page.waitForFunction(
            () => neo.scene.game.items.find((i) => i.thing.shape === 'square')?.sign.text !== '?',
            null,
            { timeout: 8000 },
          );
          continue;
        }
        const { s, k } = await page.evaluate(() => {
          const r = neo.scene.game.round;
          return {
            s: r.fixed.find((t) => t.shape === 'square').weight,
            k: r.fixed.filter((t) => t.kind === 'block').length,
          };
        });
        let st = await state();
        assert.equal(st.square, String(s), 'the square box wears its number on the weighing');
        assert.equal(st.round, '?');
        if (n === 1) {
          // The round box stays: a touch wiggles it and is free.
          await tap('neo.scene.game.items.find((i) => i.thing.shape === "round").node');
          await page.waitForTimeout(400);
          assert.equal(
            await page.evaluate(() => {
              const g = neo.scene.game;
              const rd = g.items.find((i) => i.thing.shape === 'round');
              return rd.side === g.round.fixedSide;
            }),
            true,
          );
          // Two blocks off one side: two tips, never a miss, then one glow.
          await move({ side: 'other' }, 'grass');
          await move({ side: 'other' }, 'grass');
          st = await state();
          assert.deepEqual([st.misses, st.hints, st.tips, st.glow], [1, 1, 2, true]);
          await screenshot('seesaw-balance-11-glow');
          await move({ side: 'grass' }, 'other');
          await move({ side: 'grass' }, 'other');
          st = await state();
          assert.deepEqual([st.tips, st.glow], [0, false]);
        }
        for (let j = 0; j < k; j++) {
          await move({ side: 'fixed' }, 'grass');
          await move({ side: 'other' }, 'grass');
        }
        // The square box off, then its number of blocks off the other side: one tip, then closer and level.
        await move({ side: 'fixed', shape: 'square' }, 'grass');
        if (s >= 3 && !burst) {
          burst = true;
          // Two blocks off in a quick burst are judged once, as one narrowing change: no tip, no glow.
          const before = await state();
          await page.evaluate(() => {
            const g = neo.scene.game;
            const os = g.round.fixedSide === 'left' ? 'right' : 'left';
            for (const item of g.items.filter((i) => i.side === os && i.thing.kind === 'block').slice(0, 2))
              g.takeOff(item, true);
          });
          await page.waitForTimeout(1500);
          const after = await state();
          assert.deepEqual(
            [after.tips, after.hints],
            [0, before.hints],
            'a quick burst of right moves is not a tip',
          );
          for (let j = 2; j < s; j++) await move({ side: 'other' }, 'grass');
        } else for (let j = 0; j < s; j++) await move({ side: 'other' }, 'grass');
        await page.waitForFunction(() => neo.scene.game.pads.length === 3 && !neo.scene.game.busy, null, {
          timeout: 15000,
        });
        assert.equal(
          await page.evaluate(() => {
            const g = neo.scene.game;
            return g.items.filter((i) => i.side && i.thing.kind === 'block').length === g.round.answer;
          }),
          true,
          'the blocks across weigh the round box',
        );
        if (n === 1) await screenshot('seesaw-balance-11');
        await tap('neo.scene.game.pads.find((p) => p.value === neo.scene.game.round.answer)');
        await page.waitForFunction(
          () => {
            const g = neo.scene.game;
            return g.finished || g.items.find((i) => i.thing.shape === 'round')?.sign.text !== '?';
          },
          null,
          { timeout: 8000 },
        );
        if (!(await page.evaluate(() => neo.scene.game.finished)))
          assert.equal((await state()).square, String(s), 'the round answer leaves the square box tag alone');
      }
      await finished('seesaw-balance');
      assert.deepEqual(await score('seesaw-balance'), [1, 1]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log(
        `Seesaw Balance 11 (two boxes): ${burst ? 'quick burst judged once, ' : 'no square box of 3 or more, so the quick burst was not tried, '}` +
          'readings tag the square box, round box stays, tips free with one glow, putting back, the square box worth its number, round box weighed, saved score and sticker passed',
      );
    }

    // Mail Carrier 6–8: Hazel's picture map, two planned stops, and a shorter-route choice.
    if (!only || only === 'mailmap')
      for (const level of (process.env.MAIL_LEVELS?.split(',').map(Number) ?? [6, 7, 8]).filter(
        (l) => l >= fromLevel,
      )) {
        await launch('mail-carrier', level);
        // MAIL_MIRRORED=1 (or 0) relaunches until the round's map is (or is not) the mirror image.
        if (process.env.MAIL_MIRRORED)
          for (
            let k = 0;
            k < 12 &&
            (await page.evaluate(() => neo.scene.game.mirrored)) !== (process.env.MAIL_MIRRORED === '1');
            k++
          )
            await launch('mail-carrier', level);
        const mirrored = await page.evaluate(() => neo.scene.game.mirrored);
        if (level >= 7) await page.setViewportSize({ width: 768, height: 1024 });
        const trips = await page.evaluate(() => neo.scene.game.trips.length);
        // Tap a house's middle (the hit area is centered above its feet).
        const house = (i) => tap(`neo.scene.game.houses[${i}]`).then(() => page.waitForTimeout(250));
        if (level === 15) {
          await page.waitForFunction(() => !neo.scene.game.busy);
          assert.equal(
            await page.evaluate(() => neo.scene.game.letters.children.length),
            0,
            'letters wait for a full key',
          );
          assert.ok(
            await page.evaluate(() => neo.scene.game.houses.every((h) => h.resident.visible)),
            'neighbours visible at their doors',
          );
          await screenshot('mail-carrier-15-wet-key-portrait');
          await house(0);
          assert.deepEqual(await counts(), [0, 0], 'house before a row is free');
          const rows = await page.evaluate(() => neo.scene.game.key.map((r) => r.house));
          for (let k = 0; k < rows.length; k++) {
            const h = rows[k];
            await tap(`neo.scene.game.key[${k}].node`);
            if (k === 0) {
              await page.waitForTimeout(550);
              await tap(`neo.scene.game.key[${k}].node`);
              assert.deepEqual(await counts(), [0, 0], 'row replay is free');
              await house((h + 1) % 5);
              await page.waitForTimeout(500);
              await house((h + 1) % 5);
              assert.deepEqual(await counts(), [2, 1]);
              assert.ok(await page.evaluate((h) => neo.scene.game.houses[h].glow.visible, h));
              assert.equal(
                await page.evaluate(() => neo.scene.game.key.filter((r) => r.filled).length),
                0,
                'wrong pairs never fill',
              );
            }
            await house(h);
            await page.waitForFunction(() => !neo.scene.game.busy);
            assert.equal(
              await page.evaluate(
                (k) =>
                  neo.scene.game.key[k].filled &&
                  neo.scene.game.key[k].who.visible &&
                  !neo.scene.game.key[k].wet.visible,
                k,
              ),
              true,
            );
            // U7 R4: the other rows open as the filled row's line starts; the ask for the next row waits for it.
            if (k < rows.length - 1)
              assert.ok(
                await page.evaluate(() => !!neo.scene.game.unasked),
                `R4: key row ${k + 2} open while row ${k + 1}'s line plays`,
              );
          }
          assert.equal(await page.evaluate(() => neo.scene.game.buildingKey), false);
          assert.equal(trips, 2);
          for (let n = 0; n < trips; n++) {
            await idle(n);
            await house(await page.evaluate(() => neo.scene.game.trip[0]));
          }
          await finished('mail-carrier');
          assert.deepEqual(await score('mail-carrier'), [2, 1]);
          assert.equal(await page.evaluate(() => kit.store.stats('mail-carrier').history.length), 1);
          assert.equal(
            await page.evaluate(
              () => kit.store.data.stickers.filter((s) => s.game === 'mail-carrier').length,
            ),
            1,
          );
          await page.setViewportSize({ width: 1024, height: 768 });
          log(
            'Mail Carrier 15: wet key portrait, free replays, wrong pairs/hint, five filled rows, two deliveries and one reward passed',
          );
          continue;
        }
        if (level === 14) {
          for (let n = 0; n < trips; n++) {
            await idle(n);
            const trip = await page.evaluate(() => [...neo.scene.game.trip]);
            const orders = await page.evaluate(async (t) => {
              const { comparisonRoute, routeLength, COMPARE_EDGES } =
                await import('/src/games/mail-carrier/logic.ts');
              return t
                .flatMap((a) =>
                  t.filter((b) => b !== a).map((b) => [a, b, t.find((c) => c !== a && c !== b)]),
                )
                .map((order) => ({ order, count: routeLength(comparisonRoute(order), COMPARE_EDGES) }))
                .sort((a, b) => a.count - b.count);
            }, trip);
            if (n === 0) {
              const nobody = [0, 1, 2, 3, 4].find((h) => !trip.includes(h));
              await house(nobody);
              await page.waitForTimeout(1600);
              await house(nobody);
              await page.waitForTimeout(350);
              assert.deepEqual(await counts(), [2, 1]);
              assert.ok(
                await page.evaluate(() => {
                  const g = neo.scene.game;
                  return g.trip.some(
                    (h) => g.houses[h].glow.visible && g.key.find((r) => r.house === h).glow.visible,
                  );
                }),
              );
              await house(trip[2]);
              await house(trip[2]);
              assert.deepEqual(await page.evaluate(() => neo.scene.game.planned), [], 'undo is free');
            }
            const first = orders.at(-1);
            for (const h of first.order) await house(h);
            assert.deepEqual(
              await page.evaluate(() => neo.scene.game.planned),
              first.order,
              'any order accepted',
            );
            if (n === 0) await screenshot('mail-carrier-14-plan-portrait');
            await tap('neo.scene.game.go');
            await page.waitForFunction(
              () => neo.scene.game.choosingComparison && !neo.scene.game.busy,
              null,
              { timeout: 20000 },
            );
            assert.equal(await page.evaluate(() => neo.scene.game.firstCount), first.count);
            if (n === 0) {
              await screenshot('mail-carrier-14-compare-portrait');
              await tap('neo.scene.game.compareButtons[0]');
              await house([0, 1, 2, 3, 4].find((h) => !trip.includes(h)));
              assert.deepEqual(await counts(), [2, 1], 'optional walk mistakes are unscored');
              assert.deepEqual(await page.evaluate(() => neo.scene.game.trip), trip, 'same bag');
              for (const h of orders[0].order) await house(h);
              assert.ok(orders[0].count < first.count, 'second order is shorter');
              await tap('neo.scene.game.go');
              await page.waitForFunction(() => neo.scene.game.index === 1 && !neo.scene.game.busy, null, {
                timeout: 20000,
              });
              assert.deepEqual(await counts(), [2, 1], 'comparison never adds misses or hints');
            } else await tap('neo.scene.game.compareButtons[1]');
          }
          await finished('mail-carrier');
          assert.deepEqual(await score('mail-carrier'), [2, 1]);
          assert.equal(
            await page.evaluate(() => kit.store.stats('mail-carrier').history.length),
            1,
            'two bags and optional comparison make one round',
          );
          assert.equal(
            await page.evaluate(
              () => kit.store.data.stickers.filter((s) => s.game === 'mail-carrier').length,
            ),
            1,
            'one sticker, including help',
          );
          await page.setViewportSize({ width: 1024, height: 768 });
          log(
            'Mail Carrier 14: any order, undo, two misses/one glow, counted office return, shorter free second walk, skip second comparison and single reward passed',
          );
          continue;
        }
        for (let n = 0; n < trips; n++) {
          await idle(n);
          const trip = await page.evaluate(() => [...neo.scene.game.trip]);
          if (n > 0 && (level === 6 || level === 13)) {
            // U7 R4: the next letter opens while the last stop's thanks plays, its ask waiting.
            assert.ok(
              await page.evaluate(() => !!neo.scene.game.unasked),
              `R4: mail ${level} letter ${n + 1} opened with its ask waiting`,
            );
            if (level === 13) {
              // The letter is a "?": a house tapped before the clue was heard says the clue and is not judged.
              const before = await counts();
              await house((trip[0] + 1) % 5);
              assert.deepEqual(
                await page.evaluate(() => [neo.scene.game.index, !!neo.scene.game.unasked]),
                [n, false],
                'R4: an early tap says the clue',
              );
              assert.deepEqual(await counts(), before, 'R4: the early tap is not judged');
            }
          }
          if (n === 0 && level === 13) {
            await page.evaluate(() => kit.tapOn(neo.scene.game.office, -35, -40));
            assert.deepEqual(await counts(), [0, 0], 'Hazel replay is free');
          }
          if (n === 0) {
            if (level === 6 || level === 13) {
              // Two wrong houses say who lives there; then the key row and the house glow.
              const wrong = (trip[0] + 1) % 5;
              await house(wrong);
              await page.waitForTimeout(1200);
              await house(wrong);
              assert.deepEqual(await counts(), [2, 1]);
            } else if (level === 7) {
              // Letter 2's house first, then a house with no letter: both gentle misses, then a glow.
              const nobody = [0, 1, 2, 3, 4].find((i) => !trip.includes(i));
              await house(trip[1]);
              await house(nobody);
              assert.deepEqual(await counts(), [2, 1]);
            }
            if (level < 8 || level === 13)
              assert.ok(
                await page.evaluate((h) => {
                  const g = neo.scene.game;
                  return g.houses[h].glow.visible && g.key.find((r) => r.house === h).glow.visible;
                }, trip[0]),
                'house and key row glow',
              );
            if (level < 8 || level === 13) await screenshot(`mail-carrier-${level}`);
            if (level === 7) {
              // A planned stop can be taken out again by tapping it.
              await house(trip[0]);
              await house(trip[0]);
              assert.deepEqual(await page.evaluate(() => neo.scene.game.planned), []);
            }
          }
          if (level === 8) {
            if (n === 0) {
              const wrong = (trip[0] + 1) % 5;
              await house(wrong);
              await page.waitForTimeout(1200);
              await house(wrong);
              assert.deepEqual(await counts(), [2, 1]);
              assert.ok(
                await page.evaluate((h) => {
                  const g = neo.scene.game;
                  return g.houses[h].glow.visible && g.key.find((r) => r.house === h).glow.visible;
                }, trip[0]),
                'house and key row glow',
              );
            }
            await house(trip[0]);
            await page.waitForFunction(() => neo.scene.game.routeChoiceButtons.every((b) => b.node.visible));
            if (n === 0) {
              await screenshot(`mail-carrier-${level}`);
              await tap('neo.scene.game.routeChoiceButtons[1].node');
              await page.waitForTimeout(450);
              await tap('neo.scene.game.routeChoiceButtons[1].node');
              assert.deepEqual(await counts(), [4, 2]);
              assert.equal(
                await page.evaluate(() => neo.scene.game.routeChoiceButtons[0].glow.visible),
                true,
                'short route hint glows',
              );
            }
            await tap('neo.scene.game.routeChoiceButtons[0].node');
            if (n < trips - 1)
              await page.waitForFunction((n) => neo.scene.game.index > n && !neo.scene.game.busy, n, {
                timeout: 20000,
              });
            else await page.waitForFunction(() => neo.scene.game.finished, null, { timeout: 20000 });
            continue;
          }
          for (const h of trip) await house(h);
          if (level === 7) {
            assert.deepEqual(await page.evaluate(() => neo.scene.game.planned), trip);
            assert.equal(await page.evaluate(() => neo.scene.game.go.visible), true);
            await tap('neo.scene.game.go');
          }
        }
        await finished('mail-carrier');
        assert.deepEqual(await score('mail-carrier'), level === 8 ? [4, 2] : [2, 1]);
        await page.setViewportSize({ width: 1024, height: 768 });
        log(
          `Mail Carrier ${level} (${level === 13 ? 'spoken map clues' : level === 6 ? 'picture map and key' : level === 7 ? 'two planned stops' : 'shorter of two paths'}${mirrored ? ', mirrored map' : ''}): wrong answers, hints and completion passed`,
        );
      }

    // Lemonade Stand: a forecast, a batch (and a price), one table row a day, help once a day, never a miss.
    if (!only || only === 'lemon')
      for (let level = fromLevel; level <= 5; level++) {
        await launch('lemonade-stand', level);
        if (level === 4 || level === 5) await page.setViewportSize({ width: 768, height: 1024 });
        const plan = await page.evaluate(() => ({
          days: neo.scene.game.plan.days,
          price: neo.scene.game.plan.prices.length > 1,
          purse: neo.scene.game.plan.purse,
        }));
        // What the purse should show after the rows so far (the host's top-up has been added on the morning after).
        const purseNow = () =>
          page.evaluate(async () => {
            const L = await import('/src/games/lemonade-stand/logic.ts');
            let p = L.START_PURSE;
            for (const r of neo.scene.game.rows) p = L.settle(p, r).purse;
            return [p, neo.scene.game.purse];
          });
        for (let n = 0; n < plan.days; n++) {
          await idle(n);
          if (plan.purse) {
            const [want, got] = await purseNow();
            assert.equal(got, want, `day ${n + 1} purse`);
          }
          if (level === 5) {
            // The morning's boats: on day 1 the dearer boat twice (two misses, the glow is the day's one hint, and the
            // lightbulb then adds none), then the cheaper boat; on day 2 the lightbulb is that day's hint.
            await page.waitForFunction(() => neo.scene.game.boatPhase && neo.scene.game.boats.length === 2);
            await page.waitForTimeout(700);
            const right = await page.evaluate(async () => {
              const L = await import('/src/games/lemonade-stand/logic.ts');
              const g = neo.scene.game;
              return L.cheaperBoat(g.week[g.index].boats);
            });
            if (n === 0) {
              await tap(`neo.scene.game.boats[${1 - right}].node`);
              assert.deepEqual(await counts(), [1, 0]);
              await tap(`neo.scene.game.boats[${1 - right}].node`);
              assert.deepEqual(await counts(), [2, 1]);
              await tap('neo.scene.game.help');
              assert.deepEqual(await counts(), [2, 1], 'the glow and the lightbulb count one hint a day');
              await page.waitForTimeout(400);
              await screenshot('lemonade-stand-5-jetty');
            }
            if (n === 1) {
              await tap('neo.scene.game.help');
              assert.deepEqual(await counts(), [2, 2]);
            }
            await tap(`neo.scene.game.boats[${right}].node`);
            await page.waitForFunction(() => !neo.scene.game.boatPhase && !neo.scene.game.busy, null, {
              timeout: 10000,
            });
            await page.waitForTimeout(200);
            // The batch cards show the cheaper boat's price.
            const costs = await page.evaluate(async () => {
              const L = await import('/src/games/lemonade-stand/logic.ts');
              const g = neo.scene.game;
              return g.cards.map((c) => [
                c.cost.text,
                String(L.batchCost(c.n, L.dayPerTwo(g.week[g.index]))),
              ]);
            });
            for (const [got, want] of costs) assert.equal(got, want);
          }
          if (n === 0) {
            // Opening before choosing only nudges; asking for help is one hint a day however often she asks.
            const before = await counts();
            await tap('neo.scene.game.open');
            assert.equal(await page.evaluate(() => neo.scene.game.rows.length), 0);
            assert.deepEqual(await counts(), before);
            await tap('neo.scene.game.help');
            await tap('neo.scene.game.help');
            assert.deepEqual(await counts(), level === 5 ? [2, 1] : [0, 1]);
            await screenshot(`lemonade-stand-${level}`);
          }
          // The first day is a weak batch with the dearest price (an experiment); after that the best choice the model knows.
          const choice = await page.evaluate(async (n) => {
            const L = await import('/src/games/lemonade-stand/logic.ts');
            const g = neo.scene.game;
            if (n === 0) return { made: 4, price: g.plan.prices.at(-1) };
            const b = L.bestChoice(g.plan, g.week[n], n, g.purse);
            return { made: b.made, price: b.price };
          }, n);
          await tap(`neo.scene.game.cards.find((c) => c.n === ${choice.made}).node`);
          if (plan.price) await tap(`neo.scene.game.coins.find((c) => c.value === ${choice.price}).node`);
          await tap('neo.scene.game.open');
          await page.waitForFunction((n) => neo.scene.game.rows.length === n + 1, n, { timeout: 40000 });
          assert.equal(await page.evaluate(() => neo.scene.game.tableRows.length), n + 1);
          if (n === 0) {
            const row = await page.evaluate(() => neo.scene.game.rows[0]);
            assert.equal(row.sold + row.left, row.made);
            await page.waitForTimeout(300);
            await tap('neo.scene.game.tableRows[0].node');
          }
        }
        await finished('lemonade-stand');
        assert.deepEqual(await score('lemonade-stand'), level === 5 ? [2, 2] : [0, 1]);
        await page.setViewportSize({ width: 1024, height: 768 });
        log(
          `Lemonade Stand ${level} (${['weather', 'forecast event', 'price', 'market week', 'two lemon boats'][level - 1]}): early open nudged, help counted once, ${level === 5 ? "dearer boats missed with the glow as the day's one hint, " : ''}${plan.price ? 'a price chosen, ' : ''}${plan.purse ? 'the purse tracked, ' : ''}a row a day read aloud, saved score and sticker passed`,
        );
      }
  }

  return { woodsBatch };
}
