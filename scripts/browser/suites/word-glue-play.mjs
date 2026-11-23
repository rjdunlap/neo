import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  /** Word Glue: level 1 with a tap-to-join then drags (0/0); level 3 with one wrong friend (it makes a real thing, one miss), Show a hint (one hint), then every ask joined (1/1); a portrait screenshot of level 2. */
  async function wordGluePlay() {
    /**
     * Level 5, What kind of thing?, on an upright phone: a touch that slides off a part is free, a tap on the made thing
     * repeats the question, one wrong tap is one miss, Show a hint glows the right part (one hint), then every ask
     * answered (1/1) with one sticker.
     */
    const kindPlay = async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await launch('word-glue', 5);
      await settle();
      assert.equal(
        await page.evaluate(() => neo.scene.game.view.upright),
        true,
        'the upright layout is played',
      );
      const ask = () =>
        page.evaluate(() => {
          const g = neo.scene.game;
          const a = g.s.round.asks[g.s.index];
          return { word: a.entry.word, first: a.entry.first, second: a.entry.second, pictures: a.pictures };
        });
      const tapPart = (key) =>
        page.evaluate((k) => kit.tapOn(neo.scene.game.cards.find((c) => c.key === k).node), key);
      const first = await ask();
      assert.deepEqual(
        [first.word, first.pictures],
        ['doghouse', ['dog', 'house']],
        'the authored round opens on the doghouse with the house on the second side',
      );
      // Every target is on screen and at least 44 CSS px.
      const boxes = await page.evaluate(() => {
        const g = neo.scene.game;
        return [...g.cards.map((c) => c.node), g.showing.made.node].map((n) => {
          const b = n.getBounds();
          return [b.x, b.y, b.width, b.height];
        });
      });
      for (const [x, y, w, h] of boxes) {
        assert.ok(
          x >= 0 && y >= 0 && x + w <= 390 && y + h <= 844,
          `a picture is on screen (${x}, ${y}, ${w}, ${h})`,
        );
        assert.ok(Math.min(w, h) >= 44, `a picture is at least 44 px (${w} x ${h})`);
      }
      // A touch on the wrong part that slides off says its word and counts nothing.
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const p = g.cards.find((c) => c.key === 'dog').node.getGlobalPosition();
        await kit.drag(kit.line([p.x, p.y], [p.x, p.y + 220], 8));
      });
      await settle();
      assert.deepEqual([...(await tally()), await page.evaluate(() => neo.scene.game.s.index)], [0, 0, 0]);
      // The made thing repeats the question and counts nothing.
      await page.evaluate(() => kit.tapOn(neo.scene.game.showing.made.node));
      await settle();
      assert.deepEqual(await tally(), [0, 0], 'a tap on the made thing counts nothing');
      await screenshot('word-glue-5-upright-phone');
      await tapPart('dog');
      await settle();
      assert.deepEqual(
        [...(await tally()), await page.evaluate(() => neo.scene.game.s.index)],
        [1, 0, 0],
        'a wrong part is one miss and the ask stays',
      );
      await page.evaluate(() => neo.scene.game.askForHint());
      await page.waitForTimeout(300);
      assert.deepEqual(
        [...(await tally()), await page.evaluate(() => neo.scene.game.s.glow)],
        [1, 1, true],
        'Show a hint glows the right part and counts once',
      );
      for (let i = 0; i < 6; i++) {
        await settle();
        if (await page.evaluate(() => neo.scene.finished || neo.scene.game.finished)) break;
        await tapPart((await ask()).second);
      }
      await finished('word-glue');
      assert.deepEqual(await score(), [1, 1]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log(
        'Word Glue 5 on an upright phone: free touch, repeated question, wrong part, hint, saved score passed',
      );
    };
    const reversedPlay = async () => {
      const portrait = { width: 390, height: 625 };
      await page.setViewportSize(portrait);
      await page.evaluate(() => {
        kit.store.data.settings.showWords = true;
      });
      await launch('word-glue', 6);
      const nextAsk = (index) =>
        page.waitForFunction(
          (index) => {
            const g = neo.scene.game;
            return g.s.index === index && !g.busy && !g.unasked;
          },
          index,
          { timeout: 25000 },
        );
      const location = (key) =>
        page.evaluate((key) => {
          const p = neo.scene.game.cards.find((card) => card.key === key).node.getGlobalPosition();
          return { x: p.x, y: p.y };
        }, key);
      const tap = async (key) => {
        const { x, y } = await location(key);
        await page.touchscreen.tap(x, y);
      };
      const stickers = () =>
        page.evaluate(() => kit.store.data.stickers.filter((s) => s.game === 'word-glue').length);

      await nextAsk(0);
      assert.deepEqual(
        await page.evaluate(() => ({
          upright: neo.scene.game.view.upright,
          pictures: neo.scene.game.cards.map((c) => c.key),
        })),
        { upright: true, pictures: ['boathouse', 'houseboat'] },
      );
      const before = await stickers();
      await screenshot('word-glue-6-upright-phone');

      const touch = await page.context().newCDPSession(page);
      const p = await location('boathouse');
      const send = (type, touchPoints = []) => touch.send('Input.dispatchTouchEvent', { type, touchPoints });
      await send('touchStart', [p]);
      await page.waitForFunction(() => neo.scene.game.held?.key === 'boathouse');
      await send('touchMove', [{ x: p.x + 101, y: p.y }]);
      await send('touchEnd');
      await page.waitForFunction(() => !neo.scene.game.held);
      await page.waitForTimeout(350);
      await send('touchStart', [p]);
      await page.waitForFunction(() => neo.scene.game.held?.key === 'boathouse');
      await send('touchCancel');
      await page.waitForFunction(() => !neo.scene.game.held);
      await touch.detach();
      assert.deepEqual(await tally(), [0, 0], 'sliding off and cancellation are free');

      await page.waitForTimeout(350);
      await tap('boathouse');
      await nextAsk(0);
      assert.deepEqual(await tally(), [1, 0]);
      await page.evaluate(() => neo.scene.game.askForHint());
      await page.waitForFunction(() => neo.scene.game.s.glow);
      assert.deepEqual(await tally(), [1, 1]);
      await page.setViewportSize({ width: 625, height: 390 });
      await page.waitForFunction(() => !neo.scene.game.view.upright);
      await page.setViewportSize(portrait);
      await page.waitForFunction(() => neo.scene.game.view.upright);
      assert.deepEqual(await tally(), [1, 1]);

      for (const [i, answer] of ['houseboat', 'cake pan', 'dog sled', 'racehorse'].entries()) {
        await nextAsk(i);
        const cards = await page.evaluate(() => {
          const g = neo.scene.game;
          return g.cards.map(({ node }) => {
            const b = node.getBounds();
            return { x: b.x, y: b.y, w: b.width, h: b.height };
          });
        });
        for (const { x, y, w, h } of cards) {
          assert.ok(
            w >= 100 && h >= 100 && x >= 0 && y >= 0 && x + w <= 390 && y + h <= 625,
            'each upright choice is full-size and on screen',
          );
        }
        await screenshot(`word-glue-6-pair-${i + 1}`);
        await tap(answer);
      }
      await finished('word-glue');
      assert.equal(await stickers(), before + 1);
      assert.deepEqual(await score(), [1, 1]);
      assert.equal(await page.evaluate(() => neo.scene.game.shelf.length), 8);
      log(
        'Word Glue 6: four upright pairs, free slide and cancel, wrong tap, hint, rotation and one sticker',
      );
      await page.setViewportSize({ width: 1024, height: 768 });
    };
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('word-glue').history.at(-1);
        return [r.misses, r.hints];
      });
    const tally = () => page.evaluate(() => [neo.scene.game.s.misses, neo.scene.game.s.hints]);
    const settle = async () => {
      await page.waitForTimeout(250);
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 25000 });
      await page.waitForTimeout(200);
    };
    const join = (a, b) =>
      page.evaluate(
        async ([a, b]) => {
          const g = neo.scene.game;
          const card = (k) => g.cards.find((c) => c.key === k).node;
          await kit.dragTo(card(a), card(b).getGlobalPosition());
        },
        [a, b],
      );
    const playOut = async () => {
      for (let i = 0; i < 8; i++) {
        await settle();
        if (await page.evaluate(() => neo.scene.finished || neo.scene.game.finished)) break;
        const ask = await page.evaluate(() => {
          const g = neo.scene.game;
          const a = g.s.round.asks[g.s.index];
          return [a.entry.first, a.entry.second];
        });
        await join(...ask);
      }
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    // `WORDGLUE_ONLY=kind` runs only level 5 in a touch phone context, so the upright layout is the one played.
    if (process.env.WORDGLUE_ONLY === 'kind') return kindPlay();
    if (process.env.WORDGLUE_ONLY === 'reversed') return reversedPlay();
    await launch('word-glue', 1);
    await settle();
    await page.evaluate(() => kit.tapOn(neo.scene.game.cards[0].node));
    await settle();
    assert.equal(await page.evaluate(() => neo.scene.game.s.index), 1, 'a tap at level 1 joins the pair');
    await playOut();
    await finished('word-glue');
    assert.deepEqual(await score(), [0, 0]);
    await launch('word-glue', 3);
    await settle();
    const [asked, wrong] = await page.evaluate(() => {
      const a = neo.scene.game.s.round.asks[0];
      return [a.entry.first, a.pictures.slice(1).find((p) => p !== a.entry.first)];
    });
    assert.equal(asked, 'bird', 'the authored round opens with the bird asking for a house');
    await join(wrong, 'house');
    await settle();
    assert.deepEqual(
      [...(await tally()), await page.evaluate(() => neo.scene.game.s.index)],
      [1, 0, 0],
      'a wrong friend is one miss and the ask stays',
    );
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(300);
    assert.deepEqual(
      [...(await tally()), await page.evaluate(() => neo.scene.game.s.glow)],
      [1, 1, true],
      'Show a hint glows the asking friend and counts once',
    );
    await playOut();
    await finished('word-glue');
    assert.deepEqual(await score(), [1, 1]);
    await launch('word-glue', 2);
    await settle();
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('word-glue-2-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    log(
      'Word Glue 1 and 3: tap join, drags, wrong friend miss, requested hint, saved scores, level-2 portrait passed',
    );
  }
  return { wordGluePlay };
}
