import assert from 'node:assert/strict';

// TODO: register this suite in scripts/browser/registry.mjs and the README browser table.
// Use the harness's isolated profile, silent browser and real kit taps/drags.
export function createSuite({ page, launch, finished, screenshot }) {
  async function workshopDetectivePlay() {
    await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
    await launch("workshop-detective", 1);
    // TODO: first/top levels, one wrong answer, a shown hint, finish and one reward.
    assert.fail('Scaffold: implement real input and tally assertions before running this suite');
    await finished("workshop-detective");
    await screenshot('workshop-detective-portrait'); // set the portrait viewport before this shot
  }
  return { workshopDetectivePlay };
}
