import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
  /** Who Am I? (level 6, You ask, is described where it is played below): level 1 with one wrong friend (the reason) then the right one; level 3 with a keeps-tap, a requested hint (the shimmer) and every ruled-out friend turned over, a peek, and a portrait screenshot with three cards face down; level 4 (Surprises) with a keeps-tap and each surprise explained once, uncounted. */
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
    assert.ok(
      l4.gallery.includes('penguin') && l4.gallery.includes('bat'),
      'level 4 has the penguin and the bat',
    );
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
    // Level 5, Which group?: the first clue is the answer's group. One tap on a kept friend (the group reason, a miss), the
    // pause sheet's hint shows what the group means (one hint, the same friends still ruled out), then every clue's flips.
    await launch('who-am-i', 5, 'Mia', 'school');
    await settle();
    const l5 = await page.evaluate(async () => {
      const L = await import('/src/games/who-am-i/logic.ts');
      const g = neo.scene.game;
      return {
        gallery: g.round.gallery,
        clues: g.round.clues,
        group: L.FRIENDS[g.round.answer].group,
        expected: L.surprises(g.round.gallery, g.round.clues).filter(Boolean),
        targets: L.helpTargets(g.play),
      };
    });
    assert.ok(
      l5.gallery.includes('penguin') && l5.gallery.includes('bat'),
      'level 5 has the penguin and the bat',
    );
    assert.equal(l5.clues[0], l5.group, "level 5's first clue is the answer's group");
    assert.ok(
      ['bird', 'mammal'].includes(l5.clues[0]) && l5.clues.length <= 2,
      'a bird or a mammal, at most two clues',
    );
    await tapCard(await answerAt());
    await settle();
    assert.deepEqual(
      await page.evaluate(() => [
        neo.scene.game.play.misses,
        neo.scene.game.play.hints,
        neo.scene.game.play.down.size,
      ]),
      [1, 0, 0],
    );
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(600);
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.play.hints, neo.scene.game.play.meaning]), [
      1,
      true,
    ]);
    assert.deepEqual(await targets(), l5.targets, 'the group hint rules out the same friends');
    // Asked again it only repeats the meaning: no second count.
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => neo.scene.game.play.hints), 1);
    await screenshot('who-am-i-5-group-hint');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1300);
    await screenshot('who-am-i-5-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    for (let clue = 0; clue < l5.clues.length; clue++) {
      await settle();
      for (const i of await targets()) {
        await tapCard(i);
        await page.waitForTimeout(450);
      }
    }
    await finished('who-am-i');
    assert.deepEqual(await score(), [1, 1]);
    assert.deepEqual(
      await page.evaluate(() => [...neo.scene.game.play.explained].sort()),
      [...new Set(l5.expected)].sort(),
    );
    // Level 6, You ask: the pet thinks of a secret friend and she asks from a tray of three question cards. A card tap
    // before any question counts nothing; the pause sheet's question hint counts once; one best question (a portrait
    // screenshot with the tray and the answer on the sign), one tap on a kept friend (a miss), the flips; then a dud (the
    // suite places one in the tray, because an asker who follows the best question is rarely dealt one) that turns nobody
    // over and counts nothing; then best questions to the end.
    await launch('who-am-i', 6, 'Mia', 'school');
    await settle();
    const ask6 = () =>
      page.evaluate(async () => {
        const L = await import('/src/games/who-am-i/logic.ts');
        const g = neo.scene.game,
          p = g.play,
          left = L.standing(p);
        return {
          gallery: g.round.gallery,
          askable: L.askable(g.round.gallery),
          tray: [...p.tray],
          cards: g.trayCards.map((c) => c.feature),
          splitting: p.tray.filter((f) => L.splits(f, left)),
          best: L.bestQuestion(p),
          spareDud: L.unasked(p).find((f) => !L.splits(f, left) && !p.tray.includes(f)) ?? null,
          asked: p.asked.map((a) => [a.feature, a.yes, a.dud]),
          current: p.current,
          secretHas: p.current ? L.keeps(p.current.feature, g.round.answer) : null,
          targets: L.helpTargets(p),
          score: [p.misses, p.hints],
          down: p.down.size,
          standing: left.length,
          done: p.done,
        };
      });
    const askCard = (f) =>
      page.evaluate((f) => kit.tapOn(neo.scene.game.trayCards.find((c) => c.feature === f).node), f);
    let q = await ask6();
    assert.equal(new Set(q.gallery).size, 6, 'level 6 has six different friends');
    assert.equal(q.tray.length, 3, 'three question cards');
    assert.deepEqual(q.cards, q.tray, 'the tray on screen is the tray in the rules');
    assert.equal(q.splitting.length, 3, 'the first tray holds no dud');
    assert.ok(!q.askable.includes('scales'), 'scales is never asked');
    // A friend tapped before any question: nothing turns, nothing counts.
    await tapCard(0);
    await page.waitForTimeout(300);
    q = await ask6();
    assert.deepEqual([q.score, q.down, q.asked.length], [[0, 0], 0, 0]);
    // The question hint from the pause sheet: counted once, however often it shows.
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    assert.deepEqual((await ask6()).score, [0, 1]);
    await screenshot('who-am-i-6-question-hint');
    await askCard(q.best);
    await settle();
    q = await ask6();
    assert.equal(q.asked.length, 1);
    assert.ok(q.current && q.current.yes === q.secretHas, "the answer is the secret friend's own");
    assert.ok(q.targets.length >= 1, 'a question that splits rules someone out');
    // A tray card while friends still need turning only repeats the answer.
    await askCard(q.tray[0]);
    await page.waitForTimeout(300);
    assert.equal((await ask6()).asked.length, 1, 'asking while turning records nothing');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1300);
    await screenshot('who-am-i-6-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    // The secret friend is kept by every answer: one miss, no card turns.
    await tapCard(await answerAt());
    await settle();
    assert.deepEqual([(await ask6()).score, (await ask6()).down], [[1, 1], 0]);
    for (const i of q.targets) {
      await tapCard(i);
      await page.waitForTimeout(450);
    }
    await settle();
    q = await ask6();
    let dudAsked = false;
    for (let guard = 0; !q.done && guard < 8; guard++) {
      assert.equal(q.current, null, 'choosing again after the flips');
      assert.ok(q.splitting.length >= 1, 'the tray always holds a question that splits');
      if (!dudAsked) {
        let dud = q.tray.find((f) => !q.splitting.includes(f)) ?? null;
        if (!dud && q.spareDud)
          dud = await page.evaluate(
            ([f, best]) => {
              const g = neo.scene.game;
              g.play.tray[g.play.tray.findIndex((t) => t !== best)] = f;
              g.drawTray();
              return f;
            },
            [q.spareDud, q.best],
          );
        if (dud) {
          const before = q;
          await askCard(dud);
          await settle();
          q = await ask6();
          assert.deepEqual(q.asked.at(-1), [dud, q.asked.at(-1)[1], true], 'a dud is recorded as one');
          assert.deepEqual(
            [q.score, q.down, q.current],
            [before.score, before.down, null],
            'a dud changes nothing',
          );
          assert.ok(!q.tray.includes(dud), 'the dud card is replaced');
          assert.equal(q.best, before.best, 'the best question is still in the tray');
          dudAsked = true;
        }
      }
      await askCard(q.best);
      await settle();
      q = await ask6();
      for (const i of q.targets) {
        await tapCard(i);
        await page.waitForTimeout(450);
      }
      await settle();
      q = await ask6();
    }
    await finished('who-am-i');
    assert.deepEqual(await score(), [1, 1]);
    assert.ok(dudAsked, 'one dud was asked');
    log(
      'Who Am I? 6: three question cards with no dud at first, a friend tap before asking uncounted, the question hint counted once (asked twice), the answer true of the secret friend, a kept-friend tap as the one miss, a dud that turns nobody and counts nothing with its card replaced, best questions to the last friend, portrait screenshot with the tray, saved score passed',
    );
    log(
      'Who Am I? 5: the group clue first, a kept-friend tap with the group reason, the pause-sheet hint showing what the group means (one hint, asked twice), flips to the answer, each surprise explained once, saved score passed',
    );
    log(
      'Who Am I? 1, 3 and 4: wrong friend reason then fit, keeps-tap miss, requested shimmer hint, flips through three clues, a free peek, portrait, saved score; level 4 with the penguin and the bat, a keeps-tap miss, each surprise explained once and uncounted passed',
    );
  }

  return { whoAmIPlay };
}
