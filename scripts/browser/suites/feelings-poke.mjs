import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
  /** Feelings Faces level 9 Poke a feeling: lap's entry, real taps on the pet and on the room around it, the cycle and its hug, six taps, one sticker, portrait. */
  async function feelingsPoke() {
    await page.setViewportSize({ width: 768, height: 1024 });
    await launch('feelings-faces', 9, 'Mia', 'lap');
    assert.equal(await page.evaluate(() => neo.scene.game.options.length), 0, 'no bubbles at level 9');
    const seen = await page.evaluate(async () => {
      const g = neo.scene.game,
        t = g.pet.touch,
        out = [];
      // Every other poke lands on the empty room beside the pet (lap's touch anywhere), left then right.
      const side = [0.08, 0.92];
      for (let i = 0; i < 6; i++) {
        if (i % 2) {
          const at = { x: innerWidth * side[(i >> 1) % 2], y: innerHeight * 0.6 },
            local = g.pet.toLocal(at);
          if (g.pet.hitArea.contains(local.x, local.y)) throw new Error('the room point is on the pet');
          kit.tap(at.x, at.y);
        } else kit.tapOn(g.pet, t.x, t.y);
        await kit.sleep(500);
        out.push(g.pet.currentMood);
      }
      return out;
    });
    assert.deepEqual(
      seen,
      ['happy', 'surprised', 'sleepy', 'sad', 'happy', 'surprised'],
      'the cycle, with the hug cheering the sad pet, whether the touch is on the pet or the room',
    );
    await screenshot('feelings-faces-9-portrait');
    await finished('feelings-faces');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('feelings-faces').history.at(-1);
        return [r.level, r.misses, r.hints];
      }),
      [9, 0, 0],
    );
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Feelings Faces 9: six pokes (three on the room) through the cycle and its hug, one sticker, portrait passed',
    );
  }

  return { feelingsPoke };
}
