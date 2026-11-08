import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished, next }) {
  async function sudokuTouchPlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          busy: g.busy,
          n: g.n,
          misses: g.misses,
          hints: g.hints,
          cursor: g.cursor,
          empty: g.grid.filter((d) => !d).length,
          hinted: !!g.hinted,
          noting: g.noting,
          notes: g.notes.slice(),
        };
      });
    const idle = () =>
      page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 15000 });
    const tapCell = (i) =>
      page.evaluate((i) => {
        const g = neo.scene.game,
          p = g.board.toGlobal(g.center(i));
        kit.tap(p.x, p.y);
      }, i);
    const tapSlot = (match) =>
      page.evaluate((match) => {
        const g = neo.scene.game,
          s = g.slots.find((s) => s.kind === match.kind && (match.d === undefined || s.d === match.d)),
          p = g.touchLayer.toGlobal({ x: s.x + s.w / 2, y: s.y + s.h / 2 });
        kit.tap(p.x, p.y);
      }, match);
    const fillAll = async () => {
      for (let guard = 0; guard < 120 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
        await idle();
        const next = await page.evaluate(() => {
          const g = neo.scene.game,
            i = g.grid.findIndex((d) => !d);
          return i < 0 ? null : { i, d: g.puzzle.solution[i] };
        });
        if (!next) {
          await page.waitForTimeout(300);
          continue;
        }
        await tapCell(next.i);
        await page.waitForTimeout(60);
        await tapSlot({ kind: 'digit', d: next.d });
        await page.waitForTimeout(120);
      }
    };
    /** Every square and every tray target at least 64 logical units, on screen, apart from one another. */
    const targets = (label) =>
      page.evaluate((label) => {
        const g = neo.scene.game,
          out = [],
          scale = neo.view.scale;
        if (g.cell < 64) out.push(`cell ${g.cell}`);
        const bed = { x: g.board.x, y: g.board.y, w: g.n * g.cell, h: g.n * g.cell };
        const rects = g.slots.map((s) => ({ name: `${s.kind}${s.d || ''}`, x: s.x, y: s.y, w: s.w, h: s.h }));
        for (const r of rects) {
          if (r.w < 64 || r.h < 64) out.push(`${r.name} small ${r.w}x${r.h}`);
          if (r.x < 0 || r.y < 0 || r.x + r.w > neo.view.w || r.y + r.h > neo.view.h)
            out.push(`${r.name} off screen`);
          if (r.x < bed.x + bed.w && bed.x < r.x + r.w && r.y < bed.y + bed.h && bed.y < r.y + r.h)
            out.push(`${r.name} over the bed`);
        }
        for (let i = 0; i < rects.length; i++)
          for (let j = i + 1; j < rects.length; j++) {
            const a = rects[i],
              b = rects[j];
            if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h)
              out.push(`${a.name} overlaps ${b.name}`);
          }
        if (bed.x < 0 || bed.y < 0 || bed.x + bed.w > neo.view.w || bed.y + bed.h > neo.view.h)
          out.push('bed off screen');
        return out.map((m) => `${label}: ${m} (${neo.view.w}x${neo.view.h}, scale ${scale})`);
      }, label);
    // Level 8 (9 by 9, the top): a bed that needs a crossing pair of rows. Hints are asked for, and each hinted number placed,
    // until the hint is the X-Wing one (two lines lit, four corners ringed); then the bed is filled to its sticker. `SUDOKU_ONLY=8`.
    if (process.env.SUDOKU_ONLY === '8') {
      // About a quarter of beds free every square through a later pair or pointing line, so their hints name that step instead:
      // such a bed is played to its sticker and another is opened, up to three.
      let wing = null,
        asked = 0,
        stickers = 0;
      for (let bed = 0; bed < 3 && !wing; bed++) {
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(300);
        await launch('sudoku-garden', 8);
        await idle();
        stickers = await page.evaluate(() => kit.store.data.stickers.length);
        assert.deepEqual(
          await page.evaluate(() => [
            neo.scene.game.n,
            neo.scene.game.puzzle.blanks,
            neo.scene.game.puzzle.grade,
          ]),
          [9, 55, 4],
        );
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(500);
        assert.deepEqual(await targets('level 8 portrait'), []);
        asked = 0;
        for (; asked < 55 && !wing && !(await page.evaluate(() => neo.scene.finished)); asked++) {
          await idle();
          await tapSlot({ kind: 'hint' });
          await page.waitForTimeout(300);
          const h = await page.evaluate(() => {
            const h = neo.scene.game.hinted;
            return (
              h && {
                kind: h.kind,
                cell: h.cell,
                digit: h.digit,
                tech: h.via?.tech,
                corners: h.via?.pattern?.length,
                lines: h.via?.lines?.length,
              }
            );
          });
          assert.ok(h && h.kind !== 'fix' && h.kind !== 'few', `hint ${asked + 1} names a reason`);
          if (h.tech === 'xwing') {
            wing = h;
            break;
          }
          await tapCell(h.cell);
          await page.waitForTimeout(60);
          await tapSlot({ kind: 'digit', d: h.digit });
          await page.waitForTimeout(120);
        }
        if (!wing) await finished('sudoku-garden');
      }
      assert.ok(wing, 'a hint explains the crossing pair of rows');
      assert.deepEqual([wing.corners, wing.lines], [4, 2]);
      await page.waitForTimeout(400);
      await screenshot('sudoku-touch-8-xwing-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);
      await fillAll();
      await finished('sudoku-garden');
      assert.equal(
        await page.evaluate(() => kit.store.data.stickers.length),
        stickers + 1,
        'one sticker for the crossing-rows bed',
      );
      const r = await page.evaluate(() => {
        const r = kit.store.stats('sudoku-garden').history.at(-1);
        return [r.level, r.misses, r.hints];
      });
      assert.deepEqual(r, [8, 0, asked + 1]);
      assert.deepEqual(errors, []);
      log(
        `Sudoku Garden touch level 8: the X-Wing hint on hint ${asked + 1} (four corners, two lines), 64-unit targets upright, one sticker passed`,
      );
      return;
    }
    // Level 10 (6 by 6 cage bed): a wrong number is one miss, then hints are asked for, each hinted number placed, until one
    // names a cage (its last square, or the sets that make its sum); then the bed is filled to its sticker. `SUDOKU_ONLY=10`.
    if (process.env.SUDOKU_ONLY === '10') {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(300);
      await launch('sudoku-garden', 10);
      await idle();
      const stickers = await page.evaluate(() => kit.store.data.stickers.length);
      assert.deepEqual(
        await page.evaluate(() => [
          neo.scene.game.n,
          neo.scene.game.puzzle.blanks,
          neo.scene.game.puzzle.grade,
          neo.scene.game.geo.cages.length > 0,
          neo.scene.game.cell,
        ]),
        [6, 30, 2, true, 92],
      );
      assert.deepEqual(await targets('level 10 landscape'), []);
      const wrong = await page.evaluate(() => {
        const g = neo.scene.game,
          i = g.grid.findIndex((d) => !d);
        return { i, d: (g.puzzle.solution[i] % g.n) + 1 };
      });
      await tapCell(wrong.i);
      await page.waitForTimeout(100);
      await tapSlot({ kind: 'digit', d: wrong.d });
      await page.waitForTimeout(200);
      assert.equal((await state()).misses, 1, 'a wrong number on a cage bed is one miss');
      await tapSlot({ kind: 'erase' });
      await page.waitForTimeout(200);
      await tapSlot({ kind: 'marks' });
      await tapCell(wrong.i);
      for (const d of [1, 2, 3, 4, 5, 6]) await tapSlot({ kind: 'digit', d });
      await tapSlot({ kind: 'marks' });
      await page.waitForTimeout(200);
      // A two-square cage filled so it does not add up: its outline rings red and the pet says so once, with no miss of its own.
      const pair = await page.evaluate(() => {
        const g = neo.scene.game,
          s = g.puzzle.solution;
        for (const c of g.geo.cages) {
          if (c.cells.length !== 2 || !c.cells.every((i) => !g.grid[i] && !g.notes[i])) continue;
          const [a, b] = c.cells,
            da = s[b],
            peers = g.geo.peers;
          if (peers[a].some((p) => g.grid[p] === da)) continue;
          const db = [1, 2, 3, 4, 5, 6].find(
            (d) => d !== da && d + da !== c.sum && !peers[b].some((p) => p !== a && g.grid[p] === d),
          );
          if (db) return { a, b, da, db };
        }
        return null;
      });
      assert.ok(pair, 'an empty two-square cage to fill wrongly');
      const missesBefore = (await state()).misses;
      await tapCell(pair.a);
      await tapSlot({ kind: 'digit', d: pair.da });
      await page.waitForTimeout(4300);
      await tapCell(pair.b);
      await tapSlot({ kind: 'digit', d: pair.db });
      await page.waitForTimeout(300);
      const sum = await page.evaluate(() => ({
        told: neo.scene.game.told.sum,
        misses: neo.scene.game.misses,
      }));
      assert.equal(sum.told, true, 'a cage that does not add up is spoken about');
      assert.equal(
        sum.misses,
        missesBefore +
          1 +
          (pair.db !== (await page.evaluate((b) => neo.scene.game.puzzle.solution[b], pair.b)) ? 1 : 0),
        'only numbers wrong against the answer count, never the sum itself',
      );
      await screenshot('sudoku-touch-10-landscape');
      await tapSlot({ kind: 'again' });
      await page.waitForTimeout(400);
      assert.equal((await state()).empty, 30, 'start over puts the cage bed back');
      const misses = sum.misses;
      let cage = null,
        asked = 0;
      for (; asked < 30 && !cage && !(await page.evaluate(() => neo.scene.finished)); asked++) {
        await idle();
        await tapSlot({ kind: 'hint' });
        await page.waitForTimeout(300);
        const h = await page.evaluate(() => {
          const h = neo.scene.game.hinted;
          return (
            h && {
              kind: h.kind,
              cell: h.cell,
              digit: h.digit,
              tech: h.via?.tech,
              banner: neo.scene.game.banner.text,
            }
          );
        });
        assert.ok(h && h.kind !== 'fix' && h.kind !== 'few', `hint ${asked + 1} names a reason`);
        if (h.kind === 'cage-last' || h.tech === 'cage-sets') {
          cage = h;
          break;
        }
        await tapCell(h.cell);
        await page.waitForTimeout(60);
        await tapSlot({ kind: 'digit', d: h.digit });
        await page.waitForTimeout(120);
      }
      assert.ok(cage, 'a hint names a cage');
      assert.match(cage.banner, /cage|add up/);
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      assert.deepEqual(await targets('level 10 portrait'), []);
      await screenshot('sudoku-touch-10-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);
      await fillAll();
      await finished('sudoku-garden');
      assert.equal(
        await page.evaluate(() => kit.store.data.stickers.length),
        stickers + 1,
        'one sticker for the cage bed',
      );
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('sudoku-garden').history.at(-1);
          return [r.level, r.misses, r.hints];
        }),
        [10, misses, asked + 1],
      );
      assert.deepEqual(errors, []);
      log(
        `Sudoku Garden touch level 10: cage bed at 92 a square, a wrong number, marks, a cage hint (${cage.kind}${cage.tech ? ' via ' + cage.tech : ''}) on hint ${asked + 1}, 64-unit targets upright and sideways, one sticker passed`,
      );
      return;
    }
    // Level 7 (4 by 4, the entry): 2 by 2 boxes, a wrong number is a miss, one hint, filled to its sticker. `SUDOKU_ONLY=7` plays just this bed.
    await launch('sudoku-garden', 7);
    await idle();
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    let four = await state();
    assert.equal(four.n, 4);
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.puzzle.blanks, neo.scene.game.puzzle.grade]),
      [10, 1],
    );
    assert.deepEqual(await targets('level 7 landscape'), []);
    const miss = await page.evaluate(() => {
      const g = neo.scene.game,
        i = g.grid.findIndex((d) => !d);
      return { i, d: (g.puzzle.solution[i] % g.n) + 1 };
    });
    await tapCell(miss.i);
    await page.waitForTimeout(100);
    await tapSlot({ kind: 'digit', d: miss.d });
    await page.waitForTimeout(200);
    four = await state();
    assert.equal(four.misses, 1, 'a wrong number on the 4 by 4 bed is one miss');
    await tapSlot({ kind: 'erase' });
    await page.waitForTimeout(200);
    await tapSlot({ kind: 'hint' });
    await page.waitForTimeout(300);
    four = await state();
    assert.deepEqual([four.hints, four.hinted], [1, true]);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    assert.deepEqual(await targets('level 7 portrait'), []);
    await screenshot('sudoku-touch-7-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await fillAll();
    await finished('sudoku-garden');
    assert.equal(
      await page.evaluate(() => kit.store.data.stickers.length),
      before + 1,
      'one sticker for the 4 by 4 bed',
    );
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('sudoku-garden').history.at(-1);
        return [r.level, r.misses, r.hints];
      }),
      [7, 1, 1],
    );
    if (process.env.SUDOKU_ONLY === '7') {
      assert.deepEqual(errors, []);
      log(
        'Sudoku Garden touch level 7: 4 by 4 bed, a wrong number, one hint, 64-unit targets upright and sideways, one sticker passed',
      );
      return;
    }
    // Level 1 (6 by 6): a wrong number counts, Erase takes it back for free, Marks pencil a number, a hint counts once, then the bed is filled.
    await launch('sudoku-garden', 1);
    await idle();
    const stickers = await page.evaluate(() => kit.store.data.stickers.length);
    let st = await state();
    assert.equal(st.n, 6);
    assert.deepEqual(await targets('level 1 landscape'), []);
    const wrong = await page.evaluate(() => {
      const g = neo.scene.game,
        i = g.grid.findIndex((d) => !d);
      return { i, d: (g.puzzle.solution[i] % g.n) + 1 };
    });
    await tapCell(wrong.i);
    await page.waitForTimeout(100);
    assert.equal((await state()).cursor, wrong.i, 'a tap on a square chooses it');
    await tapSlot({ kind: 'digit', d: wrong.d });
    await page.waitForTimeout(200);
    st = await state();
    assert.equal(st.misses, 1, 'a wrong number is one miss');
    assert.ok(
      await page.evaluate((i) => !!neo.scene.game.flash?.cells.includes(i), wrong.i),
      'a wrong number glows red, clash or not',
    );
    assert.equal(st.empty, (await page.evaluate(() => neo.scene.game.puzzle.blanks)) - 1);
    await tapSlot({ kind: 'erase' });
    await page.waitForTimeout(200);
    st = await state();
    assert.equal(
      st.empty,
      await page.evaluate(() => neo.scene.game.puzzle.blanks),
      'erase takes the number out',
    );
    assert.equal(st.misses, 1, 'taking it out is free and does not undo the miss');
    await tapSlot({ kind: 'marks' });
    await tapSlot({ kind: 'digit', d: 3 });
    await page.waitForTimeout(200);
    st = await state();
    assert.equal(st.noting, true);
    assert.equal(st.notes[wrong.i], 1 << 2, 'a pencilled mark');
    assert.equal(st.empty, await page.evaluate(() => neo.scene.game.puzzle.blanks), 'marks place nothing');
    await tapSlot({ kind: 'marks' });
    await tapSlot({ kind: 'hint' });
    await page.waitForTimeout(300);
    st = await state();
    assert.deepEqual([st.hints, st.hinted], [1, true]);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    assert.deepEqual(await targets('level 1 portrait'), []);
    await screenshot('sudoku-touch-1-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await tapSlot({ kind: 'again' });
    await page.waitForTimeout(400);
    assert.equal(
      (await state()).empty,
      await page.evaluate(() => neo.scene.game.puzzle.blanks),
      'start over puts the bed back',
    );
    await fillAll();
    await finished('sudoku-garden');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('sudoku-garden').history.at(-1);
        return [r.misses, r.hints];
      }),
      [1, 1],
    );
    // Level 6 (9 by 9): every target still 64 or more, sideways and upright, solved by touch with no help.
    await launch('sudoku-garden', 6);
    await idle();
    assert.equal((await state()).n, 9);
    assert.deepEqual(await targets('level 6 landscape'), []);
    await screenshot('sudoku-touch-6-landscape');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    assert.deepEqual(await targets('level 6 portrait'), []);
    await screenshot('sudoku-touch-6-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await fillAll();
    await finished('sudoku-garden');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('sudoku-garden').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 0],
    );
    // From Lantern Lake it plays here, by touch, and leaving mid-round is quiet.
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
      neo.go.land('lantern-lake');
    });
    await scene('LandScene');
    await page.evaluate(() =>
      neo.go.game('sudoku-garden', 'grownup', undefined, false, { land: 'lantern-lake' }),
    );
    await scene('GameScene');
    await idle();
    await page.evaluate(() => neo.go.land('lantern-lake'));
    await scene('LandScene');
    await page.waitForTimeout(500);
    assert.deepEqual(errors, []);
    log(
      'Sudoku Garden touch: first and last level, a wrong number, erase, marks, one hint, start over, 64-unit targets upright and sideways, one sticker each passed',
    );
  }

  return { sudokuTouchPlay };
}
