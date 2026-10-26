import assert from 'node:assert/strict';
import { selectNames } from '../selection.mjs';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished }) {
/** Cue Studio levels 1–2: inert empty Play/Finish, full shelf, select-replace, edit invalidating Finish, Undo, counted help once, portrait, one sticker. */
async function cueStudioPlay() {
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { program: g.s.program.slice(), played: g.s.played, hints: g.s.hints }; });
  const levels = selectNames(process.env.CUE_LEVELS, ['1', '2', '3'], 'CUE_LEVELS').map(Number);
  for (const level of levels.filter(level => level < 3)) {
    await launch('cue-studio', level); await idle();
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    // Empty Play and Finish only point at the empty place.
    await tap('neo.scene.game.playButton'); await tap('neo.scene.game.finishButton');
    assert.deepEqual(await state(), { program: level === 1 ? [null] : [null, null], played: false, hints: 0 });
    if (level === 1) {
      await tap('neo.scene.game.cards.T');
      await tap('neo.scene.game.cards.W');
      assert.deepEqual((await state()).program, ['T'], 'a full shelf never overwrites');
      await tap('neo.scene.game.playButton'); await idle();
      assert.equal((await state()).played, true);
      // Change the move: Finish waits for the new show.
      await tap('neo.scene.game.slots[0]'); await tap('neo.scene.game.cards.W');
      assert.deepEqual(await state(), { program: ['W'], played: false, hints: 0 });
      await tap('neo.scene.game.finishButton');
      assert.equal(await page.evaluate(() => neo.scene.finished), false, 'an unplayed edit cannot finish');
      await tap('neo.scene.game.undoButton');
      assert.deepEqual((await state()).program, ['T']);
      await tap('neo.scene.game.stepButton'); await idle();
      assert.equal((await state()).played, true, 'a stepped trace counts as watched');
    } else {
      // Help offers a Wave (one hint), Undo takes it back, Help again is free.
      await tap('neo.scene.game.hintButton');
      assert.deepEqual(await state(), { program: ['W', null], played: false, hints: 1 });
      await tap('neo.scene.game.undoButton'); await tap('neo.scene.game.hintButton');
      assert.equal((await state()).hints, 1, 'the same help is counted once');
      await tap('neo.scene.game.cards.T');
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(450);
      assert.ok(await page.evaluate(() => { const g = neo.scene.game; const k = g.ctx.stage.worldTransform.a; return [...g.slots, g.cards.W, g.cards.T, g.playButton, g.finishButton].every(n => n.getBounds().width / k >= 100); }), 'every target stays at least 100 logical units in portrait');
      await screenshot('cue-studio-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(450);
      await screenshot('cue-studio-landscape');
      // A partial Play never finishes; Help on the full unwatched show plays it (one more hint).
      await tap('neo.scene.game.hintButton'); await idle();
      assert.deepEqual(await state(), { program: ['W', 'T'], played: true, hints: 2 });
    }
    await tap('neo.scene.game.finishButton');
    await finished('cue-studio');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    log(`Cue Studio ${level}: inert empty controls, ${level === 1 ? 'full shelf, select-replace, edit invalidation, Undo, Step' : 'counted-once help, portrait targets, helped play'} and one sticker passed`);
  }
  if (!levels.includes(3)) return;
  await launch('cue-studio', 3); await idle();
  const before = await page.evaluate(() => kit.store.data.stickers.length);
  await tap('neo.scene.game.finishButton');
  await page.evaluate(() => neo.scene.game.restart());
  await page.waitForTimeout(3000);
  assert.deepEqual(await page.evaluate(() => { const g = neo.scene.game; return [g.s.misses, g.s.checked, g.busy, g.running]; }), [0, false, false, -1], 'restart cancels an in-flight Check without a late result');
  const repairState = () => page.evaluate(() => { const s = neo.scene.game.s; return { program: s.program, misses: s.misses, hints: s.hints, checked: s.checked }; });
  await tap('neo.scene.game.playButton'); await idle();
  await tap('neo.scene.game.stepButton'); await idle();
  assert.deepEqual(await repairState(), { program: ['T', 'W'], misses: 0, hints: 0, checked: false });
  for (let i = 0; i < 2; i++) { await tap('neo.scene.game.finishButton'); await idle(); }
  assert.deepEqual(await repairState(), { program: ['T', 'W'], misses: 2, hints: 1, checked: false });
  // Automatic clue makes the next Help a local repair. Undo restores just that edit; supplying it again is free.
  await tap('neo.scene.game.hintButton'); await idle();
  assert.deepEqual(await repairState(), { program: ['W', 'W'], misses: 2, hints: 2, checked: false });
  await tap('neo.scene.game.undoButton');
  await tap('neo.scene.game.hintButton'); await idle();
  assert.equal((await repairState()).hints, 2);
  await tap('neo.scene.game.hintButton'); await idle();
  assert.deepEqual(await repairState(), { program: ['W', 'T'], misses: 2, hints: 3, checked: false });
  await tap('neo.scene.game.hintButton'); await idle();
  assert.equal((await repairState()).checked, false, 'help still requires a deliberate Check');
  // Check all actual target rectangles after their transforms at four standard view shapes.
  for (const viewport of [{ width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 1366, height: 768 }, { width: 1024, height: 1366 }]) {
    await page.setViewportSize(viewport); await page.waitForTimeout(350);
    assert.ok(await page.evaluate(() => {
      const g = neo.scene.game, v = neo.view;
      const nodes = [...g.requests, ...g.slots, g.cards.W, g.cards.T, g.playButton, g.stepButton, g.undoButton, g.hintButton, g.finishButton];
      const boxes = nodes.map(n => ({ x: n.x - 56, y: n.y - 56, w: 112 * n.scale.x, h: 112 * n.scale.y }));
      return boxes.every((a, i) => a.w >= 100 && a.h >= 100 && a.x >= 0 && a.y >= 100 && a.x + a.w <= v.w && a.y + a.h <= v.h && boxes.every((b, j) => i === j || a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y));
    }), `P3 targets fit without overlap at ${viewport.width}x${viewport.height}`);
  }
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
  await screenshot('cue-studio-3-portrait');
  await tap('neo.scene.game.finishButton'); await idle();
  assert.equal((await repairState()).checked, true);
  // A real edit invalidates Check; undoing it also needs a fresh Check.
  await tap('neo.scene.game.slots[0]'); await tap('neo.scene.game.cards.T');
  assert.equal((await repairState()).checked, false);
  await tap('neo.scene.game.undoButton');
  assert.equal((await repairState()).checked, false);
  await tap('neo.scene.game.finishButton'); await idle();
  await tap('neo.scene.game.finishButton'); await finished('cue-studio');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
  await page.setViewportSize({ width: 1024, height: 768 });
  log('Cue Studio 3: free watch/Step, wrong Checks, automatic clue, local repairs, Undo/idempotent help, Check invalidation, four-view targets and one helped sticker passed');
}

return { cueStudioPlay };
}
