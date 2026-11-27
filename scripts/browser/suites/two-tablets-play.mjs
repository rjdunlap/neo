import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot }) {
  /** Two Tablets by touch and keys: level 1 with a crib sign (stamps the key), an unknown sign (not yet), one wrong reading (the one miss), one Show me (dims a card), a portrait screenshot, then the ghost finger to a finish; level 2 with a wrong reading and a Show me, then a finish. */
  async function twoTabletsPlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          misses: g.misses,
          hints: g.hints,
          picks: [...g.picks],
          right: [...g.right],
          stamped: [...g.stamped],
          dimmed: g.dimmed.map((d) => [...d]),
          finished: g.finished,
        };
      });
    /** Taps the ghost finger's next target until the round is finished. */
    const botFinish = async () => {
      for (let i = 0; i < 80; i++) {
        const done = await page.evaluate(() => neo.scene.finished || neo.scene.game.finished);
        if (done) return;
        await page.evaluate(() => {
          const intent = neo.scene.game.autotouch();
          if (intent) kit.tapOn(intent.tap.on);
        });
        await page.waitForTimeout(220);
      }
    };
    /** A wrong card for group 0, pressed, then Read it. */
    const wrongReading = async () => {
      await page.evaluate(() => {
        const g = neo.scene.game;
        const grp = g.round.def.groups;
        grp.forEach((gr, gi) => {
          if (g.right.has(gi)) return;
          const wrong = gr.candidates.findIndex((c, ci) => c !== gr.answer && !g.dimmed[gi].has(ci));
          kit.tapOn(g.cards[gi][wrong]);
        });
        kit.tapOn(g.buttons[0]);
      });
      await page.waitForTimeout(300);
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('two-tablets', 1, 'Mia', 'grownup');
    await page.waitForTimeout(400);
    // A first-tablet sign stamps its sound into the key strip; the unknown sign says "not yet" and stamps nothing.
    await page.evaluate(() => kit.tapOn(neo.scene.game.cribSigns[0][0]));
    await page.evaluate(() => kit.tapOn(neo.scene.game.groupSigns[0][1]));
    await page.waitForTimeout(200);
    let s = await state();
    assert.deepEqual(s.stamped, [0], 'the tapped crib sign is stamped, the unknown sign is not');
    // Keys: the first arrow shows the ring, Enter taps the first stop (a crib picture, free).
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    s = await state();
    assert.equal(s.misses, 0, 'looking things up is never a miss');
    // One wrong reading is one miss.
    await wrongReading();
    s = await state();
    assert.equal(s.misses, 1, 'one miss for the wrong reading');
    assert.deepEqual(s.picks, [-1], 'a wrong group goes back to unchosen');
    // Show me dims one card that cannot be it.
    await page.evaluate(() => kit.tapOn(neo.scene.game.buttons[1]));
    await page.waitForTimeout(300);
    s = await state();
    assert.equal(s.hints, 1, 'one hint request');
    assert.equal(s.dimmed[0].length, 1, 'one card dimmed');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(400);
    await screenshot('two-tablets-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await botFinish();
    await finished('two-tablets');
    const r = await page.evaluate(() => kit.store.stats('two-tablets').history.at(-1));
    assert.equal(r.misses, 1);
    assert.equal(r.hints, 1);

    // Level 2: two unknown signs; a wrong reading, one Show me, then the finish.
    await launch('two-tablets', 2, 'Mia', 'grownup');
    await page.waitForTimeout(400);
    await wrongReading();
    await page.evaluate(() => kit.tapOn(neo.scene.game.buttons[1]));
    await page.waitForTimeout(300);
    s = await state();
    assert.equal(s.misses, 1, 'a wrong commit with two wrong groups is one miss');
    assert.equal(s.hints, 1);
    await botFinish();
    await finished('two-tablets');
    const r2 = await page.evaluate(() => kit.store.stats('two-tablets').history.at(-1));
    assert.equal(r2.misses, 1);
    assert.equal(r2.hints, 1);
  }
  return { twoTabletsPlay };
}
