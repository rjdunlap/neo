import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, launch, finished }) {
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
  assert.ok(unpacked.some(([, n]) => n === 2), 'the trip unpacks each weather\'s two things on the pet');
  await finished('weather-wardrobe');
  log('Weather Wardrobe 6: trip unpacks on the pet, saved round and sticker passed');
}

return { wardrobe6 };
}
