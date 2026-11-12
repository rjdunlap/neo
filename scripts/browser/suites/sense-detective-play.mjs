import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
  /** Sense Detective: level 1 (a not-yet, a wrong tick, then found); level 2 in portrait (a look, a not-yet, a listen, a wrong tick, a requested hint); level 3 in portrait over two parcels (one more, a miss); level 4 (so far, a listen, a miss, a requested hint). */
  async function senseDetectivePlay() {
    if (process.env.SENSE_LEVEL === '5') return senseLevel5();
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('sense-detective').history.at(-1);
        return [r.misses, r.hints];
      });
    const settle = async () => {
      await page.waitForTimeout(300);
      await page.waitForFunction(
        () => neo.scene.finished || (!neo.scene.game.busy && !neo.scene.game.unasked),
        null,
        { timeout: 25000 },
      );
      await page.waitForTimeout(250);
    };
    const tapCard = async (own) => {
      await page.evaluate((own) => {
        const g = neo.scene.game;
        kit.tapOn(g.cards.find((c) => (c.id === g.round.hidden) === own).node);
      }, own);
      await page.waitForTimeout(250);
    };
    const tapNode = async (name) => {
      await page.evaluate((name) => kit.tapOn(neo.scene.game[name]), name);
      await settle();
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('sense-detective', 1);
    await settle();
    await tapCard(false);
    await tapNode('checkBtn');
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 0);
    await tapNode('lookBtn');
    await tapNode('checkBtn');
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 1);
    await tapCard(true);
    await tapNode('checkBtn');
    await finished('sense-detective');
    assert.deepEqual(await score(), [1, 0]);
    await launch('sense-detective', 2);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(400);
    await settle();
    await tapNode('lookBtn');
    await tapCard(false);
    await tapNode('checkBtn');
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 0);
    await tapNode('listenBtn');
    await screenshot('sense-detective-2-portrait');
    await tapNode('checkBtn');
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 1);
    await page.evaluate(() => neo.scene.game.askForHint());
    await tapCard(true);
    await tapNode('checkBtn');
    await finished('sense-detective');
    assert.deepEqual(await score(), [1, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Sense Detective 1 and 2: not-yet, wrong tick, found, look then listen, requested hint, portrait, saved score passed',
    );

    // Levels 3-4: select every toy the clues allow. The possible set is read from the game's own record and shelf.
    const left = () =>
      page.evaluate(async () => {
        const { possible } = await import('/src/games/sense-detective/logic.ts');
        const g = neo.scene.game;
        return possible(g.round.shelf, g.record);
      });
    const shelf = () => page.evaluate(() => neo.scene.game.round.shelf);
    const tapToy = async (id) => {
      await page.evaluate((id) => kit.tapOn(neo.scene.game.cards.find((c) => c.id === id).node), id);
      await page.waitForTimeout(300);
    };
    const misses = () => page.evaluate(() => neo.scene.game.misses);
    await launch('sense-detective', 3);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(400);
    await settle();
    await tapNode('lookBtn');
    let fit = await left();
    assert.equal(fit.length, 2, 'the authored first parcel leaves two toys');
    await tapToy(fit[0]);
    await tapNode('checkBtn');
    assert.equal(await misses(), 0, 'one more is free');
    const out = (await shelf()).find((t) => !fit.includes(t));
    await tapToy(out);
    await screenshot('sense-detective-3-two-selected-portrait');
    await tapNode('checkBtn');
    assert.equal(await misses(), 1, 'a ruled-out toy kept in is one miss');
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.chosen),
      [fit[0]],
      'the ruled-out toy deselects',
    );
    await tapToy(fit[1]);
    await tapNode('checkBtn');
    await page.waitForFunction(
      () => neo.scene.game.parcelIndex === 1 && !neo.scene.game.busy && !neo.scene.game.unasked,
      null,
      {
        timeout: 25000,
      },
    );
    assert.equal(
      await page.evaluate(() => neo.scene.game.record.length),
      0,
      'the record clears between parcels',
    );
    await tapNode('lookBtn');
    for (const t of await left()) await tapToy(t);
    await tapNode('checkBtn');
    await finished('sense-detective');
    assert.deepEqual(await score(), [1, 0]);
    await page.setViewportSize({ width: 1024, height: 768 });
    await launch('sense-detective', 4);
    await settle();
    assert.equal(
      await page.evaluate(() => neo.scene.game.listenBtn.visible),
      false,
      'the ear waits for the look',
    );
    await tapNode('lookBtn');
    fit = await left();
    for (const t of fit) await tapToy(t);
    await tapNode('checkBtn');
    assert.equal(
      await page.evaluate(() => neo.scene.game.listenOpen && neo.scene.game.listenBtn.visible),
      true,
      'so far opens the ear',
    );
    assert.equal(await misses(), 0);
    await tapNode('listenBtn');
    await tapNode('checkBtn');
    assert.equal(await misses(), 1, 'keeping the toy the sound rules out is a miss');
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
    for (const t of await left())
      if (!(await page.evaluate(() => neo.scene.game.chosen)).includes(t)) await tapToy(t);
    await tapNode('checkBtn');
    await finished('sense-detective');
    assert.deepEqual(await score(), [1, 1]);
    log(
      'Sense Detective 3 and 4: one more, a ruled-out miss, two parcels, so far, listen, miss, requested hint, saved scores passed',
    );
    await senseLevel5();
  }

  /** Level 5 (the authored round): both fit, Can't tell yet, the eye miss, the ear's reveal; then the rattle parcel in portrait, Can't tell yet as a miss, the rattle. */
  async function senseLevel5() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('sense-detective').history.at(-1);
        return [r.misses, r.hints];
      });
    const settle = async () => {
      await page.waitForTimeout(300);
      await page.waitForFunction(
        () => neo.scene.finished || (!neo.scene.game.busy && !neo.scene.game.unasked),
        null,
        { timeout: 25000 },
      );
      await page.waitForTimeout(250);
    };
    const tapNode = async (name) => {
      await page.evaluate((name) => kit.tapOn(neo.scene.game[name]), name);
      await settle();
    };
    const tapToy = async (id) => {
      await page.evaluate((id) => kit.tapOn(neo.scene.game.cards.find((c) => c.id === id).node), id);
      await page.waitForTimeout(300);
    };
    const tapSense = async (ch) => {
      await page.evaluate((ch) => kit.tapOn(neo.scene.game.choiceCards.find((c) => c.ch === ch).node), ch);
      await page.waitForTimeout(300);
    };
    const misses = () => page.evaluate(() => neo.scene.game.misses);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await page.setViewportSize({ width: 1024, height: 768 });
    await launch('sense-detective', 5);
    await settle();
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.round.parcels),
      ['drum', 'rattle'],
      'the authored first round',
    );
    await tapNode('lookBtn');
    await tapToy('bell');
    await tapNode('checkBtn');
    assert.equal(await misses(), 0, 'one toy when two fit is free');
    await page.evaluate(() => kit.tapOn(neo.scene.game.cantTellCard));
    await page.waitForTimeout(300);
    await screenshot('sense-detective-5-cant-tell-landscape');
    await tapNode('checkBtn');
    assert.equal(
      await page.evaluate(() => neo.scene.game.stage),
      'sense',
      "can't tell yet opens the eye or ear choice",
    );
    assert.equal(await misses(), 0);
    await tapSense('view');
    await tapNode('checkBtn');
    assert.equal(await misses(), 1, 'the eye is a miss');
    await tapSense('sound');
    await tapNode('checkBtn');
    await page.waitForFunction(
      () => neo.scene.game.parcelIndex === 1 && !neo.scene.game.busy && !neo.scene.game.unasked,
      null,
      {
        timeout: 25000,
      },
    );
    assert.equal(
      await page.evaluate(() => neo.scene.game.stage),
      'answer',
      'the next parcel starts at stage A',
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(400);
    await tapNode('lookBtn');
    await page.evaluate(() => kit.tapOn(neo.scene.game.cantTellCard));
    await page.waitForTimeout(300);
    await screenshot('sense-detective-5-cant-tell-portrait');
    await tapNode('checkBtn');
    assert.equal(await misses(), 2, "can't tell yet when the look decides is a miss");
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 0, 'one miss per parcel never glows');
    await tapToy('rattle');
    await tapNode('checkBtn');
    await finished('sense-detective');
    assert.deepEqual(await score(), [2, 0]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      "Sense Detective 5: both fit, can't tell yet, the eye miss, the ear's reveal, the rattle parcel in portrait, saved score passed",
    );
  }

  return { senseDetectivePlay };
}
