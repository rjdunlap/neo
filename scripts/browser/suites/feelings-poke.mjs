import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
/** Feelings Faces level 9 Poke a feeling: lap's entry, real taps on the pet, the cycle and its hug, six taps, one sticker, portrait. */
async function feelingsPoke() {
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('feelings-faces', 9, 'Mia', 'lap');
  assert.equal(await page.evaluate(() => neo.scene.game.options.length), 0, 'no bubbles at level 9');
  const seen = await page.evaluate(async () => {
    const g = neo.scene.game, t = g.pet.touch, out = [];
    for (let i = 0; i < 6; i++) { kit.tapOn(g.pet, t.x, t.y); await kit.sleep(500); out.push(g.pet.currentMood); }
    return out;
  });
  assert.deepEqual(seen, ['happy', 'surprised', 'sleepy', 'sad', 'happy', 'surprised'], 'the cycle, with the hug cheering the sad pet');
  await screenshot('feelings-faces-9-portrait');
  await finished('feelings-faces');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('feelings-faces').history.at(-1); return [r.level, r.misses, r.hints]; }), [9, 0, 0]);
  await page.setViewportSize({ width: 1024, height: 768 });
  log('Feelings Faces 9: six pokes through the cycle and its hug, one sticker, portrait passed');
}

return { feelingsPoke };
}
