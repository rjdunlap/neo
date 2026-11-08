import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch }) {
  /** Attic Finds levels 3-4 by touch: fast taps on the giant handle queue one turn, Finish waits for the third turn, level 4's door opens and closes free, and Finish ends the round with no misses or hints; level 4 upright with the door open. */
  async function atticLeverPlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          turns: g.lever.turns,
          up: g.lever.up,
          doorOpen: g.lever.doorOpen,
          finish: !!g.finishBtn,
          busy: g.busy,
          misses: g.misses,
          hints: g.hints,
        };
      });
    const sticker = (n) =>
      page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });
    const tapAt = (expr) =>
      page.evaluate((expr) => {
        const g = neo.scene.game;
        const q = new Function('g', `return ${expr}`)(g);
        const p = g.bg.toGlobal(q);
        kit.tap(p.x, p.y);
      }, expr);
    const settle = () =>
      page.waitForFunction(() => neo.scene.game.halfT === null && !neo.scene.game.lever.turning, null, {
        timeout: 5000,
      });
    const tapFinish = () =>
      page.evaluate(() => {
        const p = neo.scene.game.finishBtn.getGlobalPosition();
        kit.tap(p.x, p.y);
      });

    // Level 3: a swat anywhere turns the handle; four fast touches make two turns (one queued), never four.
    await launch('attic-finds', 3, 'Mia', 'lap');
    await page.waitForTimeout(400);
    let n = await page.evaluate(() => kit.store.data.stickers.length);
    await tapAt('({ x: 120, y: 330 })');
    await tapAt('({ x: 120, y: 330 })');
    await tapAt('({ x: 120, y: 330 })');
    await tapAt('({ x: 120, y: 330 })');
    await page.waitForTimeout(1600);
    await settle();
    let st = await state();
    assert.equal(st.turns, 2, 'a run of fast touches makes one turn and one queued turn');
    assert.equal(st.finish, false, 'Finish is absent before the third turn');
    await tapAt('g.L.handle');
    await page.waitForTimeout(900);
    await settle();
    st = await state();
    assert.deepEqual(
      [st.turns, st.finish, st.up],
      [3, true, true],
      'the third turn brings the Finish picture',
    );
    await tapFinish();
    await sticker(n);
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]),
      [0, 0],
      'every touch is play',
    );

    // Level 4: the door opens and closes free; the handle turns with the door open.
    await launch('attic-finds', 4);
    await page.waitForTimeout(400);
    n = await page.evaluate(() => kit.store.data.stickers.length);
    await tapAt('({ x: g.L.door.x + g.L.door.w / 2, y: g.L.door.y + g.L.door.h / 2 })');
    await page.waitForTimeout(500);
    assert.equal((await state()).doorOpen, true, 'a tap on the door opens it');
    await tapAt('g.L.handle');
    await page.waitForTimeout(900);
    await settle();
    assert.equal((await state()).turns, 1, 'the handle turns with the door open');
    await tapAt('({ x: g.L.door.x + g.L.door.w / 2, y: g.L.door.y + g.L.door.h / 2 })');
    await page.waitForTimeout(300);
    assert.equal((await state()).doorOpen, false, 'a tap on the open door closes it');
    await tapAt('({ x: 40, y: 400 })');
    await page.waitForTimeout(300);
    assert.equal((await state()).turns, 1, 'the empty attic only puffs dust at level 4');
    await tapAt('({ x: g.L.door.x + g.L.door.w / 2, y: g.L.door.y + g.L.door.h / 2 })');
    await tapAt('g.L.handle');
    await page.waitForTimeout(800);
    await settle();
    await tapAt('g.L.handle');
    await page.waitForTimeout(800);
    await settle();
    assert.equal((await state()).finish, true, 'Finish after three turns');

    // Upright with the door open.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await screenshot('attic-finds-4-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    await tapFinish();
    await sticker(n);
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
    assert.deepEqual(errors, [], 'page errors');
    log(
      'Attic Finds levels 3-4: queued fast touches, Finish after three turns, the peek door free, upright with the door open',
    );
  }

  /** Attic Finds levels 5-6: a free failing try, a failing Check (one miss), a partial Check answered by one more, then done; level 6 with a requested hint on the water job (counted once), upright with a tool in the cart and the magnifier open. */
  async function atticJobsPlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          job: g.state.job,
          cart: g.state.cart.filter(Boolean),
          tools: [...g.state.tools],
          busy: g.busy,
          misses: g.misses,
          hints: g.hints,
          done: g.state.done,
          index: g.index,
        };
      });
    const idle = () =>
      page.waitForFunction(
        () => {
          const g = neo.scene.game;
          return g && (!g.busy || g.finished);
        },
        null,
        { timeout: 15000 },
      );
    const sticker = (n) =>
      page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });
    const tapTool = async (id) => {
      await page.evaluate((id) => kit.tapOn(neo.scene.game.tools.find((t) => t.id === id).node), id);
      await page.waitForTimeout(250);
      await idle();
    };
    const toCart = async (id) => {
      await page.evaluate(async (id) => {
        const g = neo.scene.game,
          slot = g.state.cart.indexOf(null),
          p = g.L.slots[slot];
        await kit.dragTo(
          g.tools.find((t) => t.id === id).node,
          neo.scene.game.ctx.stage.toGlobal({ x: p.x, y: p.y + 40 }),
        );
      }, id);
      await page.waitForTimeout(600);
    };
    const check = async () => {
      await page.evaluate(() => kit.tapOn(neo.scene.game.checkBtn));
      await page.waitForTimeout(300);
      await idle();
    };
    const works = { leaves: ['basket', 'tray', 'pail'], acorns: ['basket', 'pail'], water: ['pail'] };

    // Level 5: the authored leaves job first.
    await launch('attic-finds', 5, 'Mia', 'school');
    await page.waitForTimeout(400);
    await idle();
    let n = await page.evaluate(() => kit.store.data.stickers.length);
    let st = await state();
    assert.equal(st.job, 'leaves', 'level 5 opens on the leaves');
    await tapTool('hoop');
    st = await state();
    assert.deepEqual([st.misses, st.hints, st.cart.length], [0, 0, 0], 'a failing try is free');
    await toCart('hoop');
    await toCart('basket');
    st = await state();
    assert.deepEqual(st.cart.sort(), ['basket', 'hoop'], 'two things in the cart');
    await check();
    st = await state();
    assert.deepEqual(
      [st.misses, st.cart],
      [1, ['basket']],
      'a failing thing in the cart is one miss, and it hops back',
    );
    await check();
    st = await state();
    assert.deepEqual([st.misses, st.done], [1, false], 'leaving out a working thing is not a miss');
    await toCart('tray');
    await check();
    await page.waitForFunction(() => neo.scene.game.index === 1 || neo.scene.game.finished, null, {
      timeout: 15000,
    });
    await idle();
    st = await state();
    assert.equal(st.job, 'acorns', 'the acorns job follows');
    for (const id of st.tools.filter((t) => works.acorns.includes(t))) await toCart(id);
    await check();
    await sticker(n);
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]),
      [1, 0],
      'level 5: one miss, no hint',
    );

    // Level 6: leaves and acorns, then a requested hint on the water job.
    await launch('attic-finds', 6, 'Mia', 'school');
    await page.waitForTimeout(400);
    await idle();
    n = await page.evaluate(() => kit.store.data.stickers.length);
    for (let j = 0; j < 3; j++) {
      st = await state();
      if (st.job === 'water') {
        await page.evaluate(() => neo.scene.game.askForHint());
        await page.waitForTimeout(150);
        await page.evaluate(() => neo.scene.game.askForHint());
        st = await state();
        assert.equal(st.hints, 1, 'a requested hint counts once per job');
        assert.equal(
          await page.evaluate(() => neo.scene.game.lens.visible),
          true,
          'the magnifier opens on the hint',
        );
        await toCart('pail');
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(500);
        await page.evaluate(() => neo.scene.game.askForHint());
        await page.waitForTimeout(400);
        await screenshot('attic-finds-6-portrait');
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(400);
      } else for (const id of st.tools.filter((t) => works[st.job].includes(t))) await toCart(id);
      await check();
      if (j < 2) {
        await page.waitForFunction((j) => neo.scene.game.index === j + 1, j, { timeout: 15000 });
        await idle();
      }
    }
    await sticker(n);
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]),
      [0, 1],
      'level 6: no miss, one hint',
    );
    assert.deepEqual(errors, [], 'page errors');
    log(
      'Attic Finds levels 5-6: free try, failing Check, one more, done; level 6 water hint counted once, upright with the magnifier',
    );
  }

  /** Attic Finds levels 7-8: a free read, a wrong level-7 Check (one miss, both copies hop back), then right; level 8 with a wrong "shows it" on the Seaside claim twice (the glow, one hint), upright with stamps pressed, then right. */
  async function atticCasePlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        const s = g.state;
        return {
          claims: [...s.claims],
          slots: [...s.slots],
          stamps: [...s.stamps],
          read: s.read.size,
          glow: s.glow,
          misses: g.misses,
          hints: g.hints,
          index: g.index,
        };
      });
    const idle = () =>
      page.waitForFunction(
        () => {
          const g = neo.scene.game;
          return g && (!g.busy || g.finished);
        },
        null,
        { timeout: 20000 },
      );
    const sticker = (n) =>
      page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });
    const read = async (id) => {
      await page.evaluate((id) => kit.tapOn(neo.scene.game.papers.find((p) => p.id === id).node), id);
      await page.waitForTimeout(400);
    };
    const toSlot = async (id, slot) => {
      await page.evaluate(
        async ([id, slot]) => {
          const g = neo.scene.game,
            p = g.L.slots[slot];
          await kit.dragTo(
            g.papers.find((t) => t.id === id).node,
            g.ctx.stage.toGlobal({ x: p.x, y: p.y + 40 }),
          );
        },
        [id, slot],
      );
      await page.waitForTimeout(500);
    };
    const stamp = async (row, kind) => {
      await page.evaluate(
        ([row, k]) => kit.tapOn(neo.scene.game.rows[row].stamps[k]),
        [row, kind === 'shown' ? 0 : 1],
      );
      await page.waitForTimeout(250);
    };
    const check = async () => {
      await page.evaluate(() => kit.tapOn(neo.scene.game.checkBtn));
      await page.waitForTimeout(400);
      await idle();
    };
    const nextBoard = (i) =>
      page
        .waitForFunction((i) => neo.scene.game.index === i || neo.scene.game.finished, i, { timeout: 20000 })
        .then(idle);
    const by = { 'hilltop-had': 'list', 'fair-cranked': 'drawing', 'shop-sold': 'poster' };

    // Level 7: the authored board (Hilltop had one, someone cranked at the fair).
    await launch('attic-finds', 7, 'Mia', 'school');
    await page.waitForTimeout(400);
    await idle();
    let n = await page.evaluate(() => kit.store.data.stickers.length);
    let st = await state();
    assert.deepEqual(st.claims, ['hilltop-had', 'fair-cranked'], 'level 7 opens on the authored board');
    await read('drawing');
    st = await state();
    assert.deepEqual(
      [st.read, st.misses, st.slots],
      [1, 0, [null, null]],
      'reading a paper is free and moves nothing',
    );
    await toSlot('drawing', 0);
    await toSlot('list', 1);
    st = await state();
    assert.deepEqual(st.slots, ['drawing', 'list'], 'copies drop into both slots');
    assert.equal(
      await page.evaluate(() => neo.scene.game.papers.length),
      3,
      'the originals stay on the table',
    );
    await check();
    st = await state();
    assert.deepEqual(
      [st.misses, st.slots],
      [1, [null, null]],
      'a wrong Check is one miss and both wrong copies hop back',
    );
    await toSlot('list', 0);
    await toSlot('drawing', 1);
    await check();
    await nextBoard(1);
    st = await state();
    for (const [i, c] of st.claims.entries()) await toSlot(by[c], i);
    await check();
    await sticker(n);
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]),
      [1, 0],
      'level 7: one miss, no hint',
    );

    // Level 8: "Seaside House had no bird box" stamped as shown, twice.
    await launch('attic-finds', 8, 'Mia', 'school');
    await page.waitForTimeout(400);
    await idle();
    n = await page.evaluate(() => kit.store.data.stickers.length);
    st = await state();
    assert.deepEqual(
      st.claims,
      ['hilltop-had', 'seaside-none', 'all-loved'],
      'level 8 opens on the authored board',
    );
    await check();
    assert.equal((await state()).misses, 0, 'a Check with no stamps is never a miss');
    await stamp(0, 'shown');
    await stamp(1, 'shown');
    await stamp(2, 'unknown');
    await check();
    st = await state();
    assert.deepEqual(
      [st.misses, st.stamps, st.glow],
      [1, ['shown', null, 'unknown'], false],
      'one wrong stamp pops off; the right ones stay',
    );
    await stamp(1, 'shown');
    await check();
    st = await state();
    assert.deepEqual(
      [st.misses, st.hints, st.glow],
      [2, 1, true],
      'the second miss lights the answer, one hint',
    );
    await stamp(1, 'unknown');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await screenshot('attic-finds-8-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    await check();
    await nextBoard(1);
    st = await state();
    for (const [i, c] of st.claims.entries()) await stamp(i, by[c] ? 'shown' : 'unknown');
    await check();
    await sticker(n);
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]),
      [2, 1],
      'level 8: two misses, one hint',
    );

    // Level 9: the starting captions Checked (a miss), then a copy in the question slot (a miss and the glow), then right.
    const ex = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        const s = g.state;
        return {
          captions: [...s.captions],
          chosen: s.chosen,
          glow: s.glow,
          open: g.open,
          misses: g.misses,
          hints: g.hints,
          rows: [...g.round.rows],
          question: g.round.question,
          offered: [...g.round.offered],
        };
      });
    const tapRow = async (i) => {
      await page.evaluate((i) => kit.tapOn(neo.scene.game.rows[i].card), i);
      await page.waitForTimeout(300);
    };
    const tapStrip = async (caption) => {
      await page.evaluate((c) => {
        const g = neo.scene.game;
        const k = g.round.strips[g.round.rows[g.open]].indexOf(c);
        kit.tapOn(g.strip[k].node);
      }, caption);
      await page.waitForTimeout(300);
    };
    const tapNew = async (id) => {
      await page.evaluate((id) => kit.tapOn(neo.scene.game.offered.find((o) => o.id === id).node), id);
      await page.waitForTimeout(300);
    };
    const supported = { love: 'shop-said', cranking: 'fair-cranked', homes: 'hilltop-had' };
    await launch('attic-finds', 9, 'Mia', 'school');
    await page.waitForTimeout(400);
    await idle();
    n = await page.evaluate(() => kit.store.data.stickers.length);
    let e = await ex();
    assert.deepEqual(
      [e.question, e.rows, e.captions],
      ['seaside', ['love', 'cranking', 'homes'], ['all-loved', 'crank-every-home', 'every-house']],
      'level 9 opens on the authored exhibit',
    );
    await check();
    assert.equal((await ex()).misses, 0, 'a Check with no paper for the question is never a miss');
    await tapNew('seaside-list');
    await check();
    e = await ex();
    assert.deepEqual(
      [e.misses, e.chosen, e.open, e.captions[0]],
      [1, 'seaside-list', 0, 'all-loved'],
      'the starting captions are one miss; the useful paper stays and the first strip opens',
    );
    for (const [i, row] of e.rows.entries()) {
      if (e.open !== i) await tapRow(i);
      await tapStrip(supported[row]);
      e = await ex();
    }
    assert.deepEqual(
      e.captions,
      ['shop-said', 'fair-cranked', 'hilltop-had'],
      'each row takes the caption the papers show',
    );
    const copy = e.offered.find((p) => p.endsWith('-copy'));
    await tapNew(copy);
    await check();
    e = await ex();
    assert.deepEqual(
      [e.misses, e.hints, e.glow, e.chosen],
      [2, 1, true, null],
      'a copy cannot answer: the second miss, the glow, one hint; the copy hops back',
    );
    await screenshot('attic-finds-9-landscape-glow');
    await tapRow(1);
    assert.equal((await ex()).open, 1, 'a strip opens');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    assert.equal((await ex()).open, 1, 'the strip stays open across the turn');
    await screenshot('attic-finds-9-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    await tapRow(1);
    await tapNew('seaside-list');
    await check();
    await sticker(n);
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]),
      [2, 1],
      'level 9: two misses, one hint',
    );
    assert.deepEqual(errors, [], 'page errors');
    log(
      'Attic Finds levels 7-9: free read, wrong Check then right; Seaside "shows it" twice, the glow, upright with stamps, then right; the exhibit with overclaims, then a copy, the glow, a strip upright, then right',
    );
  }

  return { atticLeverPlay, atticJobsPlay, atticCasePlay };
}
