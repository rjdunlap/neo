import { selectNames } from '../selection.mjs';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

export function createSuite({ page, errors, output, log, scene, screenshot, launch }) {
/**
 * Every game at a phone held sideways (844 × 390, about half the iPad's size): its middle level opens, takes a few taps, has nothing
 * touchable stranded at the origin or left outside the window on its UI layer, and leaves a screenshot in test-results/browser/phone/
 * to look at. `PHONE_ONLY=id,id` filters. Proves the layout holds at the widest shape the games have been given (about 2.2 to 1),
 * not that a small hand can use it. About three seconds a game.
 */
async function phoneGames() {
  await mkdir(`${output}/phone`, { recursive: true });
  const games = await page.evaluate(async () => {
    const { GAMES } = await import('/src/games/registry.ts');
    const { levelsInOrder } = await import('/src/progress/difficulty.ts');
    return GAMES.map((g) => {
      const levels = [...new Set(g.bands.flatMap((b) => levelsInOrder(g.levels(b))))].sort((a, b) => a - b);
      return { id: g.id, level: levels[Math.floor(levels.length / 2)] };
    });
  });
  const ids = selectNames(process.env.PHONE_ONLY, games.map(g => g.id), 'PHONE_ONLY');
  const picked = games.filter(g => ids.includes(g.id));
  await page.setViewportSize({ width: 844, height: 390 });
  for (const g of picked) {
    await launch(g.id, g.level);
    await page.waitForTimeout(900);
    const problems = await page.evaluate(() => {
      const out = [];
      const walk = (o, layer) => {
        if (!o.visible || o.alpha === 0) return;
        if (o.eventMode === 'static' || o.eventMode === 'dynamic') {
          const p = o.getGlobalPosition(), b = o.getBounds();
          if (layer === 'stage' && Math.abs(p.x) < 1 && Math.abs(p.y) < 1 && b.width * b.height > 0 && b.x + b.width / 2 < 160 && b.y + b.height / 2 < 160) out.push(`${o.constructor.name} stranded at the origin`);
          if (layer === 'ui' && b.width * b.height > 0 && (b.x < -1 || b.y < -1 || b.x + b.width > innerWidth + 1 || b.y + b.height > innerHeight + 1)) out.push(`${o.constructor.name} off the window ${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}`);
        }
        for (const c of o.children ?? []) walk(c, layer);
      };
      for (const c of neo.scene.stage?.children ?? []) walk(c, 'stage');
      walk(neo.scene.ui, 'ui');
      return out;
    });
    assert.deepEqual(problems, [], `${g.id} level ${g.level} at phone size`);
    for (const [x, y] of [[422, 195], [250, 250], [600, 150]]) { await page.mouse.click(x, y); await page.waitForTimeout(120); }
    await page.screenshot({ path: `${output}/phone/${g.id}.jpg`, type: 'jpeg', quality: 70 });
    assert.deepEqual(errors, [], `${g.id} raised page errors at phone size`);
    log(`Phone: ${g.id} level ${g.level} opened, tapped and laid out at 844 × 390`);
  }
  await page.setViewportSize({ width: 1024, height: 768 });
}

return { phoneGames };
}
