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
  return { spinnerFairPlay, spinnerFairRacePlay, spinnerFairSettlePlay };
}
