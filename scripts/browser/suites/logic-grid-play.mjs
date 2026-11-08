import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function logicGridPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('logic-grid').history.at(-1);
        return [r.misses, r.hints];
      });
    const tally = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);
    const idle = () =>
      page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 30000 });
    // Taps a grid square through its real control.
    const tapSquare = (i) =>
      page.evaluate((i) => {
        const g = neo.scene.game;
        kit.tapOn(g.cells[i], 50 * neo.view.scale, 50 * neo.view.scale);
      }, i);
    // Plays the rest of the round as the ghost finger would.
    const playOut = async () => {
      for (let n = 0; n < 60; n++) {
        await idle();
        await page.waitForTimeout(300);
        if (await page.evaluate(() => neo.scene.finished === true)) return;
        // Level 8's bot may slide the grid first; hit-testing reads the last frame, so the tap waits a frame or two.
        await page.evaluate(() => {
          window.__lgIntent = neo.scene.game.autotouch();
        });
        await page.waitForTimeout(80);
        await page.evaluate(() => {
          const intent = window.__lgIntent;
          if (intent?.tap)
            kit.tapOn(intent.tap.on, intent.tap.x * neo.view.scale, intent.tap.y * neo.view.scale);
        });
      }
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    // LOGICGRID_FROM=3 skips the level 1–2 plays; LOGICGRID_FROM=5 plays levels 5–6; LOGICGRID_FROM=6 plays levels 6–7; LOGICGRID_FROM=7 plays levels 7–8; LOGICGRID_FROM=8 plays level 8 alone.
    const from = Number(process.env.LOGICGRID_FROM ?? 1);
    // Every target's bounds in logical units, the smallest side, and whether any reaches the pet's corner (x < 160, bottom 220).
    const fitNow = () =>
      page.evaluate(() => {
        const g = neo.scene.game,
          v = neo.view;
        const boxes = [...g.cells, ...g.friendCards, ...g.clueCards, g.help].map((o) => {
          const b = o.getBounds();
          return { x: b.x / v.scale, y: b.y / v.scale, w: b.width / v.scale, h: b.height / v.scale };
        });
        return {
          min: Math.min(...boxes.map((b) => Math.min(b.w, b.h))),
          bottom: Math.max(...boxes.map((b) => b.y + b.h)),
          right: Math.max(...boxes.map((b) => b.x + b.w)),
          w: v.w,
          h: v.h,
          pet: boxes.some((b) => b.x < 160 && b.y + b.h > v.h - 220),
        };
      });
    let s;
    if (from <= 4) {
      if (from <= 2) {
        // Level 1: a yes one clue rules out is one miss once it rests; Help points (one hint); the rest by the bot's taps.
        await launch('logic-grid', 1);
        await idle();
        await page.waitForTimeout(400);
        s = await page.evaluate(() => {
          const g = neo.scene.game;
          return { boards: g.boards.length, clues: g.current.clues.length, cells: g.cells.length };
        });
        assert.deepEqual(
          s,
          { boards: 2, clues: 2, cells: 6 },
          'level 1: two boards of two clues on a 2 by 3 grid',
        );
        const wrong = await page.evaluate(() => neo.scene.game.wrongYes());
        assert.ok(wrong >= 0, 'a square a clue rules out');
        await tapSquare(wrong);
        await page.waitForTimeout(300);
        assert.deepEqual(await tally(), [0, 0], 'not judged before it rests');
        await page.waitForTimeout(2800);
        assert.deepEqual(await tally(), [1, 0], 'a ruled-out yes is one miss once it rests');
        await page.evaluate(() => kit.tapOn(neo.scene.game.help));
        await page.waitForTimeout(400);
        assert.deepEqual(await tally(), [1, 1], 'Help counts one hint');
        await page.evaluate(() => kit.tapOn(neo.scene.game.help));
        await page.waitForTimeout(400);
        assert.deepEqual(await tally(), [1, 1], 'the second press marks the square with no second hint');
        await playOut();
        await finished('logic-grid');
        assert.deepEqual(await score(), [1, 1], 'level 1 saved 1 miss, 1 hint');

        // Level 2: tapping through yes to no on the not clue's square is free; a portrait look; both boards by the bot.
        await launch('logic-grid', 2);
        await idle();
        await page.waitForTimeout(400);
        const not = await page.evaluate(() => {
          const b = neo.scene.game.current;
          const c = b.clues.find((x) => x.kind === 'not');
          return { kinds: b.clues.map((x) => x.kind), sq: c.friend * b.places.length + c.place };
        });
        assert.deepEqual(not.kinds, ['direct', 'not'], 'level 2: one clue says where, one says not');
        await tapSquare(not.sq);
        await page.waitForTimeout(250);
        await tapSquare(not.sq);
        await page.waitForTimeout(2800);
        assert.deepEqual(await tally(), [0, 0], 'yes on the way to no is never counted');
        assert.equal(await page.evaluate((i) => neo.scene.game.marks[i], not.sq), 2, 'the square is a no');
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(800);
        let fit = await page.evaluate(() => {
          const g = neo.scene.game,
            v = neo.view;
          const boxes = [...g.cells, ...g.friendCards, ...g.clueCards, g.help].map((o) => {
            const b = o.getBounds();
            return { x: b.x / v.scale, y: b.y / v.scale, w: b.width / v.scale, h: b.height / v.scale };
          });
          return {
            min: Math.min(...boxes.map((b) => Math.min(b.w, b.h))),
            bottom: Math.max(...boxes.map((b) => b.y + b.h)),
            right: Math.max(...boxes.map((b) => b.x + b.w)),
            w: v.w,
            h: v.h,
          };
        });
        assert.ok(fit.min >= 96, `targets stay about 100 units (${fit.min})`);
        assert.ok(fit.bottom <= fit.h && fit.right <= fit.w, 'everything fits upright');
        await screenshot('logic-grid-2-portrait');
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(500);
        await playOut();
        await finished('logic-grid');
        assert.deepEqual(await score(), [0, 0], 'level 2 saved no misses or hints');
        log(
          'Mystery Grid 1 and 2: a resting ruled-out yes is one miss, Help points then marks (one hint), yes-to-no is free, portrait fits, both levels to the sticker, passed',
        );
      }

      // Level 3: three friends, three places, the ball; a ruled-out yes is one miss, Help one hint, landscape and portrait fit.
      await launch('logic-grid', 3);
      await idle();
      await page.waitForTimeout(400);
      s = await page.evaluate(() => {
        const g = neo.scene.game,
          b = g.current;
        return {
          boards: g.boards.length,
          cells: g.cells.length,
          thing: b.thing,
          n: b.clues.length,
          direct: b.clues.filter((c) => c.kind === 'direct').length,
          hats: !!b.hats,
        };
      });
      assert.equal(s.boards, 1);
      assert.equal(s.cells, 9);
      assert.equal(s.thing, 'ball');
      assert.equal(s.hats, false);
      assert.ok(
        s.n >= 3 && s.n <= 4 && s.direct <= 1,
        `level 3: 3–4 clues, at most one direct (${s.n}, ${s.direct})`,
      );
      let fit = await fitNow();
      assert.ok(
        fit.min >= 96 && fit.bottom <= fit.h && fit.right <= fit.w && !fit.pet,
        `level 3 fits landscape clear of the pet (${JSON.stringify(fit)})`,
      );
      const wrong3 = await page.evaluate(() => neo.scene.game.wrongYes());
      assert.ok(wrong3 >= 0, 'a square a clue rules out');
      await tapSquare(wrong3);
      await page.waitForTimeout(3100);
      assert.deepEqual(await tally(), [1, 0], 'level 3: a ruled-out yes is one miss once it rests');
      await page.evaluate(() => kit.tapOn(neo.scene.game.help));
      await page.waitForTimeout(400);
      assert.deepEqual(await tally(), [1, 1], 'level 3: Help counts one hint');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(800);
      fit = await fitNow();
      assert.ok(
        fit.min >= 96 && fit.bottom <= fit.h && fit.right <= fit.w && !fit.pet,
        `level 3 fits upright clear of the pet (${JSON.stringify(fit)})`,
      );
      await screenshot('logic-grid-3-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);
      await playOut();
      await finished('logic-grid');
      assert.deepEqual(await score(), [1, 1], 'level 3 saved 1 miss, 1 hint');

      // Level 4: every clue names a friend by hat; the hats differ; the bot plays it out clean.
      await launch('logic-grid', 4);
      await idle();
      await page.waitForTimeout(400);
      s = await page.evaluate(() => {
        const b = neo.scene.game.current;
        return { hats: b.hats, all: b.clues.every((c) => c.hat), n: b.clues.length };
      });
      assert.ok(
        s.all && s.hats && new Set(s.hats).size === 3,
        `level 4: three different hats and every clue names one (${JSON.stringify(s)})`,
      );
      await screenshot('logic-grid-4-landscape');
      await playOut();
      await finished('logic-grid');
      assert.deepEqual(await score(), [0, 0], 'level 4 saved no misses or hints');
      log(
        'Mystery Grid 3 and 4: 3 by 3 with the ball, a ruled-out yes is one miss, Help one hint, landscape and portrait fit clear of the pet, hat clues, both to the sticker, passed',
      );
    }

    if (from <= 5) {
      // Level 5: two blocks (where and what) sharing the friend rows; a ruled-out yes is one miss, Help one hint, landscape and
      // portrait fit clear of the pet, then the bot plays it out (including a "not the one with" step) to the sticker.
      await launch('logic-grid', 5);
      await idle();
      await page.waitForTimeout(400);
      s = await page.evaluate(() => {
        const g = neo.scene.game,
          b = g.current;
        return {
          cells: g.cells.length,
          thing: b.thing,
          items: b.items?.length,
          n: b.clues.length,
          apart: b.clues.filter((c) => c.kind === 'apart').length,
          hat: b.clues.some((c) => c.hat),
        };
      });
      assert.equal(s.cells, 18);
      assert.equal(s.thing, 'kite');
      assert.equal(s.items, 3);
      assert.ok(
        s.n >= 4 && s.n <= 5 && s.apart >= 1 && s.hat,
        `level 5: 4–5 clues, a not-the-one-with clue and a hat clue (${JSON.stringify(s)})`,
      );
      let fit5 = await fitNow();
      assert.ok(
        fit5.min >= 96 && fit5.bottom <= fit5.h && fit5.right <= fit5.w && !fit5.pet,
        `level 5 fits landscape clear of the pet (${JSON.stringify(fit5)})`,
      );
      const wrong5 = await page.evaluate(() => neo.scene.game.wrongYes());
      assert.ok(wrong5 >= 0, 'a square a clue rules out');
      await tapSquare(wrong5);
      await page.waitForTimeout(3100);
      assert.deepEqual(await tally(), [1, 0], 'level 5: a ruled-out yes is one miss once it rests');
      await page.evaluate(() => kit.tapOn(neo.scene.game.help));
      await page.waitForTimeout(400);
      assert.deepEqual(await tally(), [1, 1], 'level 5: Help counts one hint');
      await screenshot('logic-grid-5-landscape');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(800);
      fit5 = await fitNow();
      assert.ok(
        fit5.min >= 96 && fit5.bottom <= fit5.h && fit5.right <= fit5.w && !fit5.pet,
        `level 5 fits upright clear of the pet (${JSON.stringify(fit5)})`,
      );
      await screenshot('logic-grid-5-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);
      await playOut();
      await finished('logic-grid');
      assert.deepEqual(await score(), [1, 1], 'level 5 saved 1 miss, 1 hint');
      log(
        'Mystery Grid 5: two blocks with the kite, a ruled-out yes is one miss, Help one hint, landscape and portrait fit clear of the pet, to the sticker, passed',
      );
    }

    if (from <= 6) {
      // Level 6: one 4 by 4 with either-or and neither-nor clues; a yes an either-or clue rules out by itself is one miss, Help one
      // hint, landscape and portrait fit clear of the pet, then the bot plays it out to the sticker.
      await launch('logic-grid', 6);
      await idle();
      await page.waitForTimeout(400);
      s = await page.evaluate(() => {
        const g = neo.scene.game,
          b = g.current;
        return {
          cells: g.cells.length,
          thing: b.thing,
          n: b.clues.length,
          kinds: b.clues.map((c) => c.kind),
          hats: b.hats?.length,
          hat: b.clues.some((c) => c.hat),
        };
      });
      assert.equal(s.cells, 16);
      assert.equal(s.thing, 'kite');
      assert.equal(s.hats, 4);
      assert.ok(
        s.n >= 4 &&
          s.n <= 6 &&
          s.kinds.includes('either') &&
          s.kinds.includes('neither') &&
          !s.kinds.includes('direct') &&
          s.hat,
        `level 6: 4–6 clues with either-or, neither-nor and a hat clue (${JSON.stringify(s)})`,
      );
      let fit6 = await fitNow();
      assert.ok(
        fit6.min >= 96 && fit6.bottom <= fit6.h && fit6.right <= fit6.w && !fit6.pet,
        `level 6 fits landscape clear of the pet (${JSON.stringify(fit6)})`,
      );
      // A square only an either-or clue rules out: the friend's place outside its two.
      const wrong6 = await page.evaluate(() => {
        const b = neo.scene.game.current,
          c = b.clues.find((x) => x.kind === 'either');
        const p = [0, 1, 2, 3].find((p) => p !== c.place && p !== c.or);
        return c.friend * 4 + p;
      });
      await tapSquare(wrong6);
      await page.waitForTimeout(3100);
      assert.deepEqual(
        await tally(),
        [1, 0],
        'level 6: a yes an either-or clue rules out is one miss once it rests',
      );
      await page.evaluate(() => kit.tapOn(neo.scene.game.help));
      await page.waitForTimeout(400);
      assert.deepEqual(await tally(), [1, 1], 'level 6: Help counts one hint');
      await screenshot('logic-grid-6-landscape');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(800);
      fit6 = await fitNow();
      assert.ok(
        fit6.min >= 96 && fit6.bottom <= fit6.h && fit6.right <= fit6.w && !fit6.pet,
        `level 6 fits upright clear of the pet (${JSON.stringify(fit6)})`,
      );
      await screenshot('logic-grid-6-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);
      await playOut();
      await finished('logic-grid');
      assert.deepEqual(await score(), [1, 1], 'level 6 saved 1 miss, 1 hint');
      log(
        'Mystery Grid 6: a 4 by 4 with either-or and neither-nor clues, a ruled-out yes is one miss, Help one hint, landscape and portrait fit clear of the pet, to the sticker, passed',
      );
    }

    if (from <= 7) {
      // Level 7 (grown-up): the case file, three linked 4 by 4 blocks at 64 units and a written clue list; a ruled-out yes is one
      // miss, Help one hint, landscape and portrait fit clear of the pet at 64, then the bot plays it out to the sticker.
      await launch('logic-grid', 7);
      await idle();
      await page.waitForTimeout(400);
      s = await page.evaluate(() => {
        const g = neo.scene.game,
          b = g.current;
        return {
          cells: g.cells.length,
          thing: b.thing,
          items: b.items?.length,
          n: b.clues.length,
          cs: g.cs,
          hat: b.clues.some((c) => c.hat),
        };
      });
      assert.equal(s.cells, 48);
      assert.equal(s.thing, 'basket');
      assert.equal(s.items, 4);
      assert.equal(s.cs, 64);
      assert.ok(s.n >= 5 && s.n <= 8 && s.hat, `level 7: 5–8 clues with a hat clue (${JSON.stringify(s)})`);
      let fit7 = await fitNow();
      assert.ok(
        fit7.min >= 63 && fit7.bottom <= fit7.h && fit7.right <= fit7.w && !fit7.pet,
        `level 7 fits landscape clear of the pet (${JSON.stringify(fit7)})`,
      );
      const wrong7 = await page.evaluate(() => neo.scene.game.wrongYes());
      assert.ok(wrong7 >= 0, 'a square a clue rules out');
      await page.evaluate((i) => {
        const g = neo.scene.game;
        kit.tapOn(g.cells[i], 32 * neo.view.scale, 32 * neo.view.scale);
      }, wrong7);
      await page.waitForTimeout(3100);
      assert.deepEqual(await tally(), [1, 0], 'level 7: a ruled-out yes is one miss once it rests');
      await page.evaluate(() => kit.tapOn(neo.scene.game.help));
      await page.waitForTimeout(400);
      assert.deepEqual(await tally(), [1, 1], 'level 7: Help counts one hint');
      await screenshot('logic-grid-7-landscape');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(800);
      fit7 = await fitNow();
      assert.ok(
        fit7.min >= 63 && fit7.bottom <= fit7.h && fit7.right <= fit7.w && !fit7.pet,
        `level 7 fits upright clear of the pet (${JSON.stringify(fit7)})`,
      );
      await screenshot('logic-grid-7-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);
      await playOut();
      await finished('logic-grid');
      assert.deepEqual(await score(), [1, 1], 'level 7 saved 1 miss, 1 hint');
      log(
        'Mystery Grid 7: the case file, three linked blocks at 64 and written clues, a ruled-out yes is one miss, Help one hint, landscape and portrait fit clear of the pet, to the sticker, passed',
      );
    }

    // Level 8 (grown-up): three 5 by 5 blocks with a time row, under a sliding window. The window and its visible targets fit
    // clear of the pet at 64 in both orientations; a drag on a header slides the grid; a ruled-out yes is one miss; Help is one
    // hint and slides its square into view; the bot plays it out.
    await launch('logic-grid', 8);
    await idle();
    await page.waitForTimeout(400);
    s = await page.evaluate(() => {
      const g = neo.scene.game,
        b = g.current;
      return {
        cells: g.cells.length,
        items: b.items,
        n: b.clues.length,
        cs: g.cs,
        kinds: b.clues.map((c) => c.kind),
      };
    });
    assert.equal(s.cells, 75);
    assert.equal(s.cs, 64);
    assert.deepEqual(s.items, ['dawn', 'morning', 'noon', 'afternoon', 'evening']);
    assert.ok(
      s.n >= 7 && s.n <= 9 && s.kinds.includes('order') && s.kinds.includes('pair'),
      `level 8: 7–9 clues with order and pair clues (${JSON.stringify(s)})`,
    );
    // Only what the window shows is a target: the visible squares, the clue list and Help.
    const fit8 = () =>
      page.evaluate(() => {
        const g = neo.scene.game,
          v = neo.view;
        const boxes = [...g.cells.filter((_, i) => g.inView(i)), ...g.clueCards, g.help].map((o) => {
          const b = o.getBounds();
          return { x: b.x / v.scale, y: b.y / v.scale, w: b.width / v.scale, h: b.height / v.scale };
        });
        return {
          shown: g.cells.filter((_, i) => g.inView(i)).length,
          min: Math.min(...boxes.map((b) => Math.min(b.w, b.h))),
          bottom: Math.max(...boxes.map((b) => b.y + b.h)),
          right: Math.max(...boxes.map((b) => b.x + b.w)),
          w: v.w,
          h: v.h,
          pet: boxes.some((b) => b.x < 160 && b.y + b.h > v.h - 220),
          overlap: g.clueCards.some(
            (c, i) => i > 0 && c.y < g.clueCards[i - 1].y + 64 && c.x === g.clueCards[i - 1].x,
          ),
        };
      });
    let f8 = await fit8();
    assert.ok(
      f8.shown >= 25 &&
        f8.shown < 75 &&
        f8.min >= 63 &&
        f8.bottom <= f8.h &&
        f8.right <= f8.w &&
        !f8.pet &&
        !f8.overlap,
      `level 8 fits landscape clear of the pet (${JSON.stringify(f8)})`,
    );
    // A tap on a hidden square does nothing; a drag on the first friend's header slides the grid.
    const hidden = await page.evaluate(() =>
      neo.scene.game.cells.findIndex((_, i) => !neo.scene.game.inView(i)),
    );
    await page.evaluate((i) => neo.scene.game.tapSquare(i), hidden);
    assert.equal(
      await page.evaluate((i) => neo.scene.game.marks[i], hidden),
      0,
      'a square outside the window takes no mark',
    );
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const p = g.friendCards[0].getGlobalPosition();
      const s = neo.view.scale;
      await kit.drag(kit.line([p.x + 50 * s, p.y + 30 * s], [p.x + 50 * s, p.y - 200 * s], 12));
    });
    await page.waitForTimeout(300);
    const slid = await page.evaluate(() => [neo.scene.game.scrollX, neo.scene.game.scrollY]);
    assert.ok(slid[1] > 0, `a drag up on a friend header slides the grid down (${slid})`);
    await page.evaluate(() => neo.scene.game.setScroll(0, 0));
    const wrong8 = await page.evaluate(() => neo.scene.game.wrongYes());
    assert.ok(wrong8 >= 0, 'a square a clue rules out');
    await page.evaluate((i) => neo.scene.game.reveal(i), wrong8);
    await page.evaluate((i) => {
      const g = neo.scene.game;
      kit.tapOn(g.cells[i], 32 * neo.view.scale, 32 * neo.view.scale);
    }, wrong8);
    await page.waitForTimeout(3100);
    assert.deepEqual(await tally(), [1, 0], 'level 8: a ruled-out yes is one miss once it rests');
    await page.evaluate(() => kit.tapOn(neo.scene.game.help));
    await page.waitForTimeout(400);
    assert.deepEqual(await tally(), [1, 1], 'level 8: Help counts one hint');
    assert.ok(
      await page.evaluate(() => {
        const g = neo.scene.game;
        return g.inView(g.next().square);
      }),
      'Help slides its square into view',
    );
    await screenshot('logic-grid-8-landscape');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    f8 = await fit8();
    assert.ok(
      f8.shown >= 25 && f8.min >= 63 && f8.bottom <= f8.h && f8.right <= f8.w && !f8.pet && !f8.overlap,
      `level 8 fits upright clear of the pet (${JSON.stringify(f8)})`,
    );
    await screenshot('logic-grid-8-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await playOut();
    await finished('logic-grid');
    assert.deepEqual(await score(), [1, 1], 'level 8 saved 1 miss, 1 hint');
    log(
      'Mystery Grid 8: three 5 by 5 blocks with a time row under a sliding window, a header drag slides it, a ruled-out yes is one miss, Help one hint in view, landscape and portrait fit clear of the pet, to the sticker, passed',
    );
  }
  return { logicGridPlay };
}
