import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function tideLinePlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('tide-line').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          sea: g.sea.h,
          cycles: g.counter.cycles,
          index: g.index,
          misses: g.misses,
          hints: g.hints,
          busy: g.busy,
          high: g.high,
          glow: g.turns[g.index]?.glow ?? false,
          inTray: !!g.pail && !g.pail.at,
        };
      });
    const settle = async () => {
      await page.waitForTimeout(300);
      await page.waitForFunction(
        () =>
          neo.scene.finished ||
          (!neo.scene.game.busy &&
            !!neo.scene.game.pail &&
            !neo.scene.game.pail.at &&
            neo.scene.game.pail.node.scale.x > 0.99),
        null,
        { timeout: 30000 },
      );
      await page.waitForTimeout(500);
    };
    /** A shore height and an x fraction to a CSS point on the canvas. */
    const at = (fx, h, dy = 0) =>
      page.evaluate(
        ({ fx, h, dy }) => {
          const g = neo.scene.game;
          const L = g.L;
          const p = g.board.toGlobal({ x: g.view.w * fx, y: L.low - h * (L.low - L.dunes) + dy });
          return [p.x, p.y];
        },
        { fx, h, dy },
      );
    /** Pull the sea from the low-water edge up to `h` and let go. */
    const pull = async (h) => {
      const a = await at(0.6, 0, 10);
      const b = await at(0.6, h);
      await page.evaluate(
        async ({ a, b }) => {
          const path = kit.line(a, b, 14);
          for (let i = 0; i < 18; i++) path.push(b);
          await kit.drag(path, 1, 30);
        },
        { a, b },
      );
    };
    /** Carry the pail so its feet land at height `h` (the finger is 40 logical units below them). */
    const carry = async (fx, h) => {
      const to = await at(fx, h, 40);
      await page.evaluate(async (to) => {
        const g = neo.scene.game;
        const p = g.pail.node.getGlobalPosition();
        const s = g.view.scale;
        const path = kit.line([p.x, p.y - 60 * s], to, 16);
        for (let i = 0; i < 4; i++) path.push(to);
        await kit.drag(path, 1, 30);
      }, to);
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 1 (lap): a tap on the sky sends a whole wave; a tap while it runs gets an answer and does not restart it;
    // a tap while a pulled sea slides back starts the next wave from where the water is.
    let s;
    await launch('tide-line', 1, 'Mia', 'lap');
    await page.waitForTimeout(800);
    const tapAt = (fx, fy) =>
      page.evaluate(
        ({ fx, fy }) => {
          const g = neo.scene.game;
          const p = g.board.toGlobal({ x: g.view.w * fx, y: g.view.h * fy });
          kit.tap(p.x, p.y);
        },
        { fx, fy },
      );
    await tapAt(0.55, 0.18);
    await page.waitForTimeout(700);
    s = await state();
    assert.ok(s.sea > 0.15, `a tap on the sky sends the wave (${s.sea.toFixed(2)})`);
    const before = s.sea;
    await tapAt(0.7, 0.3);
    await page.waitForTimeout(150);
    s = await state();
    assert.ok(
      s.sea >= before,
      `a tap during the wave does not snap it back (${before.toFixed(2)} -> ${s.sea.toFixed(2)})`,
    );
    await page.waitForFunction(
      () => neo.scene.game.counter.cycles === 1 && neo.scene.game.sea.h < 0.05,
      null,
      {
        timeout: 8000,
      },
    );
    // A pull, then a tap while the sea slides back down.
    await pull(0.5);
    await page.waitForTimeout(250);
    const sliding = (await state()).sea;
    await tapAt(0.5, 0.2);
    await page.waitForTimeout(60);
    s = await state();
    assert.ok(
      s.sea > sliding - 0.08,
      `a tap on a sliding sea starts the wave from the water (${sliding.toFixed(2)} -> ${s.sea.toFixed(2)})`,
    );
    await finished('tide-line');
    assert.deepEqual(await score(), [0, 0], 'lap level 1 counts nothing');
    await screenshot('tide-line-1-lap');

    // Level 1 (toddler): two pulls up the sand, each let go, are the two cycles; nothing is counted.
    await launch('tide-line', 1, 'Mia', 'toddler');
    await page.waitForTimeout(800);
    await pull(0.9);
    s = await state();
    assert.ok(s.sea > 0.6, `the sea follows the finger up the sand (${s.sea.toFixed(2)})`);
    await page.waitForFunction(() => neo.scene.game.sea.h < 0.05, null, { timeout: 5000 });
    s = await state();
    assert.equal(s.cycles, 1, 'one pull and let go is one cycle');
    await pull(0.85);
    await finished('tide-line');
    assert.deepEqual(await score(), [0, 0], 'level 1 counts nothing');

    // Level 2 (preschool), pail 1: below the line it floats and is fetched (one miss), twice (the glow, one hint); then dry.
    await launch('tide-line', 2, 'Mia', 'preschool');
    await settle();
    s = await state();
    const wet = s.high - 0.12;
    await carry(0.45, wet);
    await settle();
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.glow, s.inTray],
      [1, 0, false, true],
      'a floated pail is one miss, fetched back to the rocks',
    );
    await carry(0.4, wet);
    await settle();
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.glow], [2, 1, true], 'the second float glows the line: one hint');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(900);
    await screenshot('tide-line-2-portrait');
    await carry(0.5, (s.high + 1) / 2 + 0.04);
    await settle();
    s = await state();
    assert.deepEqual(
      [s.index, s.misses, s.hints, s.glow],
      [1, 2, 1, false],
      'above the line the pail stays dry; the second pail is up',
    );
    // Pail 2, straight above the line.
    await carry(0.3, (s.high + 1) / 2);
    await finished('tide-line');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [2, 1], 'level 2 saved 2 misses, 1 hint');
    log(
      'Tide Line 1–2: lap taps on sky, mid-wave and a sliding sea send whole waves (0/0); two pulls finish level 1 (0/0); level 2 floats twice (fetched, then the glow), a dry pail in portrait and a second dry pail (2/1); passed',
    );
  }
  async function tideLine34Play() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('tide-line').history.at(-1);
        return [r.misses, r.hints];
      });
    const st = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        const r = g.rounds[g.round];
        return {
          round: g.round,
          lines: r?.lines ?? [],
          misses: g.misses,
          hints: g.hints,
          busy: g.busy,
          glow: r?.glow ?? false,
          items: g.items.map((it) => ({ kind: it.kind, h: it.at?.h ?? null, settled: it.settled })),
        };
      });
    const idle = async () => {
      await page.waitForTimeout(300);
      await page.waitForFunction(
        () =>
          neo.scene.finished ||
          (!neo.scene.game.busy && neo.scene.game.items.every((it) => !it.handle.dragging)),
        null,
        { timeout: 30000 },
      );
      await page.waitForTimeout(900);
    };
    /** Carry a thing so its feet land at shore height `h`, `fx` across the sand (the finger rides 40 units below its feet). */
    const carry = async (kind, fx, h) => {
      await page.evaluate(
        async ({ kind, fx, h }) => {
          const g = neo.scene.game;
          const it = g.items.find((i) => i.kind === kind);
          const L = g.L;
          const s = g.view.scale;
          const from = it.node.getGlobalPosition();
          const to = g.board.toGlobal({ x: L.sand.x + L.sand.w * fx, y: L.low - h * (L.low - L.dunes) + 40 });
          const path = kit.line([from.x, from.y - 50 * s], [to.x, to.y], 16);
          for (let i = 0; i < 4; i++) path.push([to.x, to.y]);
          await kit.drag(path, 1, 30);
        },
        { kind, fx, h },
      );
      await page.waitForTimeout(400);
    };
    const wave = () =>
      page.evaluate(() =>
        kit.tapOn(neo.scene.game.waveBtn, 65 * neo.scene.game.view.scale, 60 * neo.scene.game.view.scale),
      );
    const dryH = (lines) => (Math.max(...lines) + 0.025 + 1) / 2;
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 3 (pre-K). Round 1: the wave tapped too early is not counted; then all three above the line stay dry.
    await launch('tide-line', 3, 'Mia', 'prek');
    await idle();
    let s = await st();
    assert.equal(s.lines.length, 1, 'round 1 has one line');
    await carry('pail', 0.3, dryH(s.lines));
    await wave();
    await page.waitForTimeout(600);
    s = await st();
    assert.deepEqual(
      [s.misses, s.busy],
      [0, false],
      'the wave before all three are placed is not counted and does not run',
    );
    await carry('flag', 0.5, dryH(s.lines));
    await carry('towel', 0.72, dryH(s.lines));
    await wave();
    await page.waitForFunction(() => neo.scene.game.round === 1 && !neo.scene.game.busy, null, {
      timeout: 15000,
    });
    await page.waitForTimeout(900);
    s = await st();
    assert.equal(s.lines.length, 2, 'round 2 has the windy-day line too');
    assert.equal(s.misses, 0, 'round 1 all dry');
    // Round 2: the pail between the lines floats (one miss) and is fetched; the other two stay put.
    const between = (Math.min(...s.lines) + 0.025 + Math.max(...s.lines) - 0.025) / 2;
    await carry('pail', 0.3, between);
    await carry('flag', 0.5, dryH(s.lines));
    await carry('towel', 0.72, dryH(s.lines));
    await screenshot('tide-line-3-two-lines');
    await wave();
    await page.waitForTimeout(1200);
    await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 15000 });
    s = await st();
    assert.deepEqual(
      [s.misses, s.hints, s.glow],
      [1, 0, false],
      'the pail between the lines is one miss, no glow yet',
    );
    assert.deepEqual(
      s.items.map((i) => [i.kind, i.h === null, i.settled]),
      [
        ['pail', true, false],
        ['flag', false, true],
        ['towel', false, true],
      ],
      'the pail is back on the rocks; the dry flag and towel stay',
    );
    await carry('pail', 0.3, dryH(s.lines));
    await wave();
    await finished('tide-line');
    assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');

    // Level 4 (pre-K), the authored strip (in, out, in, gap; the answer is out): two wrong cards (the second glows), then right.
    await launch('tide-line', 4, 'Mia', 'prek');
    await page.waitForTimeout(1200);
    const tapCard = (kind) =>
      page.evaluate((kind) => kit.tapOn(neo.scene.game.cards.find((c) => c.kind === kind).node), kind);
    const st4 = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        const t = g.strips[g.index];
        return { index: g.index, misses: g.misses, hints: g.hints, glow: t?.glow ?? false, busy: g.busy };
      });
    await tapCard('high');
    await page.waitForTimeout(700);
    let t = await st4();
    assert.deepEqual([t.misses, t.hints, t.glow], [1, 0, false], 'a wrong card is one miss');
    await tapCard('mid');
    await page.waitForTimeout(700);
    t = await st4();
    assert.deepEqual(
      [t.misses, t.hints, t.glow],
      [2, 1, true],
      'the halfway card is wrong too; the second glows the right card (one hint)',
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(900);
    await screenshot('tide-line-4-portrait');
    // U7 R4: "Yes! In, out, in, out!" (2.4 s when muted) never holds the next strip. The card's glide (0.5 s) and the
    // look at the finished strip (0.6 s) come to 1.1 s; with the line awaited it was 2.9 s.
    await tapCard('low');
    await page.waitForFunction(() => neo.scene.game.index === 1 && !neo.scene.game.busy, null, {
      timeout: 2000,
    });
    t = await st4();
    assert.equal(t.index, 1, 'the right card finishes the first strip');
    await page.evaluate(() => {
      const g = neo.scene.game;
      const ans = g.strips[g.index].strip.pics[g.strips[g.index].strip.gap];
      kit.tapOn(g.cards.find((c) => c.kind === ans).node);
    });
    await finished('tide-line');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [2, 1], 'level 4 saved 2 misses, 1 hint');
    log(
      'Tide Line 3–4: level 3 an early wave not counted, round 1 dry, round 2 a pail between the lines floats and is fetched (1/0); level 4 two wrong cards then the glow in portrait, two strips (2/1); passed',
    );
  }
  async function tideLine5Play() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('tide-line').history.at(-1);
        return [r.misses, r.hints];
      });
    const st = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          t: g.now.t,
          selected: g.turn.selected,
          flags: [...g.turn.flags],
          ask: g.turn.ask ?? null,
          glow: g.turn.glow,
          misses: g.turn.tally.misses,
          hints: g.turn.tally.hints,
          day: g.turn.day,
          busy: g.busy,
          button: g.flagBtn.alpha,
        };
      });
    /** Carry the marker along its track to time `t` and let go. */
    const scrub = async (t) => {
      await page.evaluate(async (t) => {
        const g = neo.scene.game;
        const from = g.knob.getGlobalPosition();
        const D = g.D;
        const to = g.board.toGlobal({ x: D.track.x0 + t * (D.track.x1 - D.track.x0), y: D.track.y });
        const path = kit.line([from.x, from.y], [to.x, to.y], 16);
        for (let i = 0; i < 4; i++) path.push([to.x, to.y]);
        await kit.drag(path, 1, 30);
      }, t);
      await page.waitForTimeout(450);
    };
    const tapStop = async (i) => {
      await page.evaluate((i) => {
        const g = neo.scene.game;
        const b = g.D.stops[i];
        kit.tapOn(g.stops[i], (b.w / 2) * g.view.scale, (b.h / 2) * g.view.scale);
      }, i);
      await page.waitForTimeout(750);
    };
    const flag = async () => {
      await page.evaluate(() => kit.tapOn(neo.scene.game.flagBtn));
      await page.waitForTimeout(600);
    };
    const water = (s) =>
      0.1 + ((s.day.high - 0.1) * (1 - Math.cos(2 * Math.PI * (2 * (s.t - 1 / 8) + s.day.offset)))) / 2;
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 5 (pre-K), the authored day (low, high, low, high). The flag does nothing before a stop is chosen; a scrub
    // moves the sea under the finger and settles on the nearest stop; flagging the other state is never a miss.
    await launch('tide-line', 5, 'Mia', 'prek');
    await page.waitForTimeout(1200);
    let s = await st();
    assert.deepEqual(
      [s.t, s.selected, s.ask],
      [0, null, 'shows'],
      'the day starts at its left end, nothing chosen',
    );
    assert.ok(s.button < 1, 'the flag button waits for a stop');
    await flag();
    s = await st();
    assert.deepEqual([s.flags.length, s.misses], [0, 0], 'the flag with nothing chosen marks nothing');
    await scrub(0.4);
    s = await st();
    assert.equal(s.selected, 1, 'letting go near the second stop settles on it');
    assert.ok(Math.abs(s.t - 3 / 8) < 0.001, `the marker snaps to the stop (${s.t.toFixed(3)})`);
    assert.ok(water(s) > 0.5, 'the sea is in at the second stop');
    await flag();
    s = await st();
    assert.deepEqual(
      [s.flags.length, s.misses, s.hints, s.ask],
      [0, 0, 0, 'shows'],
      'flagging the covered pool while the pool is asked for is named, not counted',
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(900);
    await scrub(0.6);
    s = await st();
    assert.equal(s.selected, 2, 'a scrub in portrait settles on the third stop');
    assert.ok(water(s) < 0.15, 'the sea is out at the third stop');
    await screenshot('tide-line-5-portrait');
    await flag();
    await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 5000 });
    s = await st();
    assert.deepEqual(
      [s.flags, s.ask, s.misses],
      [[2], 'covered', 0],
      'the pool time is flagged; the covered ask follows',
    );
    await flag();
    s = await st();
    assert.deepEqual(
      [s.flags, s.misses],
      [[2], 0],
      'the first flag stop shows the other state for the second ask: not counted',
    );
    await tapStop(3);
    s = await st();
    assert.equal(s.selected, 3, 'a tapped stop is chosen');
    assert.ok(Math.abs(s.t - 7 / 8) < 0.001, 'the sea moves to the tapped stop');
    await flag();
    await finished('tide-line');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [0, 0], 'level 5 counts nothing for looking around');

    // Level 5 (school), a seeded day: Help lights both fitting stops (one hint); asked again it flags the earlier one.
    await launch('tide-line', 5, 'Mia', 'school');
    await page.waitForTimeout(1200);
    const fitting = (ask) =>
      page.evaluate((ask) => {
        const g = neo.scene.game;
        const low = (i) => (i % 2 === 0) === (g.turn.day.offset === 0);
        return [0, 1, 2, 3].filter((i) => (ask === 'shows' ? low(i) : !low(i)));
      }, ask);
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    s = await st();
    assert.deepEqual(
      [s.glow, s.hints, s.flags.length],
      [true, 1, 0],
      'Help glows the fitting stops: one hint',
    );
    await screenshot('tide-line-5-glow');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForFunction(() => neo.scene.game.turn.flags.length === 1 && !neo.scene.game.busy, null, {
      timeout: 5000,
    });
    s = await st();
    assert.deepEqual(
      [s.flags, s.hints, s.glow],
      [[(await fitting('shows'))[0]], 1, false],
      'Help again flags the earlier fitting stop',
    );
    await tapStop((await fitting('covered'))[1]);
    await flag();
    await finished('tide-line');
    assert.deepEqual(await score(), [0, 1], 'level 5 with Help saved 0 misses, 1 hint');
    log(
      'Tide Line 5: the flag waits for a stop; a scrub settles on the nearest stop and moves the sea; flagging the other state twice is not counted; a portrait scrub, a tapped stop and both flags (0/0); on a seeded school day Help glows two stops, then flags the earlier one (0/1); passed',
    );
  }
  async function tideLine6Play() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('tide-line').history.at(-1);
        return [r.misses, r.hints];
      });
    const st = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          t: g.now.t,
          look: g.look,
          placed: g.turn.placed.map((p) => [p.job, p.stop]),
          job: g.turn.job ?? null,
          order: [...g.turn.order],
          glow: g.turn.glow,
          misses: g.turn.tally.misses,
          hints: g.turn.tally.hints,
          day: g.turn.day,
          busy: g.busy,
          home: Math.hypot(g.card.x - g.C.card.x, g.card.y - g.C.card.y) < 2,
        };
      });
    /** Touch a window alone: a look at that time. */
    const lookAt = async (i) => {
      await page.evaluate((i) => {
        const g = neo.scene.game;
        const b = g.C.windows[i];
        kit.tapOn(g.windows[i], (b.w / 2) * g.view.scale, (b.h / 2) * g.view.scale);
      }, i);
      await page.waitForTimeout(600);
    };
    /** Carry the card to a point of the board (logical units) and let go; the card rides 40 above the finger. */
    const carry = async (x, y) => {
      await page.evaluate(
        async ([x, y]) => {
          const g = neo.scene.game;
          const from = g.card.getGlobalPosition();
          const to = g.board.toGlobal({ x, y: y + 40 });
          const path = kit.line([from.x, from.y], [to.x, to.y], 16);
          for (let i = 0; i < 4; i++) path.push([to.x, to.y]);
          await kit.drag(path, 1, 30);
        },
        [x, y],
      );
      await page.waitForTimeout(700);
    };
    const drop = async (i) => {
      const [x, y] = await page.evaluate((i) => {
        const C = neo.scene.game.C;
        const b = C.windows[i];
        return [b.x + b.w / 2, C.plot.y + C.plot.h / 2];
      }, i);
      await carry(x, y);
    };
    const ready = () =>
      page.waitForFunction(() => !neo.scene.game.busy && !neo.scene.game.finished, null, { timeout: 5000 });
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 6 (school), the authored day (low, high, low, high) and order (pool, boat, picnic). Looking at a window and
    // letting the card go off the windows count nothing; two clashing windows are two misses and bring the glow.
    await launch('tide-line', 6, 'Mia', 'school');
    await page.waitForTimeout(1200);
    let s = await st();
    assert.deepEqual(
      [s.t, s.look, s.job, s.order],
      [0, null, 'shows', ['shows', 'boat', 'picnic']],
      'the chart starts at the left of the day with the pool card served',
    );
    await lookAt(1);
    s = await st();
    assert.equal(s.look, 1, 'a touched window is looked at');
    assert.ok(Math.abs(s.t - 3 / 8) < 0.001, `the shore moves to the touched window (${s.t.toFixed(3)})`);
    const pic = await page.evaluate(() => {
      const b = neo.scene.game.C.picture;
      return [b.x + b.w / 2, b.y + b.h / 2];
    });
    await carry(pic[0], pic[1]);
    s = await st();
    assert.deepEqual(
      [s.placed.length, s.misses, s.home],
      [0, 0, true],
      'a card let go off the windows goes home, uncounted',
    );
    await drop(1);
    s = await st();
    assert.deepEqual(
      [s.placed.length, s.misses, s.hints, s.glow, s.home],
      [0, 1, 0, false, true],
      'the pool on high water is one miss and the card comes back',
    );
    await drop(3);
    s = await st();
    assert.deepEqual(
      [s.placed.length, s.misses, s.hints, s.glow],
      [0, 2, 1, true],
      'a second clash lights the fitting windows: one hint',
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(900);
    await screenshot('tide-line-6-portrait');
    // Tap the card, then tap a glowing window.
    await page.evaluate(() => kit.tapOn(neo.scene.game.card));
    await page.waitForTimeout(400);
    await lookAt(2);
    await ready();
    s = await st();
    assert.deepEqual(
      [s.placed, s.job, s.glow, s.misses],
      [[['shows', 2]], 'boat', false, 2],
      'tap the card, tap the window: the pool sits on the third time and the boat is served',
    );
    await drop(1);
    await ready();
    s = await st();
    assert.deepEqual(
      s.placed,
      [
        ['shows', 2],
        ['boat', 1],
      ],
      'the boat floats on high water',
    );
    await drop(2);
    await finished('tide-line');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [2, 1], 'level 6 saved 2 misses, 1 hint with a shared window');

    // A seeded round: Help lights two windows (one hint), asked again it places the card on the earlier one.
    await launch('tide-line', 6, 'Mia', 'school');
    await page.waitForTimeout(1200);
    const fitting = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        const low = (i) => (i % 2 === 0) === (g.turn.day.offset === 0);
        return [0, 1, 2, 3].filter((i) => (g.turn.job === 'boat' ? !low(i) : low(i)));
      });
    const first = await fitting();
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    s = await st();
    assert.deepEqual([s.glow, s.hints, s.placed.length], [true, 1, 0], 'Help glows the fitting windows');
    await screenshot('tide-line-6-glow');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForFunction(() => neo.scene.game.turn.placed.length === 1 && !neo.scene.game.busy, null, {
      timeout: 5000,
    });
    s = await st();
    assert.deepEqual(
      [s.placed[0][1], s.hints, s.glow],
      [first[0], 1, false],
      'Help again places the card on the earlier fitting window',
    );
    await drop((await fitting())[1]);
    await ready();
    await drop((await fitting())[0]);
    await finished('tide-line');
    assert.deepEqual(await score(), [0, 1], 'level 6 with Help saved 0 misses, 1 hint');
    log(
      "Tide Line 6: a touched window is a look; a card let go off the windows goes home; two clashing windows are two misses and the glow; in portrait a tapped card goes on a tapped window, the boat on high water and the picnic on the pool's window (2/1); on a seeded day Help glows two windows, then places the card (0/1); passed",
    );
  }
  return { tideLinePlay, tideLine34Play, tideLine5Play, tideLine6Play };
}
