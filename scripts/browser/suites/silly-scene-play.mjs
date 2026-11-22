import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot }) {
  async function sillyScenePlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          upright: neo.view.upright,
          backdrop: g.scene.backdrop,
          glowing: g.glowing?.art,
          found: [...g.found].map((thing) => thing.art),
          score: [g.score.misses, g.score.hints],
          stickers: kit.store.data.stickers.length,
        };
      });
    const tapAt = async (art) => {
      const point = await page.evaluate((art) => {
        const { node } = neo.scene.game.props.find((prop) => prop.thing.art === art);
        const p = node.toGlobal({ x: 0, y: 0 });
        const canvas = document.querySelector('canvas').getBoundingClientRect();
        return { x: p.x + canvas.left, y: p.y + canvas.top };
      }, art);
      await page.touchscreen.tap(point.x, point.y);
      await page.waitForTimeout(175);
    };
    const ready = () =>
      page.waitForFunction(() => !neo.scene.game.repairing && !neo.scene.game.waitingForReason);
    const savedScore = () =>
      page.evaluate(() => {
        const round = kit.store.stats('silly-scene').history.at(-1);
        return [round.misses, round.hints];
      });

    await page.setViewportSize({ width: 390, height: 844 });
    await launch('silly-scene', 1, 'Mia', 'preschool');
    const first = await state();
    assert.equal(first.upright, true);
    assert.equal(first.backdrop, 'pond');
    await page.touchscreen.tap(200, 390);
    assert.deepEqual((await state()).score, [0, 0], 'the scenery is free');
    await tapAt('fishTree');
    await finished('silly-scene');
    assert.deepEqual(await savedScore(), [0, 0]);
    assert.equal((await state()).stickers, first.stickers + 1);

    await page.evaluate(() => {
      kit.store.data.settings.showWords = true;
    });
    await launch('silly-scene', 3, 'Mia', 'school');
    assert.equal((await state()).backdrop, 'beach');
    await tapAt('sandcastle');
    await tapAt('sandcastle');
    assert.deepEqual((await state()).score, [1, 0], 'the same sandcastle only counts once');
    await tapAt('dogHat');
    let top = await state();
    assert.deepEqual(top.score, [2, 1], 'the possible decoy brings the second miss and one automatic hint');
    assert.equal(top.glowing, 'cloudCrab');
    await screenshot('silly-scene-3-upright');

    await tapAt('cloudCrab');
    await page.setViewportSize({ width: 844, height: 390 });
    await ready();
    await page.waitForFunction(() => !neo.view.upright);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => neo.view.upright);
    await tapAt('cloudCrab');
    top = await state();
    assert.deepEqual(top.found, ['cloudCrab'], 'the repair and find survive rotation');
    assert.deepEqual(top.score, [2, 1], 're-tapping the find is free');
    await tapAt('walkingFish');
    await finished('silly-scene');
    assert.deepEqual(await savedScore(), [2, 1]);
    assert.equal((await state()).stickers, first.stickers + 2);
  }
  return { sillyScenePlay };
}
