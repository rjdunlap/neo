import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
async function weekPlay() {
  const levels = (process.env.WEEK_LEVELS || '1,3').split(',').map(Number);
  const wait = () => page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy);
  const gesture = () => page.evaluate(() => {
    const intent = neo.scene.game.autotouch();
    if (intent) kit.tapOn(intent.tap.on);
  });
  for (const level of levels) {
    await launch('day-by-day', level);
    await wait();
    if (level === 6) {
      const before = await page.evaluate(() => ({ weeks: neo.scene.game.round.weeks, stickers: kit.store.data.stickers.length }));
      assert.equal(before.weeks.length, 2);
      assert.ok(before.weeks.every(w => w.length === 7));
      // No choice selected: confirm is inert. Listening to the wrong summary is free.
      await tap('neo.scene.game.confirm'); await wait();
      await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node'); await wait();
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
      // Every observation is available on its own full-size page; marking/unmarking never changes evidence.
      for (let week = 0; week < 2; week++) {
        await tap(`neo.scene.game.tabs[${week}]`); await wait();
        for (let day = 0; day < 7; day++) { await tap(`neo.scene.game.records[${day}]`); await wait(); }
        await tap('neo.scene.game.records[0]'); await wait();
        assert.deepEqual(await page.evaluate(() => neo.scene.game.marks[neo.scene.game.page]), [1, 2, 3, 4, 5, 6]);
      }
      await tap('neo.scene.game.replayButton'); await wait();
      assert.deepEqual(await page.evaluate(() => neo.scene.game.round.weeks), before.weeks);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
      for (let attempt = 0; attempt < 3; attempt++) { await tap('neo.scene.game.confirm'); await wait(); }
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]), [3, 1, true]);
      // Hint and selected summary persist on either page; the choice/confirm gesture remains usable.
      await tap('neo.scene.game.tabs[0]'); await wait();
      assert.equal(await page.evaluate(() => neo.scene.game.hinted), true);
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      await screenshot('day-by-day-6-window-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(180);
      await tap('neo.scene.game.choices[neo.scene.game.answer].node'); await wait();
      await tap('neo.scene.game.confirm'); await wait();
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.question, neo.scene.game.hinted, neo.scene.game.selected, kit.store.data.stickers.length]), [1, false, null, before.stickers]);
      assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), [[], []]);
      // Second question has explicit equal/different summaries, each replayed before committing.
      assert.deepEqual(await page.evaluate(() => [...neo.scene.game.round.questions[1].choices].sort()), ['different', 'equal']);
      await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node'); await wait();
      for (let attempt = 0; attempt < 2; attempt++) { await tap('neo.scene.game.confirm'); await wait(); }
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [5, 2]);
      for (let guard = 0; guard < 24; guard++) {
        if (await page.evaluate(() => neo.scene.finished)) break;
        await gesture(); await page.waitForTimeout(180); await wait();
      }
      await finished('day-by-day');
      assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('day-by-day').history.at(-1); return [r.level, r.misses, r.hints, kit.store.data.stickers.length]; }), [6, 5, 2, before.stickers + 1]);
      assert.deepEqual(await page.evaluate(() => neo.scene.game.round.weeks), before.weeks);
      log('Day by Day 6: both full-size pages/all fourteen records, replay/marks, free summary selection, confirm-only misses, bounded hints, explicit equality, two-question finish/one sticker and portrait passed');
      continue;
    }
    if (level === 10) {
      const before = await page.evaluate(() => ({ week: [...neo.scene.game.week], hints: neo.scene.game.hints, phase: neo.scene.game.phase, recorded: neo.scene.game.recorded }));
      assert.equal(before.phase, 'tally'); assert.equal(before.recorded, 7); assert.equal(before.hints, 0);
      assert.equal(before.week.filter(w => w === 0).length, 3);
      assert.equal(await page.evaluate(() => neo.scene.game.confirm.visible), false);
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      await screenshot('day-by-day-10-record-portrait');
      // Explore a cloud/rain record and undo, then keep that non-sun marked. Marks never decide correctness.
      const nonSun = before.week.findIndex(w => w !== 0);
      for (let i = 0; i < 3; i++) { await tap(`neo.scene.game.records[${nonSun}]`); await wait(); }
      assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), [nonSun]);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
      for (let i = 0; i < 3; i++) { await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node'); await wait(); }
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]), [3, 1, true]);
      assert.deepEqual(await page.evaluate(() => [...neo.scene.game.week]), before.week);
      await tap('neo.scene.game.choices.find(p => p.n === neo.scene.game.answer).node');
      await finished('day-by-day');
      assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('day-by-day').history.at(-1); return [r.level, r.misses, r.hints]; }), [10, 3, 1]);
      assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), [nonSun]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log('Day by Day 10: supplied record, baseline support, free reversible marks/replay, immutable evidence, repeated misses/one hint, one correct total and sticker passed');
      continue;
    }
    // Naming a wrong card is exploration; only the placing arrow commits an answer.
    await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node'); await wait();
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
    for (let attempt = 0; attempt < 2; attempt++) { await tap('neo.scene.game.confirm'); await wait(); }
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]), [2, 1, true]);
    let checkedWeather = false, checkedTally = false, checkedWrap = false;
    for (let guard = 0; guard < 80; guard++) {
      if (await page.evaluate(() => neo.scene.finished)) break;
      await wait();
      const phase = await page.evaluate(() => neo.scene.game.phase);
      if (level === 2 && phase === 'relative' && !checkedWrap) {
        checkedWrap = true;
        await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
        assert.equal(await page.evaluate(() => neo.scene.game.evidence.eventMode), 'none');
        await screenshot('day-by-day-2-wrap-portrait');
        await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(100);
      }
      if (phase === 'weather' && !checkedWeather) {
        checkedWeather = true;
        await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node'); await wait();
        assert.equal(await page.evaluate(() => neo.scene.game.misses), 3);
        if (level === 3) {
          await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
          await screenshot('day-by-day-3-portrait');
        } else await screenshot('day-by-day-1-landscape');
      }
      if (phase === 'tally' && !checkedTally) {
        checkedTally = true;
        const weekBefore = await page.evaluate(() => [...neo.scene.game.week]);
        await tap('neo.scene.game.records[0]'); await wait();
        assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), [0]);
        await tap('neo.scene.game.records[0]'); await wait();
        assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), []);
        assert.deepEqual(await page.evaluate(() => neo.scene.game.week), weekBefore);
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [3, 1]);
        if (level === 5) {
          const tally = await page.evaluate(() => { const g = neo.scene.game; return { answer: g.answer, count: g.week.filter(w => w === g.tallyWeather).length, category: g.tallyWeather, caption: g.caption.text }; });
          assert.equal(tally.answer, tally.count);
          assert.ok(tally.caption.includes(['sunny', 'cloudy', 'rainy'][tally.category]));
          for (let attempt = 0; attempt < 2; attempt++) { await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node'); await wait(); }
          assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [5, 2]);
          await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
          await screenshot('day-by-day-5-tally-portrait');
        }
      }
      await gesture(); await page.waitForTimeout(170); await wait();
    }
    await finished('day-by-day');
    assert.equal(await page.evaluate(() => neo.scene.game.recorded), 7);
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('day-by-day').history.at(-1); return [r.misses, r.hints]; }), level === 5 ? [5, 2] : [3, 1]);
    if (level === 3 || level === 5) assert.ok(checkedTally, 'read the weather tally');
    if (level === 2) assert.ok(checkedWrap, 'inspect the week turn in portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Day by Day ${level}: card naming, real placing/weather taps, retries, hint, seven records, tally revision and saved sticker passed`);
  }
  await launch('day-by-day', levels.at(-1)); await wait();
  await tap('neo.scene.game.choices[0].node');
  await page.evaluate(() => neo.go.land('cozy-village')); await scene('LandScene');
  await page.waitForTimeout(300);
  assert.deepEqual(errors, []);
}

return { weekPlay };
}
