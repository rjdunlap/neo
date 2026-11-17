import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
  /** Who Am I?: level 1 with one wrong friend (the reason) then the right one; level 3 with a keeps-tap, a requested hint (the shimmer) and every ruled-out friend turned over, a peek, and a portrait screenshot with three cards face down; level 4 (Surprises) with a keeps-tap and each surprise explained once, uncounted. */
  async function whoAmIPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('who-am-i').history.at(-1);
        return [r.misses, r.hints];
      });
    const settle = async () => {
      await page.waitForTimeout(300);
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 25000 });
      await page.waitForTimeout(250);
    };
    const tapCard = (i) => page.evaluate((i) => kit.tapOn(neo.scene.game.cards[i].node), i);
    const targets = () =>
      page.evaluate(async () => {
        const L = await import('/src/games/who-am-i/logic.ts');
        return L.helpTargets(neo.scene.game.play);
      });
    const answerAt = () =>
      page.evaluate(() => neo.scene.game.round.gallery.indexOf(neo.scene.game.round.answer));
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('who-am-i', 1);
    await settle();
    const wrong = await page.evaluate(() => {
      const g = neo.scene.game;
      return g.round.gallery.findIndex((f) => f !== g.round.answer);
    });
    await tapCard(wrong);
    await settle();
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.play.misses, neo.scene.game.play.hints]),
      [1, 0],
    );
    await tapCard(await answerAt());
    await finished('who-am-i');
    assert.deepEqual(await score(), [1, 0]);
    await launch('who-am-i', 3, 'Mia', 'school');
    await settle();
    // The answer is kept by every clue: a miss with the stays line, and no card turns.
    await tapCard(await answerAt());
    await settle();
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.play.misses, neo.scene.game.play.down.size]),
      [1, 0],
    );
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => neo.scene.game.play.hints), 1);
    let shot = false;
    for (let clue = 0; clue < 3; clue++) {
      await settle();
      for (const i of await targets()) {
        await tapCard(i);
        await page.waitForTimeout(450);
      }
      if (!shot && clue < 2 && (await page.evaluate(() => neo.scene.game.play.down.size)) >= 3) {
        await settle();
        // A free peek at a face-down friend.
        await tapCard(await page.evaluate(() => [...neo.scene.game.play.down][0]));
        await page.waitForTimeout(200);
        assert.deepEqual(
          await page.evaluate(() => [neo.scene.game.play.misses, neo.scene.game.play.hints]),
          [1, 1],
        );
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1300);
        await screenshot('who-am-i-3-portrait');
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(300);
        shot = true;
      }
    }
    await finished('who-am-i');
    assert.deepEqual(await score(), [1, 1]);
    assert.ok(shot, 'portrait screenshot with three cards down');
    // Level 4, Surprises: the penguin and the bat are always there; one keeps-tap, then every clue's flips; each surprise is
    // explained once and counts nothing.
    await launch('who-am-i', 4, 'Mia', 'school');
    await settle();
    const l4 = await page.evaluate(async () => {
      const L = await import('/src/games/who-am-i/logic.ts');
      const r = neo.scene.game.round;
      return { gallery: r.gallery, expected: L.surprises(r.gallery, r.clues).filter(Boolean) };
    });
    assert.ok(l4.gallery.includes('penguin') && l4.gallery.includes('bat'), 'level 4 has the penguin and the bat');
    assert.ok(l4.expected.length >= 1, 'level 4 has a surprise step');
    await screenshot('who-am-i-4');
    await tapCard(await answerAt());
    await settle();
    for (let clue = 0; clue < 3; clue++) {
      await settle();
      for (const i of await targets()) {
        await tapCard(i);
        await page.waitForTimeout(450);
      }
    }
    await finished('who-am-i');
    assert.deepEqual(await score(), [1, 0]);
    assert.deepEqual(
      await page.evaluate(() => [...neo.scene.game.play.explained].sort()),
      [...new Set(l4.expected)].sort(),
    );
    log(
      'Who Am I? 1, 3 and 4: wrong friend reason then fit, keeps-tap miss, requested shimmer hint, flips through three clues, a free peek, portrait, saved score; level 4 with the penguin and the bat, a keeps-tap miss, each surprise explained once and uncounted passed',
    );
  }

  return { whoAmIPlay };
}
