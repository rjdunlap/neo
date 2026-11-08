import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  /**
   * Playdate Workshop: level 1 with an out-of-turn tap (free), the lightbulb (one hint), give, a refused stamp, stamp, pass,
   * stamp and Finish (0/1); level 3 with two previews of the plan that leaves a request out (free, the request glows), Make it
   * on it (stays on the cards), then Help me make it (two hints), a portrait screenshot of the made plan and Finish (0/2).
   */
  async function playdateWorkshopPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('playdate-workshop').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          phase: g.phase,
          trace: g.trace.length,
          done: g.done,
          hints: g.tally.hints,
          misses: g.tally.misses,
          selected: g.selected,
          glow: g.glowRequest,
          bubbles: { ...g.bubbleState },
        };
      });
    const settle = async () => {
      await page.waitForTimeout(300);
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 30000 });
      await page.waitForTimeout(200);
    };
    const tap = async (expr) => {
      await page.evaluate((expr) => kit.tapOn(Function(`return (${expr})`)()), expr);
      await page.waitForTimeout(450);
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    await launch('playdate-workshop', 1);
    await settle();
    let s = await state();
    assert.equal(s.phase, 'make', 'level 1 opens on the table');
    await tap('neo.scene.game.pageNodes.B');
    assert.equal((await state()).trace, 0, 'a page tapped before anyone has the pad is refused');
    await tap('neo.scene.game.bulbButton');
    assert.equal((await state()).hints, 1, 'the lightbulb counts one hint');
    await tap('neo.scene.game.friendNodes.A');
    assert.equal((await state()).trace, 1, 'a tap on a friend gives them the pad');
    await tap('neo.scene.game.pageNodes.B');
    assert.equal((await state()).trace, 1, "the other friend's page waits for the pad");
    await tap('neo.scene.game.pageNodes.A');
    await tap('neo.scene.game.toolNodes[0].node');
    await tap('neo.scene.game.pageNodes.B');
    s = await state();
    assert.equal(s.trace, 4, 'stamp, pass, stamp');
    assert.ok(s.done, 'both pages have their star');
    assert.equal(s.misses, 0, 'refused taps are free');
    await tap('neo.scene.game.finishButton');
    await finished('playdate-workshop');
    assert.deepEqual(await score(), [0, 1], 'level 1 saves no misses and one hint');

    await launch('playdate-workshop', 3);
    await settle();
    await tap('neo.scene.game.cardNodes.get("justBanner")');
    await tap('neo.scene.game.tryButton');
    s = await state();
    assert.equal(s.selected, 'justBanner');
    assert.ok(Object.values(s.bubbles).includes('unmet'), 'the plan leaves a request outlined');
    await tap('neo.scene.game.makeButton');
    s = await state();
    assert.equal(s.phase, 'plan', 'Make it on a plan that leaves someone out only previews it');
    assert.ok(s.glow, 'two unmet previews glow the request');
    assert.equal(s.hints, 0, 'previews are free');
    await tap('neo.scene.game.petButton');
    s = await state();
    assert.equal(s.hints, 1, 'the pet picking counts one hint');
    assert.notEqual(s.selected, 'justBanner', 'the pet picks a plan that works for both');
    await tap('neo.scene.game.petButton');
    await page.waitForFunction(() => neo.scene.game.done, null, { timeout: 30000 });
    await settle();
    s = await state();
    assert.equal(s.phase, 'make');
    assert.equal(s.hints, 2, 'Help me make it counts two hints');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('playdate-workshop-3-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await tap('neo.scene.game.finishButton');
    await finished('playdate-workshop');
    assert.deepEqual(await score(), [0, 2], 'level 3 saves no misses and two hints');
    log(
      'Playdate Workshop 1 and 3: a refused tap, the lightbulb, two unmet previews, Help me make it, portrait, passed',
    );
  }
  return { playdateWorkshopPlay };
}
