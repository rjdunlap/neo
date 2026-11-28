import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  /**
   * Playdate Workshop: level 1 with an out-of-turn tap (free), the lightbulb (one hint), give, a refused stamp, stamp, pass,
   * stamp and Finish (0/1); level 3 with two previews of the plan that leaves a request out (free, the request glows), Make it
   * on it (stays on the cards), then Help me make it (two hints), a portrait screenshot of the made plan and Finish (0/2); level 4 with a draft that only previews, the pet's two hints and Try the other way (0/2); level 5 with the
   request changing after two stars, a draft that only previews, the pet's revise and make hints and a portrait shot (0/2).
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

    // Level 4, the smudged banner: starting over only previews; the pet's help is two hints; the other repair plays free.
    await launch('playdate-workshop', 4);
    await settle();
    await tap('neo.scene.game.cardNodes.get("fresh")');
    await tap('neo.scene.game.makeButton');
    s = await state();
    assert.equal(s.phase, 'plan', 'starting a new banner leaves a friend out and only previews');
    assert.equal(s.hints, 0, 'previews are free');
    await tap('neo.scene.game.petButton');
    assert.equal((await state()).hints, 1, 'the pet picking a repair counts one hint');
    await tap('neo.scene.game.petButton');
    await page.waitForFunction(() => neo.scene.game.done, null, { timeout: 30000 });
    await settle();
    s = await state();
    assert.equal(s.hints, 2, 'Help me make it counts two hints at level 4');
    await tap('neo.scene.game.otherButton');
    await settle();
    assert.equal((await state()).done, true, 'Try the other way leaves the round finished');
    await tap('neo.scene.game.finishButton');
    await finished('playdate-workshop');
    assert.deepEqual(await score(), [0, 2], 'level 4 saves no misses and two hints');

    // Level 5, a new idea: the first two stars, then the request changes and the cards come back.
    await launch('playdate-workshop', 5);
    await settle();
    await tap('neo.scene.game.cardNodes.get("turnsTwo")');
    await tap('neo.scene.game.makeButton');
    await tap('neo.scene.game.friendNodes.A');
    await tap('neo.scene.game.cellNodes[0]');
    await tap('neo.scene.game.toolNodes[0].node');
    await tap('neo.scene.game.cellNodes[1]');
    s = await page.evaluate(() => ({
      stage: neo.scene.game.stage,
      phase: neo.scene.game.phase,
      base: neo.scene.game.base.length,
    }));
    assert.deepEqual(
      s,
      { stage: 2, phase: 'plan', base: 4 },
      'two stars change the idea and the cards return',
    );
    await tap('neo.scene.game.cardNodes.get("keepGoing")');
    await tap('neo.scene.game.makeButton');
    assert.equal(
      (await state()).phase,
      'plan',
      'continuing with stars leaves the new idea out and only previews',
    );
    await tap('neo.scene.game.petButton');
    await tap('neo.scene.game.petButton');
    await page.waitForFunction(() => neo.scene.game.done, null, { timeout: 40000 });
    await settle();
    s = await state();
    assert.equal(s.trace, 8, 'the two stars stay under the revised plan');
    assert.equal(s.hints, 2, 'revise and make are one hint each');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('playdate-workshop-5-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await tap('neo.scene.game.finishButton');
    await finished('playdate-workshop');
    assert.deepEqual(await score(), [0, 2], 'level 5 saves no misses and two hints');
    // Level 6, ask first: Make it before Ask only nudges; Ask (free) speaks the request; the pet's three decisions are three hints.
    await launch('playdate-workshop', 6);
    await settle();
    await tap('neo.scene.game.cardNodes.get("side")');
    await tap('neo.scene.game.makeButton');
    s = await state();
    assert.equal(s.phase, 'plan', 'Make it before Ask stays on the cards');
    assert.equal(s.hints, 0, 'the nudge is free');
    assert.equal(await page.evaluate(() => neo.scene.game.asked), false);
    await tap('neo.scene.game.askButton');
    assert.equal(await page.evaluate(() => neo.scene.game.asked), true, 'Ask reveals the request');
    assert.equal((await state()).hints, 0, 'tapping Ask is free');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('playdate-workshop-6-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await tap('neo.scene.game.petButton');
    await tap('neo.scene.game.petButton');
    await page.waitForFunction(() => neo.scene.game.done, null, { timeout: 30000 });
    await settle();
    s = await state();
    assert.equal(s.hints, 2, 'a round already asked: plan and make are one hint each');
    await tap('neo.scene.game.finishButton');
    await finished('playdate-workshop');
    assert.deepEqual(await score(), [0, 2], 'level 6 saves no misses and two hints');
    log(
      'Playdate Workshop 1, 3, 4, 5 and 6: a refused tap, the lightbulb, two unmet previews, Help me make it, portrait, passed',
    );
  }
  return { playdateWorkshopPlay };
}
