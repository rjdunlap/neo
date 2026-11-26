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
    assert.equal(s.misses, 1);
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
