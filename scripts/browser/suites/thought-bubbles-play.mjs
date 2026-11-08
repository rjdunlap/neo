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
          answer:
            g.story.cards && g.story.level === 1
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
    const dropCard = async (value) => {
      await ready();
      await page.evaluate(async (value) => {
        const g = neo.scene.game,
          card = g.cards.find((c) => c.value === value),
          b = g.bubble.getGlobalPosition(),
          s = neo.view.scale;
        await kit.dragTo(card.node, { x: b.x, y: b.y + 40 * s }, 12);
      }, value);
      await page.waitForTimeout(300);
    };
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
        if (s.stage === 'card') await dropCard(s.answer);
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
