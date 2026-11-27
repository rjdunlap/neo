import assert from 'node:assert/strict';

export function createSuite({ page, log, launch, finished, screenshot }) {
  /**
   * Dream Cards level 1, in portrait, with the pet: the pet gives a clue under the cloud; she points to a picture the clue does
   * not fit (nothing is wrong, no miss) after one Help glow; the picture turns over; Swap: she gives a clue about a picture, the
   * pet points, and the round finishes with no misses and one hint.
   */
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
    log(
      'Dream Cards 1: portrait, pet gives, Help, point, reveal, Swap, give a clue, pet points, finish passed',
    );
  }
  return { dreamCardsPlay };
}
