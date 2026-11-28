import assert from 'node:assert/strict';
export function createSuite({
  page,
  launch,
  finished,
  screenshot,
  log,
  scene,
  ready,
  pickFirst,
  turnToGame,
}) {
  const state = () =>
    page.evaluate(() => {
      const g = neo.scene.game;
      return {
        frame: g.state.frame,
        history: g.state.history,
        misses: g.misses,
        hints: g.hints,
        busy: g.busy,
        finished: g.finished,
        case: g.round.id,
      };
    });
  const wait = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.game.finished);
  const drag = async (from, to) => {
    await page.evaluate(
      async ({ from, to }) => {
        const g = neo.scene.game,
          o = g.objects.find((o) => o.source === from),
          p = g.boxes.friends[g.state.frame.friends.findIndex((f) => f.id === to)],
          end = g.toys.toGlobal({ x: p.x, y: p.y + 40 });
        await kit.dragTo(o.node, end, 22);
      },
      { from, to },
    );
    await page.waitForTimeout(1050);
    await wait();
  };
  const next = () =>
    page.evaluate(async () => {
      const g = neo.scene.game,
        { hint } = await import('/src/games/swap-meet/logic.ts');
      return hint(g.round, g.state);
    });
  const solve = async () => {
    for (let i = 0; i < 5 && !(await state()).finished; i++) {
      const a = await next();
      assert.ok(a);
      if (a.undo) await tapUndo();
      else await drag(a.from, a.to);
    }
  };
  const tapUndo = async () => {
    await page.evaluate(() => kit.tapOn(neo.scene.game.undo));
    await page.waitForTimeout(1050);
    await wait();
  };
  const targets = async () => {
    const result = await page.evaluate(() => {
      const g = neo.scene.game;
      for (const control of [g.undo, g.help]) {
        const p = control.getGlobalPosition(),
          hit = g.ctx.renderer.events.rootBoundary.hitTest(p.x, p.y);
        if (hit !== control) throw Error('shell intercepts swap control');
      }
      return g.objects
        .filter((o) => o.drag)
        .map((o) => {
          const p = o.node.toGlobal({ x: -60, y: -60 }),
            q = o.node.toGlobal({ x: 60, y: 60 });
          return { w: (q.x - p.x) / neo.view.scale, h: (q.y - p.y) / neo.view.scale };
        });
    });
    assert.ok(result.length);
    for (const r of result) {
      assert.ok(r.w >= 100 && r.h >= 100, JSON.stringify(r));
    }
  };
  async function swapMeetPlay() {
    // SWAPMEET_LEVELS=5,6 plays only those levels (levels 1–4 and the routes are recorded passing on unchanged code).
    const only = process.env.SWAPMEET_LEVELS?.split(',').map(Number);
    if (!only || only.some((l) => l <= 4)) await earlyLevels();
    if (!only || only.includes(5)) await levelFive();
    if (!only || only.includes(6)) await levelSix();
  }
  const fetchState = () =>
    page.evaluate(() => {
      const g = neo.scene.game;
      return {
        frame: g.state.frame,
        history: g.state.history,
        misses: g.misses,
        hints: g.hints,
        busy: g.busy,
        finished: g.finished,
        case: g.round.id,
        goal: g.round.goal,
        glowing: g.tally.glowing,
      };
    });
  const settle = async () => {
    await page.waitForTimeout(1050);
    await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.game.finished);
  };
  const nextAction = () =>
    page.evaluate(async () => {
      const g = neo.scene.game,
        { hint } = await import('/src/games/swap-meet/logic.ts');
      return hint(g.round, g.state);
    });
  /** Drag the object at a place (`b0` the basket, `f<i>` a friend) to a board point, through real pointer input. */
  const dragAt = async (at, x, y) => {
    await page.evaluate(
      async ({ at, x, y }) => {
        const g = neo.scene.game,
          o = g.objects.find((o) => o.at === at);
        await kit.dragTo(o.node, g.toys.toGlobal({ x, y }), 22);
      },
      { at, x, y },
    );
    await settle();
  };
  const toFriend = (id) =>
    page.evaluate((id) => {
      const g = neo.scene.game,
        p = g.boxes.friends[g.state.frame.friends.findIndex((f) => f.id === id)];
      return { x: p.x, y: p.y + 40 };
    }, id);
  const giveTo = async (id) => {
    const p = await toFriend(id);
    await dragAt('b0', p.x, p.y);
  };
  const play = async (a) => {
    if (a.undo) {
      await page.evaluate(() => kit.tapOn(neo.scene.game.undo));
      await settle();
    } else if (a.sell) {
      const p = await page.evaluate(() => neo.scene.game.boxes.stall);
      await dragAt('b0', p.x, p.y + 40);
    } else if (a.buy !== undefined) {
      const p = await page.evaluate((i) => neo.scene.game.boxes.shelf[i], a.buy);
      await dragAt('b0', p.x, p.y + 40);
    } else await giveTo(a.to);
  };
  async function levelFive() {
    for (const variant of [0, 1]) {
      let s;
      for (let i = 0; i < 12; i++) {
        await launch('swap-meet', 5);
        s = await fetchState();
        if (variant === 0 || s.case !== levelFive.first) break;
      }
      levelFive.first ??= s.case;
      const side = s.frame.friends.find(
        (f) => f.hold !== s.goal && !s.frame.friends.some((g) => g.want === f.hold),
      );
      // Follow the solver until the side friend wants what the basket carries, then take the tempting side trade.
      for (let i = 0; i < 3 && (await fetchState()).frame.basket[0].hold !== side.want; i++)
        await play(await nextAction());
      await giveTo(side.id);
      s = await fetchState();
      assert.equal(s.frame.basket[0].hold, side.hold, 'the side trade is legal');
      assert.equal(s.misses, 0, 'the side trade is never a miss');
      // Two deliberate offers at the dead end: each counts, and the second glows the back arrow.
      const other = s.frame.friends.find((f) => !f.done);
      await giveTo(other.id);
      await giveTo(other.id);
      s = await fetchState();
      assert.deepEqual([s.misses, s.hints, s.glowing], [2, 1, true]);
      assert.deepEqual(await nextAction(), { undo: true });
      const depth = s.history.length;
      await play({ undo: true });
      assert.equal((await fetchState()).history.length, depth - 1);
      for (let i = 0; i < 6 && !(await fetchState()).finished; i++) await play(await nextAction());
      await finished('swap-meet');
      s = await fetchState();
      assert.deepEqual([s.misses, s.hints], [2, 1]);
      assert.ok(!s.frame.friends.find((f) => f.id === side.id).done, 'the side friend may stay waiting');
    }
    log(
      'Swap Meet 5: both chains, the side trade and its dead end, rejections, the back-arrow glow and Undo passed',
    );
  }
  async function levelSix() {
    await launch('swap-meet', 6);
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.equal((await fetchState()).hints, 1);
    for (let i = 0; i < 3; i++) await play(await nextAction());
    await page.waitForFunction(() => neo.scene.game.state.frame.stage === 1 && !neo.scene.game.busy);
    let s = await fetchState();
    assert.equal(s.history.length, 0, 'Undo never crosses into the first stage');
    assert.deepEqual(await nextAction(), { sell: true }, 'the hint points to the stall');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await screenshot('swap-meet-6-stall-upright');
    await play({ sell: true });
    s = await fetchState();
    assert.equal(s.frame.basket[0].hold, 'purse');
    // The purse on a friend is one rejected offer; on the stall away from its goods it comes back free.
    await giveTo(s.frame.friends[0].id);
    assert.equal((await fetchState()).misses, 1);
    const stall = await page.evaluate(() => neo.scene.game.boxes.stall);
    await dragAt('b0', stall.x, stall.y - 20);
    s = await fetchState();
    assert.deepEqual([s.frame.basket[0].hold, s.misses], ['purse', 1]);
    const buy = s.frame.stall.shelf.indexOf(s.goal);
    await play({ buy });
    await page.waitForFunction(() => neo.scene.game.cards.children.length === 3);
    s = await fetchState();
    assert.equal(s.frame.basket[0].hold, s.goal);
    // The question is unscored: Help records nothing; any card answers, then the round finishes.
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.deepEqual([(await fetchState()).misses, (await fetchState()).hints], [1, 1]);
    // Turning the phone while the question waits draws the cards again rather than leaving the round stuck.
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForFunction(() => neo.scene.game.cards.children.length === 3);
    await page.evaluate(() => kit.tapOn(neo.scene.game.cards.children[1]));
    await finished('swap-meet');
    assert.deepEqual([(await fetchState()).misses, (await fetchState()).hints], [1, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Swap Meet 6: barter stage, empty Undo at the stall, sell, purse misses and free return, buy, unscored question passed',
    );
  }
  async function earlyLevels() {
    await launch('swap-meet', 1);
    await targets();
    let s = await state();
    const to = s.frame.friends[0].id,
      wrong = s.frame.basket.findIndex((b) => b.hold !== s.frame.friends[0].want);
    // Press, empty drop and native cancellation over a matching receiver are free.
    await page.evaluate(() => {
      const g = neo.scene.game;
      kit.tapOn(g.objects.find((o) => o.drag).node);
    });
    await page.waitForTimeout(550);
    assert.equal((await state()).misses, 0);
    await page.evaluate(async () => {
      const g = neo.scene.game,
        o = g.objects.find((o) => o.drag),
        p = o.node.getGlobalPosition();
      await kit.dragTo(o.node, { x: p.x + 220, y: p.y + 90 }, 20);
    });
    await page.waitForTimeout(550);
    assert.equal((await state()).history.length, 0);
    await page.evaluate(async () => {
      const g = neo.scene.game,
        { hint } = await import('/src/games/swap-meet/logic.ts'),
        a = hint(g.round, g.state),
        o = g.objects.find((o) => o.source === a.from),
        p = o.node.getGlobalPosition(),
        r = g.boxes.friends[0],
        q = g.toys.toGlobal({ x: r.x, y: r.y + 40 }),
        canvas = document.querySelector('canvas');
      const e = { pointerId: 84, pointerType: 'touch', bubbles: true, isPrimary: true };
      canvas.dispatchEvent(new PointerEvent('pointerdown', { ...e, clientX: p.x, clientY: p.y }));
      await kit.sleep(200);
      canvas.dispatchEvent(new PointerEvent('pointermove', { ...e, clientX: q.x, clientY: q.y }));
      await kit.sleep(100);
      window.dispatchEvent(new PointerEvent('pointercancel', { ...e, clientX: q.x, clientY: q.y }));
      canvas.dispatchEvent(new PointerEvent('pointerup', { ...e, clientX: q.x, clientY: q.y }));
    });
    await page.waitForTimeout(550);
    assert.equal((await state()).history.length, 0);
    await page.evaluate(
      async ({ wrong, to }) => {
        const g = neo.scene.game,
          o = g.objects.find((o) => o.source === wrong),
          p = o.node.getGlobalPosition(),
          r = g.boxes.friends[0],
          q = g.toys.toGlobal({ x: r.x, y: r.y + 40 }),
          canvas = document.querySelector('canvas'),
          e = { pointerId: 85, pointerType: 'touch', bubbles: true, isPrimary: true };
        canvas.dispatchEvent(new PointerEvent('pointerdown', { ...e, clientX: p.x, clientY: p.y }));
        await kit.sleep(200);
        canvas.dispatchEvent(
          new PointerEvent('pointerdown', {
            ...e,
            pointerId: 86,
            isPrimary: false,
            clientX: p.x,
            clientY: p.y,
          }),
        );
        window.dispatchEvent(new PointerEvent('pointercancel', { ...e, pointerId: 86, isPrimary: false }));
        canvas.dispatchEvent(new PointerEvent('pointermove', { ...e, clientX: q.x, clientY: q.y }));
        await kit.sleep(120);
        canvas.dispatchEvent(new PointerEvent('pointerup', { ...e, clientX: q.x, clientY: q.y }));
      },
      { wrong, to },
    );
    await page.waitForTimeout(600);
    assert.equal(
      await page.evaluate(() => neo.scene.game.tally.streak),
      1,
      'a second pointer cancellation must not steal the active offer',
    );
    await drag(wrong, to);
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.history.length], [0, 1, 0]);
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.equal((await state()).hints, 1);
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForFunction(() => neo.scene.game.state.frame.stage === 1, {}, { timeout: 15000 });
    await wait();
    await tapUndo();
    assert.equal((await state()).frame.stage, 0);
    assert.equal((await state()).hints, 1);
    await solve();
    await finished('swap-meet');
    assert.deepEqual([(await state()).misses, (await state()).hints], [0, 1]);
    await launch('swap-meet', 2);
    await targets();
    s = await state();
    const bad = s.frame.basket.findIndex((b) => b.hold !== s.frame.friends[0].want);
    await drag(bad, s.frame.friends[0].id);
    assert.equal((await state()).misses, 1);
    const a = await next();
    await drag(a.from, a.to);
    const snapshot = await state();
    await tapUndo();
    assert.equal((await state()).history.length, 0);
    await solve();
    await finished('swap-meet');
    assert.equal(snapshot.history.length, 1);
    await launch('swap-meet', 3);
    await targets();
    await screenshot('swap-meet-3-landscape');
    s = await state();
    const source = s.frame.friends[0],
      incompatible = s.frame.friends.find((f) => f.id !== source.id && f.want !== source.hold);
    await drag(source.id, incompatible.id);
    assert.equal((await state()).misses, 1);
    const pair = await next();
    await drag(pair.to, pair.from);
    assert.equal((await state()).frame.friends.filter((f) => f.done).length, 2);
    await tapUndo();
    assert.equal((await state()).frame.friends.filter((f) => f.done).length, 0);
    await solve();
    await finished('swap-meet');
    const variants = new Set();
    for (let i = 0; i < 12 && variants.size < 2; i++) {
      await launch('swap-meet', 4);
      s = await state();
      if (variants.has(s.case)) continue;
      variants.add(s.case);
      const a = await next();
      const wrong = s.frame.friends.find((f) => f.id !== a.to);
      await drag(a.from, wrong.id);
      await drag(a.from, wrong.id);
      assert.deepEqual([(await state()).misses, (await state()).hints], [2, 1]);
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(400);
      await targets();
      if (variants.size === 1) await screenshot('swap-meet-4-hint-portrait');
      await drag(a.from, a.to);
      await tapUndo();
      assert.equal((await state()).history.length, 0);
      assert.equal((await state()).hints, 1);
      await page.evaluate(() => neo.scene.game.askForHint());
      assert.equal((await state()).hints, 1);
      await solve();
      await finished('swap-meet');
      await page.setViewportSize({ width: 1024, height: 768 });
    }
    assert.equal(variants.size, 2, 'both authored chain cases played');
    // Leaving during an accepted animation cannot save a late round.
    await launch('swap-meet', 4);
    const old = await page.evaluate(() => kit.store.stats('swap-meet').plays);
    await page.evaluate(async () => {
      const g = neo.scene.game,
        a = g.autotouch(),
        p = a.to.on.toGlobal({ x: a.to.x, y: a.to.y + 40 });
      await kit.dragTo(a.drag.on, p, 20);
      neo.go.land('cozy-village');
    });
    await scene('LandScene');
    await page.waitForTimeout(900);
    assert.equal(await page.evaluate(() => kit.store.stats('swap-meet').plays), old);
    // Real page, playBand and return origins through classic and root Places.
    await page.evaluate(() => {
      kit.store.entry.birth = null;
      kit.store.entry.startBand = 'prek';
      kit.store.data.profile.band = 'prek';
      neo.go.land('cozy-village');
    });
    await scene('LandScene');
    await turnToGame('swap-meet');
    const cp = await page.evaluate(() => neo.scene.page);
    await page.evaluate(() => kit.tapOn(neo.scene.showing.find((m) => m.mod.id === 'swap-meet').node));
    await scene('GameScene');
    assert.equal(await page.evaluate(() => neo.scene.band), 'prek');
    await page.evaluate(() => neo.scene.home.press());
    await scene('LandScene');
    assert.equal(await page.evaluate(() => neo.scene.page), cp);
    // Explore's All games (the age places retired with classic/) holds it for her age.
    assert.ok(
      await page.evaluate(
        async ([band, id]) => {
          const { allGames } = await import('/src/content/explore.ts');
          const { GAMES } = await import('/src/games/registry.ts');
          const { LANDS } = await import('/src/content/lands.ts');
          return allGames(band, GAMES, LANDS).some((g) => g.id === id);
        },
        ['prek', 'swap-meet'],
      ),
      "swap-meet is among Explore's games",
    );
    await page.goto(new URL('/', process.env.GAME_URL).href);
    await ready();
    await scene('ChooserScene');
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
      neo.go.start();
    });
    await pickFirst();
    await scene('HomeScene');
    await page.evaluate(() => neo.go.explore('places'));
    await scene('MapScene');
    await page.evaluate(() => kit.tapOn(neo.scene.lands.find((l) => l.def.id === 'cozy-village').node));
    await scene('LocationScene');
    await turnToGame('swap-meet');
    const rp = await page.evaluate(() => neo.scene.page);
    await page.evaluate(() => kit.tapOn(neo.scene.showing.find((m) => m.mod.id === 'swap-meet').node));
    await scene('GameScene');
    await page.evaluate(() => neo.scene.home.press());
    await scene('LocationScene');
    assert.equal(await page.evaluate(() => neo.scene.page), rp);
    log(
      'Swap Meet 1–4: requests/returns, reciprocal directions, both chains, Undo across visits, free inspection/cancel, misses/capped help, supported ghost action, transformed targets, portrait, cleanup and classic/root origins passed',
    );
  }
  return { swapMeetPlay };
}
