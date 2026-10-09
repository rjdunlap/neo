// Opens each game's how-to card and leaves it at a random moment (by the map, Back or Play), over and over, and prints any page
// error with its stack. It finds the rare fault where a game's `await` is ready in the very frame its objects are destroyed.
//
//   npm run dev                                   # in another terminal
//   GAME_URL=http://localhost:5173 node scripts/abandon-cards.mjs
//   GAME_ONLY=frog-hop,ferry-jam ROUNDS=9 node scripts/abandon-cards.mjs
//
// ROUNDS (default 3) is how many times every game is opened; 13 games at 9 rounds takes about 20 minutes.
import { chromium } from 'playwright';

const only = process.env.GAME_ONLY?.split(',');
const rounds = Number(process.env.ROUNDS || 3);
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' })).newPage();
const errors = [];
page.on('pageerror', (e) => {
  errors.push(e.stack || e.message);
  console.log('PAGE ERROR', (e.stack || e.message).split('\n').slice(0, 8).join('\n'));
});
await page.goto(process.env.GAME_URL || 'http://localhost:5173');
await page.waitForFunction(() => window.neo?.scene && !neo.switching && window.kit);
const games = await page.evaluate(async () => (await import('/src/games/registry.ts')).GAMES.map((g) => ({ id: g.id, band: g.bands.at(-1), levels: g.levels(g.bands.at(-1)), demo: !!g.touchDemo })));
const picked = games.filter((g) => (only ? only.includes(g.id) : g.demo));
await page.evaluate(() => {
  kit.store.data.profile.name = 'Mia'; kit.store.data.settings.howToCards = true;
});
let opened = 0;
for (let r = 0; r < rounds; r++) {
  for (const g of picked) {
    const level = g.levels.min + Math.floor(Math.random() * (g.levels.max - g.levels.min + 1));
    await page.evaluate(({ id, band, level }) => { kit.store.data.profile.band = band; kit.store.stats(id).pinned = level; neo.go.game(id, band); }, { id: g.id, band: g.band, level });
    await page.waitForFunction((id) => !neo.switching && neo.scene.mod?.id === id, g.id).catch(() => {});
    await page.waitForTimeout(100 + Math.random() * 2500);
    opened++;
    const how = opened % 3;
    if (how === 0) await page.evaluate(() => neo.go.hub());
    else if (how === 1) await page.evaluate(() => neo.scene.helpCard?.intro?.back?.());
    else await page.evaluate(() => neo.scene.helpCard?.intro?.play?.());
    await page.waitForTimeout(150 + Math.random() * 400);
  }
}
console.log(`opened ${opened} cards, ${errors.length} page errors`);
await browser.close();
process.exit(errors.length ? 1 : 0);
