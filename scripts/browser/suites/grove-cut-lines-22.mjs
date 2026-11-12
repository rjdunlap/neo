import assert from 'node:assert/strict';

/**
 * U7d fix batch 22 (R4): in `read-do`, `not-always` and `story-weaver` a right answer's line never holds the next sign,
 * claim or tile. The lines are stretched to at least 4 s in the page (and their start recorded), so the next board opening
 * sooner shows the line no longer gates it; its ask waits (said by the guide, or in place of a miss at an early wrong tap),
 * and the round's last line is still heard out. Story Weaver's page reading plays with input open and her next tile stops
 * its lighting. GROVE22_ONLY=read|notalways|weaver plays one game.
 */
export function createSuite({ page, launch, finished, log }) {
  async function groveCutLines22() {
    const only = process.env.GROVE22_ONLY;
    const score = (id) =>
      page.evaluate((id) => {
        const r = kit.store.stats(id).history.at(-1);
        return [r.misses, r.hints];
      }, id);
    /** Stretches the named lines (or ids starting with a name ending in '.') to at least 4 s, recording when each starts. */
    const stretch = (ids) =>
      page.evaluate((ids) => {
        const g = neo.scene.game;
        const say = g.ctx.say.bind(g.ctx);
        window.__said = 0;
        g.ctx.say = (id, vars) => {
          const line = say(id, vars);
          if (!ids.some((x) => (x.endsWith('.') ? id.startsWith(x) : id === x))) return line;
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
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    if (!only || only === 'read') {
      // Level 1: read the sign, tap the picture that does it.
      await launch('read-do', 1);
      await stretch(['read.meaning']);
      const out = await page.evaluate(async () => {
        const g = neo.scene.game;
        /** The right picture, asked of the ghost finger's rule with the ask set aside. */
        const right = () => {
          const u = g.unasked;
          g.unasked = false;
          const t = g.autotouch();
          g.unasked = u;
          return t.tap.on;
        };
        const out = [];
        const total = g.tasks.length;
        for (let n = 0; n < total; n++) {
          await kit.until(() => g.index === n && !g.busy, 20000);
          if (n > 0) out.push({ n, open: performance.now() - window.__said, waiting: g.unasked });
          if (n === 1) {
            // A wrong picture before the instruction is heard: not a miss, the instruction is said instead.
            kit.tapOn(g.choices.find((c) => c.node !== right()).node);
            await kit.sleep(150);
            out.push({ early: { misses: g.misses, waiting: g.unasked } });
          }
          if (n === 2) out.push({ guide: g.sayWaitingAsk(), waiting: g.unasked });
          await kit.sleep(400);
          kit.tapOn(right());
          if (n === total - 1) {
            await kit.until(() => window.__said > 0 && neo.scene.finished, 25000);
            out.push({ last: performance.now() - window.__said });
          } else await kit.until(() => g.index === n + 1, 20000);
        }
        return out;
      });
      const opens = check('Read & Do', out, 1500);
      await finished('read-do');
      assert.deepEqual(await score('read-do'), [0, 0]);
      log(
        `Read & Do 1 R4: next sign open ${opens} ms into a 4 s read.meaning, its instruction waiting; an early wrong picture said it (no miss); the guide said it; the last heard out`,
      );
    }

    if (!only || only === 'notalways') {
      // Level 2: break a claim with a card, or stamp Every one.
      await launch('not-always', 2);
      await stretch(['notalways.breaks.', 'notalways.every']);
      const out = await page.evaluate(async () => {
        const g = neo.scene.game,
          p = g.play;
        const answer = () => {
          const t = p.target();
          return t.kind === 'stamp' ? g.stamp : g.cards[t.i].node;
        };
        const out = [];
        const total = p.round.claims.length;
        for (let n = 0; n < total; n++) {
          await kit.until(() => p.claim === n && p.phase === 'claim' && !g.busy, 20000);
          await kit.sleep(250);
          if (n > 0) out.push({ n, open: performance.now() - window.__said - 250, waiting: g.unasked });
          if (n === 1) {
            // The wrong kind of answer before the claim is heard: the claim is said, not a miss.
            const t = p.target();
            kit.tapOn(t.kind === 'stamp' ? g.cards[0].node : g.stamp);
            await kit.sleep(150);
            out.push({ early: { misses: p.misses, waiting: g.unasked } });
          }
          if (n === 2) out.push({ guide: g.sayWaitingAsk(), waiting: g.unasked });
          await kit.sleep(400);
          kit.tapOn(answer());
          if (n === total - 1) {
            await kit.until(() => neo.scene.finished, 25000);
            out.push({ last: performance.now() - window.__said });
          } else await kit.until(() => p.claim === n + 1, 20000);
        }
        return out;
      });
      const opens = check('Not Always', out, 1500);
      await finished('not-always');
      assert.deepEqual(await score('not-always'), [0, 0]);
      log(
        `Not Always 2 R4: next claim open ${opens} ms into a 4 s breaks/every line, its read-out waiting; an early wrong answer said it (no miss); the guide said it; the last heard out`,
      );
    }

    if (!only || only === 'weaver') {
      // Level 2: a placed tile's page is read back with input open; her next tile stops the lighting.
      await launch('story-weaver', 2);
      const out = await page.evaluate(async () => {
        const g = neo.scene.game;
        await kit.until(() => !g.busy, 20000);
        // The tray's first tile for the part being built (the ghost finger would ask the owl after the first).
        const tile = () => g.tiles.find((t) => t.id === g.round.tray()[0]).node;
        // Place tiles until a page of several words is being read back.
        let open = 0,
          lighting = false;
        for (let k = 0; k < 4 && !(lighting && g.words.length >= 4); k++) {
          const next = tile();
          kit.tapOn(next);
          await kit.sleep(300);
          const t0 = performance.now();
          kit.tapOn(next);
          await kit.sleep(100);
          await kit.until(() => !g.busy, 8000);
          open = performance.now() - t0;
          lighting = g.lit < g.words.length - 1;
          if (!(lighting && g.words.length >= 4)) await kit.until(() => g.lit >= g.words.length - 1, 8000);
          await kit.sleep(300);
        }
        await kit.sleep(150);
        kit.tapOn(tile());
        await kit.sleep(150);
        return { open, lighting, words: g.words.length, stopped: g.lit === g.words.length - 1 };
      });
      if (!(out.open < 1500 && out.lighting && out.stopped))
        throw new Error(`R4: Story Weaver's page reading held the next tile: ${JSON.stringify(out)}`);
      await page.evaluate(() => kit.tapOn(neo.scene.game.buttons.read));
      await page.waitForTimeout(250);
      await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
      await page.evaluate(() => kit.tapOn(neo.scene.game.buttons.mine));
      await finished('story-weaver');
      assert.deepEqual(await score('story-weaver'), [0, 0]);
      log(
        `Story Weaver 2 R4: input open ${Math.round(out.open)} ms after a placed tile while its ${out.words}-word page was still lighting; her next tile stopped the lighting`,
      );
    }
  }

  return { groveCutLines22 };
}
