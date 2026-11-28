import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot }) {
  async function waveRibbonPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('wave-ribbon').history.at(-1);
        return [r.misses, r.hints];
      });
    const settle = () => page.waitForTimeout(250);
    const tap = (expr) =>
      page.evaluate((e) => kit.tapOn(new Function('g', `return ${e}`)(neo.scene.game)), expr);
    const watched = (p) =>
      page.waitForFunction((k) => neo.scene.game.seen[k].peak && neo.scene.game.seen[k].arrival, p, {
        timeout: 9000,
      });
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 1: an early tick is free; Send runs the pulse to the flag; Step moves one frame; then Done 0/0.
    await launch('wave-ribbon', 1, 'Mia', 'school');
    await tap('g.doneButton');
    await settle();
    assert.equal(await page.evaluate(() => neo.scene.finished), false, 'an early tick does not finish');
    await tap('g.sendButton');
    await watched('medium');
    await screenshot('wave-ribbon-1-landscape');
    await page.waitForFunction(() => !neo.scene.game.playing, null, { timeout: 4000 });
    await tap('g.stepButton');
    await settle();
    assert.equal(
      await page.evaluate(() => neo.scene.game.t),
      0,
      'a step after the end starts again from flat',
    );
    await tap('g.doneButton');
    await finished('wave-ribbon');
    assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

    // Level 2 in portrait: an early Check only nudges; both heights sent; a wrong picture is one miss (not two for the
    // same choice); Help shows the matching picture (one hint); the right picture, Check, then Done: 1 miss, 1 hint.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('wave-ribbon', 2, 'Mia', 'school');
    await tap('g.checkButton');
    await settle();
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 0, 'an early Check is free');
    await tap('g.presetButtons.small');
    await tap('g.sendButton');
    await watched('small');
    await tap('g.presetButtons.tall');
    await tap('g.sendButton');
    await watched('tall');
    const [right, wrong] = await page.evaluate(() => {
      const g = neo.scene.game;
      const rightId = g.round.target;
      return [
        g.round.cards.indexOf(rightId),
        g.round.cards.indexOf(rightId === 'small' ? 'tall' : 'sideways'),
      ];
    });
    await tap(`g.cardNodes[${wrong}]`);
    await tap('g.checkButton');
    await settle();
    await tap('g.checkButton');
    await settle();
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 1, 'the same wrong picture counts once');
    await tap('g.helpButton');
    await settle();
    assert.equal(await page.evaluate(() => neo.scene.game.tally.count), 1, 'Help once is one hint');
    await tap(`g.cardNodes[${right}]`);
    await tap('g.checkButton');
    await settle();
    assert.equal(await page.evaluate(() => neo.scene.game.checked), true, 'the matching picture passes');
    await screenshot('wave-ribbon-portrait');
    await tap('g.doneButton');
    await finished('wave-ribbon');
    assert.deepEqual(await score(), [1, 1], 'level 2 saved 1 miss, 1 hint');

    // Level 3 on grownup band in portrait: same-size run and early Check are free; toggling Lane B and running
    // unlocks the hypothesis cards; wrong Check replays and counts once; Help once is one hint; Same mark passes.
    await launch('wave-ribbon', 3, 'Alex', 'grownup');
    await tap('g.sendButton');
    await page.waitForFunction(() => !neo.scene.game.playing && neo.scene.game.t >= 2.5, null, {
      timeout: 9000,
    });
    await tap('g.checkButton');
    await settle();
    assert.equal(
      await page.evaluate(() => neo.scene.game.misses),
      0,
      'same-size run and early Check are free',
    );
    await tap('g.laneBButton');
    await tap('g.sendButton');
    await watched('contrast');
    const [sameIdx, soonerIdx] = await page.evaluate(() => {
      const c = neo.scene.game.round.claims;
      return [c.indexOf('same-time'), c.indexOf('tall-sooner')];
    });
    await tap(`g.claimNodes[${soonerIdx}]`);
    await tap('g.checkButton');
    await settle();
    await tap('g.checkButton');
    await settle();
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 1, 'same wrong claim counts once');
    assert.equal(await page.evaluate(() => neo.scene.game.playing), true, 'wrong Check replays both lanes');
    await tap('g.helpButton');
    await settle();
    assert.equal(await page.evaluate(() => neo.scene.game.tally.count), 1, 'Help once is one hint');
    await tap(`g.claimNodes[${sameIdx}]`);
    await tap('g.checkButton');
    await settle();
    assert.equal(await page.evaluate(() => neo.scene.game.checked), true, 'Same mark passes');
    await screenshot('wave-ribbon-level3-portrait');
    await tap('g.doneButton');
    await finished('wave-ribbon');
    assert.deepEqual(await score(), [1, 1], 'level 3 saved 1 miss, 1 hint');
  }
  return { waveRibbonPlay };
}
