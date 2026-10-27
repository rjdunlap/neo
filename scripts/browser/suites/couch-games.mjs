import { selectNames } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot, finished, couchGuide }) {
/**
 * Every game in the couch catalog: its intro explains it (name, goal, controller diagram, a demo whose bot presses
 * something), and its bot then plays a real round through control() at the level a trip first schedules.
 */
async function couchGames() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const ids = await page.evaluate(async () => (await import('/src/couch/party.ts')).COUCH_IDS.slice());
  assert.ok(ids.length >= 9, 'the catalog has grown past the starting three');
  // COUCH_ONLY=peg-garden,bumper-garden plays just those games (a comma-separated list of ids).
  const picked = selectNames(process.env.COUCH_ONLY, ids, 'COUCH_ONLY');
  for (const id of picked) {
    // Every tier unlocked, a fresh together trip with this game chosen, nothing explained yet.
    await page.evaluate((id) => {
      localStorage.setItem('neo.couch.v1', JSON.stringify({ version: 2, trips: 30, stickers: {}, seen: [], party: { seed: 4242, mode: 'together', reroll: 0, turn: null, selected: id, rounds: [] } }));
    }, id);
    await page.reload(); await ready();
    await chooserEnter();
    await page.waitForFunction(() => neo.scene.screen === 'menu');
    await page.waitForTimeout(450);
    await page.getByRole('button', { name: /^Resume /, exact: false }).click();
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'intro');
    const name = await page.locator('.couch-how-screen h1').innerText();
    assert.equal(name, await page.evaluate(async (id) => (await import('/src/games/registry.ts')).couchGameById(id).name, id));
    assert.equal(await page.locator('.couch-how-screen svg.pad').count(), 1, `${id}: controller diagram`);
    assert.ok(await page.locator('.couch-rows li').count() >= 1, `${id}: control rows`);
    // A typing game's bot presses letter keys, which the arrows-Enter-Esc diagram does not show: its demo has to type instead.
    const typingGame = await page.evaluate(async (id) => !!(await import('/src/games/registry.ts')).couchGameById(id).typing, id);
    if (typingGame) {
      await page.waitForFunction(() => neo.scene.demo?.game?.typist?.presses > 0, null, { timeout: 30000 });
      await page.waitForFunction(() => document.querySelector('.typing-key.on'), null, { timeout: 10000 });
    }
    else {
      await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
      assert.ok(await page.locator('.pad .on').count() >= 1, `${id}: the diagram lights with the bot`);
    }
    assert.equal(await page.evaluate(() => document.querySelector('.couch-how-screen').scrollHeight <= document.querySelector('.couch-how-screen').clientHeight + 1), true, `${id}: the intro fits the screen`);
    await screenshot(`couch-catalog-${id}`);
    await page.waitForTimeout(450);
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(450);
    await page.evaluate(async () => {
      const g = neo.scene.game; let last = performance.now(); const start = last;
      while (neo.scene.game === g && !g.finished && performance.now() - start < 150000) {
        await new Promise(r => requestAnimationFrame(r));
        const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
        g.control(g.autoplay(dt), dt);
      }
      if (!g.finished) throw new Error('the bot did not finish its round');
    });
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'menu', null, { timeout: 20000 });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
    assert.equal(saved.party.rounds.length, 1, `${id}: one stop settled`);
    assert.equal(saved.party.rounds[0].id, id);
    assert.ok(saved.seen.includes(id), `${id}: marked explained`);
    assert.equal(Object.values(saved.stickers).reduce((n, s) => n + s.count, 0), 1);
    assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, `${id}: the child's save is untouched`);
    if (typingGame) {
      for (const level of [4, 5, 6]) {
        await page.evaluate(async ({ id, level }) => {
          // This one filtered play schedules the new level through the real couch shell.
          const info = (await import('/src/couch/catalog.ts')).COUCH_INFO[id];
          info.level = () => level;
          neo.scene.couch.data.party.selected = id; neo.scene.couch.save(); neo.scene.go(true);
        }, { id, level });
        await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
        await page.waitForTimeout(450);
        assert.equal(await page.evaluate(() => neo.scene.game.pondLevel), level);
        if (level === 4) {
          const wanted = await page.evaluate(() => neo.scene.game.typist.wanted);
          await page.keyboard.press(wanted.toLowerCase(), { delay: 120 });
          assert.equal(await page.evaluate(() => neo.scene.game.typist.misses), 0, 'first wrong capital is free');
          await page.keyboard.press('Shift', { delay: 120 });
          await page.keyboard.press(wanted.toLowerCase(), { delay: 120 });
          assert.equal(await page.evaluate(() => neo.scene.game.typist.at), 1, 'sticky Shift reaches game through real input');
        }
        if (level === 5) {
          await page.keyboard.press('q', { delay: 120 });
          assert.equal(await page.evaluate(() => neo.scene.game.typist.buffer), 'q', 'wrong key appears');
          await page.keyboard.press('Backspace', { delay: 120 });
          assert.equal(await page.evaluate(() => neo.scene.game.typist.buffer), '', 'Backspace removes it');
          assert.equal(await page.evaluate(() => neo.scene.game.typist.misses), 0);
        }
        if (level === 6) {
          const before = await page.evaluate(() => ({ buffer: neo.scene.game.typist.buffer, caret: neo.scene.game.typist.caret }));
          await page.keyboard.press('ArrowLeft', { delay: 120 });
          assert.equal(await page.evaluate(() => neo.scene.game.typist.caret), before.caret - 1);
          await page.keyboard.press('Escape', { delay: 120 });
          await page.getByRole('button', { name: 'Show the key: on', exact: true }).click();
          await page.getByRole('button', { name: 'Resume round', exact: true }).click();
          assert.equal(await page.evaluate(() => neo.scene.game.cap.visible), false);
          assert.equal(await page.evaluate(() => neo.scene.game.typist.buffer), before.buffer, 'coach preserves editor');
          await page.keyboard.press('Escape', { delay: 120 });
          await page.getByRole('button', { name: 'Glow the key', exact: true }).click();
          assert.equal(await page.evaluate(() => neo.scene.game.typist.hints), 1);
          await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(200);
          assert.equal(await page.locator('.couch-game-help').count(), 0, 'typing coach is clear of the generic reminder');
          await screenshot('pond-typing-6-portrait');
          await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(200);
          await screenshot('pond-typing-6-landscape');
          const repair = await page.evaluate(() => {
            const t = neo.scene.game.typist;
            return { at: t.mismatch, caret: t.caret, key: t.text[t.mismatch] };
          });
          for (let i = repair.at; i < repair.caret; i++) await page.keyboard.press('ArrowLeft', { delay: 120 });
          await page.keyboard.press(repair.key, { delay: 120 });
          await page.keyboard.press('ArrowRight', { delay: 120 });
          await page.keyboard.press('Backspace', { delay: 120 });
          assert.equal(await page.evaluate(() => neo.scene.game.typist.bubble), 1, 'alternate mend completes on Backspace');
        }
        await page.evaluate(async () => {
          const g = neo.scene.game;
          const start = performance.now();
          while (!g.finished && performance.now() - start < 60000) {
            await new Promise(r => requestAnimationFrame(r)); g.control(g.autoplay(0.1), 0.1);
          }
          if (!g.finished) throw new Error('new typing level bot did not finish');
        });
        await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'menu', null, { timeout: 20000 });
        await page.setViewportSize({ width: 1024, height: 768 });
        log(`Pond Typing ${level}: real keys, free edits, coach/hint and bot completion passed`);
      }
      await page.evaluate(() => neo.scene.go('typing'));
      await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'course');
      await page.evaluate(() => neo.scene.launchCourse('typing', 0));
      await page.waitForFunction(() => neo.scene.screen === 'game');
      await page.evaluate(async () => {
        const g = neo.scene.game, start = performance.now(), modes = new Set();
        while (!g.finished && performance.now() - start < 90000) {
          await new Promise(r => requestAnimationFrame(r));
          modes.add(g.pondLevel); g.control(g.autoplay(0.1), 0.1);
        }
        if (!g.finished || ![1,3,4,5,6].every(l => modes.has(l))) throw new Error('typing course did not reach every interaction');
      });
      await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'course', null, { timeout: 20000 });
      const course = await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).courses.typing);
      assert.equal(course.version, 2); assert.equal(course.run, null); assert.equal(course.players[0].runs, 1);
      assert.ok(course.players[0].clean >= 63);
      log('Pond Typing course v2: all six ponds, one finish and course record passed');

    }
    log(`Couch catalog: ${id}: intro, controller lighting, bot round and save passed`);
  }
  assert.deepEqual(errors, []);
  if (process.env.COUCH_ONLY === undefined) await couchGuide(ids);
}

return { couchGames };
}
