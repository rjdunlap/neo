import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished, next }) {
  /** Brain Break: real taps, stable checked stones, hints and one reward per board. */
  async function brainBreakPlay() {
    const only = { 'two-trails': [12], parts: [13], work: [14] }[process.env.BRAINBREAK_ONLY];
    const levels = only ?? [1, 6, 8, 10, 12, 13, 14];
    for (const level of levels) {
      const alternating = level === 12;
      if (alternating) await page.setViewportSize({ width: 390, height: 844 });
      await launch('brain-break', level);
      await page.waitForTimeout(350);
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      const first = alternating ? 2 : 1;
      if (alternating) {
        assert.match(await page.evaluate(() => neo.scene.game.status.text), /^Numbers up · Letters back/);
        const start = await page.evaluate(() => neo.scene.game.board.indexOf(1));
        await tap(`neo.scene.game.stones[${start}]`);
        await tap(`neo.scene.game.stones[${start}]`);
        assert.equal(await page.evaluate(() => neo.scene.game.next), first, 'checked stone is free');
      }
      const wrong = await page.evaluate((rank) => neo.scene.game.board.indexOf(rank), first + 1);
      await tap(`neo.scene.game.stones[${wrong}]`);
      if (!alternating) await tap(`neo.scene.game.stones[${wrong}]`);
      assert.deepEqual(
        await page.evaluate(() => {
          const g = neo.scene.game;
          return [g.next, g.misses, g.hints, g.board[g.hinted]];
        }),
        alternating ? [2, 1, 0, undefined] : [1, 2, 1, 1],
      );
      await tap('neo.scene.game.hintButton');
      assert.deepEqual(
        await page.evaluate(() => {
          const g = neo.scene.game;
          return [g.hints, g.board[g.hinted]];
        }),
        [alternating ? 1 : 2, first],
      );
      if (level === 8) {
        const sign = await page.evaluate(() => neo.scene.game.status.text);
        assert.match(sign, /^Count (back )?by \d · (start at|after) \d+/, 'the sign names the rule');
        assert.ok(!sign.includes(' 1 /'), 'the sign never shows a rank');
      }
      if (level === 13) {
        const labels = await page.evaluate(() => neo.scene.game.labels);
        assert.equal(labels.length, 9);
        assert.ok(
          labels.every((t) => t.length <= 4 && /^(\d+\/\d+|\d\.\d+)$/.test(t)),
          'fractions and decimals, at most four characters',
        );
        assert.ok(labels.some((t) => t.includes('/')) && labels.some((t) => t.includes('.')));
        assert.equal(await page.evaluate(() => neo.scene.game.status.text.split('   ')[0]), 'Smallest first');
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(450);
        await screenshot('brain-break-parts-in-order-portrait');
      }
      if (level === 14) {
        const labels = await page.evaluate(() => neo.scene.game.labels);
        assert.equal(labels.length, 9);
        assert.ok(
          labels.every((t) => t.length <= 4 && /^\d+[+\u2212\u00d7]\d+$/.test(t)),
          'sums, take-aways and times, at most four characters',
        );
        assert.equal(await page.evaluate(() => neo.scene.game.status.text.split('   ')[0]), 'Smallest first');
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(450);
        await screenshot('brain-break-work-them-out-portrait');
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
      if (level >= 6 && level < 13 && !alternating) {
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
      for (let n = first; n <= (level === 1 || level >= 13 ? 9 : 25); n++) {
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
        if (level === 14 && n === 1) {
          assert.equal(
            await page.evaluate(
              (i) => neo.scene.game.texts[i].text === String(neo.scene.game.works[0].value),
              i,
            ),
            true,
            'a lit stone shows its answer',
          );
        }
        if ((level === 8 || level === 10) && n === 1) {
          assert.ok(
            await page.evaluate(() => neo.scene.game.texts.every((t) => t.width <= 88)),
            'every count-by label fits its stone',
          );
        }
        if (alternating) {
          assert.equal(
            await page.evaluate((index) => neo.scene.game.labels[index], i),
            n % 2 === 1 ? String((n + 1) / 2) : 'LKJIHGFEDCBA'[n / 2 - 1],
          );
          if (n === 3) {
            assert.match(await page.evaluate(() => neo.scene.game.status.text), /^L · 2 · \? +Letters/);
            await screenshot('brain-break-two-trails-portrait');
          }
        }
        if (n === 1) {
          await tap(`neo.scene.game.stones[${i}]`);
          assert.equal(await page.evaluate(() => neo.scene.game.next), 2, 'checked stone is free');
        }
      }
      await finished('brain-break');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
      assert.deepEqual(
        await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]),
        alternating ? [1, 1] : [2, 2],
      );
      await page.setViewportSize({ width: 1024, height: 768 });
    }
    log(
      `brainbreak: levels ${levels.join(', ')}, wrong taps, hints, checked stones, portrait and one sticker passed`,
    );
  }

  return { brainBreakPlay };
}
