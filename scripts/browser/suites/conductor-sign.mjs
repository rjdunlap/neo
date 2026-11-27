import assert from 'node:assert/strict';

export function createSuite({ page, log, ready, scene, tap, screenshot, launch, finished }) {
  async function conductorSign() {
    // CONDUCTOR_UPRIGHT=1 plays level 3 as a touch phone held upright (390 × 844): the sign beside the bandstand.
    const held = process.env.CONDUCTOR_UPRIGHT === '1';
    if (held) await page.setViewportSize({ width: 390, height: 844 });
    await launch('little-conductor', 3);
    await page.waitForFunction(() => neo.scene.game.ready, null, { timeout: 20000 });
    if (held) {
      const v = await page.evaluate(() => {
        const l = neo.scene.game.layout;
        return { up: !!neo.view.upright, w: neo.view.w, h: neo.view.h, sign: l.sign, done: l.done };
      });
      assert.equal(
        v.up,
        true,
        'the view is upright ' +
          JSON.stringify([
            v.w,
            v.h,
            await page.evaluate(() => [
              innerWidth,
              innerHeight,
              matchMedia('(pointer: coarse)').matches,
              neo.scene.uprightArea,
            ]),
          ]),
      );
      assert.ok(v.sign.x + v.sign.w <= v.w && v.done.y + v.done.r <= v.h, 'sign and Done are on screen');
    }
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    const req = () =>
      page.evaluate(() => ({ ...neo.scene.game.requests, wants: neo.scene.game.round.requests }));
    const settled = () =>
      page.waitForFunction(
        () => {
          const g = neo.scene.game;
          return !g.playing && !g['busy'] && !g['answering'];
        },
        null,
        { timeout: 15000 },
      );
    const { wants } = await req();
    const other = wants[0] === 'turtle' ? 'rabbit' : 'turtle';
    // Check with nothing picked: the pads wiggle, nothing is counted.
    await tap('neo.scene.game.done');
    let r = await req();
    assert.equal(r.choice, null);
    assert.equal(r.misses, 0);
    assert.equal(r.hints, 0);
    // A pad tap auditions the half at that pace; the wrong one, checked, is one miss and stays picked.
    await tap(`neo.scene.game.pads.${other}`);
    await page.waitForFunction(() => neo.scene.game.playing, null, { timeout: 5000 });
    await settled();
    await tap('neo.scene.game.done');
    r = await req();
    assert.equal(r.misses, 1);
    assert.equal(r.choice, other);
    assert.equal(r.phrase, 0);
    await settled();
    // A requested hint: the asked-for pad glows and the band previews it; counted once for this half.
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.equal((await req()).hints, 1);
    await settled();
    await screenshot(held ? 'little-conductor-3-upright' : 'little-conductor-3-portrait');
    await tap(`neo.scene.game.pads.${wants[0]}`);
    await settled();
    await tap('neo.scene.game.done');
    await page.waitForFunction(() => neo.scene.game.requests.phrase === 1, null, { timeout: 15000 });
    await settled();
    await tap(`neo.scene.game.pads.${wants[1]}`);
    await settled();
    await tap('neo.scene.game.done');
    await finished('little-conductor');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('little-conductor').history.at(-1);
        return [r.level, r.misses, r.hints, kit.store.data.stickers.length];
      }),
      [3, 1, 1, before + 1],
    );
    log(
      'Little Conductor 3: Check with no pick, a wrong Check, a requested hint, both halves matched and one sticker passed',
    );
  }

  async function conductorChange() {
    // Level 7: the sign shows two ways to play and the second differs in one property; Check names the wrong one.
    const held = process.env.CONDUCTOR_UPRIGHT === '1';
    if (held) await page.setViewportSize({ width: 390, height: 844 });
    await launch('little-conductor', 7);
    await page.waitForFunction(() => neo.scene.game.ready, null, { timeout: 20000 });
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    const st = () => page.evaluate(() => ({ ...neo.scene.game.changes, asks: neo.scene.game.asks }));
    const settled = () =>
      page.waitForFunction(
        () => {
          const g = neo.scene.game;
          return !g.playing && !g['busy'] && !g['answering'];
        },
        null,
        { timeout: 15000 },
      );
    const { asks } = await st();
    const setWay = async (ask) => {
      await tap(`neo.scene.game.pads.${ask.pace}`);
      await settled();
      await tap(`neo.scene.game.strengthPads.${ask.strength}`);
      await settled();
    };
    // Check with nothing picked: nothing is counted.
    await tap('neo.scene.game.done');
    let r = await st();
    assert.equal(r.misses, 0);
    assert.equal(r.pace, null);
    // The right pace but the other strength: one miss that stays picked.
    const wrongStrength = asks[0].strength === 'gentle' ? 'strong' : 'gentle';
    await setWay({ pace: asks[0].pace, strength: wrongStrength });
    await tap('neo.scene.game.done');
    r = await st();
    assert.equal(r.misses, 1);
    assert.equal(r.strength, wrongStrength);
    await settled();
    // A requested hint: counted once for this half.
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.equal((await st()).hints, 1);
    await settled();
    await screenshot(held ? 'little-conductor-7-upright' : 'little-conductor-7-portrait');
    await setWay(asks[0]);
    await tap('neo.scene.game.done');
    await page.waitForFunction(() => neo.scene.game.changes.phrase === 1, null, { timeout: 15000 });
    await settled();
    await setWay(asks[1]);
    await tap('neo.scene.game.done');
    await finished('little-conductor');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('little-conductor').history.at(-1);
        return [r.level, r.misses, r.hints, kit.store.data.stickers.length];
      }),
      [7, 1, 1, before + 1],
    );
    log(
      'Little Conductor 7: Check with nothing set, a wrong strength, a hint, both halves matched and one sticker passed',
    );
  }

  return { conductorSign, conductorChange };
}
