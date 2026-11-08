import assert from 'node:assert/strict';

export function createSuite({ page, log, screenshot, launch, finished }) {
  /**
   * Hat Band level 1 (landscape): an early Done, a drag onto a friend, tap-select then tap-place, the heard gate, the bow
   * and one sticker. Level 3 (portrait): a replace, both spotlights, the gate and the bow, with a portrait screenshot.
   */
  async function hatBandPlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        const b = g.band;
        return {
          worn: b.worn,
          sounding: b.sounding.worn,
          solo: b.solo,
          heard: b.heardMix,
          alone: b.heardAlone,
          mixes: b.mixes,
          performing: g.performing,
          alpha: g.done.alpha,
          selected: g.selected,
          rack: g.round.rack,
        };
      });
    const tap = async (expr) => {
      await page.evaluate((expr) => kit.tapOn(eval(expr)), expr);
      await page.waitForTimeout(250);
    };
    const settled = (n = 4) =>
      page.waitForFunction(
        (n) => {
          const b = neo.scene.game.band;
          return (
            b.heardMix >= n &&
            b.worn[0] === b.sounding.worn[0] &&
            b.worn[1] === b.sounding.worn[1] &&
            b.solo === b.sounding.solo
          );
        },
        n,
        { timeout: 15000 },
      );
    const hatOf = (rack, role) =>
      rack.find((h) => (role === 'drum' ? ['steady', 'skippy'] : ['cuckoo', 'rain']).includes(h));
    const record = () =>
      page.evaluate(() => {
        const r = kit.store.stats('hat-band').history.at(-1);
        return [r.level, r.misses, r.hints, kit.store.data.stickers.length];
      });
    // HAT_LEVELS=1,4 plays only those levels (level 4 is Build a song).
    const only = (process.env.HAT_LEVELS ?? '').split(',').filter(Boolean).map(Number);
    const wants = (level) => only.length === 0 || only.includes(level);
    let before = 0;
    let s;

    if (wants(1)) {
      await launch('hat-band', 1);
      await page.waitForFunction(() => neo.scene.game.ready, null, { timeout: 20000 });
      before = await page.evaluate(() => kit.store.data.stickers.length);
      s = await state();
      // Done on an empty stage: a reminder, nothing counted.
      await tap('neo.scene.game.done');
      assert.equal((await state()).performing, false);
      const drum = hatOf(s.rack, 'drum'),
        tune = hatOf(s.rack, 'tune');
      // Drag the drum hat onto the first friend: worn at once, heard at the next beat.
      await page.evaluate(async (id) => {
        const g = neo.scene.game;
        await kit.dragTo(g.hats.get(id), g.spots[0].toGlobal({ x: 80, y: 200 }));
      }, drum);
      await page.waitForTimeout(300);
      assert.equal((await state()).worn[0], drum);
      await settled();
      // Tap the tune hat, then tap the second friend.
      await tap(`neo.scene.game.hats.get('${tune}')`);
      assert.equal((await state()).selected, tune);
      await page.evaluate(() => {
        const g = neo.scene.game;
        kit.tapOn(g.spots[1], 80, 200);
      });
      await page.waitForTimeout(250);
      s = await state();
      assert.deepEqual(s.worn, [drum, tune]);
      // An early Done while the new part is still joining: nothing happens but a reminder.
      await tap('neo.scene.game.done');
      assert.equal((await state()).performing, false);
      await settled();
      await screenshot('hat-band-1-landscape');
      assert.equal((await state()).alpha, 1);
      await tap('neo.scene.game.done');
      assert.equal((await state()).performing, true);
      await finished('hat-band');
      assert.deepEqual(await record(), [1, 0, 0, before + 1]);
      log('Hat Band 1: early Done, drag, tap-then-tap, the heard gate, the bow and one sticker passed');
    }

    if (wants(3)) {
      await page.setViewportSize({ width: 768, height: 1024 });
      await launch('hat-band', 3);
      await page.waitForFunction(() => neo.scene.game.ready, null, { timeout: 20000 });
      before = await page.evaluate(() => kit.store.data.stickers.length);
      s = await state();
      const drums = s.rack.filter((h) => ['steady', 'skippy'].includes(h));
      const tunes = s.rack.filter((h) => ['cuckoo', 'rain'].includes(h));
      const place = async (hat, friend) => {
        await tap(`neo.scene.game.hats.get('${hat}')`);
        await page.evaluate((f) => kit.tapOn(neo.scene.game.spots[f], 80, 200), friend);
        await page.waitForTimeout(250);
      };
      await place(drums[0], 0);
      await place(tunes[0], 1);
      // Replace: the other tune hat goes on the second friend and the first one returns to the rack.
      await place(tunes[1], 1);
      s = await state();
      assert.deepEqual(s.worn, [drums[0], tunes[1]]);
      await settled();
      assert.ok((await state()).alpha < 1, 'level 3 waits for each friend alone');
      // Each friend alone with the star, then together.
      await tap('neo.scene.game.stars[0]');
      assert.equal((await state()).solo, 0);
      await settled();
      await tap('neo.scene.game.stars[1]');
      assert.equal((await state()).solo, 1);
      await settled();
      await screenshot('hat-band-3-portrait');
      await tap('neo.scene.game.stars[1]');
      assert.equal((await state()).solo, null);
      await settled();
      s = await state();
      assert.deepEqual([...s.alone].sort(), [drums[0], tunes[1]].sort());
      assert.equal(s.alpha, 1);
      await tap('neo.scene.game.done');
      await finished('hat-band');
      assert.deepEqual(await record(), [3, 0, 0, before + 1]);
      log(
        'Hat Band 3 (portrait): replace, both spotlights, alone then together, the bow and one sticker passed',
      );
      await page.setViewportSize({ width: 1024, height: 768 });
    }

    if (wants(4)) {
      // Level 4, Build a song (portrait): Undo, an empty part, two wrong Checks (the second glows a hint), Play, the accepted Check.
      await page.setViewportSize({ width: 768, height: 1024 });
      await launch('hat-band', 4);
      await page.waitForFunction(() => neo.scene.game.ready, null, { timeout: 20000 });
      before = await page.evaluate(() => kit.store.data.stickers.length);
      const song = () =>
        page.evaluate(() => {
          const g = neo.scene.game;
          const a = g.arrange;
          return {
            song: [...a.song],
            selected: a.selected,
            playing: a.playing,
            misses: g.misses,
            hints: g.hints,
            heard: g.heardSong,
            performing: g.performing,
            undo: a.undo.length,
          };
        });
      const who = await page.evaluate(() => neo.scene.game.singers.map((x) => x.role));
      const friend = async (role) => {
        await page.evaluate((i) => kit.tapOn(neo.scene.game.spots[i], 50, 100), who.indexOf(role));
        await page.waitForTimeout(250);
      };
      const part = (p) => tap(`neo.scene.game.parts[${p}]`);
      const loop = () =>
        page.waitForFunction(() => neo.scene.game.arrange.playing === 'loop', null, { timeout: 20000 });
      let t = await song();
      assert.deepEqual(t.song, [7, 7, 7]);
      assert.equal(t.selected, 0);
      // Undo with nothing to undo does nothing; a toggle then Undo restores the song exactly.
      await tap('neo.scene.game.undo');
      assert.deepEqual((await song()).song, [7, 7, 7]);
      await friend('drum');
      assert.deepEqual((await song()).song, [6, 7, 7]);
      await tap('neo.scene.game.undo');
      t = await song();
      assert.deepEqual([t.song, t.undo], [[7, 7, 7], 0]);
      // Empty the middle and Check: the pet asks for somebody there; nothing counted, nothing plays.
      await part(1);
      await friend('drum');
      await friend('tune');
      await friend('bass');
      assert.deepEqual((await song()).song, [7, 0, 7]);
      await tap('neo.scene.game.checkBtn');
      t = await song();
      assert.deepEqual([t.playing, t.misses, t.selected], ['loop', 0, 1]);
      // A middle with the tune, but the start is not the tune alone: two wrong Checks.
      await friend('tune');
      await tap('neo.scene.game.checkBtn');
      assert.equal((await song()).playing, 'check');
      // Edits are ignored while Check plays.
      await friend('drum');
      assert.deepEqual((await song()).song, [7, 2, 7]);
      await loop();
      t = await song();
      assert.deepEqual([t.misses, t.hints, t.selected], [1, 0, 0]);
      await tap('neo.scene.game.checkBtn');
      await loop();
      t = await song();
      assert.deepEqual([t.misses, t.hints, t.selected], [2, 1, 0]);
      // The hint glows the start's card and the friend to take out.
      assert.equal(await page.evaluate(() => neo.scene.game.hintPart), 0);
      // Fix the start: the tune alone. Play it whole, then Check.
      await friend('drum');
      await friend('bass');
      assert.deepEqual((await song()).song, [2, 2, 7]);
      await tap('neo.scene.game.play');
      assert.equal((await song()).playing, 'song');
      await screenshot('hat-band-4-portrait');
      await page.waitForFunction(() => neo.scene.game.heardSong, null, { timeout: 20000 });
      await tap('neo.scene.game.checkBtn');
      await page.waitForFunction(() => neo.scene.game.performing, null, { timeout: 20000 });
      await finished('hat-band');
      assert.deepEqual(await record(), [4, 2, 1, before + 1]);
      log(
        'Hat Band 4 (portrait): Undo, an empty part, two wrong Checks with a hint, Play, the accepted Check, the bow and one sticker passed',
      );
      await page.setViewportSize({ width: 1024, height: 768 });
    }
  }

  return { hatBandPlay };
}
