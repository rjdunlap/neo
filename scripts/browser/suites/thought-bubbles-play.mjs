import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function thoughtBubblesPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('thought-bubbles').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          index: g.index,
          stage: g.stage,
          busy: g.busy,
          misses: g.tally.misses,
          hints: g.tally.hints,
          glowing: g.glowing,
          cards: g.cards.map((c) => c.value),
          filled: g.filled,
          level: g.story.level,
          answer:
            g.story.level >= 4
              ? null
              : g.story.cards && g.story.level === 1
                ? g.story.want.cued
                : g.story.level === 2
                  ? g.story.look.kind === 'away'
                    ? g.story.look.start
                    : g.story.look.end
                  : g.story.why.supported,
          kind: g.story.look?.kind,
          end: g.story.look?.end,
        };
      });
    const ready = async () => {
      await page.waitForFunction(
        () => neo.scene.finished || (!neo.scene.game.busy && neo.scene.game.stage !== 'watch'),
        null,
        { timeout: 60000 },
      );
      await page.waitForTimeout(250);
    };
    /** Carry a card into the bubble; the card rides 40 units above the finger. */
    const dropCard = async (value, bubble = 0) => {
      await ready();
      await page.evaluate(
        async ([value, bubble]) => {
          const g = neo.scene.game,
            card = g.cards.find((c) => c.value === value),
            b = g.bubbles[bubble].node.getGlobalPosition(),
            s = neo.view.scale;
          await kit.dragTo(card.node, { x: b.x, y: b.y + 40 * s }, 12);
        },
        [value, bubble],
      );
      // A right card at level 4 floats home before the next drag can pick it up.
      await page.waitForTimeout(600);
    };
    /** Level 4: where each of the two friends thinks the thing is, and where it really is, read from the story's events. */
    const twoState = () =>
      page.evaluate(() => {
        const { template: t, events, pattern, actual } = neo.scene.game.story.two;
        const believed = (who) =>
          events.reduce(
            (at, e) => ((e.kind === 'put' || e.kind === 'move') && e.saw.includes(who) ? e.to : at),
            null,
          );
        return { id: t.id, pattern, actual, answers: t.friends.map(believed) };
      });
    /** Level 5: each speech bubble's one possible teller, read from the story's events. */
    const tellState = () =>
      page.evaluate(() => {
        const { template: t, events, pattern, tellings } = neo.scene.game.story.tell;
        const cast = [t.friends[0], t.friends[1], t.movers[1]];
        const tellers = tellings.map((tl) =>
          cast.filter((f) => tl.told.every((i) => events[i].saw.includes(f))),
        );
        return { id: t.id, pattern, tellers };
      });
    const tapRegion = async (id) => {
      await ready();
      await page.evaluate((id) => {
        const g = neo.scene.game,
          r = g.story.why.regions.find((x) => x.id === id),
          b = {
            left: [20, 120, 130, 260],
            back: [170, 30, 180, 140],
            window: [400, 30, 180, 140],
            midFloor: [160, 250, 120, 130],
            floor: [440, 240, 180, 140],
          }[r.slot];
        const p = g.pointer.toGlobal({ x: b[0] + b[2] / 2, y: b[1] + b[3] / 2 });
        kit.tap(p.x, p.y);
      }, id);
      await page.waitForTimeout(300);
    };
    /** Answer everything left as the ghost finger does. */
    const finishRest = async (id) => {
      for (let k = 0; k < 12; k++) {
        await ready();
        if (await page.evaluate(() => neo.scene.finished)) break;
        const s = await state();
        if (s.stage === 'card' && s.level === 4) {
          const at = s.filled.indexOf(false);
          await dropCard((await twoState()).answers[at], at);
        } else if (s.stage === 'card' && s.level === 5) {
          const at = s.filled.indexOf(false);
          await dropCard((await tellState()).tellers[at][0], at);
        } else if (s.stage === 'card') await dropCard(s.answer);
        else if (s.stage === 'point')
          await tapRegion(
            await page.evaluate(
              () =>
                neo.scene.game.story.why.regions.find(
                  (r) => r.supports === neo.scene.game.story.why.supported,
                ).id,
            ),
          );
      }
      await finished(id);
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // `THOUGHT_BUBBLES_ONLY=tell` (batch `thought-bubbles 3`): level 5, *Who is telling?*, on a phone held upright in a
    // touch phone context. The authored round: Bear and Bunny's ball (left: the put and move 1, which only Bear saw; right:
    // the two moves, which only Duck the helper saw). Duck in the left bubble (a miss: Duck came in after the put, which
    // replays), then Bunny there (a second miss, out for move 1, and that bubble's glow, one hint), then Bear; a card on the
    // filled bubble is free; Duck on the right. The second story as the glow would, then the stayed story, where Duck fills
    // both bubbles, the right one first.
    if (process.env.THOUGHT_BUBBLES_ONLY === 'tell') {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(400);
      await launch('thought-bubbles', 5, 'Mia', 'school');
      await ready();
      assert.equal(
        await page.evaluate(
          () =>
            neo.view.upright === true && neo.turning === false && neo.scene.constructor.name === 'GameScene',
        ),
        true,
        'level 5 plays upright, no turn prompt',
      );
      let t = await tellState();
      assert.deepEqual(
        [t.id, t.pattern, t.tellers],
        ['ball-tidy', 'early', [['bear'], ['duck']]],
        'the authored first story: only Bear could tell the left bubble, only Duck the right',
      );
      const shown = await page.evaluate(() => {
        const g = neo.scene.game;
        return [
          g.bubbles.filter((b) => b.node.visible).length,
          g.bubbles.map((b) => b.parts.filter((p) => p.visible).length),
          g.cards.map((c) => c.value),
          g.replay.visible,
        ];
      });
      assert.deepEqual(
        shown,
        [2, [2, 2], ['bear', 'bunny', 'duck'], true],
        'two speech bubbles with their part pictures, the owners then the helper, and Replay',
      );
      await screenshot('thought-bubbles-5-upright');
      await dropCard('duck', 0);
      let p = await state();
      assert.deepEqual(
        [p.misses, p.hints, p.filled],
        [1, 0, [false, false]],
        'Duck was not there for the put: one miss',
      );
      assert.equal(
        await page.evaluate(() => neo.scene.game.busy && neo.scene.game.pulsing === 0),
        true,
        'the miss replays a beat with the left bubble pulsing',
      );
      await ready();
      p = await state();
      assert.equal(p.glowing, null, 'one miss on a bubble does not glow');
      await dropCard('bunny', 0);
      await ready();
      p = await state();
      assert.deepEqual(
        [p.misses, p.hints, p.glowing],
        [2, 1, { card: 'bear', bubble: 0 }],
        "a second wrong friend on the left bubble glows Bear's card and the bubble: one hint",
      );
      await dropCard('bear', 0);
      p = await state();
      assert.deepEqual(
        [p.filled, p.glowing],
        [[true, false], null],
        'the left bubble is filled and the glow is off',
      );
      await dropCard('bunny', 0);
      p = await state();
      assert.deepEqual([p.misses, p.hints, p.index], [2, 1, 0], 'a card dropped on a filled bubble is free');
      await dropCard('duck', 1);
      await page.waitForFunction(() => neo.scene.game.index === 1, null, { timeout: 60000 });
      await ready();
      t = await tellState();
      assert.deepEqual(
        [t.id, t.pattern, t.tellers],
        ['book-dust', 'crossed', [['bunny'], ['dog']]],
        'the authored crossed story',
      );
      await dropCard('bunny', 0);
      await dropCard('dog', 1);
      await page.waitForFunction(() => neo.scene.game.index === 2, null, { timeout: 60000 });
      await ready();
      t = await tellState();
      assert.deepEqual(
        [t.id, t.pattern, t.tellers],
        ['drum-room', 'stayed', [['duck'], ['duck']]],
        'the authored stayed story: Duck could tell both',
      );
      await dropCard('duck', 1);
      p = await state();
      assert.deepEqual(p.filled, [false, true], 'the right bubble can be filled first');
      await dropCard('duck', 0);
      await finished('thought-bubbles');
      assert.deepEqual(await score(), [2, 1], 'level 5 upright saved 2 misses, 1 hint');
      await page.setViewportSize({ width: 1024, height: 768 });
      log(
        'Thought Bubbles 5 upright phone (390 × 844, touch): the helper in a bubble with the put (the miss, the replayed beat), an owner out for move 1 on it (the glow, one hint), a free drop on the filled bubble, the crossed story, then the stayed story with one card in both bubbles (2/1); passed',
      );
      return;
    }

    // `THOUGHT_BUBBLES_ONLY=two` (batch `thought-bubbles 2`): level 4, *Two bubbles*, on a phone held upright in a touch
    // phone context. The authored round: Bear and Bunny's ball (Bear saw the first move, Bunny neither). Where the ball
    // really is in Bear's bubble (a miss, his last-seen beat replays), then the start place there (a second miss and that
    // bubble's glow, one hint), then the blue basket; a card dropped on the filled bubble is free; Bunny's red box. Then the
    // same story (both think the shelf) filled right bubble first with one card, and the last story as the glow would.
    if (process.env.THOUGHT_BUBBLES_ONLY === 'two') {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(400);
      await launch('thought-bubbles', 4, 'Mia', 'school');
      await ready();
      assert.equal(
        await page.evaluate(
          () =>
            neo.view.upright === true && neo.turning === false && neo.scene.constructor.name === 'GameScene',
        ),
        true,
        'level 4 plays upright, no turn prompt',
      );
      let t = await twoState();
      assert.deepEqual(
        [t.id, t.pattern, t.answers, t.actual],
        ['ball-tidy', 'oneMove', ['blueBasket', 'redBox'], 'shelf'],
        'the authored first story: Bear thinks the blue basket, Bunny the red box, and it is on the shelf',
      );
      const shown = await page.evaluate(() => {
        const g = neo.scene.game;
        return [g.bubbles.filter((b) => b.node.visible).length, g.cards.length, g.replay.visible];
      });
      assert.deepEqual(shown, [2, 3, true], 'two bubbles, three cards and Replay are on screen');
      await screenshot('thought-bubbles-4-upright');
      await dropCard('shelf', 0);
      let p = await state();
      assert.deepEqual([p.misses, p.hints, p.filled], [1, 0, [false, false]], 'where it really is: one miss');
      await ready();
      p = await state();
      assert.equal(p.glowing, null, 'one miss on a bubble does not glow');
      await dropCard('redBox', 0);
      await ready();
      p = await state();
      assert.deepEqual(
        [p.misses, p.hints, p.glowing],
        [2, 1, { card: 'blueBasket', bubble: 0 }],
        "a second wrong card on Bear's bubble glows his card and bubble: one hint",
      );
      await dropCard('blueBasket', 0);
      p = await state();
      assert.deepEqual(
        [p.filled, p.glowing],
        [[true, false], null],
        "Bear's bubble is filled and the glow is off",
      );
      await dropCard('shelf', 0);
      p = await state();
      assert.deepEqual([p.misses, p.hints, p.index], [2, 1, 0], 'a card dropped on a filled bubble is free');
      await dropCard('redBox', 1);
      await page.waitForFunction(() => neo.scene.game.index === 1, null, { timeout: 60000 });
      await ready();
      t = await twoState();
      assert.deepEqual(
        [t.id, t.pattern, t.answers],
        ['drum-room', 'sameStart', ['shelf', 'shelf']],
        'the authored same story: both think the shelf',
      );
      await dropCard('shelf', 1);
      p = await state();
      assert.deepEqual(p.filled, [false, true], 'the right bubble can be filled first');
      await dropCard('shelf', 0);
      await page.waitForFunction(() => neo.scene.game.index === 2, null, { timeout: 60000 });
      await finishRest('thought-bubbles');
      assert.deepEqual(await score(), [2, 1], 'level 4 upright saved 2 misses, 1 hint');
      await page.setViewportSize({ width: 1024, height: 768 });
      log(
        'Thought Bubbles 4 upright phone (390 × 844, touch): a wrong card in a bubble (the miss, the replayed beat), a second on it (the glow, one hint), a free drop on the filled bubble, the same story filled right bubble first, the third as the glow shows (2/1); passed',
      );
      return;
    }

    // `THOUGHT_BUBBLES_PHONE=1` (batch `thought-bubbles upright`): levels 1–3 on a phone held upright, in a touch phone
    // context, so the upright layout is the one played rather than the turn prompt. Level 1 answered right; level 2 the
    // authored away story with where the ball really is (a miss) then the start; level 3 a wrong reason, a free tap, the clue.
    if (process.env.THOUGHT_BUBBLES_PHONE === '1') {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(400);
      const upright = () =>
        page.evaluate(
          () =>
            neo.view.upright === true && neo.turning === false && neo.scene.constructor.name === 'GameScene',
        );
      await launch('thought-bubbles', 1, 'Mia', 'prek');
      assert.equal(await upright(), true, 'level 1 plays upright, no turn prompt');
      await finishRest('thought-bubbles');
      assert.deepEqual(await score(), [0, 0], 'level 1 upright saved 0 misses, 0 hints');

      await launch('thought-bubbles', 2, 'Mia', 'school');
      await ready();
      assert.equal(await upright(), true, 'level 2 plays upright');
      let p = await state();
      assert.deepEqual(
        [p.kind, p.answer, p.end],
        ['away', 'redBox', 'blueBasket'],
        'the authored away story',
      );
      await screenshot('thought-bubbles-2-upright');
      await dropCard('blueBasket');
      p = await state();
      assert.deepEqual([p.misses, p.hints], [1, 0], 'upright: where the ball really is, one miss');
      await finishRest('thought-bubbles');
      assert.deepEqual(await score(), [1, 0], 'level 2 upright saved 1 miss, 0 hints');

      await launch('thought-bubbles', 3, 'Mia', 'school');
      await dropCard('birthday');
      await dropCard('rain');
      await page.waitForFunction(() => neo.scene.game.stage === 'point', null, { timeout: 20000 });
      assert.equal(await upright(), true, 'level 3 plays upright');
      await tapRegion('vase');
      p = await state();
      assert.deepEqual([p.misses, p.hints, p.stage], [1, 0, 'point'], 'upright: a tap on the vase is free');
      await screenshot('thought-bubbles-3-upright');
      await tapRegion('clouds');
      await finishRest('thought-bubbles');
      assert.deepEqual(await score(), [1, 0], 'level 3 upright saved 1 miss, 0 hints');
      await page.setViewportSize({ width: 1024, height: 768 });
      log(
        'Thought Bubbles upright phone (390 × 844, touch): level 1 right (0/0); level 2 the actual place then the start (1/0); level 3 a wrong reason, a free tap, the clue (1/0); passed',
      );
      return;
    }

    // Level 1 (pre-K), authored: Bunny reaches up for the apple; the cards are ball, apple, kite. Ball (a miss), kite (a second
    // miss and the glow, one hint), then the apple; the other two stories answered right.
    await launch('thought-bubbles', 1, 'Mia', 'prek');
    await ready();
    await screenshot('thought-bubbles-1');
    let s = await state();
    assert.deepEqual(
      [s.cards, s.answer],
      [['ball', 'apple', 'kite'], 'apple'],
      'the authored first story and card order',
    );
    await dropCard('ball');
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.index], [1, 0, 0], 'a wrong card: one miss, the story stays');
    await dropCard('kite');
    await ready();
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.glowing],
      [2, 1, { card: 'apple' }],
      'a second wrong card glows the apple: one hint',
    );
    await dropCard('apple');
    await page.waitForFunction(() => neo.scene.game.index === 1, null, { timeout: 30000 });
    await finishRest('thought-bubbles');
    assert.deepEqual(await score(), [2, 1], 'level 1 saved 2 misses, 1 hint');

    // Level 2 (school), portrait, authored: Bear away (the ball moved red box → blue basket). The actual place is a miss and
    // the beat replays; then the red box. Then Cat watching from the window: the red box, right.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('thought-bubbles', 2, 'Mia', 'school');
    await ready();
    s = await state();
    assert.deepEqual([s.kind, s.answer, s.end], ['away', 'redBox', 'blueBasket'], 'the authored away story');
    await screenshot('thought-bubbles-2-portrait');
    await dropCard('blueBasket');
    s = await state();
    assert.deepEqual([s.misses, s.hints], [1, 0], 'where the ball really is: one miss');
    await ready();
    await dropCard('redBox');
    await page.waitForFunction(() => neo.scene.game.index === 1, null, { timeout: 40000 });
    await ready();
    s = await state();
    assert.deepEqual([s.kind, s.answer], ['watching', 'redBox'], 'the authored watching story');
    await dropCard('redBox');
    await page.waitForFunction(() => neo.scene.game.index === 2, null, { timeout: 40000 });
    await finishRest('thought-bubbles');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [1, 0], 'level 2 saved 1 miss, 0 hints');

    // Level 3 (school), authored: Duck's umbrella. Birthday (a miss), then rain; a free tap on the vase, then the clouds.
    await launch('thought-bubbles', 3, 'Mia', 'school');
    await dropCard('birthday');
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.stage], [1, 0, 'card'], 'a wrong reason: one miss');
    await dropCard('rain');
    await page.waitForFunction(() => neo.scene.game.stage === 'point', null, { timeout: 20000 });
    await tapRegion('vase');
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.stage], [1, 0, 'point'], 'a tap on the vase is free');
    await screenshot('thought-bubbles-3-point');
    await tapRegion('clouds');
    await page.waitForFunction(() => neo.scene.game.index === 1, null, { timeout: 30000 });
    await finishRest('thought-bubbles');
    assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');
    log(
      'Thought Bubbles 1–3: level 1 two wrong cards and the glow then the apple (2/1); portrait level 2 the actual place in an away story then the start, a watching story right (1/0); level 3 a wrong reason, a free region tap, then the clue (1/0); passed',
    );
  }
  return { thoughtBubblesPlay };
}
