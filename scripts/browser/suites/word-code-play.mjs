import assert from 'node:assert/strict';

export function createSuite({ page, screenshot, launch, finished }) {
  /** Word Code by touch: level 1 (school) with one picture word that is not the hidden one, a try that ignores a mark (the one miss), a requested hint, then the hidden word, a portrait screenshot, saved score; level 3 (grown-up) with a word that is not on the list turned down free, a try that ignores a mark, a hint, then the hidden word on the keys. */
  async function wordCodePlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('word-code').history.at(-1);
        return [r.misses, r.hints];
      });
    const settle = async () => {
      await page.waitForTimeout(300);
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 25000 });
      await page.waitForTimeout(250);
    };
    const tapKey = (ch) => page.evaluate((ch) => kit.tapOn(neo.scene.game.keyCells.get(ch)), ch);
    const type = async (word) => {
      for (const ch of word) {
        await tapKey(ch);
        await page.waitForTimeout(120);
      }
    };
    const submit = (grown) =>
      page.evaluate(
        (grown) => kit.tapOn(grown ? neo.scene.game.keyCells.get('enter') : neo.scene.game.checkBtn),
        grown,
      );
    const tapHint = () => page.evaluate(() => kit.tapOn(neo.scene.game.hintBtn));
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          tries: g.history.length,
          misses: g.misses,
          hints: g.hints,
          hidden: g.hidden,
          words: g.words,
        };
      });
    /** A string of one letter repeated that ignores a mark still showing, found with the game's own rule. */
    const ignoring = (letters, len) =>
      page.evaluate(
        async ([letters, len]) => {
          const L = await import('/src/games/word-code/logic.ts');
          const g = neo.scene.game;
          for (const l of letters) {
            const w = l.repeat(len);
            if (L.ignoredMarks(g.history, w).length) return w;
          }
          return null;
        },
        [letters, len],
      );
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    // School, level 1: a candidate that is not hidden, then a try that ignores a mark, a hint, then the hidden word.
    await launch('word-code', 1, 'Mia', 'school');
    await settle();
    let s = await state();
    assert.equal(s.words.length, 4);
    assert.ok(s.words.includes(s.hidden));
    const other = s.words.find((w) => w !== s.hidden);
    await type(other);
    await submit(false);
    await settle();
    s = await state();
    assert.equal(s.tries, 1);
    const tray = await page.evaluate(() => neo.scene.game.tray);
    const bad = await ignoring(tray, 3);
    assert.ok(bad, 'a try that ignores a mark exists');
    await type(bad);
    await submit(false);
    await settle();
    s = await state();
    assert.equal(s.misses, 1, 'ignoring a mark is the one miss');
    await tapHint();
    await page.waitForTimeout(400);
    assert.equal((await state()).hints, 1);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1300);
    await screenshot('word-code-1-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    await type(s.hidden);
    await submit(false);
    await finished('word-code');
    assert.deepEqual(await score(), [1, 1]);
    // Grown-up, level 3: not-a-word is free, an ignored mark is a miss, a hint, then the hidden word.
    await launch('word-code', 3, 'Mia', 'grownup');
    await settle();
    await type('ZZZZZ');
    await submit(true);
    await settle();
    s = await state();
    assert.deepEqual([s.tries, s.misses], [0, 0], 'a word not on the list is turned down for free');
    await page.evaluate(() => neo.scene.game.entry.splice(0));
    await type('STARE');
    await submit(true);
    await settle();
    assert.equal((await state()).tries, 1);
    const bad5 = await ignoring('STARE'.split('').concat([...'ZQXJ']), 5);
    assert.ok(bad5, 'a five-letter try that ignores a mark exists');
    await page.evaluate(() => neo.scene.game.entry.splice(0));
    // Letters that are not a word are turned down, so use a real word that reuses a crossed-out letter.
    const real = await page.evaluate(async () => {
      const L = await import('/src/games/word-code/logic.ts');
      const W = await import('/src/games/word-code/words.ts');
      const g = neo.scene.game;
      return [...W.GUESSES].find((w) => w !== g.hidden && L.ignoredMarks(g.history, w).length) ?? null;
    });
    assert.ok(real);
    await type(real);
    await submit(true);
    await settle();
    assert.equal((await state()).misses, 1);
    await tapHint();
    await page.waitForTimeout(400);
    assert.equal((await state()).hints, 1);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1300);
    await screenshot('word-code-3-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    await type((await state()).hidden);
    await submit(true);
    await finished('word-code');
    assert.deepEqual(await score(), [1, 1]);
  }
  return { wordCodePlay };
}
