import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function blockTopplePlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('block-topple').history.at(-1);
        return [r.misses, r.hints];
      });
    const ready = (i) =>
      page.waitForFunction(
        (i) => {
          const g = neo.scene.game;
          return g.lineIndex === i && !g.busy && !g.finished;
        },
        i,
        { timeout: 15000 },
      );
    const settled = () =>
      page.waitForFunction(
        () => {
          const g = neo.scene.game;
          return g.finished || !g.busy;
        },
        null,
        { timeout: 15000 },
      );
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          line: g.lineIndex,
          misses: g.misses,
          hints: g.hints,
          hinted: g.hinted,
          ghost: g.ghost.visible,
          standing: g.standing.slice(),
          friend: g.line.stacks[0].friend,
          hill: !!g.line.hill,
        };
      });
    // Put a finger on the ball, pull back by `pull` (the reverse of the launch), and let go; null pulls the solver's shot.
    const shoot = (pull) =>
      page.evaluate(async (pull) => {
        const g = neo.scene.game;
        const p = pull ?? g.solution();
        const a = (p.angle * Math.PI) / 180;
        const from = g.board.toGlobal({ x: 230, y: 400 });
        const to = g.board.toGlobal({ x: 230 - Math.cos(a) * p.length, y: 400 + Math.sin(a) * p.length });
        await kit.drag(kit.line([from.x, from.y], [to.x, to.y], 12));
      }, pull);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    // TOPPLE_LEVELS=5 plays only level 5 (the default plays 1, 3, 4 and 5).
    const levels = (process.env.TOPPLE_LEVELS ?? '1,3,4,5').split(',').map(Number);

    // Level 1: the solver's pull tips each of the three towers; nothing counts.
    if (levels.includes(1)) {
      await launch('block-topple', 1, 'Mia', 'preschool');
      for (let i = 0; i < 3; i++) {
        await ready(i);
        if (i === 0) assert.equal((await state()).friend, 'bunny', 'the authored first line');
        await shoot(null);
        await page.waitForFunction((i) => neo.scene.game.lineIndex > i || neo.scene.game.finished, i, {
          timeout: 15000,
        });
      }
      await finished('block-topple');
      assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');
    }

    // Level 3 in portrait: a short shot and a flat shot into the hill are two misses, the dotted path shows, then the tip.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    if (levels.includes(3)) {
      await launch('block-topple', 3, 'Mia', 'school');
      await ready(0);
      let s = await state();
      assert.deepEqual(
        [s.friend, s.hill],
        ['duck', true],
        'the authored first line has the duck behind a hill',
      );
      await shoot({ angle: 45, length: 40 });
      await settled();
      s = await state();
      assert.deepEqual([s.misses, s.hinted], [1, false], 'a short shot is one miss');
      await shoot({ angle: 12, length: 160 });
      await settled();
      s = await state();
      assert.deepEqual(
        [s.misses, s.hints, s.hinted, s.ghost],
        [2, 1, true, true],
        'a flat shot into the hill is the second miss, and the dotted path shows',
      );
      await page.waitForTimeout(400);
      await screenshot('block-topple-3-portrait-hint');
      for (let i = 0; i < 3; i++) {
        await ready(i);
        await shoot(null);
        await page.waitForFunction((i) => neo.scene.game.lineIndex > i || neo.scene.game.finished, i, {
          timeout: 15000,
        });
      }
      await finished('block-topple');
      assert.deepEqual(await score(), [2, 1], 'level 3 saved 2 misses, 1 hint');
    }

    // Level 4 in portrait: a bump on the wide stack's base and one low on its top block thump (never misses); the second shows
    // the golden band (one hint); then the solver tips the wide stack, the tall tower and the second wide stack.
    if (levels.includes(4)) {
      await launch('block-topple', 4, 'Mia', 'school');
      await ready(0);
      let s = await state();
      assert.equal(s.friend, 'pig', 'the authored first line has the pig on the wide stack');
      const high = () =>
        page.evaluate(() => {
          const g = neo.scene.game;
          return { thumps: g.thumps, band: g.highHinted, drawn: g.highG.bounds.width > 0 };
        });
      await shoot({ angle: 30, length: 84 });
      await settled();
      s = await state();
      assert.deepEqual(
        [s.misses, s.hints, (await high()).thumps, s.standing],
        [0, 0, 1, [2]],
        'a bump on the base thumps: no miss, nothing falls',
      );
      await shoot({ angle: 30, length: 124 });
      await settled();
      s = await state();
      const h = await high();
      assert.deepEqual(
        [s.misses, s.hints, h.thumps, h.band, h.drawn],
        [0, 1, 2, true, true],
        'a second thump shows the golden band, one hint',
      );
      await page.waitForTimeout(400);
      await screenshot('block-topple-4-portrait-band');
      const shapes = [];
      for (let i = 0; i < 3; i++) {
        await ready(i);
        shapes.push(await page.evaluate(() => neo.scene.game.line.stacks[0].blocks.length));
        await shoot(null);
        await page.waitForFunction((i) => neo.scene.game.lineIndex > i || neo.scene.game.finished, i, {
          timeout: 15000,
        });
      }
      assert.deepEqual(shapes, [2, 3, 2], 'a wide stack, a tall tower, then a wide stack');
      await finished('block-topple');
      assert.deepEqual(await score(), [0, 1], 'level 4 saved 0 misses, 1 hint');
    }

    // Level 5 in portrait: tip the wide stack, then two wrong counts on line 1 (one miss and the counting aloud, then the
    // glowing pad and one hint), the right count, and the right counts for the other two lines to the sticker.
    if (levels.includes(5)) {
      await launch('block-topple', 5, 'Mia', 'school');
      const pads = () =>
        page.waitForFunction(
          () => {
            const g = neo.scene.game;
            return g.pads.length === 3 && g.pads.every((p) => p.scale.x > 0.99) && !g.counting;
          },
          null,
          { timeout: 20000 },
        );
      const count = () =>
        page.evaluate(() => {
          const g = neo.scene.game;
          return {
            total: g.total,
            values: g.pads.map((p) => p.value),
            glow: g.pads.map((p) => p.glow.visible),
            misses: g.misses,
            hints: g.hints,
            tray: g.trayFruit.children.length,
          };
        });
      const tapPad = (v) =>
        page.evaluate((v) => {
          const g = neo.scene.game;
          kit.tapOn(g.pads.find((p) => p.value === v));
        }, v);
      const totals = [];
      for (let i = 0; i < 3; i++) {
        await ready(i);
        if (i === 0)
          assert.equal(
            (await state()).friend,
            'pig',
            'the authored first line has the pig on the wide stack',
          );
        await shoot(null);
        await pads();
        let c = await count();
        totals.push(c.total);
        assert.equal(c.tray, c.total, 'every fruit so far is in the tray, one per slot');
        assert.ok(c.values.includes(c.total), 'the pads hold the total');
        if (i === 0) {
          assert.equal(c.total, 2, 'the authored line holds two fruit');
          const wrong = c.values.filter((v) => v !== c.total);
          await tapPad(wrong[0]);
          await pads();
          c = await count();
          assert.deepEqual(
            [c.misses, c.hints, c.glow.some(Boolean)],
            [1, 0, false],
            'a wrong count is one miss, and the pet counts aloud',
          );
          await tapPad(wrong[1]);
          await page.waitForTimeout(300);
          c = await count();
          assert.deepEqual(
            [c.misses, c.hints, c.glow[c.values.indexOf(c.total)]],
            [1, 1, true],
            'a second wrong count lights the right pad, one hint',
          );
          await page.waitForTimeout(300);
          await screenshot('block-topple-5-portrait-tray');
        }
        await tapPad(c.total);
        await page.waitForFunction((i) => neo.scene.game.lineIndex > i || neo.scene.game.finished, i, {
          timeout: 15000,
        });
      }
      assert.ok(
        totals[0] < totals[1] && totals[1] < totals[2] && totals[2] >= 4 && totals[2] <= 8,
        `running totals rise to 4–8: ${totals}`,
      );
      await finished('block-topple');
      assert.deepEqual(await score(), [1, 1], 'level 5 saved 1 miss, 1 hint');
    }
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    const done = {
      1: 'level 1 three solver pulls tipped every tower 0/0',
      3: 'level 3 portrait, a short shot and a hill shot missed, the dotted path showed, then three tips 2/1',
      4: 'level 4 portrait, two thumps (no miss) showed the golden band, then three tips 0/1',
      5: 'level 5 portrait, two wrong counts (count aloud, glowing pad), then three tips and right counts 1/1',
    };
    log(`Block Topple ${levels.join(', ')}: ${levels.map((l) => done[l]).join('; ')}; passed`);
  }
  return { blockTopplePlay };
}
