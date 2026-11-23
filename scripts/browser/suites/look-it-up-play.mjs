import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
  const score = () =>
    page.evaluate(() => {
      const r = kit.store.stats('look-it-up').history.at(-1);
      return [r.misses, r.hints];
    });
  /** Look It Up: level 1 touches every label on three pages; level 3 finds each visitor's page and row, with both wrong pictures first on the first visitor (the glow hint); level 3 in portrait; levels 4, 5 and 6 upright on a phone. */
  async function lookItUpPlay() {
    // `LOOKITUP_FROM=4` starts at the contents levels (4, 5 and 6), `LOOKITUP_FROM=6` at level 6 alone.
    const from = Number(process.env.LOOKITUP_FROM || 1);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    if (from >= 6) return twoPages();
    if (from >= 4) return contentsLevels();
    const settle = async () => {
      await page.waitForTimeout(300);
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 25000 });
      await page.waitForTimeout(250);
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    await launch('look-it-up', 1);
    await settle();
    for (let p = 0; p < 3; p++) {
      for (let i = 0; i < 3; i++) {
        await page.evaluate((i) => kit.tapOn(neo.scene.game.rows[i].node), i);
        await page.waitForTimeout(200);
      }
      await settle();
    }
    await finished('look-it-up');
    assert.deepEqual(await score(), [0, 0]);
    await launch('look-it-up', 3);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(400);
    await screenshot('look-it-up-3-portrait');
    const r4 = [];
    for (let n = 0; n < 3; n++) {
      // The ask waits behind the last visitor's fact (U7 R4); a touch before it only says the ask, so wait for it.
      await page.waitForFunction(
        (n) => neo.scene.game.index === n && !neo.scene.game.busy && !neo.scene.game.unasked,
        n,
        { timeout: 25000 },
      );
      await page.waitForTimeout(200);
      if (n === 0) {
        // Two different wrong pictures: two misses, then the glow (one hint).
        const wrongs = await page.evaluate(async () => {
          const L = await import('/src/games/look-it-up/logic.ts');
          const g = neo.scene.game;
          const v = g.round.visits[g.index];
          return g.choices.map((c) => c.key).filter((p) => L.check(g.round, v, p).kind === 'wrong');
        });
        for (const p of wrongs) {
          await page.evaluate((p) => kit.tapOn(neo.scene.game.choices.find((c) => c.key === p).node), p);
          await settle();
        }
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 1]);
      }
      for (let step = 0; step < 4; step++) {
        const h = await page.evaluate(async () => {
          const L = await import('/src/games/look-it-up/logic.ts');
          const g = neo.scene.game;
          return L.hintFor(g.round, g.round.visits[g.index], g.open, g.rowSeen);
        });
        if (h.kind === 'tab')
          await page.evaluate((id) => kit.tapOn(neo.scene.game.tabs.find((t) => t.id === id).node), h.animal);
        else if (h.kind === 'row')
          await page.evaluate(
            (row) => kit.tapOn(neo.scene.game.rows.find((r) => r.kind === row).node),
            h.row,
          );
        else {
          // U7 R4: the right picture's fact starts as the visitor eats or goes, and the next visitor walks in at once.
          const ms = await page.evaluate(async (p) => {
            const g = neo.scene.game,
              at = g.index,
              t = performance.now();
            kit.tapOn(g.choices.find((c) => c.key === p).node);
            if (at + 1 >= g.round.visits.length) return null;
            await kit.until(() => g.index > at && !g.busy, 8000);
            return performance.now() - t;
          }, h.choice);
          if (ms !== null) {
            r4.push(Math.round(ms));
            assert.ok(ms < 1800, `R4: the next visitor waited for the fact (${Math.round(ms)} ms)`);
          }
          break;
        }
        await page.waitForTimeout(350);
      }
      await page.waitForTimeout(400);
    }
    await finished('look-it-up');
    assert.deepEqual(await score(), [2, 1]);
    assert.equal(r4.length, 2, 'R4: two visitors timed');
    log(`Look It Up 3: R4, next visitor open ${r4.join(', ')} ms after the right picture's tap`);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Look It Up 1 and 3: labels touched, tab and row found, two wrong pictures then the glow hint, portrait, saved score and sticker passed',
    );
    await contentsLevels();
  }

  /** The next hint's target, tapped: Contents, a contents line, a row, or (returned) the right choice to give. */
  async function followHint() {
    const h = await page.evaluate(async () => {
      const L = await import('/src/games/look-it-up/logic.ts');
      const g = neo.scene.game;
      return L.hintFor(g.round, g.round.visits[g.index], g.open, g.rowSeen, g.read);
    });
    if (h.kind === 'contents') await page.evaluate(() => kit.tapOn(neo.scene.game.contentsButton.node));
    else if (h.kind === 'line')
      await page.evaluate((id) => kit.tapOn(neo.scene.game.lines.find((l) => l.id === id).node), h.animal);
    else if (h.kind === 'row')
      await page.evaluate((row) => kit.tapOn(neo.scene.game.rows.find((r) => r.kind === row).node), h.row);
    else return h.choice;
    await page.waitForTimeout(350);
    return null;
  }

  const ready = (n) =>
    page.waitForFunction(
      (n) => neo.scene.game.index === n && !neo.scene.game.busy && !neo.scene.game.unasked,
      n,
      { timeout: 25000 },
    );

  /** Every printed caption on the open page fits two lines, and the page number clears the title. */
  const captionsFit = () =>
    page.evaluate(() => {
      const g = neo.scene.game;
      const out = [];
      for (const r of g.rows) {
        const t = r.node.children.find((c) => typeof c.text === 'string');
        const lines = Math.round(t.height / t.style.lineHeight);
        if (lines > 2) out.push(`${g.open} ${r.kind}: ${lines} lines`);
      }
      const texts = g.page.children.filter((c) => typeof c.text === 'string');
      const [title, num] = texts.map((t) => t.getBounds());
      const hit = (a, b) =>
        a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
      if (num && hit(title, num)) out.push(`${g.open}: the page number overlaps the title`);
      const last = g.rows.at(-1).node.getBounds();
      if (num && hit(last, num)) out.push(`${g.open}: the page number overlaps a row`);
      return out;
    });

  /** Levels 4 and 5 upright on a phone: the contents page, printed captions, a wrong picture and a hint, then a name tag. */
  async function contentsLevels() {
    await page.setViewportSize({ width: 390, height: 844 });
    await launch('look-it-up', 4);
    await page.waitForTimeout(400);
    const visits = await page.evaluate(() => neo.scene.game.round.visits.map((v) => `${v.animal} ${v.row}`));
    assert.deepEqual(
      visits,
      ['pig where', 'penguin eats', 'rabbit where'],
      'level 4 plays its authored round',
    );
    assert.equal(await page.evaluate(() => neo.scene.game.open), 'contents');
    await screenshot('look-it-up-4-contents-upright');
    await ready(0);
    // Reading is free: the longest captions (bear, penguin) fit two lines upright and landscape.
    const fit = [];
    for (const size of [
      { width: 390, height: 844 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(size);
      await page.waitForTimeout(300);
      for (const id of ['bear', 'penguin', 'rabbit']) {
        await page.evaluate(() => kit.tapOn(neo.scene.game.contentsButton.node));
        await page.waitForTimeout(250);
        await page.evaluate((id) => kit.tapOn(neo.scene.game.lines.find((l) => l.id === id).node), id);
        await page.waitForTimeout(250);
        fit.push(...(await captionsFit()));
      }
    }
    assert.deepEqual(fit, [], 'printed captions fit');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
    // One wrong picture, then Show a hint: one miss, one hint, and the glow leads back to Contents.
    const wrong = await page.evaluate(async () => {
      const L = await import('/src/games/look-it-up/logic.ts');
      const g = neo.scene.game;
      return g.choices.map((c) => c.key).find((p) => L.check(g.round, g.round.visits[0], p).kind === 'wrong');
    });
    await page.evaluate((p) => kit.tapOn(neo.scene.game.choices.find((c) => c.key === p).node), wrong);
    await ready(0);
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [1, 1]);
    for (let n = 0; n < 3; n++) {
      await ready(n);
      for (let step = 0; step < 6; step++) {
        const pick = await followHint();
        if (!pick) continue;
        await page.evaluate((p) => kit.tapOn(neo.scene.game.choices.find((c) => c.key === p).node), pick);
        break;
      }
      await page.waitForTimeout(400);
    }
    await finished('look-it-up');
    assert.deepEqual(await score(), [1, 1]);
    // Level 5: the first visitor's baby gets its name tag, read from the page's words.
    await launch('look-it-up', 5);
    await ready(0);
    assert.deepEqual(await page.evaluate(() => neo.scene.game.round.visits.map((v) => v.animal)), [
      'rabbit',
      'frog',
      'bear',
    ]);
    const words = await page.evaluate(() => neo.scene.game.choices.map((c) => c.key).sort());
    assert.deepEqual(words, ['cub', 'kit', 'tadpole']);
    for (let n = 0; n < 3; n++) {
      await ready(n);
      for (let step = 0; step < 6; step++) {
        const pick = await followHint();
        if (!pick) continue;
        await page.evaluate((p) => kit.tapOn(neo.scene.game.choices.find((c) => c.key === p).node), pick);
        break;
      }
      if (n === 0) await screenshot('look-it-up-5-tag-upright');
      await page.waitForTimeout(400);
    }
    await finished('look-it-up');
    assert.deepEqual(await score(), [0, 0]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Look It Up 4 and 5 upright: authored rounds, contents page, captions fit, a wrong picture and a hint, name tags',
    );
    await twoPages();
  }

  /** Level 6 upright: the authored round, one wrong friend and Show a hint, then both pages and the friend each visit. */
  async function twoPages() {
    await page.setViewportSize({ width: 390, height: 844 });
    await launch('look-it-up', 6);
    await ready(0);
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.round.visits.map((v) => `${v.animal} ${v.share.friend}`)),
      ['cow rabbit', 'penguin bear', 'duck frog'],
      'level 6 plays its authored round',
    );
    // Friend names fit their cards.
    const names = await page.evaluate(() =>
      neo.scene.game.choices.map((c) => {
        const t = c.node.children.find((x) => typeof x.text === 'string');
        return [t.text, Math.round(t.width), Math.round(t.height)];
      }),
    );
    for (const [name, w, h] of names) assert.ok(w <= 124 && h <= 50, `${name} fits its card (${w} x ${h})`);
    await page.evaluate(() => kit.tapOn(neo.scene.game.choices.find((c) => c.key === 'frog').node));
    await ready(0);
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [1, 1]);
    for (let n = 0; n < 3; n++) {
      await ready(n);
      for (let step = 0; step < 10; step++) {
        const pick = await followHint();
        if (!pick) continue;
        assert.equal(
          await page.evaluate(() => neo.scene.game.read.size),
          2,
          'both pages read before the friend',
        );
        if (n === 1) await screenshot('look-it-up-6-share-upright');
        await page.evaluate((p) => kit.tapOn(neo.scene.game.choices.find((c) => c.key === p).node), pick);
        break;
      }
      await page.waitForTimeout(400);
    }
    await finished('look-it-up');
    assert.deepEqual(await score(), [1, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Look It Up 6 upright: authored round, friend names fit, a wrong friend and a hint, two pages then the friend',
    );
  }

  return { lookItUpPlay };
}
