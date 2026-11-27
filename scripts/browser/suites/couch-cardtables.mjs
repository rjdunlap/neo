import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot }) {
  /**
   * Memory Match's The Card Tables course, played Just me with a (synthetic) controller: every card turned over is a
   * flip and is saved at once, reload resumes with flips kept and cards face down, then a fresh run the remembering
   * bot plays: exactly par, one sticker, both badges, the shelf showing par, and Watch the best routes works.
   */
  async function couchCardTables() {
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
    const [FLIP] = [0];
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
    const unlocked = () => page.waitForFunction(() => !neo.scene.game.locked, null, { timeout: 15000 });

    // --- Just me, the puzzle shelf, the course page.
    await enter();
    await page.locator('[data-key="players-one"]').click();
    await page.waitForTimeout(450);
    await click('Puzzle shelf');
    await screenIs('courses');
    const shelfText = await page.locator('[data-course="cardtables"] small').innerText();
    const par = Number(/^Not finished yet · par (\d+)$/.exec(shelfText)?.[1]);
    assert.ok(par > 40, `par ${par} is more than the least possible 2 flips a pair (40)`);
    await page.locator('[data-course="cardtables"]').click();
    await screenIs('course');
    assert.equal(await page.locator('.couch-sheet h1').innerText(), 'The Card Tables');
    assert.match(await page.locator('.couch-standing').innerText(), new RegExp(`Par is ${par} flips`));
    await click('Play');
    await screenIs('intro');
    assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Memory Match');
    await click('Play');
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(700);
    await makePads();
    await page.waitForFunction(() =>
      /Table 1 of 4/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''),
    );
    assert.match(await page.locator('.couch-hud-stats').innerText(), /Table 1 of 4 · 0 flips so far/);
    await screenshot('couch-cardtables-play');

    // --- Turning a card over counts a flip and saves at once; pressing the card already turned is free.
    await press(FLIP);
    await unlocked();
    assert.equal(await page.evaluate(() => neo.scene.game.boardFlips), 1);
    assert.equal((await stored()).courses.cardtables.run.attempts, 1, 'flip saved');
    await press(FLIP);
    assert.equal(await page.evaluate(() => neo.scene.game.boardFlips), 1, 'the card already turned is free');
    assert.equal(await page.evaluate(() => neo.scene.game.cards.length), 6, 'table 1 has three pairs');

    // --- Leave mid-table: reload keeps the flips and turns the cards face down again.
    await page.reload();
    await ready();
    await makePads();
    await enter();
    await click('Puzzle shelf');
    await screenIs('courses');
    await page.locator('[data-course="cardtables"]').click();
    await screenIs('course');
    assert.equal((await stored()).courses.cardtables.run.attempts, 1);
    await click('Resume · table 1 of 4');
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(700);
    assert.equal(await page.evaluate(() => neo.scene.game.boardFlips), 1, 'flip kept');
    assert.equal(
      await page.evaluate(() => neo.scene.game.views.filter((v) => v.front.visible).length),
      0,
      'cards face down',
    );
    await makePads();

    // --- A fresh run, played by the remembering bot: exactly par, one sticker, both badges, routes available.
    await press(9);
    await screenIs('pause');
    await click('Back to the course page');
    await screenIs('course');
    await click('Start a fresh run');
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(700);
    assert.equal(await page.evaluate(() => neo.scene.game.boardFlips), 0);
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
    assert.equal(await page.locator('.couch-big b').innerText(), String(par), 'the bot plays exactly par');
    assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
    assert.match(await page.locator('.couch-new-badges').innerText(), /On par/);
    await screenshot('couch-cardtables-result');
    const save = await stored();
    assert.equal(save.courses.cardtables.run, null);
    assert.equal(save.courses.cardtables.players[0].clean, par);
    assert.equal(save.stickers['memory-match'].count, 1, 'one sticker for the run, not one per table');

    // --- Watch the best routes opens on table 1.
    await click('Watch the best routes');
    await screenIs('route');
    assert.match(await page.locator('.couch-chip').innerText(), /Table 1 of 4/);
    await click('Back to the course page');
    await screenIs('course');

    assert.equal(
      await page.evaluate(() => JSON.stringify(kit.store.data)),
      childBefore,
      "the child's save is untouched",
    );
    assert.deepEqual(errors, []);
    log(
      'Couch The Card Tables: shelf, course page, flips saved and kept across reload, free re-press of the turned card, remembering-bot run (par, one sticker, both badges), Watch the best routes passed',
    );
  }

  return { couchCardTables };
}
