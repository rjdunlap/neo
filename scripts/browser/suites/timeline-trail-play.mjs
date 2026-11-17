import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function timelineTrailPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('timeline-trail').history.at(-1);
        return [r.misses, r.hints];
      });
    const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          line: [...g.line],
          loose: [...g.loose],
          glowing: g.tally.glowing,
          rows: g.layoutNow?.rows.length ?? 0,
          busy: g.busy,
          finished: neo.scene.finished === true,
        };
      });
    const ready = async () => {
      await page.waitForFunction(() => neo.scene.game?.layoutNow && !neo.scene.game.busy, null, {
        timeout: 15000,
      });
      await page.waitForTimeout(300);
    };
    /** Drag the loose card `stage` so that it lands on gap `gap` (the card rides 40 above the finger). */
    const dragTo = async (stage, gap) => {
      await page.evaluate(
        async ({ stage, gap }) => {
          const g = neo.scene.game;
          const c = g.cards.find((k) => k.stage === stage && !k.hung);
          const at = g.gapNodes[gap].getGlobalPosition();
          await kit.dragTo(c.node, { x: at.x, y: at.y + 40 }, 14);
        },
        { stage, gap },
      );
      await page.waitForTimeout(600);
    };
    const validGap = (stage) =>
      page.evaluate((stage) => neo.scene.game.line.filter((s) => s < stage).length, stage);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 2: two cards hang; the loose card in a wrong gap slides back (one miss); Show me lights its gap (one hint); the valid gap finishes.
    await launch('timeline-trail', 2);
    await ready();
    let s = await state();
    assert.equal(s.line.length, 2, 'level 2 opens with two cards hung');
    assert.equal(s.loose.length, 1, 'and one loose card');
    const stage2 = s.loose[0];
    const valid2 = await validGap(stage2);
    const wrong2 = (valid2 + 1) % 3;
    await dragTo(stage2, wrong2);
    s = await state();
    assert.deepEqual(s.line.length, 2, 'a wrong gap leaves the line as it was');
    assert.deepEqual(await tally(), [1, 0], 'a wrong gap counts one miss');
    await dragTo(stage2, wrong2);
    assert.deepEqual(await tally(), [1, 0], 'the same card in the same wrong gap again counts nothing more');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    s = await state();
    assert.equal(s.glowing, stage2, 'Show me lights the loose card');
    assert.deepEqual(await tally(), [1, 1], 'Show me counts one hint');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(200);
    assert.deepEqual(await tally(), [1, 1], 'a second Show me on the same card counts nothing more');
    await screenshot('timeline-trail-2-landscape');
    await dragTo(stage2, valid2);
    await finished('timeline-trail');
    assert.deepEqual(await score(), [1, 1], 'level 2 saved 1 miss, 1 hint');

    // Level 3: a tap says the picture (free); hang the cards oldest first; a portrait look at the two-row line; finish 0/0.
    await launch('timeline-trail', 3);
    await ready();
    s = await state();
    assert.equal(s.line.length, 1, 'level 3 opens with the first card hung');
    assert.equal(s.loose.length, 3, 'and three loose cards');
    await page.evaluate(() => {
      const g = neo.scene.game;
      const c = g.cards.find((k) => !k.hung);
      kit.tapOn(c.node);
    });
    await page.waitForTimeout(500);
    s = await state();
    assert.equal(s.line.length, 1, 'a tap on a loose card hangs nothing');
    assert.deepEqual(await tally(), [0, 0], 'and counts nothing');
    for (let i = 0; i < 3; i++) {
      s = await state();
      const stage = Math.min(...s.loose);
      const gap = await validGap(stage);
      await dragTo(stage, gap);
      if (i === 1) {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(800);
        s = await state();
        assert.equal(s.line.length, 3, 'three cards hung');
        assert.equal(s.rows, 2, 'the portrait line of three cards and four gaps wraps into two rows');
        await screenshot('timeline-trail-3-portrait');
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(600);
      }
    }
    await finished('timeline-trail');
    assert.deepEqual(await score(), [0, 0], 'level 3 saved 0 misses, 0 hints');

    // Level 4: two places share the line; the first loose card in two different wrong gaps (two misses) lights its gap
    // (one hint); a tap on the second says its picture and its clue (free); both hang; a portrait look at the clue cards.
    await launch('timeline-trail', 4);
    await ready();
    s = await state();
    assert.equal(s.line.length, 2, 'level 4 opens with two cards of one place hung');
    assert.equal(s.loose.length, 2, 'and two cards of the other place loose');
    const places = await page.evaluate(() => {
      const r = neo.scene.game.round;
      return { hung: r.place, other: r.other, owners: r.owners };
    });
    assert.notEqual(places.hung, places.other, 'two places share the line');
    const first4 = s.loose[0];
    const valid4 = await validGap(first4);
    const wrongs4 = [0, 1, 2].filter((g) => g !== valid4);
    await dragTo(first4, wrongs4[0]);
    assert.deepEqual(await tally(), [1, 0], 'a wrong gap counts one miss');
    await dragTo(first4, wrongs4[1]);
    s = await state();
    assert.equal(s.line.length, 2, 'wrong gaps leave the line as it was');
    assert.deepEqual(await tally(), [2, 1], 'a second miss on the same card lights its gap, one hint');
    assert.equal(s.glowing, first4, 'the glow is on that card');
    await dragTo(first4, valid4);
    s = await state();
    assert.equal(s.line.length, 3, 'the valid gap hangs it');
    await page.evaluate(() => {
      const g = neo.scene.game;
      kit.tapOn(g.cards.find((k) => !k.hung).node);
    });
    await page.waitForTimeout(500);
    assert.deepEqual(await tally(), [2, 1], 'a tap on a loose clue card counts nothing');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('timeline-trail-4-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(600);
    s = await state();
    const last4 = s.loose[0];
    await dragTo(last4, await validGap(last4));
    await finished('timeline-trail');
    assert.deepEqual(await score(), [2, 1], 'level 4 saved 2 misses, 1 hint');

    // Level 5: a later place grows a line of four (one wrong gap, one miss); the full line swaps its gaps for the ribbon
    // and three chips; a chip let go away from the ribbon is free; the grand chip is a miss, the same again nothing;
    // Show a hint lights the still-here chip (one hint); a portrait look; the still-here chip dragged to the ribbon finishes.
    await launch('timeline-trail', 5);
    await ready();
    s = await state();
    assert.equal(s.line.length, 1, 'level 5 opens with the first card hung');
    assert.equal(s.loose.length, 3, 'and three loose cards');
    const round5 = await page.evaluate(() => {
      const r = neo.scene.game.round;
      return { place: r.place, chips: r.chips, still: r.still };
    });
    assert.ok(['green', 'oven'].includes(round5.place), 'level 5 shows a later place');
    const first5 = Math.min(...s.loose);
    await dragTo(first5, 0);
    assert.deepEqual(await tally(), [1, 0], 'a wrong gap counts one miss');
    for (let i = 0; i < 3; i++) {
      s = await state();
      const stage = Math.min(...s.loose);
      await dragTo(stage, await validGap(stage));
    }
    await page.waitForFunction(
      () => neo.scene.game.layoutNow?.ribbon && neo.scene.game.chipNodes.length === 3,
    );
    await page.waitForTimeout(400);
    const asked = await page.evaluate(() => {
      const g = neo.scene.game;
      return { gaps: g.layoutNow.gaps.length, rows: g.layoutNow.rows.length, busy: g.busy, pinned: g.pinned };
    });
    assert.deepEqual(
      asked,
      { gaps: 0, rows: 1, busy: false, pinned: false },
      'the full line shows the ribbon and waits',
    );
    const chipTo = async (element, where) => {
      await page.evaluate(
        async ({ element, where }) => {
          const g = neo.scene.game;
          const c = g.chipNodes.find((k) => k.element === element);
          const at = g.ribbonNode.getGlobalPosition();
          const to = where === 'ribbon' ? { x: at.x, y: at.y + 40 } : { x: at.x, y: 60 };
          await kit.dragTo(c.node, to, 14);
        },
        { element, where },
      );
      await page.waitForTimeout(700);
    };
    const tapChip = async (element) => {
      await page.evaluate((element) => {
        kit.tapOn(neo.scene.game.chipNodes.find((k) => k.element === element).node);
      }, element);
      await page.waitForTimeout(500);
    };
    const grand5 = round5.place === 'green' ? 'merry-go-round' : 'striped awning';
    assert.ok(round5.chips.includes(grand5), 'the grand thing is one of the chips');
    await chipTo(grand5, 'away');
    assert.deepEqual(await tally(), [1, 0], 'a chip let go away from the ribbon counts nothing');
    await chipTo(grand5, 'ribbon');
    assert.deepEqual(await tally(), [2, 0], 'the grand chip on the ribbon is a miss');
    await tapChip(grand5);
    assert.deepEqual(await tally(), [2, 0], 'the same wrong chip again counts nothing more');
    assert.equal(await page.evaluate(() => neo.scene.game.pinned), false, 'nothing is pinned yet');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    assert.deepEqual(await tally(), [2, 1], 'Show a hint counts one hint');
    assert.equal((await state()).glowing, -1, 'and lights the chip set');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    assert.equal(
      await page.evaluate(() => neo.scene.game.chipNodes.length),
      3,
      'the chips are still there in portrait',
    );
    await screenshot('timeline-trail-5-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(600);
    await screenshot('timeline-trail-5-landscape');
    await chipTo(round5.still, 'ribbon');
    assert.equal(
      await page.evaluate(() => neo.scene.game.pinned),
      true,
      'the still-here chip pins to the ribbon',
    );
    await finished('timeline-trail');
    assert.deepEqual(await score(), [2, 1], 'level 5 saved 2 misses, 1 hint');

    // Level 6: two cards hang and one waits; the misty card stays out of the tray until that one is hung; a tap on it
    // says what the mist hides (free); a gap neither reading fits is a miss; its later gap is accepted, counts nothing,
    // and the line (and the flipbook) keep the side she chose.
    await launch('timeline-trail', 6);
    await ready();
    s = await state();
    const round6 = await page.evaluate(() => {
      const r = neo.scene.game.round;
      return { place: r.place, k: r.misty.k, shown: neo.scene.game.cards.map((c) => c.stage) };
    });
    assert.ok(['shore', 'tree'].includes(round6.place), 'level 6 shows the shore or the tree');
    assert.equal(s.line.length, 2, 'level 6 opens with two cards hung');
    assert.deepEqual(s.loose.length, 2, 'one ordinary card and the misty card wait');
    assert.equal(s.loose[1], 4, 'the misty card is last');
    assert.deepEqual(round6.shown, [s.loose[0]], 'only the ordinary card is in the tray');
    await dragTo(s.loose[0], await validGap(s.loose[0]));
    s = await state();
    assert.deepEqual(s.loose, [4], 'the ordinary card hangs and the misty card comes out');
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.cards.map((c) => c.stage)),
      [4],
      'the misty card is now in the tray',
    );
    await page.evaluate(() => kit.tapOn(neo.scene.game.cards[0].node));
    await page.waitForTimeout(500);
    assert.deepEqual(await tally(), [0, 0], 'a tap on the misty card counts nothing');
    const at6 = s.line.indexOf(round6.k + 1);
    const wrong6 = [0, 1, 2, 3].find((g) => g !== at6 && g !== at6 + 1);
    await dragTo(4, wrong6);
    s = await state();
    assert.deepEqual(s.loose, [4], 'a gap neither reading fits leaves it loose');
    assert.deepEqual(await tally(), [1, 0], 'and counts one miss');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    assert.deepEqual(await tally(), [1, 1], 'Show a hint counts one hint');
    assert.equal((await state()).glowing, 4, 'and lights the misty card (both its gaps)');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('timeline-trail-6-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(600);
    const before6 = s.line;
    await dragTo(4, at6 + 1);
    s = await state();
    assert.deepEqual(
      s.line,
      [...before6.slice(0, at6 + 1), 4, ...before6.slice(at6 + 1)],
      'the later gap is accepted and the line keeps the side she chose',
    );
    assert.deepEqual(await tally(), [1, 1], 'and counts nothing');
    await finished('timeline-trail');
    assert.deepEqual(await score(), [1, 1], 'level 6 saved 1 miss, 1 hint');
    log(
      "Timeline Trail 2, 3, 4, 5 and 6: a wrong gap once (one miss), Show me twice (one hint), the valid gap; a free tap, three drags oldest first, a two-row portrait line at three hung; two places on one line, two wrong gaps lighting the clue card's gap, a free tap, a portrait look; level 5 a wrong gap, a free chip drop, the grand chip twice (one miss), Show a hint, the still-here chip pinned; level 6 the misty card held back, a free tap, a wrong gap (one miss), Show a hint, its later gap accepted with the line in her order, passed",
    );
  }
  return { timelineTrailPlay };
}
