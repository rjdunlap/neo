import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
async function storyTheaterPlay() {
  const choose = async (field, value) => {
    const i = await page.evaluate(({ field, value }) => neo.scene.game.choices.findIndex(c => c.field === field && c.value === value), { field, value });
    await tap(`neo.scene.game.choices[${i}].node`);
  };
  const watch = async () => {
    await tap('neo.scene.game.showButton');
    // Four spoken lines can use 25.7s of voice fallback before the scene-owned pauses finish.
    await page.waitForFunction(() => !neo.scene.game.playing && neo.scene.game.shows.length > 0, null, { timeout: 45000 });
  };
  for (const level of process.env.THEATER_LEVELS?.split(',').map(Number) ?? [12, 13]) {
    await launch('story-steps', level); await page.waitForTimeout(300);
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await tap('neo.scene.game.finishButton'); await tap('neo.scene.game.showButton');
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.finished, neo.scene.game.shows.length, neo.scene.game.misses, neo.scene.game.hints]), [false, 0, 0, 0]);
    // A rainy blanket is a valid story with an indoor ending, never a wrong answer.
    await choose('cast', 'bear'); await choose('weather', 'rain'); await choose('prop', 'blanket');
    await choose('prop', 'umbrella'); await tap('neo.scene.game.undoButton');
    assert.equal(await page.evaluate(() => neo.scene.game.draft.prop), 'blanket');
    await tap('neo.scene.game.helpButton');
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.hints, neo.scene.game.helped === neo.scene.game.showButton]), [1, true]);
    await watch();
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.shows[0].prop, neo.scene.game.shows[0].weather]), [0, 'blanket', 'rain']);
    if (level === 13) {
      await tap('neo.scene.game.finishButton');
      assert.equal(await page.evaluate(() => neo.scene.game.finished), false, 'one show cannot finish a comparison');
      await choose('cast', 'bunny');
      assert.equal(await page.evaluate(() => neo.scene.game.draft.cast), 'bear', 'comparison keeps the cast');
      await choose('weather', 'sun'); await choose('prop', 'umbrella');
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.draft.weather, neo.scene.game.draft.prop]), ['rain', 'umbrella'], 'changing prop restores the baseline weather');
      await tap('neo.scene.game.undoButton');
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.draft.weather, neo.scene.game.draft.prop]), ['sun', 'blanket']);
      // The changed draft has to be watched, rather than just selected.
      await tap('neo.scene.game.finishButton');
      assert.equal(await page.evaluate(() => neo.scene.game.finished), false);
      await watch();
      assert.equal(await page.evaluate(() => neo.scene.game.shows.length), 2);
      // A replay preserves both shows and never completes or awards by itself.
      await watch();
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.shows.length, neo.scene.game.finished, kit.store.data.stickers.length]), [2, false, before]);
      await screenshot('story-theater-landscape');
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(350);
      await screenshot('story-theater-portrait');
    }
    await page.evaluate(() => {
      const g = neo.scene.game;
      const nodes = [...g.choices.map(c => c.node), g.showButton, g.undoButton, g.helpButton, g.finishButton];
      for (const node of nodes) {
        const h = node.hitArea;
        if (h.width < 100 || h.height < 100 || node.x + h.x < 0 || node.x + h.x + h.width > neo.view.w || node.y + h.y < 120 || node.y + h.y + h.height > neo.view.h) throw new Error('Theater target size/fit');
      }
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        if (Math.abs(a.x - b.x) < (a.hitArea.width + b.hitArea.width) / 2 && Math.abs(a.y - b.y) < (a.hitArea.height + b.hitArea.height) / 2) throw new Error('Theater targets overlap');
      }
    });
    await tap('neo.scene.game.finishButton'); await tap('neo.scene.game.finishButton');
    await finished('story-steps');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('story-steps').history.at(-1); return [r.misses, r.hints]; }), [0, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
  }
  await launch('story-steps', 13); await page.waitForTimeout(250);
  await choose('cast', 'bunny'); await choose('weather', 'sun'); await choose('prop', 'umbrella');
  const before = await page.evaluate(() => kit.store.data.stickers.length);
  await tap('neo.scene.game.showButton');
  await page.evaluate(() => neo.go.hub()); await scene('MapScene'); await page.waitForTimeout(1800);
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before, 'leaving a show does not award');
  assert.deepEqual(errors, []);
  log(`Story Theater ${process.env.THEATER_LEVELS || '12–13'}: free stories, undo, help, watched comparison/replay, portrait targets, one sticker and leaving mid-show passed`);
}

return { storyTheaterPlay };
}
