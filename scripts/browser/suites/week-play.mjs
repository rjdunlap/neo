import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  async function weekPlay() {
    const levels = (process.env.WEEK_LEVELS || '1,3').split(',').map(Number);
    // Also waits out an ask held behind a lesson line and a replayed line (U7 R4: neither holds input), so the scripted
    // taps below answer a spoken question and keep the old pacing.
    const wait = () =>
      page.waitForFunction(
        () => neo.scene.finished || (!neo.scene.game.busy && !neo.scene.game.unasked && !neo.scene.game.playing),
      );
    // U7 R4: lesson lines never hold the next question. Lines matching `pattern` are stretched to at least 4 s; each
    // records how soon the next question opened (input clear, `opened(g, before)` true) and when its ask was said.
    const stretch = (pattern, opened) =>
      page.evaluate(
        ({ pattern, opened }) => {
          const g = neo.scene.game;
          const test = new RegExp(pattern);
          const isOpen = new Function('g', 'before', `return (${opened})(g, before)`);
          const say = g.ctx.say.bind(g.ctx);
          const instruct = g.ctx.instruct.bind(g.ctx);
          g.r4 = [];
          g.ctx.instruct = (id, vars) => {
            const rec = g.r4.at(-1);
            if (rec && rec.asked === undefined) rec.asked = performance.now() - rec.at;
            return instruct(id, vars);
          };
          g.ctx.say = (id, vars) => {
            const line = say(id, vars);
            if (!test.test(String(id))) return line;
            const before = { question: g.question, phase: g.phase };
            const rec = { id: String(id), at: performance.now() };
            g.r4.push(rec);
            const watch = () => {
              if (rec.opens !== undefined) return;
              if (g.finished || (!g.busy && isOpen(g, before))) rec.opens = performance.now() - rec.at;
              else if (performance.now() - rec.at < 10000) requestAnimationFrame(watch);
            };
            void Promise.resolve().then(watch);
            return Promise.all([line, kit.sleep(4000)]).then(() => undefined);
          };
        },
        { pattern, opened: opened.toString() },
      );
    const r4 = async (what) => {
      const recs = await page.evaluate(() =>
        neo.scene.game.r4.map((r) => ({
          id: r.id,
          opens: Math.round(r.opens ?? -1),
          asked: Math.round(r.asked ?? -1),
        })),
      );
      const early = recs.filter((r) => r.asked >= 0);
      if (!early.length || early.some((r) => r.opens < 0 || r.opens > 1500))
        throw new Error(`R4: ${what} held the next question: ${JSON.stringify(recs)}`);
      // The bot waits for the ask, so each ask comes after its line, never cutting it.
      if (early.some((r) => r.asked < 3900))
        throw new Error(`R4: the next ask cut ${what}: ${JSON.stringify(recs)}`);
      return recs;
    };
    // A tap that only names or replays something never holds input.
    const opensAtOnce = async (target, what) => {
      await tap(target);
      assert.equal(
        await page.evaluate(() => neo.scene.game.busy),
        false,
        `R4: ${what} holds input while it is said`,
      );
    };
    const gesture = () =>
      page.evaluate(() => {
        const intent = neo.scene.game.autotouch();
        if (intent) kit.tapOn(intent.tap.on);
      });
    for (const level of levels) {
      await launch('day-by-day', level);
      await wait();
      if (level === 6) {
        const before = await page.evaluate(() => ({
          weeks: neo.scene.game.round.weeks,
          stickers: kit.store.data.stickers.length,
        }));
        assert.equal(before.weeks.length, 2);
        assert.ok(before.weeks.every((w) => w.length === 7));
        // No choice selected: confirm is inert. Listening to the wrong summary is free.
        await tap('neo.scene.game.confirm');
        await wait();
        await opensAtOnce('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node', 'a summary');
        await wait();
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
        await opensAtOnce('neo.scene.game.tabs[1]', "a tab's page");
        await opensAtOnce('neo.scene.game.records[3]', 'a record');
        await opensAtOnce('neo.scene.game.records[3]', 'a record');
        await opensAtOnce('neo.scene.game.tabs[0]', "a tab's page");
        await wait();
        // Every observation is available on its own full-size page; marking/unmarking never changes evidence.
        for (let week = 0; week < 2; week++) {
          await tap(`neo.scene.game.tabs[${week}]`);
          await wait();
          for (let day = 0; day < 7; day++) {
            await tap(`neo.scene.game.records[${day}]`);
            await wait();
          }
          await tap('neo.scene.game.records[0]');
          await wait();
          assert.deepEqual(
            await page.evaluate(() => neo.scene.game.marks[neo.scene.game.page]),
            [1, 2, 3, 4, 5, 6],
          );
        }
        await tap('neo.scene.game.replayButton');
        await wait();
        assert.deepEqual(await page.evaluate(() => neo.scene.game.round.weeks), before.weeks);
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
        for (let attempt = 0; attempt < 3; attempt++) {
          await tap('neo.scene.game.confirm');
          await wait();
        }
        assert.deepEqual(
          await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]),
          [3, 1, true],
        );
        // Hint and selected summary persist on either page; the choice/confirm gesture remains usable.
        await tap('neo.scene.game.tabs[0]');
        await wait();
        assert.equal(await page.evaluate(() => neo.scene.game.hinted), true);
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(300);
        await screenshot('day-by-day-6-window-portrait');
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(180);
        await tap('neo.scene.game.choices[neo.scene.game.answer].node');
        await wait();
        await stretch('^window\\.evidence$', (g, before) => g.question > before.question);
        await tap('neo.scene.game.confirm');
        await wait();
        const evidence = await r4('the first evidence line');
        log(`Day by Day 6 R4: the second question opened ${evidence[0].opens} ms into window.evidence`);
        assert.deepEqual(
          await page.evaluate(() => [
            neo.scene.game.question,
            neo.scene.game.hinted,
            neo.scene.game.selected,
            kit.store.data.stickers.length,
          ]),
          [1, false, null, before.stickers],
        );
        assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), [[], []]);
        // Second question has explicit equal/different summaries, each replayed before committing.
        assert.deepEqual(await page.evaluate(() => [...neo.scene.game.round.questions[1].choices].sort()), [
          'different',
          'equal',
        ]);
        await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node');
        await wait();
        for (let attempt = 0; attempt < 2; attempt++) {
          await tap('neo.scene.game.confirm');
          await wait();
        }
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [5, 2]);
        for (let guard = 0; guard < 24; guard++) {
          if (await page.evaluate(() => neo.scene.finished)) break;
          await gesture();
          await page.waitForTimeout(180);
          await wait();
        }
        await finished('day-by-day');
        assert.deepEqual(
          await page.evaluate(() => {
            const r = kit.store.stats('day-by-day').history.at(-1);
            return [r.level, r.misses, r.hints, kit.store.data.stickers.length];
          }),
          [6, 5, 2, before.stickers + 1],
        );
        assert.deepEqual(await page.evaluate(() => neo.scene.game.round.weeks), before.weeks);
        log(
          'Day by Day 6: both full-size pages/all fourteen records, replay/marks, free summary selection, confirm-only misses, bounded hints, explicit equality, two-question finish/one sticker and portrait passed',
        );
        continue;
      }
      if (level === 10) {
        const before = await page.evaluate(() => ({
          week: [...neo.scene.game.week],
          hints: neo.scene.game.hints,
          phase: neo.scene.game.phase,
          recorded: neo.scene.game.recorded,
        }));
        assert.equal(before.phase, 'tally');
        assert.equal(before.recorded, 7);
        assert.equal(before.hints, 0);
        assert.equal(before.week.filter((w) => w === 0).length, 3);
        assert.equal(await page.evaluate(() => neo.scene.game.confirm.visible), false);
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(300);
        await screenshot('day-by-day-10-record-portrait');
        // Explore a cloud/rain record and undo, then keep that non-sun marked. Marks never decide correctness.
        const nonSun = before.week.findIndex((w) => w !== 0);
        for (let i = 0; i < 3; i++) {
          await tap(`neo.scene.game.records[${nonSun}]`);
          await wait();
        }
        assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), [nonSun]);
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
        for (let i = 0; i < 3; i++) {
          await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node');
          await wait();
        }
        assert.deepEqual(
          await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]),
          [3, 1, true],
        );
        assert.deepEqual(await page.evaluate(() => [...neo.scene.game.week]), before.week);
        await tap('neo.scene.game.choices.find(p => p.n === neo.scene.game.answer).node');
        await finished('day-by-day');
        assert.deepEqual(
          await page.evaluate(() => {
            const r = kit.store.stats('day-by-day').history.at(-1);
            return [r.level, r.misses, r.hints];
          }),
          [10, 3, 1],
        );
        assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), [nonSun]);
        await page.setViewportSize({ width: 1024, height: 768 });
        log(
          'Day by Day 10: supplied record, baseline support, free reversible marks/replay, immutable evidence, repeated misses/one hint, one correct total and sticker passed',
        );
        continue;
      }
      // Naming a wrong card is exploration; only the placing arrow commits an answer.
      await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node');
      await wait();
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
      for (let attempt = 0; attempt < 2; attempt++) {
        await tap('neo.scene.game.confirm');
        await wait();
      }
      assert.deepEqual(
        await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]),
        [2, 1, true],
      );
      if (level >= 2 && level <= 5)
        await stretch('^week\\.(tomorrow|yesterday)(any)?yes$', (g, before) =>
          g.question > before.question || g.phase !== before.phase,
        );
      let checkedWeather = false,
        checkedTally = false,
        checkedWrap = false;
      for (let guard = 0; guard < 80; guard++) {
        if (await page.evaluate(() => neo.scene.finished)) break;
        await wait();
        const phase = await page.evaluate(() => neo.scene.game.phase);
        if (level === 2 && phase === 'relative' && !checkedWrap) {
          checkedWrap = true;
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(300);
          assert.equal(await page.evaluate(() => neo.scene.game.evidence.eventMode), 'none');
          await screenshot('day-by-day-2-wrap-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(100);
        }
        if (phase === 'weather' && !checkedWeather) {
          checkedWeather = true;
          await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node');
          await wait();
          assert.equal(await page.evaluate(() => neo.scene.game.misses), 3);
          if (level === 3) {
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.waitForTimeout(300);
            await screenshot('day-by-day-3-portrait');
          } else await screenshot('day-by-day-1-landscape');
        }
        if (phase === 'tally' && !checkedTally) {
          checkedTally = true;
          const weekBefore = await page.evaluate(() => [...neo.scene.game.week]);
          await opensAtOnce('neo.scene.game.records[0]', 'a replayed record');
          await wait();
          assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), [0]);
          await tap('neo.scene.game.records[0]');
          await wait();
          assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), []);
          assert.deepEqual(await page.evaluate(() => neo.scene.game.week), weekBefore);
          assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [3, 1]);
          if (level === 5) {
            const tally = await page.evaluate(() => {
              const g = neo.scene.game;
              return {
                answer: g.answer,
                count: g.week.filter((w) => w === g.tallyWeather).length,
                category: g.tallyWeather,
                caption: g.caption.text,
              };
            });
            assert.equal(tally.answer, tally.count);
            assert.ok(tally.caption.includes(['sunny', 'cloudy', 'rainy'][tally.category]));
            for (let attempt = 0; attempt < 2; attempt++) {
              await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node');
              await wait();
            }
            assert.deepEqual(
              await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]),
              [5, 2],
            );
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.waitForTimeout(300);
            await screenshot('day-by-day-5-tally-portrait');
          }
        }
        await gesture();
        await page.waitForTimeout(170);
        await wait();
      }
      await finished('day-by-day');
      assert.equal(await page.evaluate(() => neo.scene.game.recorded), 7);
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('day-by-day').history.at(-1);
          return [r.misses, r.hints];
        }),
        level === 5 ? [5, 2] : [3, 1],
      );
      if (level === 3 || level === 5) assert.ok(checkedTally, 'read the weather tally');
      if (level === 2) assert.ok(checkedWrap, 'inspect the week turn in portrait');
      if (level >= 2 && level <= 5) {
        const yes = await r4('a relative yes line');
        log(`Day by Day ${level} R4: the next question opened ${yes.map((r) => r.opens).join(', ')} ms into a yes line`);
      }
      await page.setViewportSize({ width: 1024, height: 768 });
      log(
        `Day by Day ${level}: card naming, real placing/weather taps, retries, hint, seven records, tally revision and saved sticker passed`,
      );
    }
    // U7b (docs/definitions/never-swallow-a-tap.md R4, R5): a card's name never holds input. The arrow tapped while the
    // name is still being said places the day at once; the guide bobs while the line plays; the weather's record still holds.
    await launch('day-by-day', levels.at(-1));
    await wait();
    if (await page.evaluate(() => neo.scene.game.phase === 'day')) {
      await tap('neo.scene.game.choices.find(p => p.n === neo.scene.game.answer).node');
      const naming = await page.evaluate(async () => {
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        return {
          busy: neo.scene.game.busy,
          talking: neo.scene.pet.talking,
          selected: neo.scene.game.selected,
        };
      });
      assert.equal(naming.busy, false, 'the name does not hold input');
      assert.equal(naming.talking, true, 'the guide bobs while the name is said');
      await tap('neo.scene.game.confirm');
      assert.equal(
        await page.evaluate(() => neo.scene.game.phase),
        'weather',
        'the arrow placed the day during the name',
      );
      await wait();
      await tap('neo.scene.game.choices.find(p => p.n === neo.scene.game.answer).node');
      assert.equal(await page.evaluate(() => neo.scene.game.busy), true, "the day's record still holds");
      // A tap the held record keeps from doing anything gets one soft tick (R5) and changes nothing.
      const sounds = () =>
        page.evaluate(async () => (await import('/src/audio/sound-count.ts')).soundCount.n);
      const heard = await sounds();
      await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node');
      assert.equal((await sounds()) - heard, 1, 'a held tap ticks once');
      assert.equal(await page.evaluate(() => neo.scene.game.misses), 0, 'a held tap is not a miss');
      await wait();
      log(
        'Day by Day: the arrow during the name places the day at once, the guide bobs, the record holds and a held tap ticks (U7b)',
      );
    }
    await tap('neo.scene.game.choices[0].node');
    await page.evaluate(() => neo.go.land('cozy-village'));
    await scene('LandScene');
    await page.waitForTimeout(300);
    assert.deepEqual(errors, []);
  }

  return { weekPlay };
}
