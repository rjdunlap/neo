import assert from 'node:assert/strict';

export function createSuite({
  page,
  log,
  ready,
  scene,
  tap,
  screenshot,
  launch,
  finished,
  conductorSign,
  conductorChange,
  conductorRevise,
}) {
  /**
   * Little Conductor levels 1–2, 4 (soft or loud, the level 2 flow on a small and a big drum) and 5 (two dials: pace and strength, two of four ways heard): an early Done, a change inside a beat, the heard gate, the bow and one sticker; level 2 in portrait.
   * Level 6 (invite a friend): an early Done, the first friend, a second on the beat, the gate, the bow and one sticker. Level 3 (portrait): Check with no pick, a wrong Check, a requested hint, both halves matched. Level 7 (one change): Check with nothing set, a wrong strength, a hint, both halves matched. Level 8 (revise): both prepared versions, Undo, revision heard, one sticker. `CONDUCTOR_LEVELS=3` picks levels.
   */
  async function conductor() {
    for (const level of (process.env.CONDUCTOR_LEVELS || '1,2,3,4,5,6,7,8').split(',').map(Number)) {
      if (level >= 2) await page.setViewportSize({ width: 768, height: 1024 });
      if (level === 3) {
        await conductorSign();
        continue;
      }
      if (level === 7) {
        await conductorChange();
        continue;
      }
      if (level === 8) {
        await conductorRevise();
        continue;
      }
      await launch('little-conductor', level);
      await page.waitForFunction(() => neo.scene.game.ready, null, { timeout: 20000 });
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      if (level === 6) {
        // Level 6, invite a friend: Done is dim at first, the first tap starts the band, a second friend waits for the beat, two groups heard open the gate.
        const stage = () =>
          page.evaluate(() => {
            const g = neo.scene.game;
            const s = g.score;
            return {
              cast: s.cast,
              pending: s.pendingCast,
              heard: s.castHeard,
              ever: Object.keys(s.castEver).length,
              performing: g.performing,
              alpha: g.done.alpha,
            };
          });
        await tap('neo.scene.game.done');
        assert.equal((await stage()).performing, false);
        await tap('neo.scene.game.spots[0]');
        assert.equal((await stage()).cast.tune, true);
        await page.waitForFunction(() => neo.scene.game.score.castHeard >= 4, null, { timeout: 20000 });
        assert.ok((await stage()).alpha < 1, 'level 6 waits for a second group');
        await tap('neo.scene.game.spots[2]');
        const waiting = await stage();
        assert.equal(waiting.pending.beat, true);
        assert.equal(waiting.cast.beat, false);
        await page.waitForFunction(
          () => {
            const s = neo.scene.game.score;
            return s.cast.beat && !s.pendingCast.beat && s.castHeard >= 4;
          },
          null,
          { timeout: 20000 },
        );
        assert.equal((await stage()).alpha, 1);
        await screenshot('little-conductor-6-portrait');
        await tap('neo.scene.game.done');
        assert.equal((await stage()).performing, true);
        await finished('little-conductor');
        assert.deepEqual(
          await page.evaluate(() => {
            const r = kit.store.stats('little-conductor').history.at(-1);
            return [r.level, r.misses, r.hints, kit.store.data.stickers.length];
          }),
          [6, 0, 0, before + 1],
        );
        log(
          'Little Conductor 6: first friend in, a second on the beat, two groups heard, the gate, the bow and one sticker passed',
        );
        continue;
      }
      if (level === 5) {
        // Level 5, two dials: an early Done, one way heard whole is not enough, a strength change waits for the beat, the second way opens the gate.
        const dials = () =>
          page.evaluate(() => {
            const g = neo.scene.game;
            const s = g.score;
            return {
              pace: s.pace,
              strength: s.strength,
              pending: s.pendingStrength,
              performing: g.performing,
              alpha: g.done.alpha,
            };
          });
        const wholeAt = (pace, strength) =>
          page.waitForFunction(
            ({ pace, strength }) => {
              const s = neo.scene.game.score;
              return (
                s.pace === pace &&
                s.strength === strength &&
                !s.pending &&
                !s.pendingStrength &&
                s.comboHeard[`${pace}-${strength}`] >= 4
              );
            },
            { pace, strength },
            { timeout: 20000 },
          );
        await tap('neo.scene.game.done');
        assert.equal((await dials()).performing, false);
        await tap('neo.scene.game.pads.rabbit');
        await wholeAt('rabbit', 'strong');
        assert.ok((await dials()).alpha < 1, 'level 5 waits for a second way');
        await tap('neo.scene.game.strengthPads.gentle');
        const waiting = await dials();
        assert.equal(waiting.pending, 'gentle');
        assert.equal(waiting.strength, 'strong');
        await wholeAt('rabbit', 'gentle');
        assert.equal((await dials()).alpha, 1);
        await screenshot('little-conductor-5-portrait');
        await tap('neo.scene.game.done');
        assert.equal((await dials()).performing, true);
        await finished('little-conductor');
        assert.deepEqual(
          await page.evaluate(() => {
            const r = kit.store.stats('little-conductor').history.at(-1);
            return [r.level, r.misses, r.hints, kit.store.data.stickers.length];
          }),
          [5, 0, 0, before + 1],
        );
        log('Little Conductor 5: two dials, two ways heard, the gate, the bow and one sticker passed');
        continue;
      }
      const state = () =>
        page.evaluate(() => {
          const g = neo.scene.game;
          return {
            pace: g.score.pace,
            pending: g.score.pending,
            heard: g.score.heard,
            ever: g.score.heardEver,
            performing: g.performing,
            alpha: g.done.alpha,
            blink: g.blink,
          };
        });
      const heardAt = (pace, n) =>
        page.waitForFunction(
          ({ pace, n }) => {
            const s = neo.scene.game.score;
            return s.pace === pace && !s.pending && s.heard[pace] >= n;
          },
          { pace, n },
          { timeout: 15000 },
        );
      // Done before any tap: nothing happens but a reminder.
      await tap('neo.scene.game.done');
      assert.equal((await state()).performing, false);
      await tap('neo.scene.game.pads.rabbit');
      await heardAt('rabbit', 2);
      // A change inside a beat waits for the next one and closes the gate at once.
      await tap('neo.scene.game.pads.turtle');
      let s = await state();
      assert.equal(s.pending, 'turtle');
      assert.equal(s.pace, 'rabbit');
      assert.ok(s.alpha < 1);
      await heardAt('turtle', 1);
      // An early Done: the unheard marks blink, nothing is counted and the band plays on.
      await tap('neo.scene.game.done');
      s = await state();
      assert.equal(s.performing, false);
      assert.ok(s.blink > 0);
      await heardAt('turtle', 4);
      if (level === 2 || level === 4) {
        assert.ok((await state()).alpha < 1, `level ${level} waits for the other way too`);
        await tap('neo.scene.game.pads.rabbit');
        await heardAt('rabbit', 4);
        s = await state();
        assert.deepEqual(s.ever, { turtle: true, rabbit: true });
        await screenshot(`little-conductor-${level}-portrait`);
      }
      assert.equal((await state()).alpha, 1);
      await tap('neo.scene.game.done');
      assert.equal((await state()).performing, true);
      await finished('little-conductor');
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('little-conductor').history.at(-1);
          return [r.level, r.misses, r.hints, kit.store.data.stickers.length];
        }),
        [level, 0, 0, before + 1],
      );
      log(
        `Little Conductor ${level}: early Done, a change inside a beat, the heard gate, the bow and one sticker passed`,
      );
    }
    await page.setViewportSize({ width: 1024, height: 768 });
  }

  return { conductor };
}
