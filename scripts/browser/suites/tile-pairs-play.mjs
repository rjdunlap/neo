import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, turnToGame, launch, finished }) {
  async function checkPeek(tapTile, state, initial, level) {
    const device = await page.context().newCDPSession(page);
    await device.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => neo.view.upright === true);
    await tap('neo.scene.game.peekButton');
    const alpha = await page.evaluate(async () => {
      const { peekStacks } = await import('/src/games/tile-pairs/logic.ts');
      const g = neo.scene.game;
      const stacks = peekStacks(g.tiles, g.mask);
      const covering = new Set(stacks.flatMap((stack) => stack.slice(1)));
      return {
        covering: [...covering].map((i) => g.nodes[i].alpha),
        underneath: g.nodes.filter((_, i) => !covering.has(i)).map((n) => n.alpha),
        pictures: stacks.map((stack) =>
          stack.map((i) => {
            const picture = g.peekPictures.children[i];
            const { minX, maxX, minY, maxY } = picture.getBounds();
            return {
              minX,
              maxX,
              minY,
              maxY,
              units: (maxX - minX) / neo.view.scale,
              visible: picture.visible && !g.nodes[i].picture.visible,
            };
          }),
        ),
      };
    });
    assert.ok(alpha.covering.length > 0);
    assert.ok(alpha.covering.every((a) => a === 0.25));
    assert.ok(alpha.underneath.every((a) => a === 1));
    const deepest = level === 7 ? 4 : 3;
    assert.ok(
      alpha.pictures.some((stack) => stack.length === deepest),
      `the portrait check includes a ${deepest}-layer stack`,
    );
    for (const stack of alpha.pictures) {
      assert.ok(stack.every((p) => p.visible));
      // Pictures in a stack never overlap (a four-deep stack reads in two rows), so each is readable separately.
      for (let i = 0; i < stack.length; i++)
        for (let j = i + 1; j < stack.length; j++) {
          const [a, b] = [stack[i], stack[j]];
          const apart = a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY;
          assert.ok(apart, 'pictures in a stack are readable separately');
        }
      if (stack.length === 4)
        assert.ok(
          stack.every((p) => p.units >= 30),
          'four-deep pictures stay large',
        );
    }
    assert.deepEqual(await state(), initial, 'looking leaves play and counters alone');
    await screenshot(`tile-pairs-${level}-peek-portrait`);

    await page.keyboard.press('p', { delay: 120 });
    assert.equal(await page.evaluate(() => neo.scene.game.peeking), false, 'P closes the touch view');
    assert.equal(await page.evaluate(() => neo.scene.game.peekButton.visible), true);
    await page.keyboard.press('p', { delay: 120 });
    await page.waitForFunction(() => neo.scene.game.peeking);
    await tapTile(await page.evaluate(() => neo.scene.game.cursor));
    assert.equal(await page.evaluate(() => neo.scene.game.peeking), false, 'a tile tap closes Peek');
    assert.deepEqual(await state(), initial, 'the closing tap does not select or score');

    await device.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await device.detach();
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(200);
  }

  /** Tile Pairs: real taps through first/last stacks, revision, support, resize, reward and return route. */
  async function tilePairsPlay() {
    const tapTile = async (i) => {
      await page.evaluate((i) => kit.tapOn(neo.scene.game.nodes[i]), i);
      await page.waitForTimeout(130);
    };
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          mask: g.mask,
          tiles: g.tiles,
          selected: g.selected,
          hinted: g.hinted,
          misses: g.misses,
          hints: g.hints,
          undos: g.undos,
          shuffles: g.shuffles,
        };
      });
    const levels = process.env.TILE_LEVELS?.split(',').map(Number) ?? [1, 6];
    for (const level of levels) {
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      await launch('tile-pairs', level);
      await page.waitForTimeout(500);
      const initial = await state();
      assert.equal(initial.tiles.length, [12, 20, 24, 24, 24, 24, 24][level - 1]);
      if (level === 5 || level === 7) await checkPeek(tapTile, state, initial, level);
      if (level >= 3 && level !== 5) {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(300);
        const geometry = await page.evaluate(async () => {
          const L = await import('/src/games/tile-pairs/logic.ts'),
            g = neo.scene.game;
          return L.freeTiles(g.tiles, g.mask).map((i) => {
            const n = g.nodes[i],
              p = n.toGlobal({ x: -54, y: -54 });
            return {
              w: n.hitArea.width,
              h: n.hitArea.height,
              x: p.x / neo.view.scale,
              y: p.y / neo.view.scale,
            };
          });
        });
        for (const r of geometry) {
          assert.ok(r.w >= 100 && r.h >= 100);
          assert.ok(r.x >= 0 && r.y >= 0);
        }
        await screenshot(`tile-pairs-${level}-portrait`);
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(200);
      }
      const mismatch = await page.evaluate(async () => {
        const L = await import('/src/games/tile-pairs/logic.ts'),
          g = neo.scene.game,
          open = L.freeTiles(g.tiles, g.mask);
        for (const a of open) for (const b of open) if (g.tiles[a].kind !== g.tiles[b].kind) return [a, b];
        throw new Error('test needs two different free pictures');
      });
      for (let n = 0; n < 2; n++) for (const i of mismatch) await tapTile(i);
      let s = await state();
      assert.equal(s.mask, initial.mask, 'a mismatch removes nothing');
      assert.equal(s.misses, 2);
      assert.equal(s.hints, 1);
      assert.ok(s.hinted);
      await tap('neo.scene.game.hintButton');
      assert.equal((await state()).hints, 1, 'repeated displayed hint is not charged again');
      const pair = (await state()).hinted;
      for (const i of pair) await tapTile(i);
      const afterPair = await state();
      assert.notEqual(afterPair.mask, initial.mask);
      await tap('neo.scene.game.undoButton');
      assert.equal((await state()).mask, initial.mask);
      assert.equal((await state()).undos, 1);
      // Selection cancellation and resize never move or remove a tile.
      await tapTile(pair[0]);
      assert.equal((await state()).selected, pair[0]);
      await page.setViewportSize({ width: 1180, height: 820 });
      await page.waitForTimeout(160);
      await tapTile(pair[0]);
      assert.equal((await state()).selected, null);
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(160);
      for (const i of pair) await tapTile(i);
      const remainder = await state();
      await tap('neo.scene.game.shuffleButton');
      s = await state();
      assert.equal(s.shuffles, 1);
      assert.equal(s.hints, 2);
      assert.deepEqual(
        s.tiles.map((t) => t.kind).sort(),
        remainder.tiles
          .filter((_, i) => remainder.mask & (1 << i))
          .map((t) => t.kind)
          .sort(),
      );
      await tap('neo.scene.game.undoButton');
      s = await state();
      assert.equal(s.undos, 2);
      assert.equal(s.shuffles, 1);
      assert.equal(s.hints, 2);
      assert.deepEqual(s.tiles, remainder.tiles);
      assert.equal(s.mask, remainder.mask, 'undo also restores a shuffled stack');
      await page.evaluate(async () => {
        const L = await import('/src/games/tile-pairs/logic.ts'),
          g = neo.scene.game;
        while (g.mask) {
          const pair = L.solve(g.tiles, g.mask)?.[0];
          if (!pair) throw new Error('clearing hint did not lead to completion');
          for (const i of pair) {
            kit.tapOn(g.nodes[i]);
            await kit.sleep(150);
          }
        }
      });
      await finished('tile-pairs');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('tile-pairs').history.at(-1);
          return [r.misses, r.hints];
        }),
        [2, 2],
      );
      log(`Tile Pairs ${level}: mismatch, hint, undo, shuffle, resize and one sticker passed`);
    }
    // Each round deals one of three looks by its seed: relaunch until both new looks have shown, one portrait each.
    if (process.env.TILE_LOOKS !== 'off') {
      await page.setViewportSize({ width: 768, height: 1024 });
      const shown = new Set();
      for (let n = 0; n < 16 && shown.size < 2; n++) {
        await launch('tile-pairs', 3);
        await page.waitForTimeout(400);
        const look = await page.evaluate(() => neo.scene.game.look);
        if (look === 0 || shown.has(look)) continue;
        shown.add(look);
        const kinds = await page.evaluate(() => neo.scene.game.tiles.map((t) => t.kind));
        assert.equal(new Set(kinds).size, 6);
        await screenshot(`tile-pairs-look-${look}-portrait`);
      }
      assert.equal(shown.size, 2, 'both new looks are dealt within a few rounds');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(200);
      log('Tile Pairs: both new looks dealt and captured');
    }
    // The actual Lantern Lake tile launches the game and Home returns to that land.
    await page.evaluate(() => {
      kit.store.data.profile.band = 'grownup';
      neo.go.land('lantern-lake');
    });
    await scene('LandScene');
    await turnToGame('tile-pairs');
    await tap("neo.scene.showing.find(m => m.mod.id === 'tile-pairs').node");
    await scene('GameScene');
    await page.waitForTimeout(350);
    await page.mouse.move(62, 62);
    await page.mouse.down();
    await page.waitForTimeout(650);
    await page.mouse.up();
    await scene('LandScene');
    assert.equal(await page.evaluate(() => neo.scene.land.id), 'lantern-lake');
    assert.deepEqual(errors, []);
    log('Tile Pairs: leaving a layered round returns to Lantern Lake without a reward or page error');
  }

  return { tilePairsPlay };
}
