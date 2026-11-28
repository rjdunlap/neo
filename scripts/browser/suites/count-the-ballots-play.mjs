import assert from 'node:assert/strict';

/** Count the Ballots levels 1 and 2 by real taps, at a short phone with captions. */
export function createSuite({ page, launch, finished, screenshot }) {
  async function countTheBallotsPlay() {
    const id = 'count-the-ballots';
    await page.setViewportSize({ width: 390, height: 625 });
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
      kit.store.data.settings.showWords = true;
    });
    const state = () => page.evaluate(() => ({ ...neo.scene.game.state }));
    /** A real tap on a node's middle (a card, a pile or Help), read from the running game. */
    const tapNode = async (expression) => {
      const { x, y } = await page.evaluate((expression) => {
        const node = Function(`return (${expression})`)();
        const a = node.hitArea;
        const p = node.toGlobal({ x: a.x + a.width / 2, y: a.y + a.height / 2 });
        return { x: p.x, y: p.y };
      }, expression);
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(150);
    };
    /** A real tap on a round button (Undo, Restart), whose hit area is a ring, read from its bounds. */
    const button = async (name) => {
      const { x, y } = await page.evaluate((name) => {
        const b = neo.scene.game[name].getBounds();
        return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      }, name);
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(500);
    };
    /** Carries ballot `i` to pile `c` with a held pointer, in small steps. */
    const drag = async (i, c) => {
      const at = await page.evaluate(
        ([i, c]) => {
          const g = neo.scene.game;
          const a = g.cards[i].toGlobal({ x: 0, y: 0 });
          const b = g.trays[c].toGlobal({ x: 0, y: 0 });
          return { a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } };
        },
        [i, c],
      );
      await page.mouse.move(at.a.x, at.a.y);
      await page.mouse.down();
      await page.mouse.move((at.a.x + at.b.x) / 2, (at.a.y + at.b.y) / 2, { steps: 6 });
      await page.mouse.move(at.b.x, at.b.y, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(300);
    };
    const card = (i) => tapNode(`neo.scene.game.cards[${i}]`);
    const pile = (c) => tapNode(`neo.scene.game.trays[${c}]`);
    const rightPile = (i) => page.evaluate((i) => neo.scene.game.target(i), i);
    /** Sorts every ballot still in the hand into the pile it belongs in. */
    const sortHand = async () => {
      for (;;) {
        const s = await state();
        const i = s.placed.findIndex((p) => p === null);
        if (i < 0) return;
        await card(i);
        await pile(await rightPile(i));
        assert.notEqual((await state()).placed[i], null, `ballot ${i} should be in a pile`);
      }
    };
    const stage = (name) =>
      page.waitForFunction((name) => neo.scene.game.state.stage === name, name, { timeout: 20000 });
    const stickers = () =>
      page.evaluate((id) => kit.store.data.stickers.filter((s) => s.game === id).length, id);

    // Level 1: one wrong pile (a miss), Help for the ballot (one hint), then the sort, the run-off and the finish.
    await launch(id, 1);
    let s = await state();
    assert.equal(s.stage, 'sort');
    assert.equal(s.hand.length, 9);
    const before = await stickers();
    await card(0);
    assert.equal((await state()).selected, 0);
    const right = await rightPile(0);
    await pile((right + 1) % 3);
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.placed[0]],
      [1, 0, null],
      'a wrong pile is one miss and the ballot stays',
    );
    await tapNode('neo.scene.game.help');
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.glow], [1, 1, right], 'Help glows the right pile, one hint');
    await tapNode('neo.scene.game.help');
    assert.equal((await state()).hints, 1, 'asking again for the same ballot is free');
    await pile(right);
    assert.equal((await state()).placed[0], right);
    // Undo takes the last ballot back, free of misses and hints; dragging it carries it to its pile; a wrong drag floats home.
    await button('undoBtn');
    s = await state();
    assert.deepEqual([s.placed[0], s.misses, s.hints], [null, 1, 1], 'Undo returns the ballot, uncounted');
    await drag(0, (right + 1) % 3);
    s = await state();
    assert.deepEqual(
      [s.placed[0], s.misses],
      [null, 2],
      'a ballot dragged to the wrong pile is a miss and floats home',
    );
    await drag(0, right);
    assert.equal((await state()).placed[0], right, 'dragged to its pile');
    // Keys: an arrow lands on the next ballot, 1-3 pick a pile, Enter moves it.
    await page.keyboard.press('ArrowRight');
    s = await state();
    assert.equal(s.selected, 1, 'the first arrow lands on the first ballot still in the hand');
    const right1 = await rightPile(1);
    await page.keyboard.press(String(right1 + 1));
    await page.keyboard.press('Enter');
    assert.equal((await state()).placed[1], right1, 'Enter moves the ballot to the picked pile');
    // Restart deals the same hand again, keeping what was earned.
    const hand = (await state()).hand;
    await button('restartBtn');
    s = await state();
    assert.deepEqual(
      [s.stage, s.placed.every((p) => p === null), s.misses, s.hints, s.hand.join()],
      ['sort', true, 2, 1, hand.join()],
      'Restart redeals the same seed',
    );
    await sortHand();
    await stage('runoff');
    await screenshot('count-the-ballots-runoff');
    s = await state();
    const moving = s.placed.filter((p) => p === null).length;
    assert.ok(moving >= 2 && moving <= 4, `the smallest pile's ${moving} ballots come back to the hand`);
    await sortHand();
    await finished(id);
    assert.equal(await stickers(), before + 1, 'one sticker for the round');
    s = await state();
    assert.equal(s.misses, 2);
    assert.equal(s.hints, 1);
    await screenshot('count-the-ballots-portrait');

    // Level 2: the same, then the question. A wrong tap is a miss and glows the biggest pile (one hint).
    await launch(id, 2);
    await sortHand();
    await stage('runoff');
    await sortHand();
    await stage('question');
    s = await state();
    assert.notEqual(s.plurality, s.winner, 'level 2 deals the two counts apart');
    await pile((s.plurality + 1) % 3);
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.glow], [1, 1, s.plurality]);
    await pile(s.plurality);
    await finished(id);
    assert.equal(await stickers(), before + 2, 'a second sticker for the second round');
  }
  return { countTheBallotsPlay };
}
