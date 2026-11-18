import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  /** U7 R4: times `ids` from their start to when input opens (`!busy`) and to the line's end. */
  const timeLines = (ids) =>
    page.evaluate((ids) => {
      const g = neo.scene.game,
        say = g.ctx.say.bind(g.ctx);
      window.spinR4 = [];
      g.ctx.say = (id, vars) => {
        const line = say(id, vars);
        if (ids.includes(id)) {
          const t = performance.now(),
            o = { id };
          spinR4.push(o);
          void line.then(() => (o.ends = performance.now() - t));
          void kit.until(() => g.finished || !g.busy, 8000).then(() => (o.opens = performance.now() - t));
        }
        return line;
      };
    }, ids);
  const assertTimed = async (name, least) => {
    const timed = await page.evaluate(() => spinR4);
    assert.ok(timed.length >= least, `R4: ${timed.length} ${name} lines timed`);
    const late = timed.filter((o) => o.ends !== undefined && o.opens >= o.ends && o.ends > 300);
    assert.equal(
      late.length,
      0,
      `R4: input waited for a line (${late.map((o) => `${o.id} ${Math.round(o.opens)}/${Math.round(o.ends)}`).join(', ')} ms)`,
    );
    log(`${name}: R4, ${timed.map((o) => `${o.id} opens ${Math.round(o.opens)} ms`).join(', ')}`);
  };
  async function spinnerFairPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('spinner-fair').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () => page.evaluate(() => neo.scene.game.state);
    const settle = async () => {
      await page.waitForTimeout(200);
      await page.waitForFunction(
        () => neo.scene.finished || (!neo.scene.game.spinning && !neo.scene.game.busy),
        null,
        { timeout: 40000 },
      );
      await page.waitForTimeout(120);
    };
    const tapSpinner = async (i) => {
      await page.evaluate((i) => kit.tapOn(neo.scene.game.spinners[i].node), i);
      await page.waitForTimeout(150);
    };
    const spinAll = async (i) => {
      const s = await state();
      for (let k = s.results.length; k < s.spins; k++) {
        await tapSpinner(i);
        await settle();
      }
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 1 (preschool): six spins she taps, each a block on the critter it landed on; no question, so no misses or hints.
    await launch('spinner-fair', 1, 'Mia', 'preschool');
    await settle();
    let s = await state();
    assert.equal(s.phase, 'spin');
    assert.equal(s.spins, 6);
    assert.equal(s.kinds.length, 3, 'three critters, three bars');
    await spinAll(0);
    await finished('spinner-fair');
    assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

    // Level 3 (school), portrait: a wrong pick (a miss), a second wrong pick (the glow, one hint), the better spinner, ten spins;
    // the second pick right away and ten spins. Spins never count.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('spinner-fair', 3, 'Mia', 'school');
    await settle();
    await timeLines(['sf.picked']);
    s = await state();
    assert.equal(s.phase, 'pick');
    const fav = (w) => w.filter((k) => k === s.favourite).length;
    assert.ok(
      fav(s.wheels[s.better]) - fav(s.wheels[1 - s.better]) >= 2,
      'the better spinner has at least two more wedges of the favourite',
    );
    await screenshot('spinner-fair-3-portrait');
    await tapSpinner(1 - s.better);
    await page.waitForTimeout(300);
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.glowing], [1, 0, false], 'one wrong pick: a miss, no glow');
    await page.waitForFunction(() => !neo.scene.game.busy);
    await tapSpinner(1 - s.better);
    await page.waitForFunction(() => neo.scene.game.state.glowing, null, { timeout: 15000 });
    s = await state();
    assert.deepEqual([s.misses, s.hints], [2, 1], 'the second wrong pick lights the glow: one hint');
    await screenshot('spinner-fair-3-glow-portrait');
    await tapSpinner(s.better);
    await settle();
    s = await state();
    assert.equal(s.phase, 'spin');
    assert.equal(s.picked, s.better);
    assert.equal(s.glowing, false);
    for (let k = 0; k < 9; k++) {
      await tapSpinner(s.picked);
      await settle();
    }
    await screenshot('spinner-fair-3-bars-portrait');
    await spinAll(s.picked);
    s = await state();
    assert.equal(s.set, 1, 'ten spins end the first pick');
    assert.deepEqual([s.misses, s.hints], [2, 1], 'the spins changed nothing in the score');
    await tapSpinner(s.better);
    await settle();
    s = await state();
    await spinAll(s.picked);
    await finished('spinner-fair');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [2, 1], 'level 3 saved 2 misses, 1 hint');
    await assertTimed('Spinner Fair 3', 2);
    log(
      'Spinner Fair 1 and 3: six spins (0/0); portrait level 3 two wrong picks (2/1, the glow), the better spinner and ten spins, the second pick straight; passed',
    );
  }
  /** Spinner Fair 4–5: a face on the wrong spinner (one miss, it slides back), then every face home and the showing spins; portrait
   * level 5 with a wrong fair, an uneven Check (two misses, the glow, one hint), wedges moved (one the wrong way first if it starts
   * 4–2), Check and the six-spin race, then the second race straight. */
  async function spinnerFairRacePlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('spinner-fair').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () => page.evaluate(() => neo.scene.game.state);
    const settle = async () => {
      await page.waitForTimeout(200);
      // The race's or even-up's ask, held back by a right answer's line (U7 R4), is waited for too.
      await page.waitForFunction(
        () =>
          neo.scene.finished ||
          (!neo.scene.game.spinning &&
            !neo.scene.game.busy &&
            !neo.scene.game.rebuild &&
            !neo.scene.game.unasked),
        null,
        { timeout: 40000 },
      );
      await page.waitForTimeout(150);
    };
    const dragCard = async (card, spinner) => {
      await page.evaluate(
        async ({ card, spinner }) => {
          const g = neo.scene.game,
            c = g.cards.find((x) => x.card === card),
            s = g.spinners[spinner].node.getGlobalPosition();
          await kit.dragTo(c.node, { x: s.x, y: s.y + 40 * neo.view.scale });
        },
        { card, spinner },
      );
      await page.waitForTimeout(500);
    };
    const press = async (b) => {
      await page.evaluate((b) => kit.tapOn(neo.scene.game.buttons[b]), b);
      await page.waitForTimeout(250);
    };
    /** Hand one wedge of `from` (0 or 1) to the other racer. */
    const hand = async (from) => {
      await page.evaluate(async (from) => {
        const g = neo.scene.game,
          kind = g.racers[from],
          p = g.pieces.filter((x) => x.kind === kind).at(from === 0 ? -1 : 0);
        await kit.dragTo(p.node, g.racerNodes[1 - from].getGlobalPosition());
      }, from);
      await settle();
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 4: one face on a spinner it does not fit, then every face where it fits.
    await launch('spinner-fair', 4, 'Mia', 'school');
    await settle();
    let s = await state();
    assert.equal(s.cards.length, 3);
    assert.deepEqual(
      [...s.fits].sort(),
      ['maybe', 'none', 'sure'],
      'one sure, one maybe and one no-way spinner',
    );
    const first = s.cards[0].card;
    const wrong = s.fits.findIndex((f) => f !== first);
    await dragCard(first, wrong);
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.cards[0].placed],
      [1, 0, null],
      'a face on a spinner it does not fit: one miss, back in the tray',
    );
    for (let set = 0; set < 2; set++) {
      await settle();
      s = await state();
      for (const c of s.cards) await dragCard(c.card, s.fits.indexOf(c.card));
      if (set === 0) {
        await page.waitForFunction(() => neo.scene.game.state.set === 1, null, { timeout: 30000 });
      }
    }
    await finished('spinner-fair');
    assert.deepEqual(await score(), [1, 0], 'level 4 saved 1 miss, 0 hints');

    // Level 5 upright: a wrong fair (a miss), unfair, an uneven Check (the second miss: the glow, one hint), wedges, Check, the race.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('spinner-fair', 5, 'Mia', 'school');
    await settle();
    await timeLines(['sf.fair', 'sf.unfair', 'sf.even-now']);
    s = await state();
    assert.equal(s.phase, 'ask');
    assert.equal(s.fair, false, 'race 1 starts unfair');
    await press('fair');
    await settle();
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.phase], [1, 0, 'ask'], 'a wrong fair: one miss');
    await press('unfair');
    await settle();
    assert.equal((await state()).phase, 'even');
    await press('check');
    await settle();
    await page.waitForFunction(() => neo.scene.game.state.glowing, null, { timeout: 15000 });
    s = await state();
    assert.deepEqual([s.misses, s.hints], [2, 1], 'an uneven Check is the second miss: the glow, one hint');
    const big = s.counts[0] > s.counts[1] ? 0 : 1;
    let moves = 0;
    if (s.counts[big] === 4) {
      await hand(1 - big);
      moves++;
      assert.deepEqual((await state()).counts[big], 5, 'a wedge the wrong way moves too, free');
    }
    await screenshot('spinner-fair-5-portrait');
    while (!(await state()).fair) {
      await hand(big);
      moves++;
    }
    assert.ok(moves >= 2, 'at least two wedge moves');
    s = await state();
    assert.deepEqual([s.counts, s.misses, s.hints], [[3, 3], 2, 1], 'moving wedges is never counted');
    await press('check');
    await settle();
    assert.equal((await state()).phase, 'race');
    for (let k = 0; k < 6; k++) {
      await page.evaluate(() => kit.tapOn(neo.scene.game.art.node));
      await settle();
    }
    await page.waitForFunction(() => neo.scene.game.state.set === 1, null, { timeout: 30000 });
    await settle();
    s = await state();
    await press(s.fair ? 'fair' : 'unfair');
    await settle();
    if (!s.fair) {
      const b2 = s.counts[0] > s.counts[1] ? 0 : 1;
      while (!(await state()).fair) await hand(b2);
      await press('check');
      await settle();
    }
    for (let k = 0; k < 6; k++) {
      await page.evaluate(() => kit.tapOn(neo.scene.game.art.node));
      await settle();
    }
    await finished('spinner-fair');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [2, 1], 'level 5 saved 2 misses, 1 hint');
    await assertTimed('Spinner Fair 5', 3);
    log(
      'Spinner Fair 4–5: a face on the wrong spinner (1/0) then all three; portrait level 5 wrong fair, uneven Check (2/1, the glow), wedges both ways, the race, second race straight; passed',
    );
  }
  /** Spinner Fair 6, upright: the three runs (12, 60, 240 spins), one wrong card (a miss), the right card and the 60-spin check;
   * the second wheel with two wrong cards (the glow, one hint). Spins, runs and the check never count. */
  async function spinnerFairSettlePlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('spinner-fair').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () => page.evaluate(() => neo.scene.game.state);
    const idle = async () => {
      await page.waitForTimeout(150);
      await page.waitForFunction(
        () => neo.scene.finished || (!neo.scene.game.spinning && !neo.scene.game.busy),
        null,
        { timeout: 40000 },
      );
      await page.waitForTimeout(120);
    };
    const tapCard = async (n) => {
      await page.evaluate((n) => {
        const g = neo.scene.game;
        kit.tapOn(g.cards[g.state.cards.indexOf(n)]);
      }, n);
      await page.waitForTimeout(300);
    };
    const runs = async () => {
      let s = await state();
      assert.deepEqual([s.phase, s.run, s.total], ['run', 0, 0]);
      assert.ok([1, 3, 5].includes(s.k), 'the favourite has 1, 3 or 5 wedges');
      assert.equal(s.wheels[0].filter((x) => x === s.favourite).length, s.k);
      assert.equal(s.right, 10 * s.k, 'the right card is ten for each wedge');
      const hidden = await page.evaluate(() => neo.scene.game.cards.every((c) => !c.visible));
      assert.ok(hidden, 'no answer cards during the runs');
      const totals = [];
      for (const target of ['art.node', 'fast', 'fast']) {
        const t = Date.now();
        await page.evaluate(
          (target) => kit.tapOn(target === 'fast' ? neo.scene.game.fast : neo.scene.game.art.node),
          target,
        );
        await idle();
        assert.ok(Date.now() - t < 6500, `a run took ${Date.now() - t} ms`);
        s = await state();
        totals.push(s.total);
        assert.ok(s.count >= 0 && s.count <= s.total);
      }
      assert.deepEqual(totals, [12, 60, 240], 'the runs stand at 12, 60 and 240 spins');
      assert.equal(s.phase, 'ask');
      return s;
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('spinner-fair', 6, 'Mia', 'school');
    await idle();
    let s = await runs();
    const share = s.count / s.total;
    log(
      `Spinner Fair 6: wheel 1 k=${s.k}, ${s.count} of 240 (${share.toFixed(3)} against ${(s.k / 6).toFixed(3)})`,
    );
    // The spinner takes no more spins at the question.
    await page.evaluate(() => kit.tapOn(neo.scene.game.art.node));
    await page.waitForTimeout(300);
    assert.equal((await state()).total, 240, 'no spin at the question');
    await screenshot('spinner-fair-6-portrait');
    await tapCard(s.cards.find((c) => c !== s.right));
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.glowing, s.phase], [1, 0, false, 'ask'], 'a wrong card: one miss');
    const first = s.k;
    await tapCard(s.right);
    await page.waitForFunction(() => neo.scene.game.state.set === 1 && !neo.scene.game.busy, null, {
      timeout: 40000,
    });
    s = await state();
    assert.deepEqual([s.misses, s.hints], [1, 0], 'the check run counted nothing');
    s = await runs();
    assert.notEqual(s.k, first, 'the second wheel has a different share');
    for (let i = 0; i < 2; i++) {
      await tapCard(s.cards.find((c) => c !== s.right));
      await page.waitForTimeout(400);
    }
    await page.waitForFunction(() => neo.scene.game.state.glowing, null, { timeout: 15000 });
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints],
      [3, 1],
      'the second wrong card on a wheel lights the glow: one hint',
    );
    await screenshot('spinner-fair-6-glow-portrait');
    await tapCard(s.right);
    await page.waitForFunction(() => neo.scene.game.state.checked !== null, null, { timeout: 20000 });
    s = await state();
    assert.equal(s.total, 60, 'the check run is sixty spins');
    log(
      `Spinner Fair 6: wheel 2 k=${s.k}, check run ${s.checked} of 60 (${Math.abs(s.checked - s.right) <= 10 ? 'about' : 'unusual'})`,
    );
    await finished('spinner-fair');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [3, 1], 'level 6 saved 3 misses, 1 hint');
    log(
      'Spinner Fair 6: upright, three runs to 240 spins on each wheel, one wrong card (1/0), the check run; two wrong cards on wheel 2 (3/1, the glow); passed',
    );
  }
  /** Spinner Fair 7, upright: twelve rolls (never counted), the grid building itself to 36 squares, one wrong card on each
   * question (two misses), a second wrong card on question two (the glow, one hint), and the journal entry filed. */
  async function spinnerFairDicePlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('spinner-fair').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () => page.evaluate(() => neo.scene.game.state);
    const ways = (sum) => 6 - Math.abs(sum - 7);
    const tapCard = async (n) => {
      await page.evaluate((n) => {
        const g = neo.scene.game;
        kit.tapOn(g.cards[g.state.cards.indexOf(n)]);
      }, n);
      await page.waitForTimeout(300);
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    const filed = () => page.evaluate(() => kit.store.data.journal.found.includes('spinner-fair:two-dice'));
    assert.equal(await filed(), false, 'the two-dice entry is not in the journal before the round');
    await launch('spinner-fair', 7, 'Mia', 'school');
    let s = await state();
    assert.deepEqual([s.level, s.phase, s.rolls.length, s.squares], [7, 'roll', 0, 0]);
    assert.deepEqual(s.cards, [], 'no cards during the rolls');
    for (let i = 1; i <= 12; i++) {
      await page.evaluate(() => kit.tapOn(neo.scene.game.tray));
      await page.waitForFunction((i) => neo.scene.game.state.rolls.length === i, i, { timeout: 8000 });
      if (i === 6) await screenshot('spinner-fair-7-rolls-portrait');
    }
    s = await state();
    assert.equal(s.rolls.length, 12);
    for (const [a, b] of s.rolls) assert.ok(a >= 1 && a <= 6 && b >= 1 && b <= 6, 'each die shows 1 to 6');
    assert.equal(
      s.tally.reduce((x, y) => x + y),
      12,
      'the roll bars hold twelve blocks',
    );
    assert.deepEqual([s.misses, s.hints], [0, 0], 'rolls are never counted');
    log(`Spinner Fair 7: rolls ${s.rolls.map(([a, b]) => a + b).join(' ')}`);
    // The grid builds itself; a tap on it changes nothing.
    await page.waitForFunction(() => neo.scene.game.state.squares >= 8, null, { timeout: 30000 });
    await page.evaluate(() => kit.tapOn(neo.scene.game.grid));
    await page.waitForFunction(() => neo.scene.game.state.phase === 'most' && !neo.scene.game.busy, null, {
      timeout: 60000,
    });
    s = await state();
    assert.deepEqual([s.squares, s.gridDone, s.rolls.length], [36, true, 12]);
    assert.equal(s.cards.length, 3);
    assert.ok(s.cards.includes(7), 'question one holds 7');
    assert.equal(s.right, 7, 'seven is the most likely sum');
    assert.deepEqual([s.misses, s.hints], [0, 0], 'a tap on the grid is not counted');
    await screenshot('spinner-fair-7-grid-portrait');
    await tapCard(s.cards.find((c) => c !== 7));
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.glowing, s.phase], [1, 0, false, 'most'], 'a wrong sum: one miss');
    await tapCard(7);
    await page.waitForFunction(() => neo.scene.game.state.phase === 'pair' && !neo.scene.game.busy, null, {
      timeout: 20000,
    });
    s = await state();
    assert.equal(s.cards.length, 2);
    assert.ok(!s.cards.includes(7), 'question two never holds 7');
    const [right, wrong] = ways(s.cards[0]) > ways(s.cards[1]) ? s.cards : [s.cards[1], s.cards[0]];
    assert.notEqual(ways(right), ways(wrong), 'never a tie');
    assert.equal(s.right, right, 'the right card has more squares');
    for (let i = 0; i < 2; i++) {
      await tapCard(wrong);
      await page.waitForTimeout(400);
    }
    await page.waitForFunction(() => neo.scene.game.state.glowing, null, { timeout: 15000 });
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints],
      [3, 1],
      'the second wrong card on a question lights the glow: one hint',
    );
    await page.waitForTimeout(300);
    await screenshot('spinner-fair-7-glow-portrait');
    // Turned on its side mid-question: the same question, cards and counts.
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await screenshot('spinner-fair-7-glow-landscape');
    const turned = await state();
    assert.deepEqual([turned.phase, turned.cards, turned.misses, turned.hints], ['pair', s.cards, 3, 1]);
    await tapCard(right);
    await finished('spinner-fair');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [3, 1], 'level 7 saved 3 misses, 1 hint');
    assert.equal(await filed(), true, 'the two-dice entry is filed in the journal');
    log(
      `Spinner Fair 7: upright, twelve rolls, the grid to 36 squares, a wrong card on each question and the glow on question two (${right} over ${wrong}; 3/1), the journal entry filed; passed`,
    );
  }
  async function spinnerFairTypicalPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('spinner-fair').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () => page.evaluate(() => neo.scene.game.state);
    const open = (phase, set) =>
      page.waitForFunction(
        ([phase, set]) => {
          const s = neo.scene.game.state;
          return s.set === set && phase.includes(s.phase) && !s.busy && !s.spinning;
        },
        [phase, set],
        { timeout: 30000 },
      );
    const spinSix = async () => {
      for (let i = 1; i <= 6; i++) {
        await page.evaluate(() => kit.tapOn(neo.scene.game.art.node));
        await page.waitForFunction((i) => neo.scene.game.state.spins.length === i, i, { timeout: 10000 });
      }
    };
    const tapCard = async (n) => {
      await page.evaluate((n) => {
        const g = neo.scene.game;
        kit.tapOn(g.cards[g.state.cards.indexOf(n)]);
      }, n);
      await page.waitForTimeout(300);
    };
    /** Drags the top block of tower `from` onto tower `to`'s column, as a finger would. */
    const moveBlock = async (from, to) => {
      const before = (await state()).towers;
      await page.evaluate(
        async ([from, to]) => {
          const g = neo.scene.game;
          const col = g.L.towers[to];
          await kit.dragTo(g.tops[from].node, g.towerLayer.toGlobal({ x: col.x, y: col.y }));
        },
        [from, to],
      );
      await page.waitForFunction((before) => neo.scene.game.state.towers.join() !== before.join(), before, {
        timeout: 8000,
      });
      await page.waitForTimeout(150);
    };
    const levelAll = async () => {
      let moves = 0;
      for (let s = await state(); s.phase === 'level'; s = await state()) {
        assert.ok(s.next, 'while levelling there is always a sure move');
        assert.ok(s.towers[s.next.to] < s.towers[s.next.from], 'the sure move never makes a tower taller');
        await moveBlock(s.next.from, s.next.to);
        assert.ok(++moves <= 20, 'levelling ends');
      }
      return moves;
    };
    const sum = (t) => t.reduce((a, b) => a + b, 0);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('spinner-fair', 8, 'Mia', 'school');
    let s = await state();
    assert.deepEqual([s.level, s.phase, s.spins.length, s.cards.length], [8, 'spin', 0, 0]);
    assert.deepEqual([...s.wheel].sort(), [1, 2, 3, 4, 5, 6], 'the wheel holds 1 to 6 once each');
    let slipped = false;
    let levelled = 0;
    for (let set = 0; set < 2; set++) {
      await open(['spin'], set);
      await spinSix();
      await open(['range'], set);
      await page.waitForTimeout(600);
      s = await state();
      const spins = s.spins;
      const range = Math.max(...spins) - Math.min(...spins);
      assert.deepEqual(s.towers, spins, 'each spin stands as its tower');
      assert.deepEqual(s.right, [range], 'the range is the biggest take away the smallest');
      assert.ok(s.cards.includes(range) && s.cards.length === 3);
      log(`Spinner Fair 8: set ${set + 1} spins ${spins.join(' ')}, range ${range}`);
      if (set === 0) {
        await screenshot('spinner-fair-8-range-portrait');
        assert.deepEqual([s.misses, s.hints], [0, 0], 'spins are never counted');
        await tapCard(s.cards.find((c) => c !== range));
        s = await state();
        assert.deepEqual([s.misses, s.hints, s.phase], [1, 0, 'range'], 'a wrong range card: one miss');
      }
      const missesBefore = s.misses;
      await tapCard(range);
      await open(['level', 'typical'], set);
      s = await state();
      if (s.phase === 'level') {
        if (!slipped) {
          // A block from the shortest tower onto the tallest: allowed and said, never a miss.
          const short = s.towers.indexOf(Math.min(...s.towers)),
            tall = s.towers.indexOf(Math.max(...s.towers));
          await moveBlock(short, tall);
          s = await state();
          assert.equal(s.towers[tall], Math.max(...spins) + 1, 'the tall tower got taller');
          assert.deepEqual(
            [s.slips, s.misses, s.hints],
            [1, missesBefore, 0],
            'a taller move is not a miss or a hint',
          );
          assert.equal(sum(s.towers), sum(spins), 'a move keeps every block');
          slipped = true;
          if (set === 0) await screenshot('spinner-fair-8-towers-portrait');
        }
        levelled += await levelAll();
      }
      await open(['typical'], set);
      s = await state();
      assert.ok(Math.max(...s.towers) - Math.min(...s.towers) <= 1, 'the towers are nearly level');
      assert.equal(sum(s.towers), sum(spins), 'levelling keeps every block');
      // Fresh cards take no answer for half a second.
      await page.waitForTimeout(600);
      const mean = sum(spins) / 6;
      const want = Number.isInteger(mean) ? [mean] : [Math.floor(mean), Math.ceil(mean)];
      assert.deepEqual(s.right, want, 'the right cards are the heights the level towers show');
      for (const n of want) assert.ok(s.cards.includes(n), 'every accepted height is on a card');
      if (set === 0) {
        await tapCard(s.cards.find((c) => !want.includes(c)));
        s = await state();
        assert.deepEqual([s.misses, s.hints, s.glowing], [2, 0, false], 'a wrong typical card: one miss');
        // The pause sheet's Show me: the level line and its cards glow, one hint.
        await page.evaluate(() => neo.scene.game.askForHint());
        await page.waitForTimeout(400);
        s = await state();
        assert.deepEqual([s.misses, s.hints, s.glowing], [2, 1, true], 'asked-for help is one hint');
        // Turned on its side mid-question: the same towers, cards and counts.
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(500);
        await screenshot('spinner-fair-8-typical-glow-landscape');
        const turned = await state();
        assert.deepEqual(
          [turned.phase, turned.towers, turned.cards, turned.misses, turned.hints],
          ['typical', s.towers, s.cards, 2, 1],
        );
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(500);
      }
      // With a mean that is not whole, the upper neighbour is as right as the lower.
      await tapCard(want.at(-1));
    }
    await finished('spinner-fair');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [2, 1], 'level 8 saved 2 misses, 1 hint');
    log(
      `Spinner Fair 8: upright, two sets of six spins, a wrong range card, ${slipped ? 'a block moved onto a taller tower (not counted)' : 'no levelling needed, so no taller move was tried'}, ${levelled} levelling moves, a wrong typical card and asked-for help (2/1); passed`,
    );
  }
  /** Spinner Fair 9, upright: a wrong Check on the even wheel (one miss), a wedge dragged and wedges tapped across (never
   * counted), the right Check and its 80-spin proof run; on wheel 2 two wrong Checks (the glow, one hint) and asked-for
   * help handing the wedges and pressing Check. */
  async function spinnerFairRigPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('spinner-fair').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () => page.evaluate(() => neo.scene.game.state);
    const idle = async () => {
      await page.waitForTimeout(150);
      await page.waitForFunction(
        () =>
          neo.scene.finished || (!neo.scene.game.spinning && !neo.scene.game.busy && !neo.scene.game.rebuild),
        null,
        { timeout: 40000 },
      );
      await page.waitForTimeout(120);
    };
    const tapBox = async (i) => {
      await page.evaluate((i) => kit.tapOn(neo.scene.game.boxes[i]), i);
      await idle();
    };
    const check = async () => {
      await page.evaluate(() => kit.tapOn(neo.scene.game.check));
      await page.waitForTimeout(300);
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('spinner-fair', 9, 'Mia', 'school');
    await idle();
    let s = await state();
    assert.deepEqual([s.phase, s.wheel.length, s.counts, s.right], ['make', 8, [4, 4], false]);
    assert.ok([1, 3, 5, 7].includes(s.target.k), `wheel 1 asks for eighths (${s.target.k})`);
    assert.deepEqual([s.target.n, s.target.of], [s.target.k, 8]);
    const fav = s.favourite;
    // A Check on the even wheel: a miss, and the wheel stays hers to change.
    await check();
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.phase, s.glowing],
      [1, 0, 'make', false],
      'a wrong Check: one miss',
    );
    // One wedge dragged onto the critter that needs it.
    const to = s.racers.indexOf(s.next);
    await page.evaluate(async (to) => {
      const g = neo.scene.game,
        from = g.racers[1 - to],
        p = g.pieces.filter((x) => x.kind === from).at(to === 0 ? 0 : -1);
      await kit.dragTo(p.node, g.boxes[to].getGlobalPosition());
    }, to);
    await idle();
    s = await state();
    assert.equal(s.counts[to], 5, 'a wedge dragged onto a box changes owner');
    assert.equal(s.wheel.length, 8);
    // A tap the wrong way and back: free either way.
    await tapBox(1 - to);
    assert.deepEqual((await state()).counts, [4, 4], 'a tap on a box hands it one wedge');
    await tapBox(to);
    for (s = await state(); s.next; s = await state()) await tapBox(s.racers.indexOf(s.next));
    assert.deepEqual(
      [s.counts[0], s.right, s.misses, s.hints],
      [s.target.k, true, 1, 0],
      'moves are never counted',
    );
    const order = await page.evaluate(() => neo.scene.game.total);
    assert.equal(order, 0, 'no spin before Check');
    await screenshot('spinner-fair-9-portrait');
    await check();
    await page.waitForFunction(() => neo.scene.game.state.proved !== null, null, { timeout: 30000 });
    s = await state();
    assert.equal(s.total, 80, 'the proof run is eighty spins');
    assert.ok(s.proved >= 0 && s.proved <= 80);
    log(
      `Spinner Fair 9: wheel 1 ${s.target.n} out of every ${s.target.of} (k=${s.target.k}), proof run ${s.proved} of 80 (${Math.abs(s.proved - 10 * s.target.k) <= 10 ? 'about' : 'unusual'})`,
    );
    await page.waitForFunction(() => neo.scene.game.state.set === 1 && !neo.scene.game.busy, null, {
      timeout: 40000,
    });
    s = await state();
    assert.deepEqual([s.misses, s.hints], [1, 0], 'the proof run counted nothing');
    assert.deepEqual([s.phase, s.counts, s.favourite, s.total], ['make', [4, 4], fav, 0]);
    assert.ok([2, 6].includes(s.target.k), `wheel 2 asks for quarters (${s.target.k})`);
    assert.equal(s.target.of, 4);
    for (let i = 0; i < 2; i++) {
      await check();
      await page.waitForTimeout(300);
    }
    await page.waitForFunction(() => neo.scene.game.state.glowing, null, { timeout: 15000 });
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints],
      [3, 1],
      'the second wrong Check on a wheel lights the glow: one hint',
    );
    await page.waitForTimeout(300);
    await screenshot('spinner-fair-9-glow-portrait');
    // Asked-for help while the glow is on: the wedges are handed over, then Check is pressed. Still one hint.
    for (let i = 0; i < 4 && (await state()).phase === 'make'; i++) {
      await page.evaluate(() => neo.scene.game.askForHint());
      await idle();
    }
    s = await state();
    assert.deepEqual(
      [s.phase, s.counts[0], s.misses, s.hints],
      ['proof', s.target.k, 3, 1],
      'help finishes the wheel',
    );
    await finished('spinner-fair');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [3, 1], 'level 9 saved 3 misses, 1 hint');
    log(
      'Spinner Fair 9: upright, a wrong Check on the even wheel (1/0), a wedge dragged and wedges tapped across (not counted), the right Check and 80 spins; two wrong Checks on wheel 2 (3/1, the glow), help handed the wedges and pressed Check; passed',
    );
  }
  async function spinnerFairDuePlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('spinner-fair').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () => page.evaluate(() => neo.scene.game.state);
    const until = (phase, set) =>
      page.waitForFunction(
        ([phase, set]) => {
          const g = neo.scene.game;
          return g.state.set === set && g.state.phase === phase && !g.busy && !g.spinning;
        },
        [phase, set],
        { timeout: 40000 },
      );
    const tapCard = async (card) => {
      await page.evaluate((card) => {
        const g = neo.scene.game;
        kit.tapOn(g.cards[g.options.indexOf(card)]);
      }, card);
      await page.waitForTimeout(300);
    };
    const tapSpinner = async () => {
      await page.evaluate(() => kit.tapOn(neo.scene.game.art.node));
      await page.waitForTimeout(150);
    };
    const streakOf = (s) => {
      const tail = s.results.slice(-5);
      return s.results.length === 240 || (tail.length === 5 && tail.every((k) => k === tail[0]));
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('spinner-fair', 10, 'Mia', 'school');
    await until('run', 0);
    let s = await state();
    assert.deepEqual([s.wheel.length, s.results.length, s.streak, s.next], [6, 0, null, null]);
    const evens = [s.even];
    const fav = s.favourite;
    // Wheel 1: the spinner starts the run, which stops itself at five in a row.
    await tapSpinner();
    await until('ask', 0);
    s = await state();
    assert.ok(streakOf(s), `the run ended on five in a row (${s.results.length} spins)`);
    assert.equal(s.results.slice(0, -1).length >= 4, true);
    assert.deepEqual([s.streak.length >= 5 || s.results.length === 240, s.misses, s.hints], [true, 0, 0]);
    assert.equal(s.right, s.counts[0] === s.counts[1] ? 'same' : s.racers[s.counts[0] > s.counts[1] ? 0 : 1]);
    log(
      `Spinner Fair 10: wheel 1 ${s.counts.join('–')}, ${s.results.length} spins to ${s.streak.kind} x${s.streak.length}; right card ${s.right}`,
    );
    // The cards take no tap for their first half second of game time (CARD_WAIT), which a busy machine stretches.
    await page.waitForTimeout(1000);
    // The card for the critter that just made the streak is wrong on an even wheel; any card but the right one is a miss.
    const wrong = (st) =>
      st.options.find((c) => c !== st.right && (c === st.streak.kind || st.right === st.streak.kind));
    await tapCard(wrong(s));
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.phase, s.glowing], [1, 0, 'ask', false], 'a wrong card: one miss');
    const spun = s.results.length;
    await tapSpinner();
    assert.equal((await state()).results.length, spun, 'no spin while the question waits');
    await tapCard(s.right);
    s = await state();
    assert.deepEqual(
      [s.phase, s.misses, s.next],
      ['next', 1, null],
      'the right card opens the one next spin',
    );
    await tapSpinner();
    await page.waitForFunction(
      () => neo.scene.game.state.next !== null || neo.scene.game.state.set === 1,
      null,
      {
        timeout: 15000,
      },
    );
    s = await state();
    if (s.set === 0) {
      assert.equal(s.results.length, spun + 1, 'one more honest spin');
      assert.ok(s.racers.includes(s.next));
    }
    await until('run', 1);
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.results.length, s.favourite],
      [1, 0, 0, fav],
      'the next spin counted nothing',
    );
    evens.push(s.even);
    assert.deepEqual(evens.slice().sort(), [false, true], 'one even wheel and one uneven');
    // Wheel 2: the arrows fast-forward the run from its first spin.
    await page.evaluate(() => kit.tapOn(neo.scene.game.fast));
    await until('ask', 1);
    s = await state();
    assert.ok(streakOf(s), `the fast run ended on five in a row (${s.results.length} spins)`);
    await page.waitForTimeout(600);
    await screenshot('spinner-fair-10-portrait');
    const wrongs = s.options.filter((c) => c !== s.right);
    for (const c of wrongs) {
      await tapCard(c);
      await page.waitForTimeout(300);
    }
    await page.waitForFunction(() => neo.scene.game.state.glowing, null, { timeout: 15000 });
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints],
      [3, 1],
      'the second wrong card on a wheel lights the glow: one hint',
    );
    await page.waitForTimeout(300);
    await screenshot('spinner-fair-10-glow-portrait');
    // Asked-for help while the glow is on taps the card. Still one hint.
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    s = await state();
    assert.deepEqual([s.phase, s.misses, s.hints], ['next', 3, 1], 'help answers the card');
    log(`Spinner Fair 10: wheel 2 ${s.counts.join('–')}, ${s.results.length} spins; right card ${s.right}`);
    await tapSpinner();
    await finished('spinner-fair');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [3, 1], 'level 10 saved 3 misses, 1 hint');
    log(
      'Spinner Fair 10: upright, the run to five in a row by the spinner, one wrong card (1/0), no spin while the question waits, the right card and one more spin; the arrows on wheel 2, two wrong cards (3/1, the glow), help tapped the card; passed',
    );
  }
  /** Spinner Fair 11, upright: the covered wheel, three runs to 160 spins that show only who it stopped on, one wrong
   * card (a miss), the right card and the reveal; on wheel 2 two wrong cards (the glow, one hint) and help tapping the card. */
  async function spinnerFairHiddenPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('spinner-fair').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () => page.evaluate(() => neo.scene.game.state);
    const idle = async () => {
      await page.waitForTimeout(150);
      await page.waitForFunction(
        () => neo.scene.finished || (!neo.scene.game.spinning && !neo.scene.game.busy),
        null,
        { timeout: 40000 },
      );
      await page.waitForTimeout(120);
    };
    const tapCard = async (k) => {
      await page.evaluate((k) => {
        const g = neo.scene.game;
        kit.tapOn(g.cards[g.state.cards.indexOf(k)]);
      }, k);
      await page.waitForTimeout(300);
    };
    const nearest = (count) => {
      const far = [2, 4, 6].map((k) => Math.abs(count / 160 - k / 8));
      return [2, 4, 6].filter((_, i) => Math.abs(far[i] - Math.min(...far)) < 1e-9);
    };
    const runs = async (shot) => {
      let s = await state();
      assert.deepEqual([s.phase, s.run, s.total, s.covered, s.revealed], ['run', 0, 0, true, false]);
      assert.equal(s.wheels[0].length, 8, 'eight wedges under the cover');
      assert.ok([2, 4, 6].includes(s.k), 'the favourite has 2, 4 or 6 wedges');
      assert.deepEqual(s.right, [], 'no right card before the runs stand');
      const hidden = await page.evaluate(() => neo.scene.game.cards.every((c) => !c.visible));
      assert.ok(hidden, 'no answer cards during the runs');
      const totals = [];
      for (const target of ['art.node', 'fast', 'fast']) {
        const t = Date.now();
        await page.evaluate(
          (target) => kit.tapOn(target === 'fast' ? neo.scene.game.fast : neo.scene.game.art.node),
          target,
        );
        await idle();
        assert.ok(Date.now() - t < 9000, `a run took ${Date.now() - t} ms`);
        s = await state();
        totals.push(s.total);
        assert.ok(s.count >= 0 && s.count <= s.total);
        assert.ok([s.favourite, s.friend].includes(s.last), 'the window shows who it stopped on');
        assert.equal(s.covered, true, 'the cover stays on through the runs');
        if (shot && totals.length === 1) await screenshot('spinner-fair-11-covered-portrait');
      }
      assert.deepEqual(totals, [8, 40, 160], 'the runs stand at 8, 40 and 160 spins');
      assert.equal(s.phase, 'ask');
      assert.deepEqual(s.right, nearest(s.count), 'the right card is the nearest share to the strip');
      return s;
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('spinner-fair', 11, 'Mia', 'school');
    await idle();
    let s = await runs(true);
    log(
      `Spinner Fair 11: wheel 1 k=${s.k}, ${s.count} of 160 reads to ${s.right.join(' or ')} of 8 (${s.right.includes(s.k) ? 'the wheel' : 'unusual'})`,
    );
    // The spinner takes no more spins at the question.
    await page.evaluate(() => kit.tapOn(neo.scene.game.art.node));
    await page.waitForTimeout(300);
    assert.equal((await state()).total, 160, 'no spin at the question');
    await page.waitForTimeout(400);
    await screenshot('spinner-fair-11-ask-portrait');
    await tapCard(s.cards.find((c) => !s.right.includes(c)));
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.glowing, s.phase, s.covered],
      [1, 0, false, 'ask', true],
      'a wrong card: one miss, the cover stays',
    );
    const first = s.k;
    await tapCard(s.right[0]);
    await page.waitForFunction(() => neo.scene.game.state.revealed || neo.scene.game.state.set === 1, null, {
      timeout: 20000,
    });
    s = await state();
    if (s.set === 0) {
      assert.deepEqual([s.phase, s.covered], ['reveal', false], 'the right card lifts the cover');
      await screenshot('spinner-fair-11-reveal-portrait');
    }
    await page.waitForFunction(() => neo.scene.game.state.set === 1 && !neo.scene.game.busy, null, {
      timeout: 40000,
    });
    s = await state();
    assert.deepEqual([s.misses, s.hints], [1, 0], 'the reveal counted nothing');
    s = await runs(false);
    assert.notEqual(s.k, first, 'the second wheel has a different share');
    for (const c of s.cards.filter((c) => !s.right.includes(c)).slice(0, 2)) {
      await tapCard(c);
      await page.waitForTimeout(400);
    }
    // A strip exactly halfway leaves one wrong card; a second tap of it is the second miss.
    if ((await state()).misses < 3) await tapCard(s.cards.find((c) => !s.right.includes(c)));
    await page.waitForFunction(() => neo.scene.game.state.glowing, null, { timeout: 15000 });
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints],
      [3, 1],
      'the second wrong card on a wheel lights the glow: one hint',
    );
    await page.waitForTimeout(300);
    await screenshot('spinner-fair-11-glow-portrait');
    // Asked-for help while the glow is on taps a card the strip reads to. Still one hint.
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    s = await state();
    assert.deepEqual([s.phase, s.misses, s.hints], ['reveal', 3, 1], 'help answers the card');
    log(
      `Spinner Fair 11: wheel 2 k=${s.k}, ${s.count} of 160 reads to ${s.right.join(' or ')} of 8 (${s.right.includes(s.k) ? 'the wheel' : 'unusual'})`,
    );
    await finished('spinner-fair');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [3, 1], 'level 11 saved 3 misses, 1 hint');
    log(
      'Spinner Fair 11: upright, three runs to 160 spins under the cover on each wheel, one wrong card (1/0), the right card and the reveal; two wrong cards on wheel 2 (3/1, the glow), help tapped the card; passed',
    );
  }
  return {
    spinnerFairPlay,
    spinnerFairRacePlay,
    spinnerFairSettlePlay,
    spinnerFairDicePlay,
    spinnerFairTypicalPlay,
    spinnerFairRigPlay,
    spinnerFairDuePlay,
    spinnerFairHiddenPlay,
  };
}
