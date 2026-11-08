import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  async function fruitSumsPlay() {
    const tap = async (expr) => {
      await page.evaluate(expr);
      await page.waitForTimeout(320);
    };
    const landed = () =>
      page.waitForFunction(() => neo.scene.game.landed.every(Boolean), null, { timeout: 10000 });
    const idle = () =>
      page.waitForFunction(() => !neo.scene.game.busy || neo.scene.game.finished, null, { timeout: 30000 });
    const wayFor = (n) =>
      page.evaluate((n) => {
        const g = neo.scene.game,
          t = g.tray;
        const found = [];
        for (let a = 0; a < t.length; a++)
          for (let b = 0; b < t.length; b++) {
            if (a === b) continue;
            if (t[a] + t[b] === g.target) found.push({ a, op: 'plus', b });
            if (g.plan.ops.includes('minus') && t[a] - t[b] === g.target) found.push({ a, op: 'minus', b });
          }
        const wrong = [];
        for (let a = 0; a < t.length; a++)
          for (let b = a + 1; b < t.length; b++) if (t[a] + t[b] !== g.target) wrong.push({ a, b });
        return { found, wrong, n };
      }, n);
    const build = async (way) => {
      await tap(`kit.tapOn(neo.scene.game.tiles[${way.a}])`);
      await tap(`kit.tapOn(neo.scene.game.tiles[${way.b}])`);
      if (way.op) await tap(`kit.tapOn(neo.scene.game.leaves.get('${way.op}'))`);
      await tap('kit.tapOn(neo.scene.game.check)');
    };
    // FROM_LEVEL=4 starts at level 4; FROM_LEVEL=5 plays only the newest level.
    const from = Number(process.env.FROM_LEVEL ?? 1);
    if (from <= 3) await levelsOneToThree();
    if (from <= 4) await levelFour();
    await levelFive();
    assert.deepEqual(errors, []);
    log(
      `Fruit Sums: ${from <= 3 ? 'levels 1 and 3, no-pick check, two misses and one hint that glows the start fruit, its partner and the check, the same sum the other way round, two ways to finish, a take away by leaf, portrait in the cove look; ' : ''}${from <= 4 ? 'level 4 with the sum on the sign, one wrong total, the sign\'s own pair as the same way when the tray holds it, two ways written "x + y = p + q", portrait; ' : ''}level 5 portrait, one wrong pair as a miss, three pairs into the basket until the tree is empty; one sticker per round passed`,
    );

    async function levelsOneToThree() {
      // Level 1: a check before anything is picked says so and is no miss; two wrong totals earn two misses and one hint with a glowing fruit;
      // the same sum the other way round is the same way (no miss); a second, different way ends the round with one sticker.
      await launch('fruit-sums', 1);
      await tap('kit.tapOn(neo.scene.game.check)');
      await landed();
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
      const plan = await wayFor();
      const unslot = async () => {
        for (const k of ['slotA', 'slotB'])
          if (await page.evaluate((k) => neo.scene.game[k] !== null, k))
            await tap(`kit.tapOn(neo.scene.game.tiles[neo.scene.game['${k}']])`);
      };
      for (let i = 0; i < 2; i++) {
        await unslot();
        await build({ a: plan.wrong[i].a, b: plan.wrong[i].b });
        assert.equal(await page.evaluate(() => neo.scene.game.checkMade.visible), true);
      }
      assert.deepEqual(
        await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]),
        [2, 1, true],
      );
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
      assert.equal(
        await page.evaluate(() => neo.scene.game.hints),
        1,
        'the partner glow is the same one hint',
      );
      const first = { a: g1.tile, b: g2.tile };
      await tap('kit.tapOn(neo.scene.game.check)');
      await idle();
      assert.equal(await page.evaluate(() => neo.scene.game.found.length), 1);
      await build({ a: first.b, b: first.a });
      assert.equal(
        await page.evaluate(() => [neo.scene.game.found.length, neo.scene.game.misses].join()),
        '1,2',
      );
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
        if ((await page.evaluate(() => neo.scene.game.look)) === 'cove') break;
      }
      assert.equal(await page.evaluate(() => neo.scene.game.look), 'cove');
      await landed();
      await page.waitForTimeout(500);
      await screenshot('fruit-sums-3-portrait-cove');
      const l3 = await wayFor();
      const minus = l3.found.find((w) => w.op === 'minus'),
        plus = l3.found.find((w) => w.op === 'plus');
      assert.ok(minus && plus, 'level 3 offers both signs');
      await build(minus);
      await idle();
      await build(plus);
      await finished('fruit-sums');
    }

    async function levelFour() {
      // Level 4: the sign holds a sum; one wrong total is a miss that says both amounts, the sign's own pair (when the tray holds it)
      // is the same way and no miss, and two other pairs finish, each written against the sign's sum.
      await page.setViewportSize({ width: 768, height: 1024 });
      await launch('fruit-sums', 4);
      await landed();
      await page.waitForTimeout(500);
      const sign = await page.evaluate(() => neo.scene.game.signSum);
      assert.ok(Array.isArray(sign) && sign.length === 2, 'the sign holds a sum');
      await screenshot('fruit-sums-4-portrait');
      const l4 = await wayFor();
      const t4 = await page.evaluate(() => neo.scene.game.tray);
      const k = (w) => [Math.min(t4[w.a], t4[w.b]), Math.max(t4[w.a], t4[w.b])].join();
      const signKey = [Math.min(...sign), Math.max(...sign)].join();
      await build(l4.wrong[0]);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.checkMade.visible]), [
        1,
        true,
      ]);
      for (const kk of ['slotA', 'slotB'])
        if (await page.evaluate((kk) => neo.scene.game[kk] !== null, kk))
          await tap(`kit.tapOn(neo.scene.game.tiles[neo.scene.game['${kk}']])`);
      const own = l4.found.find((w) => k(w) === signKey);
      if (own) {
        await build({ a: own.a, b: own.b });
        assert.deepEqual(
          await page.evaluate(() => [neo.scene.game.found.length, neo.scene.game.misses]),
          [0, 1],
        );
      }
      const ways = [];
      for (const w of l4.found)
        if (k(w) !== signKey && !ways.some((v) => k(v) === k(w))) ways.push({ a: w.a, b: w.b });
      assert.ok(ways.length >= 2, 'two ways besides the sign');
      await build(ways[0]);
      await idle();
      const text = await page.evaluate(() => neo.scene.game.foundText.text);
      assert.ok(text.endsWith(`= ${sign[0]} + ${sign[1]}`), `found line reads against the sign: ${text}`);
      await build(ways[1]);
      await finished('fruit-sums');
      log(`Fruit Sums level 4: sign ${sign.join(' + ')}, tray ${t4.join(',')}, own pair in tray: ${!!own}`);
    }

    async function levelFive() {
      // Level 5: six fruit make three pairs; one wrong pair is a miss and the fruit stay; each right pair drops into the basket and
      // leaves the tree, and the round ends with one sticker once the tree is empty.
      await page.setViewportSize({ width: 768, height: 1024 });
      await launch('fruit-sums', 5);
      await landed();
      const t5 = await page.evaluate(() => [
        neo.scene.game.target,
        neo.scene.game.tray,
        neo.scene.game.clear,
      ]);
      assert.equal(t5[2], true, 'level 5 clears the tree');
      const pairOnTree = () =>
        page.evaluate(() => {
          const g = neo.scene.game,
            t = g.tray;
          let right = null,
            wrong = null;
          for (let a = 0; a < t.length; a++)
            for (let b = a + 1; b < t.length; b++) {
              if (g.gone[a] || g.gone[b]) continue;
              if (t[a] + t[b] === g.target) right ??= { a, b };
              else wrong ??= { a, b };
            }
          return { right, wrong };
        });
      const first = await pairOnTree();
      assert.ok(first.wrong, 'a wrong pair to try');
      await build(first.wrong);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.checkMade.visible]), [
        1,
        true,
      ]);
      for (const kk of ['slotA', 'slotB'])
        if (await page.evaluate((kk) => neo.scene.game[kk] !== null, kk))
          await tap(`kit.tapOn(neo.scene.game.tiles[neo.scene.game['${kk}']])`);
      for (let pair = 1; pair <= 3; pair++) {
        const { right } = await pairOnTree();
        assert.ok(right, `a right pair is on the tree before pair ${pair}`);
        await build(right);
        if (pair < 3) {
          await idle();
          assert.equal(await page.evaluate(() => neo.scene.game.gone.filter(Boolean).length), pair * 2);
          if (pair === 1) await screenshot('fruit-sums-5-portrait-basket');
        }
      }
      await finished('fruit-sums');
      log(`Fruit Sums level 5: make ${t5[0]}, tray ${t5[1].join(',')}, cleared in three pairs`);
    }
  }

  return { fruitSumsPlay };
}
