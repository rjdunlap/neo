import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  async function habitatPlay() {
    const readyRound = (index) =>
      page.waitForFunction(
        (index) => neo.scene.finished || (neo.scene.game.roundIndex === index && !neo.scene.game.busy),
        index,
        { timeout: 30000 },
      );
    const solveBuildRound = async (tryFirst = false, shot = 'habitat-helpers-1') => {
      const index = await page.evaluate(() => neo.scene.game.roundIndex);
      if (tryFirst) {
        await tap('neo.scene.game.testButton');
        await page.waitForFunction(() => neo.scene.game.attempts === 1 && !neo.scene.game.busy);
        assert.deepEqual(
          await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]),
          [0, 0],
          'an incomplete habitat is a free experiment',
        );
        await tap('neo.scene.game.testButton');
        await page.waitForFunction(() => neo.scene.game.attempts === 2 && !neo.scene.game.busy);
        assert.deepEqual(
          await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]),
          [0, 1],
          'a second test brings help, not a miss',
        );
        assert.ok(await page.evaluate(() => neo.scene.game.hinting.length > 0), 'a useful piece glows');
        await screenshot(shot);
      }
      const solution = await page.evaluate(async () => {
        const { solutions } = await import('/src/games/habitat-helpers/logic.ts');
        return solutions(neo.scene.game.round)[0];
      });
      for (const id of solution) {
        await page.evaluate((id) => kit.tapOn(neo.scene.game.pieces.find((p) => p.id === id).node), id);
        await page.waitForTimeout(220);
      }
      assert.equal(await page.evaluate(() => neo.scene.game.selected.length), solution.length);
      await tap('neo.scene.game.testButton');
      await page.waitForFunction((index) => neo.scene.finished || neo.scene.game.roundIndex > index, index, {
        timeout: 30000,
      });
    };

    // HABITAT_LEVELS=7 runs only level 7, Something changed.
    if (process.env.HABITAT_LEVELS === '7') return somethingChanged();

    // First level: an empty garden can be tested freely; the second test supplies a glow, then Bunny arrives.
    await launch('habitat-helpers', 1);
    await readyRound(0);
    await solveBuildRound(true);
    await finished('habitat-helpers');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('habitat-helpers').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 1],
    );
    assert.ok(await page.evaluate(() => kit.store.data.journal.found.includes('habitat-helpers:bunny')));

    // Level 3: five cards drawn from equivalent pieces (relaunch until a new one shows), one incomplete test, then the one working set.
    const NEW_PIECES = ['dandelions', 'log-burrow', 'pond-weed', 'reed-island'];
    for (let tries = 0; ; tries++) {
      await launch('habitat-helpers', 3);
      await readyRound(0);
      if (await page.evaluate((ids) => neo.scene.game.pieces.some((p) => ids.includes(p.id)), NEW_PIECES))
        break;
      assert.ok(tries < 8, 'a level-3 garden offers one of the new pieces');
    }
    assert.equal(
      await page.evaluate(() => neo.scene.game.pieces.length),
      5,
      'level 3 still shows five cards',
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    assert.ok(
      await page.evaluate(() =>
        [...neo.scene.game.pieces.map((p) => p.node), neo.scene.game.testButton].every((node) => {
          const b = node.getBounds();
          return (
            b.width > 0 &&
            b.x >= 0 &&
            b.y >= 0 &&
            b.x + b.width <= innerWidth &&
            b.y + b.height <= innerHeight
          );
        }),
      ),
      'level-3 portrait cards are drawn and fit',
    );
    await solveBuildRound(true, 'habitat-helpers-3-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await readyRound(1);
    await solveBuildRound();
    await finished('habitat-helpers');

    // Prediction level: deliberately predict the other visitor. It is an observation, not a wrong answer.
    await launch('habitat-helpers', 4);
    assert.equal(
      await page.evaluate(
        () => new Set(neo.scene.game.rounds.map((r) => [...r.prepared].sort().join('+'))).size,
      ),
      3,
      'no prepared garden repeats in a play',
    );
    for (let index = 0; index < 3; index++) {
      await readyRound(index);
      // The sign shows a mystery guest, never the answer; the two visitor cards do not overlap; touching a prepared piece only listens.
      assert.equal(
        await page.evaluate(() => neo.scene.game.goal.children.some((c) => 'alive' in c)),
        false,
        'the prediction sign never shows who will come',
      );
      assert.ok(
        await page.evaluate(() => {
          const [a, b] = neo.scene.game.choices.map((c) => c.node);
          return Math.abs(a.x - b.x) >= 142;
        }),
        'the Bunny and Duck cards do not overlap',
      );
      await page.evaluate(() => kit.tapOn(neo.scene.game.pieces[0].node));
      await page.waitForTimeout(450);
      assert.equal(
        await page.evaluate(() => neo.scene.game.selected.length),
        2,
        'a prepared piece stays put when touched',
      );
      const wrong = await page.evaluate(() =>
        neo.scene.game.round.visitors[0] === 'bunny' ? 'duck' : 'bunny',
      );
      await page.evaluate(
        (visitor) => kit.tapOn(neo.scene.game.choices.find((c) => c.visitor === visitor).node),
        wrong,
      );
      await tap('neo.scene.game.testButton');
      await page.waitForFunction((index) => neo.scene.finished || neo.scene.game.roundIndex > index, index, {
        timeout: 30000,
      });
    }
    await finished('habitat-helpers');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('habitat-helpers').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 0],
    );

    // Top level: the only three-space solution is the berry hedge, seed grass and pond with reeds; both visitors arrive.
    await launch('habitat-helpers', 6);
    await readyRound(0);
    await solveBuildRound();
    await finished('habitat-helpers');
    assert.ok(
      await page.evaluate(() =>
        ['habitat-helpers:bunny', 'habitat-helpers:duck'].every((id) =>
          kit.store.data.journal.found.includes(id),
        ),
      ),
    );
    await launch('habitat-helpers', 6);
    await readyRound(0);
    // Six cards: no two overlap, and the last one's touch area stays clear of the gate's.
    assert.ok(
      await page.evaluate(() => {
        const g = neo.scene.game;
        const xs = g.pieces.map((p) => p.node.x).sort((a, b) => a - b);
        return xs.every((x, i) => i === 0 || x - xs[i - 1] >= 112) && xs.at(-1) + 62 <= g.testButton.x - 72;
      }),
      'six piece cards are apart and clear of the gate',
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    assert.ok(
      await page.evaluate(() =>
        [...neo.scene.game.pieces.map((p) => p.node), neo.scene.game.testButton].every((node) => {
          const b = node.getBounds();
          return b.x >= 0 && b.y >= 0 && b.x + b.width <= innerWidth && b.y + b.height <= innerHeight;
        }),
      ),
      'portrait pieces and gate fit',
    );
    await screenshot('habitat-helpers-6-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    assert.deepEqual(errors, []);
    await somethingChanged();
    log(
      'Habitat Helpers: first, equivalent-piece level 3, prediction and top levels; a free incomplete test, automatic help, both visitors, discoveries and portrait passed',
    );
  }

  /** Level 7 in portrait: the dried pool, two wrong needs (two misses, the right need glows, one hint), the right need, a non-restoring card tested twice (free, the restoring card glows, one hint), then the restoring card; the second change by the bot. */
  async function somethingChanged() {
    const g = (expr) => page.evaluate((expr) => new Function('g', `return ${expr}`)(neo.scene.game), expr);
    const tapNode = (expr) =>
      page.evaluate((expr) => kit.tapOn(new Function('g', `return ${expr}`)(neo.scene.game)), expr);
    const asking = () =>
      page.waitForFunction(
        () => neo.scene.finished || (!neo.scene.game.busy && neo.scene.game.needChoices.length === 3),
        null,
        { timeout: 30000 },
      );
    const idle = () => page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
    await page.setViewportSize({ width: 768, height: 1024 });
    await launch('habitat-helpers', 7, 'Mia', 'school');
    await asking();
    assert.equal(await g('g.round.change.id'), 'pool-dried', 'every play opens with the dried pool');
    assert.deepEqual(
      await g('[g.misses, g.hints, g.testButton.visible, g.pieces.length]'),
      [0, 0, false, 3],
      'the question comes before any repair or gate',
    );
    assert.ok(
      await g("g.goal.children.some((c) => 'alive' in c)"),
      'the before card shows Bunny beside the old garden',
    );
    assert.ok(
      await g(
        '[...g.needChoices.map((c) => c.node), ...g.pieces.map((p) => p.node)].every((n) => { const b = n.getBounds(); return b.x >= 0 && b.y >= 0 && b.x + b.width <= innerWidth && b.y + b.height <= innerHeight; })',
      ),
      'portrait need buttons and garden fit',
    );
    assert.ok(
      await g(
        'g.needChoices.every((c, i, a) => i === 0 || c.node.x - a[i - 1].node.x >= 132) && g.needChoices[0].node.x - 66 >= 150',
      ),
      'need buttons are apart and clear of the pet',
    );
    assert.ok(
      await g('g.pieces.every((p, i, a) => i === 0 || Math.abs(p.node.x - a[i - 1].node.x) >= 124)'),
      'the garden cards do not overlap',
    );
    await tapNode("g.needChoices.find((c) => c.need === 'food').node");
    await page.waitForTimeout(300);
    assert.deepEqual(
      await g('[g.misses, g.hints, g.needNamed, g.beforePulse > 0]'),
      [1, 0, false, true],
      'a wrong need is a miss and the before card pulses',
    );
    await screenshot('habitat-helpers-7-before-card-portrait');
    await tapNode("g.needChoices.find((c) => c.need === 'shelter').node");
    await page.waitForTimeout(300);
    assert.deepEqual(
      await g('[g.misses, g.hints, g.needGlow]'),
      [2, 1, true],
      'a second wrong need glows the right one, once',
    );
    await tapNode("g.needChoices.find((c) => c.need === 'water').node");
    await idle();
    assert.deepEqual(
      await g('[g.needNamed, g.needChoices.length, g.testButton.visible, g.pieces.length]'),
      [true, 0, true, 5],
      'the right need opens the two-card repair tray and the gate',
    );
    await tapNode("g.pieces.find((p) => p.id === 'seed-grass').node");
    await page.waitForTimeout(300);
    assert.deepEqual(await g('g.selected'), ['seed-grass']);
    assert.ok(
      await g(
        'g.pieces.filter((p) => p.selected).every((p, i, a) => i === 0 || p.node.x - a[i - 1].node.x >= 124) && g.pieces.filter((p) => p.selected).every((p) => { const b = p.node.getBounds(); return b.x >= 0 && b.x + b.width <= innerWidth; })',
      ),
      'the repair space sits apart from the garden and on screen',
    );
    await tap('neo.scene.game.testButton');
    await page.waitForFunction(() => neo.scene.game.attempts === 1 && !neo.scene.game.busy);
    assert.deepEqual(await g('[g.misses, g.hints]'), [2, 1], 'a repair that does not restore is a free test');
    await tap('neo.scene.game.testButton');
    await page.waitForFunction(() => neo.scene.game.attempts === 2 && !neo.scene.game.busy);
    assert.deepEqual(
      await g('[g.misses, g.hints, g.hinting]'),
      [2, 2, ['pond-reeds']],
      'a second test glows the restoring card, one hint',
    );
    await tapNode("g.pieces.find((p) => p.id === 'seed-grass').node");
    await page.waitForTimeout(300);
    await tapNode("g.pieces.find((p) => p.id === 'pond-reeds').node");
    await page.waitForTimeout(300);
    await tap('neo.scene.game.testButton');
    await page.waitForFunction(() => neo.scene.finished || neo.scene.game.roundIndex > 0, null, {
      timeout: 30000,
    });
    // The second change, played by the game's own bot through real taps.
    for (let guard = 0; guard < 40 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
      await page.evaluate(async () => {
        const it = neo.scene.game.autotouch();
        if (it?.tap) kit.tapOn(it.tap.on);
        await kit.sleep(500);
      });
    }
    await finished('habitat-helpers');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('habitat-helpers').history.at(-1);
        return [r.misses, r.hints];
      }),
      [2, 2],
    );
    await page.setViewportSize({ width: 1024, height: 768 });
    assert.deepEqual(errors, []);
    log(
      'Habitat Helpers 7: two wrong needs (two misses, glow, one hint), a free non-restoring test and the card glow (one hint), the restored pool, the bot second change, one sticker, portrait',
    );
  }

  return { habitatPlay };
}
