import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function beePlay() {
    await page.setViewportSize({ width: 390, height: 625 });
    await page.evaluate(async () => {
      kit.store.data.settings.showWords = true;
      const { Rng } = await import('/src/engine/random.ts');
      let seed = 1;
      while (new Rng(seed).int(0, 1) !== 0) seed++;
      const random = Math.random;
      window.restoreGardenRandom = () => {
        Math.random = random;
      };
      Math.random = () => seed / 2 ** 31;
    });
    try {
      await launch('garden-rows', 11, 'Mia', 'school');
    } finally {
      await page.evaluate(() => {
        window.restoreGardenRandom();
        delete window.restoreGardenRandom;
      });
    }
    await page.waitForFunction(() => !neo.scene.game.busy);
    assert.equal(await page.evaluate(() => neo.view.upright), true);
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          bed: g.bed,
          given: g.given,
          selected: g.selected,
          gate: g.activeGate,
          misses: g.misses,
          hints: g.hints,
          hint: g.heightHint,
          preview: g.bee.legend.text,
        };
      });
    const tap = async (what, i, j) => {
      const p = await page.evaluate(
        ({ what, i, j }) => {
          const g = neo.scene.game;
          if (what === 'cell') return g.board.toGlobal({ x: 50 + 100 * j, y: 50 + 100 * i });
          if (what === 'gate') return g.bee.gates[i].node.getGlobalPosition();
          if (what === 'packet') return g.packets.children[i].getGlobalPosition();
          if (what === 'guide') {
            const b = neo.scene.pet.getBounds();
            return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
          }
          return g.bee.check.node.getGlobalPosition();
        },
        { what, i, j },
      );
      await page.touchscreen.tap(p.x, p.y);
      await page.waitForTimeout(140);
    };
    const stickerCount = () =>
      page.evaluate(() => kit.store.data.stickers.filter((sticker) => sticker.game === 'garden-rows').length);
    const before = await stickerCount();
    const initial = await state();
    assert.deepEqual(initial.bed, [
      [null, null, null],
      [1, null, null],
      [null, null, null],
    ]);
    await tap('check');
    await tap('gate', 6);
    await tap('gate', 6);
    assert.equal((await state()).preview, 'Bee’s view');
    assert.equal((await state()).misses, 0);
    const wrong = [
      [0, 2, 1],
      [1, 0, 2],
      [2, 1, 0],
    ];
    const correct = [
      [0, 1, 2],
      [1, 2, 0],
      [2, 0, 1],
    ];
    for (const [r, row] of wrong.entries())
      for (const [c, flower] of row.entries()) {
        if (initial.given[r][c]) continue;
        await tap('packet', flower);
        await tap('cell', r, c);
      }
    assert.deepEqual((await state()).bed, wrong);
    assert.equal((await state()).misses, 0);
    await tap('check');
    const rejected = await state();
    assert.equal(rejected.misses, 1);
    assert.equal(rejected.gate, 1);
    assert.equal(rejected.preview, 'Bee sees 1');
    await screenshot('garden-rows-11-short-portrait');
    await tap('check');
    await tap('cell', 0, 1);
    await tap('packet', 2);
    await tap('cell', 0, 1);
    await tap('check');
    assert.equal((await state()).misses, 1, 'same arrangement stays free after a lift and replant');

    await tap('guide');
    const helped = await state();
    assert.equal(helped.hints, 1);
    assert.deepEqual([helped.hint.kind, helped.hint.r, helped.hint.c], ['fix', 0, 1]);
    await tap('gate', helped.gate);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Show a hint', exact: true }).click();
    assert.deepEqual(await state(), helped);
    await page.setViewportSize({ width: 625, height: 390 });
    await page.waitForFunction(() => !neo.view.upright);
    assert.deepEqual(await state(), helped);
    await tap('gate', 7);
    assert.equal((await state()).gate, 7);
    await tap('gate', helped.gate);
    await page.setViewportSize({ width: 390, height: 625 });
    await page.waitForFunction(() => neo.view.upright);
    assert.deepEqual(await state(), helped);
    for (const [r, row] of wrong.entries())
      for (const [c, flower] of row.entries()) if (flower !== correct[r][c]) await tap('cell', r, c);
    for (const [r, row] of correct.entries())
      for (const [c, flower] of row.entries()) {
        if (flower === wrong[r][c]) continue;
        await tap('packet', flower);
        await tap('cell', r, c);
      }
    assert.deepEqual((await state()).bed, correct);
    await tap('check');
    await finished('garden-rows');
    assert.equal(await stickerCount(), before + 1);
    const saved = await page.evaluate(() => {
      const { level, misses, hints } = kit.store.stats('garden-rows').history.at(-1);
      return { level, misses, hints };
    });
    assert.deepEqual(saved, { level: 11, misses: 1, hints: 1 });
    log('Garden Rows 11: short portrait, repeat checks, one hint, rotation, revision and one sticker');
  }

  async function gardenRowsPlay() {
    if (process.env.GARDEN_ROWS_ONLY === 'bee') return beePlay();
    let s0;
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          index: g.index,
          misses: g.misses,
          hints: g.hints,
          busy: g.busy,
          hinted: g.hinted,
          bed: g.bed,
          kinds: g.puzzles[g.index]?.kinds,
        };
      });
    const settle = () =>
      page
        .waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 30000 })
        .then(() => page.waitForTimeout(250));
    // Past the board's and the packets' tap cooldowns.
    const tapCell = (r, c) =>
      page
        .evaluate(
          ({ r, c }) => {
            const p = neo.scene.game.board.toGlobal({ x: c * 100 + 50, y: r * 100 + 50 });
            kit.tap(p.x, p.y);
          },
          { r, c },
        )
        .then(() => page.waitForTimeout(250));
    const pick = (f) =>
      page
        .evaluate((f) => kit.tapOn(neo.scene.game.packets.children[f]), f)
        .then(() => page.waitForTimeout(250));
    /** The two spots where the start differs from the bed before the swap. */
    const swapped = () =>
      page.evaluate(() => {
        const p = neo.scene.game.puzzles[neo.scene.game.index];
        const out = [];
        p.start.forEach((row, r) =>
          row.forEach((v, c) => {
            if (v !== p.solution[r][c]) out.push({ r, c, was: v, want: p.solution[r][c] });
          }),
        );
        return out;
      });
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    /** Let the ghost finger's moves finish every bed of the round. */
    const botFinish = async (beds) => {
      for (let bed = 0; bed < beds; bed++) {
        await settle();
        for (
          let i = 0;
          i < 60 && !(await page.evaluate(() => neo.scene.finished || neo.scene.game.busy));
          i++
        ) {
          const intent = await page.evaluate(() => {
            const t = neo.scene.game.autotouch();
            if (!t) return null;
            const p =
              t.tap.x === undefined
                ? t.tap.on.getGlobalPosition()
                : t.tap.on.toGlobal({ x: t.tap.x, y: t.tap.y });
            kit.tap(p.x, p.y);
            return true;
          });
          if (!intent) break;
          await page.waitForTimeout(120);
        }
      }
    };

    // Hedge boxes (levels 8 and 9), run alone with GARDEN_ROWS_ONLY=boxes.
    const boxes = process.env.GARDEN_ROWS_ONLY;
    if (!boxes || boxes === 'boxes') {
      await page.setViewportSize({ width: 768, height: 1024 });
      await launch('garden-rows', 8, 'Mia', 'school');
      await settle();
      s0 = await state();
      assert.equal(s0.bed.flat().filter((v) => v === null).length, 6, 'level 8 starts with six empty spots');
      // An empty spot and a flower that repeats only in its hedge box (the spot diagonal to it in the box), not its row or column.
      const trap = await page.evaluate(() => {
        const bed = neo.scene.game.bed;
        for (let r = 0; r < 4; r++)
          for (let c = 0; c < 4; c++) {
            if (bed[r][c] !== null) continue;
            const d = { r: r ^ 1, c: c ^ 1 };
            const f = bed[d.r][d.c];
            if (f !== null && !bed[r].includes(f) && !bed.some((row) => row[c] === f)) return { r, c, f };
          }
        return null;
      });
      assert.ok(trap, 'level 8 bed has a spot whose box alone rules out a flower');
      await pick(trap.f);
      await tapCell(trap.r, trap.c);
      s0 = await state();
      assert.deepEqual(
        [s0.misses, s0.bed[trap.r][trap.c]],
        [1, null],
        'a hedge-box repeat is a miss and does not stay',
      );
      assert.equal(await page.evaluate(() => neo.scene.game.flash?.cells.length), 2, 'both spots flash');
      await screenshot('garden-rows-8-hedges-portrait');
      await botFinish(2);
      await finished('garden-rows');
      assert.deepEqual(
        await page.evaluate(() => {
          const h = kit.store.stats('garden-rows').history.at(-1);
          return [h.level, h.misses, h.hints];
        }),
        [8, 1, 0],
        'level 8 saved one miss, no hint',
      );
      await launch('garden-rows', 9, 'Mia', 'school');
      await settle();
      s0 = await state();
      assert.equal(s0.bed.flat().filter((v) => v === null).length, 10, 'level 9 starts with ten empty spots');
      await botFinish(1);
      await finished('garden-rows');
      assert.deepEqual(
        await page.evaluate(() => {
          const h = kit.store.stats('garden-rows').history.at(-1);
          return [h.level, h.misses, h.hints];
        }),
        [9, 0, 0],
        'level 9 to its sticker',
      );
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
      log(
        'Garden Rows: level 8 hedge-box clash (one miss, both spots flash, portrait), bot to the end; level 9 to its sticker; passed',
      );
      if (boxes) return;
    }

    // Level 7, Mend the bed in portrait: replant a swapped flower where it was twice (two misses, the glow on the other), then mend.
    await page.setViewportSize({ width: 768, height: 1024 });
    await launch('garden-rows', 7, 'Mia', 'school');
    await settle();
    let s = await state();
    assert.ok(
      s.bed.flat().every((v) => v !== null),
      'level 7 starts full',
    );
    let [a, b] = await swapped();
    assert.equal(a.r, b.r, 'the swapped pair share a row');
    await tapCell(a.r, a.c); // lift: free
    s = await state();
    assert.deepEqual([s.misses, s.bed[a.r][a.c]], [0, null], 'lifting a flower is free');
    await pick(a.was);
    await tapCell(a.r, a.c); // the same flower back: a column repeat
    await tapCell(a.r, a.c); // and again
    s = await state();
    assert.deepEqual([s.misses, s.hints], [2, 1], 'two repeat replants are two misses and one hint');
    assert.equal(s.bed[a.r][a.c], null, 'the repeat did not stay');
    assert.equal(s.hinted?.kind, 'fix', 'the hint names a mixed-up flower');
    assert.deepEqual([s.hinted.r, s.hinted.c], [b.r, b.c], 'the glow is on the other swapped flower');
    await screenshot('garden-rows-7-portrait');
    // Lift the glowing flower (free; its glow goes), then plant each where it belongs.
    await tapCell(b.r, b.c);
    await page.waitForTimeout(200);
    s = await state();
    assert.deepEqual(
      [s.misses, s.hinted],
      [2, null],
      'lifting the glowing flower is free and takes its glow',
    );
    await pick(a.want);
    await tapCell(a.r, a.c);
    await pick(b.want);
    await tapCell(b.r, b.c);
    await settle();
    s = await state();
    assert.equal(s.index, 1, 'the mended bed blooms and the second bed comes');
    // The second bed: lift both swapped flowers and plant each where it belongs.
    [a, b] = await swapped();
    await tapCell(a.r, a.c);
    await tapCell(b.r, b.c);
    await pick(a.want);
    await tapCell(a.r, a.c);
    await pick(b.want);
    await tapCell(b.r, b.c);
    await finished('garden-rows');
    assert.deepEqual(
      await page.evaluate(() => {
        const h = kit.store.stats('garden-rows').history.at(-1);
        return [h.misses, h.hints];
      }),
      [2, 1],
      'level 7 saved 2 misses, 1 hint',
    );
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);

    // Level 3 with a flower set that is not the first four: the packets show the bed's kinds, and the bot's moves finish it.
    await launch('garden-rows', 3, 'Mia', 'school');
    await settle();
    s = await state();
    assert.equal(s.kinds.length, 4);
    const sets = [s.kinds.join()];
    for (let bed = 0; bed < 2; bed++) {
      await settle();
      sets.push((await state()).kinds.join());
      for (
        let i = 0;
        i < 40 && !(await page.evaluate(() => neo.scene.finished || neo.scene.game.busy));
        i++
      ) {
        const intent = await page.evaluate(() => {
          const t = neo.scene.game.autotouch();
          if (!t) return null;
          const p =
            t.tap.x === undefined
              ? t.tap.on.getGlobalPosition()
              : t.tap.on.toGlobal({ x: t.tap.x, y: t.tap.y });
          kit.tap(p.x, p.y);
          return true;
        });
        if (!intent) break;
        await page.waitForTimeout(120);
      }
    }
    await finished('garden-rows');
    assert.ok(
      sets.some((k) => k !== '0,1,2,3'),
      `a bed drew a non-default flower set (${sets.join(' | ')})`,
    );
    log(
      `Garden Rows: level 7 in portrait (two repeat replants, the glow on the other swapped flower, a free lift, both beds mended, saved 2/1); level 3 flower sets ${sets.join(' | ')}; passed`,
    );
  }
  return { gardenRowsPlay };
}
