import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function ruleMachinePlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('rule-machine').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () => page.evaluate(() => neo.scene.game.state);
    const until = async (fn, arg) => page.waitForFunction(fn, arg, { timeout: 40000 });
    // The pads are built when the question opens; hit-testing uses the last frame, so let them render before a tap.
    const askOpen = async () => {
      await until(() => neo.scene.finished || neo.scene.game.state.phase === 'predict');
      await page.waitForTimeout(250);
    };
    const tapPad = async (i) => {
      await page.evaluate((i) => kit.tapOn(neo.scene.game.padNodes[i]), i);
      await page.waitForTimeout(250);
    };
    // R4: verify the tray or pads open while the spoken result is still pending.
    const stretchFeedback = (prefix) =>
      page.evaluate((prefix) => {
        const g = neo.scene.game;
        const say = g.ctx.say.bind(g.ctx);
        g.stretched = 'waiting';
        g.ctx.say = (id, vars) => {
          const spoken = say(id, vars);
          if (!id.startsWith(prefix) || g.stretched !== 'waiting') return spoken;
          g.stretched = 'playing';
          return Promise.all([spoken, kit.sleep(4000)]).then(() => {
            g.stretched = 'done';
          });
        };
      }, prefix);
    const feedbackStillPlaying = async (move) =>
      assert.equal(await page.evaluate(() => neo.scene.game.stretched), 'playing', move);
    const wrongOf = (s) => [0, 1, 2].find((i) => i !== s.right);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    // RM_LEVELS=3,4 plays only those levels (default all six).
    const only = (process.env.RM_LEVELS ?? '1,2,3,4,5,6').split(',').map(Number);

    async function levelsOneTwo() {
      // Level 1 (pre-K): three walkers go through by themselves; the first prediction is free even when wrong, the second
      // counts: two wrong pictures (two misses, the glow, one hint), then the right one. The second machine goes straight.
      await launch('rule-machine', 1, 'Mia', 'prek');
      await askOpen();
      let s = await state();
      assert.equal(s.rows.length, 3, 'three walkers made three rows');
      assert.equal(s.counted, false);
      await tapPad(wrongOf(s));
      s = await state();
      assert.deepEqual([s.misses, s.hints], [0, 0], 'the first guess on a new machine is free');
      await until(() => neo.scene.game.state.phase === 'predict' && neo.scene.game.state.asked === 1);
      s = await state();
      assert.equal(s.counted, true);
      await tapPad(wrongOf(s));
      s = await state();
      assert.deepEqual(
        [s.misses, s.hints, s.glowing, s.phase],
        [1, 0, false, 'predict'],
        'a counted wrong: a miss, the pictures stay',
      );
      await tapPad(wrongOf(s));
      s = await state();
      assert.deepEqual(
        [s.misses, s.hints, s.glowing],
        [2, 1, true],
        'the second wrong lights the glow: one hint',
      );
      await screenshot('rule-machine-1-glow');
      await tapPad(s.right);
      await until(() => neo.scene.finished || neo.scene.game.state.machine === 1);
      for (let k = 0; k < 2; k++) {
        await askOpen();
        s = await state();
        await tapPad(s.right);
        await until(
          (k) =>
            neo.scene.finished || neo.scene.game.state.asked > k || neo.scene.game.state.phase !== 'predict',
          k,
        );
        await page.waitForTimeout(200);
      }
      await finished('rule-machine');
      assert.deepEqual(await score(), [2, 1], 'level 1 saved 2 misses, 1 hint');

      // Level 2 (school), portrait: send four cars to each machine; one wrong pad after two rows (one miss), the rest right.
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(600);
      await launch('rule-machine', 2, 'Mia', 'school');
      let wrongDone = false;
      for (let m = 0; m < 2; m++) {
        for (let k = 0; k < 4; k++) {
          await until(() => neo.scene.game.state.phase === 'feed');
          s = await state();
          const slot = [0, 1, 2, 3, 4].find((i) => !s.fed.includes(i));
          await page.evaluate((slot) => kit.tapOn(neo.scene.game.cars[slot], 0, -40), slot);
          await askOpen();
          s = await state();
          assert.equal(s.options[s.right], s.tray[slot] + s.rule.b, 'the right pad is what the rule gives');
          if (m === 0 && k === 2 && !wrongDone) {
            assert.equal(s.counted, true, 'two rows on the table: the third prediction counts');
            await screenshot('rule-machine-2-portrait');
            await tapPad(wrongOf(s));
            s = await state();
            assert.deepEqual(
              [s.misses, s.hints, s.phase],
              [1, 0, 'predict'],
              'one wrong pad: a miss, the pads stay',
            );
            wrongDone = true;
          }
          await tapPad(s.right);
          await until(
            ([n, mm]) =>
              neo.scene.finished || neo.scene.game.state.rows.length > n || neo.scene.game.state.machine > mm,
            [s.rows.length, m],
          );
        }
      }
      await finished('rule-machine');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
      assert.deepEqual(await score(), [1, 0], 'level 2 saved 1 miss, 0 hints');
      log(
        'Rule Machine 1 and 2: level 1 a free first guess, two counted wrongs and the glow (2/1); portrait level 2 one wrong pad after two rows (1/0); passed',
      );
    }

    const apply = (r, n) => r.a * n + r.b;
    const fitsRows = (r, rows) => rows.every((row) => apply(r, row.in) === row.out);
    const tapCard = async (i) => {
      await page.evaluate((i) => kit.tapOn(neo.scene.game.shelfNodes[i]), i);
      await page.waitForTimeout(250);
    };
    const feed = async (slot) => {
      await page.evaluate((slot) => kit.tapOn(neo.scene.game.cars[slot], 0, -40), slot);
    };
    const unfed = (s) => [0, 1, 2, 3, 4].filter((i) => !s.fed.includes(i));

    // Level 3: three cars with right pads (the window shows the change), then the shelf: one wrong card (a miss, the
    // newest row breaks it), the right card hangs, one more car. The second machine goes straight. 1 miss, 0 hints.
    async function levelThree() {
      await launch('rule-machine', 3, 'Mia', 'school');
      for (let m = 0; m < 2; m++) {
        for (let k = 0; k < 3; k++) {
          await until(() => neo.scene.game.state.phase === 'feed');
          let s = await state();
          await feed(unfed(s)[0]);
          await askOpen();
          s = await state();
          assert.equal(
            s.options[s.right],
            apply(s.rule, s.tray[s.carSlot]),
            'the right pad is what the rule gives',
          );
          await tapPad(s.right);
          if (k === 2) break;
          await until(
            ([n, mm]) =>
              neo.scene.finished || neo.scene.game.state.rows.length > n || neo.scene.game.state.machine > mm,
            [s.rows.length, m],
          );
        }
        await until(() => neo.scene.game.state.phase === 'card');
        await page.waitForTimeout(250);
        let s = await state();
        assert.equal(s.rows.length, 3, 'the shelf comes down after three rows');
        assert.equal(s.open, 1, 'three rows leave one card');
        if (m === 0) {
          const wrong = [0, 1, 2].find((i) => i !== s.rightCard);
          await tapCard(wrong);
          s = await state();
          assert.deepEqual(
            [s.misses, s.hints, s.phase, s.hung],
            [1, 0, 'card', false],
            'a wrong card: one miss, the shelf stays',
          );
          await screenshot('rule-machine-3-shelf');
        }
        if (m === 0) await stretchFeedback('rm.card.');
        await tapCard(s.rightCard);
        s = await state();
        assert.equal(s.hung, true, 'the right card hangs on the machine');
        await until(() => neo.scene.game.state.phase === 'feed');
        if (m === 0) await feedbackStillPlaying('the tray opens during the card name');
        s = await state();
        await feed(unfed(s)[0]);
        await askOpen();
        s = await state();
        assert.equal(s.counted, true);
        await tapPad(s.right);
        await until((mm) => neo.scene.finished || neo.scene.game.state.machine > mm, m);
      }
      await finished('rule-machine');
      assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');
      log('Rule Machine 3: a wrong card after three rows (1 miss), the card hangs, one more car; passed');
    }

    // Level 4, portrait: a card tap before any car (never judged), a trap car first (two cards still fit, a tap counts
    // nothing), a card that row rules out (one miss), Peek (the machine's hint), the settling car, the card, the last pad.
    async function levelFour() {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(600);
      await launch('rule-machine', 4, 'Mia', 'school');
      for (let m = 0; m < 2; m++) {
        await until(() => neo.scene.game.state.phase === 'feed');
        await page.waitForTimeout(250);
        let s = await state();
        assert.equal(s.cardOpen, true, 'the shelf is out from the start');
        if (m === 0) {
          await tapCard(s.rightCard);
          s = await state();
          assert.deepEqual([s.misses, s.hung], [0, false], 'a card before any car is not judged');
          const trap = unfed(s).find(
            (i) => s.shelf.filter((c) => apply(c, s.tray[i]) === apply(s.rule, s.tray[i])).length === 2,
          );
          assert.notEqual(trap, undefined, 'the tray holds a trap car');
          await feed(trap);
          await until(() => neo.scene.game.state.phase === 'feed' && neo.scene.game.state.rows.length === 1);
          await page.waitForTimeout(250);
          s = await state();
          assert.equal(s.open, 2, 'a trap car leaves two cards');
          await screenshot('rule-machine-4-portrait');
          const stillOpen = [0, 1, 2].find((i) => i !== s.rightCard && fitsRows(s.shelf[i], s.rows));
          await tapCard(stillOpen);
          s = await state();
          assert.deepEqual(
            [s.misses, s.hints, s.hung],
            [0, 0, false],
            'a card that still fits counts nothing',
          );
          const ruledOut = [0, 1, 2].find((i) => !fitsRows(s.shelf[i], s.rows));
          await tapCard(ruledOut);
          s = await state();
          assert.deepEqual([s.misses, s.hints], [1, 0], 'a card the table rules out: one miss');
          await page.evaluate(() => kit.tapOn(neo.scene.game.peekNode));
          await page.waitForTimeout(250);
          s = await state();
          assert.deepEqual([s.hints, s.peeking], [1, true], "Peek lifts the lid: the machine's hint");
        }
        s = await state();
        assert.notEqual(s.settling, null, 'a car can tell the cards apart');
        await feed(s.settling);
        await until(
          (n) => neo.scene.game.state.phase === 'feed' && neo.scene.game.state.rows.length === n,
          s.rows.length + 1,
        );
        await page.waitForTimeout(250);
        s = await state();
        assert.deepEqual([s.open, s.peeking], [1, false], 'one card left; the lid is back down');
        if (m === 0) await stretchFeedback('rm.card.');
        await tapCard(s.rightCard);
        await askOpen();
        if (m === 0) await feedbackStillPlaying('the pads open during the card name');
        s = await state();
        assert.deepEqual([s.hung, s.counted], [true, true], 'the card hangs; the last prediction counts');
        await tapPad(s.right);
        await until((mm) => neo.scene.finished || neo.scene.game.state.machine > mm, m);
      }
      await finished('rule-machine');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
      assert.deepEqual(await score(), [1, 1], 'level 4 saved 1 miss, 1 hint');
      log(
        'Rule Machine 4 portrait: unjudged early and still-open taps, a ruled-out card (1 miss), Peek (1 hint), the settling car, the card, the last pad; passed',
      );
    }

    // Level 5, portrait: each machine wears its card and a car has already come out. On the first wanted car two wrong
    // cars run (two misses, each written into the table, the second lights the glow: one hint), then the glowing car;
    // the other three wanted cars go straight. 2 misses, 1 hint.
    async function levelFive() {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(600);
      await launch('rule-machine', 5, 'Mia', 'school');
      const feedOpen = async () => {
        await until(() => neo.scene.finished || neo.scene.game.state.phase === 'feed');
        await page.waitForTimeout(300);
      };
      for (let m = 0; m < 2; m++) {
        for (let k = 0; k < 2; k++) {
          await feedOpen();
          let s = await state();
          assert.deepEqual(
            [s.machine, s.asked, s.tray.length],
            [m, k, 5],
            'a fresh tray of five for each wanted car',
          );
          assert.equal(apply(s.rule, s.tray[s.answerSlot]), s.wanted, 'the answer car makes the wanted car');
          assert.equal(
            s.tray.filter((n) => apply(s.rule, n) === s.wanted).length,
            1,
            'exactly one tray car is right',
          );
          if (m === 0 && k === 0) {
            const wrong = [0, 1, 2, 3, 4].filter((i) => i !== s.answerSlot);
            const rows = s.rows.length;
            await feed(wrong[0]);
            await until(
              (n) => neo.scene.game.state.phase === 'feed' && neo.scene.game.state.rows.length > n,
              rows,
            );
            await page.waitForTimeout(300);
            s = await state();
            assert.deepEqual(
              [s.misses, s.hints, s.glowing, s.asked, s.fed.length],
              [1, 0, false, 0, 1],
              'a wrong car runs: one miss, a row in the table, the question stays open',
            );
            assert.equal(s.rows.at(-1).in, s.tray[wrong[0]], 'the wrong car is written into the table');
            await feed(wrong[1]);
            await until(
              (n) => neo.scene.game.state.phase === 'feed' && neo.scene.game.state.rows.length > n,
              rows + 1,
            );
            await page.waitForTimeout(300);
            s = await state();
            assert.deepEqual(
              [s.misses, s.hints, s.glowing],
              [2, 1, true],
              'the second wrong car lights the glow on the right car: one hint',
            );
            await page.waitForTimeout(400);
            await screenshot('rule-machine-5-portrait');
          }
          const before = s.rows.length;
          if (m === 0 && k === 0) await stretchFeedback('rm.back.right');
          await feed(s.answerSlot);
          await until(
            ([n, mm, kk]) =>
              neo.scene.finished ||
              neo.scene.game.state.machine > mm ||
              (neo.scene.game.state.rows.length > n && neo.scene.game.state.asked > kk),
            [before, m, k],
          );
          if (m === 0 && k === 0) await feedbackStillPlaying('the next wanted car opens during the result');
        }
      }
      await finished('rule-machine');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
      assert.deepEqual(await score(), [2, 1], 'level 5 saved 2 misses, 1 hint');
      log(
        'Rule Machine 5 portrait: two wrong cars on the first wanted car (2 misses, rows written, the glow, 1 hint), then four right cars; passed',
      );
    }

    // Level 6, portrait: two machines in a row. On the first pair: a wrong pad (one miss, the car stops on the link),
    // the right pad, then the build: the watched order first (free), a second pair that does not fit (one miss), a
    // third (a miss and the glow: one hint), then the glow followed to a fitting pair. The second pair goes straight.
    // 3 misses, 1 hint.
    async function levelSix() {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(600);
      await launch('rule-machine', 6, 'Mia', 'school');
      const phase = async (p) => {
        await until((p) => neo.scene.finished || neo.scene.game.state.phase === p, p);
        await page.waitForTimeout(350);
      };
      const tapShelfCard = async (i) => {
        await page.evaluate((i) => kit.tapOn(neo.scene.game.cardNodes[i]), i);
        await page.waitForTimeout(350);
      };
      const ran = async (n) => {
        await until((n) => neo.scene.game.state.phase === 'build' && neo.scene.game.state.runs === n, n);
        await page.waitForTimeout(350);
      };
      const fits = (s, i, j) => s.fitting.some((f) => f[0] === i && f[1] === j);
      for (let pair = 0; pair < 2; pair++) {
        await phase('watch');
        let s = await state();
        assert.deepEqual([s.machine, s.rows.length], [pair, 0], 'a new pair starts with an empty table');
        await page.evaluate(() => kit.tapOn(neo.scene.game.hopperHit));
        await phase('predict');
        s = await state();
        assert.deepEqual(s.rows, [{ in: s.n, out: s.watched }], 'the watched car is the first row');
        assert.equal(
          s.options[s.right],
          apply(s.second, apply(s.first, s.m)),
          'the right pad is what the two machines make',
        );
        assert.notEqual(s.watched, s.target, 'the other order makes something else');
        if (pair === 0) {
          await tapPad(wrongOf(s));
          await until(() => neo.scene.game.state.phase === 'predict' && neo.scene.game.state.held);
          await page.waitForTimeout(300);
          s = await state();
          assert.deepEqual(
            [s.misses, s.hints, s.rows.length],
            [1, 0, 1],
            'a wrong pad: one miss, the car waits on the link, the pads stay',
          );
        }
        await tapPad(s.right);
        await phase('build');
        s = await state();
        assert.deepEqual([s.rows.length, s.slots, s.runs], [2, [null, null], 0], 'the shelf comes down');
        assert.equal(s.shelf.length, 4);
        assert.ok(fits(s, s.reversed[0], s.reversed[1]), 'the watched pair reversed fits');
        if (pair === 0) {
          const [w0, w1] = [s.reversed[1], s.reversed[0]];
          assert.ok(!fits(s, w0, w1), 'the watched order does not fit');
          await tapShelfCard(w0);
          await tapShelfCard(w1);
          await ran(1);
          s = await state();
          assert.deepEqual(
            [s.misses, s.hints, s.slots, s.rows.at(-1).out],
            [1, 0, [w0, w1], s.watched],
            'the first pair run is free, stays in its slots, and its row is written',
          );
          // A second pair that does not fit: another second card if one does not fit, else the same one again.
          const other = [0, 1, 2, 3].find((c) => c !== w0 && c !== w1 && !fits(s, w0, c)) ?? w1;
          await tapShelfCard(w1);
          s = await state();
          assert.deepEqual(s.slots, [w0, null], 'a tapped slot card goes back to the shelf');
          await tapShelfCard(other);
          await ran(2);
          s = await state();
          assert.deepEqual(
            [s.misses, s.hints, s.glowing],
            [2, 0, false],
            'the second pair run counts one miss',
          );
          await tapShelfCard(other);
          await tapShelfCard(other);
          await ran(3);
          s = await state();
          assert.deepEqual(
            [s.misses, s.hints, s.glowing],
            [3, 1, true],
            'the third lights the glow: one hint',
          );
          assert.deepEqual(s.next, { kind: 'lift', slot: 1 }, 'the glow starts on the second slot');
          await page.waitForTimeout(400);
          await screenshot('rule-machine-6-portrait');
        }
        // Follow the help to a fitting pair.
        for (let k = 0; k < 4; k++) {
          s = await state();
          if (s.phase !== 'build' || !s.next) break;
          await tapShelfCard(s.next.kind === 'lift' ? s.slots[s.next.slot] : s.next.card);
        }
        await until((p) => neo.scene.finished || neo.scene.game.state.machine > p, pair);
      }
      await finished('rule-machine');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
      assert.deepEqual(await score(), [3, 1], 'level 6 saved 3 misses, 1 hint');
      log(
        'Rule Machine 6 portrait: a wrong pad (1 miss), the watched order free, two more pairs (2 misses, the glow, 1 hint), the help followed to a fitting pair, then a straight pair; passed',
      );
    }

    if (only.includes(1) || only.includes(2)) await levelsOneTwo();
    if (only.includes(3)) await levelThree();
    if (only.includes(4)) await levelFour();
    if (only.includes(5)) await levelFive();
    if (only.includes(6)) await levelSix();
    log(`Rule Machine ${only.join(', ')}: passed`);
  }
  return { ruleMachinePlay };
}
