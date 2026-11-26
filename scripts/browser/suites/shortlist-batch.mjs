import { selectValue } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished, next }) {
  async function shortlistBatch() {
    const only = process.env.SHORTLIST_ONLY;
    if (only !== undefined) selectValue(only, ['tower', 'lasso', 'says', 'pat', 'owls'], 'SHORTLIST_ONLY');
    const fromLevel = Number(process.env.FROM_LEVEL || 1);
    const score = (id) =>
      page.evaluate((id) => {
        const r = kit.store.stats(id).history.at(-1);
        return [r.misses, r.hints];
      }, id);
    const idle = async (n) => {
      await page.waitForFunction(
        (n) => {
          const g = neo.scene.game;
          return neo.scene.finished || (g.index === n && !g.busy);
        },
        n,
        { timeout: 30000 },
      );
      await page.waitForTimeout(150);
    };
    const counts = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);
    // A canvas point for logical (x, y).
    const at = (x, y) =>
      page.evaluate(
        ({ x, y }) => {
          const s = neo.view.scale;
          const r = document.querySelector('canvas').getBoundingClientRect();
          return [r.left + x * s, r.top + y * s];
        },
        { x, y },
      );

    if (!only || only === 'tower')
      for (let level = fromLevel; level <= Number(process.env.TO_LEVEL || 7); level++) {
        if (level === 6 && process.env.TOWER_SEED)
          await page.evaluate((seed) => {
            window.towerRandom = Math.random;
            Math.random = () => seed / 2 ** 31;
          }, Number(process.env.TOWER_SEED));
        await launch('block-tower', level);
        if (level === 6 && process.env.TOWER_SEED)
          await page.evaluate(() => {
            Math.random = window.towerRandom;
            delete window.towerRandom;
          });
        const savedTower = await page.evaluate(() => [
          kit.store.data.stickers.length,
          kit.store.stats('block-tower').history.length,
        ]);
        if (level === 6) {
          const directions = await page.evaluate(() => neo.scene.game.reachRounds.map((r) => r.direction));
          assert.deepEqual([...directions].sort(), [-1, 1]);
          log(`Block Tower reach order: ${directions.join(',')}`);
        }
        if (level === 4 || level === 5 || level === 7)
          await page.setViewportSize({ width: 768, height: 1024 });
        const { rounds, mode } = await page.evaluate(() => ({
          rounds: neo.scene.game.rounds.length,
          mode: neo.scene.game.plan.mode,
        }));
        if (mode === 'flag' || mode === 'match') {
          const heights = await page.evaluate(() => neo.scene.game.rounds.map((r) => r.bear ?? r.target));
          assert.equal(new Set(heights).size, 3, 'three different seeded reference heights');
        }
        for (let n = 0; n < rounds; n++) {
          await idle(n);
          if (mode === 'tumble' || mode === 'friend') {
            // Lap play: a tap anywhere stacks, up to the friend's height, then knocks it all down.
            while (!(await page.evaluate(() => neo.scene.game.full))) {
              const [x, y] = await at(300, 200);
              await page.mouse.click(x, y);
              await page.waitForTimeout(260);
            }
            assert.equal(
              await page.evaluate(() => neo.scene.game.stack.length),
              await page.evaluate(() => neo.scene.game.round.target),
            );
            await page.waitForFunction(() => !neo.scene.game.busy);
            if (n === 0) await screenshot(`block-tower-${level}`);
            const [x, y] = await at(300, 200);
            await page.mouse.click(x, y);
          } else if (mode === 'flag' || mode === 'match') {
            const want = await page.evaluate(() => neo.scene.game.round.target);
            const bin = async (k) => {
              for (let i = 0; i < k; i++) {
                await tap('neo.scene.game.bin');
                await page.waitForTimeout(150);
              }
            };
            if (n === 0) {
              // One too many, then one too few, then one too many again: three explained misses, one counted hint.
              await bin(want + 1);
              await tap('neo.scene.game.bell');
              await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
              assert.equal(
                await page.evaluate(() => neo.scene.game.glowTop),
                false,
                'a first too-tall check does not glow the top block yet',
              );
              const top = await page.evaluate(() => {
                const h = neo.scene.game.towerHit.hitArea;
                return [h.x + h.width / 2, h.y + 40];
              });
              for (let k = 0; k < 2; k++) {
                const [x, y] = await at(top[0], top[1] + k * 62);
                await page.mouse.click(x, y);
                await page.waitForTimeout(350);
              }
              assert.equal(
                await page.evaluate(() => neo.scene.game.stack.length),
                want - 1,
                'tapping the tower takes the top block off',
              );
              await tap('neo.scene.game.bell');
              await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 40000 });
              assert.deepEqual(await counts(), [2, 1]);
              await bin(2);
              await tap('neo.scene.game.bell');
              await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 40000 });
              assert.deepEqual(await counts(), [3, 1], 'help repeats without counting another hint');
              assert.equal(
                await page.evaluate(() => neo.scene.game.glowTop),
                true,
                'too tall after two misses glows the top block',
              );
              await screenshot(`block-tower-${level}`);
              const [x, y] = await at(top[0], top[1]);
              await page.mouse.click(x, y);
              await page.waitForTimeout(350);
              assert.equal(
                await page.evaluate(() => neo.scene.game.glowTop),
                false,
                'taking the top off clears the glow',
              );
            } else await bin(want);
            assert.equal(await page.evaluate(() => neo.scene.game.stack.length), want);
            await tap('neo.scene.game.bell');
          } else if (mode === 'stand') {
            const frozen = await page.evaluate(() => JSON.stringify(neo.scene.game.stand));
            const saved = await page.evaluate(() => [
              kit.store.data.stickers.length,
              kit.store.stats('block-tower').history.length,
            ]);
            await tap(
              `neo.scene.game.standTowers[${n === 1 ? 'neo.scene.game.stand.stands' : '1 - neo.scene.game.stand.stands'}][1]`,
            );
            await page.waitForFunction(() => neo.scene.game.observation.phase === 'result', null, {
              timeout: 30000,
            });
            assert.deepEqual(await counts(), [0, 0]);
            if (n === 0 || n === 2) {
              if (n === 0) await screenshot('block-tower-5-result-portrait');
              await tap('neo.scene.game.watchAgain');
              // Resize while replay releases; the retained evidence follows the logical view.
              await page.setViewportSize({ width: 1024, height: 768 });
              await page.waitForFunction(() => neo.scene.game.observation.phase === 'result', null, {
                timeout: 30000,
              });
              assert.equal(await page.evaluate(() => JSON.stringify(neo.scene.game.stand)), frozen);
              assert.equal(await page.evaluate(() => neo.scene.game.index), n);
              assert.deepEqual(
                await page.evaluate(() => [
                  kit.store.data.stickers.length,
                  kit.store.stats('block-tower').history.length,
                ]),
                saved,
              );
              await page.setViewportSize({ width: 768, height: 1024 });
            }
            await tap('neo.scene.game.continueStand');
            if (n === 2) {
              await finished('block-tower');
              assert.deepEqual(
                await page.evaluate(() => [
                  kit.store.data.stickers.length,
                  kit.store.stats('block-tower').history.length,
                ]),
                saved.map((v) => v + 1),
              );
            }
          } else if (mode === 'mend') {
            // Mend: a let go before a move, a cancelled drag, two tumbles (one each way) with a replay, Try again and
            // an undo, then the glowing place stands; nothing is ever a miss.
            const state = () =>
              page.evaluate(() => {
                const t = neo.scene.game.trial;
                return { phase: t.phase, top: t.top, failed: t.failed, moves: t.moves.length };
              });
            const slide = async (slot) => {
              await page.waitForFunction(() => !neo.scene.game.busy && neo.scene.game.trial.phase === 'held');
              const [x, y] = await page.evaluate((slot) => {
                const g = neo.scene.game;
                return [g.mendScreen(slot), g.mendBlocks.at(-1).y - 31 + 40];
              }, slot);
              const target = await at(x, y);
              await page.evaluate(async (target) => {
                await kit.dragTo(neo.scene.game.mendBlocks.at(-1), { x: target[0], y: target[1] }, 12);
              }, target);
              await page.waitForTimeout(400);
              assert.equal((await state()).top, slot, `the top block slid to ${slot}`);
            };
            const release = async (want) => {
              await tap('neo.scene.game.letGo');
              await page.waitForFunction(
                (n) => {
                  const g = neo.scene.game;
                  return neo.scene.finished || g.index > n || (g.trial.phase === 'result' && !g.busy);
                },
                n,
                { timeout: 30000 },
              );
              if (want) assert.equal((await state()).phase, want);
            };
            const plan = await page.evaluate(async () => {
              const g = neo.scene.game;
              const { mendDomain, mendBase, mendHint, topples } =
                await import('/src/games/block-tower/logic.ts');
              const t = g.trial.task;
              const base = mendBase(t);
              const falls = (x) => topples([...base, x], null);
              const domain = mendDomain(t);
              return {
                out: domain.find((x) => falls(x) === 1 && x !== g.trial.start),
                back: domain.find((x) => falls(x) === base.length),
                hint: mendHint(t),
              };
            });
            if (n === 0) {
              await tap('neo.scene.game.letGo');
              await page.waitForTimeout(400);
              assert.deepEqual(
                await page.evaluate(() => {
                  const t = neo.scene.game.trial;
                  return [t.phase, t.top === t.start, t.failed, t.moves.length];
                }),
                ['held', true, 0, 0],
                'a let go before any move releases nothing',
              );
              assert.deepEqual(
                await page.evaluate(() => {
                  const g = neo.scene.game;
                  const top = g.mendBlocks.at(-1);
                  top.emit('pointerdown', { pointerId: 82, global: top.getGlobalPosition() });
                  top.x += 60;
                  window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 82 }));
                  return [g.trial.moves.length, g.trial.top === g.trial.start, g.misses, g.hints];
                }),
                [0, true, 0, 0],
                'a cancelled drag puts the top block back and records nothing',
              );
              await page.waitForTimeout(500);
              await slide(plan.out);
              await release('result');
              assert.equal((await state()).failed, 1);
              await screenshot('block-tower-7-tumble-portrait');
              await tap('neo.scene.game.watchAgain');
              await page.waitForFunction(() => neo.scene.game.busy);
              await page.waitForFunction(
                () => neo.scene.game.trial.phase === 'result' && !neo.scene.game.busy,
                null,
                { timeout: 30000 },
              );
              assert.equal((await state()).failed, 1, 'Watch again counts nothing');
              await tap('neo.scene.game.tryAgain');
              await page.waitForTimeout(300);
              assert.deepEqual(await state(), { phase: 'held', top: plan.out, failed: 1, moves: 1 });
              await slide(plan.back);
              await tap('neo.scene.game.undo');
              await page.waitForTimeout(300);
              assert.equal((await state()).top, plan.out, 'undo returns the latest move');
              await slide(plan.back);
              await release('result');
              assert.deepEqual(await counts(), [0, 1]);
              await tap('neo.scene.game.tryAgain');
              await page.waitForTimeout(300);
              assert.ok(
                await page.evaluate(() => neo.scene.game.hintGhost.visible),
                'the place that works glows',
              );
              await screenshot(`block-tower-${level}`);
            }
            await slide(plan.hint);
            await release();
            assert.deepEqual(await counts(), [0, 1]);
          } else {
            // Reach: a topple and a full short stack, top revision, then symmetric solutions on both edges.
            const drop = async (slot) => {
              await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
              const [k, edge, top, direction] = await page.evaluate(() => {
                const g = neo.scene.game;
                return [g.placed.length, g.edge, g.tableTop, g.reachRound.direction];
              });
              const target = await at(edge + (direction * (slot * 104)) / 8, top - k * 62 + 40);
              await page.evaluate(async (target) => {
                const t = neo.scene.game.tray.find((t) => t.x === null);
                await kit.dragTo(t.node, { x: target[0], y: target[1] }, 12);
              }, target);
              await page.waitForTimeout(500);
            };
            if (n === 0) {
              // Audit the landing window, cancelled releases, resize and top-only lifting before scored trials.
              assert.deepEqual(
                await page.evaluate(() => {
                  const g = neo.scene.game;
                  return [-12, 8, 9, 10].map((x) => g.slot(g.reachScreen(x), g.tableTop));
                }),
                [-12, 8, 8, 8],
                'live drop and ghost share the solver domain',
              );
              assert.deepEqual(
                await page.evaluate(() => {
                  const g = neo.scene.game,
                    t = g.tray[0];
                  t.node.emit('pointerdown', { pointerId: 81, global: t.node.getGlobalPosition() });
                  t.node.position.set(g.reachScreen(-3), g.tableTop);
                  window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 81 }));
                  return [t.x, t.drag.dragging, g.misses, g.hints];
                }),
                [null, false, 0, 0],
                'cancel over table returns to tray without committing or scoring',
              );
              await page.waitForTimeout(500);
              assert.deepEqual(
                await page.evaluate(async () => {
                  const g = neo.scene.game;
                  await kit.dragTo(g.tray[0].node, { x: g.reachScreen(-3), y: g.tableTop + 40 }, 12);
                  neo.paused = true; // Freeze the real landing tween to inspect the brief input window.
                  const first = g.tray[0],
                    second = g.tray[1];
                  second.node.emit('pointerdown', { pointerId: 82, global: second.node.getGlobalPosition() });
                  first.node.emit('pointerdown', { pointerId: 83, global: first.node.getGlobalPosition() });
                  return [g.busy, first.drag.dragging, second.drag.dragging, g.placed.length];
                }),
                [true, false, false, 1],
                'neither a second drop nor a top lift interrupts landing',
              );
              await page.setViewportSize({ width: 768, height: 1024 });
              await page.evaluate(() => {
                neo.paused = false;
              });
              await idle(n);
              assert.ok(
                await page.evaluate(() => {
                  const g = neo.scene.game,
                    t = g.placed[0];
                  return t.node.x === g.reachScreen(-3) && t.node.y === g.tableTop && t.drag.enabled;
                }),
                'landing relayouts against the resized table before controls reopen',
              );
              // Simulate an existing next-placement hint; lifting invalidates it and returns only the top.
              assert.deepEqual(
                await page.evaluate(async () => {
                  const g = neo.scene.game,
                    t = g.placed[0];
                  g.hintGhost.visible = true;
                  const p = t.node.getGlobalPosition();
                  t.node.emit('pointerdown', { pointerId: 84, global: p });
                  const cleared = !g.hintGhost.visible;
                  t.node.position.set(g.view.w - 200, g.floor + 30);
                  t.node.emit('pointerup', { pointerId: 84 });
                  await kit.sleep(500);
                  return [cleared, g.placed.length, g.misses, g.hints];
                }),
                [true, 0, 0, 0],
                'top lift clears stale help and returns the block without a miss',
              );
              await page.setViewportSize({ width: 1024, height: 768 });
              await page.waitForTimeout(200);
              await drop(3);
              await page.waitForFunction(() => !neo.scene.game.busy && neo.scene.game.placed.length === 0);
              await drop(-3);
              await drop(-3); // Stable, full, short stack: a different explained experiment.
              await idle(n); // Its spoken explanation finishes before constructive help appears.
              assert.deepEqual(await counts(), [0, 1], 'a topple and a short stack are unscored experiments');
              assert.ok(
                await page.evaluate(() => neo.scene.game.glowTop),
                'impossible prefix highlights the actual top block',
              );
              await page.evaluate(async () => {
                const g = neo.scene.game;
                await kit.dragTo(g.placed.at(-1).node, { x: g.view.w - 200, y: g.floor + 70 }, 12);
              });
              await page.waitForTimeout(500);
              // Repeating help after revision keeps the task's hint counted once.
              await page.evaluate(() => neo.scene.game.reachHint());
              assert.deepEqual(await counts(), [0, 1]);
              assert.ok(
                await page.evaluate(() => neo.scene.game.hintGhost.visible),
                'a glowing place for the next block',
              );
              await screenshot(`block-tower-${level}`);
            }
            if (await page.evaluate(() => neo.scene.game.reachRound.direction === -1)) {
              await page.setViewportSize({ width: 768, height: 1024 });
              await page.waitForTimeout(200);
              assert.ok(
                await page.evaluate(() => {
                  const g = neo.scene.game;
                  return (
                    !g.hintGhost.visible ||
                    (g.hintGhost.x === g.reachScreen(g.hintSlot) &&
                      g.hintGhost.y === g.tableTop - g.placed.length * 62)
                  );
                }),
                'hint follows the resized table',
              );
              await screenshot('block-tower-6-left-portrait');
            }
            const way = await page.evaluate(async () => {
              const g = neo.scene.game;
              return (await import('/src/games/block-tower/logic.ts')).finish(
                g.placed.map((t) => t.x),
                g.reachRound,
              );
            });
            for (const slot of way) await drop(slot);
          }
        }
        await finished('block-tower');
        assert.deepEqual(
          await page.evaluate(() => [
            kit.store.data.stickers.length,
            kit.store.stats('block-tower').history.length,
          ]),
          savedTower.map((v) => v + 1),
        );
        assert.deepEqual(
          await score('block-tower'),
          mode === 'flag' || mode === 'match'
            ? [3, 1]
            : mode === 'mend' || mode === 'reach'
              ? [0, 1]
              : [0, 0],
        );
        await page.setViewportSize({ width: 1024, height: 768 });
        log(
          `Block Tower ${level} (${mode}): ${{ tumble: 'stack and tumble', friend: 'as tall as a friend', flag: 'up to the flag, too tall and too short explained, counted hint, top glow only after two misses', match: "compared with Duck's tower, explained misses, counted hint, top glow only after two misses", stand: 'both predictions unscored, frozen first/third replay and resize, explicit Continue, one sticker', reach: 'unscored topple and short stack explained, glowing hint place, star reached', mend: 'let go before a move, cancelled drag, two unscored tumbles with replay, Try again and undo, glowing place, both mended' }[mode]}, saved score and sticker passed`,
        );
      }

    if (!only || only === 'lasso') {
      // Loops are drawn like a finger would: around a chosen group, checked to hold exactly that group.
      await page.evaluate(async () => {
        const { inside } = await import('/src/games/lasso-loops/logic.ts');
        const hull = (pts) => {
          const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
          const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
          const half = (list) => {
            const h = [];
            for (const q of list) {
              while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop();
              h.push(q);
            }
            return h;
          };
          return half(p)
            .slice(0, -1)
            .concat(half([...p].reverse()).slice(0, -1));
        };
        const around = (pts) =>
          hull(
            pts.flatMap((q) =>
              Array.from({ length: 8 }, (_, k) => ({
                x: q.x + 26 * Math.cos((k * Math.PI) / 4),
                y: q.y + 26 * Math.sin((k * Math.PI) / 4),
              })),
            ),
          );
        window.lasso = {
          loop(n) {
            const g = neo.scene.game;
            const free = g.free;
            for (const seed of free) {
              const group = [...free]
                .sort(
                  (a, b) => Math.hypot(a.x - seed.x, a.y - seed.y) - Math.hypot(b.x - seed.x, b.y - seed.y),
                )
                .slice(0, n);
              const poly = around(group.map((f) => ({ x: f.x, y: f.y })));
              if (free.filter((f) => inside(poly, f.position)).length === n) return poly;
            }
            throw new Error(`No loop of ${n}`);
          },
          async draw(poly) {
            const s = neo.view.scale;
            const r = document.querySelector('canvas').getBoundingClientRect();
            const pts = [...poly, poly[0]];
            const path = pts
              .flatMap((p, i) =>
                i ? kit.line([pts[i - 1].x, pts[i - 1].y], [p.x, p.y], 4).slice(1) : [[p.x, p.y]],
              )
              .map(([x, y]) => [r.left + x * s, r.top + y * s]);
            await kit.drag(path, 1, 4);
            await kit.sleep(250);
          },
        };
      });
      for (let level = fromLevel; level <= Number(process.env.TO_LEVEL || 9); level++) {
        await launch('lasso-loops', level);
        if (level === 9) {
          // Ten more, ten less, on an upright phone: the jars start full; a loop of two changes only the ones (a wrong
          // tick, named), a second wrong tick glows the leaf (one hint), the leaf is let go and looped again, ten more is
          // a whole jar; then ten less is a jar let go.
          await page.setViewportSize({ width: 390, height: 844 });
          for (
            let k = 0;
            k < 40 &&
            (await page.evaluate(() => {
              const r = neo.scene.game.round;
              return r.asks[0] !== 'more' || r.start.leaf > 6;
            }));
            k++
          )
            await launch('lasso-loops', level);
          await page.waitForFunction(() => neo.scene.game.L.upright && !neo.scene.game.busy, null, {
            timeout: 30000,
          });
          const state = () => page.evaluate(() => neo.scene.game.makeState);
          const settle = () => page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
          const { start, asks, fireflies, target } = await page.evaluate(() => neo.scene.game.round);
          const from = 10 * start.jars + start.leaf;
          assert.deepEqual(asks, ['more', 'less']);
          assert.equal(target, from + 10);
          assert.deepEqual(await page.evaluate(() => neo.scene.mod.levels('school')), { min: 3, max: 9 });
          assert.deepEqual(await state(), start);
          assert.equal(
            await page.evaluate(() => {
              const g = neo.scene.game;
              return g.guessSign.visible && g.guessNumber.text === String(g.target) && g.free.length;
            }),
            fireflies - from,
          );
          await page.evaluate(() => {
            const g = neo.scene.game;
            const say = g.ctx.say;
            window.lassoSaid = [];
            g.ctx.say = (id, ...rest) => (lassoSaid.push(id), say(id, ...rest));
          });
          await page.evaluate(async () => lasso.draw(lasso.loop(2)));
          await page.waitForFunction(
            (n) => neo.scene.game.leafFlies.length === n && !neo.scene.game.busy,
            start.leaf + 2,
            { timeout: 30000 },
          );
          await tap('neo.scene.game.doneButton');
          await page.waitForFunction(() => neo.scene.game.misses === 1 && !neo.scene.game.busy, null, {
            timeout: 30000,
          });
          assert.deepEqual(await counts(), [1, 0]);
          assert.ok((await page.evaluate(() => lassoSaid)).includes('lasso.shift-ones-more'));
          await page.waitForTimeout(450);
          await tap('neo.scene.game.doneButton');
          await page.waitForFunction(() => neo.scene.game.misses === 2 && !neo.scene.game.busy, null, {
            timeout: 30000,
          });
          assert.deepEqual(await counts(), [2, 1]);
          // The leaf holds too many: it glows, and no jar does.
          assert.deepEqual(
            await page.evaluate(() => [
              neo.scene.game.leafGlow.visible,
              neo.scene.game.jars.some((j) => j.glow.visible),
            ]),
            [true, false],
          );
          assert.ok((await page.evaluate(() => lassoSaid)).includes('lasso.shift-hint-leaf-remove'));
          await page.waitForTimeout(300);
          await screenshot('lasso-loops-9-ten-more');
          await tap('neo.scene.game.leaf');
          await page.waitForFunction(
            () => neo.scene.game.leafFlies.length === 0 && !neo.scene.game.busy,
            null,
            { timeout: 30000 },
          );
          await page.evaluate(async (n) => lasso.draw(lasso.loop(n)), start.leaf);
          await page.waitForFunction(
            (n) => neo.scene.game.leafFlies.length === n && !neo.scene.game.busy,
            start.leaf,
            { timeout: 30000 },
          );
          await page.evaluate(async () => lasso.draw(lasso.loop(10)));
          await page.waitForFunction(
            (j) => neo.scene.game.makeState.jars === j && !neo.scene.game.busy,
            start.jars + 1,
            { timeout: 30000 },
          );
          assert.deepEqual(await state(), { jars: start.jars + 1, leaf: start.leaf });
          await tap('neo.scene.game.doneButton');
          // The second ask: ten less than what is held now, on the sign; the round is not over.
          await page.waitForFunction(() => neo.scene.game.shiftIndex === 1 && !neo.scene.game.busy, null, {
            timeout: 30000,
          });
          assert.deepEqual(
            await page.evaluate(() => [
              neo.scene.game.guessNumber.text,
              neo.scene.game.finished,
              neo.scene.game.target,
            ]),
            [String(from), false, from],
          );
          assert.ok((await page.evaluate(() => lassoSaid)).includes('lasso.shift-right-more'));
          await page.evaluate((j) => kit.tapOn(neo.scene.game.jars[j], 0, -30), start.jars);
          await page.waitForFunction(
            (j) => neo.scene.game.makeState.jars === j && !neo.scene.game.busy,
            start.jars,
            { timeout: 30000 },
          );
          await settle();
          assert.deepEqual(await state(), start);
          assert.equal(await page.evaluate(() => neo.scene.game.free.length), fireflies - from);
          await tap('neo.scene.game.doneButton');
          await finished('lasso-loops');
          assert.ok((await page.evaluate(() => lassoSaid)).includes('lasso.shift-right-less'));
          assert.deepEqual(await score('lasso-loops'), [2, 1]);
          await page.setViewportSize({ width: 1024, height: 768 });
          log(
            `Lasso Loops 9 (upright phone): the jars held ${from}; two more on the leaf and a tick (a miss, "you changed the ones"), a second wrong tick (the leaf glowed, one hint), the leaf let go and looped again, ten looped into a jar made ${from + 10}; then a jar let go made ${from} again; saved score and sticker passed`,
          );
          continue;
        }
        if (level === 8) {
          // Make the number, on an upright phone: a loop of more than ten is let go (free), nine then four regroup on the
          // leaf, two wrong ticks (two misses, then the glow and one hint), the leaf and the jar are let go (free), the
          // phone turns, and tens then ones make the number.
          await page.setViewportSize({ width: 390, height: 844 });
          for (let k = 0; k < 30 && (await page.evaluate(() => neo.scene.game.round.target < 24)); k++)
            await launch('lasso-loops', level);
          await page.waitForFunction(() => neo.scene.game.L.upright && !neo.scene.game.busy, null, {
            timeout: 30000,
          });
          const state = () => page.evaluate(() => neo.scene.game.makeState);
          const settle = () => page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
          const { target, fireflies } = await page.evaluate(() => neo.scene.game.round);
          assert.ok(target >= 24 && target <= 36 && fireflies >= target + 3 && fireflies <= 39);
          assert.deepEqual(await page.evaluate(() => neo.scene.mod.levels('school')), { min: 3, max: 9 });
          assert.equal(
            await page.evaluate(() => {
              const g = neo.scene.game;
              return (
                g.guessSign.visible &&
                g.guessNumber.text === String(g.round.target) &&
                g.leaf.visible &&
                g.jars.length === 3 &&
                g.doneButton.visible
              );
            }),
            true,
          );
          await page.evaluate(async () => lasso.draw(lasso.loop(11)));
          await settle();
          assert.deepEqual(await state(), { jars: 0, leaf: 0 });
          assert.deepEqual(await counts(), [0, 0]);
          await page.evaluate(async () => lasso.draw(lasso.loop(9)));
          await page.waitForFunction(
            () => neo.scene.game.leafFlies.length === 9 && !neo.scene.game.busy,
            null,
            {
              timeout: 30000,
            },
          );
          await page.evaluate(async () => lasso.draw(lasso.loop(4)));
          await page.waitForFunction(
            () => neo.scene.game.jars[0].flies.length === 10 && !neo.scene.game.busy,
            null,
            {
              timeout: 30000,
            },
          );
          assert.deepEqual(await state(), { jars: 1, leaf: 3 });
          assert.equal(await page.evaluate(() => neo.scene.game.free.length), fireflies - 13);
          await tap('neo.scene.game.doneButton');
          await page.waitForFunction(() => neo.scene.game.misses === 1 && !neo.scene.game.busy, null, {
            timeout: 30000,
          });
          assert.deepEqual(await counts(), [1, 0]);
          assert.equal(await page.evaluate(() => neo.scene.game.jars.some((j) => j.glow.visible)), false);
          await page.waitForTimeout(450);
          await tap('neo.scene.game.doneButton');
          await page.waitForFunction(() => neo.scene.game.misses === 2 && !neo.scene.game.busy, null, {
            timeout: 30000,
          });
          assert.deepEqual(await counts(), [2, 1]);
          // Short by ten or more: the next empty jar glows.
          assert.deepEqual(await page.evaluate(() => neo.scene.game.jars.map((j) => j.glow.visible)), [
            false,
            true,
            false,
          ]);
          await page.waitForTimeout(300);
          await screenshot('lasso-loops-8-make-the-number');
          // Free undo: the leaf, then the jar (tapped on its glass, above its foot).
          await tap('neo.scene.game.leaf');
          await page.waitForFunction(
            () => neo.scene.game.leafFlies.length === 0 && !neo.scene.game.busy,
            null,
            {
              timeout: 30000,
            },
          );
          await page.evaluate(() => kit.tapOn(neo.scene.game.jars[0], 0, -30));
          await page.waitForFunction(
            () => neo.scene.game.jars[0].flies.length === 0 && !neo.scene.game.busy,
            null,
            {
              timeout: 30000,
            },
          );
          assert.deepEqual(await state(), { jars: 0, leaf: 0 });
          assert.equal(await page.evaluate(() => neo.scene.game.free.length), fireflies);
          assert.equal(
            await page.evaluate(
              () => neo.scene.game.jars.some((j) => j.glow.visible) || neo.scene.game.leafGlow.visible,
            ),
            false,
          );
          assert.deepEqual(await counts(), [2, 1]);
          // Turned sideways the tick stands on the jar line; every free firefly is back in the field.
          await page.setViewportSize({ width: 844, height: 390 });
          await page.waitForFunction(() => !neo.scene.game.L.upright, null, { timeout: 10000 });
          await page.waitForTimeout(300);
          assert.equal(
            await page.evaluate(() => {
              const g = neo.scene.game;
              const f = g.L.field;
              return (
                g.doneButton.x === g.L.done.x &&
                g.doneButton.y === g.L.done.y &&
                g.free.every((b) => b.x >= f.x && b.x <= f.x + f.w && b.y >= f.y && b.y <= f.y + f.h)
              );
            }),
            true,
          );
          for (let j = 0; j < Math.floor(target / 10); j++) {
            await page.evaluate(async () => lasso.draw(lasso.loop(10)));
            await page.waitForFunction((j) => neo.scene.game.makeState.jars > j && !neo.scene.game.busy, j, {
              timeout: 30000,
            });
          }
          if (target % 10) {
            await page.evaluate(async (n) => lasso.draw(lasso.loop(n)), target % 10);
            await page.waitForFunction(
              (n) => neo.scene.game.leafFlies.length === n && !neo.scene.game.busy,
              target % 10,
              {
                timeout: 30000,
              },
            );
          }
          assert.deepEqual(await state(), { jars: Math.floor(target / 10), leaf: target % 10 });
          await tap('neo.scene.game.doneButton');
          await finished('lasso-loops');
          assert.deepEqual(await score('lasso-loops'), [2, 1]);
          await page.setViewportSize({ width: 1024, height: 768 });
          log(
            `Lasso Loops 8 (upright phone, then turned): make ${target} from ${fireflies}; a loop of 11 let go free, 9 then 4 regrouped to a jar and 3, two wrong ticks (two misses, the empty jar glowed, one hint), leaf and jar let go free, tens then ones after the turn, saved score and sticker passed`,
          );
          continue;
        }
        if (level === 7) {
          // Too few, too many: loop the benchmark jar, tap the card that could be right once (a miss; it stays), tap the
          // others away, and the one left becomes the sign before level 4's tens round checks it. On an upright phone.
          await page.setViewportSize({ width: 390, height: 844 });
          await page.waitForFunction(() => neo.scene.game.L.upright, null, { timeout: 10000 });
          await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
          assert.deepEqual(await page.evaluate(() => neo.scene.mod.levels('school')), { min: 3, max: 9 });
          assert.equal(await page.evaluate(() => neo.scene.game.jars.filter((j) => j.visible).length), 1);
          await page.evaluate(async () => lasso.draw(lasso.loop(10)));
          await page.waitForFunction(
            () => {
              const g = neo.scene.game;
              // The cards grow in; wait until they are full size.
              return g.guessCards.length === 5 && !g.busy && g.guessCards.every((c) => c.scale.x === 1);
            },
            null,
            { timeout: 30000 },
          );
          const possible = 'neo.scene.game.guessCards.find((c) => c.value > 10 && c.value <= 40)';
          await tap(possible);
          await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
          assert.deepEqual(await counts(), [1, 0]);
          assert.equal(await page.evaluate(() => neo.scene.game.guessCards.length), 5);
          await screenshot('lasso-loops-7-tap-away');
          for (let k = 0; k < 4; k++) {
            await tap('neo.scene.game.guessCards.find((c) => c.value <= 10 || c.value > 40)');
            await page.waitForFunction(
              (left) => !neo.scene.game.busy && neo.scene.game.guessCards.length <= left,
              4 - k,
              { timeout: 30000 },
            );
          }
          await page.waitForFunction(
            () => {
              const g = neo.scene.game;
              return !g.busy && g.guessCards.length === 0 && g.jars.every((j) => j.visible);
            },
            null,
            { timeout: 30000 },
          );
          assert.equal(
            await page.evaluate(() => {
              const g = neo.scene.game;
              const near = 10 * Math.floor((g.round.fireflies + 5) / 10);
              return g.guessSign.visible && g.guess === near && g.guessNumber.text === String(near);
            }),
            true,
          );
          const jars = await page.evaluate(() => neo.scene.game.jars.length);
          for (let j = 1; j < jars; j++) {
            await page.evaluate(async () => lasso.draw(lasso.loop(10)));
            await page.waitForFunction((j) => neo.scene.game.index > j || neo.scene.game.pads.length > 0, j, {
              timeout: 30000,
            });
          }
          await page.waitForFunction(() => neo.scene.game.pads.length === 3 && !neo.scene.game.busy, null, {
            timeout: 30000,
          });
          await tap('neo.scene.game.pads.find((p) => p.value === neo.scene.game.round.answer)');
          await finished('lasso-loops');
          assert.deepEqual(await score('lasso-loops'), [1, 0]);
          await page.setViewportSize({ width: 1024, height: 768 });
          log(
            'Lasso Loops 7 (upright phone): benchmark jar on the shelf, a possible card tapped once (one miss, it stayed), four impossible cards tapped away, the near ten became the sign, tens round, saved score and sticker passed',
          );
          continue;
        }
        // Level 4 mixes teens, decades and 21–39: relaunch until a decade, the round with nothing on the leaf.
        for (
          let k = 0;
          level === 4 && k < 30 && !(await page.evaluate(() => neo.scene.game.round.ones === 0));
          k++
        )
          await launch('lasso-loops', level);
        if (level >= 4) await page.setViewportSize({ width: 768, height: 1024 });
        // U7 R4: a lassoed jar's count and a guess card's reaction start, and the loops (or the cards) open before the
        // line ends; only the last jar's count is heard out.
        await page.evaluate(() => {
          const g = neo.scene.game,
            say = g.ctx.say.bind(g.ctx);
          window.lassoR4 = [];
          g.ctx.say = (id, vars) => {
            const line = say(id, vars);
            if (id === 'count' || /^lasso\.(guessed|keep|changed)$/.test(String(id))) {
              const t = performance.now(),
                o = { id: String(id), last: false };
              lassoR4.push(o);
              if (id === 'count')
                queueMicrotask(
                  () =>
                    (o.last =
                      g.index >= g.jars.length || (g.plan.mode === 'free' && !g.free.length) || g.finished),
                );
              void line.then(() => (o.ends = performance.now() - t));
              void kit.until(() => g.finished || !g.busy, 8000).then(() => (o.opens = performance.now() - t));
            }
            return line;
          };
        });
        await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
        if (level === 6) {
          assert.deepEqual(await page.evaluate(() => neo.scene.mod.levels('school')), { min: 3, max: 9 });
          await tap(
            'neo.scene.game.guessCards.find((c) => Math.abs(c.value - neo.scene.game.round.fireflies) >= 10)',
          );
          await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
          assert.deepEqual(await counts(), [0, 0]);
          assert.equal(await page.evaluate(() => neo.scene.game.jars.filter((j) => j.visible).length), 1);
        }
        const jars = await page.evaluate(() => neo.scene.game.jars.length);
        for (let j = 0; j < jars; j++) {
          await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.game.finished, null, {
            timeout: 30000,
          });
          if (await page.evaluate(() => neo.scene.game.finished || !neo.scene.game.free.length)) break;
          const want = await page.evaluate(() => neo.scene.game.jar.want || 2);
          if (level === 6 && j === 1) {
            const before = await counts();
            await screenshot('lasso-loops-6-guess-sign');
            await tap(
              'neo.scene.game.guessCards.find((c) => Math.abs(c.value - neo.scene.game.round.fireflies) < 10)',
            );
            await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
            assert.deepEqual(await counts(), before);
            assert.equal(
              await page.evaluate(() => {
                const g = neo.scene.game;
                return (
                  g.guessSign.visible &&
                  g.guessNumber.text === String(g.guess) &&
                  Math.abs(g.guess - g.round.fireflies) < 10
                );
              }),
              true,
            );
            assert.equal(await page.evaluate(() => neo.scene.game.jars.every((j) => j.visible)), true);
          }
          if (j === 0 && level > 1) {
            // Two loops with one too many: gentle misses, then rings around a group that fits.
            for (let k = 0; k < 2; k++) {
              await page.evaluate(async (n) => lasso.draw(lasso.loop(n)), want + 1);
              await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
            }
            assert.deepEqual(await counts(), [2, 1]);
            assert.equal(
              await page.evaluate(() => neo.scene.game.flies.filter((f) => f.ring.visible).length),
              want,
            );
            if (level !== 6) await screenshot(`lasso-loops-${level}`);
          }
          await page.evaluate(async (n) => lasso.draw(lasso.loop(n)), want);
          await page.waitForFunction(
            (j) => {
              const g = neo.scene.game;
              return g.index > j || g.finished || g.pads.length > 0;
            },
            j,
            { timeout: 30000 },
          );
        }
        if (level >= 3) {
          // How many in all? A wrong number is counted aloud the way the jars show it.
          await page.waitForFunction(() => neo.scene.game.pads.length === 3 && !neo.scene.game.busy, null, {
            timeout: 30000,
          });
          if (level !== 6) await screenshot(`lasso-loops-${level}-question`);
          await tap('neo.scene.game.pads.find((p) => p.value !== neo.scene.game.round.answer)');
          await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 40000 });
          await tap('neo.scene.game.pads.find((p) => p.value === neo.scene.game.round.answer)');
          if (level === 4)
            assert.deepEqual(
              await page.evaluate(() => [
                neo.scene.game.round.ones,
                neo.scene.game.round.answer % 10,
                neo.scene.game.leaf.visible,
              ]),
              [0, 0, false],
            );
        }
        await finished('lasso-loops');
        assert.deepEqual(await score('lasso-loops'), level === 1 ? [0, 0] : level === 2 ? [2, 1] : [3, 1]);
        const lassoOpens = (await page.evaluate(() => lassoR4)).filter((o) => !o.last);
        assert.ok(lassoOpens.length >= (level === 6 ? 3 : 1), `R4: ${lassoOpens.length} lines timed`);
        assert.ok(
          lassoOpens.every((o) => o.opens < o.ends),
          `R4: the board waited for a line (${lassoOpens.map((o) => `${o.id} ${Math.round(o.opens)}/${Math.round(o.ends)}`).join(', ')} ms)`,
        );
        log(
          `Lasso Loops ${level}: R4, ${lassoOpens.map((o) => `${o.id} opens ${Math.round(o.opens)} ms`).join(', ')}`,
        );
        await page.setViewportSize({ width: 1024, height: 768 });
        log(
          `Lasso Loops ${level}: loops drawn around fireflies${level > 1 ? ', wrong-sized loops explained, ringed hint' : ''}${level >= 3 ? ', how-many question with a counted miss' : ''}, saved score and sticker passed`,
        );
      }
    }
    const SAYS_SUN_TURNS = 2;
    const saysTop = await page.evaluate(
      async () => (await import('/src/games/pet-says/logic.ts')).PLANS.length,
    );
    if (!only || only === 'says')
      for (
        let level = fromLevel;
        level <= Math.min(saysTop, Number(process.env.TO_LEVEL || saysTop));
        level++
      ) {
        if (level === 9) {
          const seeds = await page.evaluate(async () => {
            const { makeTurns, planFor, WALK_PLACES } = await import('/src/games/pet-says/logic.ts');
            const { Rng } = await import('/src/engine/random.ts');
            return WALK_PLACES.map((place) => {
              const seed = Array.from({ length: 100 }, (_, i) => i + 1).find(
                (seed) => makeTurns(planFor(9), new Rng(seed))[0].stop.place === place,
              );
              return { place, seed };
            });
          });
          await page.setViewportSize({ width: 390, height: 844 });
          for (const { place, seed } of seeds) {
            assert.ok(seed, `seed for the ${place} walk`);
            await page.evaluate((seed) => {
              window.saysRandom = Math.random;
              Math.random = () => seed / 2 ** 31;
            }, seed);
            try {
              await launch('pet-says', level);
            } finally {
              await page.evaluate(() => {
                Math.random = window.saysRandom;
                delete window.saysRandom;
              });
            }
            await idle(0);
            assert.equal(await page.evaluate(() => neo.scene.game.turn.stop.place), place);
            await screenshot(`pet-says-9-${place}-portrait`);
            // Finish one full story. The other starts are for the portrait scenery check.
            if (place !== 'woods') continue;
            const landmark = () =>
              page.evaluate(() => {
                const g = neo.scene.game;
                return [g.turn.stop.landmark, g.walkScenery.stop.landmark];
              });
            const initial = await page.evaluate(() => [
              kit.store.stats('pet-says').history.length,
              kit.store.data.stickers.length,
            ]);
            const replayPoint = await page.evaluate(() => {
              const { x, y } = neo.scene.game.onceMore.getGlobalPosition();
              return [x, y];
            });
            await tap('neo.scene.game.onceMore');
            assert.deepEqual(await counts(), [0, 0], 'a quick tap does not ask for help');
            for (let replay = 0; replay < 2; replay++) {
              await page.mouse.move(...replayPoint);
              await page.mouse.down();
              await page.waitForFunction(() => neo.scene.game.busy);
              await page.mouse.up();
              await idle(0);
              assert.deepEqual(await landmark(), ['bear', 'bear'], 'held replay stays at this stop');
              assert.deepEqual(await counts(), [0, 1]);
            }
            await page.setViewportSize({ width: 844, height: 390 });
            await page.waitForFunction(() => neo.view.w > neo.view.h);
            await tap('neo.scene.game.next');
            await idle(1);
            assert.equal(
              await page.evaluate(() => neo.scene.game.walkScenery.landmark.x),
              await page.evaluate(() => neo.view.w * 0.73),
              'the next stop uses the current orientation',
            );
            await page.setViewportSize({ width: 390, height: 844 });
            await page.waitForFunction(() => neo.view.h > neo.view.w);
            await page.evaluate(() => {
              const pet = neo.scene.game.mover.pet;
              const point = pet.toGlobal(pet.touch);
              kit.tap(point.x, point.y);
            });
            await page.waitForFunction(() => neo.scene.game.busy);
            await idle(1);
            assert.deepEqual(await counts(), [0, 1], 'a pet tap replays without asking for help');
            for (const [i, stop] of ['stream', 'hill', 'owl'].entries()) {
              await idle(i + 1);
              assert.deepEqual(await landmark(), [stop, stop]);
              await tap('neo.scene.game.next');
            }
            await finished('pet-says');
            assert.deepEqual(await score('pet-says'), [0, 1]);
            assert.deepEqual(
              await page.evaluate(() => [
                kit.store.stats('pet-says').history.length,
                kit.store.data.stickers.length,
              ]),
              initial.map((n) => n + 1),
            );
            log('Pet Says 9: four stops, free replay, one held replay hint and one sticker passed');
          }
          await page.setViewportSize({ width: 1024, height: 768 });
          continue;
        }
        // Nothing is judged: the pet moves, and a grown-up taps the arrow. Tapping the big pet shows the move again.
        await launch('pet-says', level);
        if (level === 3) await page.setViewportSize({ width: 768, height: 1024 });
        // Level 2 and Opposite day play on a phone held upright; level 2 listens for the chant's words (dive slice 2).
        if ([6, 7, 8, 10, 11, 12].includes(level)) await page.setViewportSize({ width: 390, height: 844 });
        if (level === 12) {
          await page.evaluate(() => {
            const g = neo.scene.game;
            const { instruct, say } = g.ctx;
            const litHand = g.litHand.bind(g);
            g.handEvents = [];
            g.litHand = (hand, on) => (g.handEvents.push(`lit:${hand}:${on}`), litHand(hand, on));
            g.ctx.instruct = async (id, slots) => {
              g.handEvents.push(`${id}:${slots?.side}:${slots?.color}`);
              await instruct(id, slots);
            };
            g.ctx.say = (id, slots) => (g.handEvents.push(id), say(id, slots));
          });
        }
        if (level === 11) {
          await page.evaluate(() => {
            const g = neo.scene.game;
            const { instruct, say } = g.ctx;
            const perform = g.perform.bind(g);
            g.ruleEvents = [];
            g.ctx.instruct = async (id, slots) => {
              await instruct(id, slots);
              g.ruleEvents.push(id);
            };
            g.ctx.say = (id, slots) => {
              g.ruleEvents.push(id);
              return say(id, slots);
            };
            g.perform = (move, count) => {
              g.ruleEvents.push(move);
              return perform(move, count);
            };
          });
        }
        if (level === 7)
          await page.evaluate(() => {
            const g = neo.scene.game;
            const say = g.ctx.say;
            g.saidForCheck = [];
            g.ctx.say = (id, slots) => (g.saidForCheck.push([id, g.mover.pet.alive]), say(id, slots));
          });
        if (level === 2) {
          await page.setViewportSize({ width: 390, height: 844 });
          await page.evaluate(() => {
            const g = neo.scene.game;
            const say = g.ctx.say;
            g.saidForCheck = [];
            g.ctx.say = (id, slots) => (g.saidForCheck.push(id), say(id, slots));
          });
        }
        if (level === 10) {
          await page.evaluate(() => {
            const g = neo.scene.game;
            const { instruct } = g.ctx;
            const perform = g.perform.bind(g);
            let cue;
            g.switchingCues = new Map();
            g.ctx.instruct = async (id, slots) => {
              await instruct(id, slots);
              cue = id;
            };
            g.perform = (move, count) => {
              if (!g.switchingCues.has(g.index)) {
                g.switchingCues.set(g.index, { cue, sign: g.signShown });
              }
              cue = undefined;
              return perform(move, count);
            };
          });
        }
        const turns = await page.evaluate(() => neo.scene.game.turns.length);
        if (level === 10 || level === 11) assert.equal(turns, 8);
        if (level === 3) {
          // Every tiered move performs and comes back to rest, and a counted move counts each beat aloud.
          await page.waitForFunction(() => !neo.scene.game.busy && neo.scene.game.next.visible, null, {
            timeout: 40000,
          });
          const moves = await page.evaluate(async () => {
            const { ALL_MOVES, MOVES } = await import('/src/games/pet-says/logic.ts');
            const g = neo.scene.game;
            const said = [];
            const say = g.ctx.say;
            g.ctx.say = (id, slots) => (id === 'count' && said.push(slots.n), say(id, slots));
            const fresh = ALL_MOVES.filter((m) => !MOVES.includes(m));
            for (const m of fresh) await g.perform(m);
            await g.perform('stomp', 2);
            g.ctx.say = say;
            const r = g.mover.right.position;
            const rest = g.frame.rest.right;
            return { fresh: fresh.length, said, home: Math.hypot(r.x - rest.x, r.y - rest.y) < 1 };
          });
          assert.equal(moves.fresh, 10, 'ten tiered moves');
          assert.deepEqual(moves.said, [1, 2], 'stomp two times counts one, two');
          assert.equal(moves.home, true, 'the mittens come back to rest');
        }
        assert.equal(
          await page.evaluate(() => neo.scene.pet.visible),
          false,
          'the big pet stands in for the corner guide',
        );
        for (let n = 0; n < turns; n++) {
          await page.waitForFunction(
            (n) => {
              const g = neo.scene.game;
              return g.index === n && !g.busy && g.next.visible;
            },
            n,
            { timeout: 40000 },
          );
          if (level === 10 && n > 0) {
            const { sign, seen } = await page.evaluate(() => {
              const g = neo.scene.game;
              return { sign: g.turn.sign, seen: g.switchingCues.get(g.index) };
            });
            assert.deepEqual(
              seen,
              { cue: `says.opp.${sign}`, sign },
              'the sign and spoken rule precede the move',
            );
            if (n === 3) await screenshot('pet-says-10-portrait');
          }
          if (level === 12) {
            const { turn, events } = await page.evaluate(() => {
              const g = neo.scene.game;
              return { turn: g.turn, events: g.handEvents.splice(0) };
            });
            const color = turn.hand === 'left' ? 'blue' : 'red';
            if (!turn.named)
              assert.deepEqual(events.slice(-3), [
                `lit:${turn.hand}:true`,
                `says.hand.this:${turn.hand}:${color}`,
                `lit:${turn.hand}:false`,
              ]);
            else {
              const ask = turn.moves[0] === 'ears' ? 'says.hand.ear' : 'says.hand.wave';
              const told = n === 3 ? ['says.hand.mirror'] : [];
              assert.deepEqual(events.slice(-(3 + told.length)), [
                ...told,
                `lit:${turn.hand}:false`,
                `${ask}:${turn.hand}:${color}`,
                `lit:${turn.hand}:false`,
              ]);
            }
            if (n === 0 || n === 3) await screenshot(`pet-says-12-turn${n}-portrait`);
          }
          if (level === 11) {
            const { named, move, events, revealDue, signVisible } = await page.evaluate(() => {
              const g = neo.scene.game;
              return {
                named: g.turn.says,
                move: g.turn.moves[0],
                events: g.ruleEvents.splice(0),
                revealDue: g.revealDue,
                signVisible: g.signBox.visible,
              };
            });
            assert.equal(signVisible, false, 'the spoken name is the cue');
            assert.equal(revealDue, named, 'only named turns need an opposite reveal');
            const expected = named ? ['says.says', move] : ['says.trick', move, 'says.tricked'];
            assert.deepEqual(events.slice(-expected.length), expected);
          }
          if (level === 5 && n === 0) {
            // The freeze holds the named statue while the arrow shows (dive slice 4), on this round's scene.
            const held = await page.evaluate(async () => {
              const { statuePose } = await import('/src/games/pet-says/logic.ts');
              const g = neo.scene.game;
              await new Promise((r) => setTimeout(r, 900));
              const pose = statuePose(g.turn.dance.statue, g.frame);
              const off = (m, p) => Math.hypot(m.x - p.x, m.y - p.y);
              return {
                scene: g.scene,
                dance: g.turn.dance,
                off: Math.max(off(g.mover.left.position, pose.left), off(g.mover.right.position, pose.right)),
              };
            });
            assert.ok(held.off < 1, `the ${held.dance.statue} statue holds until the arrow (${held.off})`);
            log(`Pet Says 5 first dance: ${JSON.stringify(held.dance)} on the ${held.scene}`);
            await page.setViewportSize({ width: 390, height: 844 });
            await page.waitForTimeout(300);
            await screenshot('pet-says-5-freeze-portrait');
            await page.setViewportSize({ width: 844, height: 390 });
            await page.waitForTimeout(300);
            await screenshot('pet-says-5-freeze-landscape');
            await page.setViewportSize({ width: 1024, height: 768 });
          }
          if (level === 7 && n === 0) {
            // The freeze dance turned around (dive slice 6): "Music! Freeze!" comes with the pet already still, and it
            // holds still for the arrow once the song ends.
            const quiet = await page.evaluate(() => {
              const g = neo.scene.game;
              return { said: g.saidForCheck, alive: g.mover.pet.alive, segments: g.turn.segments };
            });
            assert.deepEqual(quiet.said, [['says.music', false]], 'the pet is still while the music plays');
            assert.equal(quiet.alive, false, 'still for the arrow');
            log(`Pet Says 7 first dance: ${JSON.stringify(quiet.segments)}`);
            await screenshot('pet-says-7-portrait');
          }
          if (level === 4 && n === 0) {
            // Every kind of "Pet says" ask, shown once each: "do this" explains itself first, and each trick its own reveal.
            const heard = await page.evaluate(async () => {
              const g = neo.scene.game;
              const ids = [];
              const { say, instruct } = g.ctx;
              g.ctx.say = (id, slots) => (ids.push([id, slots?.who]), say(id, slots));
              g.ctx.instruct = (id, slots) => (ids.push([id, slots?.who]), instruct(id, slots));
              for (const turn of [
                { moves: ['clap'], says: true, cue: 'this' },
                { moves: ['wave'], says: false, cue: 'that' },
                { moves: ['jump'], says: false, cue: 'name', who: 0 },
              ])
                await g.show(turn);
              Object.assign(g.ctx, { say, instruct });
              return ids;
            });
            assert.deepEqual(
              heard.map(([id]) => id),
              [
                'says.this-rule',
                'says.this',
                'says.that',
                'says.tricked-that',
                'says.name',
                'says.tricked-name',
              ],
            );
            assert.equal(heard[4][1], 'Bunny', 'the wrong name is borrowed');
          }
          if (level === 2 && n === turns - 1) {
            const said = await page.evaluate(() => neo.scene.game.saidForCheck);
            const count = (id) => said.filter((s) => s === id).length;
            assert.deepEqual(
              ['head', 'shoulders', 'tummy', 'toes'].map((w) => count(`says.chant.${w}`)),
              [1, 2, 3, 4],
              'each verse leaves one more word unsung from the front, and the last sings none',
            );
            assert.equal(count('says.chant.silent'), 1);
          }
          if (level === 2 && n === 0) {
            // The new words' mitten places on the friend, held still for a look (dive slice 2).
            for (const word of ['cheeks', 'shoulders', 'chin']) {
              await page.evaluate((word) => {
                const g = neo.scene.game;
                g.mover.left.position.copyFrom(g.frame.targets[word].left);
                g.mover.right.position.copyFrom(g.frame.targets[word].right);
              }, word);
              await page.waitForTimeout(150);
              await screenshot(`pet-says-2-${word}`);
            }
            await page.evaluate(() => {
              const g = neo.scene.game;
              g.mover.left.position.copyFrom(g.frame.rest.left);
              g.mover.right.position.copyFrom(g.frame.rest.right);
            });
            await page.evaluate(() => neo.scene.game.update(10));
            assert.equal(
              await page.evaluate(() => neo.scene.game.nudged),
              true,
              'idle wait points out the arrow',
            );
            assert.equal(
              await page.evaluate(() => neo.scene.game.index),
              0,
              'the nudge never advances co-play',
            );
            assert.deepEqual(
              await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]),
              [0, 0],
            );
          }
          if (n === 1) {
            await tap('neo.scene.game.mover.pet');
            if (level !== 5 && level !== 7)
              assert.equal(
                await page.evaluate(() => neo.scene.game.next.visible),
                false,
                'showing the move again',
              );
            await page.waitForFunction(() => !neo.scene.game.busy && neo.scene.game.next.visible, null, {
              timeout: 40000,
            });
            if (level !== 10 && level !== 11) await screenshot(`pet-says-${level}`);
          }
          if (level === 6 && n === SAYS_SUN_TURNS) {
            // The held "once more" replays the first moon turn and counts one hint, however often it is held.
            for (let k = 0; k < 2; k++) {
              await page.evaluate(() => neo.scene.game.onceMore.press());
              await page.waitForFunction(() => !neo.scene.game.busy && neo.scene.game.next.visible, null, {
                timeout: 40000,
              });
            }
            assert.equal(
              await page.evaluate(() => neo.scene.game.hints),
              1,
              'once more counts one hint a turn',
            );
            assert.equal(await page.evaluate(() => neo.scene.game.onceMore.visible), true);
          }
          const reveal = await page.evaluate(() => neo.scene.game.revealDue);
          await page.waitForTimeout(250);
          await tap('neo.scene.game.next');
          if (reveal) {
            // A moon or named opposite turn's arrow first shows the opposite, then goes on.
            await page.waitForFunction(
              (n) => {
                const g = neo.scene.game;
                return g.index === n && !g.busy && g.next.visible && !g.revealDue;
              },
              n,
              { timeout: 40000 },
            );
            if (level === 11) {
              const { events, partner } = await page.evaluate(async () => {
                const { partnerOf } = await import('/src/games/pet-says/logic.ts');
                const g = neo.scene.game;
                return { events: g.ruleEvents.splice(0), partner: partnerOf(g.turn.moves[0]) };
              });
              assert.deepEqual(events.slice(-2), ['says.opp.reveal', partner]);
              if (n === 0) await screenshot('pet-says-11-opposite-portrait');
            }
            // More opposites (level 8) has one sun: its first moon is the second turn.
            if (level === 8 && n === 1) await screenshot('pet-says-8-moon-portrait');
            if (level === 6 && n === SAYS_SUN_TURNS) {
              await screenshot('pet-says-6-moon-portrait');
              // A phone on its side: the sign and the once-more button stay clear of the pet.
              await page.setViewportSize({ width: 844, height: 390 });
              await page.waitForTimeout(300);
              await screenshot('pet-says-6-moon-landscape');
              await page.setViewportSize({ width: 390, height: 844 });
            }
            await page.waitForTimeout(250);
            await tap('neo.scene.game.next');
          }
        }
        await finished('pet-says');
        assert.deepEqual(await score('pet-says'), level === 6 ? [0, 1] : [0, 0]);
        assert.equal(await page.evaluate(() => neo.scene.pet.visible), false);
        await page.setViewportSize({ width: 1024, height: 768 });
        log(
          `Pet Says ${level} (${await page.evaluate(() => neo.scene.game.plan.mode)}): moves shown and repeated, grown-up arrow, saved round and sticker passed`,
        );
      }

    if (!only || only === 'pat') {
      // Level 13 Pat the pet (lap only), upright: no arrow; a pat on the pet or anywhere in the meadow brings the next move.
      await page.setViewportSize({ width: 768, height: 1024 });
      await launch('pet-says', 13, 'Mia', 'lap');
      await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
      const side = [0.08, 0.92];
      for (let n = 0; n < 5; n++) {
        await page.waitForFunction((n) => !neo.scene.game.busy && neo.scene.game.patted === n, n, {
          timeout: 30000,
        });
        await page.evaluate(
          ({ n, x }) => {
            const p = neo.scene.game.mover.pet;
            if (n % 2 === 0) return kit.tapOn(p, p.touch.x, p.touch.y);
            // Every other pat lands on the empty meadow beside the pet.
            const at = { x: innerWidth * x, y: innerHeight * 0.45 },
              local = p.toLocal(at);
            if (p.hitArea.contains(local.x, local.y)) throw new Error('the meadow point is on the pet');
            kit.tap(at.x, at.y);
          },
          { n, x: side[(n >> 1) % 2] },
        );
        await page.waitForFunction((n) => neo.scene.game.patted === n + 1, n, { timeout: 5000 });
        assert.equal(await page.evaluate(() => neo.scene.game.next.visible), false, 'no arrow at level 13');
        if (n === 1) await screenshot('pet-says-13-portrait');
      }
      await finished('pet-says');
      assert.deepEqual(await score('pet-says'), [0, 0]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log('Pet Says 13 (pat): five pats (two on the meadow), no arrow, saved round and sticker passed');
    }

    const owlsTo = Number(process.env.TO_LEVEL || 7);
    if (!only || only === 'owls')
      for (let level = fromLevel; level <= Math.min(4, owlsTo); level++) {
        await launch('owl-walk', level);
        if (level === 2) await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
        // An owl tapped before a card is turned over just says to turn one over.
        await tap('neo.scene.game.owls[0].critter');
        assert.equal(await page.evaluate(() => neo.scene.game.owls[0].spot), -1);
        const nestTap = '({ getGlobalPosition: () => neo.scene.game.nest.toGlobal({ x: 0, y: -120 }) })';
        let wrong = false;
        // A grown-up in the pet's seat (levels 2 to 4): it starts off; with it on, the pet's turn waits for their stone.
        const seatOn = level === 2;
        if (level === 1)
          assert.equal(
            await page.evaluate(() => neo.scene.game.seat.parent === null),
            true,
            'no seat button on level 1',
          );
        for (let t = 0; t < 60 && !(await page.evaluate(() => neo.scene.game.finished)); t++) {
          if (seatOn && t === 1) {
            assert.equal(
              await page.evaluate(() => neo.scene.game.partner),
              false,
              'solo play is the default',
            );
            await tap('neo.scene.game.seat');
            assert.equal(await page.evaluate(() => neo.scene.game.partner), true);
            await page.waitForFunction(() => neo.scene.game.partnerWait, null, { timeout: 40000 });
            const w = await page.evaluate(async () => {
              const L = await import('/src/games/owl-walk/logic.ts');
              const g = neo.scene.game;
              const spots = g.owls.map((o) => o.spot);
              const { best, color } = g.partnerWait;
              const to = L.hop(g.path, spots, best, color);
              const other = g.path.findIndex((c, i) => !L.fits(c, color) && i > spots[best]);
              return { best, to, other, spot: spots[best], n: g.path.length };
            });
            const before = await counts();
            if (w.other >= 0) {
              await tap(`neo.scene.game.stones[${w.other}]`);
              await page.waitForTimeout(400);
              assert.deepEqual(await counts(), before, 'a grown-up’s wrong tap is never her miss');
              assert.equal(
                await page.evaluate(() => neo.scene.game.partnerWait !== null),
                true,
                'the pet still waits',
              );
            }
            await tap(w.to >= w.n ? nestTap : `neo.scene.game.stones[${w.to}]`);
            await page.waitForFunction(
              (b) => neo.scene.game.owls[b].spot > -1 || neo.scene.game.finished,
              w.best,
              { timeout: 20000 },
            );
            assert.deepEqual(await counts(), before, 'a grown-up’s hop is never her miss or hint');
            await screenshot('owl-walk-2-seat');
            await tap('neo.scene.game.seat');
          }
          await page.waitForFunction(
            () => {
              const g = neo.scene.game;
              return g.finished || (!g.busy && g.turn === 'child');
            },
            null,
            { timeout: 40000 },
          );
          if (await page.evaluate(() => neo.scene.game.finished)) break;
          await tap('neo.scene.game.deck');
          await page.waitForFunction(() => neo.scene.game.card && !neo.scene.game.busy, null, {
            timeout: 20000,
          });
          if (level === 1 && t === 1) {
            // The owl is on a stone now: tapping it (what the old game taught) is not a miss, only a reminder to tap the stone.
            const before = await counts();
            await tap('neo.scene.game.owls[0].critter');
            await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
            assert.deepEqual(await counts(), before, 'her own owl, tapped on its stone, is not a miss');
          }
          // Which owl moves, where it lands, a stone of another color, and (on the levels that ask) an owl that hops less.
          const plan = await page.evaluate(async () => {
            const L = await import('/src/games/owl-walk/logic.ts');
            const g = neo.scene.game;
            const spots = g.owls.map((o) => o.spot);
            const mode = g.plan.mode;
            const best =
              mode === 'one'
                ? [0]
                : mode === 'turns'
                  ? [L.owlOf(g.path, spots, 0)]
                  : L.farthest(g.path, spots, g.card);
            const owl = best[0];
            const worse = g.owls.findIndex((o, i) => !best.includes(i) && o.spot < g.path.length);
            const to = L.hop(g.path, spots, owl, g.card);
            const other = g.path.findIndex((c, s) => !L.fits(c, g.card) && s > spots[owl] && s !== to);
            return { mode, owl, worse, to, home: to >= g.path.length, other, before: spots[owl] };
          });
          const stone = plan.home ? nestTap : `neo.scene.game.stones[${plan.to}]`;
          if (plan.mode === 'choose' || plan.mode === 'farthest') {
            const onlyOne = await page.evaluate(() => neo.scene.game.moving().length === 1);
            if (!onlyOne) {
              if (plan.mode === 'farthest' && !wrong && plan.worse >= 0) {
                // A shorter hop is a gentle miss with both numbers said; the second brings a glow on the farthest owl.
                wrong = true;
                for (let k = 0; k < 2; k++) {
                  await tap(`neo.scene.game.owls[${plan.worse}].critter`);
                  await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
                }
                assert.deepEqual(await counts(), [2, 1]);
                assert.ok(await page.evaluate((b) => neo.scene.game.owls[b].glow.visible, plan.owl));
                await screenshot(`owl-walk-${level}`);
              } else if (plan.mode === 'choose' && !wrong && plan.worse >= 0) {
                // Choosing an owl is free: picking one that hops less, then changing her mind, is never a miss.
                wrong = true;
                await tap(`neo.scene.game.owls[${plan.worse}].critter`);
                await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
                assert.equal(
                  await page.evaluate(() => neo.scene.game.selected !== null),
                  true,
                  JSON.stringify(
                    await page.evaluate((w) => {
                      const g = neo.scene.game;
                      return {
                        w,
                        sel: g.selected,
                        busy: g.busy,
                        turn: g.turn,
                        card: g.card,
                        owls: g.owls.map((o) => [o.critter.x, o.critter.y, o.spot]),
                        lastTap: g.lastTap,
                        now: performance.now(),
                      };
                    }, plan.worse),
                  ),
                );
                assert.deepEqual(await counts(), [0, 0]);
              }
              await tap(`neo.scene.game.owls[${plan.owl}].critter`);
              await page.waitForFunction((o) => neo.scene.game.selected === o, plan.owl, { timeout: 20000 });
            }
          } else if (level === 1 && !wrong && plan.other >= 0) {
            // A stone of another color is a gentle miss naming what was touched; the second brings a glow on the right stone.
            wrong = true;
            for (let k = 0; k < 2; k++) {
              await tap(`neo.scene.game.stones[${plan.other}]`);
              await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
            }
            assert.deepEqual(await counts(), [2, 1]);
            assert.ok(await page.evaluate(() => neo.scene.game.hintGlow.visible));
            await screenshot(`owl-walk-${level}-hint`);
          } else if (t === 1) await screenshot(`owl-walk-${level}`);
          await tap(stone);
          await page.waitForFunction(
            ({ b, before }) => neo.scene.game.owls[b].spot !== before,
            { b: plan.owl, before: plan.before },
            { timeout: 20000 },
          );
        }
        await finished('owl-walk');
        assert.ok(
          await page.evaluate(() => neo.scene.game.owls.every((o) => o.spot >= neo.scene.game.path.length)),
          'every owl is home',
        );
        assert.deepEqual(await score('owl-walk'), level === 1 || level === 4 ? [2, 1] : [0, 0]);
        await page.setViewportSize({ width: 1024, height: 768 });
        log(
          `Owl Walk Home ${level}: cards turned, the stone tapped for the owl to hop to${level > 1 ? ', the pet taking turns' : ''}${level === 1 ? ', a stone of another color explained with a glow' : ''}${level === 4 ? ', shorter hops explained with a glow' : ''}, everyone home, saved score and sticker passed`,
        );
      }

    if ((!only || only === 'owls') && fromLevel <= 5 && owlsTo >= 5) {
      // Level 5, Stepping stones (the lap band): no cards, every touch answers and nothing is a miss.
      await launch('owl-walk', 5);
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
      assert.equal(
        await page.evaluate(() => neo.scene.game.deck.visible),
        false,
        'no deck on the stepping stones',
      );
      const spot = () => page.evaluate(() => neo.scene.game.owls[0].spot);
      const settled = () =>
        page.waitForFunction(() => !neo.scene.game.busy || neo.scene.game.finished, null, { timeout: 20000 });
      // A touch on the empty sky only pokes the owl.
      await tap(
        '({ getGlobalPosition: () => neo.scene.game.touch.toGlobal({ x: neo.scene.game.view.w / 2, y: neo.scene.game.view.h * 0.45 }) })',
      );
      assert.equal(await spot(), -1);
      // A stone two ahead: the owl hops there, singing on each stone.
      await tap('neo.scene.game.stones[1]');
      await page.waitForFunction(() => neo.scene.game.owls[0].spot === 1, null, { timeout: 20000 });
      await settled();
      await screenshot('owl-walk-5-portrait');
      // Its own stone and one behind it are soft ticks, never a miss.
      await tap('neo.scene.game.stones[0]');
      await tap('neo.scene.game.stones[1]');
      await settled();
      assert.equal(await spot(), 1);
      assert.deepEqual(await counts(), [0, 0]);
      await tap('neo.scene.game.stones[3]');
      await page.waitForFunction(() => neo.scene.game.owls[0].spot === 3, null, { timeout: 20000 });
      await settled();
      await tap('({ getGlobalPosition: () => neo.scene.game.nest.toGlobal({ x: 0, y: -120 }) })');
      await finished('owl-walk');
      assert.equal(await spot(), 5);
      assert.deepEqual(await score('owl-walk'), [0, 0]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log(
        'Owl Walk Home 5 (Stepping stones, lap): no deck, sky poke, a hop two ahead, ticks behind, home by the nest, upright, saved score and sticker passed',
      );
    }

    if ((!only || only === 'owls') && fromLevel <= 6 && owlsTo >= 6) {
      // Level 6, Color or shape (preschool, pre-K): three colors x three shapes; a card shows only one; two misses twinkle the right stone.
      await launch('owl-walk', 6);
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
      const nestTap = '({ getGlobalPosition: () => neo.scene.game.nest.toGlobal({ x: 0, y: -120 }) })';
      let wrong = false;
      for (let t = 0; t < 40 && !(await page.evaluate(() => neo.scene.game.finished)); t++) {
        await page.waitForFunction(
          () => {
            const g = neo.scene.game;
            return g.finished || (!g.busy && g.turn === 'child');
          },
          null,
          { timeout: 30000 },
        );
        if (await page.evaluate(() => neo.scene.game.finished)) break;
        await tap('neo.scene.game.deck');
        await page.waitForFunction(() => neo.scene.game.card && !neo.scene.game.busy, null, {
          timeout: 20000,
        });
        const plan = await page.evaluate(async () => {
          const L = await import('/src/games/owl-walk/logic.ts');
          const g = neo.scene.game;
          const spots = g.owls.map((o) => o.spot);
          const to = L.hop(g.path, spots, 0, g.card);
          const other = g.path.findIndex((c, s) => !L.fits(c, g.card) && s > spots[0] && s !== to);
          return { to, home: to >= g.path.length, other, before: spots[0] };
        });
        if (!wrong && !plan.home && plan.other >= 0) {
          wrong = true;
          for (let k = 0; k < 2; k++) {
            await tap(`neo.scene.game.stones[${plan.other}]`);
            await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
          }
          assert.deepEqual(await counts(), [2, 1]);
          assert.ok(await page.evaluate(() => neo.scene.game.hintGlow.visible), 'hint glow on right stone');
          assert.ok(
            await page.evaluate(() => neo.scene.game.fireflies.length > 0),
            'fireflies twinkle on right stone',
          );
          await screenshot('owl-walk-6-portrait');
        }
        const stone = plan.home ? nestTap : `neo.scene.game.stones[${plan.to}]`;
        await tap(stone);
        await page.waitForFunction((before) => neo.scene.game.owls[0].spot !== before, plan.before, {
          timeout: 20000,
        });
      }
      await finished('owl-walk');
      assert.equal(
        await page.evaluate(() => neo.scene.game.owls[0].spot),
        await page.evaluate(() => neo.scene.game.path.length),
      );
      assert.deepEqual(await score('owl-walk'), [2, 1]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log(
        'Owl Walk Home 6 (Color or shape): cards showing color or shape, two misses twinkle the right stone, upright, saved score and sticker passed',
      );
    }

    if ((!only || only === 'owls') && fromLevel <= 7 && owlsTo >= 7) {
      // Level 7, Our two cards (pre-K top, school): give each card to an owl, then go. The session's first pair is unscored.
      await launch('owl-walk', 7);
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.evaluate(async () => (await import('/src/games/owl-walk/index.ts')).resetPairsSeen());
      await page.waitForFunction(() => neo.scene.game.pair && !neo.scene.game.busy, null, { timeout: 40000 });
      const plan = (worst) =>
        page.evaluate(async (worst) => {
          const L = await import('/src/games/owl-walk/logic.ts');
          const g = neo.scene.game;
          const spots = g.owls.map((o) => o.spot);
          const cards = g.pair.cards;
          if (cards.length < 2) return { to: [g.pair.to[0]], single: true };
          const all = L.pairAssignments(g.path, spots);
          const totals = all.map((p) => L.assignTotal(g.path, spots, cards, p));
          const max = Math.max(...totals);
          const k = worst ? totals.indexOf(Math.min(...totals)) : totals.indexOf(max);
          return { to: all[k], gap: max - Math.min(...totals), single: false };
        }, worst);
      const give = async (to) => {
        for (let k = 0; k < 2; k++) {
          await tap(`neo.scene.game.faces[${k}]`);
          await tap(`neo.scene.game.owls[${to[k]}].critter`);
        }
      };
      let pairs = 0;
      for (let t = 0; t < 12 && !(await page.evaluate(() => neo.scene.game.finished)); t++) {
        await page.waitForFunction(() => neo.scene.game.pair && !neo.scene.game.busy, null, {
          timeout: 40000,
        });
        const best = await plan(false);
        if (best.single) {
          await tap('neo.scene.game.go');
        } else if (pairs === 0) {
          // The first look is unscored: the worst way hops, nothing is charged.
          const worst = await plan(true);
          await give(worst.to);
          assert.equal(await page.evaluate(() => neo.scene.game.pairComplete()), true);
          await tap('neo.scene.game.go');
        } else if (pairs === 1 && best.gap > 0) {
          // A better way exists: going with a worse one is a gentle miss with both totals said; the second brings the glow.
          await give((await plan(true)).to);
          for (let k = 0; k < 2; k++) {
            await page.waitForTimeout(500);
            await tap('neo.scene.game.go');
            await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
          }
          assert.deepEqual(await counts(), [2, 1]);
          assert.ok(await page.evaluate(() => neo.scene.game.hintPlan !== null));
          await screenshot('owl-walk-7-hint');
          await give(best.to);
          await tap('neo.scene.game.go');
        } else {
          await give(best.to);
          if (pairs === 2) await screenshot('owl-walk-7');
          await tap('neo.scene.game.go');
        }
        pairs++;
        await page.waitForFunction(
          (n) =>
            neo.scene.game.finished ||
            (neo.scene.game.pair && !neo.scene.game.busy && neo.scene.game.index > n),
          0,
          { timeout: 40000 },
        );
      }
      await finished('owl-walk');
      assert.ok(
        await page.evaluate(() => neo.scene.game.owls.every((o) => o.spot >= neo.scene.game.path.length)),
      );
      await page.setViewportSize({ width: 1024, height: 768 });
      log(
        `Owl Walk Home 7 (Our two cards): ${pairs} pairs given, first unscored, a worse way explained with a glow, everyone home`,
      );
    }
  }

  return { shortlistBatch };
}
