import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function paintMixerPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('paint-mixer').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () =>
      page.evaluate(() => {
        const s = neo.scene.game.state;
        return {
          bucket: s.bucket,
          drops: s.drops,
          misses: s.misses,
          hints: s.hints,
          glow: s.glow,
          size: s.size,
          pair: s.sample.pots,
          counts: s.sample.counts,
          busy: s.busy,
        };
      });
    const settle = async () => {
      await page.waitForTimeout(250);
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 40000 });
      await page.waitForTimeout(150);
    };
    const pour = async (pot) => {
      await page.evaluate((pot) => kit.tapOn(neo.scene.game.potNodes.get(pot)), pot);
      await page.waitForTimeout(220);
    };
    const button = async (kind) => {
      await page.evaluate((kind) => kit.tapOn(neo.scene.game.buttons.get(kind)), kind);
      await page.waitForTimeout(220);
    };
    const pourRow = async (s, times) => {
      for (let k = 0; k < times; k++)
        for (let p = 0; p < s.pair.length; p++) for (let i = 0; i < s.counts[p]; i++) await pour(s.pair[p]);
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    // PAINT_LEVELS=5,6 runs only those levels (default 1–6).
    const levels = process.env.PAINT_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6];
    if (levels.some((n) => n >= 1 && n <= 4)) await levelsOneToFour();
    if (levels.includes(5)) await levelFive();
    if (levels.includes(6)) await levelSix();

    async function levelsOneToFour() {
      let s, f;

      // Level 1, bucket 1: an empty Check is a miss (pot A short); one drop short of the row is a second miss and lights the glow (one hint);
      // following the glow (the missing pot, then Check) matches. Bucket 2: the row straight through; two buckets end the round.
      await launch('paint-mixer', 1, 'Mia', 'school');
      await settle();
      s = await state();
      assert.equal(s.bucket, 0);
      assert.equal(s.size, s.counts[0] + s.counts[1], 'level 1 holds one row of the sample');
      await button('check');
      s = await state();
      assert.deepEqual([s.misses, s.hints], [1, 0], 'an empty Check is one miss, no hint');
      assert.equal(s.glow, null, 'no glow after the first miss');
      await pourRow(s, 1);
      await button('undo');
      s = await state();
      assert.equal(s.drops.length, s.size - 1, 'Undo took the last drop back (free)');
      await button('check');
      await page.waitForTimeout(300);
      s = await state();
      assert.deepEqual([s.misses, s.hints], [2, 1], 'the second miss glows: one hint');
      assert.equal(s.glow?.at, 'pot', 'the glow is on the pot of the missing place');
      assert.equal(s.glow.pot, s.pair[1], 'the missing place is pot B');
      await screenshot('paint-mixer-1-landscape');
      await pour(s.glow.pot);
      s = await state();
      assert.equal(s.glow?.at, 'check', 'the glow moves to Check once the counts match');
      await button('check');
      await settle();
      s = await state();
      assert.equal(s.bucket, 1, 'the second bucket is up');
      assert.deepEqual(s.drops, [], 'the bucket emptied by itself');
      assert.equal(s.glow, null, 'the glow is off for the new bucket');
      await pourRow(s, 1);
      await button('check');
      await finished('paint-mixer');
      assert.deepEqual(await score(), [2, 1], 'level 1 saved 2 misses, 1 hint');

      // Level 2, bucket 1: one row is "more, the same way" (not a miss); a loose extra drop is one miss; Undo clears it; two rows match.
      // Bucket 2 in portrait: two rows straight through.
      await launch('paint-mixer', 2, 'Mia', 'school');
      await settle();
      s = await state();
      assert.equal(s.size, 2 * (s.counts[0] + s.counts[1]), 'level 2 holds two rows of the sample');
      await pourRow(s, 1);
      await button('check');
      await page.waitForTimeout(300);
      s = await state();
      assert.deepEqual([s.misses, s.hints], [0, 0], 'one row is more, the same way: not a miss');
      await pourRow(s, 1);
      await pour(s.pair[0]);
      s = await state();
      assert.equal(s.drops.length, s.size + 1, 'an extra drop sits loose');
      await button('check');
      s = await state();
      assert.deepEqual([s.misses, s.hints], [1, 0], 'too many of pot A is one miss');
      await button('undo');
      await button('check');
      await settle();
      s = await state();
      assert.equal(s.bucket, 1, 'two rows matched; the second bucket is up');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(800);
      await pourRow(s, 2);
      await screenshot('paint-mixer-2-portrait');
      await button('check');
      await finished('paint-mixer');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
      assert.deepEqual(await score(), [1, 0], 'level 2 saved 1 miss, 0 hints');
      log(
        'Paint Mixer 1–2: empty Check and one short (2/1, the glow on the missing pot then Check), the second row straight; one row is more the same way, a loose drop (1/0), Undo and two rows, portrait second bucket; passed',
      );

      // Level 3, bucket 1: three pots (the pair and a stray); one row is "more, the same way, up to the line" (no miss) and fills one
      // table column; a stray drop is one miss; Undo, then rows to the line fill the table and match. Bucket 2 in portrait, straight.
      const full = () =>
        page.evaluate(() => {
          const s = neo.scene.game.state;
          return { pots: s.pots, stray: s.sample.stray, table: s.table, done: s.done, size: s.size };
        });
      await launch('paint-mixer', 3, 'Mia', 'school');
      await settle();
      s = await state();
      f = await full();
      const lineBatches = s.counts[0] + s.counts[1] >= 5 ? 2 : 3;
      assert.equal(f.pots.length, 3, 'three pots at level 3');
      assert.ok(
        f.stray && !s.pair.includes(f.stray) && f.pots.includes(f.stray),
        'the stray pot is on screen and not in the pair',
      );
      assert.equal(
        s.size,
        lineBatches * (s.counts[0] + s.counts[1]),
        'the line is 3 batches (totals 3–4) or 2 (total 5)',
      );
      assert.deepEqual(f.table, { columns: lineBatches, filled: 0 }, 'an empty table');
      await pourRow(s, 1);
      f = await full();
      assert.equal(f.table.filled, 1, 'one complete row fills one column');
      await button('check');
      await page.waitForTimeout(300);
      s = await state();
      assert.deepEqual(
        [s.misses, s.hints],
        [0, 0],
        'one row below the line is more, the same way: not a miss',
      );
      await pour(f.stray);
      await button('check');
      s = await state();
      assert.deepEqual([s.misses, s.hints], [1, 0], 'a stray drop is one miss');
      f = await full();
      assert.equal(f.table.filled, 1, 'a stray drop fills no column');
      await button('undo');
      await pourRow(s, lineBatches - 1);
      f = await full();
      assert.equal(f.table.filled, lineBatches, 'the table is full at the line');
      await button('check');
      await settle();
      s = await state();
      assert.equal(s.bucket, 1, 'the line matched; the second bucket is up');
      f = await full();
      assert.equal(f.pots.length, 3, 'the second bucket has its stray too');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(800);
      await pourRow(s, s.counts[0] + s.counts[1] >= 5 ? 2 : 3);
      await screenshot('paint-mixer-3-portrait');
      await button('check');
      await finished('paint-mixer');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
      assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');

      // Level 4: one row is the first way (kept as a star on its column); the same amount again is named, not a miss; two rows are the
      // second way and finish the round.
      await launch('paint-mixer', 4, 'Mia', 'school');
      await settle();
      s = await state();
      f = await full();
      assert.equal(f.size, null, 'no line at level 4');
      await pourRow(s, 1);
      await button('check');
      await settle();
      s = await state();
      f = await full();
      assert.equal(f.done, 1, 'the first way is one copy');
      assert.deepEqual(s.drops, [], 'the bucket emptied by itself for the second way');
      await pourRow(s, 1);
      await button('check');
      await page.waitForTimeout(300);
      s = await state();
      assert.deepEqual([s.misses, s.hints], [0, 0], 'the same amount again is not a miss');
      await pourRow(s, 1);
      await screenshot('paint-mixer-4-landscape');
      await button('check');
      await finished('paint-mixer');
      assert.deepEqual(await score(), [0, 0], 'level 4 saved 0 misses, 0 hints');
      log(
        'Paint Mixer 3–4: stray pot, one row more the same way (no miss), a stray Check (1/0), the table filling to the line, portrait second bucket; level 4 one row then the same amount (no miss) then two rows (0/0); passed',
      );
    }

    // Level 5, bucket 1: three pots and a three-row table; one row plus an extra drop is one miss; Undo, rows to the line, match.
    // Bucket 2 (the other triple) in portrait, straight. Both recipes are filed on the journal's paint shelf.
    async function levelFive() {
      const more = () =>
        page.evaluate(() => {
          const s = neo.scene.game.state;
          return { pots: s.pots, batches: s.sample.batches, table: s.table, size: s.size };
        });
      await page.evaluate(() => {
        kit.store.data.journal.found = kit.store.data.journal.found.filter(
          (id) => !id.startsWith('paint-mixer:'),
        );
      });
      await launch('paint-mixer', 5, 'Mia', 'school');
      await settle();
      let s = await state();
      let m = await more();
      assert.equal(s.pair.length, 3, 'a three-pot sample');
      assert.deepEqual(m.pots, s.pair, 'the three pots on screen, no stray');
      assert.ok([2, 3].includes(m.batches), 'the line is two or three batches');
      assert.equal(m.size, m.batches * 4, 'the line is 8 or 12 drops');
      assert.deepEqual(m.table, { columns: m.batches, filled: 0 }, 'an empty three-row table');
      const first = s.pair.join();
      await pourRow(s, 1);
      await pour(s.pair[1]);
      await button('check');
      s = await state();
      assert.deepEqual([s.misses, s.hints], [1, 0], 'one row and an extra drop is one miss');
      await button('undo');
      m = await more();
      assert.equal(m.table.filled, 1, 'Undo leaves one complete batch');
      await pourRow(s, m.batches - 1);
      await screenshot('paint-mixer-5-landscape');
      await button('check');
      await settle();
      s = await state();
      assert.equal(s.bucket, 1, 'the line matched; the second bucket is up');
      assert.notEqual(s.pair.join(), first, 'the second bucket uses the other triple');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(800);
      m = await more();
      await pourRow(s, m.batches);
      await screenshot('paint-mixer-5-portrait');
      await button('check');
      await finished('paint-mixer');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
      assert.deepEqual(await score(), [1, 0], 'level 5 saved 1 miss, 0 hints');
      const shelf = await page.evaluate(() =>
        kit.store.data.journal.found.filter((id) => id.startsWith('paint-mixer:')),
      );
      assert.equal(shelf.length, 2, `both matched recipes are on the paint shelf (${shelf})`);
      log(
        `Paint Mixer 5: three pots, a 4-row table, one extra drop (1/0), Undo and rows to the line, the other triple in portrait; shelf ${shelf.join(', ')}; passed`,
      );
    }

    // Level 6, case 1: one non-matching jar chosen and Checked twice (two misses); the second opens the named jar's lid and its
    // reveal (one hint), portrait screenshot; then the right set. Case 2: the right set straight.
    async function levelSix() {
      const jars = () =>
        page.evaluate(() => {
          const s = neo.scene.game.state;
          return s;
        });
      const tapJar = async (i) => {
        await page.evaluate((i) => kit.tapOn(neo.scene.game.jarNodes[i]), i);
        await page.waitForTimeout(250);
      };
      const check = async () => {
        await page.evaluate(() => kit.tapOn(neo.scene.game.check));
        await page.waitForTimeout(300);
      };
      const fixSet = async () => {
        const j = await jars();
        for (let i = 0; i < 4; i++) if (j.chosen[i] !== j.matching[i]) await tapJar(i);
      };
      await launch('paint-mixer', 6, 'Mia', 'school');
      await settle();
      let j = await jars();
      assert.equal(j.labels.length, 4, 'four jars');
      assert.ok(j.matching.some(Boolean) && !j.matching.every(Boolean), 'some jars match and some do not');
      assert.ok(
        j.opened.every((o) => !o),
        'every lid is closed',
      );
      await check();
      j = await jars();
      assert.deepEqual([j.misses, j.hints], [0, 0], 'Check with nothing chosen is not a miss');
      const wrong = j.matching.indexOf(false);
      await tapJar(wrong);
      j = await jars();
      assert.equal(j.chosen[wrong], true, 'tapping the jar body chose it (not its lid)');
      assert.equal(j.opened[wrong], false, 'and left its lid closed');
      await check();
      j = await jars();
      assert.deepEqual([j.misses, j.hints], [1, 0], 'a wrong set is one miss');
      await page.waitForTimeout(2500);
      await check();
      await page.waitForFunction(() => neo.scene.game.state.hints === 1, null, { timeout: 15000 });
      j = await jars();
      assert.deepEqual([j.misses, j.hints], [2, 1], 'the second miss opens a lid: one hint');
      assert.ok(j.shown !== null && j.opened[j.shown], 'the named jar is open and its reveal shows');
      assert.equal(
        j.shown,
        j.matching.findIndex((m, i) => m !== j.chosen[i]),
        'the leftmost wrong jar is the named one',
      );
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(900);
      await screenshot('paint-mixer-6-portrait-lid');
      await fixSet();
      j = await jars();
      assert.equal(j.glow?.at, 'check', 'the glow ends on Check once the set is right');
      await check();
      await settle();
      j = await jars();
      assert.equal(j.case, 1, 'the second case is up');
      assert.deepEqual(
        [j.opened.some(Boolean), j.shown, j.glow],
        [false, null, null],
        'lids, reveal and glow start again',
      );
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(600);
      await fixSet();
      await screenshot('paint-mixer-6-landscape');
      await check();
      await finished('paint-mixer');
      assert.deepEqual(await score(), [2, 1], 'level 6 saved 2 misses, 1 hint');
      log(
        'Paint Mixer 6: empty Check (free), a wrong jar twice (2 misses), the named lid opened with its reveal (1 hint), the right set; second case straight; passed',
      );
    }
  }
  return { paintMixerPlay };
}
