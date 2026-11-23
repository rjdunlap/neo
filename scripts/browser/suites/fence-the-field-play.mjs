import assert from 'node:assert/strict';

// TODO: register this suite in scripts/browser/registry.mjs and the README browser table.
// Use the harness's isolated profile, silent browser and real kit taps/drags.
export function createSuite({ page, launch, finished, screenshot }) {
  async function fenceTheFieldPlay() {
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('fence-the-field', 1);
    // TODO: first/top levels, one wrong answer, a shown hint, finish and one reward.
    assert.fail('Scaffold: implement real input and tally assertions before running this suite');
    await finished('fence-the-field');
    await screenshot('fence-the-field-portrait'); // set the portrait viewport before this shot
  }
  return { fenceTheFieldPlay };
}
