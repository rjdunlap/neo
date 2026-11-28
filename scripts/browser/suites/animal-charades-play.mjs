import assert from 'node:assert/strict';

export function createSuite({ page, log, launch, finished, screenshot }) {
  /**
   * Animal Charades level 1, in portrait, with the pet: the pet acts a motion; she taps a wrong card (one miss, the card
   * dims), then the right card, which slides forward; Swap: she acts for the pet, the pet guesses, Not yet then Yes!; finish
   * with one miss and no hints.
   */
  async function animalCharadesPlay() {
    const waitScreen = (name) =>
      page.waitForFunction((n) => neo.scene.game.screen === n && !neo.scene.game.busy, name, {
        timeout: 25000,
      });
    const tap = (expr) =>
      page.evaluate((e) => kit.tapOn(new Function('g', `return ${e}`)(neo.scene.game)), expr);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('animal-charades', 1);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    await tap('g.seatButtons[0]');
    await waitScreen('guess');
    await screenshot('animal-charades-portrait');
    const wrong = await page.evaluate(() => [0, 1, 2].find((i) => i !== neo.scene.game.deal.target));
    await tap(`g.cards[${wrong}].root`);
    await page.waitForFunction(() => neo.scene.game.state.misses === 1 && !neo.scene.game.busy, null, {
      timeout: 25000,
    });
    await tap('g.cards[g.deal.target].root');
    await waitScreen('reveal');
    await tap('g.swapBtn');
    await waitScreen('show');
    await tap('g.readyBtn');
    await waitScreen('petguess');
    await tap('g.notYetBtn');
    await waitScreen('petguess');
    await tap('g.yesBtn');
    await waitScreen('reveal');
    await tap('g.finishBtn');
    await finished('animal-charades');
    const score = await page.evaluate(() => {
      const r = kit.store.stats('animal-charades').history.at(-1);
      return [r.misses, r.hints];
    });
    assert.deepEqual(score, [1, 0], 'one wrong card is one miss and nothing in the acting turn counts');
    await page.setViewportSize({ width: 1024, height: 768 });
    log('Animal Charades 1: wrong card, right card, Swap, Not yet, Yes!, finish passed');
  }
  return { animalCharadesPlay };
}
