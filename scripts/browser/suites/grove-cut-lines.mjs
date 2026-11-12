import assert from 'node:assert/strict';

/**
 * U7d fix batch 19 (R4): in `goodnight-room`, `opposites` and `word-monsters` a tapped friend's, card's or monster's
 * line never holds the next tap. Each line is stretched to at least 4 s in the page, so the next friend, card or
 * question opening sooner shows the line no longer gates it; the round's last line is still heard out.
 * GROVE_ONLY=night|opp|monsters plays one game.
 */
export function createSuite({ page, launch, finished, screenshot, log }) {
  async function groveCutLines() {
    const only = process.env.GROVE_ONLY;
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
          if (!ids.some((x) => id === x || (x.endsWith('*') && id.startsWith(x.slice(0, -1))))) return line;
          return Promise.all([line, kit.sleep(4000)]).then(() => undefined);
        };
      }, ids);

    if (!only || only === 'night') {
      // Level 3 (named): five requests, each answered by one goodnight.
      await launch('goodnight-room', 3);
      await stretch(['night.goodnight']);
      const opens = await page.evaluate(async () => {
        const g = neo.scene.game;
        const tapThing = (thing) => {
          const b = g.sleepers.find((s) => s.thing === thing).getBounds();
          kit.tap(b.x + b.width / 2, b.y + b.height / 2);
        };
        const out = [];
        for (let n = 0; n < g.requests.length; n++) {
          await kit.until(() => g.index === n && !g.busy, 15000);
          if (n === 1) {
            // A tap before the waiting request is heard: not a miss, the request is said instead.
            const other = g.sleepers.find((s) => !s.asleep && s.thing !== g.requests[n][0]).thing;
            tapThing(other);
            await kit.sleep(150);
            out.push({ early: { misses: g.misses, waiting: g.unasked } });
          }
          if (n === 2) out.push({ guide: g.sayWaitingAsk(), waiting: g.unasked });
          await kit.sleep(350);
          const t0 = performance.now();
          tapThing(g.requests[n][0]);
          if (n === g.requests.length - 1) {
            await kit.until(() => neo.scene.finished, 20000);
            out.push({ last: performance.now() - t0 });
          } else {
            await kit.until(() => g.index === n + 1 && !g.busy, 15000);
            out.push({ n, open: performance.now() - t0, waiting: !!g.unasked });
          }
        }
        return out;
      });
      for (const o of opens) {
        if (o.open !== undefined && !(o.open < 1000 && o.waiting))
          throw new Error(`R4: a goodnight held the next request: ${JSON.stringify(opens)}`);
        if (o.early && (o.early.misses !== 0 || o.early.waiting))
          throw new Error(`R4: an early tap was a miss or left the request unsaid: ${JSON.stringify(opens)}`);
        if (o.guide !== undefined && (!o.guide || o.waiting))
          throw new Error(`R4: the guide did not say the waiting request`);
        if (o.last !== undefined && o.last < 4000)
          throw new Error(`R4: the last goodnight was cut: ${JSON.stringify(opens)}`);
      }
      await finished('goodnight-room');
      assert.deepEqual(await score('goodnight-room'), [0, 0]);
      log(
        `Goodnight Room 3 R4: next request open ${opens
          .filter((o) => o.open !== undefined)
          .map((o) => Math.round(o.open))
          .join(
            ', ',
          )} ms into a 4 s goodnight, its ask waiting; an early tap said it (no miss); the guide said it; the last heard out`,
      );

      // Level 7 (count): her taps cut the running count; the tally keeps the total.
      await launch('goodnight-room', 7);
      await stretch(['night.counted']);
      const count = await page.evaluate(async () => {
        const g = neo.scene.game;
        await kit.until(() => !g.busy, 15000);
        const things = [...g.friends].reverse().slice(0, g.targetCount);
        const seen = [];
        for (const thing of things.slice(0, -1)) {
          const b = g.sleepers.find((s) => s.thing === thing).getBounds();
          kit.tap(b.x + b.width / 2, b.y + b.height / 2);
          await kit.sleep(500);
          seen.push({ asleep: g.sleepers.filter((s) => s.asleep).length, busy: g.busy, tally: g.tally.text });
        }
        return { seen, target: g.targetCount, last: things.at(-1) };
      });
      count.seen.forEach((s, i) => {
        if (s.asleep !== i + 1 || s.busy || s.tally !== `${i + 1} / ${count.target}`)
          throw new Error(`R4: a count held her next tap: ${JSON.stringify(count)}`);
      });
      await page.evaluate((thing) => {
        const b = neo.scene.game.sleepers.find((s) => s.thing === thing).getBounds();
        kit.tap(b.x + b.width / 2, b.y + b.height / 2);
      }, count.last);
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(400);
      await screenshot('goodnight-room-7-r4-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await finished('goodnight-room');
      assert.deepEqual(await score('goodnight-room'), [0, 0]);
      log(
        `Goodnight Room 7 R4: ${count.target} friends counted 0.5 s apart over 4 s counts, the tally kept, finished`,
      );
    }

    if (!only || only === 'opp') {
      // Level 1 (switch): the next card comes after the act and 0.5 s, not after the word.
      await launch('opposites', 1);
      await stretch(['opp.word']);
      const flips = await page.evaluate(async () => {
        const g = neo.scene.game;
        const out = [];
        for (let n = 0; n < g.rounds.length; n++) {
          await kit.until(() => g.index === n && !g.busy, 15000);
          await kit.sleep(350);
          const t0 = performance.now();
          kit.tapOn(g.cards[0].node);
          if (n === g.rounds.length - 1) {
            await kit.until(() => neo.scene.finished, 20000);
            out.push({ last: performance.now() - t0 });
          } else {
            await kit.until(() => g.index === n + 1 && !g.busy, 15000);
            out.push({ open: performance.now() - t0 });
          }
        }
        return out;
      });
      if (
        flips.some(
          (o) => (o.open !== undefined && !(o.open < 3000)) || (o.last !== undefined && o.last < 4000),
        )
      )
        throw new Error(`R4: a flipped card's word held the next card: ${JSON.stringify(flips)}`);
      await finished('opposites');
      log(
        `Opposites 1 R4: next card open ${flips
          .filter((o) => o.open !== undefined)
          .map((o) => Math.round(o.open))
          .join(', ')} ms into a 4 s word; the last heard out`,
      );

      // Level 2 (find): a right answer's praise starts and the next question follows the 0.3 s beat.
      await launch('opposites', 2);
      await stretch(['opp.yay']);
      const finds = await page.evaluate(async () => {
        const L = await import('/src/games/opposites/logic.ts');
        const g = neo.scene.game;
        const out = [];
        for (let n = 0; n < g.rounds.length; n++) {
          await kit.until(() => g.index === n && !g.busy, 15000);
          const r = g.round;
          const right = g.cards.find((c) => L.word(c.card) === L.word(r.ask));
          if (n === 0) {
            kit.tapOn(g.cards.find((c) => c !== right).node);
            await kit.sleep(300);
          }
          await kit.sleep(350);
          const t0 = performance.now();
          kit.tapOn(right.node);
          if (n === g.rounds.length - 1) {
            await kit.until(() => neo.scene.finished, 20000);
            out.push({ last: performance.now() - t0 });
          } else {
            await kit.until(() => g.index === n + 1 && !g.busy, 15000);
            out.push({ open: performance.now() - t0 });
          }
        }
        return out;
      });
      if (
        finds.some(
          (o) => (o.open !== undefined && !(o.open < 1500)) || (o.last !== undefined && o.last < 4000),
        )
      )
        throw new Error(`R4: a right answer's praise held the next question: ${JSON.stringify(finds)}`);
      await finished('opposites');
      assert.deepEqual(await score('opposites'), [1, 0]);
      log(
        `Opposites 2 R4: one miss, next question open ${finds
          .filter((o) => o.open !== undefined)
          .map((o) => Math.round(o.open))
          .join(', ')} ms into a 4 s praise; the last heard out`,
      );
    }

    if (!only || only === 'monsters') {
      // Level 3 (who): the right monster's sound starts and the next question's monsters come at once.
      await launch('word-monsters', 3);
      await stretch(['sound.*']);
      const qs = await page.evaluate(async () => {
        const g = neo.scene.game;
        const right = () => g.monsters.find((m) => !m.destroyed && m.letter === g.question.answer);
        const out = [];
        for (let n = 0; n < g.questions.length; n++) {
          await kit.until(() => g.index === n && !g.busy, 15000);
          if (n === 1) {
            kit.tapOn(g.monsters.find((m) => !m.destroyed && m.letter !== g.question.answer));
            await kit.sleep(150);
            out.push({ early: { misses: g.misses, waiting: !!g.unasked } });
          }
          if (n === 2) out.push({ guide: g.sayWaitingAsk(), waiting: !!g.unasked });
          await kit.sleep(350);
          const t0 = performance.now();
          kit.tapOn(right());
          if (n === g.questions.length - 1) {
            await kit.until(() => neo.scene.finished, 20000);
            out.push({ last: performance.now() - t0 });
          } else {
            await kit.until(() => g.index === n + 1 && !g.busy, 15000);
            out.push({ open: performance.now() - t0, waiting: !!g.unasked });
          }
        }
        return out;
      });
      for (const o of qs) {
        if (o.open !== undefined && !(o.open < 1000 && o.waiting))
          throw new Error(`R4: a monster's sound held the next question: ${JSON.stringify(qs)}`);
        if (o.early && (o.early.misses !== 0 || o.early.waiting))
          throw new Error(`R4: an early tap was a miss or left the ask unsaid: ${JSON.stringify(qs)}`);
        if (o.guide !== undefined && (!o.guide || o.waiting))
          throw new Error(`R4: the guide did not say the waiting ask`);
        if (o.last !== undefined && o.last < 4000)
          throw new Error(`R4: the last sound was cut: ${JSON.stringify(qs)}`);
      }
      await finished('word-monsters');
      assert.deepEqual(await score('word-monsters'), [0, 0]);
      log(
        `Word Monsters 3 R4: next question open ${qs
          .filter((o) => o.open !== undefined)
          .map((o) => Math.round(o.open))
          .join(
            ', ',
          )} ms into a 4 s sound, its ask waiting; an early tap said it (no miss); the guide said it; the last heard out`,
      );
    }
  }
  return { groveCutLines };
}
