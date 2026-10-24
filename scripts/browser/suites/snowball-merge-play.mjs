import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, turnToGame, launch, finished }) {
/** Snowball Merge: real arrows, unjudged inert presses, revision, solver help and a finite finish. */
async function snowballMergePlay() {
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy);
  const direction = () => page.evaluate(() => neo.scene.game.route?.[0]);
  const press = async d => { await tap(`neo.scene.game.arrows.${d}`); await idle(); };
  for (const level of [1, 3]) {
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await launch('snowball-merge', level); await page.waitForTimeout(300);
    const initial = await page.evaluate(() => neo.scene.game.board.slice());
    await press(await direction());
    const inert = await page.evaluate(async () => {
      const { DIRECTIONS, slide } = await import('/src/games/snowball-merge/logic.ts');
      return DIRECTIONS.find(d => !slide(neo.scene.game.board, d).changed);
    });
    assert.ok(inert, 'a compacted edge offers an inert press');
    const compacted = await page.evaluate(() => neo.scene.game.board.slice());
    await press(inert);
    assert.deepEqual(await page.evaluate(() => neo.scene.game.board), compacted);
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 0, 'exploration is not a wrong answer');
    assert.equal(await page.evaluate(() => neo.scene.game.slides), 1, 'inert presses add no slide');
    await tap('neo.scene.game.undoButton');
    assert.deepEqual(await page.evaluate(() => neo.scene.game.board), initial);
    await tap('neo.scene.game.hintButton');
    const hint = await page.evaluate(() => neo.scene.game.hinted);
    assert.equal(hint, await direction());
    await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'same hint is counted once');
    await press(hint);
    await tap('neo.scene.game.restartButton');
    assert.deepEqual(await page.evaluate(() => neo.scene.game.board), initial);
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 2, 'restart preserves support accounting');
    if (level === 3) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      const boxes = await page.evaluate(() => {
        const g = neo.scene.game;
        return [...Object.values(g.arrows), g.undoButton, g.hintButton, g.restartButton].map(n => ({ x: n.x + n.hitArea.x, y: n.y + n.hitArea.y, w: n.hitArea.width, h: n.hitArea.height }));
      });
      const view = await page.evaluate(() => ({ w: neo.view.w, h: neo.view.h }));
      for (const b of boxes) {
        assert.ok(b.w >= 100 && b.h >= 100);
        assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= view.w && b.y + b.h <= view.h);
        assert.ok(b.x >= 200 || b.y + b.h < view.h - 205, 'clear of the guide pet');
      }
      for (let i = 0; i < boxes.length; i++) for (const b of boxes.slice(i + 1)) {
        const a = boxes[i];
        assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, 'controls stay apart');
      }
      await screenshot('snowball-merge-3-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(250);
      await screenshot('snowball-merge-3-landscape');
    }
    for (let guard = 0; guard < 40 && !await page.evaluate(() => neo.scene.game.finished); guard++) {
      const d = await direction(); assert.ok(d); await press(d);
    }
    await finished('snowball-merge');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('snowball-merge').history.at(-1); return [r.misses, r.hints]; }), [0, 2]);
  }
  await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene');
  await turnToGame('snowball-merge');
  await tap("neo.scene.showing.find(m => m.mod.id === 'snowball-merge').node"); await scene('GameScene');
  await page.waitForTimeout(400);
  // Leave while a slide's scene-owned tween is in flight.
  const d = await direction();
  await page.evaluate(d => { kit.tapOn(neo.scene.game.arrows[d]); neo.go.land('lantern-lake'); }, d);
  await scene('LandScene'); await page.waitForTimeout(350);
  assert.deepEqual(errors, []);
  log('Snowball Merge: first/last, inert exploration, hint once, Undo/Restart, portrait controls, one sticker, land launch and leave during slide passed');
}

return { snowballMergePlay };
}
