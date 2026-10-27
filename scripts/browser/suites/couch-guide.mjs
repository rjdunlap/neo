import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot }) {
/**
 * How to play without starting a round: the menu's guide for every open game (looking counts as an explanation),
 * and the name card of a game that was already explained, which otherwise only says its name before the round.
 */
async function couchGuide(ids) {
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const open = async (selected, seen) => {
    await page.evaluate(({ selected, seen }) => {
      localStorage.setItem('neo.couch.v1', JSON.stringify({ version: 2, trips: 30, stickers: {}, seen, party: { seed: 4242, mode: 'together', reroll: 0, turn: null, selected, rounds: [] } }));
    }, { selected, seen });
    await page.reload(); await ready();
    await chooserEnter();
    await page.waitForFunction(() => neo.scene.screen === 'menu');
    await page.waitForTimeout(450);
  };
  await open(null, []);
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'guide');
  assert.deepEqual(await page.locator('[data-game]').evaluateAll(n => n.map(x => x.dataset.game).sort()), [...ids].sort(), 'the guide lists every open game');
  await screenshot('couch-guide');
  await page.waitForTimeout(450);
  await page.locator('[data-game="robot-path"]').click();
  await page.waitForFunction(() => neo.scene.screen === 'intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Robot Path');
  assert.equal(await page.getByRole('button', { name: 'Play', exact: true }).count(), 0, 'the guide never starts a round');
  assert.ok((await stored()).seen.includes('robot-path'), 'looking counts as an explanation');
  await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
  await screenshot('couch-guide-howto');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'guide');
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'menu');
  assert.equal((await stored()).party.rounds.length, 0, 'the guide leaves the trip alone');

  // An explained game: its name card waits once someone moves to How to play, which Back then calls off.
  await open('frog-hop', ids);
  await page.getByRole('button', { name: /^Resume /, exact: false }).click();
  await page.waitForFunction(() => neo.scene.screen === 'card');
  await page.waitForTimeout(450);
  await page.keyboard.press('ArrowRight', { delay: 120 });
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'How to play');
  await page.waitForTimeout(2000); // longer than the card's own countdown
  assert.equal(await page.evaluate(() => neo.scene.screen), 'card', 'the card waits for whoever is choosing');
  await screenshot('couch-name-card');
  await page.keyboard.press('Enter', { delay: 120 });
  await page.waitForFunction(() => neo.scene.screen === 'intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Frog Hop');
  await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'menu');
  assert.equal(await page.getByRole('button', { name: /^Resume / }).count(), 0, 'Back from How to play unchooses the game');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the guide leaves the child save unchanged');
  assert.deepEqual(errors, []);
  log('Couch guide: every open game listed, how-to and demo without a round, looking marks it explained, name card waits and offers How to play, Back unchooses passed');
}

return { couchGuide };
}
