import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function dominoPondPlay() {
    const id = 'domino-pond';
    async function tap(target, index) {
      const p = await page.evaluate(
        ({ target, index }) => {
          const g = neo.scene.game;
          const node = g[target].get?.(index) ?? g[target][index];
          if (!node?.visible) throw new Error(`Hidden ${target} ${index}`);
          const { x, y } = node.getGlobalPosition();
          return { x, y };
        },
        { target, index },
      );
      await page.touchscreen.tap(p.x, p.y);
      await page.waitForTimeout(130);
    }
    const current = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return { score: g.score, placed: g.placed, checked: g.checked, hint: g.shownHint };
      });
    async function lay(move) {
      await tap('tray', move.stone);
      for (let i = 0; i < 4; i++) {
        const facing = await page.evaluate((stone) => neo.scene.game.facing.get(stone), move.stone);
        if (facing === move.direction) {
          await tap('cells', move.anchor);
          return;
        }
        await tap('controls', 1);
        await page.waitForTimeout(420);
      }
      throw new Error('Turn did not reach the directed placement');
    }
    const answers = () =>
      page.evaluate(async () => {
        const { tilings, isSolved } = await import('/src/games/domino-pond/logic.ts');
        const { board } = neo.scene.game;
        const options = tilings(board);
        return {
          right: options.find((moves) => isSolved(board, moves)),
          wrong: options.find((moves) => !isSolved(board, moves)),
        };
      });
    const stickers = () =>
      page.evaluate(() => kit.store.data.stickers.filter((s) => s.game === 'domino-pond').length);
    const saved = () =>
      page.evaluate(() => {
        const { level, misses, hints } = kit.store.stats('domino-pond').history.at(-1);
        return { level, misses, hints };
      });

    await page.setViewportSize({ width: 390, height: 844 });
    await launch(id, 1);
    assert.equal(await page.evaluate(() => neo.view.upright), true);
    const first = await answers();
    const mismatched = first.wrong.find(
      (move) =>
        !first.right.some(
          (right) =>
            move.stone === right.stone && move.anchor === right.anchor && move.direction === right.direction,
        ),
    );
    await lay(mismatched);
    assert.deepEqual((await current()).score, { misses: 1, hints: 0 });
    assert.equal((await current()).placed.length, 0);
    await tap('controls', 0);
    assert.equal((await current()).hint.kind, 'place');
    for (const move of first.right) await lay(move);
    await finished(id);
    assert.deepEqual(await saved(), { level: 1, misses: 1, hints: 1 });
    assert.equal(await stickers(), 1);

    await launch(id, 3);
    const last = await answers();
    await screenshot('domino-pond-3-upright');
    for (const move of last.wrong) await lay(move);
    assert.equal((await current()).score.misses, 0, 'trial placements are free');
    await tap('controls', 3);
    assert.equal((await current()).checked, true);
    await page.waitForTimeout(440);
    await tap('controls', 3);
    assert.equal((await current()).score.misses, 1, 'a repeated check needs an edit');
    await tap('controls', 0);
    const hint = (await current()).hint;
    assert.equal(hint.kind, 'remove');
    await tap('cells', hint.move.anchor);
    assert.equal((await current()).placed.length, 2);
    await tap('controls', 2);
    assert.deepEqual((await current()).placed, last.wrong, 'Undo brings back the removed stone');
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForFunction(() => !neo.view.upright);
    assert.deepEqual((await current()).placed, last.wrong, 'rotation keeps the pond');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => neo.view.upright === true);
    await page.waitForTimeout(300);
    // Follow a legal revised completion. Keep any stones whose placements already agree with it.
    const same = (a, b) => a.stone === b.stone && a.anchor === b.anchor && a.direction === b.direction;
    for (const move of last.wrong) {
      if (!last.right.some((right) => same(right, move))) await tap('cells', move.anchor);
    }
    for (const move of last.right) {
      if (!(await current()).placed.some((placed) => same(placed, move))) await lay(move);
    }
    await tap('controls', 3);
    await finished(id);
    assert.deepEqual(await saved(), { level: 3, misses: 1, hints: 1 });
    assert.equal(await stickers(), 2);
    log('Domino Pond: levels 1 and 3 finished after a miss and help, one sticker each');
  }
  return { dominoPondPlay };
}
