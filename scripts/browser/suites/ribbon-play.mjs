import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished }) {
  /** Ribbon Workshop: level 1 with two wrong checks (the glow and its one hint), both gifts by real taps; level 3's snip gift with its tempting too-long ribbon; level 6 Whole Switch with two wrong checks, a free same check and undo; level 7 Ribbon Cases with a refused place, two wrong checks and the tag-2 repair; portrait. */
  async function ribbonPlay() {
    // Follow the hint path with real taps until the round finishes (the ghost finger's rule).
    const playOut = () =>
      page.evaluate(async () => {
        for (let i = 0; i < 80 && !neo.scene.finished; i++) {
          const t = neo.scene.game.autotouch?.();
          if (t) kit.tapOn(t.tap.on);
          await kit.sleep(t ? 300 : 400);
        }
      });
    // RIBBON_LEVELS=upright plays only the phone held upright.
    const onlyUpright = process.env.RIBBON_LEVELS === 'upright';
    if (!process.env.RIBBON_LEVELS || onlyUpright) await upright(playOut);
    if (onlyUpright) return;
    await launch('ribbon-workshop', 1);
    const first = await page.evaluate(async () => {
      const g = neo.scene.game,
        out = [];
      // An empty check counts nothing.
      kit.tapOn(g.bow);
      await kit.sleep(500);
      out.push([g.misses, g.hints]);
      // One quarter is too short for a whole: a miss, then a second, and the glow comes with one hint.
      const q = g.state.tray.find((p) => p.size === 1);
      kit.tapOn(g.trayCards.get(q.id));
      await kit.sleep(300);
      kit.tapOn(g.bow);
      await kit.sleep(500);
      out.push([g.misses, g.hints, g.tally.glow]);
      kit.tapOn(g.bow);
      await kit.sleep(500);
      out.push([g.misses, g.hints, g.tally.glow]);
      return out;
    });
    assert.deepEqual(
      first,
      [
        [0, 0],
        [1, 0, false],
        [2, 1, true],
      ],
      'empty check free; second miss brings the glow and one hint',
    );
    await screenshot('ribbon-workshop-1-glow');
    await playOut();
    await finished('ribbon-workshop');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('ribbon-workshop').history.at(-1);
        return [r.level, r.misses, r.hints];
      }),
      [1, 2, 1],
    );

    await page.setViewportSize({ width: 768, height: 1024 });
    await launch('ribbon-workshop', 3);
    // Gift 1 by the hint path, then the snip gift by hand.
    await page.evaluate(async () => {
      for (let i = 0; i < 40 && neo.scene.game.gift === 0; i++) {
        const t = neo.scene.game.autotouch();
        if (t) kit.tapOn(t.tap.on);
        await kit.sleep(t ? 300 : 400);
      }
    });
    await page.waitForFunction(() => neo.scene.game.gift === 1 && !neo.scene.game.busy);
    const snip = await page.evaluate(async () => {
      const g = neo.scene.game,
        out = [];
      const [a, b] = g.state.tray.map((p) => p.id);
      kit.tapOn(g.trayCards.get(a));
      await kit.sleep(250);
      kit.tapOn(g.trayCards.get(b));
      await kit.sleep(250);
      kit.tapOn(g.bow);
      await kit.sleep(500);
      out.push(g.misses);
      kit.tapOn(g.benchPieces.get(b));
      await kit.sleep(250);
      kit.tapOn(g.scissors);
      await kit.sleep(250);
      out.push(g.snipping);
      kit.tapOn(g.trayCards.get(b));
      await kit.sleep(250);
      out.push(g.state.tray.map((p) => p.size).join(''));
      kit.tapOn(g.trayCards.get(g.state.tray[0].id));
      await kit.sleep(250);
      out.push(g.state.bench.map((p) => p.size).join(''));
      return out;
    });
    assert.deepEqual(snip, [1, true, '11', '21'], 'two halves are too long; snip one and use a quarter');
    await screenshot('ribbon-workshop-3-portrait');
    await page.evaluate(() => kit.tapOn(neo.scene.game.bow));
    await finished('ribbon-workshop');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('ribbon-workshop').history.at(-1);
        return [r.level, r.misses, r.hints];
      }),
      [3, 1, 0],
    );
    // Level 6, Whole Switch (portrait): free touches, two wrong checks (the glow and its one hint), tag 1, a free "same" check, undo, tag 2.
    await launch('ribbon-workshop', 6);
    const whole = await page.evaluate(async () => {
      const g = neo.scene.game,
        out = [];
      const until = async (fn) => {
        for (let i = 0; i < 60 && !fn(); i++) await kit.sleep(100);
      };
      // An empty check and a tap on the ribbon count nothing, and the ribbon has no action.
      kit.tapOn(g.bow);
      await kit.sleep(500);
      kit.tapOn(g.ribbonNode);
      await kit.sleep(300);
      out.push([g.misses, g.hints, g.state]);
      // "A quarter of the short spool" is false: a miss, the name card goes back, and the ghost measures the whole.
      kit.tapOn(g.spoolCards.get(12));
      await kit.sleep(300);
      kit.tapOn(g.nameCards.get(1));
      await kit.sleep(300);
      kit.tapOn(g.bow);
      await kit.sleep(200);
      out.push([g.misses, g.hints, g.measuring, g.state.claim]);
      await until(() => !g.measuring);
      // A second false name brings the glow and one hint; the next tap only skips the measure.
      kit.tapOn(g.nameCards.get(3));
      await kit.sleep(500);
      kit.tapOn(g.bow);
      await kit.sleep(200);
      out.push([g.misses, g.hints, g.bench.tally.glow, g.measuring]);
      kit.tapOn(g.nameCards.get(2));
      await kit.sleep(300);
      out.push([g.measuring, g.state.claim]);
      kit.tapOn(g.nameCards.get(2));
      await kit.sleep(300);
      kit.tapOn(g.bow);
      await until(() => g.bench.tag === 2 && !g.busy);
      // Tag 2 starts with tag 1's statement showing; checking it again is true, so it is free.
      out.push([g.state, g.bench.tally.glow]);
      await kit.sleep(450);
      kit.tapOn(g.bow);
      await kit.sleep(500);
      out.push([g.misses, g.hints, g.bench.tag]);
      // Switch the whole, pick the tempting three quarters, undo it, then the true name.
      kit.tapOn(g.spoolCards.get(24));
      await kit.sleep(300);
      kit.tapOn(g.nameCards.get(3));
      await kit.sleep(300);
      kit.tapOn(g.undo);
      await kit.sleep(450);
      out.push(g.state);
      kit.tapOn(g.nameCards.get(1));
      await kit.sleep(300);
      kit.tapOn(g.bow);
      await until(() => g.finale);
      out.push([g.finale, g.misses, g.hints]);
      return out;
    });
    assert.deepEqual(
      whole,
      [
        [0, 0, { whole: 0, claim: 0, made: 0 }],
        [1, 0, true, 0],
        [2, 1, true, true],
        [false, 0],
        [{ whole: 12, claim: 2, made: 12 }, false],
        [2, 1, 2],
        { whole: 24, claim: 2, made: 12 },
        [true, 2, 1],
      ],
      'Whole Switch: free touches, two misses and the glow, tag 1, a free same check, undo, tag 2',
    );
    await screenshot('ribbon-workshop-6-portrait');
    await finished('ribbon-workshop');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('ribbon-workshop').history.at(-1);
        return [r.level, r.misses, r.hints];
      }),
      [6, 2, 1],
    );
    // Level 7, Ribbon Cases (portrait): an empty check, a refused place on a full bench, two wrong checks (the glow and its one hint), tag 1 by the hint path, then the tag-2 repair by hand: a return, a select and a place.
    await launch('ribbon-workshop', 7);
    const cases = await page.evaluate(async () => {
      const g = neo.scene.game,
        out = [];
      const until = async (fn) => {
        for (let i = 0; i < 80 && !fn(); i++) await kit.sleep(100);
      };
      kit.tapOn(g.bow);
      await kit.sleep(500);
      out.push([g.misses, g.hints, g.state.active]);
      // Four quarters make the top ribbon a whole: the half is refused there, and nothing counts.
      for (const p of g.state.tray.filter((p) => p.size === 1)) {
        kit.tapOn(g.trayCards.get(p.id));
        await kit.sleep(300);
      }
      kit.tapOn(g.trayCards.get(g.state.tray[0].id));
      await kit.sleep(400);
      out.push([g.state.rails[0].length, g.state.tray.map((p) => p.size).join(''), g.misses]);
      // The top ribbon is too long and the bottom gift has none: a miss, then a second with the glow and one hint.
      kit.tapOn(g.bow);
      await kit.sleep(500);
      out.push([g.misses, g.hints, g.bench.tally.glow, g.bench.rails]);
      kit.tapOn(g.bow);
      await kit.sleep(500);
      out.push([g.misses, g.hints, g.bench.tally.glow]);
      for (let i = 0; i < 40 && g.bench.tag === 1; i++) {
        const t = g.autotouch();
        if (t) kit.tapOn(t.tap.on);
        await kit.sleep(t ? 300 : 400);
      }
      await until(() => g.bench.tag === 2 && !g.busy);
      await kit.sleep(700);
      out.push([
        [...g.bench.requests].sort().join(''),
        g.state.tray.length,
        g.bench.tally.glow,
        g.bench.canUndo,
        g.orderCard.visible,
      ]);
      return out;
    });
    assert.deepEqual(
      cases,
      [
        [0, 0, 0],
        [4, '2', 0],
        [1, 0, false, ['long', 'short']],
        [2, 1, true],
        ['24', 0, false, false, true],
      ],
      'Ribbon Cases tag 1: empty check and refused place free, two misses and the glow, then the order changes',
    );
    await screenshot('ribbon-workshop-7-portrait');
    const repair = await page.evaluate(async () => {
      const g = neo.scene.game,
        out = [];
      const grows = g.bench.requests[0] === 4 ? 0 : 1,
        quarter = g.state.rails[1 - grows].find((p) => p.size === 1);
      // A quarter comes off the gift that shrinks, the growing gift is chosen, and the quarter joins it.
      kit.tapOn(g.railPieces.get(quarter.id));
      await kit.sleep(300);
      out.push(g.state.tray.map((p) => p.id).join() === String(quarter.id));
      kit.tapOn(g.gifts[grows]);
      await kit.sleep(300);
      out.push(g.state.active === grows);
      kit.tapOn(g.trayCards.get(quarter.id));
      await kit.sleep(300);
      out.push(g.bench.rails);
      kit.tapOn(g.bow);
      for (let i = 0; i < 80 && !g.finale; i++) await kit.sleep(100);
      out.push([g.finale, g.misses, g.hints]);
      return out;
    });
    assert.deepEqual(
      repair,
      [true, true, ['right', 'right'], [true, 2, 1]],
      'Ribbon Cases tag 2: a return, a select and a place repair the changed order',
    );
    await finished('ribbon-workshop');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('ribbon-workshop').history.at(-1);
        return [r.level, r.misses, r.hints];
      }),
      [7, 2, 1],
    );
    // Level 8, How Many Pieces Fit?: an empty check, two pieces that run long, a return and a snip, tag 1; then an empty answer, the tempting 1¼ (the unit mistake: a miss, the glow and its one hint), and 1½.
    await launch('ribbon-workshop', 8);
    const fit = await page.evaluate(async () => {
      const g = neo.scene.game,
        out = [];
      const until = async (fn) => {
        for (let i = 0; i < 80 && !fn(); i++) await kit.sleep(100);
      };
      kit.tapOn(g.bow);
      await kit.sleep(500);
      out.push([g.misses, g.hints, g.bench.tag]);
      kit.tapOn(g.trayCards.get(0));
      await kit.sleep(300);
      kit.tapOn(g.trayCards.get(1));
      await kit.sleep(300);
      kit.tapOn(g.bow);
      await kit.sleep(500);
      out.push([g.misses, g.state.bench.map((p) => p.size).join('')]);
      kit.tapOn(g.benchPieces.get(1));
      await kit.sleep(300);
      kit.tapOn(g.scissors);
      await kit.sleep(300);
      kit.tapOn(g.trayCards.get(1));
      await kit.sleep(300);
      const bit = g.state.tray.find((p) => p.size === 1);
      kit.tapOn(g.trayCards.get(bit.id));
      await kit.sleep(300);
      kit.tapOn(g.bow);
      await until(() => g.bench.tag === 2 && !g.busy);
      await kit.sleep(500);
      out.push([g.bench.tag, g.misses, g.answerCards.size, g.scissors.visible]);
      kit.tapOn(g.bow);
      await kit.sleep(400);
      out.push([g.misses, g.hints]);
      kit.tapOn(g.answerCards.get('1_1/4'));
      await kit.sleep(300);
      kit.tapOn(g.bow);
      await kit.sleep(500);
      out.push([g.misses, g.hints, g.bench.tally.glow]);
      kit.tapOn(g.answerCards.get('2'));
      await kit.sleep(300);
      kit.tapOn(g.bow);
      await kit.sleep(500);
      out.push([g.misses, g.hints, g.bench.tally.glow]);
      return out;
    });
    assert.deepEqual(
      fit,
      [
        [0, 0, 1],
        [1, '22'],
        [2, 1, 4, false],
        [1, 0],
        [2, 0, false],
        [3, 1, true],
      ],
      'How Many Pieces Fit? tag 1: empty free, a long miss, a return and a snip; tag 2: an empty answer free, then the unit-mistake miss, a second miss, and the glow with its one hint',
    );
    await screenshot('ribbon-workshop-8-portrait');
    await page.evaluate(async () => {
      const g = neo.scene.game;
      kit.tapOn(g.answerCards.get('1_1/2'));
      await kit.sleep(300);
      kit.tapOn(g.bow);
    });
    await finished('ribbon-workshop');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('ribbon-workshop').history.at(-1);
        return [r.level, r.misses, r.hints];
      }),
      [8, 3, 1],
    );
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Ribbon Workshop: level 1 glow and both gifts, level 3 snip gift, level 6 Whole Switch (misses, glow, same, undo, both tags), level 7 Ribbon Cases (refused place, misses, glow, the changed order repaired), level 8 How Many Pieces Fit? (long miss, snip, unit-mistake miss, glow), portrait passed',
    );
  }

  // A phone held upright (390 × 844, touch emulated; chunk 31): no turn prompt, the bench, the tray, the cards and every
  // button inside the view and off Home, "?" and the guide at level 1, Whole Switch and Ribbon Cases; the ghost finger
  // finishes each.
  async function upright(playOut) {
    const device = await page.context().newCDPSession(page);
    await device.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    const fits = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        const v = neo.view;
        if (!v.upright || neo.turning) return ['not on the upright area'];
        const out = [];
        const nodes = [
          g.bow,
          g.undo,
          ...(g.scissors?.visible ? [g.scissors] : []),
          ...(g.trayCards?.values() ?? []),
          ...(g.spoolCards?.values() ?? []),
          ...(g.nameCards?.values() ?? []),
          ...(g.answerCards?.values() ?? []),
        ];
        const corners = [
          { x0: 0, y0: 0, x1: 115, y1: 210 },
          { x0: 0, y0: v.h - 170, x1: 150, y1: v.h },
        ];
        // Bounds are CSS pixels on the page; the view is in units.
        for (const n of nodes) {
          const b = n.getBounds();
          const x0 = b.x / v.scale,
            y0 = b.y / v.scale,
            x1 = (b.x + b.width) / v.scale,
            y1 = (b.y + b.height) / v.scale;
          if (x0 < -1 || y0 < -1 || x1 > v.w + 1 || y1 > v.h + 1) out.push('a target leaves the view');
          if (corners.some((k) => x0 < k.x1 && k.x0 < x1 && y0 < k.y1 && k.y0 < y1))
            out.push('a target covers a corner');
          if (Math.min(b.width, b.height) < 43)
            out.push(`a target is ${Math.round(Math.min(b.width, b.height))} px`);
        }
        return [...new Set(out)];
      });
    for (const level of [1, 6, 7, 8]) {
      await launch('ribbon-workshop', level);
      await page.waitForFunction(() => neo.view.upright === true && !!neo.scene.game, null, {
        timeout: 8000,
      });
      await page.waitForTimeout(600);
      assert.deepEqual(await fits(), [], `level ${level} fits a phone held upright`);
      await screenshot(`ribbon-workshop-${level}-upright-phone`);
      await playOut();
      await finished('ribbon-workshop');
    }
    await device.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await device.detach();
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    log(
      'Ribbon Workshop upright on a 390 × 844 phone: levels 1, 6, 7 and 8 lay out with no turn prompt, every card and button inside the view and off the corners; the ghost finger finishes each',
    );
  }

  return { ribbonPlay };
}
