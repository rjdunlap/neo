import { selectNames } from '../selection.mjs';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createTestContext } from '../../test-browser.mjs';

export function createSuite({ page, browser, errors, output, log, launch }) {
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
    const ids = selectNames(
      process.env.PHONE_ONLY,
      games.map((g) => g.id),
      'PHONE_ONLY',
    );
    const picked = games.filter((g) => ids.includes(g.id));
    await page.setViewportSize({ width: 844, height: 390 });
    for (const g of picked) {
      await launch(g.id, g.level);
      await page.waitForTimeout(900);
      const problems = await page.evaluate(() => {
        const out = [];
        const walk = (o, layer) => {
          if (!o.visible || o.alpha === 0) return;
          if (o.eventMode === 'static' || o.eventMode === 'dynamic') {
            const p = o.getGlobalPosition(),
              b = o.getBounds();
            if (
              layer === 'stage' &&
              Math.abs(p.x) < 1 &&
              Math.abs(p.y) < 1 &&
              b.width * b.height > 0 &&
              b.x + b.width / 2 < 160 &&
              b.y + b.height / 2 < 160
            )
              out.push(`${o.constructor.name} stranded at the origin`);
            if (
              layer === 'ui' &&
              b.width * b.height > 0 &&
              (b.x < -1 || b.y < -1 || b.x + b.width > innerWidth + 1 || b.y + b.height > innerHeight + 1)
            )
              out.push(
                `${o.constructor.name} off the window ${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}`,
              );
          }
          for (const c of o.children ?? []) walk(c, layer);
        };
        for (const c of neo.scene.stage?.children ?? []) walk(c, 'stage');
        walk(neo.scene.ui, 'ui');
        return out;
      });
      assert.deepEqual(problems, [], `${g.id} level ${g.level} at phone size`);
      for (const [x, y] of [
        [422, 195],
        [250, 250],
        [600, 150],
      ]) {
        await page.mouse.click(x, y);
        await page.waitForTimeout(120);
      }
      await page.screenshot({ path: `${output}/phone/${g.id}.jpg`, type: 'jpeg', quality: 70 });
      assert.deepEqual(errors, [], `${g.id} raised page errors at phone size`);
      log(`Phone: ${g.id} level ${g.level} opened, tapped and laid out at 844 × 390`);
    }
    await page.setViewportSize({ width: 1024, height: 768 });
  }

  // Use the bot for coordinates and send real Chromium touches, so a covered or misplaced target cannot pass.
  async function uprightGames() {
    assert.ok(process.env.PHONE_ONLY, 'uprightgames requires PHONE_ONLY=id,id');
    const phone = await createTestContext(browser, {
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    });
    try {
      const p = await phone.newPage();
      p.on('pageerror', (error) => errors.push(error.message));
      const cdp = await phone.newCDPSession(p);
      await p.bringToFront();
      await p.goto(new URL('/', process.env.GAME_URL || 'http://localhost:5173').href);
      await p.waitForFunction(() => window.neo?.scene && !neo.switching && window.kit);
      await p.evaluate(() => {
        kit.store.entry.birth = null;
        kit.store.entry.startBand = 'grownup';
        kit.store.data.profile.band = 'grownup';
        kit.store.data.creatures = {
          owned: [{ id: 'pip0', species: 'sprout', name: 'Mia', look: { color: 'pink' }, metAt: 'start' }],
          companion: 'pip0',
        };
        kit.store.save();
        neo.go.start();
      });
      await p.waitForFunction(() => neo.scene.constructor.name === 'ChooserScene' && !neo.switching);
      await p.locator('.chooser__play').first().tap();
      await p.waitForFunction(() => neo.scene.constructor.name === 'DailyScene' && !neo.switching);
      const games = await p.evaluate(async () => {
        const { GAMES } = await import('/src/games/registry.ts');
        const { levelsInOrder } = await import('/src/progress/difficulty.ts');
        kit.store.data.settings.howToCards = false;
        return GAMES.filter((g) => g.upright && g.bands.includes('grownup')).map((g) => ({
          id: g.id,
          levels: levelsInOrder(g.levels('grownup')),
        }));
      });
      const ids = selectNames(
        process.env.PHONE_ONLY,
        games.map((g) => g.id),
        'PHONE_ONLY',
      );
      for (const { id, levels } of games.filter((g) => ids.includes(g.id))) {
        for (const level of new Set([levels[0], levels.at(-1)])) {
          await p.evaluate(
            ({ id, level }) => {
              kit.store.stats(id).pinned = level;
              neo.go.game(id, 'grownup');
            },
            { id, level },
          );
          await p.waitForFunction(
            ({ id, level }) =>
              !neo.switching && neo.scene.mod?.id === id && neo.scene.level === level && !!neo.scene.game,
            { id, level },
          );
          assert.ok(await p.evaluate(() => neo.view.upright && !neo.turning && !neo.turn.visible), id);
          await p.waitForTimeout(750);
          if (level === levels.at(-1)) await p.screenshot({ path: `${output}/${id}-${level}.png` });
          const before = await p.evaluate(() => kit.store.data.stickers.length);
          const deadline = Date.now() + 90_000;
          let finished = false;
          let actions = 0;
          while (!finished && Date.now() < deadline) {
            const step = await p.evaluate(() => {
              if (neo.scene.finished) return { finished: true };
              // Hat Band's encore is timed to the beat. Its layout check ends when Check starts the performance.
              if (neo.scene.mod.id === 'hat-band' && neo.scene.game.arrange.playing === 'check')
                return { performance: true };
              const move = neo.scene.game.autotouch?.();
              if (!move) return null;
              const at = ({ on, x = 0, y = 0 }) => {
                const p = on.toGlobal({ x, y });
                return { x: p.x, y: p.y };
              };
              if (move.tap) return { points: [at(move.tap)], pause: move.pause };
              if (move.trace) return { points: [at(move.trace), ...move.via.map(at)], pause: move.pause };
              throw new Error('Expected a tap or trace from the grown-up game');
            });
            if (step?.performance) break;
            if (step?.finished) {
              finished = true;
            } else if (step) {
              const [start, ...via] = step.points;
              assert.ok(
                step.points.every(({ x, y }) => x >= 0 && x < 390 && y >= 0 && y < 844),
                `${id} ${level}: ${JSON.stringify(step)}`,
              );
              if (via.length === 0) {
                await p.touchscreen.tap(start.x, start.y);
              } else {
                await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
                let from = start;
                for (const to of via) {
                  for (let k = 1; k <= 5; k++) {
                    const x = from.x + ((to.x - from.x) * k) / 5;
                    const y = from.y + ((to.y - from.y) * k) / 5;
                    await cdp.send('Input.dispatchTouchEvent', {
                      type: 'touchMove',
                      touchPoints: [{ x, y }],
                    });
                  }
                  from = to;
                }
                await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
              }
              actions++;
              await p.waitForTimeout(1000 * (step.pause ?? 0.35));
            } else {
              await p.waitForTimeout(100);
            }
          }
          if (id === 'hat-band' && !finished) {
            assert.ok(await p.evaluate(() => neo.scene.game.arrange.playing === 'check'), 'Hat Band Check');
            log(`Upright: ${id} level ${level} reached Check in ${actions} touches`);
            continue;
          }
          assert.ok(finished, `${id} ${level} did not finish in 90 seconds after ${actions} touches`);
          assert.equal(await p.evaluate(() => kit.store.data.stickers.length), before + 1, id);
          assert.equal(await p.evaluate(() => kit.store.data.stickers.at(-1).game), id);
          log(`Upright: ${id} level ${level} completed in ${actions} touches with one sticker`);
        }
      }
    } finally {
      await phone.close();
    }
  }

  return { phoneGames, uprightGames };
}
