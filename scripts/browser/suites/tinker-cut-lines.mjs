import assert from 'node:assert/strict';

/**
 * U7d fix batch 23 (R4): in `bouncy-launch`, `ramp-race` and `block-tower` a right answer's line never holds the next
 * shot, question or knock. The lines are stretched to at least 4 s in the page (and each line's start recorded), so the
 * next board opening sooner shows the line no longer gates it; its ask waits (said by the guide, or at her first touch),
 * and the round's last line is still heard out before the closing line. TINKER_ONLY=launch|ramp|tower plays one game.
 * Batch 25 adds `moon-window`, `sense-detective` and `fossil-dig` (TINKER_ONLY=moon|sense|fossil).
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
    if (!only || only === 'moon') {
      // Level 2's `moonwindow.right` and level 3's view line follow every right card but the last; level 2 tries an early
      // wrong card on the second board, level 3 the guide.
      for (const [level, line] of [
        [2, 'moonwindow.right'],
        [3, 'moonwindow.view'],
      ]) {
        await launch('moon-window', level);
        await stretch(
          level === 2 ? [line] : ['none', 'slice', 'half', 'most', 'full'].map((a) => `${line}.${a}`),
        );
        const out = await page.evaluate(async (level) => {
          const g = neo.scene.game;
          const out = [];
          const total = g.round.boards.length;
          for (let n = 0; n < total; n++) {
            await kit.until(() => g.round.index === n && !g.busy, 20000);
            if (n > 0) out.push({ n, open: performance.now() - window.__said, waiting: g.unasked });
            if (n === 1 && level === 3) out.push({ guide: g.sayWaitingAsk(), waiting: g.unasked });
            if (n === 1 && level === 2) {
              // The wrong card before the request is heard: the request is said, never a miss.
              kit.tapOn(g.cards[1 - g.round.hintFor()].node);
              await kit.sleep(150);
              out.push({ early: { misses: g.misses, waiting: g.unasked } });
            }
            if (n > 1) await kit.until(() => !g.unasked, 6000);
            kit.tapOn(g.cards[g.round.hintFor()].node);
            if (n === total - 1) {
              await kit.until(() => neo.scene.finished, 30000);
              out.push({ last: window.__starts['moonwindow.done'] - window.__said });
            } else await kit.until(() => g.round.index === n + 1, 20000);
          }
          return out;
        }, level);
        const opens = check(`Moon Window ${level}`, out, 1500);
        await finished('moon-window');
        assert.deepEqual(await score('moon-window'), [0, 0]);
        log(
          `Moon Window ${level} R4: next cards open ${opens} ms into a 4 s right-card line, the request waiting; ${level === 2 ? 'an early wrong card said it (no miss)' : 'the guide said it'}; the last heard out before moonwindow.done`,
        );
      }
    }

    if (!only || only === 'sense') {
      // Level 4's `so-far` and level 5's `cant-tell-right`: the next step opens as the line starts, its instruction waiting.
      for (const [level, line] of [
        [4, 'sense.so-far'],
        [5, 'sense.cant-tell-right'],
      ]) {
        await launch('sense-detective', level);
        await stretch([line]);
        const out = await page.evaluate(async (level) => {
          const g = neo.scene.game;
          const out = [];
          let seen = 0;
          let k = 0;
          for (let guard = 0; guard < 300 && !neo.scene.finished && !g.finished; guard++) {
            if (window.__said && window.__said !== seen && !g.busy) {
              seen = window.__said;
              out.push({ n: k, open: performance.now() - seen, waiting: g.unasked });
              if (k === 0 && level === 5) out.push({ guide: g.sayWaitingAsk(), waiting: g.unasked });
              else if (k === 0) {
                // The green tick before the instruction is heard says it and is not judged.
                const before = g.misses;
                kit.tapOn(g.checkBtn);
                await kit.sleep(150);
                out.push({ early: { misses: g.misses - before, waiting: g.unasked } });
              } else await kit.until(() => !g.unasked, 6000);
              k++;
            }
            const t = g.autotouch();
            if (t) {
              kit.tapOn(t.tap.on);
              await kit.sleep(300);
            } else await kit.sleep(100);
          }
          return out;
        }, level);
        if (!out.some((o) => o.open !== undefined))
          throw new Error(`R4: Sense Detective ${level}: ${line} never played: ${JSON.stringify(out)}`);
        const opens = check(`Sense Detective ${level}`, out, 600);
        await finished('sense-detective');
        assert.deepEqual(await score('sense-detective'), [0, 0]);
        log(
          `Sense Detective ${level} R4: next step open ${opens} ms into a 4 s ${line}, its instruction waiting; ${level === 5 ? 'the guide said it' : 'an early tick said it (not judged)'}`,
        );
      }
    }

    if (!only || only === 'fossil') {
      // Level 1: `found` as her brushing uncovers the print, then a right flag's `where-recorded`.
      await launch('fossil-dig', 1);
      await stretch(['fossil-dig.found', 'fossil-dig.where-recorded']);
      const out = await page.evaluate(async () => {
        const g = neo.scene.game;
        const out = [];
        let seen = 0;
        let k = 0;
        for (let guard = 0; guard < 400 && !neo.scene.finished && !g.finished; guard++) {
          if (window.__said && window.__said !== seen && !g.busy) {
            seen = window.__said;
            out.push({ n: k, open: performance.now() - seen, waiting: g.unasked });
            if (k === 0) {
              // A wrong flag before `instruct-where` is heard says it, never a miss.
              await kit.until(() => g.brushing.size === 0, 4000);
              const right = g.round.site;
              kit.tapOn(g.flagNodes[(right + 1) % 3]);
              await kit.sleep(150);
              out.push({ early: { misses: g.misses, waiting: g.unasked } });
            } else out.push({ guide: g.sayWaitingAsk(), waiting: g.unasked });
            k++;
          }
          const t = g.autotouch();
          if (t) {
            const p = t.tap.on.toGlobal({ x: t.tap.x ?? 0, y: t.tap.y ?? 0 });
            kit.tap(p.x, p.y);
            await kit.sleep(250);
          } else await kit.sleep(100);
        }
        return out;
      });
      if (out.filter((o) => o.open !== undefined).length !== 2)
        throw new Error(`R4: Fossil Dig: found and where-recorded did not both play: ${JSON.stringify(out)}`);
      const opens = check('Fossil Dig', out, 600);
      await finished('fossil-dig');
      assert.deepEqual(await score('fossil-dig'), [0, 0]);
      log(
        `Fossil Dig 1 R4: flags open ${opens.split(', ')[0]} ms into a 4 s found and the like cards ${opens.split(', ')[1]} ms into a 4 s where-recorded, each instruction waiting; an early wrong flag said it (no miss); the guide said the other`,
      );
    }
  }

  return { tinkerCutLines };
}
