import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function crosswordPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('crossword').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);
  const idle = () => page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 30000 });
  // Drags a bank tile (the right one, or a wrong one) onto the active word's next empty square, through the real drag.
  const fill = (wrong) => page.evaluate(async (wrong) => {
    const g = neo.scene.game, p = g.puzzle;
    const { key: sq, letter: want } = g.nextSquare();
    const tile = g.bank.find((t) => (wrong ? t.letter !== want : t.letter === want));
    const to = g.layer.toGlobal(g.center(sq));
    await kit.dragTo(tile, to, 12);
    return { sq, letter: tile.letter, want };
  }, wrong);
  // Plays the rest of the round as the ghost finger would: tap the next picture, or drag the right tile.
  const playOut = async () => {
    for (let n = 0; n < 40; n++) {
      await idle();
      await page.waitForTimeout(300);
      if (await page.evaluate(() => neo.scene.finished === true)) return;
      await page.evaluate(async () => {
        const g = neo.scene.game, intent = g.autotouch();
        if (!intent) return;
        if (intent.tap) kit.tapOn(intent.tap.on, intent.tap.x * neo.view.scale, intent.tap.y * neo.view.scale);
        else await kit.dragTo(intent.drag.on, intent.to.on.toGlobal({ x: intent.to.x, y: intent.to.y }), 12);
      });
    }
  };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1: one wrong tile in the crossing is one miss and hops back; Help fills the crossing (one hint); the rest by drags.
  await launch('crossword', 1);
  await idle(); await page.waitForTimeout(400);
  let s = await page.evaluate(() => { const g = neo.scene.game; return { puzzles: g.puzzles.length, blanks: g.puzzle.blanks.length, bank: g.bank.length }; });
  assert.deepEqual(s, { puzzles: 3, blanks: 1, bank: 3 }, 'level 1: three puzzles, one blank, three tiles');
  const w = await fill(true);
  assert.notEqual(w.letter, w.want, 'a wrong tile was dragged');
  await page.waitForTimeout(700);
  assert.deepEqual(await tally(), [1, 0], 'a wrong crossing is one miss');
  s = await page.evaluate(() => ({ filled: neo.scene.game.fills.size, bank: neo.scene.game.bank.length }));
  assert.deepEqual(s, { filled: 0, bank: 3 }, 'the wrong tile hops back to the bank');
  await page.evaluate(() => kit.tapOn(neo.scene.game.help)); await page.waitForTimeout(400);
  assert.deepEqual(await tally(), [1, 1], 'Help counts one hint');
  await playOut();
  await finished('crossword');
  assert.deepEqual(await score(), [1, 1], 'level 1 saved 1 miss, 1 hint');

  // Level 2: two crossings and first letters, a portrait look, all filled by drags with no misses.
  await launch('crossword', 2);
  await idle(); await page.waitForTimeout(400);
  s = await page.evaluate(() => { const g = neo.scene.game; return { puzzles: g.puzzles.length, words: g.puzzle.words.length, bank: g.bank.length }; });
  assert.equal(s.puzzles, 2, 'level 2 plays two puzzles');
  assert.equal(s.words, 3, 'three words in a chain');
  assert.ok(s.bank <= 4, 'at most four tiles');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  const small = await page.evaluate(() => {
    const g = neo.scene.game, v = neo.view;
    const all = [...g.bank, g.help];
    return { minSide: Math.min(...all.map((o) => Math.min(o.hitArea.width, o.hitArea.height))), bottom: Math.max(...all.map((o) => o.y + o.hitArea.y + o.hitArea.height)), h: v.h };
  });
  assert.ok(small.minSide >= 100, `bank tiles and Help stay at least 100 units (${small.minSide})`);
  assert.ok(small.bottom <= small.h, 'the bank fits on screen upright');
  await screenshot('crossword-2-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await playOut();
  await finished('crossword');
  assert.deepEqual(await score(), [0, 0], 'level 2 saved no misses or hints');
  log('Crossword 1 and 2: a wrong crossing is one miss and hops back, Help one hint, portrait bank, both levels to the sticker, passed');
}
return { crosswordPlay };
}
