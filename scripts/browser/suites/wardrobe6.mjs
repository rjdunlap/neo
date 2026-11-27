import assert from 'node:assert/strict';

export function createSuite({ page, log, launch, finished, ready, screenshot }) {
  async function wardrobe6() {
    await launch('weather-wardrobe', 6);
    await page.waitForTimeout(700);
    const unpacked = await page.evaluate(async () => {
      const g = neo.scene.game;
      const seen = [];
      for (let step = 0; !g.done && step < 400; step++) {
        if (!g.busy) {
          const option = g.options.find((o) => !o.used && g.outfit.needed.includes(o.item));
          if (option) kit.tapOn(option.node);
        } else if (g.worn.size) seen.push([g.weather, g.worn.size]);
        await kit.sleep(120);
      }
      return seen;
    });
    assert.ok(
      unpacked.some(([, n]) => n === 2),
      "the trip unpacks each weather's two things on the pet",
    );
    await finished('weather-wardrobe');
    log('Weather Wardrobe 6: trip unpacks on the pet, saved round and sticker passed');
  }

  async function wardrobe12() {
    const id = 'weather-wardrobe';
    const portrait = { width: 390, height: 625 };
    const landscape = { width: 625, height: 390 };
    await ready();
    await page.setViewportSize(portrait);
    const before = await page.evaluate(() => {
      kit.store.data.settings.showWords = true;
      return kit.store.data.stickers.length;
    });
    await launch(id, 12, 'Mia', 'school');
    await page.waitForFunction(() => neo.scene.game?.options.every(({ node }) => node.scale.x === 1));
    const clearCaption = () =>
      page.evaluate(() => {
        const { game, place } = neo.scene;
        if (place.mode !== 'bubble') return false;
        const band = place.band;
        return game.options.every(({ node }, i) => {
          const { x, y } = node.position;
          return (
            x - 70 >= 0 &&
            x + 70 <= game.view.w &&
            y + 70 <= band.y &&
            game.options
              .slice(i + 1)
              .every(({ node: other }) => Math.max(Math.abs(x - other.x), Math.abs(y - other.y)) >= 140)
          );
        });
      });
    assert.equal(await clearCaption(), true, 'both portrait rows stay above the short-phone caption');
    await screenshot('weather-wardrobe-12-pack-light');
    const tapItem = async (item) => {
      const { x, y } = await page.evaluate((item) => {
        const { node } = neo.scene.game.options.find((option) => option.item === item);
        return node.getGlobalPosition();
      }, item);
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(155);
    };
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          packed: g.options.filter(({ used }) => used).map(({ item }) => item),
          misses: g.misses,
          hints: g.hints,
          glow: !g.glow.context.bounds.isEmpty(),
        };
      });
    const puzzle = () => page.evaluate(() => neo.scene.game.outfit);
    const first = await puzzle();
    const alternate = first.packings.find((packing) => packing[1] !== first.needed[1]);
    assert.ok(alternate, 'the first case offers more than one rain choice');
    const unrelated = first.options.find((item) => !first.packings.some((packing) => packing.includes(item)));
    await tapItem(alternate[1]);
    await tapItem(first.needed[1]);
    await tapItem(unrelated);
    assert.deepEqual(
      (({ packed, misses, hints, glow }) => ({ packed, misses, hints, glow }))(await state()),
      { packed: [alternate[1]], misses: 2, hints: 1, glow: true },
    );
    await tapItem('boots');
    await page.setViewportSize(landscape);
    await page.waitForFunction(() => !neo.view.upright);
    assert.ok((await state()).packed.includes('boots'));
    await page.setViewportSize(portrait);
    await page.waitForFunction(() => neo.view.upright);
    assert.equal(await clearCaption(), true);

    await tapItem(alternate[2]);
    await page.setViewportSize(landscape);
    await page.waitForFunction(() => !neo.view.upright);
    const next = first.weathers[1];
    const secondItem = next === 'rainy' ? alternate[1] : alternate[2];
    assert.deepEqual(
      await page.evaluate(
        async ({ next, secondItem }) => {
          const { game, place } = neo.scene;
          await kit.until(() => game.worn.has('boots'));
          const boots = game.worn.get('boots');
          await kit.until(() => game.weather === next && game.worn.has(secondItem));
          const bootBottom = Math.max(...boots.map((node) => node.getBounds().maxY));
          const captionTop = neo.scene.stage.toGlobal({ x: 0, y: place.band.y }).y;
          return [game.worn.get('boots') === boots, bootBottom < captionTop];
        },
        { next, secondItem },
      ),
      [true, true],
      'the same boots stay on across the skies, above the sideways caption',
    );
    await page.waitForFunction(() => neo.scene.game.q === 1 && !neo.scene.game.busy);
    await page.setViewportSize(portrait);
    await page.waitForFunction(() => neo.view.upright);
    await page.waitForFunction(() => neo.scene.game.options.every(({ node }) => node.scale.x === 1));
    const second = await puzzle();
    assert.deepEqual(second.weathers, [...first.weathers].reverse());
    for (const item of second.packings.at(-1)) await tapItem(item);
    await finished(id);
    assert.deepEqual(
      await page.evaluate((id) => {
        const { misses, hints } = kit.store.stats(id).history.at(-1);
        return [misses, hints, kit.store.data.stickers.length];
      }, id),
      [2, 1, before + 1],
    );
    // Level 13, Warm or cold?: five tiles in an upright phone, a thermometer, and one thing for the sky and one for the temperature.
    await launch(id, 13, 'Mia', 'school');
    await page.waitForFunction(() => neo.scene.game?.options.every(({ node }) => node.scale.x === 1));
    assert.equal(await clearCaption(), true, 'level 13 tiles stay clear of the short-phone caption');
    await screenshot('weather-wardrobe-13-warm-or-cold');
    const first13 = await page.evaluate(() => neo.scene.game.outfit.temp);
    assert.ok(['cold', 'hot'].includes(first13), 'the round shows a thermometer temperature');
    for (let step = 0; step < 80; step++) {
      const next = await page.evaluate(() => {
        const g = neo.scene.game;
        if (g.done) return null;
        const o = g.options.find((o) => !o.used && g.outfit.needed.includes(o.item));
        const p = o && o.node.getGlobalPosition();
        return p ? { x: p.x, y: p.y } : 'wait';
      });
      if (next === null) break;
      if (next === 'wait') await page.waitForTimeout(500);
      else {
        await page.mouse.click(next.x, next.y);
        await page.waitForTimeout(450);
      }
    }
    await finished(id);
    assert.equal(
      await page.evaluate(() => kit.store.data.stickers.length),
      before + 2,
      'level 13 earns one sticker',
    );
    log('Weather Wardrobe 12: touch, alternate packing, hint, rotation, boots reuse and one sticker passed');
    log('Weather Wardrobe 13: portrait tiles, thermometer round and one sticker passed');
  }

  return { wardrobe6, wardrobe12 };
}
