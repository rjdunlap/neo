import { selectNames, selectValue } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, launch, finished }) {
/**
 * A quick look at every game (`SMOKE_ONLY=id,id` for some, `SMOKE_FROM=id` to continue from one): it opens at the lowest, middle and highest level of its
 * ladder, takes a few taps, opens and closes the grown-up how-to card, and then once in portrait. It proves a game
 * loads, draws, survives stray touches and resizes without page errors, not that its rules are right (the rule tests
 * do that) or that a round can be finished (a game's own suite does that). About two seconds a level.
 */
async function smoke() {
  const games = await page.evaluate(async () => {
    const { GAMES } = await import('/src/games/registry.ts');
    const { levelsInOrder } = await import('/src/progress/difficulty.ts');
    return GAMES.map((g) => {
      const levels = [...new Set(g.bands.flatMap((b) => levelsInOrder(g.levels(b))))].sort((a, b) => a - b);
      return { id: g.id, levels: [...new Set([levels[0], levels[Math.floor(levels.length / 2)], levels.at(-1)])] };
    });
  });
  if (process.env.SMOKE_FROM !== undefined) selectValue(process.env.SMOKE_FROM, games.map(g => g.id), 'SMOKE_FROM');
  const from = process.env.SMOKE_FROM ? games.findIndex((g) => g.id === process.env.SMOKE_FROM) : 0;
  assert.ok(from >= 0, `SMOKE_FROM matched no game: ${process.env.SMOKE_FROM}`);
  const ids = selectNames(process.env.SMOKE_ONLY, games.slice(from).map(g => g.id), 'SMOKE_ONLY');
  const picked = games.slice(from).filter(g => ids.includes(g.id));
  const taps = [[512, 384], [300, 300], [720, 460], [512, 600]];
  for (const g of picked) {
    for (const level of g.levels) {
      await launch(g.id, level);
      await page.waitForTimeout(900);
      // Nothing she can touch may be stranded in the top-left corner because it was never laid out (Animal Snack's first level once left its animals there).
      const stranded = await page.evaluate(() => {
        const out = [];
        const walk = (o) => {
          if (!o.visible || o.alpha === 0) return;
          if (o.eventMode === 'static' || o.eventMode === 'dynamic') {
            const p = o.getGlobalPosition(); const b = o.getBounds();
            // At the origin, and what is drawn is there too (full-screen input layers have nothing drawn; hit areas laid out by hand have their drawing elsewhere).
            if (Math.abs(p.x) < 1 && Math.abs(p.y) < 1 && b.width * b.height > 0 && b.x + b.width / 2 < 160 && b.y + b.height / 2 < 160) out.push(o.constructor.name);
          }
          for (const c of o.children ?? []) walk(c);
        };
        for (const c of neo.scene.stage?.children ?? []) walk(c);
        return out;
      });
      assert.deepEqual(stranded, [], `${g.id} level ${level}: touchable things were never placed and sit in the top-left corner`);
      for (const [x, y] of taps) { await page.mouse.click(x, y); await page.waitForTimeout(120); }
      assert.deepEqual(errors, [], `${g.id} level ${level} raised page errors after stray taps`);
      if (await page.evaluate(() => !neo.scene.finished)) {
        await page.evaluate(() => neo.scene.openHelp());
        assert.ok(await page.evaluate(() => !!neo.scene.helpCard), `${g.id} level ${level}: the how-to card did not open`);
        const text = await page.evaluate(() => neo.scene.helpCard.info.level);
        assert.ok(text && text.length > 3, `${g.id} level ${level}: the card has no level line`);
        await page.evaluate(() => neo.scene.closeHelp());
      }
    }
    await launch(g.id, g.levels.at(-1));
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.mouse.click(384, 512); await page.waitForTimeout(150);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    assert.deepEqual(errors, [], `${g.id} raised page errors in portrait`);
    log(`Smoke: ${g.id} levels ${g.levels.join(', ')}: opened, tapped, how-to card, portrait passed`);
  }
}

return { smoke };
}
