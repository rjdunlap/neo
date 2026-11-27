import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot }) {
  /**
   * Robot Path's The Star Mazes course, played Just me with a (synthetic) controller: adding and undoing arrows before
   * play is free, pressing play counts every step walked (including a bump), two failed runs glow a hint and mark the
   * run helped, reload resumes with steps kept and unplayed arrows cleared, then a fresh run the bot plays perfectly:
   * 51 steps, one sticker, both badges, the shelf showing par, and Watch the best routes works.
   */
  async function couchRobotPath() {
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
    const [RIGHT, UNDO, PLAY] = [15, 2, 0];
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
    const idle = () => page.waitForFunction(() => !neo.scene.game.running, null, { timeout: 15000 });
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          index: g.index,
          tries: g.boardTries,
          program: g.program.length,
          misses: g.misses,
          hints: g.hints,
        };
      });

    // --- Just me, the puzzle shelf, the course page.
    await enter();
    await page.locator('[data-key="players-one"]').click();
    await page.waitForTimeout(450);
    await click('Puzzle shelf');
    await screenIs('courses');
    assert.equal(
      await page.locator('[data-course="robotpath"] small').innerText(),
      'Not finished yet · par 51',
    );
    await page.locator('[data-course="robotpath"]').click();
    await screenIs('course');
    assert.equal(await page.locator('.couch-sheet h1').innerText(), 'The Star Mazes');
    assert.match(await page.locator('.couch-standing').innerText(), /Par is 51 steps/);
    await click('Play');
    await screenIs('intro');
    assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Robot Path');
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
      /Board 1 of 5 · 0 steps so far · this board's fewest 6 · course minimum 51/,
    );
    await idle();
    await screenshot('couch-robotpath-play');

    // --- Planning arrows and taking them back before Play is free.
    await press(RIGHT);
    assert.equal((await state()).program, 1);
    assert.equal((await state()).tries, 0);
    await press(UNDO);
    assert.equal((await state()).program, 0);
    assert.equal((await state()).tries, 0);

    // --- Playing into a rock counts every step walked (1 step + 1 bump = 2 steps) and saves at once.
    await press(RIGHT);
    await press(RIGHT);
    await press(PLAY);
    await idle();
    let s = await state();
    assert.equal(s.tries, 2);
    assert.equal(s.misses, 1);
    assert.equal((await stored()).courses.robotpath.run.attempts, 2, 'walked steps saved');
    assert.equal((await stored()).courses.robotpath.run.assisted, false);

    // --- A second failed run triggers the hint ring and marks the run helped.
    await press(PLAY);
    await idle();
    s = await state();
    assert.equal(s.tries, 4);
    assert.equal(s.misses, 2);
    assert.equal(s.hints, 1);
    assert.equal((await stored()).courses.robotpath.run.assisted, true);
    await page.waitForFunction(() =>
      /helped/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''),
    );
    await screenshot('couch-robotpath-hint');

    // --- Leave mid-board: reload keeps the walked steps and clears unplayed arrows.
    await page.reload();
    await ready();
    await makePads();
    await enter();
    await click('Puzzle shelf');
    await screenIs('courses');
    await page.locator('[data-course="robotpath"]').click();
    await screenIs('course');
    const run = (await stored()).courses.robotpath.run;
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
      { tries: s.tries, program: s.program },
      { tries: 4, program: 0 },
      'walked steps kept, unplayed arrows cleared',
    );
    await makePads();

    // --- A fresh run, played perfectly by the bot: 51 steps, one sticker, both badges, routes available.
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
    assert.equal(await page.locator('.couch-big b').innerText(), '51', 'fewest steps across all five mazes');
    assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
    assert.match(await page.locator('.couch-new-badges').innerText(), /Fewest steps/);
    await screenshot('couch-robotpath-result');
    const save = await stored();
    assert.equal(save.courses.robotpath.run, null);
    assert.equal(save.courses.robotpath.players[0].clean, 51);
    assert.equal(save.stickers['robot-path'].count, 1, 'one sticker for the run, not one per board');

    // --- Watch the best routes opens on board 1 and switches boards.
    await click('Watch the best routes');
    await screenIs('route');
    assert.match(await page.locator('.couch-chip').innerText(), /Board 1 of 5 · 6 steps/);
    await click('Back to the course page');
    await screenIs('course');

    await click('Puzzle shelf');
    await screenIs('courses');
    assert.equal(
      await page.locator('[data-course="robotpath"] small').innerText(),
      '51 steps · par: the fewest possible',
    );
    assert.equal(
      await page.evaluate(() => JSON.stringify(kit.store.data)),
      childBefore,
      "the child's save is untouched",
    );
    assert.deepEqual(errors, []);
    log(
      'Couch The Star Mazes: shelf, course page, free pre-play undo, walked steps and bump saved across reload, two-miss hint marks run helped, perfect bot run (51 steps, one sticker, both badges), Watch the best routes passed',
    );
  }

  return { couchRobotPath };
}
