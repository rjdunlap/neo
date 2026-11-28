import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  async function viewpointsPlay() {
    await launch('story-steps', 14);
    await page.waitForTimeout(300);
    const g = (fn) => page.evaluate(fn);
    const before = await g(() => kit.store.data.stickers.length);
    const watch = async () => {
      await tap('neo.scene.game.showButton');
      await page.waitForFunction(() => !neo.scene.game.playing, null, { timeout: 45000 });
    };
    const pick = async (ending) => {
      const i = await page.evaluate((e) => neo.scene.game.endings.findIndex((x) => x.ending === e), ending);
      await tap(`neo.scene.game.endings[${i}].node`);
    };
    // Watching before hearing both friends costs nothing and pulses the unheard friend.
    await pick('stay-loud');
    await tap('neo.scene.game.showButton');
    assert.deepEqual(await g(() => [neo.scene.game.watched.length, neo.scene.game.misses]), [0, 0]);
    await tap('neo.scene.game.friends[0].node');
    await tap('neo.scene.game.friends[1].node');
    assert.deepEqual(await g(() => [neo.scene.game.heard.music, neo.scene.game.heard.quiet]), [true, true]);
    await tap('neo.scene.game.finishButton');
    assert.equal(await g(() => neo.scene.game.finished), false, 'bowing needs a working ending');
    // A first one-sided ending is free; the same one again is a miss.
    await watch();
    assert.deepEqual(await g(() => [neo.scene.game.watched.length, neo.scene.game.misses]), [1, 0]);
    await watch();
    assert.deepEqual(await g(() => [neo.scene.game.misses, neo.scene.game.hints]), [1, 0]);
    await tap('neo.scene.game.finishButton');
    assert.equal(await g(() => neo.scene.game.finished), false, 'a one-sided ending cannot finish');
    await pick('turn-off');
    await tap('neo.scene.game.undoButton');
    assert.equal(await g(() => neo.scene.game.draft), 'stay-loud');
    await tap('neo.scene.game.helpButton');
    assert.deepEqual(
      await g(() => [
        neo.scene.game.hints,
        neo.scene.game.helped === neo.scene.game.endings.find((e) => e.ending === 'two-spots').node,
      ]),
      [1, true],
    );
    await pick('two-spots');
    await watch();
    await screenshot('viewpoints-landscape');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(350);
    await screenshot('viewpoints-portrait');
    await tap('neo.scene.game.finishButton');
    await tap('neo.scene.game.finishButton');
    await finished('story-steps');
    assert.equal(await g(() => kit.store.data.stickers.length), before + 1);
    assert.deepEqual(
      await g(() => {
        const r = kit.store.stats('story-steps').history.at(-1);
        return [r.misses, r.hints];
      }),
      [1, 1],
    );
    await page.setViewportSize({ width: 1024, height: 768 });
    assert.deepEqual(errors, []);
    log(
      'Two Viewpoints 14: hear both, free first look, repeat miss, undo, help, working ending and one sticker passed',
    );
  }

  async function storyTheaterPlay() {
    const choose = async (field, value) => {
      const i = await page.evaluate(
        ({ field, value }) => neo.scene.game.choices.findIndex((c) => c.field === field && c.value === value),
        { field, value },
      );
      await tap(`neo.scene.game.choices[${i}].node`);
    };
    const watch = async () => {
      await tap('neo.scene.game.showButton');
      // Four spoken lines can use 25.7s of voice fallback before the scene-owned pauses finish.
      await page.waitForFunction(() => !neo.scene.game.playing && neo.scene.game.shows.length > 0, null, {
        timeout: 45000,
      });
    };
    for (const level of (process.env.THEATER_LEVELS?.split(',').map(Number) ?? [12, 13]).filter(
      (l) => l <= 13,
    )) {
      await launch('story-steps', level);
      await page.waitForTimeout(300);
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      await tap('neo.scene.game.finishButton');
      await tap('neo.scene.game.showButton');
      assert.deepEqual(
        await page.evaluate(() => [
          neo.scene.game.finished,
          neo.scene.game.shows.length,
          neo.scene.game.misses,
          neo.scene.game.hints,
        ]),
        [false, 0, 0, 0],
      );
      // A rainy blanket is a valid story with an indoor ending, never a wrong answer.
      await choose('cast', 'bear');
      await choose('weather', 'rain');
      await choose('prop', 'blanket');
      await choose('prop', 'umbrella');
      await tap('neo.scene.game.undoButton');
      assert.equal(await page.evaluate(() => neo.scene.game.draft.prop), 'blanket');
      await tap('neo.scene.game.helpButton');
      assert.deepEqual(
        await page.evaluate(() => [
          neo.scene.game.hints,
          neo.scene.game.helped === neo.scene.game.showButton,
        ]),
        [1, true],
      );
      await watch();
      assert.deepEqual(
        await page.evaluate(() => [
          neo.scene.game.misses,
          neo.scene.game.shows[0].prop,
          neo.scene.game.shows[0].weather,
        ]),
        [0, 'blanket', 'rain'],
      );
      if (level === 13) {
        await tap('neo.scene.game.finishButton');
        assert.equal(
          await page.evaluate(() => neo.scene.game.finished),
          false,
          'one show cannot finish a comparison',
        );
        await choose('cast', 'bunny');
        assert.equal(
          await page.evaluate(() => neo.scene.game.draft.cast),
          'bear',
          'comparison keeps the cast',
        );
        await choose('weather', 'sun');
        await choose('prop', 'umbrella');
        assert.deepEqual(
          await page.evaluate(() => [neo.scene.game.draft.weather, neo.scene.game.draft.prop]),
          ['rain', 'umbrella'],
          'changing prop restores the baseline weather',
        );
        await tap('neo.scene.game.undoButton');
        assert.deepEqual(
          await page.evaluate(() => [neo.scene.game.draft.weather, neo.scene.game.draft.prop]),
          ['sun', 'blanket'],
        );
        // The changed draft has to be watched, rather than just selected.
        await tap('neo.scene.game.finishButton');
        assert.equal(await page.evaluate(() => neo.scene.game.finished), false);
        await watch();
        assert.equal(await page.evaluate(() => neo.scene.game.shows.length), 2);
        // A replay preserves both shows and never completes or awards by itself.
        await watch();
        assert.deepEqual(
          await page.evaluate(() => [
            neo.scene.game.shows.length,
            neo.scene.game.finished,
            kit.store.data.stickers.length,
          ]),
          [2, false, before],
        );
        await screenshot('story-theater-landscape');
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(350);
        await screenshot('story-theater-portrait');
      }
      await page.evaluate(() => {
        const g = neo.scene.game;
        const nodes = [
          ...g.choices.map((c) => c.node),
          g.showButton,
          g.undoButton,
          g.helpButton,
          g.finishButton,
        ];
        for (const node of nodes) {
          const h = node.hitArea;
          if (
            h.width < 100 ||
            h.height < 100 ||
            node.x + h.x < 0 ||
            node.x + h.x + h.width > neo.view.w ||
            node.y + h.y < 120 ||
            node.y + h.y + h.height > neo.view.h
          )
            throw new Error('Theater target size/fit');
        }
        for (let i = 0; i < nodes.length; i++)
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i],
              b = nodes[j];
            if (
              Math.abs(a.x - b.x) < (a.hitArea.width + b.hitArea.width) / 2 &&
              Math.abs(a.y - b.y) < (a.hitArea.height + b.hitArea.height) / 2
            )
              throw new Error('Theater targets overlap');
          }
      });
      await tap('neo.scene.game.finishButton');
      await tap('neo.scene.game.finishButton');
      await finished('story-steps');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('story-steps').history.at(-1);
          return [r.misses, r.hints];
        }),
        [0, 1],
      );
      await page.setViewportSize({ width: 1024, height: 768 });
    }
    await launch('story-steps', 13);
    await page.waitForTimeout(250);
    await choose('cast', 'bunny');
    await choose('weather', 'sun');
    await choose('prop', 'umbrella');
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await tap('neo.scene.game.showButton');
    await page.evaluate(() => neo.go.hub());
    await scene('HomeScene');
    await page.waitForTimeout(1800);
    assert.equal(
      await page.evaluate(() => kit.store.data.stickers.length),
      before,
      'leaving a show does not award',
    );
    if (!process.env.THEATER_LEVELS || process.env.THEATER_LEVELS.split(',').includes('14'))
      await viewpointsPlay();
    assert.deepEqual(errors, []);
    log(
      `Story Theater ${process.env.THEATER_LEVELS || '12–13'}: free stories, undo, help, watched comparison/replay, portrait targets, one sticker and leaving mid-show passed`,
    );
  }

  return { storyTheaterPlay, viewpointsPlay };
}
