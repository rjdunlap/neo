import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  /** Picture Logic by touch: the 6 by 6 and the 15 by 15, a wrong fill, Cross, a swipe that jumps squares, Slide with the clues pinned, a hint, start over, 64-unit targets upright and sideways. */
  async function pictureTouchPlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          busy: g.busy,
          n: g.puzzle.size,
          misses: g.misses,
          hints: g.hints,
          fills: g.fills,
          marks: g.marks.slice(),
          sol: g.puzzle.solution.slice(),
          target: g.puzzle.target.slice(),
          hinted: g.hinted ? g.hinted.cell : null,
          tool: g.tool,
          sx: g.scrollX,
          sy: g.scrollY,
          maxX: g.frame.maxX,
          maxY: g.frame.maxY,
          rowX: g.rowLayer.x,
          rowY: g.rowLayer.y,
          colX: g.colLayer.x,
          colY: g.colLayer.y,
        };
      });
    const idle = () =>
      page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 15000 });
    const where = (i) =>
      page.evaluate((i) => {
        const g = neo.scene.game,
          n = g.puzzle.size,
          p = g.board.toGlobal({
            x: (i % n) * g.cell + g.cell / 2,
            y: Math.floor(i / n) * g.cell + g.cell / 2,
          });
        return [p.x, p.y];
      }, i);
    const tapCell = async (i) => {
      const [x, y] = await where(i);
      await page.evaluate(([x, y]) => kit.tap(x, y), [x, y]);
      await page.waitForTimeout(90);
    };
    const swipe = async (a, b, n = 6) => {
      const [ax, ay] = await where(a),
        [bx, by] = await where(b);
      await page.evaluate(
        ([ax, ay, bx, by, n]) => kit.drag(kit.line([ax, ay], [bx, by], n)),
        [ax, ay, bx, by, n],
      );
      await page.waitForTimeout(120);
    };
    const tapSlot = (kind) =>
      page.evaluate((kind) => {
        const g = neo.scene.game,
          s = g.frame.slots.find((s) => s.kind === kind),
          p = g.touchLayer.toGlobal({ x: s.x + s.w / 2, y: s.y + s.h / 2 });
        kit.tap(p.x, p.y);
      }, kind);
    const scroll = (x, y) => page.evaluate(([x, y]) => neo.scene.game.setScroll(x, y), [x, y]);
    /** The next stretch of squares in a row, all one colour, that the answer fills and the picture has not (at most six, so a window that slides can reach it). */
    const nextRun = (st) => {
      const { n, sol, marks, target } = st;
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++) {
          const i = r * n + c;
          if (!sol[i] || marks[i] === target[i]) continue;
          let e = c;
          while (
            e + 1 < n &&
            e - c < 5 &&
            target[r * n + e + 1] === target[i] &&
            marks[r * n + e + 1] !== target[i]
          )
            e++;
          return [i, r * n + e];
        }
      return null;
    };
    const solveAll = async () => {
      for (let guard = 0; guard < 400 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
        await idle();
        const st = await state();
        const run = nextRun(st);
        if (!run) {
          await page.waitForTimeout(300);
          continue;
        }
        // The pot of the run's colour (`fill2` is a two-colour picture's second colour).
        const pot = st.target[run[0]] === 3 ? 'fill2' : 'fill';
        if (st.tool !== pot) {
          await tapSlot(pot);
          continue;
        }
        // Bring the run's middle into the window, then drag along it.
        await page.evaluate(([a, b]) => {
          const g = neo.scene.game,
            c = g.centerOf((a + b) >> 1);
          g.setScroll(c.x - g.frame.grid.w / 2 + 8, c.y - g.frame.grid.h / 2 + 8);
        }, run);
        await page.waitForTimeout(60);
        if (run[0] === run[1]) await tapCell(run[0]);
        else await swipe(run[0], run[1], 3);
      }
    };
    /** The squares and every button: at least 64 logical units, on screen, the buttons apart from each other and from the paper. */
    const targets = (label) =>
      page.evaluate((label) => {
        const g = neo.scene.game,
          f = g.frame,
          out = [],
          p = f.paper;
        if (g.cell < 64) out.push(`cell ${g.cell}`);
        for (const r of f.slots) {
          if (r.w < 64 || r.h < 64) out.push(`${r.kind} small ${r.w}x${r.h}`);
          if (r.x < 0 || r.y < 0 || r.x + r.w > neo.view.w || r.y + r.h > neo.view.h)
            out.push(`${r.kind} off screen`);
          if (r.x < p.x + p.w && p.x < r.x + r.w && r.y < p.y + p.h && p.y < r.y + r.h)
            out.push(`${r.kind} over the paper`);
        }
        f.slots.forEach((a, i) =>
          f.slots.slice(i + 1).forEach((b) => {
            if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h)
              out.push(`${a.kind} overlaps ${b.kind}`);
          }),
        );
        if (p.x < 0 || p.y < 0 || p.x + p.w > neo.view.w || p.y + p.h > neo.view.h)
          out.push('paper off screen');
        return out.map((m) => `${label}: ${m} (${neo.view.w}x${neo.view.h})`);
      }, label);
    // `PICTURE_LEVELS=5,7` plays only those levels: each with one hint, then to the sticker (level 5, the 5 by 5 way in, whole at
    // 96-unit squares with no Slide, upright and sideways; level 7, a 15 by 15 that needs more care, sliding).
    const only = (process.env.PICTURE_LEVELS ?? '').split(',').filter(Boolean).map(Number);
    if (only.length) {
      for (const level of only) {
        await launch('picture-logic', level);
        await idle();
        const before = await page.evaluate(() => kit.store.data.stickers.length);
        const at = await state();
        assert.equal(at.n, level === 5 ? 5 : level === 6 ? 10 : 15, `level ${level} size`);
        if (level === 6) {
          // Two colours: two pots; a fill in the wrong colour is no miss, and the hint names it first and picks the right pot.
          assert.deepEqual(
            await page.evaluate(() => neo.scene.game.frame.slots.map((s) => s.kind).slice(0, 3)),
            ['fill', 'fill2', 'cross'],
          );
          const cell = at.target.indexOf(1);
          await tapSlot('fill2');
          await page.waitForTimeout(150);
          await tapCell(cell);
          let st = await state();
          assert.equal(st.marks[cell], 3, 'painted in the second colour');
          assert.equal(st.misses, 0, 'a wrong colour is not a miss');
          await tapSlot('hint');
          await page.waitForTimeout(300);
          st = await state();
          assert.equal(st.hinted, cell, 'the hint rings the wrong-colour square');
          assert.equal(st.tool, 'fill', 'and switches to its pot');
          const said = await page.evaluate(() => neo.scene.game.banner.text);
          assert.match(said, /other colour/, `hint names the colour: ${said}`);
          log(`level 6 hint: ${said}`);
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(500);
          assert.deepEqual(await targets('level 6 portrait'), []);
          await screenshot('picture-touch-6-portrait');
          await tapCell(cell);
          assert.equal((await state()).marks[cell], 1, 'the right pot paints it over');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(500);
        } else if (level === 5) {
          assert.deepEqual([at.maxX, at.maxY], [0, 0], 'a 5 by 5 picture is all in view');
          assert.equal(await page.evaluate(() => neo.scene.game.cell), 96, 'at the biggest squares');
          assert.equal(
            await page.evaluate(() => neo.scene.game.frame.slots.some((s) => s.kind === 'slide')),
            false,
            'no Slide on a 5 by 5',
          );
        } else assert.ok(at.maxX > 0 || at.maxY > 0, 'a 15 by 15 picture slides');
        assert.deepEqual(await targets(`level ${level} landscape`), []);
        if (level !== 6) {
          await tapSlot('hint');
          await page.waitForTimeout(300);
          assert.ok(
            await page.evaluate(() => neo.scene.game.hinted !== null),
            `level ${level} hint rings a square`,
          );
        }
        if (level === 5) {
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(500);
          assert.deepEqual(await targets('level 5 portrait'), []);
          assert.equal(await page.evaluate(() => neo.scene.game.cell), 96, 'portrait squares at 96');
          await screenshot('picture-touch-5-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(500);
        }
        await solveAll();
        await finished('picture-logic');
        assert.deepEqual(
          await page.evaluate(() => {
            const r = kit.store.stats('picture-logic').history.at(-1);
            return [r.level, r.misses, r.hints];
          }),
          [level, 0, 1],
        );
        assert.equal(
          await page.evaluate(() => kit.store.data.stickers.length),
          before + 1,
          `level ${level} one sticker`,
        );
      }
      assert.deepEqual(errors, []);
      log(
        `Picture Logic touch levels ${only.join(', ')}: size, whole or sliding, 64-unit targets, one hint, to the sticker with one hint counted passed`,
      );
      return;
    }
    // Level 1 (6 by 6): a fill outside the picture is one miss, filling it again empties it for free, Cross marks without a miss, a swipe that
    // jumps squares still fills every square between, a hint counts once and picks its tool.
    await launch('picture-logic', 1);
    await idle();
    const stickers = await page.evaluate(() => kit.store.data.stickers.length);
    let st = await state();
    assert.equal(st.n, 6);
    assert.deepEqual([st.maxX, st.maxY], [0, 0], 'a 6 by 6 picture is all in view');
    assert.deepEqual(await targets('level 1 landscape'), []);
    assert.equal(
      await page.evaluate(() => neo.scene.game.frame.slots.some((s) => s.kind === 'slide')),
      false,
      'no Slide button when nothing slides',
    );
    const stray = st.sol.findIndex((on) => !on);
    assert.ok(stray >= 0, 'a picture has an empty square');
    await tapCell(stray);
    st = await state();
    assert.deepEqual(
      [st.marks[stray], st.misses, st.fills],
      [1, 0, 1],
      'a fill outside the picture is not a miss',
    );
    await tapCell(stray);
    st = await state();
    assert.deepEqual([st.marks[stray], st.misses, st.fills], [0, 0, 1], 'emptying it is free');
    await tapSlot('cross');
    await page.waitForTimeout(100);
    assert.equal((await state()).tool, 'cross');
    await tapCell(stray);
    st = await state();
    assert.deepEqual([st.marks[stray], st.misses, st.fills], [2, 0, 1], 'a cross is free');
    await tapCell(stray);
    assert.equal((await state()).marks[stray], 0, 'a second Cross lifts it');
    await tapSlot('fill');
    await page.waitForTimeout(100);
    // A swipe of two points from the first to the last square of a run: every square between is filled once.
    let ra = -1,
      rb = -1;
    for (let r = 0; r < st.n; r++)
      for (let c = 0; c < st.n; c++) {
        let e = c;
        while (e + 1 < st.n && st.sol[r * st.n + e + 1]) e++;
        if (
          st.sol[r * st.n + c] &&
          e - c > rb - ra &&
          st.marks.slice(r * st.n + c, r * st.n + e + 1).every((m) => m === 0)
        ) {
          ra = r * st.n + c;
          rb = r * st.n + e;
        }
      }
    assert.ok(rb - ra >= 3, `a run of four or more squares to swipe along (${rb - ra + 1})`);
    await swipe(ra, rb, 1);
    st = await state();
    for (let i = ra; i <= rb; i++) assert.equal(st.marks[i], 1, `square ${i} of the swipe is filled`);
    assert.equal(st.fills, 1 + (rb - ra + 1), 'each square of the swipe counts once');
    await tapSlot('hint');
    await page.waitForTimeout(300);
    st = await state();
    assert.equal(st.hints, 1);
    assert.ok(st.hinted !== null, 'a hint rings a square');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    assert.deepEqual(await targets('level 1 portrait'), []);
    await screenshot('picture-touch-1-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await tapSlot('again');
    await page.waitForTimeout(300);
    assert.ok(
      (await state()).marks.every((m) => m === 0),
      'start over empties the picture',
    );
    await solveAll();
    await finished('picture-logic');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('picture-logic').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 1],
    );
    // Level 4 (15 by 15): the picture slides under its window with the clue numbers pinned; targets are still 64 or more.
    await launch('picture-logic', 4);
    await idle();
    st = await state();
    assert.equal(st.n, 15);
    assert.ok(st.maxX > 0 && st.maxY > 0, 'a 15 by 15 picture slides');
    assert.deepEqual(await targets('level 4 landscape'), []);
    await screenshot('picture-touch-4-landscape');
    // Slide: a drag with Slide on moves the picture and paints nothing; the row clues keep their x and follow y, the column clues the reverse.
    await tapSlot('slide');
    await page.waitForTimeout(100);
    const b = await state();
    await page.evaluate(() => {
      const g = neo.scene.game,
        c = g.frame.grid,
        p = g.touchLayer.toGlobal({ x: c.x + c.w / 2, y: c.y + c.h / 2 });
      return kit.drag(kit.line([p.x, p.y], [p.x - 150, p.y - 120], 5));
    });
    await page.waitForTimeout(150);
    st = await state();
    assert.ok(st.sx > b.sx && st.sy > b.sy, 'the picture slid');
    assert.ok(st.marks.every((m) => m === 0) && st.fills === 0, 'sliding paints nothing');
    assert.equal(st.rowX, b.rowX, 'row clues stay at the left');
    assert.ok(st.rowY < b.rowY, 'row clues follow the squares up');
    assert.equal(st.colY, b.colY, 'column clues stay at the top');
    assert.ok(st.colX < b.colX, 'column clues follow the squares left');
    // Dragging the clue strip slides it too, whatever the tool.
    await tapSlot('fill');
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      const g = neo.scene.game,
        f = g.frame,
        p = g.touchLayer.toGlobal({ x: f.paper.x + f.gutterX / 2, y: f.grid.y + f.grid.h / 2 });
      return kit.drag(kit.line([p.x, p.y], [p.x, p.y + 100], 4));
    });
    await page.waitForTimeout(150);
    assert.ok((await state()).sy < st.sy, 'a drag on the clue strip slides the picture');
    assert.equal((await state()).fills, 0, 'and paints nothing');
    // A stroke held at the window's edge carries the picture along under the finger.
    await scroll(0, 0);
    await page.waitForTimeout(100);
    const edge = await page.evaluate(() => {
      const g = neo.scene.game,
        f = g.frame,
        n = g.puzzle.size,
        r = 4,
        a = g.board.toGlobal({ x: g.cell / 2, y: r * g.cell + g.cell / 2 }),
        e = g.touchLayer.toGlobal({ x: f.grid.x + f.grid.w - 10, y: f.grid.y + 4 * g.cell + g.cell / 2 + 8 });
      return { a: [a.x, a.y], e: [e.x, e.y], n, r };
    });
    await page.evaluate(
      ({ a, e }) => kit.drag([a, ...kit.line(a, e, 6).slice(1), ...Array.from({ length: 50 }, () => e)]),
      edge,
    );
    st = await state();
    assert.ok(st.sx > 100, `the picture slid ${st.sx} under a held stroke`);
    assert.ok(
      st.marks.slice(edge.r * 15, edge.r * 15 + 15).filter((m) => m === 1).length >= 10,
      'and the stroke reached squares that began out of view',
    );
    await tapSlot('again');
    await page.waitForTimeout(200);
    // A hint brings its square into view.
    await scroll(0, 0);
    await tapSlot('hint');
    await page.waitForTimeout(300);
    assert.ok(
      await page.evaluate(() => {
        const g = neo.scene.game;
        return g.hinted && g.inView(g.hinted.cell, 0);
      }),
      'the hinted square is in view',
    );
    await tapSlot('again');
    await page.waitForTimeout(200);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    assert.deepEqual(await targets('level 4 portrait'), []);
    await screenshot('picture-touch-4-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await solveAll();
    await finished('picture-logic');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('picture-logic').history.at(-1);
        return [r.hints];
      }),
      [1],
    );
    // From Lantern Lake it plays here, by touch, and leaving mid-round is quiet.
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
      neo.go.land('lantern-lake');
    });
    await scene('LandScene');
    await page.evaluate(() =>
      neo.go.game('picture-logic', 'grownup', undefined, false, { land: 'lantern-lake' }),
    );
    await scene('GameScene');
    await idle();
    await page.evaluate(() => neo.go.land('lantern-lake'));
    await scene('LandScene');
    await page.waitForTimeout(500);
    assert.deepEqual(errors, []);
    log(
      'Picture Logic touch: first and last level, a stray fill, Cross, a jumping swipe, sliding with pinned clues, a held stroke at the edge, a hint, start over, 64-unit targets upright and sideways, one sticker each passed',
    );
  }

  return { pictureTouchPlay };
}
