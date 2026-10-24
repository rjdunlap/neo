import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished }) {
/** Cue Studio levels 1–2: inert empty Play/Finish, full shelf, select-replace, edit invalidating Finish, Undo, counted help once, portrait, one sticker. */
async function cueStudioPlay() {
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { program: g.s.program.slice(), played: g.s.played, hints: g.s.hints }; });
  for (const level of [1, 2]) {
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
}

return { cueStudioPlay };
}
