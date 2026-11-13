import assert from 'node:assert/strict';

/**
 * U7d fix batches 19 and 21 (R4): in `goodnight-room`, `opposites` and `word-monsters` a tapped friend's, card's or
 * monster's line, and in `pond-typing`, `word-glue` and `owl-walk` a typed word's, joined pair's or flipped card's
 * line, never holds the next tap. Each line is stretched to at least 4 s in the page, so the next friend, card,
 * question, bubble, ask or stone tap opening sooner shows the line no longer gates it; the round's last line is
 * still heard out. GROVE_ONLY=night|nightbig|safaribig|opp|monsters|monstersbig|pond|glue|gluebig|owl plays one game.
 */
export function createSuite({ page, launch, finished, screenshot, log, ready, chooserEnter, errors }) {
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

      // Level 4 (two in order): a first tap while the next request waits keeps it waiting, behind its own goodnight.
      await launch('goodnight-room', 4);
      await stretch(['night.goodnight']);
      const two = await page.evaluate(async () => {
        const g = neo.scene.game;
        const tapThing = (thing) => {
          const b = g.sleepers.find((s) => s.thing === thing).getBounds();
          kit.tap(b.x + b.width / 2, b.y + b.height / 2);
        };
        const out = [];
        for (let n = 0; n < g.requests.length; n++) {
          const r = g.requests[n];
          await kit.until(() => g.index === n && !g.busy, 15000);
          await kit.sleep(350);
          tapThing(r[0]);
          await kit.sleep(350);
          if (n === 1) out.push({ step: g.step, waiting: !!g.unasked, guide: g.sayWaitingAsk() });
          tapThing(r[1]);
          await kit.until(() => neo.scene.finished || (g.index === n + 1 && !g.busy), 20000);
        }
        await kit.until(() => neo.scene.finished, 20000);
        return { out, misses: g.misses };
      });
      if (!(two.out[0]?.step === 1 && two.out[0].waiting && two.out[0].guide) || two.misses !== 0)
        throw new Error(`R4: a first-of-two tap dropped the waiting request: ${JSON.stringify(two)}`);
      await finished('goodnight-room');
      assert.deepEqual(await score('goodnight-room'), [0, 0]);
      log(
        'Goodnight Room 4 R4: a first-of-two tap kept the next request waiting; the guide said it; no misses',
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

    if (!only || only === 'night' || only === 'nightbig') {
      // Level 11 (lap): one big sleepy friend; a touch anywhere (sky, floor, the friend, the window) tucks it in and the
      // next tiptoes in at once, under a 4 s goodnight; nothing is a miss and the last goodnight is heard out.
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);
      await launch('goodnight-room', 11);
      await stretch(['night.goodnight']);
      await page.waitForTimeout(600);
      await screenshot('goodnight-room-11-start-portrait');
      const big = await page.evaluate(async () => {
        const g = neo.scene.game;
        if (g.plan.mode !== 'big' || g.sleepers.length !== 4) throw new Error('Goodnight big deal');
        const v = g.view;
        const at = (x, y) => {
          const p = g.catcher.toGlobal({ x, y });
          kit.tap(p.x, p.y);
        };
        const spots = [
          () => at(v.w * 0.1, v.h * 0.15),
          () => at(v.w * 0.85, v.h * 0.92),
          () => kit.tapOn(g.sleepers[g.bigAt], 0, g.sleepers[g.bigAt].mid),
          () => at(v.w - 150, 140),
        ];
        const out = { opens: [], sizes: [], shown: [] };
        for (let n = 0; n < 4; n++) {
          await kit.until(() => !g.busy && g.bigAt === n, 15000);
          await kit.sleep(250);
          const s = g.sleepers[n];
          const b = s.getBounds();
          out.sizes.push(Math.min(b.width, b.height) / g.catcher.worldTransform.a);
          out.shown.push(g.sleepers.filter((x) => x.visible && !x.asleep).length);
          const t0 = performance.now();
          spots[n]();
          if (n === 3) {
            await kit.until(() => neo.scene.finished, 20000);
            out.last = performance.now() - t0;
          } else {
            await kit.until(() => g.bigAt === n + 1 && !g.busy, 15000);
            out.opens.push(performance.now() - t0);
          }
        }
        out.asleep = g.sleepers.every((x) => x.asleep);
        out.misses = g.misses;
        out.hints = g.hints;
        return out;
      });
      if (big.sizes.some((s) => s < 150)) throw new Error(`Big friend too small: ${JSON.stringify(big)}`);
      if (big.shown.some((n) => n !== 1))
        throw new Error(`More than one friend waits awake: ${JSON.stringify(big)}`);
      if (big.opens.some((t) => t > 2000))
        throw new Error(`A goodnight held the next friend: ${JSON.stringify(big)}`);
      if (!(big.last >= 4000)) throw new Error(`The last goodnight was cut: ${JSON.stringify(big)}`);
      if (!big.asleep || big.misses || big.hints)
        throw new Error(`Goodnight big not free: ${JSON.stringify(big)}`);
      await screenshot('goodnight-room-11-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await finished('goodnight-room');
      assert.deepEqual(await score('goodnight-room'), [0, 0]);
      log(
        `Goodnight Room 11: four big friends tucked in by touches on the sky, floor, friend and window, next in ${big.opens
          .map(Math.round)
          .join('/')} ms under 4 s goodnights, the last heard out, no misses`,
      );
    }

    if (!only || only === 'safaribig') {
      // Photo Safari level 13 (lap): one big friend; a touch anywhere (sky, grass, the friend, beside it) takes its
      // photo and the next friend walks in under a 4 s click line; a touch while it walks in only hops it; six
      // different friends fill the album, nothing is a miss, and the last click is heard out.
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);
      await launch('photo-safari', 13);
      await stretch(['safari.click']);
      await page.waitForTimeout(600);
      await screenshot('photo-safari-13-start-portrait');
      const big = await page.evaluate(async () => {
        const g = neo.scene.game;
        if (!g.plan.big || g.plan.photos !== 6) throw new Error('Photo Safari big plan');
        const v = g.view;
        const at = (x, y) => {
          const p = g.cast.toGlobal({ x, y });
          kit.tap(p.x, p.y);
        };
        const spots = [
          () => at(v.w * 0.1, v.h * 0.15),
          () => at(v.w * 0.85, v.h * 0.92),
          () => at(g.actors[0].x, g.actors[0].y - 120),
          () => at(v.w * 0.2, v.h * 0.6),
          () => at(v.w * 0.9, v.h * 0.4),
          () => at(v.w / 2, v.h * 0.3),
        ];
        const out = { opens: [], sizes: [], shown: [], animals: [], extra: [] };
        for (let n = 0; n < 6; n++) {
          await kit.until(() => !g.busy && g.photos === n && g.actors.length === 1, 15000);
          await kit.sleep(250);
          const a = g.actors[0];
          const b = a.getBounds();
          out.sizes.push(Math.min(b.width, b.height) / g.cast.worldTransform.a);
          out.shown.push(g.actors.length);
          out.animals.push(a.sighting.animal);
          const t0 = performance.now();
          spots[n]();
          if (n === 5) {
            await kit.until(() => neo.scene.finished, 20000);
            out.last = performance.now() - t0;
          } else {
            // A second touch while the photo flies and the next friend walks in takes no extra photo.
            await kit.sleep(300);
            at(v.w * 0.5, v.h * 0.85);
            await kit.until(() => g.photos === n + 1 && !g.busy, 15000);
            out.opens.push(performance.now() - t0);
            out.extra.push(g.photos);
          }
        }
        out.cards = g.album.children.length;
        out.misses = g.misses;
        out.hints = g.hints;
        return out;
      });
      if (big.sizes.some((s) => s < 200)) throw new Error(`Big friend too small: ${JSON.stringify(big)}`);
      if (big.shown.some((n) => n !== 1)) throw new Error(`More than one friend: ${JSON.stringify(big)}`);
      if (new Set(big.animals).size !== 6) throw new Error(`Friends repeat: ${JSON.stringify(big)}`);
      if (big.extra.some((p, i) => p !== i + 1))
        throw new Error(`A between touch took a photo: ${JSON.stringify(big)}`);
      if (big.opens.some((t) => t > 2500))
        throw new Error(`The click held the next friend: ${JSON.stringify(big)}`);
      if (!(big.last >= 4000)) throw new Error(`The last click was cut: ${JSON.stringify(big)}`);
      if (big.cards !== 6 || big.misses || big.hints)
        throw new Error(`Photo Safari big not free: ${JSON.stringify(big)}`);
      await screenshot('photo-safari-13-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await finished('photo-safari');
      assert.deepEqual(await score('photo-safari'), [0, 0]);
      log(
        `Photo Safari 13: six big friends photographed by touches anywhere, next in ${big.opens
          .map(Math.round)
          .join(
            '/',
          )} ms under 4 s clicks, sizes ${big.sizes.map(Math.round).join('/')}, the last heard out, no misses`,
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
    if (!only || only === 'monstersbig') {
      // Word Monsters level 9 (lap): one big monster; a touch anywhere (sky, grass, the monster, beside it) makes it say
      // its sound under a 4 s line, its picture stays on the shelf and the next monster wakes; a touch while it wakes
      // only wiggles it; six different letters leave six pictures, nothing is a miss, and the last sound is heard out.
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);
      await launch('word-monsters', 9);
      await stretch(['sound.*']);
      await page.waitForTimeout(600);
      await screenshot('word-monsters-9-start-portrait');
      const big = await page.evaluate(async () => {
        const g = neo.scene.game;
        if (!g.plan.big || g.plan.rounds !== 6) throw new Error('Word Monsters big plan');
        const v = g.view;
        const at = (x, y) => {
          const p = g.crowd.toGlobal({ x, y });
          kit.tap(p.x, p.y);
        };
        const spots = [
          () => at(v.w * 0.1, v.h * 0.3),
          () => at(v.w * 0.85, v.h * 0.92),
          () => at(g.monsters[0].x, g.monsters[0].y),
          () => at(v.w * 0.2, v.h * 0.6),
          () => at(v.w * 0.9, v.h * 0.45),
          () => at(v.w / 2, v.h * 0.35),
        ];
        const out = { opens: [], sizes: [], shown: [], letters: [], extra: [] };
        for (let n = 0; n < 6; n++) {
          await kit.until(() => !g.busy && g.taps === n && g.monsters.length === 1, 15000);
          await kit.sleep(250);
          const m = g.monsters[0];
          const b = m.getBounds();
          out.sizes.push(Math.min(b.width, b.height) / g.crowd.worldTransform.a);
          out.shown.push(g.monsters.filter((x) => !x.destroyed).length);
          out.letters.push(m.letter);
          const t0 = performance.now();
          spots[n]();
          if (n === 5) {
            await kit.until(() => neo.scene.finished, 20000);
            out.last = performance.now() - t0;
          } else {
            // A second touch while the picture flies and the next monster wakes counts no extra monster.
            await kit.sleep(300);
            at(v.w * 0.5, v.h * 0.85);
            await kit.until(() => g.taps === n + 1 && !g.busy, 15000);
            out.opens.push(performance.now() - t0);
            out.extra.push(g.taps);
          }
        }
        out.pictures = g.shelf.children.length;
        out.misses = g.misses;
        out.hints = g.hints;
        return out;
      });
      if (big.sizes.some((s) => s < 250)) throw new Error(`Big monster too small: ${JSON.stringify(big)}`);
      if (big.shown.some((n) => n !== 1)) throw new Error(`More than one monster: ${JSON.stringify(big)}`);
      if (new Set(big.letters).size !== 6) throw new Error(`Letters repeat: ${JSON.stringify(big)}`);
      if (big.extra.some((t, i) => t !== i + 1))
        throw new Error(`A between touch woke a monster: ${JSON.stringify(big)}`);
      if (big.opens.some((t) => t > 2500))
        throw new Error(`The sound held the next monster: ${JSON.stringify(big)}`);
      if (!(big.last >= 4000)) throw new Error(`The last sound was cut: ${JSON.stringify(big)}`);
      if (big.pictures !== 6 || big.misses || big.hints)
        throw new Error(`Word Monsters big not free: ${JSON.stringify(big)}`);
      await screenshot('word-monsters-9-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await finished('word-monsters');
      assert.deepEqual(await score('word-monsters'), [0, 0]);
      log(
        `Word Monsters 9: six big monsters woken by touches anywhere, next in ${big.opens
          .map(Math.round)
          .join(
            '/',
          )} ms under 4 s sounds, sizes ${big.sizes.map(Math.round).join('/')}, six pictures kept, the last heard out, no misses`,
      );
    }

    if (!only || only === 'gluebig') {
      // Word Glue level 4 (lap): one big picture; a touch anywhere (sky, grass, the picture, beside it) flies its
      // partner in under a 4 s join line, the new thing goes to the shelf and the next big picture rolls in; a touch
      // during a join only hops the picture; five things on the shelf, nothing counted, and the last line heard out.
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);
      await launch('word-glue', 4);
      await stretch(['wordglue.join']);
      await page.waitForTimeout(600);
      await screenshot('word-glue-4-start-portrait');
      const big = await page.evaluate(async () => {
        const g = neo.scene.game;
        if (!g.big || g.s.round.asks.length !== 5) throw new Error('Word Glue big plan');
        const v = g.view;
        const at = (x, y) => {
          const p = g.touchLayer.toGlobal({ x, y });
          kit.tap(p.x, p.y);
        };
        const spots = [
          () => at(v.w * 0.1, v.h * 0.3),
          () => at(v.w * 0.85, v.h * 0.92),
          () => at(g.cards[0].node.x, g.cards[0].node.y),
          () => at(v.w * 0.2, v.h * 0.6),
          () => at(v.w / 2, v.h * 0.35),
        ];
        const out = { opens: [], sizes: [], words: [], extra: [] };
        for (let n = 0; n < 5; n++) {
          await kit.until(() => !g.busy && g.s.index === n, 15000);
          await kit.sleep(250);
          const b = g.cards[0].node.getBounds();
          out.sizes.push(Math.min(b.width, b.height) / g.touchLayer.worldTransform.a);
          out.words.push(g.s.round.asks[n].entry.word);
          const t0 = performance.now();
          spots[n]();
          if (n === 4) {
            await kit.until(() => neo.scene.finished, 20000);
            out.last = performance.now() - t0;
          } else {
            // A second touch during the join joins nothing more.
            await kit.sleep(300);
            at(v.w * 0.5, v.h * 0.85);
            await kit.until(() => g.s.index === n + 1 && !g.busy, 15000);
            out.opens.push(performance.now() - t0);
            out.extra.push(g.s.index);
          }
        }
        out.shelf = g.shelf.length;
        out.misses = g.s.misses;
        out.hints = g.s.hints;
        return out;
      });
      if (big.sizes.some((s) => s < 250)) throw new Error(`Big picture too small: ${JSON.stringify(big)}`);
      if (new Set(big.words).size !== 5) throw new Error(`Things repeat: ${JSON.stringify(big)}`);
      if (big.extra.some((t, i) => t !== i + 1))
        throw new Error(`A between touch joined a picture: ${JSON.stringify(big)}`);
      // The join itself takes about 2.2 s (fly in, show, shelf, roll in); under the 4 s line it must not wait for it.
      if (big.opens.some((t) => t > 3500))
        throw new Error(`The join line held the next picture: ${JSON.stringify(big)}`);
      if (!(big.last >= 4000)) throw new Error(`The last join was cut: ${JSON.stringify(big)}`);
      if (big.shelf !== 5 || big.misses || big.hints)
        throw new Error(`Word Glue big not free: ${JSON.stringify(big)}`);
      await screenshot('word-glue-4-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await finished('word-glue');
      assert.deepEqual(await score('word-glue'), [0, 0]);
      log(
        `Word Glue 4: five big pictures joined by touches anywhere, next in ${big.opens
          .map(Math.round)
          .join(
            '/',
          )} ms under 4 s join lines, sizes ${big.sizes.map(Math.round).join('/')}, five things on the shelf, the last heard out, nothing counted`,
      );
    }

    if (!only || only === 'pond') {
      // Level 3 (words and phrases), a couch game: a typed word's `pt.said` starts and the next bubble opens at once.
      await page.evaluate(() =>
        localStorage.setItem(
          'neo.couch.v1',
          JSON.stringify({
            version: 2,
            trips: 30,
            stickers: {},
            seen: ['pond-typing'],
            party: {
              seed: 4242,
              mode: 'together',
              reroll: 0,
              turn: null,
              selected: 'pond-typing',
              rounds: [],
            },
          }),
        ),
      );
      await page.reload();
      await ready();
      await chooserEnter();
      await page.waitForFunction(() => neo.scene.screen === 'menu');
      await page.evaluate(async () => {
        const info = (await import('/src/couch/catalog.ts')).COUCH_INFO['pond-typing'];
        info.level = () => 3;
        // A laptop with its keyboard: the typing game is offered there, not on a TV.
        neo.scene.couch.data.settings.place = 'laptop';
        neo.scene.couch.data.party.selected = 'pond-typing';
        neo.scene.couch.save();
      });
      await page.waitForTimeout(450);
      await page.getByRole('button', { name: /^Resume /, exact: false }).click();
      await page.waitForFunction(() => !neo.switching && ['intro', 'game'].includes(neo.scene.screen));
      if ((await page.evaluate(() => neo.scene.screen)) === 'intro') {
        await page.waitForTimeout(450);
        await page.getByRole('button', { name: 'Play', exact: true }).click();
      }
      await page.waitForFunction(
        () => !neo.switching && neo.scene.screen === 'game' && neo.scene.game?.typist,
      );
      await stretch(['pt.said']);
      const pops = await page.evaluate(async () => {
        const g = neo.scene.game;
        const out = [];
        const n = g.ponds[0].length;
        for (let b = 0; b < n; b++) {
          await kit.until(() => g.typist.bubble === b && !g.busy, 15000);
          if (b === 1) {
            // Her first key while the next word waits drops it (the bubble shows the word).
            g.press(g.typist.wanted);
            out.push({ early: { waiting: g.unread } });
          }
          if (b === 2) out.push({ guide: g.sayWaitingAsk(), waiting: g.unread });
          await kit.sleep(200);
          let t0 = 0;
          while (g.typist.bubble === b && !g.finished) {
            t0 = performance.now();
            g.press(g.typist.wanted);
            await kit.sleep(20);
          }
          if (b === n - 1) {
            await kit.until(() => g.finished, 20000);
            out.push({ last: performance.now() - t0 });
          } else {
            await kit.until(() => g.typist.bubble === b + 1 && !g.busy, 15000);
            out.push({ b, open: performance.now() - t0, waiting: g.unread });
          }
        }
        return { out, misses: g.typist.misses };
      });
      for (const o of pops.out) {
        if (o.open !== undefined && !(o.open < 1000 && o.waiting))
          throw new Error(`R4: a typed word's line held the next bubble: ${JSON.stringify(pops)}`);
        if (o.early && o.early.waiting) throw new Error(`R4: her first key left the word waiting`);
        if (o.guide !== undefined && (!o.guide || o.waiting))
          throw new Error(`R4: the guide did not read the waiting word`);
        if (o.last !== undefined && o.last < 4000)
          throw new Error(`R4: the last word was cut: ${JSON.stringify(pops)}`);
      }
      assert.equal(pops.misses, 0);
      assert.equal(errors.length, 0, errors.join('\n'));
      log(
        `Pond Typing 3 R4: next bubble open ${pops.out
          .filter((o) => o.open !== undefined)
          .map((o) => Math.round(o.open))
          .join(
            ', ',
          )} ms into a 4 s word, its read waiting; her first key dropped it; the guide read it; the last heard out`,
      );
    }

    if (!only || only === 'glue') {
      // Level 2 (make the word): `wordglue.join` starts and the shelf flight and the next ask follow at once.
      await launch('word-glue', 2);
      await stretch(['wordglue.join']);
      const asks = await page.evaluate(async () => {
        const g = neo.scene.game;
        const card = (k) => g.cards.find((c) => c.key === k).node;
        const out = [];
        const n = g.s.round.asks.length;
        for (let a = 0; a < n; a++) {
          await kit.until(() => g.s.index === a && !g.busy, 15000);
          if (a === 1) {
            // Her first touch while the ask waits says the ask, not the picture's word.
            kit.tapOn(g.cards[0].node);
            await kit.sleep(150);
            out.push({ early: { waiting: !!g.unasked, misses: g.s.misses } });
          }
          if (a === 2) out.push({ guide: g.sayWaitingAsk(), waiting: !!g.unasked });
          await kit.sleep(300);
          const ask = g.s.round.asks[a].entry;
          await kit.dragTo(card(ask.first), card(ask.second).getGlobalPosition());
          const t0 = performance.now();
          if (a === n - 1) {
            await kit.until(() => neo.scene.finished, 20000);
            out.push({ last: performance.now() - t0 });
          } else {
            await kit.until(() => g.s.index === a + 1 && !g.busy, 15000);
            out.push({ a, open: performance.now() - t0, waiting: !!g.unasked });
          }
        }
        return out;
      });
      for (const o of asks) {
        if (o.open !== undefined && !(o.open < 4000 && o.waiting))
          throw new Error(`R4: a join held the next ask: ${JSON.stringify(asks)}`);
        if (o.early && (o.early.waiting || o.early.misses !== 0))
          throw new Error(`R4: her first touch left the ask unsaid: ${JSON.stringify(asks)}`);
        if (o.guide !== undefined && (!o.guide || o.waiting))
          throw new Error(`R4: the guide did not say the waiting ask`);
        if (o.last !== undefined && o.last < 4000)
          throw new Error(`R4: the last join was cut: ${JSON.stringify(asks)}`);
      }
      await finished('word-glue');
      assert.deepEqual(await score('word-glue'), [0, 0]);
      log(
        `Word Glue 2 R4: next ask open ${asks
          .filter((o) => o.open !== undefined)
          .map((o) => Math.round(o.open))
          .join(
            ', ',
          )} ms into a 4 s join, its ask waiting; her first touch said it; the guide said it; the last heard out`,
      );
    }

    if (!only || only === 'owl') {
      // Level 1 (one owl): her card's `owl.color` starts and the stone tap opens at once.
      await launch('owl-walk', 1);
      await stretch(['owl.color']);
      const turns = await page.evaluate(async () => {
        const g = neo.scene.game;
        const out = [];
        for (let t = 0; t < 20 && !g.finished; t++) {
          await kit.until(() => g.finished || (!g.busy && !g.card && g.turn === 'child'), 15000);
          if (g.finished) break;
          const t0 = performance.now();
          kit.tapOn(g.deck);
          await kit.until(() => !g.busy && g.card, 15000);
          const open = performance.now() - t0;
          const waiting = !!g.unasked;
          // Where she would tap, read past the waiting instruction.
          const u = g.unasked;
          g.unasked = null;
          const intent = g.autotouch();
          g.unasked = u;
          let guide;
          if (t % 2 === 0) guide = g.sayWaitingAsk();
          kit.tapOn(intent.tap.on, intent.tap.x ?? 0, intent.tap.y ?? 0);
          await kit.sleep(100);
          out.push({ t, open, waiting, guide, after: !!g.unasked });
          await kit.until(() => g.finished || !g.card, 15000);
        }
        await kit.until(() => neo.scene.finished, 30000);
        return { out, misses: g.misses };
      });
      for (const o of turns.out) {
        if (!(o.open < 1000 && o.waiting) || o.after || (o.guide !== undefined && !o.guide))
          throw new Error(`R4: a card's colour held the stone tap: ${JSON.stringify(turns)}`);
      }
      await finished('owl-walk');
      assert.deepEqual(await score('owl-walk'), [0, 0]);
      log(
        `Owl Walk 1 R4: ${turns.out.length} cards, stone tap open ${turns.out
          .map((o) => Math.round(o.open))
          .join(', ')} ms into a 4 s colour, its instruction waiting; the guide said it; her tap dropped it`,
      );
    }
  }
  return { groveCutLines };
}
