import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function notAlwaysPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('not-always').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game,
          p = g.play;
        return {
          claim: p.claim,
          phase: p.phase,
          misses: p.misses,
          hints: p.hints,
          glowing: p.glowing,
          target: p.target(),
          busy: g.busy,
        };
      });
    // Waits until taps are taken again (hit-testing uses the last frame, so let a fresh sign or row render first).
    const ready = async () => {
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 40000 });
      await page.waitForTimeout(250);
    };
    const tapCard = async (i) => {
      await ready();
      await page.evaluate((i) => kit.tapOn(neo.scene.game.cards[i].node), i);
      await page.waitForTimeout(250);
    };
    const tapStamp = async () => {
      await ready();
      await page.evaluate(() => kit.tapOn(neo.scene.game.stamp));
      await page.waitForTimeout(250);
    };
    const tapMend = async (j) => {
      await ready();
      await page.evaluate((j) => kit.tapOn(neo.scene.game.mendNodes[j]), j);
      await page.waitForTimeout(250);
    };
    const tapNode = async (list, j) => {
      await ready();
      await page.evaluate(([list, j]) => kit.tapOn(neo.scene.game[list][j]), [list, j]);
      await page.waitForTimeout(250);
    };
    /** Answer everything left with the hint target, as the ghost finger does. */
    const finishRest = async (id) => {
      for (let k = 0; k < 12; k++) {
        await ready();
        if (await page.evaluate(() => neo.scene.finished)) break;
        const s = await state();
        if (s.phase === 'done') break;
        if (s.target.kind === 'card') await tapCard(s.target.i);
        else if (s.target.kind === 'stamp') await tapStamp();
        else if (s.target.kind === 'why') await tapNode('responseNodes', s.target.j);
        else if (s.target.kind === 'reply') await tapNode('replyNodes', s.target.j);
        else await tapMend(s.target.j);
      }
      await finished(id);
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    // NOTALWAYS_LEVELS=4-6 runs only the levels 4–6 play; unset runs only levels 1–3.
    if (process.env.NOTALWAYS_LEVELS === '4-6') return levels46();

    // Level 1 (pre-K), the authored row: "All of these have hats!" is broken only by card C (index 2). Two cards with hats
    // (two misses, the glow, one hint), then C; the other two claims answered right.
    await launch('not-always', 1, 'Mia', 'prek');
    await ready();
    await screenshot('not-always-1');
    await tapCard(0);
    let s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.glowing, s.claim],
      [1, 0, false, 0],
      'a card with a hat: one miss, the claim stays',
    );
    await tapCard(1);
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.glowing],
      [2, 1, true],
      'a second fitting card lights the glow: one hint',
    );
    assert.deepEqual(s.target, { kind: 'card', i: 2 }, 'the glow is on the bare-headed card');
    await tapCard(2);
    await page.waitForFunction(() => neo.scene.game.play.claim === 1, null, { timeout: 20000 });
    await finishRest('not-always');
    assert.deepEqual(await score(), [2, 1], 'level 1 saved 2 misses, 1 hint');

    // Level 2 (school), portrait: five cards in two rows and the stamp. "All of these are red!" is false: stamping it is a
    // miss, then a breaker; "All of these have hats!" is true and stamped; the last claim answered right.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('not-always', 2, 'Mia', 'school');
    await tapStamp();
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.claim], [1, 0, 0], 'a false stamp: one miss, the claim stays');
    await screenshot('not-always-2-portrait');
    await tapCard(3);
    await page.waitForFunction(() => neo.scene.game.play.claim === 1, null, { timeout: 20000 });
    s = await state();
    assert.deepEqual(s.target, { kind: 'stamp' }, 'the hats claim is true of every card');
    await tapStamp();
    await page.waitForFunction(() => neo.scene.game.play.claim === 2, null, { timeout: 20000 });
    await finishRest('not-always');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [1, 0], 'level 2 saved 1 miss, 0 hints');

    // Level 3 (school): break "All of these have hats!" with card C, choose the false "None of these have hats!" (one miss),
    // then the true "None of these have spots!"; the second claim and its mend answered right.
    await launch('not-always', 3, 'Mia', 'school');
    await tapCard(2);
    await page.waitForFunction(() => neo.scene.game.play.phase === 'mend', null, { timeout: 20000 });
    await tapCard(0);
    s = await state();
    assert.deepEqual([s.misses, s.phase], [0, 'mend'], 'a card tap while the mended signs are up is free');
    await tapMend(0);
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.phase], [1, 0, 'mend'], 'a false mended claim: one miss');
    await screenshot('not-always-3-mends');
    await tapMend(1);
    await page.waitForFunction(() => neo.scene.game.play.claim === 1, null, { timeout: 20000 });
    await finishRest('not-always');
    assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');
    log(
      'Not Always 1–3: level 1 two fitting cards and the glow then the breaker (2/1); portrait level 2 a false stamp then a true claim stamped (1/0); level 3 a free card tap, one false mend then the true one (1/0); passed',
    );

    /** Levels 4–6 on an upright phone: a filtered claim, a disagreement, two signs and the unscored reply. */
    async function levels46() {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(600);
      // Level 4, authored: "Every red one is round!" Two blue cards (outside the group: two misses, the glow), then the red square.
      await launch('not-always', 4, 'Mia', 'school');
      await ready();
      const blues = await page.evaluate(() =>
        neo.scene.game.play.row.flatMap((c, i) => (c.color === 'blue' ? [i] : [])),
      );
      await tapCard(blues[0]);
      let s = await state();
      assert.deepEqual(
        [s.misses, s.hints, s.claim],
        [1, 0, 0],
        'a blue card cannot break a claim about the red ones: one miss',
      );
      await tapCard(blues[1]);
      s = await state();
      assert.deepEqual(
        [s.misses, s.hints, s.glowing],
        [2, 1, true],
        'a second outside card lights the glow: one hint',
      );
      const redSquare = await page.evaluate(() =>
        neo.scene.game.play.row.findIndex((c) => c.color === 'red' && c.shape === 'square'),
      );
      assert.deepEqual(s.target, { kind: 'card', i: redSquare }, 'the glow is on the red square');
      await screenshot('not-always-4-upright');
      await tapCard(redSquare);
      await page.waitForFunction(() => neo.scene.game.play.claim === 1, null, { timeout: 20000 });
      await finishRest('not-always');
      assert.deepEqual(await score(), [2, 1], 'level 4 saved 2 misses, 1 hint');

      // Level 5: "I'm very sure" is one miss, then the evidence; the other scenes answered right.
      await launch('not-always', 5, 'Mia', 'school');
      await ready();
      const sure = await page.evaluate(() => neo.scene.game.play.prompt.why.responses.indexOf('sure'));
      await tapNode('responseNodes', sure);
      s = await state();
      assert.deepEqual([s.misses, s.hints, s.claim], [1, 0, 0], 'being very sure is not a reason: one miss');
      await screenshot('not-always-5-upright');
      await tapNode('responseNodes', s.target.j);
      await page.waitForFunction(() => neo.scene.game.play.claim === 1, null, { timeout: 30000 });
      await finishRest('not-always');
      assert.deepEqual(await score(), [1, 0], 'level 5 saved 1 miss, 0 hints');

      // Level 6: a card on a both-true prompt (one miss), the stamp; rotate during the second prompt, a false stamp (one miss),
      // the breaker, then the reply scene: the rude reply, Help and the kind reply count nothing.
      await launch('not-always', 6, 'Mia', 'school');
      await tapCard(0);
      s = await state();
      assert.deepEqual([s.misses, s.claim], [1, 0], 'a card that fits both signs: one miss');
      await tapStamp();
      await page.waitForFunction(() => neo.scene.game.play.claim === 1, null, { timeout: 20000 });
      await ready();
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForTimeout(500);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(500);
      await screenshot('not-always-6-two-signs');
      // The second prompt's claims must have been read (a stamp before then only reads them, uncounted).
      await page.waitForFunction(() => !neo.scene.game.unasked, null, { timeout: 20000 });
      await tapStamp();
      s = await state();
      assert.deepEqual(
        [s.misses, s.claim],
        [2, 1],
        'a false stamp after rotating: one miss, the prompt stays',
      );
      await tapCard(s.target.i);
      await page.waitForFunction(() => neo.scene.game.play.phase === 'reply', null, { timeout: 20000 });
      await ready();
      const rude = await page.evaluate(() => neo.scene.game.play.round.replies.indexOf('rude'));
      await tapNode('replyNodes', rude);
      await page.evaluate(() => neo.scene.game.askForHint());
      s = await state();
      assert.deepEqual(
        [s.misses, s.hints, s.phase],
        [2, 0, 'reply'],
        'the rude reply and Help are never scored',
      );
      await screenshot('not-always-6-reply');
      await tapNode('replyNodes', s.target.j);
      await page.waitForFunction(() => neo.scene.game.play.claim === 2, null, { timeout: 20000 });
      await finishRest('not-always');
      assert.deepEqual(await score(), [2, 0], 'level 6 saved 2 misses, 0 hints');
      await page.setViewportSize({ width: 1024, height: 768 });
      log(
        'Not Always 4–6 upright: level 4 two outside cards and the glow then the breaker (2/1); level 5 a sure reply then the evidence (1/0); level 6 a card miss, a stamp, rotation, a false stamp, the breaker, the rude reply and Help unscored, the kind reply (2/0); passed',
      );
    }
  }
  return { notAlwaysPlay };
}
