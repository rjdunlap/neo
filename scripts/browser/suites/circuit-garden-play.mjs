import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function circuitGardenPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('circuit-garden').history.at(-1);
        return [r.misses, r.hints];
      });
    const seen = () => page.evaluate(() => ({ ...neo.scene.game.seen }));
    const settle = () => page.waitForTimeout(250);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 1: an early tick is free; drag the piece in, see it light, put it back, Undo brings it back, then Done.
    await launch('circuit-garden', 1, 'Mia', 'school');
    await page.waitForFunction(() => neo.scene.game?.seen.off === true, null, { timeout: 8000 });
    await page.evaluate(() => kit.tapOn(neo.scene.game.doneButton));
    await settle();
    assert.equal(await page.evaluate(() => neo.scene.finished), false, 'an early tick does not finish');
    await screenshot('circuit-garden-1-landscape');
    await page.evaluate(async () => {
      const g = neo.scene.game,
        t = g.targets.get('return');
      await kit.dragTo(g.pieces[0].node, t.getGlobalPosition(), 12);
    });
    await page.waitForFunction(() => neo.scene.game.seen.on === true, null, { timeout: 4000 });
    assert.equal(
      await page.evaluate(() => neo.scene.game.isLit),
      true,
      'the return piece lights the lantern',
    );
    await page.evaluate(() => kit.tapOn(neo.scene.game.backButton));
    await settle();
    assert.equal(
      await page.evaluate(() => neo.scene.game.isLit),
      false,
      'putting the piece back opens the loop',
    );
    await page.evaluate(() => kit.tapOn(neo.scene.game.undoButton));
    await settle();
    assert.equal(await page.evaluate(() => neo.scene.game.pieces[0].at), 'return', 'Undo refits the piece');
    await page.evaluate(() => kit.tapOn(neo.scene.game.doneButton));
    await finished('circuit-garden');
    assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

    // Level 1 by tap-then-tap with Show me twice: one hint, counted once.
    await launch('circuit-garden', 1, 'Mia', 'school');
    await page.waitForFunction(() => neo.scene.game?.seen.off === true, null, { timeout: 8000 });
    await page.evaluate(() => kit.tapOn(neo.scene.game.helpButton));
    await page.waitForFunction(() => neo.scene.game.seen.on === true, null, { timeout: 4000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => kit.tapOn(neo.scene.game.helpButton));
    await settle();
    assert.equal(
      await page.evaluate(() => neo.scene.game.tally.count),
      1,
      'a second Show me with nothing new adds no hint',
    );
    await page.evaluate(() => kit.tapOn(neo.scene.game.doneButton));
    await finished('circuit-garden');
    assert.deepEqual(await score(), [0, 1], 'level 1 with help saved 0 misses, 1 hint');

    // Level 2 in portrait: the switch, an early tick, Show me for the off state, then Done.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('circuit-garden', 2, 'Mia', 'prek');
    await page.waitForFunction(() => neo.scene.game?.seen.off === true, null, { timeout: 8000 });
    await page.evaluate(() => kit.tapOn(neo.scene.game.switchNode));
    await page.waitForFunction(() => neo.scene.game.seen.on === true, null, { timeout: 4000 });
    assert.deepEqual(await seen(), { on: true, off: true }, 'starting off and one flip shows both');
    await screenshot('circuit-garden-2-portrait');
    await page.evaluate(() => kit.tapOn(neo.scene.game.helpButton));
    await settle();
    assert.equal(
      await page.evaluate(() => neo.scene.game.tally.count),
      0,
      'Show me with both seen only points at the tick',
    );
    await page.evaluate(() => kit.tapOn(neo.scene.game.doneButton));
    await finished('circuit-garden');
    assert.deepEqual(await score(), [0, 0], 'level 2 saved 0 misses, 0 hints');

    // Level 2 again: Show me twice shows on, then nothing new; the lantern stays on at the finish.
    await launch('circuit-garden', 2, 'Mia', 'prek');
    await page.waitForFunction(() => neo.scene.game?.seen.off === true, null, { timeout: 8000 });
    await page.evaluate(() => kit.tapOn(neo.scene.game.helpButton));
    await page.waitForFunction(() => neo.scene.game.seen.on === true, null, { timeout: 4000 });
    await page.evaluate(() => kit.tapOn(neo.scene.game.doneButton));
    await finished('circuit-garden');
    assert.deepEqual(await score(), [0, 1], 'level 2 with help saved 0 misses, 1 hint');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    log(
      'Circuit Garden 1 and 2: level 1 early tick free, drag lights, put back, Undo, Done 0/0; Show me twice 0/1; level 2 portrait switch shows both, Show me only points, Done 0/0; Show me then Done 0/1; passed',
    );
  }
  return { circuitGardenPlay };
}
