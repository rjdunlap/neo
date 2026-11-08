import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  /** Jar Sort by touch: level 1's pair, level 9's bright jars, misses, a hint, a drag and undo at 3, upright looks, level 10's little jar, level 8's mats. */
  async function jarSortPlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          busy: g.busy,
          misses: g.misses,
          hints: g.hints,
          lifted: g.lifted,
          hinted: !!g.hinted,
          board: g.board.map((j) => j.join('')).join('|'),
          index: g.index,
        };
      });
    const idle = () =>
      page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, {
        timeout: 15000,
      });
    const jarPoint = (i) =>
      page.evaluate((i) => {
        const j = neo.scene.game.jars[i];
        return j.carrier.toGlobal({ x: 0, y: -j.spot.hit.h / 2 });
      }, i);
    const tapJar = async (i) => {
      const p = await jarPoint(i);
      await page.evaluate(({ x, y }) => kit.tap(x, y), p);
      await page.waitForTimeout(160);
    };
    /** Plays the solver's way out by taps until the round ends. */
    const solveAll = async () => {
      for (let guard = 0; guard < 200 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
        await idle();
        if (await page.evaluate(() => neo.scene.finished)) break;
        const m = await page.evaluate(async () => {
          const L = await import('/src/games/jar-sort/logic.ts'),
            g = neo.scene.game;
          return g.busy ? null : (L.solve(g.board, g.caps, g.labels)?.[0] ?? null);
        });
        if (!m) {
          await page.waitForTimeout(250);
          continue;
        }
        await tapJar(m.from);
        await tapJar(m.to);
        await page.waitForTimeout(450);
      }
      await page.waitForFunction(() => neo.scene.finished, null, { timeout: 20000 });
    };
    /** A move that is refused (a different kind on top, or full), from a jar with something to lift. */
    const refusedPair = () =>
      page.evaluate(async () => {
        const L = await import('/src/games/jar-sort/logic.ts'),
          g = neo.scene.game;
        for (let f = 0; f < g.board.length; f++)
          for (let t = 0; t < g.board.length; t++)
            if (L.refusal(g.board, g.caps, f, t)) return { from: f, to: t };
        return null;
      });
    // Level 1: a seeded authored pair; a refused move under lit jars is free; a tap on the ground sets a lifted fruit back.
    await launch('jar-sort', 1);
    await idle();
    const stickers = await page.evaluate(() => kit.store.data.stickers.length);
    let st = await state();
    const first = st.board;
    assert.equal(
      await page.evaluate(async () => {
        const L = await import('/src/games/jar-sort/logic.ts'),
          g = neo.scene.game;
        return L.solve(g.board, g.plan.cap).length;
      }),
      2,
      'level 1 opens with a two-move board',
    );
    const full = st.board.split('|').findIndex((j) => j.length > 0);
    await tapJar(full);
    assert.equal((await state()).lifted, full, 'a tap lifts the top fruit');
    await page.evaluate(() => kit.tap((neo.view.w / 2) * neo.view.scale, (neo.view.h - 30) * neo.view.scale));
    await page.waitForTimeout(200);
    assert.equal((await state()).lifted, null, 'a tap on the ground sets it back');
    const refused1 = await refusedPair();
    assert.ok(refused1, 'level 1 has a refused move to try');
    await tapJar(refused1.from);
    await tapJar(refused1.to);
    await page.waitForTimeout(400);
    st = await state();
    assert.deepEqual(
      [st.misses, st.board],
      [0, first],
      'a refused move at level 1 is free and changes nothing',
    );
    await solveAll();
    st = await state();
    assert.deepEqual([st.misses, st.hints], [0, 0]);
    await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers, { timeout: 15000 });
    // Level 9: level 3's four jars and three kinds with the lit jars still on; a refused move is free, as at 1 and 2.
    const stickers9 = await page.evaluate(() => kit.store.data.stickers.length);
    await launch('jar-sort', 9);
    await idle();
    st = await state();
    assert.equal(st.board.split('|').length, 4, 'level 9 has four jars');
    const lifted9 = st.board.split('|').findIndex((j) => j.length > 0);
    await tapJar(lifted9);
    assert.ok(await page.evaluate(() => neo.scene.game.plan.lit), 'level 9 keeps the bright jars on');
    await page.evaluate(() => kit.tap((neo.view.w / 2) * neo.view.scale, (neo.view.h - 30) * neo.view.scale));
    await page.waitForTimeout(200);
    const refused9 = await refusedPair();
    assert.ok(refused9, 'level 9 has a refused move to try');
    const before9 = (await state()).board;
    await tapJar(refused9.from);
    await tapJar(refused9.to);
    await page.waitForTimeout(400);
    st = await state();
    assert.deepEqual(
      [st.misses, st.board],
      [0, before9],
      'a refused move at level 9 is free and changes nothing',
    );
    await screenshot('jar-sort-9-landscape');
    await solveAll();
    st = await state();
    assert.deepEqual([st.misses, st.hints], [0, 0]);
    await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers9, {
      timeout: 15000,
    });
    // Level 3: a refused move is one miss; the second lights the hint once; a drag moves a fruit like two taps; undo takes it back.
    await launch('jar-sort', 3);
    await idle();
    for (let k = 1; k <= 2; k++) {
      const pair = await refusedPair();
      assert.ok(pair, 'level 3 has a refused move to try');
      await tapJar(pair.from);
      await tapJar(pair.to);
      await page.waitForTimeout(400);
      st = await state();
      assert.equal(st.misses, k, `refused move ${k} is a miss`);
    }
    assert.deepEqual([st.hints, st.hinted], [1, true], 'the second miss lights the hint move once');
    const legalMove = await page.evaluate(async () => {
      const L = await import('/src/games/jar-sort/logic.ts'),
        g = neo.scene.game;
      return L.moves(g.board, g.caps)[0];
    });
    const before = (await state()).board;
    const a = await jarPoint(legalMove.from),
      b = await jarPoint(legalMove.to);
    await page.evaluate(({ a, b }) => kit.drag(kit.line([a.x, a.y], [b.x, b.y + 40 * neo.view.scale], 14)), {
      a,
      b,
    });
    await page.waitForTimeout(600);
    await idle();
    st = await state();
    assert.notEqual(st.board, before, 'a drag from jar to jar moves the fruit');
    assert.equal(st.misses, 2, 'a legal move is never a miss');
    await page.evaluate(() => neo.scene.game.undoButton.press());
    await page.waitForTimeout(300);
    assert.equal((await state()).board, before, 'the round arrow takes it back');
    assert.deepEqual(errors, [], 'page errors');
    // Level 3 upright in the rain look (relaunched until the round picks it): the pantry window, a blue lid colour, jars clear.
    await page.setViewportSize({ width: 768, height: 1024 });
    for (let i = 0; i < 12; i++) {
      await launch('jar-sort', 3);
      await idle();
      if ((await page.evaluate(() => neo.scene.game.look)) === 'rain') break;
    }
    assert.equal(await page.evaluate(() => neo.scene.game.look), 'rain');
    await page.waitForTimeout(400);
    await screenshot('jar-sort-3-rain-portrait');
    // Level 7 upright: seven jars in two rows, one screenshot.
    await launch('jar-sort', 7);
    await idle();
    await page.waitForTimeout(400);
    await screenshot('jar-sort-7-portrait');
    // Level 10 upright: four tall jars and a little jar of two. Two fruit fill it, a third is refused as full (one miss, no lid),
    // the round arrow takes both back, and the solver's way finishes the round.
    const stickers10 = await page.evaluate(() => kit.store.data.stickers.length);
    await launch('jar-sort', 10);
    await idle();
    await page.waitForTimeout(400);
    await screenshot('jar-sort-10-portrait');
    const fill = await page.evaluate(async () => {
      const L = await import('/src/games/jar-sort/logic.ts'),
        g = neo.scene.game;
      const little = g.caps.indexOf(2);
      for (let a = 0; a < g.board.length; a++) {
        if (!L.legal(g.board, g.caps, a, little)) continue;
        const after = L.move(g.board, a, little);
        for (let b = 0; b < after.length; b++)
          if (L.legal(after, g.caps, b, little)) return { little, a, b, heights: g.caps };
      }
      return null;
    });
    assert.ok(fill, 'two fruit can fill the little jar');
    assert.equal(fill.heights.filter((c) => c === 2).length, 1, 'one little jar among four tall ones');
    await tapJar(fill.a);
    await tapJar(fill.little);
    await page.waitForTimeout(500);
    await idle();
    await tapJar(fill.b);
    await tapJar(fill.little);
    await page.waitForTimeout(500);
    await idle();
    st = await state();
    assert.equal(st.board.split('|')[fill.little].length, 2, 'the little jar holds two');
    assert.equal(
      await page.evaluate((i) => neo.scene.game.jars[i].lid.visible, fill.little),
      false,
      'a full little jar takes no lid',
    );
    const third = st.board.split('|').findIndex((j, i) => i !== fill.little && j.length > 0);
    const before10 = st.board;
    await tapJar(third);
    await tapJar(fill.little);
    await page.waitForTimeout(400);
    st = await state();
    assert.deepEqual([st.misses, st.board], [1, before10], 'a third fruit on the little jar is refused, one miss');
    for (let k = 0; k < 2; k++) {
      await page.evaluate(() => neo.scene.game.undoButton.press());
      await page.waitForTimeout(300);
    }
    assert.equal((await state()).board.split('|')[fill.little], '', 'undo empties the little jar again');
    await solveAll();
    st = await state();
    assert.equal(st.misses, 1);
    await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers10, {
      timeout: 15000,
    });
    await page.setViewportSize({ width: 1024, height: 768 });
    // Level 8: mats; solved by taps, no misses or hints, one more sticker.
    const stickers8 = await page.evaluate(() => kit.store.data.stickers.length);
    await launch('jar-sort', 8);
    await idle();
    assert.equal(
      await page.evaluate(() => neo.scene.game.labels.filter((k) => k !== null).length),
      4,
      'four jars stand on mats',
    );
    await solveAll();
    st = await state();
    assert.deepEqual([st.misses, st.hints], [0, 0]);
    await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, stickers8, {
      timeout: 15000,
    });
    assert.deepEqual(errors, [], 'page errors');
    log(
      'Jar Sort: a seeded level 1 pair, level 9 and level 8 solved by taps, refused moves (free at 1 and 9, misses at 3), a hint, a drag, undo, level 3 upright in the rain look, level 7 upright, level 10 upright with a refused third fruit on the little jar',
    );
  }

  return { jarSortPlay };
}
