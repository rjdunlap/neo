import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
  /** Second Chance Shed: level 1 with an empty-yard drop (never counted) then every scrap to the worms; level 4 with one wrong place (the reason), a requested hint (the glow), a portrait screenshot with all four places, then every thing to its place. */
  async function shedPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('second-chance-shed').history.at(-1);
        return [r.misses, r.hints];
      });
    const settle = async () => {
      await page.waitForTimeout(300);
      await page.waitForFunction(
        () => neo.scene.finished || (!neo.scene.game.busy && neo.scene.game.item),
        null,
        { timeout: 25000 },
      );
      await page.waitForTimeout(250);
    };
    const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
    const dropOn = (place) =>
      page.evaluate(async (place) => {
        const g = neo.scene.game;
        const target = (place ? g.places.find((p) => p.place === place).node : g.cart).getGlobalPosition();
        await kit.dragTo(g.item.node, place ? target : { x: target.x - 300, y: target.y + 120 });
      }, place);
    const playOut = async () => {
      for (let i = 0; i < 8; i++) {
        await settle();
        if (await page.evaluate(() => neo.scene.finished || neo.scene.game.finished)) break;
        await dropOn(
          await page.evaluate(async () => {
            const L = await import('/src/games/second-chance-shed/logic.ts');
            return L.ITEMS[neo.scene.game.item.id].place;
          }),
        );
      }
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('second-chance-shed', 1);
    await settle();
    const first = await page.evaluate(() => neo.scene.game.item.id);
    await dropOn(null);
    await page.waitForTimeout(700);
    assert.deepEqual(
      [await page.evaluate(() => neo.scene.game.item?.id), ...(await tally())],
      [first, 0, 0],
      'an empty-yard drop floats back, uncounted',
    );
    await playOut();
    await finished('second-chance-shed');
    assert.deepEqual(await score(), [0, 0]);
    await launch('second-chance-shed', 4);
    await settle();
    const wrong = await page.evaluate(async () => {
      const L = await import('/src/games/second-chance-shed/logic.ts');
      const own = L.ITEMS[neo.scene.game.item.id].place;
      return L.PLACES.find((p) => p !== own);
    });
    await dropOn(wrong);
    await page.waitForTimeout(700);
    assert.deepEqual(await tally(), [1, 0], 'a wrong place is one miss');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    assert.deepEqual(
      [...(await tally()), await page.evaluate(() => neo.scene.game.tally.glowing)],
      [1, 1, true],
      'Show a hint glows and counts once',
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('second-chance-shed-4-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    // U7 R4: a right drop's made line never holds the shed. Each `shed.made.*` is stretched to at least 4 s here, so the
    // next thing opening sooner shows the line no longer gates it; that thing's name waits for the line to end.
    await page.evaluate(() => {
      const g = neo.scene.game;
      const say = g.ctx.say.bind(g.ctx);
      g.madeLines = [];
      g.ctx.say = (id, vars) => {
        const line = say(id, vars);
        const rec0 = g.madeLines.at(-1);
        if (/^shed\.(item|arrive)\./.test(String(id)) && rec0 && rec0.named === undefined)
          rec0.named = performance.now() - rec0.at;
        if (!String(id).startsWith('shed.made.')) return line;
        const index = g.index;
        const rec = { at: performance.now(), last: index + 1 >= g.round.items.length };
        g.madeLines.push(rec);
        const watch = () => {
          if (rec.opens !== undefined) return;
          if (g.finished || (!g.busy && g.item && g.index > index)) rec.opens = performance.now() - rec.at;
          else if (performance.now() - rec.at < 10000) requestAnimationFrame(watch);
        };
        void Promise.resolve().then(watch);
        return Promise.all([line, kit.sleep(4000)]).then(() => undefined);
      };
    });
    await playOut();
    await finished('second-chance-shed');
    assert.deepEqual(await score(), [1, 1]);
    const made = await page.evaluate(() =>
      neo.scene.game.madeLines.map((r) => ({
        last: r.last,
        opens: Math.round(r.opens ?? -1),
        named: Math.round(r.named ?? -1),
      })),
    );
    const early = made.filter((r) => !r.last);
    if (!early.length || early.some((r) => r.opens < 0 || r.opens > 1500))
      throw new Error(`R4: a made line held the next thing: ${JSON.stringify(made)}`);
    // A name said at all comes after the made line (the suite drops at once, so most are skipped as no longer news).
    if (early.some((r) => r.named >= 0 && r.named < 3900))
      throw new Error(`R4: the next thing's name cut the made line: ${JSON.stringify(made)}`);
    log(
      `Second Chance Shed 4 R4: the next thing opened ${early.map((r) => r.opens).join(', ')} ms into a made line`,
    );
    log(
      'Second Chance Shed 1 and 4: empty-yard drop uncounted, worms fed, wrong place miss, requested glow hint, portrait, saved score passed',
    );
  }

  /**
   * Second Chance Shed 5–6: level 5 with the tin in Remake (a failed ring, then the same plan rung again counting nothing), then the
   * tin to the friend; level 6 with the tempting plan, two failed rings and the glow, Show a hint then Show me one, a portrait screenshot.
   */
  async function shedPlanPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('second-chance-shed').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () => page.evaluate(() => neo.scene.game.state);
    const settle = async () => {
      await page.waitForTimeout(300);
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 25000 });
      await page.waitForTimeout(200);
    };
    const put = (id, spot) =>
      page
        .evaluate(
          async ([id, spot]) => {
            const g = neo.scene.game;
            const t = g.things[g.round.items.indexOf(id)];
            const f = spot === 'f0' ? 0 : spot === 'f1' ? 1 : -1;
            const at =
              f >= 0 ? g.friends[f].node.getGlobalPosition() : g.places.get(spot).getGlobalPosition();
            await kit.dragTo(t.node, f >= 0 ? { x: at.x, y: at.y + 105 * neo.view.scale } : at);
          },
          [id, spot],
        )
        .then(() => page.waitForTimeout(350));
    const ring = () =>
      page.evaluate(() => kit.tapOn(neo.scene.game.bell)).then(() => page.waitForTimeout(400));
    const home = (id) =>
      page.evaluate(
        async (id) => (await import('/src/games/second-chance-shed/logic.ts')).ITEMS[id].place,
        id,
      );
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    await launch('second-chance-shed', 5, 'Mia', 'school');
    await settle();
    let s = await state();
    assert.equal(s.level, 5);
    assert.deepEqual(s.requests, ['pencils']);
    await ring();
    assert.deepEqual([(await state()).misses], [0], 'ringing with everything on the cart is free');
    for (const id of s.items) if (id !== 'tin') await put(id, await home(id));
    await put('tin', 'remake');
    s = await state();
    assert.equal(s.spots[s.items.indexOf('tin')], 'remake');
    await ring();
    assert.deepEqual(
      [(await state()).misses, (await state()).hints],
      [1, 0],
      'the tin in Remake leaves the pencils friend empty: one miss',
    );
    await ring();
    assert.equal((await state()).misses, 1, 'ringing again on the same plan counts nothing');
    await put('tin', 'f0');
    s = await state();
    assert.equal(s.spots[s.items.indexOf('tin')], 'f0', 'the tin is with the pencils friend');
    await ring();
    assert.equal((await state()).finished, true, 'the plan works: the bell finishes the round');
    await page.waitForFunction(() => neo.scene.finished === true, null, { timeout: 60000 });
    assert.deepEqual(await score(), [1, 0], 'level 5 saved 1 miss, 0 hints');

    await launch('second-chance-shed', 6, 'Mia', 'school');
    await settle();
    s = await state();
    const both = s.items.find((id) => id === 'box' || id === 'tub');
    const pencils = s.requests.indexOf('pencils') === 0 ? 'f0' : 'f1';
    const other = pencils === 'f0' ? 'f1' : 'f0';
    for (const id of s.items) if (id !== both && id !== 'tin') await put(id, await home(id));
    await put(both, pencils);
    await put('tin', 'shelf');
    await ring();
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.glowing],
      [1, 0, false],
      'the tempting plan: the other friend has nothing, one miss',
    );
    await put('tin', other);
    await ring();
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.glowing],
      [2, 1, true],
      'the tin with the wrong friend: second miss, the glow, one hint',
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('second-chance-shed-6-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.equal((await state()).hints, 1, 'Show a hint on the glowing round adds nothing');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(500);
    s = await state();
    assert.equal(s.hints, 2, 'Show me one counts a hint');
    assert.equal(s.spots[s.items.indexOf('tin')], pencils, 'Show me one gave the tin to the pencils friend');
    assert.equal(s.spots[s.items.indexOf(both)], 'cart', 'the swap sent the both-fit thing back to the cart');
    await put(both, other);
    await ring();
    assert.equal((await state()).finished, true, 'the pairing works: the bell finishes the round');
    await page.waitForFunction(() => neo.scene.finished === true, null, { timeout: 60000 });
    assert.deepEqual(await score(), [2, 2], 'level 6 saved 2 misses, 2 hints');
    log(
      'Second Chance Shed 5–6: free cart ring, tin in Remake (1 miss, unchanged ring free), tin to the friend; tempting plan and the tin on the wrong friend (2 misses, glow), Show a hint then Show me one (swap), portrait, finish 2/2; passed',
    );
  }

  /**
   * Second Chance Shed 7–8 (Picnic Loop): level 7 with a cup carried to lunch unwashed (a failed ring, then the unchanged board
   * rung again counting nothing), then both washes and the finish; level 8 with the mug at every picnic (the promise), the mug
   * cut back to the handover's tub (an empty-seat ring, free), one-use cups filled in (the painter still waiting: second miss and
   * the glow), a portrait screenshot of the full board, Show a hint then Show me one, then the ghost finger's drags to the finish.
   */
  async function shedPicnicPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('second-chance-shed').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () => page.evaluate(() => neo.scene.game.state);
    const settle = async () => {
      await page.waitForTimeout(300);
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 30000 });
      await page.waitForTimeout(200);
    };
    const seat = (picnic, k) => ({ at: 'seat', picnic, seat: k });
    const tub = (t, slot) => ({ at: 'tub', tub: t, slot });
    /** Drag a washable (by id) or a new one-use cup ('one') to a stop, the finger on the stop's centre. */
    const put = (who, stop) =>
      page
        .evaluate(
          async ([who, stop]) => {
            const L = await import('/src/games/second-chance-shed/logic.ts');
            const g = neo.scene.game;
            const node = who === 'one' ? g.top.node : g.vessels[who].node;
            const c = L.centre(L.stopRect(g.layoutNow, stop));
            await kit.dragTo(node, g.cupLayer.toGlobal(c));
          },
          [who, stop],
        )
        .then(() => page.waitForTimeout(320));
    const ring = () =>
      page.evaluate(() => kit.tapOn(neo.scene.game.bell)).then(() => page.waitForTimeout(450));
    /** The ghost finger's next drag, performed; false once it would ring the bell. */
    const ghost = () =>
      page
        .evaluate(async () => {
          const g = neo.scene.game;
          const i = g.autotouch();
          if (!i || i.tap) return false;
          await kit.dragTo(i.drag.on, i.to.on.toGlobal({ x: i.to.x, y: i.to.y }));
          return true;
        })
        .then(async (more) => (await page.waitForTimeout(320), more));
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    await launch('second-chance-shed', 7, 'Mia', 'school');
    await settle();
    let s = await state();
    assert.deepEqual([s.level, s.picnics, s.after], [7, 2, null]);
    for (const [k, v] of ['red', 'blue', 'yellow', 'mug'].entries()) await put(v, seat(0, k));
    await put('red', seat(1, 0));
    for (const k of [1, 2, 3]) await put('one', seat(1, k));
    s = await state();
    assert.deepEqual(s.plan.routes.red, [seat(0, 0), seat(1, 0)], 'red was carried straight to lunch');
    assert.equal(s.check, 'unwashed');
    await ring();
    assert.deepEqual([(await state()).misses, (await state()).hints], [1, 0], 'the unwashed carry: one miss');
    await ring();
    assert.equal((await state()).misses, 1, 'ringing again on the unchanged board counts nothing');
    await put('red', tub(0, 0));
    s = await state();
    assert.deepEqual(s.plan.routes.red, [seat(0, 0), tub(0, 0)], 'into the tub: the breakfast ring stays');
    await put('red', seat(1, 0));
    await put('blue', tub(0, 1));
    await put('blue', seat(1, 1));
    s = await state();
    assert.deepEqual([s.heap, s.check], [2, 'ok'], 'two washed cups at lunch: two on the heap');
    await ring();
    assert.equal((await state()).finished, true, 'the board works: the bell finishes the round');
    await page.waitForFunction(() => neo.scene.finished === true, null, { timeout: 60000 });
    assert.deepEqual(await score(), [1, 0], 'level 7 saved 1 miss, 0 hints');

    await launch('second-chance-shed', 8, 'Mia', 'school');
    await settle();
    s = await state();
    assert.deepEqual([s.level, s.picnics], [8, 3]);
    const after = s.after;
    for (const [k, v] of ['red', 'blue', 'yellow', 'mug'].entries()) await put(v, seat(0, k));
    for (const [k, v] of [
      [2, 'yellow'],
      [3, 'mug'],
    ]) {
      await put(v, tub(0, k - 2));
      await put(v, seat(1, k));
      await put(v, tub(1, k - 2));
      await put(v, seat(2, k));
    }
    for (const p of [1, 2]) for (const k of [0, 1]) await put('one', seat(p, k));
    s = await state();
    assert.deepEqual(
      [s.heap, s.check],
      [4, 'promise'],
      'the mug at every picnic: four on the heap, the promise broken',
    );
    await ring();
    await ring();
    assert.deepEqual(
      [(await state()).misses, (await state()).hints],
      [1, 0],
      'one miss; the unchanged ring counts nothing',
    );
    await put('mug', tub(after, 1));
    s = await state();
    assert.equal(s.check, 'emptySeat');
    await ring();
    assert.equal((await state()).misses, 1, 'a ring with an empty seat is free');
    for (let p = after + 1; p < 3; p++) await put('one', seat(p, 3));
    s = await state();
    assert.equal(s.check, 'unmet');
    await ring();
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.glowing],
      [2, 1, true],
      'the painter still waits: second miss, the glow',
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('second-chance-shed-8-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.equal((await state()).hints, 1, 'Show a hint on the glowing round adds nothing');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(500);
    s = await state();
    assert.equal(s.hints, 2, 'Show me one counts a hint');
    if (after === 1)
      assert.deepEqual(s.plan.routes.mug.at(-1), { at: 'painter' }, 'case A: Show me one hands the mug over');
    for (let i = 0; i < 12 && (await ghost()); i++);
    assert.equal((await state()).check, 'ok', 'the ghost finger reaches a working board');
    await ring();
    assert.equal((await state()).finished, true);
    await page.waitForFunction(() => neo.scene.finished === true, null, { timeout: 60000 });
    assert.deepEqual(await score(), [2, 2], 'level 8 saved 2 misses, 2 hints');
    log(
      `Second Chance Shed 7–8: unwashed carry (1 miss, unchanged ring free), washes, finish 1/0; level 8 case ${after === 1 ? 'A' : 'B'}: promise miss, empty-seat ring free, painter waiting (2 misses, glow), portrait, Show a hint then Show me one, ghost finger to the finish 2/2; passed`,
    );
  }

  return { shedPlay, shedPlanPlay, shedPicnicPlay };
}
