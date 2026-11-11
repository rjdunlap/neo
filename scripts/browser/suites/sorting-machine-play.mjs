import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function sortingMachinePlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('sorting-machine').history.at(-1);
        return [r.misses, r.hints];
      });
    const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
    const settle = async () => {
      await page.waitForTimeout(250);
      await page.waitForFunction(
        () => neo.scene.finished || (!neo.scene.game.run && !neo.scene.game.busy),
        null,
        { timeout: 20000 },
      );
      await page.waitForTimeout(200);
    };
    const tapOn = async (expr) => {
      await page.evaluate((expr) => kit.tapOn(Function(`return (${expr})`)()), expr);
      await page.waitForTimeout(200);
    };
    const card = async (i) => {
      await tapOn(`neo.scene.game.cardNodes[${i}]`);
    };
    const send = async () => {
      await tapOn('neo.scene.game.sendButton');
      await settle();
    };
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          sent: [...g.sent],
          results: [...g.results],
          failing: [...g.failing],
          picker: g.pickerOpen,
          glow: g.tally.glowing,
          finished: neo.scene.finished === true,
        };
      });
    const asked = () => page.evaluate(() => neo.scene.game.brief.target.prop);
    const fixtures = () => page.evaluate(() => neo.scene.game.brief.fixtures.map((f) => [f.p, f.q]));
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 1: the door answers the fixed sensor; Done waits for both friends; nothing counts.
    await launch('sorting-machine', 1);
    await settle();
    const two = await fixtures();
    assert.equal(two.length, 2, 'two fixtures at level 1');
    await card(0);
    await send();
    let s = await state();
    assert.deepEqual(s.results, [two[0][0] === 1, null], 'the first run leaves its door mark');
    await tapOn('neo.scene.game.doneButton');
    await page.waitForTimeout(400);
    s = await state();
    assert.equal(s.finished, false, 'a dim Done does not end the round');
    await card(1);
    await send();
    s = await state();
    assert.deepEqual(s.results, [two[0][0] === 1, two[1][0] === 1], 'both door marks, one open and one shut');
    assert.ok(s.results.includes(true) && s.results.includes(false), 'level 1 shows an open and a shut door');
    await tapOn('neo.scene.game.doneButton');
    await finished('sorting-machine');
    assert.deepEqual(await score(), [0, 0], 'level 1 counts nothing');

    // Level 2: an incomplete Check is free; a wrong sensor fails on both mixed friends (one miss); a second wrong Check lights the glow (one hint);
    // Help runs a telling friend then installs the sensor (two hints); Check passes.
    await launch('sorting-machine', 2);
    await settle();
    const four = await fixtures();
    assert.equal(four.length, 4, 'four fixtures at level 2');
    const want = await asked();
    await tapOn('neo.scene.game.checkButton');
    await page.waitForTimeout(400);
    assert.deepEqual(await tally(), [0, 0], 'Check with an empty slot counts nothing');
    await card(0);
    await send();
    s = await state();
    assert.deepEqual(s.results, [null, null, null, null], 'an incomplete run leaves no door mark');
    const wrong = await page.evaluate(
      (want) => neo.scene.game.brief.candidates.findIndex((c) => c !== want),
      want,
    );
    await tapOn('neo.scene.game.slotNode');
    await page.waitForTimeout(300);
    assert.equal((await state()).picker, true, 'the slot opens its picker');
    await tapOn(`neo.scene.game.pickNodes[${wrong}]`);
    await page.waitForTimeout(300);
    assert.equal((await state()).picker, false, 'a pick closes the picker');
    await tapOn('neo.scene.game.checkButton');
    await settle();
    s = await state();
    assert.deepEqual(await tally(), [1, 0], 'a complete wrong machine: one miss');
    assert.equal(s.failing.length, 2, 'the other sensor fails on exactly the two mixed friends');
    assert.ok(
      s.failing.every((i) => four[i][0] !== four[i][1]),
      'the failing friends are the mixed ones',
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('sorting-machine-2-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await tapOn('neo.scene.game.slotNode');
    await page.waitForTimeout(300);
    await tapOn(`neo.scene.game.pickNodes[${wrong}]`);
    await page.waitForTimeout(300);
    await tapOn('neo.scene.game.checkButton');
    await settle();
    s = await state();
    assert.deepEqual(await tally(), [2, 1], 'the second miss lights the glow and counts one hint');
    assert.equal(s.glow, true, 'the slot glows after two misses');
    await page.evaluate(() => neo.scene.game.askForHint());
    await settle();
    assert.deepEqual(await tally(), [2, 2], 'Help runs a telling friend: one hint');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(400);
    assert.deepEqual(await tally(), [2, 3], 'Help installs the sensor: one more hint');
    assert.equal(
      await page.evaluate(() => neo.scene.game.graph.prop),
      want,
      'the installed sensor is the one the sign asks for',
    );
    assert.equal((await state()).finished, false, 'installing never ends the round by itself');
    await tapOn('neo.scene.game.checkButton');
    await finished('sorting-machine');
    assert.deepEqual(await score(), [2, 3]);

    // Level 3: two fixed sensors and one gate slot. An incomplete Check and an incomplete run are free; OR fails on exactly the two
    // mixed friends (one miss) and shows both sensors' readings; Help runs a mixed friend, then installs AND; Check passes.
    await launch('sorting-machine', 3);
    await settle();
    const quad = await fixtures();
    assert.equal(quad.length, 4, 'four fixtures at level 3');
    assert.deepEqual(
      await page.evaluate(() => [
        neo.scene.game.choices,
        neo.scene.game.graph.op,
        neo.scene.game.layoutNow.sensors.length,
      ]),
      [['AND', 'OR'], null, 2],
      'level 3 opens with two fixed sensors and an empty gate slot offering and / or',
    );
    await tapOn('neo.scene.game.checkButton');
    await page.waitForTimeout(400);
    assert.deepEqual(await tally(), [0, 0], 'Check with an empty gate slot counts nothing');
    await card(0);
    await send();
    assert.deepEqual(
      (await state()).results,
      [null, null, null, null],
      'a run with no gate leaves no door mark',
    );
    await tapOn('neo.scene.game.slotNode');
    await page.waitForTimeout(300);
    assert.equal(
      await page.evaluate(() => neo.scene.game.pickNodes.length),
      2,
      'the gate picker shows two gates',
    );
    await tapOn('neo.scene.game.pickNodes[1]');
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => neo.scene.game.graph.op), 'OR', 'the or gate is in the slot');
    const both = quad.findIndex(([p, q]) => p === 1 && q === 1);
    const one = quad.findIndex(([p, q]) => p !== q);
    await card(one);
    await send();
    await card(both);
    await send();
    s = await state();
    assert.equal(s.results[one], true, 'with or, a one-badge friend gets in (a free Send shows it)');
    assert.equal(s.results[both], true, 'with or, the both-badges friend gets in too');
    assert.deepEqual(await tally(), [0, 0], 'Sends never count');
    await tapOn('neo.scene.game.checkButton');
    await settle();
    s = await state();
    assert.deepEqual(await tally(), [1, 0], 'a complete wrong gate: one miss');
    assert.equal(s.failing.length, 2, 'or fails on exactly two friends');
    assert.ok(
      s.failing.every((i) => quad[i][0] !== quad[i][1]),
      'the failing friends are the one-badge ones',
    );
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.sensorTokens.map((t) => t.visible)),
      [true, true],
      "the failing run leaves both sensors' readings on screen",
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('sorting-machine-3-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await screenshot('sorting-machine-3-landscape');
    await page.evaluate(() => neo.scene.game.askForHint());
    await settle();
    assert.deepEqual(await tally(), [1, 1], 'Help runs a telling friend: one hint');
    assert.ok(
      await page.evaluate(() => {
        const g = neo.scene.game;
        const f = g.brief.fixtures[g.selected];
        return f.p !== f.q;
      }),
      'the friend Help runs wears one badge',
    );
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(400);
    assert.deepEqual(await tally(), [1, 2], 'Help installs the gate: one more hint');
    assert.equal(await page.evaluate(() => neo.scene.game.graph.op), 'AND', 'the installed gate is and');
    assert.equal((await state()).finished, false, 'installing never ends the round by itself');
    await tapOn('neo.scene.game.checkButton');
    await finished('sorting-machine');
    assert.deepEqual(await score(), [1, 2]);
    log(
      'Sorting Machine 1 to 3: both doors and a free Done, an incomplete Check, a wrong sensor twice (glow), Help twice, portrait, passed; 3: an empty gate, or sent and failed, Help twice, and passed',
    );
  }
  /**
   * Festival Signals (levels 8–9, the grown-up band): level 9's lantern lights wrongly for the both-badges friend; a failed
   * Check, Help twice (a run, then one fix), the rest by taps with the wire left behind (a second failed Check and the glow),
   * the wire moved, Undo and again, and passed. Level 8: an incomplete Check is free, the ghost finger's own taps build it.
   */
  async function festivalSignalsPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('sorting-machine').history.at(-1);
        return [r.misses, r.hints];
      });
    const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
    const settle = async () => {
      await page.waitForTimeout(250);
      await page.waitForFunction(
        () => neo.scene.finished || (!neo.scene.game.run && !neo.scene.game.busy),
        null,
        { timeout: 20000 },
      );
      await page.waitForTimeout(200);
    };
    const tapOn = async (expr) => {
      await page.evaluate((expr) => kit.tapOn(Function(`return (${expr})`)()), expr);
      await page.waitForTimeout(220);
    };
    const machine = () =>
      page.evaluate(async () => {
        const { encode } = await import('/src/games/sorting-machine/flat.ts');
        return encode(neo.scene.game.machine);
      });
    const both = () =>
      page.evaluate(() => neo.scene.game.brief.fixtures.findIndex((f) => f.p === 1 && f.q === 1));
    const send = async () => {
      await tapOn('neo.scene.game.sendButton');
      await settle();
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    await launch('sorting-machine', 9);
    await settle();
    assert.equal(
      await page.evaluate(() => kit.store.entry.startBand),
      'grownup',
      'level 9 plays at the grown-up band',
    );
    assert.equal(
      await machine(),
      'OR(P,Q) - - - >1',
      'level 9 opens three-quarters right, the lantern on slot 1',
    );
    const b = await both();
    await tapOn(`neo.scene.game.cardNodes[${b}]`);
    await send();
    assert.equal(
      await page.evaluate((b) => neo.scene.game.results[b], b),
      true,
      'the lantern lights for both badges',
    );
    assert.deepEqual(await tally(), [0, 0], 'sending is never counted');
    await tapOn('neo.scene.game.checkButton');
    await settle();
    assert.deepEqual(await tally(), [1, 0], 'a complete machine that fails Check is one miss');
    assert.deepEqual(
      await page.evaluate(() => [...neo.scene.game.failing]),
      [b],
      'only the both-badges friend is marked',
    );
    await page.evaluate(() => neo.scene.game.askForHint());
    await settle();
    assert.deepEqual(await tally(), [1, 1], 'Help first runs a friend the machine gets wrong');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    assert.equal(await machine(), 'OR(P,Q) AND(P,Q) - - >1', 'the next Help fixes one slot and keeps hers');
    assert.deepEqual(await tally(), [1, 2]);
    // Slot 3: NOT of slot 2. Slot 4: AND of slots 1 and 3. Then Check with the wire still on slot 1.
    await tapOn('neo.scene.game.slotNodes[2]');
    await tapOn('neo.scene.game.partNodes[2]');
    await tapOn('neo.scene.game.inputNodes[0][3]');
    await tapOn('neo.scene.game.slotNodes[3]');
    await tapOn('neo.scene.game.partNodes[0]');
    await tapOn('neo.scene.game.inputNodes[0][2]');
    await tapOn('neo.scene.game.inputNodes[1][4]');
    assert.equal(await machine(), 'OR(P,Q) AND(P,Q) NOT(2) AND(1,3) >1');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await screenshot('festival-signals-9-portrait');
    await tapOn('neo.scene.game.checkButton');
    await settle();
    assert.deepEqual(await tally(), [2, 3], 'the second miss lights the glow: one hint');
    assert.equal(await page.evaluate(() => neo.scene.game.tally.glowing), true);
    await tapOn('neo.scene.game.lanternNode');
    await tapOn('neo.scene.game.wireNodes[3]');
    assert.equal(await machine(), 'OR(P,Q) AND(P,Q) NOT(2) AND(1,3) >4', 'the lantern moves to slot 4');
    await tapOn('neo.scene.game.undoButton');
    assert.equal(await machine(), 'OR(P,Q) AND(P,Q) NOT(2) AND(1,3) >1', 'Undo takes the wire back');
    await tapOn('neo.scene.game.wireNodes[3]');
    await send();
    assert.equal(
      await page.evaluate((b) => neo.scene.game.results[b], b),
      false,
      'now the lantern rests for both',
    );
    await screenshot('festival-signals-9-portrait-sent');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    assert.deepEqual(await tally(), [2, 4], 'Help on a right machine says to Check, and is still a hint');
    await tapOn('neo.scene.game.checkButton');
    await finished('sorting-machine');
    assert.deepEqual(await score(), [2, 4]);

    await page.setViewportSize({ width: 1024, height: 768 });
    await launch('sorting-machine', 8);
    await settle();
    assert.equal(await machine(), '- - - - >4', 'level 8 opens empty, the lantern fixed to slot 4');
    await tapOn('neo.scene.game.lanternNode');
    assert.equal(
      await page.evaluate(() => neo.scene.game.selection),
      null,
      'the lantern is not a socket at level 8',
    );
    await tapOn('neo.scene.game.checkButton');
    assert.deepEqual(await tally(), [0, 0], 'an incomplete Check is free');
    assert.equal(
      await page.evaluate(() => neo.scene.game.selection),
      3,
      'and opens the first gap on the lantern path',
    );
    // The ghost finger's own taps, through the same nodes a player touches.
    for (let i = 0; i < 40; i++) {
      await settle();
      if (await page.evaluate(() => neo.scene.finished === true)) break;
      const tapped = await page.evaluate(() => {
        const t = neo.scene.game.autotouch();
        if (!t) return false;
        kit.tapOn(t.tap.on);
        return true;
      });
      assert.ok(tapped, 'the ghost finger always has a next tap');
      await page.waitForTimeout(220);
      if (i === 12) await screenshot('festival-signals-8-landscape');
    }
    await finished('sorting-machine');
    assert.deepEqual(await score(), [0, 0], 'built by taps alone: nothing counted');
    log(
      'Festival Signals 9 and 8 (grown-up): a wrong lantern, a failed Check, Help (run, fix), taps, the wire left behind (glow), the wire moved, Undo, passed [2, 4]; 8: a free incomplete Check, the ghost finger builds it, passed [0, 0]',
    );
  }
  return { sortingMachinePlay, festivalSignalsPlay };
}
