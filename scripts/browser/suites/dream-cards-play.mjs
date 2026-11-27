import assert from 'node:assert/strict';

export function createSuite({ page, log, launch, finished, screenshot }) {
  /**
   * Dream Cards level 1, in portrait, with the pet: the pet gives a clue under the cloud; she points to a picture the clue does
   * not fit (nothing is wrong, no miss) after one Help glow; the picture turns over; Swap: she gives a clue about a picture, the
   * pet points, and the round finishes with no misses and one hint.
   */
  /**
   * Level 2: the pet gives a clue, she points, a second clue comes, Help glows the two clues, she moves her point and the
   * picture turns over; Swap: she gives a clue, the pet points, she gives a second clue, the pet looks again, and finish.
   */
  async function levelTwo() {
    const waitPhase = (name) =>
      page.waitForFunction((n) => neo.scene.game.state.phase === n && !neo.scene.game.busy, name, {
        timeout: 20000,
      });
    const tap = (expr) =>
      page.evaluate((e) => kit.tapOn(new Function('g', `return ${e}`)(neo.scene.game)), expr);
    await launch('dream-cards', 2);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    await tap('g.seatButtons[0]');
    await waitPhase('point');
    await tap('g.cards[0].root');
    await tap('g.tickBtn');
    await waitPhase('again');
    const clues = await page.evaluate(() => [neo.scene.game.state.clue, neo.scene.game.state.clue2]);
    assert.notEqual(clues[0], clues[1], 'a second clue differs from the first');
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.equal(
      await page.evaluate(() => neo.scene.game.tokens.filter((k) => k.glow.visible).length),
      2,
      'Help glows the two clues',
    );
    assert.equal(
      await page.evaluate(() => neo.scene.game.cards.filter((c) => c.glow.visible).length),
      0,
      'Help never glows a picture in the second look',
    );
    await screenshot('dream-cards-two-clues-portrait');
    await tap('g.cards[1].root');
    await tap('g.tickBtn');
    await waitPhase('reveal');
    await tap('g.swapBtn');
    await page.waitForFunction(() => neo.scene.game.state.phase === 'choose' && !neo.scene.game.busy, null, {
      timeout: 20000,
    });
    await tap('g.cards[1].root');
    await tap('g.tokens[0].root');
    await page.waitForTimeout(300);
    await tap('g.tokens[0].root');
    await waitPhase('second');
    const other = await page.evaluate(() => {
      const g = neo.scene.game;
      return g.tokens.findIndex((k) => k.clue !== g.state.clue);
    });
    await tap(`g.tokens[${other}].root`);
    await page.waitForTimeout(300);
    await tap(`g.tokens[${other}].root`);
    await waitPhase('reveal');
    await tap('g.finishBtn');
    await finished('dream-cards');
    const score = await page.evaluate(() => {
      const r = kit.store.stats('dream-cards').history.at(-1);
      return [r.misses, r.hints];
    });
    assert.deepEqual(score, [0, 1], 'level 2: no misses and one hint are saved');
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Dream Cards 2: second clue, Help glows two clues, move her point, Swap, second clue given, finish passed',
    );
  }

  async function dreamCardsPlay() {
    const waitPhase = (name) =>
      page.waitForFunction((n) => neo.scene.game.state.phase === n && !neo.scene.game.busy, name, {
        timeout: 20000,
      });
    const tap = (expr) =>
      page.evaluate((e) => kit.tapOn(new Function('g', `return ${e}`)(neo.scene.game)), expr);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('dream-cards', 1);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    await tap('g.seatButtons[0]');
    await waitPhase('point');
    await screenshot('dream-cards-portrait');
    await page.evaluate(() => neo.scene.game.askForHint());
    const hint = await page.evaluate(() => neo.scene.game.cards.filter((c) => c.glow.visible).length);
    assert.equal(hint, 1, 'Help glows one picture');
    // Any picture may be pointed to: the first one.
    const index = 0;
    await tap(`g.cards[${index}].root`);
    await tap('g.tickBtn');
    await waitPhase('reveal');
    assert.equal(await page.evaluate(() => neo.scene.game.t.misses), 0, 'pointing is never a miss');
    assert.equal(await page.evaluate(() => neo.scene.game.t.hints), 1);
    await tap('g.swapBtn');
    await page.waitForFunction(() => neo.scene.game.state.phase === 'choose' && !neo.scene.game.busy, null, {
      timeout: 20000,
    });
    await tap('g.cards[1].root');
    await tap('g.tokens[0].root');
    await page.waitForTimeout(300);
    await tap('g.tokens[0].root');
    await waitPhase('reveal');
    await tap('g.finishBtn');
    await finished('dream-cards');
    const score = await page.evaluate(() => {
      const r = kit.store.stats('dream-cards').history.at(-1);
      return [r.misses, r.hints];
    });
    assert.deepEqual(score, [0, 1], 'no misses and one hint are saved');
    await page.setViewportSize({ width: 1024, height: 768 });
    await levelTwo();
    log(
      'Dream Cards 1: portrait, pet gives, Help, point, reveal, Swap, give a clue, pet points, finish passed',
    );
  }
  return { dreamCardsPlay };
}
