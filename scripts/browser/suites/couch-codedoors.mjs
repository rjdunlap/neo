import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot }) {
  /**
   * Secret Code's Code Doors course, played Just me with a (synthetic) controller: a turn of the key counts at once and is
   * saved, a reload resumes the door with the try kept, then a fresh run the reasoning bot plays: exactly par (the reference
   * solver is the bot's own rule), one sticker, both badges, and the shelf and screens saying par, never "fewest possible".
   */
  async function couchCodeDoors() {
    await page.addInitScript(() => {
      window.couchPads = [];
      Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true });
    });
    await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
    await page.reload();
    await ready();
    const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
    const makePads = () =>
      page.evaluate(() => {
        window.couchPads = [0, 1].map((index) => ({
          index,
          id: `Synthetic standard ${index}`,
          connected: true,
          mapping: 'standard',
          axes: [0, 0],
          buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
        }));
      });
    const press = async (button) => {
      await page.evaluate((button) => {
        couchPads[0].buttons[button] = { pressed: true, value: 1 };
      }, button);
      await page.waitForTimeout(100);
      await page.evaluate((button) => {
        couchPads[0].buttons[button] = { pressed: false, value: 0 };
      }, button);
      await page.waitForTimeout(100);
    };
    const BOTTOM = 0;
    const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
    const screenIs = async (name) => {
      await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name);
      await page.waitForTimeout(450);
    };
    const enter = async () => {
      await chooserEnter();
      await scene('CouchScene');
      await page.waitForTimeout(450);
    };
    const click = async (name) => {
      await page.getByRole('button', { name, exact: true }).first().click();
      await page.waitForTimeout(450);
    };
    const idle = () => page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 15000 });
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          index: g.index,
          tries: g.tries,
          hints: g.hints,
          slots: g.plan.slots,
          colors: g.plan.colors,
          history: g.history.length,
          guess: g.guess.slice(),
        };
      });

    // --- Just me, the puzzle shelf, the course page.
    await enter();
    await page.locator('[data-key="players-one"]').click();
    await page.waitForTimeout(450);
    await click('Puzzle shelf');
    await screenIs('courses');
    assert.equal(
      await page.locator('[data-course="codedoors"] small').innerText(),
      'Not finished yet · par 16',
    );
    await page.locator('[data-course="codedoors"]').click();
    await screenIs('course');
    assert.equal(await page.locator('.couch-sheet h1').innerText(), 'The Code Doors');
    assert.match(
      await page.locator('.couch-sheet').innerText(),
      /Par for the whole course is 16 tries, a careful solver's count: it can be beaten/,
    );
    assert.doesNotMatch(
      await page.locator('.couch-sheet').innerText(),
      /fewest tries the whole course can take/,
    );
    assert.match(await page.locator('.couch-standing').innerText(), /Par is 16 tries/);
    await click('Play');
    await screenIs('intro');
    assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Secret Code');
    await click('Play');
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(700);
    await makePads();
    await page.waitForTimeout(150);
    await page.waitForFunction(() =>
      /Door 1 of 5/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''),
    );
    assert.match(
      await page.locator('.couch-hud-stats').innerText(),
      /Door 1 of 5 · 0 tries so far · this door's par 2 · course par 16/,
    );
    await idle();
    let s = await state();
    assert.deepEqual(
      { index: s.index, tries: s.tries, slots: s.slots, colors: s.colors },
      { index: 0, tries: 0, slots: 3, colors: 5 },
    );
    await screenshot('couch-codedoors-play');

    // --- Three stones and a turn of the key: one try, counted and saved at once.
    for (let i = 0; i < 3; i++) await press(BOTTOM);
    assert.deepEqual((await state()).guess, [0, 0, 0]);
    await press(BOTTOM);
    await page.waitForFunction(() => neo.scene.game.history.length === 1);
    await idle();
    s = await state();
    assert.equal(s.tries, 1);
    assert.equal((await stored()).courses.codedoors.run.attempts, 1, 'the try is saved at once');
    await page.waitForFunction(() =>
      /1 try so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''),
    );

    // --- Leave in the middle of a door: a reload starts it again and keeps the try.
    await page.reload();
    await ready();
    await makePads();
    await enter();
    await click('Puzzle shelf');
    await screenIs('courses');
    await page.locator('[data-course="codedoors"]').click();
    await screenIs('course');
    const run = (await stored()).courses.codedoors.run;
    assert.deepEqual(
      { slides: run.slides, attempts: run.attempts, assisted: run.assisted },
      { slides: [], attempts: 1, assisted: false },
    );
    await click('Resume · door 1 of 5');
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(700);
    await idle();
    s = await state();
    assert.deepEqual(
      { tries: s.tries, history: s.history },
      { tries: 1, history: 0 },
      'the try spent before the reload still counts',
    );
    await makePads();

    // --- A fresh run, played by the reasoning bot: exactly par, door after door.
    await press(9);
    await screenIs('pause');
    await click('Back to the course page');
    await screenIs('course');
    await click('Start a fresh run');
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(700);
    assert.deepEqual({ tries: (await state()).tries, hints: (await state()).hints }, { tries: 0, hints: 0 });
    const plans = await page.evaluate(async () => {
      const g = neo.scene.game;
      let last = performance.now();
      const start = last;
      const seen = [];
      while (neo.scene.game === g && !g.finished && performance.now() - start < 300000) {
        await new Promise((r) => requestAnimationFrame(r));
        const now = performance.now(),
          dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const tag = `${g.index}:${g.plan.slots}/${g.plan.colors}/${g.plan.repeats}/${g.tray.filter((t) => t.visible).length}`;
        if (seen.at(-1) !== tag) seen.push(tag);
        g.control(g.autoplay(dt), dt);
      }
      if (!g.finished) throw new Error('the bot did not finish the course');
      return seen;
    });
    assert.ok(
      plans.includes('2:4/5/false/5') && plans.includes('4:3/4/true/4'),
      `each door plays under its own plan, the fifth stone hidden on the four-color door: ${plans.join(' ')}`,
    );
    await screenIs('course');
    assert.equal(await page.locator('.couch-big b').innerText(), '16', 'par, door after door');
    assert.match(await page.locator('.couch-outcome-line').innerText(), /Course par 16\. Right on par!/);
    assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
    assert.match(await page.locator('.couch-new-badges').innerText(), /On par/);
    await screenshot('couch-codedoors-result');
    const save = await stored();
    assert.equal(save.courses.codedoors.run, null);
    assert.equal(save.courses.codedoors.players[0].clean, 16);
    assert.equal(save.stickers['secret-code'].count, 1, 'one sticker for the run, not one per door');
    await click('Puzzle shelf');
    await screenIs('courses');
    assert.equal(
      await page.locator('[data-course="codedoors"] small').innerText(),
      '16 tries · right on par (16)',
    );
    assert.equal(
      await page.evaluate(() => JSON.stringify(kit.store.data)),
      childBefore,
      "the child's save is untouched",
    );
    assert.deepEqual(errors, []);
    log(
      "Couch Code Doors: shelf and course page say par, a counted and saved try, reload resume with the try kept, a bot run at exactly par under each door's own plan with one sticker and both badges passed",
    );
  }

  return { couchCodeDoors };
}
