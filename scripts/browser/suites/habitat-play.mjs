import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
async function habitatPlay() {
  const readyRound = (index) => page.waitForFunction((index) => neo.scene.finished || (neo.scene.game.roundIndex === index && !neo.scene.game.busy), index, { timeout: 30000 });
  const solveBuildRound = async (tryFirst = false) => {
    const index = await page.evaluate(() => neo.scene.game.roundIndex);
    if (tryFirst) {
      await tap('neo.scene.game.testButton');
      await page.waitForFunction(() => neo.scene.game.attempts === 1 && !neo.scene.game.busy);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0], 'an incomplete habitat is a free experiment');
      await tap('neo.scene.game.testButton');
      await page.waitForFunction(() => neo.scene.game.attempts === 2 && !neo.scene.game.busy);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 1], 'a second test brings help, not a miss');
      assert.ok(await page.evaluate(() => neo.scene.game.hinting.length > 0), 'a useful piece glows');
      await screenshot('habitat-helpers-1');
    }
    const solution = await page.evaluate(async () => {
      const { solutions } = await import('/src/games/habitat-helpers/logic.ts');
      return solutions(neo.scene.game.round)[0];
    });
    for (const id of solution) {
      await page.evaluate((id) => kit.tapOn(neo.scene.game.pieces.find((p) => p.id === id).node), id);
      await page.waitForTimeout(220);
    }
    assert.equal(await page.evaluate(() => neo.scene.game.selected.length), solution.length);
    await tap('neo.scene.game.testButton');
    await page.waitForFunction((index) => neo.scene.finished || neo.scene.game.roundIndex > index, index, { timeout: 30000 });
  };

  // First level: an empty garden can be tested freely; the second test supplies a glow, then Bunny arrives.
  await launch('habitat-helpers', 1);
  await readyRound(0);
  await solveBuildRound(true);
  await finished('habitat-helpers');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('habitat-helpers').history.at(-1); return [r.misses, r.hints]; }), [0, 1]);
  assert.ok(await page.evaluate(() => kit.store.data.journal.found.includes('habitat-helpers:bunny')));

  // Prediction level: deliberately predict the other visitor. It is an observation, not a wrong answer.
  await launch('habitat-helpers', 4);
  for (let index = 0; index < 3; index++) {
    await readyRound(index);
    // The sign shows a mystery guest, never the answer; the two visitor cards do not overlap; touching a prepared piece only listens.
    assert.equal(await page.evaluate(() => neo.scene.game.goal.children.some((c) => 'alive' in c)), false, 'the prediction sign never shows who will come');
    assert.ok(await page.evaluate(() => { const [a, b] = neo.scene.game.choices.map((c) => c.node); return Math.abs(a.x - b.x) >= 142; }), 'the Bunny and Duck cards do not overlap');
    await page.evaluate(() => kit.tapOn(neo.scene.game.pieces[0].node)); await page.waitForTimeout(450);
    assert.equal(await page.evaluate(() => neo.scene.game.selected.length), 2, 'a prepared piece stays put when touched');
    const wrong = await page.evaluate(() => neo.scene.game.round.visitors[0] === 'bunny' ? 'duck' : 'bunny');
    await page.evaluate((visitor) => kit.tapOn(neo.scene.game.choices.find((c) => c.visitor === visitor).node), wrong);
    await tap('neo.scene.game.testButton');
    await page.waitForFunction((index) => neo.scene.finished || neo.scene.game.roundIndex > index, index, { timeout: 30000 });
  }
  await finished('habitat-helpers');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('habitat-helpers').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);

  // Top level: the only three-space solution is the berry hedge, seed grass and pond with reeds; both visitors arrive.
  await launch('habitat-helpers', 6);
  await readyRound(0);
  await solveBuildRound();
  await finished('habitat-helpers');
  assert.ok(await page.evaluate(() => ['habitat-helpers:bunny', 'habitat-helpers:duck'].every((id) => kit.store.data.journal.found.includes(id))));
  await launch('habitat-helpers', 6);
  await readyRound(0);
  // Six cards: no two overlap, and the last one's touch area stays clear of the gate's.
  assert.ok(await page.evaluate(() => {
    const g = neo.scene.game; const xs = g.pieces.map((p) => p.node.x).sort((a, b) => a - b);
    return xs.every((x, i) => i === 0 || x - xs[i - 1] >= 112) && xs.at(-1) + 62 <= g.testButton.x - 72;
  }), 'six piece cards are apart and clear of the gate');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.ok(await page.evaluate(() => [...neo.scene.game.pieces.map((p) => p.node), neo.scene.game.testButton].every((node) => { const b = node.getBounds(); return b.x >= 0 && b.y >= 0 && b.x + b.width <= innerWidth && b.y + b.height <= innerHeight; })), 'portrait pieces and gate fit');
  await screenshot('habitat-helpers-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Habitat Helpers: first, prediction and top levels; a free incomplete test, automatic help, both visitors, discoveries and portrait passed');
}

return { habitatPlay };
}
