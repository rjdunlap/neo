import assert from 'node:assert/strict';

/**
 * Stir and See by touch (docs/definitions/stir-and-see.md): level 1's two spoons and the shimmer that is still in there;
 * level 3's authored questions, a wrong cup one miss, the same cup again none, Show a hint twice one hint; level 5's free
 * look, a wrong tray one miss, filing before looking; upright phone screenshots of levels 1, 3 and 5.
 */
export function createSuite({ page, launch, finished, screenshot, log }) {
  async function stirSeePlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('stir-see').history.at(-1);
        return [r.misses, r.hints];
      });
    const tally = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);
    const settle = async () => {
      await page.waitForTimeout(250);
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 20000 });
      await page.waitForTimeout(200);
    };
    const tapOn = async (expr) => {
      await page.evaluate((expr) => kit.tapOn(eval(expr)), expr);
      await settle();
    };
    const found = () =>
      page.evaluate(() => kit.store.data.journal.found.filter((k) => k.startsWith('stir-see:')));
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 1 on an upright phone: sugar then sand into one cup; a tap on the cup shows the shimmer.
    await page.setViewportSize({ width: 390, height: 844 });
    await launch('stir-see', 1);
    await settle();
    assert.deepEqual(await page.evaluate(() => neo.scene.game.queue), ['sugar', 'sand']);
    await tapOn('neo.scene.game.spoonButton');
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.cups[0].cup),
      { shimmer: ['sugar'], heap: [], floating: [] },
      'the sugar vanishes and leaves its shimmer',
    );
    await tapOn('neo.scene.game.cups[0].view');
    assert.equal(await page.evaluate(() => neo.scene.game.stillThere), true, 'still in there');
    await screenshot('stir-see-1-phone');
    await tapOn('neo.scene.game.spoonButton');
    await finished('stir-see');
    assert.deepEqual(await score(), [0, 0]);
    const first = await found();
    for (const id of ['stir-see:vanishes', 'stir-see:settles', 'stir-see:still-there'])
      assert.ok(first.includes(id), `${id} joins the journal`);

    // Level 3: the authored questions (sugar, pebble, leaf).
    await launch('stir-see', 3);
    await settle();
    const q = () =>
      page.evaluate(() => {
        const f = neo.scene.game.find;
        return { index: f.index, cups: f.question.cups, target: f.question.target, answer: f.answer };
      });
    let now = await q();
    assert.deepEqual([now.cups, now.target], [['sand', 'sugar', 'leaf'], 'sugar']);
    assert.equal(await page.evaluate(() => neo.scene.instruction?.id), 'stirsee.instruct.find');
    await screenshot('stir-see-3-phone');
    await tapOn('neo.scene.game.cups[0].view');
    assert.deepEqual(await tally(), [1, 0], 'a wrong cup is one miss');
    await tapOn('neo.scene.game.cups[0].view');
    assert.deepEqual(await tally(), [1, 1], 'the same cup again is no new miss, and the right cup glows');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.deepEqual(await tally(), [1, 1], 'Show a hint counts once per question');
    await tapOn(`neo.scene.game.cups[${now.answer}].view`);
    for (let i = 0; i < 2; i++) {
      now = await q();
      await tapOn(`neo.scene.game.cups[${now.answer}].view`);
    }
    await finished('stir-see');
    assert.deepEqual(await score(), [1, 1]);

    // Level 5 sideways: look, file; file before looking; a wrong tray; then the rest.
    await page.setViewportSize({ width: 1024, height: 768 });
    await launch('stir-see', 5);
    await settle();
    const sort = () =>
      page.evaluate(() => {
        const s = neo.scene.game.sort;
        return { index: s.index, looked: s.looked, material: s.material, filed: neo.scene.game.filed };
      });
    assert.equal((await sort()).material, 'salt');
    await tapOn('neo.scene.game.cups[0].view');
    assert.equal((await sort()).looked, true, 'a tap on the cup lets it settle');
    assert.deepEqual(await tally(), [0, 0], 'looking is free');
    await tapOn('neo.scene.game.choices.vanish');
    // The pebble, filed under floated before looking: the cup settles, one miss, and it comes back.
    await tapOn('neo.scene.game.choices.float');
    assert.deepEqual(
      await sort().then((s) => [s.index, s.looked]),
      [1, true],
      'a wrong tray lets the cup settle and it stays',
    );
    assert.deepEqual(await tally(), [1, 0], 'a wrong tray is one miss');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    await screenshot('stir-see-5-phone');
    await tapOn('neo.scene.game.choices.settle');
    for (const tray of ['float', 'settle', 'vanish', 'float']) await tapOn(`neo.scene.game.choices.${tray}`);
    await finished('stir-see');
    assert.deepEqual(await score(), [1, 0]);
    assert.ok((await found()).includes('stir-see:floats'), 'the floats entry joins the journal');
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Stir and See: level 1 two spoons and the shimmer, level 3 one miss and one counted hint, level 5 free look, filing first and a wrong tray, phone screenshots, journal entries passed',
    );
  }
  return { stirSeePlay };
}
