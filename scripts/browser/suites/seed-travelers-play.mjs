import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function seedTravelersPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('seed-travelers').history.at(-1);
        return [r.misses, r.hints];
      });
    const idle = () =>
      page.waitForFunction(
        () => {
          const g = neo.scene.game;
          return g && g.layout && !g.busy;
        },
        null,
        { timeout: 15000 },
      );
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 1: the bellows, one Replay, then the basket.
    await launch('seed-travelers', 1, 'Mia', 'preschool');
    // U7 R4: an arrival's line never holds her next tap. `seeds.arrived.breeze` is stretched to at least 4 s here, so
    // the bellows and basket opening sooner shows the line no longer gates them.
    await page.evaluate(() => {
      const g = neo.scene.game;
      const say = g.ctx.say.bind(g.ctx);
      const instruct = g.ctx.instruct.bind(g.ctx);
      g.heardLines = [];
      g.finishAt = [];
      g.ctx.instruct = (id, vars) => {
        if (id === 'seeds.finish') g.finishAt.push(performance.now());
        return instruct(id, vars);
      };
      g.ctx.say = (id, vars) => {
        const line = say(id, vars);
        if (id !== 'seeds.arrived.breeze') return line;
        const rec = { at: performance.now() };
        g.heardLines.push(rec);
        const watch = () => {
          if (rec.opens !== undefined) return;
          if (!g.busy) rec.opens = performance.now() - rec.at;
          else if (performance.now() - rec.at < 10000) requestAnimationFrame(watch);
        };
        void Promise.resolve().then(watch);
        return Promise.all([line, kit.sleep(4000)]).then(() => undefined);
      };
    });
    await idle();
    assert.equal(
      await page.evaluate(() => neo.scene.game.basket.visible),
      false,
      'no basket before the first arrival',
    );
    await page.evaluate(() => kit.tapOn(neo.scene.game.bellows));
    await page.waitForFunction(
      () => neo.scene.game.state.place.plume === 'tray' && !neo.scene.game.busy,
      null,
      { timeout: 15000 },
    );
    await page.evaluate(() => kit.tapOn(neo.scene.game.bellows));
    await page.waitForFunction(() => neo.scene.game.shown?.replay === true, null, { timeout: 4000 });
    await idle();
    assert.equal(
      await page.evaluate(() => neo.scene.game.state.place.plume),
      'tray',
      'the replay delivers again',
    );
    await page.waitForFunction(() => neo.scene.game.basket.visible, null, { timeout: 4000 });
    const heard = await page.evaluate(() => neo.scene.game.heardLines.map((r) => Math.round(r.opens ?? -1)));
    if (heard.length !== 2 || heard.some((ms) => ms < 0 || ms > 500))
      throw new Error(`R4: an arrival's line held the bellows: ${JSON.stringify(heard)}`);
    // The first arrival's line was cut by the Replay, so "Tap the basket" waits for the Replay's arrival line.
    await page.waitForFunction(() => neo.scene.game.finishAt.length === 1, null, { timeout: 8000 });
    const finishAfter = await page.evaluate(
      () => neo.scene.game.finishAt[0] - neo.scene.game.heardLines[1].at,
    );
    assert.ok(finishAfter >= 3900, `seeds.finish waited for the arrival line (${Math.round(finishAfter)} ms)`);
    log(
      `Seed Travelers 1 R4: the bellows opened ${heard.join(', ')} ms into the stretched arrival; "Tap the basket" ${Math.round(finishAfter)} ms after the last`,
    );
    await page.evaluate(() => kit.tapOn(neo.scene.game.basket));
    await finished('seed-travelers');
    assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

    // Level 3 in portrait: the plume with the critter stays, one requested hint, then both deliveries.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('seed-travelers', 3, 'Mia', 'prek');
    await idle();
    await page.evaluate(() => kit.tapOn(neo.scene.game.critter));
    await page.waitForFunction(() => neo.scene.game.state.chosen.carrier === 'fur', null, { timeout: 4000 });
    await page.evaluate(() => kit.tapOn(neo.scene.game.seeds.plume));
    await page.waitForFunction(() => neo.scene.game.busy, null, { timeout: 4000 });
    await idle();
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.state.place.plume, neo.scene.game.state.trials.length]),
      ['patch', 1],
      'the plume stayed and the board has one cell',
    );
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.equal(
      await page.evaluate(() => neo.scene.game.state.hints),
      1,
      'asking again while the glow is up counts nothing',
    );
    for (let i = 0; i < 4 && !(await page.evaluate(() => neo.scene.game.state.done)); i++) {
      await idle();
      await page.evaluate(() => {
        const g = neo.scene.game;
        const t = g.state.hintAction();
        kit.tapOn(t.unit ? g.seeds[t.unit] : t.carrier === 'breeze' ? g.bellows : g.critter);
      });
      await page.waitForTimeout(300);
      if (i === 1) {
        await idle();
        if (!(await page.evaluate(() => neo.scene.game.state.done)))
          await screenshot('seed-travelers-3-portrait');
      }
    }
    await finished('seed-travelers');
    assert.deepEqual(await score(), [0, 1], 'level 3 saved 0 misses, 1 hint');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    log(
      'Seed Travelers 1 and 3: level 1 bellows, one Replay, basket 0/0; level 3 portrait a plume-and-critter stay, Show a hint twice (counted once), both seeds delivered 0/1; passed',
    );
  }
  return { seedTravelersPlay };
}
