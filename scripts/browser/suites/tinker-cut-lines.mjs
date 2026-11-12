import assert from 'node:assert/strict';

/**
 * U7d fix batches 23–24 (R4): in `bouncy-launch`, `ramp-race`, `block-tower`, `inchworm`, `measuring-post` and
 * `seesaw-balance` a right answer's line never holds the next shot, question, knock, measure, task or blocks. The lines are stretched to at least 4 s in the page (and each line's start recorded), so the
 * next board opening sooner shows the line no longer gates it; its ask waits (said by the guide, or at her first touch),
 * and the round's last line is still heard out before the closing line. TINKER_ONLY=launch|ramp|tower|inch|post|seesaw
 * plays one game.
 */
export function createSuite({ page, launch, finished, log }) {
  async function tinkerCutLines() {
    const only = process.env.TINKER_ONLY;
    const score = (id) =>
      page.evaluate((id) => {
        const r = kit.store.stats(id).history.at(-1);
        return [r.misses, r.hints];
      }, id);
    /** Stretches the named lines to at least 4 s; records when every line starts (`__starts`) and the last stretched one (`__said`). */
    const stretch = (ids) =>
      page.evaluate((ids) => {
        const g = neo.scene.game;
        const say = g.ctx.say.bind(g.ctx);
        window.__said = 0;
        window.__starts = {};
        g.ctx.say = (id, vars) => {
          const line = say(id, vars);
          window.__starts[id] = performance.now();
          if (!ids.includes(id)) return line;
          window.__said = performance.now();
          return Promise.all([line, kit.sleep(4000)]).then(() => undefined);
        };
      }, ids);
    const check = (name, out, limit) => {
      for (const o of out) {
        if (o.open !== undefined && !(o.open < limit && o.waiting))
          throw new Error(`R4: ${name}'s line held the next board: ${JSON.stringify(out)}`);
        if (o.early && (o.early.misses !== 0 || o.early.waiting))
          throw new Error(
            `R4: ${name}: an early touch was a miss or left the ask unsaid: ${JSON.stringify(out)}`,
          );
        if (o.guide !== undefined && (!o.guide || o.waiting))
          throw new Error(`R4: ${name}: the guide did not say the waiting ask: ${JSON.stringify(out)}`);
        if (o.last !== undefined && !(o.last >= 3900))
          throw new Error(`R4: ${name}'s last line was cut: ${JSON.stringify(out)}`);
      }
      return out
        .filter((o) => o.open !== undefined)
        .map((o) => Math.round(o.open))
        .join(', ');
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    if (!only || only === 'launch') {
      // Level 6: a shown pull, pick the cloud it reaches, watch it fly; `predicted` or `revealed` follows every landing.
      await launch('bouncy-launch', 6);
      await stretch(['launch.predicted', 'launch.revealed']);
      const out = await page.evaluate(async () => {
        const g = neo.scene.game;
        const out = [];
        const total = g.plan.shots;
        for (let n = 0; n < total; n++) {
          await kit.until(() => g.shot === n && !g.flying && g.prediction === undefined, 20000);
          if (n > 0) out.push({ n, open: performance.now() - window.__said, waiting: g.unasked });
          if (n === 1) out.push({ guide: g.sayWaitingAsk(), waiting: g.unasked });
          await kit.sleep(300);
          // At n = 2 the pick comes while `launch.predict` still waits: a free pick drops it, never a miss.
          kit.tapOn(g.pads[g.targets[n]]);
          await kit.sleep(150);
          if (n === 2) out.push({ early: { misses: g.misses, waiting: g.unasked } });
          if (n === total - 1) {
            await kit.until(() => neo.scene.finished, 30000);
            out.push({ last: window.__starts['launch.done'] - window.__said });
          } else await kit.until(() => g.shot === n + 1, 20000);
        }
        return out;
      });
      const opens = check('Bouncy Launch', out, 1500);
      await finished('bouncy-launch');
      assert.deepEqual(await score('bouncy-launch'), [0, 0]);
      log(
        `Bouncy Launch 6 R4: next shown pull open ${opens} ms into a 4 s predicted/revealed, launch.predict waiting; the guide said it; an early pick dropped it (no miss); the last heard out before launch.done`,
      );
    }

    if (!only || only === 'ramp') {
      // Level 4: fair tests, two lanes changing one thing; `fairyay` follows each fair test.
      await launch('ramp-race', 4);
      await stretch(['ramp.fairyay']);
      const out = await page.evaluate(async () => {
        const g = neo.scene.game;
        /** One ghost-finger step, with any waiting ask said first. */
        const step = () => {
          const t = g.autotouch();
          if (!t) return;
          const { on, x, y } = t.tap;
          const p = x === undefined ? on.getGlobalPosition() : on.toGlobal({ x, y });
          kit.tap(p.x, p.y);
        };
        const out = [];
        const total = g.questions.length;
        for (let n = 0; n < total; n++) {
          await kit.until(() => g.index === n && !g.busy, 20000);
          if (n > 0) out.push({ n, open: performance.now() - window.__said, waiting: !!g.waiting });
          if (n === 1) {
            // Go before the question is heard: the question is said, nothing rolls, no miss.
            kit.tapOn(g.go);
            await kit.sleep(150);
            out.push({ early: { misses: g.misses, waiting: !!g.waiting, rolled: g.busy } });
          }
          if (n === 2) out.push({ guide: g.sayWaitingAsk(), waiting: !!g.waiting });
          for (let k = 0; k < 12 && g.index === n; k++) {
            await kit.until(() => !g.busy || g.index !== n, 20000);
            if (g.index !== n) break;
            if (g.waiting) g.sayWaitingAsk();
            await kit.sleep(400);
            step();
            await kit.sleep(150);
          }
          if (n === total - 1) {
            await kit.until(() => neo.scene.finished, 30000);
            out.push({ last: window.__starts['ramp.done'] - window.__said });
          } else await kit.until(() => g.index === n + 1, 20000);
        }
        return out;
      });
      const rolled = out.find((o) => o.early)?.early.rolled;
      if (rolled)
        throw new Error(
          `R4: Ramp Race: an early Go rolled before the question was heard: ${JSON.stringify(out)}`,
        );
      const opens = check('Ramp Race', out, 1500);
      await finished('ramp-race');
      assert.deepEqual(await score('ramp-race'), [0, 0]);
      log(
        `Ramp Race 4 R4: next question open ${opens} ms into a 4 s fairyay, its instruction waiting; an early Go said it (no roll, no miss); the guide said it; the last heard out before ramp.done`,
      );
    }

    if (!only || only === 'tower') {
      // Level 2: stack to the friend's height; `as-tall` starts and the knock opens at once.
      await launch('block-tower', 2);
      await stretch(['tower.as-tall']);
      const out = await page.evaluate(async () => {
        const g = neo.scene.game;
        const tapTower = () => {
          const p = g.input.toGlobal({ x: g.towerX, y: g.floor - 250 });
          kit.tap(p.x, p.y);
        };
        const out = [];
        const total = g.rounds.length;
        for (let n = 0; n < total; n++) {
          await kit.until(() => g.index === n && !g.busy && g.stack.length === 0, 20000);
          while (!g.full) {
            tapTower();
            await kit.sleep(250);
          }
          await kit.until(() => window.__said > 0 && !g.busy, 8000);
          const open = performance.now() - window.__said;
          out.push({ n, open, waiting: g.unasked });
          if (n === 0) out.push({ guide: g.sayWaitingAsk(), waiting: g.unasked });
          if (n === 1) await kit.until(() => !g.unasked, 6000);
          // n = 2: her knock while the instruction still waits; the crash takes its place.
          tapTower();
          await kit.sleep(150);
          if (n === 2) out.push({ early: { misses: g.misses, waiting: g.unasked } });
          window.__said = 0;
          if (n < total - 1) await kit.until(() => g.index === n + 1, 20000);
        }
        return out;
      });
      const opens = check('Block Tower', out, 600);
      await finished('block-tower');
      assert.deepEqual(await score('block-tower'), [0, 0]);
      log(
        `Block Tower 2 R4: knock open ${opens} ms into a 4 s as-tall, tower.knock waiting; the guide said it; the line's end said it; an early knock dropped it`,
      );
    }
    /** Defines `window.__step()`: one move of the game's own bot, played as a real tap or drag. */
    const defineStep = () =>
      page.evaluate(() => {
        window.__step = async () => {
          const g = neo.scene.game;
          const t = g.autotouch();
          if (!t) return false;
          if (t.tap) kit.tapOn(t.tap.on, t.tap.x ?? 0, t.tap.y ?? 0);
          else {
            const p = t.drag.on.toGlobal({ x: 0, y: 0 });
            const q = t.to.on.toGlobal({ x: t.to.x ?? 0, y: t.to.y ?? 0 });
            await kit.drag(kit.line([p.x, p.y], [q.x, q.y], 12));
          }
          return true;
        };
      });

    if (!only || only === 'inch') {
      // Level 4: read a ruler; the pads show with the next thing, so an early pad tap is possible.
      await launch('inchworm', 4, 'Mia', 'school');
      await stretch(['worm.long']);
      await defineStep();
      const out = await page.evaluate(async () => {
        const g = neo.scene.game;
        const out = [];
        const total = g.measures.length;
        for (let n = 0; n < total; n++) {
          await kit.until(() => g.index === n && !g.busy, 20000);
          if (n > 0) out.push({ n, open: performance.now() - window.__said, waiting: g.unasked });
          if (n === 1) out.push({ guide: g.sayWaitingAsk(), waiting: g.unasked });
          if (n === 2) {
            // A wrong pad before the question is heard: the question is said, the pad is not judged.
            kit.tapOn(g.pads.find((p) => p.n !== g.m.length).node);
            await kit.sleep(150);
            out.push({ early: { misses: g.misses, waiting: g.unasked } });
          }
          for (let k = 0; k < 10 && g.index === n; k++) {
            await kit.until(() => !g.busy || g.index !== n, 20000);
            if (g.index !== n) break;
            if (g.unasked) g.sayWaitingAsk();
            await window.__step();
            await kit.sleep(400);
          }
          if (n === total - 1) {
            await kit.until(() => neo.scene.finished, 30000);
            out.push({ last: window.__starts['worm.done'] - window.__said });
          } else await kit.until(() => g.index === n + 1, 20000);
        }
        return out;
      });
      const opens = check('Inchworm', out, 600);
      await finished('inchworm');
      assert.deepEqual(await score('inchworm'), [0, 0]);
      log(
        `Inchworm 4 R4: next measure open ${opens} ms into a 4 s worm.long, its instruction waiting; the guide said it; an early pad said it (not judged); the last heard out before worm.done`,
      );
    }

    if (!only || only === 'post') {
      // Level 2: pick the tool, watch both rows measure, tap the row with the asked-for units.
      await launch('measuring-post', 2, 'Mia', 'school');
      await stretch(['measure.right.little', 'measure.right.big']);
      await defineStep();
      const out = await page.evaluate(async () => {
        const g = neo.scene.game;
        const out = [];
        const total = g.tasks.length;
        await kit.until(() => g.phase === 'tool' && g.autotouch(), 20000);
        for (let n = 0; n < total; n++) {
          await kit.until(() => g.task === n && g.phase === 'tool', 20000);
          if (n > 0) out.push({ n, open: performance.now() - window.__said, waiting: g.unasked });
          if (n === 1) out.push({ guide: g.sayWaitingAsk(), waiting: g.unasked });
          if (n === 2) {
            // A tool tap before the question is heard: the question is said and nothing is judged or measured.
            kit.tapOn([...g.toolPads.values()][0]);
            await kit.sleep(150);
            out.push({ early: { misses: g.misses, waiting: g.unasked || g.phase !== 'tool' } });
          }
          for (let k = 0; k < 40 && g.task === n && g.phase !== 'sending' && g.phase !== 'done'; k++) {
            if (g.unasked) g.sayWaitingAsk();
            if (!(await window.__step())) await kit.sleep(250);
            else await kit.sleep(400);
          }
          if (n === total - 1) {
            await kit.until(() => neo.scene.finished, 30000);
            out.push({ last: performance.now() - window.__said });
          } else await kit.until(() => g.task === n + 1, 20000);
        }
        return out;
      });
      const opens = check('Measuring Post', out, 1500);
      await finished('measuring-post');
      assert.deepEqual(await score('measuring-post'), [0, 0]);
      log(
        `Measuring Post 2 R4: next task open ${opens} ms into a 4 s measure.right, its question waiting; the guide said it; an early tool tap said it (not judged); the last heard out before the finish`,
      );
    }

    if (!only || only === 'seesaw') {
      // Level 15: guess the pumpkin's weight, then measure it with blocks; `guessed` echoes the guess.
      await launch('seesaw-balance', 15, 'Mia', 'prek');
      await stretch(['seesaw.guessed']);
      await defineStep();
      const out = await page.evaluate(async () => {
        const g = neo.scene.game;
        const out = [];
        const total = g.rounds.length;
        for (let n = 0; n < total; n++) {
          await kit.until(() => g.index === n && !g.busy && g.pads.length > 0, 20000);
          window.__said = 0;
          kit.tapOn(g.pads[0]);
          await kit.until(() => window.__said > 0 && !g.busy, 8000);
          out.push({ n, open: performance.now() - window.__said, waiting: g.unasked });
          if (n === 0) out.push({ guide: g.sayWaitingAsk(), waiting: g.unasked });
          if (n === 1) {
            // Her first block while the instruction waits: it goes on, and its sounds take the instruction's place.
            g.unasked = false;
            const t = g.autotouch();
            g.unasked = true;
            const item = g.items.find((i) => i.node === t.drag.on);
            const p = item.node.toGlobal({ x: 0, y: -item.height / 2 });
            const q = t.to.on.toGlobal({ x: t.to.x ?? 0, y: t.to.y ?? 0 });
            await kit.drag(kit.line([p.x, p.y], [q.x, q.y + 40], 20));
            await kit.sleep(150);
            out.push({ early: { misses: g.misses, waiting: g.unasked || !item.side } });
          }
          for (let k = 0; k < 40 && g.index === n && !g.finished; k++) {
            await kit.until(() => !g.busy || g.index !== n || g.finished, 20000);
            if (g.index !== n || g.finished) break;
            if (g.unasked) g.sayWaitingAsk();
            if (g.pads.length && g.round.prediction !== undefined) {
              kit.tapOn(g.pads.find((p) => p.value === g.round.answer));
              await kit.sleep(550);
              continue;
            }
            if (!(await window.__step())) await kit.sleep(250);
            else await kit.sleep(550);
          }
          if (n < total - 1) await kit.until(() => g.index === n + 1, 20000);
        }
        return out;
      });
      const opens = check('Seesaw Balance', out, 600);
      await finished('seesaw-balance');
      assert.deepEqual(await score('seesaw-balance'), [0, 0]);
      log(
        `Seesaw Balance 15 R4: blocks open ${opens} ms into a 4 s guessed, measure-pumpkin waiting; the guide said it; her first block went on and dropped it`,
      );
    }
  }

  return { tinkerCutLines };
}
