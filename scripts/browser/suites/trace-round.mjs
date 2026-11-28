import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
  async function traceRound(level, name, wrong = false, want = '') {
    // Level 7 and levels 9 and up play on a phone held upright, so the word picture, the fading guides and the little
    // letters in their frame are checked where the playtests happen.
    const phone = level === 7 || level >= 9;
    const landscape = page.viewportSize();
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    try {
      await playRound(level, name, wrong, want);
    } finally {
      if (phone) await page.setViewportSize(landscape);
    }
  }

  async function playRound(level, name, wrong, want) {
    await launch('letter-trails', level, name);
    // A wanted letter (level 10's first and last, c and t): relaunch until the seed draws it.
    for (let i = 0; want && i < 200 && (await page.evaluate(() => neo.scene.game.word)) !== want; i++)
      await launch('letter-trails', level, name);
    if (want)
      assert.equal(await page.evaluate(() => neo.scene.game.word), want, `level ${level} drew ${want}`);
    if (wrong) {
      await page.evaluate(async () => {
        const g = neo.scene.game;
        for (let i = 0; i < 2; i++) {
          const p = g.firefly.getGlobalPosition();
          await kit.drag(kit.line([p.x, p.y], [neo.view.w * neo.view.scale - 10, 15], 30));
          await kit.sleep(250);
        }
      });
      // The second wander is one hint: the firefly flies the next stretch by itself (leaving dots), then comes back to where she was.
      assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'one tracing hint per stroke');
      await page.waitForTimeout(500);
      await screenshot('letter-trails');
      assert.ok(
        await page.evaluate(async () => {
          const g = neo.scene.game;
          if (!(await kit.until(() => !g.busy, 6000))) return false;
          const p = g.points[g.progress];
          return Math.hypot(g.firefly.x - p[0] * g.size, g.firefly.y - p[1] * g.size) < 1;
        }),
        'the firefly shows the way and comes back to her checkpoint',
      );
    }
    if (level === 9) await threeTries();
    if (level === 16 || level === 17) await wordInFrame(level);
    if (level >= 10 && level <= 14)
      await littleLetter(
        level === 10
          ? 'cosvwt'
          : level === 11
            ? 'adg'
            : level === 12
              ? 'uielkyj'
              : level === 13
                ? 'prnmhb'
                : 'fqxz',
      );
    await page.evaluate(async () => {
      const g = neo.scene.game;
      let steps = 0;
      while (!g.done && g.letterIndex < g.word.length && steps++ < 160) {
        if (!(await kit.until(() => !g.busy || g.done || g.letterIndex === g.word.length, 18000)))
          throw new Error('Letter transition stuck');
        if (g.done || g.letterIndex === g.word.length) break;
        const points = g.points.slice(g.progress).map(([x, y]) => {
          const p = g.canvas.toGlobal({ x: x * g.size, y: y * g.size });
          return [p.x, p.y];
        });
        await kit.drag(points, 1, 10);
        await kit.sleep(250);
      }
      if (g.letterIndex < g.word.length) throw new Error('Tracing did not complete');
    });
    if (level === 7 || level === 8 || level === 16 || level === 17) {
      // A word ends on its own picture, a name on a sign with the whole name; a name is traced up to eight letters.
      const shown = await page.evaluate(async () => {
        const g = neo.scene.game;
        await kit.until(() => g.picture && g.picture.scale.x > 0.5, 3000);
        return { word: g.word, traced: g.traced.size, picture: !!g.picture };
      });
      assert.ok(shown.picture, 'the word or name is shown at the end');
      if (level === 8 || level === 17)
        assert.ok(shown.word.length <= 8, `a name is traced up to eight letters (${shown.word})`);
      await page.waitForTimeout(400);
      await screenshot(`letter-trails-${level}-${shown.word}`);
    }
    assert.ok(
      await page.evaluate(() => kit.until(() => neo.scene.game.done, 8000)),
      'the round finishes after the closing picture',
    );
    await finished('letter-trails');
    assert.ok(
      await page.evaluate(() => kit.store.data.journal.found.some((id) => id.startsWith('letter-trails:'))),
      'a traced letter is filed in the journal',
    );
    log(`Letter Trails level ${level} (${name || 'single letter'}): tracing and reward passed`);
  }

  /** Level 9: one capital three times. Trace the solid try, wander once on the dotted try (the solid trail comes back), finish it, and see the start-only try. */
  async function threeTries() {
    const traceTry = () =>
      page.evaluate(async () => {
        const g = neo.scene.game;
        const attempt = g.attempt;
        let steps = 0;
        while (g.attempt === attempt && steps++ < 40) {
          if (!(await kit.until(() => !g.busy || g.attempt !== attempt, 18000)))
            throw new Error('Stroke stuck');
          if (g.attempt !== attempt) break;
          const points = g.points.slice(g.progress).map(([x, y]) => {
            const p = g.canvas.toGlobal({ x: x * g.size, y: y * g.size });
            return [p.x, p.y];
          });
          await kit.drag(points, 1, 10);
          await kit.sleep(250);
        }
        if (!(await kit.until(() => g.attempt !== attempt && !g.busy, 6000)))
          throw new Error('Next try did not start');
      });
    assert.equal(
      await page.evaluate(() => neo.scene.game.guideNow()),
      'solid',
      'the first try shows a solid trail',
    );
    await traceTry();
    assert.equal(await page.evaluate(() => neo.scene.game.guideNow()), 'dotted', 'the second try shows dots');
    await page.waitForTimeout(300);
    await screenshot('letter-trails-9-dotted');
    const wander = await page.evaluate(async () => {
      const g = neo.scene.game;
      const p = g.firefly.getGlobalPosition();
      await kit.drag(kit.line([p.x, p.y], [neo.view.w * neo.view.scale - 10, 15], 30));
      await kit.sleep(250);
      return { misses: g.misses, guide: g.guideNow(), stroke: g.stroke };
    });
    assert.equal(wander.misses, 1, 'one wander is one miss');
    assert.equal(wander.guide, 'solid', 'a wander brings the solid trail back for that stroke');
    await traceTry();
    assert.equal(
      await page.evaluate(() => neo.scene.game.guideNow()),
      'start',
      'the third try shows only the start',
    );
    await page.waitForTimeout(300);
    await screenshot('letter-trails-9-start');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 0, 'no hint for one wander');
  }

  /** Levels 16 and 17: a word or a name traced letter by letter in the frame; 17 starts with a capital standing in it. */
  async function wordInFrame(level) {
    const shown = await page.evaluate(() => {
      const g = neo.scene.game;
      const b = g.frame.getBounds();
      const w = neo.view.w * neo.view.scale;
      return {
        word: g.word,
        heading: g.heading.text,
        drawn: b.width > 0,
        inside: b.x >= 0 && b.x + b.width <= w,
      };
    });
    assert.ok(shown.drawn, 'the four-line frame is drawn');
    assert.ok(shown.inside, 'the frame stays inside the view');
    if (level === 16)
      assert.equal(shown.word, shown.word.toLowerCase(), `a word in little letters (${shown.word})`);
    else
      assert.match(
        shown.word,
        /^[A-Z][a-z]*$/,
        `a name as it is written: a capital, then little letters (${shown.word})`,
      );
    assert.ok(shown.heading.startsWith(`[ ${shown.word[0]} ]`), 'the heading marks the first letter');
    await page.waitForTimeout(300);
    await screenshot(`letter-trails-${level}-${shown.word}-first`);
  }

  /** Level 10: a little letter in the four-line frame with its capital beside it, the frame inside the view. */
  async function littleLetter(group) {
    const shown = await page.evaluate(() => {
      const g = neo.scene.game;
      const b = g.frame.getBounds();
      const w = neo.view.w * neo.view.scale;
      return {
        letter: g.letter,
        heading: g.heading.text,
        drawn: b.width > 0,
        inside: b.x >= 0 && b.x + b.width <= w,
      };
    });
    assert.ok(group.includes(shown.letter), `a little letter of the level's group (${shown.letter})`);
    assert.equal(
      shown.heading,
      `${shown.letter.toUpperCase()}  ${shown.letter}`,
      'the capital is shown beside it',
    );
    assert.ok(shown.drawn, 'the four-line frame is drawn');
    assert.ok(shown.inside, 'the frame stays inside the view');
    await page.waitForTimeout(300);
    await screenshot(
      `letter-trails-${group === 'adg' ? 11 : group === 'uielkyj' ? 12 : group === 'prnmhb' ? 13 : group === 'fqxz' ? 14 : 10}-${shown.letter}`,
    );
  }

  return { traceRound };
}
