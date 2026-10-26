import { fingerPlays, selectNames } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene }) {
async function fingerDemos() {
  const games = await page.evaluate(async () => {
    const { GAMES } = await import('/src/games/registry.ts');
    const { levelsInOrder } = await import('/src/progress/difficulty.ts');
    return GAMES.filter(g => g.touchDemo).map(g => ({
      id: g.id,
      ranges: g.bands.map(band => ({ band, levels: levelsInOrder(g.levels(band)) })),
    }));
  });
  const ids = selectNames(process.env.FINGER_ONLY, games.map(g => g.id), 'FINGER_ONLY');
  const picked = fingerPlays(games.filter(g => ids.includes(g.id)), process.env.FINGER_LEVELS);
  await page.evaluate(() => {
    kit.store.data.profile.name = 'Mia'; kit.store.data.settings.howToCards = true;
  });
  for (const g of picked) {
    for (const { band, level } of g.plays) {
      await page.evaluate(({ id, band, level }) => { kit.store.data.profile.band = band; kit.store.stats(id).pinned = level; neo.go.game(id, band); }, { id: g.id, band, level });
      await page.waitForFunction(({ id, level }) => !neo.switching && neo.scene.mod?.id === id && neo.scene.level === level && !!neo.scene.helpCard?.intro?.demo, { id: g.id, level });
      if (g.id === 'block-tower' && level === 6 && process.env.TOWER_SEED) {
        await page.evaluate(seed => { const d = neo.scene.helpCard.intro.demo; d.opts.seed = seed; d.restart(); }, Number(process.env.TOWER_SEED));
      }
      if (g.id === 'swap-meet' && level === 4 && process.env.SWAP_SEED) {
        await page.evaluate(seed => { const d = neo.scene.helpCard.intro.demo; d.opts.seed = seed; d.restart(); }, Number(process.env.SWAP_SEED));
      }
      assert.equal(await page.evaluate(() => neo.scene.helpCard.intro.demo.hasBot), true, `${g.id}: the game has a bot for its demonstration`);
      const limit = await page.evaluate(() => neo.scene.helpCard.intro.demo.limit);
      // The demonstration's own clock decides, not the wall: on a busy Mac it runs at a fraction of real time (a quarter, once), so the
      // limit is checked in the demo's seconds (its age stays above the limit while it rests before replaying) and the wall-clock timeout is only a backstop.
      await page.waitForFunction((limit) => { const d = neo.scene.helpCard.intro.demo; return d.finishedRounds > 0 || d.age > limit; }, limit, { timeout: limit * 8000, polling: 250 });
      assert.ok(await page.evaluate(() => neo.scene.helpCard.intro.demo.finishedRounds > 0), `${g.id} level ${level}: the bot finished a round within ${limit} seconds of its own clock`);
      assert.deepEqual(errors, [], `${g.id} level ${level}: page errors`);
      // A demonstration shows right play: the bot makes no wrong move and needs no hint (for the games that count them).
      const clean = await page.evaluate(() => { const game = neo.scene.helpCard.intro.demo.game; return game && typeof game.misses === 'number' ? { misses: game.misses, hints: game.hints } : null; });
      assert.ok(!clean || (clean.misses === 0 && clean.hints === 0), `${g.id} level ${level}: the demonstration played cleanly (${JSON.stringify(clean)})`);
      log(`Finger demo: ${g.id} level ${level} (${band}) finished in ${(await page.evaluate(() => neo.scene.helpCard.intro.demo.age)).toFixed(1)}s`);
    }
  }
  await page.evaluate(() => { neo.go.hub(); }); await scene('MapScene');
}

return { fingerDemos };
}
