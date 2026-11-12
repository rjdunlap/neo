import assert from 'node:assert/strict';

/**
 * U7d fix batch 20 (R4): in `clap-syllables`, `rhyme-time` and `photo-safari` a right answer's line never holds the next
 * word, question or scene. The lines are stretched to at least 4 s in the page, so the next board opening sooner shows the
 * line no longer gates it; its ask waits (said by the guide, or in place of a miss at an early wrong tap), and the round's
 * last line is still heard out. GROVE20_ONLY=clap|rhyme|safari plays one game.
 */
export function createSuite({ page, launch, finished, log }) {
  async function groveCutLines20() {
    const only = process.env.GROVE20_ONLY;
    const score = (id) =>
      page.evaluate((id) => {
        const r = kit.store.stats(id).history.at(-1);
        return [r.misses, r.hints];
      }, id);
    /** Stretches the named lines to at least 4 s. */
    const stretch = (ids) =>
      page.evaluate((ids) => {
        const g = neo.scene.game;
        const say = g.ctx.say.bind(g.ctx);
        g.ctx.say = (id, vars) => {
          const line = say(id, vars);
          if (!ids.includes(id)) return line;
          return Promise.all([line, kit.sleep(4000)]).then(() => undefined);
        };
      }, ids);
    /** Checks one game's record of opens: each next board open well inside the 4 s line, its ask waiting. */
    const check = (name, out, limit) => {
      for (const o of out) {
        if (o.open !== undefined && !(o.open < limit && o.waiting))
          throw new Error(`R4: ${name}'s line held the next board: ${JSON.stringify(out)}`);
        if (o.early && (o.early.misses !== 0 || o.early.waiting))
          throw new Error(
            `R4: ${name}: an early tap was a miss or left the ask unsaid: ${JSON.stringify(out)}`,
          );
        if (o.guide !== undefined && (!o.guide || o.waiting))
          throw new Error(`R4: ${name}: the guide did not say the waiting ask: ${JSON.stringify(out)}`);
        if (o.last !== undefined && o.last < 4000)
          throw new Error(`R4: ${name}'s last line was cut: ${JSON.stringify(out)}`);
      }
      return out
        .filter((o) => o.open !== undefined)
        .map((o) => Math.round(o.open))
        .join(', ');
    };

    if (!only || only === 'clap') {
      // Level 1 (clap along): three words, each finished by its last clap.
      await launch('clap-syllables', 1);
      await stretch(['clap.count']);
      const out = await page.evaluate(async () => {
        const g = neo.scene.game;
        const clapPad = () => kit.tapOn(g.pad);
        const out = [];
        let t0 = 0;
        for (let n = 0; n < g.questions.length; n++) {
          await kit.until(() => g.index === n && !g.busy, 15000);
          if (n > 0) out.push({ n, open: performance.now() - t0, waiting: g.unasked });
          if (n === 1) {
            out.push({ guide: g.sayWaitingAsk(), waiting: g.unasked });
            // The guide's ask brings the pet's claps again (clap along).
            await kit.until(() => !g.busy, 15000);
          }
          if (n === 2) {
            // Her first clap before the word is named names it and counts.
            clapPad();
            await kit.sleep(250);
            out.push({ early: { misses: g.misses, waiting: g.unasked }, claps: g.claps });
          }
          const beats = g.word.parts.length;
          while (g.claps < beats) {
            clapPad();
            await kit.sleep(250);
          }
          t0 = performance.now();
          if (n === g.questions.length - 1) {
            await kit.until(() => neo.scene.finished, 20000);
            out.push({ last: performance.now() - t0 });
          }
        }
        return out;
      });
      const opens = check('Clap Syllables', out, 2000);
      await finished('clap-syllables');
      assert.deepEqual(await score('clap-syllables'), [0, 0]);
      log(
        `Clap Syllables 1 R4: next word open ${opens} ms into a 4 s count, its ask waiting; the guide said it; an early clap named it and counted; the last count heard out`,
      );
    }

    if (!only || only === 'rhyme') {
      // Level 5 (riddles): four riddles, each answered by its picture.
      await launch('rhyme-time', 5);
      await stretch(['rhyme.riddleYes']);
      const out = await page.evaluate(async () => {
        const g = neo.scene.game;
        const card = (right) => g.cards.find((c) => (c.word === g.riddle.answer) === right);
        const out = [];
        let t0 = 0;
        const total = g.riddles.length;
        for (let n = 0; n < total; n++) {
          await kit.until(() => g.index === n && !g.busy, 15000);
          if (n > 0) out.push({ n, open: performance.now() - t0, waiting: g.unasked });
          if (n === 1) {
            // A wrong picture before the riddle is heard: not a miss, the riddle is said instead.
            kit.tapOn(card(false).node);
            await kit.sleep(150);
            out.push({ early: { misses: g.misses, waiting: g.unasked } });
          }
          if (n === 2) out.push({ guide: g.sayWaitingAsk(), waiting: g.unasked });
          await kit.sleep(400);
          t0 = performance.now();
          kit.tapOn(card(true).node);
          if (n === total - 1) {
            await kit.until(() => neo.scene.finished, 20000);
            out.push({ last: performance.now() - t0 });
          }
        }
        return out;
      });
      const opens = check('Rhyme Time', out, 2200);
      await finished('rhyme-time');
      assert.deepEqual(await score('rhyme-time'), [0, 0]);
      log(
        `Rhyme Time 5 R4: next riddle open ${opens} ms into a 4 s riddleYes, its ask waiting; an early wrong tap said it (no miss); the guide said it; the last heard out`,
      );
    }

    if (!only || only === 'safari') {
      // Level 2 (who): four photos of the animal named.
      await launch('photo-safari', 2);
      await stretch(['safari.click']);
      const out = await page.evaluate(async () => {
        const g = neo.scene.game;
        const tapActor = (a) => {
          const b = a.getBounds();
          kit.tap(b.x + b.width / 2, b.y + b.height / 2);
        };
        const out = [];
        let t0 = 0;
        const total = g.plan.photos;
        for (let n = 0; n < total; n++) {
          await kit.until(() => g.photos === n && !g.busy && g.scene, 15000);
          if (n > 0) out.push({ n, open: performance.now() - t0, waiting: g.unasked });
          if (n === 1) {
            tapActor(g.actors.find((a) => a !== g.target));
            await kit.sleep(150);
            out.push({ early: { misses: g.misses, waiting: g.unasked } });
            await kit.sleep(600);
          }
          if (n === 2) out.push({ guide: g.sayWaitingAsk(), waiting: g.unasked });
          await kit.sleep(400);
          t0 = performance.now();
          tapActor(g.target);
          if (n === total - 1) {
            await kit.until(() => neo.scene.finished, 20000);
            out.push({ last: performance.now() - t0 });
          }
        }
        return out;
      });
      const opens = check('Photo Safari', out, 2200);
      await finished('photo-safari');
      assert.deepEqual(await score('photo-safari'), [0, 0]);
      log(
        `Photo Safari 2 R4: next scene open ${opens} ms into a 4 s click, its ask waiting; an early wrong snap said it (no miss); the guide said it; the last heard out`,
      );
    }
  }

  return { groveCutLines20 };
}
