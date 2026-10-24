import { selectNames } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, next }) {
/** Lands stage C1b: eleven touch games lay themselves out for keys at the first press and come back to touch at the next finger. LIVE_ONLY=a,b plays only those. */
async function liveSwitchPlay() {
  const all = ['sudoku-garden', 'word-search', 'island-bridges', 'picture-logic', 'pond-conga', 'tile-pairs', 'gem-swap', 'lantern-lights', 'bouncy-launch', 'ferry-jam', 'penguin-slide'];
  const ids = selectNames(process.env.LIVE_ONLY, all, 'LIVE_ONLY');
  for (const id of ids) {
    const level = await page.evaluate(async (id) => (await import('/src/app/input-in-use.ts')).controllerLevels(id).values().next().value, id);
    await launch(id, level);
    await page.waitForTimeout(900);
    // Bouncy Launch's touch layout is its unsquashed spring (`stick` is the keys' one).
    const touch = () => page.evaluate(() => { const g = neo.scene.game; return g.touch ?? !g.stick; });
    const press = async (key) => { await page.keyboard.press(key, { delay: 140 }); await page.waitForTimeout(250); };
    const tapAway = async () => { await page.evaluate(() => kit.tap(neo.view.w - 40, neo.view.h / 2)); await page.waitForTimeout(250); };
    assert.equal(await touch(), true, `${id} starts as touch`);
    await press('ArrowRight');
    assert.equal(await touch(), false, `${id} lays itself out for the controller at the first key`);
    await tapAway();
    assert.equal(await touch(), true, `${id} comes back to touch at a finger`);
    const layer = () => page.evaluate(() => {
      const g = neo.scene.game;
      if (g.stick !== undefined) return !g.stick && Math.abs(g.pet.y - g.seat.y) < 1;
      return (g.touchLayer ?? g.tapLayer ?? g.undoButton ?? g.undo).visible;
    });
    assert.equal(await layer(), true, `${id} shows its touch layer again`);
    await press('ArrowDown');
    assert.equal(await layer(), false, `${id} hides its touch layer for the controller`);
    await tapAway();
    await press('ArrowDown');
    assert.equal(await touch(), false, `${id} goes to the controller again at the next key`);
    if (id === 'ferry-jam') {
      // A boat picked up by keys goes back when a finger comes down, so no boat is left held.
      await press('Enter');
      assert.ok(await page.evaluate(() => neo.scene.game.grab), 'ferry-jam picks a boat up with Enter');
      await tapAway();
      assert.equal(await page.evaluate(() => neo.scene.game.grab), null, 'ferry-jam puts a key-held boat back at a finger');
      await press('ArrowDown');
    }
    await tapAway();
    assert.equal(await touch(), true, `${id} comes back again`);
    if (id === 'sudoku-garden') await screenshot('c1b-sudoku-back-to-touch');
    log(`Live keys: ${id} (level ${level}) touch → keys → touch → keys → touch`);
  }
  assert.deepEqual(errors, []);
}

return { liveSwitchPlay };
}
