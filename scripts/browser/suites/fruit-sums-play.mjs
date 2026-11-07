import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
async function fruitSumsPlay() {
  const tap = async (expr) => { await page.evaluate(expr); await page.waitForTimeout(320); };
  const landed = () => page.waitForFunction(() => neo.scene.game.landed.every(Boolean), null, { timeout: 10000 });
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.game.finished, null, { timeout: 30000 });
  const wayFor = (n) => page.evaluate((n) => {
    const g = neo.scene.game, t = g.tray;
    const found = [];
    for (let a = 0; a < t.length; a++) for (let b = 0; b < t.length; b++) {
      if (a === b) continue;
      if (t[a] + t[b] === g.target) found.push({ a, op: 'plus', b });
      if (g.plan.ops.includes('minus') && t[a] - t[b] === g.target) found.push({ a, op: 'minus', b });
    }
    const wrong = [];
    for (let a = 0; a < t.length; a++) for (let b = a + 1; b < t.length; b++) if (t[a] + t[b] !== g.target) wrong.push({ a, b });
    return { found, wrong, n };
  }, n);
  const build = async (way) => {
    await tap(`kit.tapOn(neo.scene.game.tiles[${way.a}])`); await tap(`kit.tapOn(neo.scene.game.tiles[${way.b}])`);
    if (way.op) await tap(`kit.tapOn(neo.scene.game.leaves.get('${way.op}'))`);
    await tap('kit.tapOn(neo.scene.game.check)');
  };
  // Level 1: a check before anything is picked says so and is no miss; two wrong totals earn two misses and one hint with a glowing fruit;
  // the same sum the other way round is the same way (no miss); a second, different way ends the round with one sticker.
  await launch('fruit-sums', 1);
  await tap('kit.tapOn(neo.scene.game.check)');
  await landed();
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
  const plan = await wayFor();
  const unslot = async () => { for (const k of ['slotA', 'slotB']) if (await page.evaluate((k) => neo.scene.game[k] !== null, k)) await tap(`kit.tapOn(neo.scene.game.tiles[neo.scene.game['${k}']])`); };
  for (let i = 0; i < 2; i++) {
    await unslot();
    await build({ a: plan.wrong[i].a, b: plan.wrong[i].b });
    assert.equal(await page.evaluate(() => neo.scene.game.checkMade.visible), true);
  }
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]), [2, 1, true]);
  await screenshot('fruit-sums-1');
  // Take the two wrong fruit back out, then follow the glow: the start fruit, then its partner, then the check.
  await unslot();
  const glowing = () => page.evaluate(() => neo.scene.game.glowing());
  const g1 = await glowing();
  assert.ok('tile' in g1, 'a start fruit glows');
  await tap(`kit.tapOn(neo.scene.game.tiles[${g1.tile}])`);
  const g2 = await glowing();
  assert.ok('tile' in g2 && g2.tile !== g1.tile, 'then its partner glows');
  await tap(`kit.tapOn(neo.scene.game.tiles[${g2.tile}])`);
  assert.ok('check' in (await glowing()), 'then the check glows');
  assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'the partner glow is the same one hint');
  const first = { a: g1.tile, b: g2.tile };
  await tap('kit.tapOn(neo.scene.game.check)');
  await idle();
  assert.equal(await page.evaluate(() => neo.scene.game.found.length), 1);
  await build({ a: first.b, b: first.a });
  assert.equal(await page.evaluate(() => [neo.scene.game.found.length, neo.scene.game.misses].join()), '1,2');
  const t = await page.evaluate(() => neo.scene.game.tray);
  const key = (w) => [Math.min(t[w.a], t[w.b]), Math.max(t[w.a], t[w.b])].join();
  const second = (await wayFor()).found.find((w) => key(w) !== key(first));
  assert.ok(second, 'a second way exists');
  await build({ a: second.a, b: second.b });
  await finished('fruit-sums');
  // Level 3: a take away is built with the leaf; portrait layout holds, shown in the cove sunset look (relaunched until the round picks it).
  await page.setViewportSize({ width: 768, height: 1024 });
  for (let i = 0; i < 15; i++) {
    await launch('fruit-sums', 3);
    if (await page.evaluate(() => neo.scene.game.look) === 'cove') break;
  }
  assert.equal(await page.evaluate(() => neo.scene.game.look), 'cove');
  await landed(); await page.waitForTimeout(500);
  await screenshot('fruit-sums-3-portrait-cove');
  const l3 = await wayFor();
  const minus = l3.found.find((w) => w.op === 'minus'), plus = l3.found.find((w) => w.op === 'plus');
  assert.ok(minus && plus, 'level 3 offers both signs');
  await build(minus);
  await idle();
  await build(plus);
  await finished('fruit-sums');
  assert.deepEqual(errors, []);
  log('Fruit Sums: levels 1 and 3, no-pick check, two misses and one hint that glows the start fruit, its partner and the check, the same sum the other way round, two ways to finish, a take away by leaf, portrait in the cove look and one sticker per round passed');
}

return { fruitSumsPlay };
}
