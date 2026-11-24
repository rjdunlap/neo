import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished, next }) {
  /** Brain Break: real taps, stable checked stones, hints and one reward per board. */
  async function brainBreakPlay() {
    for (const level of [1, 6, 8, 10]) {
      await launch('brain-break', level);
      await page.waitForTimeout(350);
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      const wrong = await page.evaluate(() => neo.scene.game.board.findIndex((n) => n === 2));
      await tap(`neo.scene.game.stones[${wrong}]`);
      await tap(`neo.scene.game.stones[${wrong}]`);
      assert.deepEqual(
        await page.evaluate(() => {
          const g = neo.scene.game;
          return [g.next, g.misses, g.hints, g.board[g.hinted]];
        }),
        [1, 2, 1, 1],
      );
      await tap('neo.scene.game.hintButton');
      assert.equal(await page.evaluate(() => neo.scene.game.hints), 2);
      if (level === 8) {
        const sign = await page.evaluate(() => neo.scene.game.status.text);
        assert.match(sign, /^Count (back )?by \d · (start at|after) \d+/, 'the sign names the rule');
        assert.ok(!sign.includes(' 1 /'), 'the sign never shows a rank');
      }
      if (level === 10) {
        assert.equal(
          await page.evaluate(() => neo.scene.game.status.text.split('·')[0].trim()),
          'Smallest first',
        );
        assert.ok(
          await page.evaluate(() => neo.scene.game.labels.some((t) => t.startsWith('\u2212'))),
          'some stones are below zero, with a true minus sign',
        );
      }
      if (level >= 6) {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(450);
        await screenshot(
          level === 6
            ? 'brain-break-sums-portrait'
            : level === 8
              ? 'brain-break-count-by-portrait'
              : 'brain-break-below-zero-portrait',
        );
      }
      for (let n = 1; n <= (level === 1 ? 9 : 25); n++) {
        const i = await page.evaluate((n) => neo.scene.game.board.indexOf(n), n);
        await tap(`neo.scene.game.stones[${i}]`);
        if (level === 6 && n === 1) {
          assert.deepEqual(
            await page.evaluate(
              (i) => [neo.scene.game.texts[i].text, neo.scene.game.texts[i].width <= 88],
              i,
            ),
            ['1', true],
            'a lit stone shows its total',
          );
          assert.ok(
            await page.evaluate(() => neo.scene.game.texts.every((t) => t.width <= 88)),
            'every label fits its stone',
          );
        }
        if ((level === 8 || level === 10) && n === 1) {
          assert.ok(
            await page.evaluate(() => neo.scene.game.texts.every((t) => t.width <= 88)),
            'every count-by label fits its stone',
          );
        }
        if (n === 1) {
          await tap(`neo.scene.game.stones[${i}]`);
          assert.equal(await page.evaluate(() => neo.scene.game.next), 2, 'checked stone is free');
        }
      }
      await finished('brain-break');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 2]);
      await page.setViewportSize({ width: 1024, height: 768 });
    }
    log(
      'brainbreak: levels 1, 6 (sums and take-aways) 8 (count by, up or back) and 10 (smallest first, below zero), wrong taps, automatic/manual hint, checked stones, portrait and one sticker passed',
    );
  }

  return { brainBreakPlay };
}
