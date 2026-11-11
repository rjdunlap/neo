// How long a tap takes to become a new screen, and how long "Who's playing?" takes to show its cards (U7 R1,
// docs/definitions/never-swallow-a-tap.md). Reads the app's `u7:*` performance marks (src/engine/timing.ts), with speech off,
// on an upright phone (390 × 844, touch) and a computer (1024 × 768, mouse), three times each, and prints the medians.
//
//   VITE_SPEECH=off npx vite --port 5191 --strictPort   # in another terminal
//   GAME_URL=http://localhost:5191 node scripts/tap-timing.mjs
//
// Dev server only (it drives the app through `neo` and `kit`); module loading there is unbundled, so the load figures are
// for comparing before and after, not a phone's real launch. About a minute.
import { mkdir, writeFile } from 'node:fs/promises';
import { launchTestBrowser, createTestContext } from './test-browser.mjs';

const base = new URL('/', process.env.GAME_URL || 'http://localhost:5173').href;
const runs = Number(process.env.RUNS || 3);
const shapes = {
  phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  computer: { viewport: { width: 1024, height: 768 }, deviceScaleFactor: 2 },
};
const browser = await launchTestBrowser();
const results = {};
const add = (shape, what, ms) => (results[`${shape} ${what}`] ??= []).push(Math.round(ms));

/** Milliseconds from the latest `u7:tap` to each later mark. */
const since = (p) =>
  p.evaluate(() => {
    const at = (n) => performance.getEntriesByName(`u7:${n}`).at(-1)?.startTime;
    const tap = at('tap');
    return Object.fromEntries(['show', 'init', 'frame', 'settled'].map((n) => [n, at(n) - tap]));
  });
const settledAfterTap = (p) =>
  p.waitForFunction(
    () => {
      const at = (n) => performance.getEntriesByName(`u7:${n}`).at(-1)?.startTime ?? -1;
      return at('settled') > at('tap') && !neo.switching;
    },
    null,
    { timeout: 15000 },
  );
const record = async (p, shape, what) => {
  await settledAfterTap(p);
  const t = await since(p);
  add(shape, `${what}: change starts`, t.show);
  add(shape, `${what}: first frame`, t.frame);
  add(shape, `${what}: settled`, t.settled);
  add(shape, `${what}: next scene built (init)`, t.init - t.show);
};
const markTap = (p) =>
  p.evaluate(() => {
    performance.clearMarks('u7:tap');
    performance.mark('u7:tap');
  });

for (const [shape, options] of Object.entries(shapes)) {
  const context = await createTestContext(browser, options);
  const p = await context.newPage();
  p.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  const cdp = await context.newCDPSession(p);
  await p.goto(base);
  await p.waitForFunction(() => window.neo?.scene && !neo.switching && window.kit);
  await p.evaluate(() => {
    kit.store.data.settings.howToCards = false;
    kit.store.data.creatures = {
      owned: [{ id: 'pip0', species: 'sprout', name: 'Mia', look: { color: 'pink' }, metAt: 'start' }],
      companion: 'pip0',
    };
    kit.store.data.profile.band = 'toddler';
    kit.store.save();
  });
  await p.waitForTimeout(500);
  for (let i = 0; i < runs; i++) {
    // The chooser on load: cold (no cache) and warm. Cards are timed from navigation start and from the first screen shown.
    for (const load of ['cold', 'warm']) {
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: load === 'cold' });
      await p.reload();
      await p.waitForFunction(() => performance.getEntriesByName('u7:cards').length > 0, null, {
        timeout: 30000,
      });
      const t = await p.evaluate(() => ({
        cards: performance.getEntriesByName('u7:cards')[0].startTime,
        show: performance.getEntriesByName('u7:show')[0]?.startTime ?? NaN,
      }));
      add(shape, `chooser ${load} load: cards from page start`, t.cards);
      add(shape, `chooser ${load} load: cards from first screen`, t.cards - t.show);
    }
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
    await p.waitForFunction(() => neo.scene.constructor.name === 'ChooserScene' && !neo.switching);
    await p.waitForTimeout(500);
    // The first tap: a card on "Who's playing?" to the next screen (Today's six on a phone, Home on a computer).
    await p
      .locator('.chooser__play')
      .first()
      .tap({ force: true })
      .catch(() => p.locator('.chooser__play').first().click());
    await record(p, shape, 'chooser pick');
    await p.evaluate(() => kit.store.data.settings && (kit.store.data.settings.howToCards = false));
    if (shape === 'computer') {
      // The tablet root's Home → Explore → the Arcade route.
      await p.waitForTimeout(600);
      await p.evaluate(() => neo.scene.constructor.name === 'HomeScene' || neo.go.hub());
      await p.waitForFunction(() => neo.scene.constructor.name === 'HomeScene' && !neo.switching);
      await p.waitForTimeout(600);
      await p.evaluate(() => kit.tapOn(neo.scene.explore));
      await p.waitForFunction(() => neo.scene.constructor.name === 'ExploreScene');
      await record(p, shape, 'Home → Explore');
      await p.waitForTimeout(600);
      await p.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => c.entry === 'arcade').node));
      await p.waitForFunction(() => neo.scene.constructor.name === 'ArcadeScene');
      await record(p, shape, 'Explore → the Arcade');
      await p.waitForTimeout(600);
      await p.evaluate(() => neo.go.daily());
      await p.waitForFunction(() => neo.scene.constructor.name === 'DailyScene' && !neo.switching);
    }
    await p.waitForFunction(() => neo.scene.constructor.name === 'DailyScene' && !neo.switching);
    await p.waitForTimeout(600);
    // Today's six → a game, then the game's result → Today's six.
    await p.evaluate(() => kit.tapOn(neo.scene.cards[0].node));
    await record(p, shape, "Today's six → a game");
    await p.waitForTimeout(600);
    await p.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
    await p.waitForFunction(() => neo.scene.after?.home && !neo.scene.navigating, null, { timeout: 15000 });
    await p.waitForTimeout(900);
    await markTap(p);
    await p.evaluate(() => neo.scene.after.home.press());
    await record(p, shape, "a result → Today's six");
    await p.waitForTimeout(400);
    await p.evaluate(() => neo.go.start());
    await p.waitForFunction(() => neo.scene.constructor.name === 'ChooserScene' && !neo.switching);
  }
  await context.close();
}
await browser.close();

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const lines = Object.entries(results).map(([k, xs]) => `${k}: ${median(xs)} ms (${xs.join(', ')})`);
console.log(lines.join('\n'));
await mkdir('test-results', { recursive: true });
await writeFile(`test-results/tap-timing-${process.env.LABEL || 'run'}.txt`, lines.join('\n') + '\n');
