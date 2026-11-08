import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot }) {
  /**
   * Light Lab's Sunbeam Run course, played Just me with a (synthetic) controller: a mirror turn counts at once, turning it
   * back counts again, a shine that misses counts one more, two missed shines glow a mirror and mark the run helped, a
   * reload resumes the board with the tries kept, then a fresh run the bot plays perfectly: exactly the fewest turns, one
   * sticker, both badges, and the shelf showing par.
   */
  async function couchSunbeams() {
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
    const [SHINE, BOTTOM] = [2, 0];
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
          taps: g.taps,
          missed: g.shinesMissed,
          hints: g.hints,
          hinted: g.hinted,
          needed: g.needed,
          tilts: g.tilts.slice(),
          start: g.puzzle.start.slice(),
          sunDir: g.puzzle.sunDir,
        };
      });

    // --- Just me, the puzzle shelf, the course page.
    await enter();
    await page.locator('[data-key="players-one"]').click();
    await page.waitForTimeout(450);
    await click('Puzzle shelf');
    await screenIs('courses');
    assert.equal(
      await page.locator('[data-course="sunbeams"] small').innerText(),
      'Not finished yet · par 15',
    );
    await page.locator('[data-course="sunbeams"]').click();
    await screenIs('course');
    assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Sunbeam Run');
    assert.match(await page.locator('.couch-standing').innerText(), /Par is 15 turns/);
    await click('Play');
    await screenIs('intro');
    assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Light Lab');
    await click('Play');
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(700);
    await makePads();
    await page.waitForTimeout(150);
    await page.waitForFunction(() =>
      /Board 1 of 5/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''),
    );
    assert.match(
      await page.locator('.couch-hud-stats').innerText(),
      /Board 1 of 5 · 0 turns so far · this board's fewest 2 · course minimum 15/,
    );
    await idle();
    let s = await state();
    assert.deepEqual({ index: s.index, tries: s.tries, needed: s.needed }, { index: 0, tries: 0, needed: 2 });
    await screenshot('couch-sunbeams-play');

    // --- A turn counts at once; turning it back counts again.
    await press(BOTTOM);
    s = await state();
    assert.equal(s.tries, 1);
    assert.notDeepEqual(s.tilts, s.start);
    assert.equal((await stored()).courses.sunbeams.run.attempts, 1, 'the turn is saved at once');
    await press(BOTTOM);
    s = await state();
    assert.deepEqual({ tries: s.tries, tilts: s.tilts }, { tries: 2, tilts: s.start });

    // --- Two missed shines: each counts one, and the second glows a mirror and marks the run helped.
    await press(SHINE);
    await page.waitForFunction(() => neo.scene.game.shinesMissed === 1);
    await idle();
    assert.equal((await state()).tries, 3);
    assert.equal((await stored()).courses.sunbeams.run.assisted, false);
    await press(SHINE);
    await page.waitForFunction(() => neo.scene.game.shinesMissed === 2);
    await idle();
    s = await state();
    assert.equal(s.tries, 4);
    assert.ok(s.hinted >= 0, 'a mirror glows');
    assert.equal(s.hints, 1);
    assert.equal((await stored()).courses.sunbeams.run.assisted, true);
    await page.waitForFunction(() =>
      /helped/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''),
    );
    await screenshot('couch-sunbeams-hint');

    // --- Leave in the middle of a board: a reload puts the mirrors back, keeps the tries and the help.
    await page.reload();
    await ready();
    await makePads();
    await enter();
    await click('Puzzle shelf');
    await screenIs('courses');
    await page.locator('[data-course="sunbeams"]').click();
    await screenIs('course');
    const run = (await stored()).courses.sunbeams.run;
    assert.deepEqual(
      { slides: run.slides, attempts: run.attempts, assisted: run.assisted },
      { slides: [], attempts: 4, assisted: true },
    );
    await click('Resume · board 1 of 5');
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(700);
    await idle();
    s = await state();
    assert.deepEqual(
      { tries: s.tries, tilts: s.tilts },
      { tries: 4, tilts: s.start },
      'the tries spent before the reload still count',
    );
    await makePads();

    // --- A fresh run, played perfectly by the bot: exactly the fewest turns.
    await press(9);
    await screenIs('pause');
    await click('Back to the course page');
    await screenIs('course');
    await click('Start a fresh run');
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(700);
    assert.deepEqual({ tries: (await state()).tries, hints: (await state()).hints }, { tries: 0, hints: 0 });
    await page.evaluate(async () => {
      const g = neo.scene.game;
      let last = performance.now();
      const start = last;
      while (neo.scene.game === g && !g.finished && performance.now() - start < 300000) {
        await new Promise((r) => requestAnimationFrame(r));
        const now = performance.now(),
          dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        g.control(g.autoplay(dt), dt);
      }
      if (!g.finished) throw new Error('the bot did not finish the course');
    });
    await screenIs('course');
    assert.equal(await page.locator('.couch-big b').innerText(), '15', 'the fewest turns, board after board');
    assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
    assert.match(await page.locator('.couch-new-badges').innerText(), /Fewest turns/);
    await screenshot('couch-sunbeams-result');
    const save = await stored();
    assert.equal(save.courses.sunbeams.run, null);
    assert.equal(save.courses.sunbeams.players[0].clean, 15);
    assert.equal(save.stickers['light-lab'].count, 1, 'one sticker for the run, not one per board');
    await click('Puzzle shelf');
    await screenIs('courses');
    assert.equal(
      await page.locator('[data-course="sunbeams"] small').innerText(),
      '15 turns · par: the fewest possible',
    );
    assert.equal(
      await page.evaluate(() => JSON.stringify(kit.store.data)),
      childBefore,
      "the child's save is untouched",
    );
    assert.deepEqual(errors, []);
    log(
      'Couch Sunbeam Run: shelf, course page, a counted turn and turn-back, two missed shines counted with the glow and the run helped, reload resume, a perfect bot run with one sticker and both badges passed',
    );
  }

  return { couchSunbeams };
}
