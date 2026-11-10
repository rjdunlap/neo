import { selectNames } from '../selection.mjs';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
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
              // A carried piece rides `lift` units above the finger, so the finger lands that far below the spot.
              if (move.drag)
                return {
                  points: [at(move.drag), at({ ...move.to, y: (move.to.y ?? 0) + (move.lift ?? 40) })],
                  pause: move.pause,
                };
              throw new Error('Expected a tap, trace or drag from the grown-up game');
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

  /**
   * The upright sweep (chunk 31, docs/definitions/phone-portrait.md): every early-school game that is not yet upright-ready,
   * at its top school level on a 390 × 844 touch phone, with the dev server's `?uprightall` lifting the turn prompt. Each
   * game's touchable objects are measured in units (at least 100, inside the view, clear of Home, "?" and the guide) and
   * sorted: fits as is (no problem), small fix (one to three targets wrong), needs a layout, or look (no separate
   * target to measure: judge the screenshot). Writes a screenshot per game,
   * sweep.json and contact-sheet.jpg into test-results/browser/upright-sweep/. A survey, not a gate: it fails only when the
   * prompt shows; a game that cannot open (a layout that returns null on the upright area) is listed as such and the page
   * reloads. `PHONE_ONLY=id,id` filters. About three seconds a game.
   */
  async function uprightSweep() {
    const dir = `${output}/upright-sweep`;
    await mkdir(dir, { recursive: true });
    const phone = await createTestContext(browser, {
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    });
    const rows = [];
    try {
      const p = await phone.newPage();
      const pageErrors = [];
      p.on('pageerror', (error) => pageErrors.push(error.message));
      // A school player's Today's six on the dev server's `?uprightall`; again after a game that could not open.
      const open = async () => {
        await p.goto(new URL('/?uprightall', process.env.GAME_URL || 'http://localhost:5173').href);
        await p.waitForFunction(() => window.neo?.scene && !neo.switching && window.kit);
        await p.evaluate(() => {
          kit.store.entry.birth = null;
          kit.store.entry.startBand = 'school';
          kit.store.data.profile.band = 'school';
          kit.store.data.creatures = {
            owned: [{ id: 'pip0', species: 'sprout', name: 'Mia', look: { color: 'pink' }, metAt: 'start' }],
            companion: 'pip0',
          };
          kit.store.data.settings.howToCards = false;
          kit.store.save();
          neo.go.start();
        });
        await p.waitForFunction(() => neo.scene.constructor.name === 'ChooserScene' && !neo.switching);
        await p.locator('.chooser__play').first().tap();
        await p.waitForFunction(() => neo.scene.constructor.name === 'DailyScene' && !neo.switching);
      };
      await open();
      const games = await p.evaluate(async () => {
        const { GAMES } = await import('/src/games/registry.ts');
        const { levelsInOrder } = await import('/src/progress/difficulty.ts');
        kit.store.data.settings.howToCards = false;
        return GAMES.filter((g) => !g.upright && g.bands.includes('school')).map((g) => ({
          id: g.id,
          level: levelsInOrder(g.levels('school')).at(-1),
        }));
      });
      const ids = selectNames(
        process.env.PHONE_ONLY,
        games.map((g) => g.id),
        'PHONE_ONLY',
      );
      for (const { id, level } of games.filter((g) => ids.includes(g.id))) {
        pageErrors.length = 0;
        await p.evaluate(
          ({ id, level }) => {
            kit.store.stats(id).pinned = level;
            neo.go.game(id, 'school');
          },
          { id, level },
        );
        // A game that does not open is recorded and the sweep goes on: this is a survey.
        const opened = await p
          .waitForFunction(
            ({ id, level }) =>
              !neo.switching && neo.scene.mod?.id === id && neo.scene.level === level && !!neo.scene.game,
            { id, level },
            { timeout: 15_000 },
          )
          .then(() => true)
          .catch(() => false);
        if (!opened) {
          const at = await p.evaluate(
            () => `${neo.scene.constructor.name} ${neo.scene.mod?.id} ${neo.scene.level}`,
          );
          rows.push({ id, level, verdict: 'did not open', at, errors: [...pageErrors] });
          log(`Upright sweep: ${id} level ${level} did not open (${at}) ${pageErrors.join('; ')}`);
          await open();
          continue;
        }
        assert.ok(
          await p.evaluate(() => neo.view.upright && !neo.turning && !neo.turn.visible),
          `${id}: turn prompt`,
        );
        // Long enough for an opening tween to settle: a target mid-slide measures smaller or outside.
        await p.waitForTimeout(1800);
        const found = await p.evaluate(() => {
          const s = neo.view.scale;
          const vw = neo.view.w,
            vh = neo.view.h;
          const keepOut = [
            { what: 'Home and help', x0: 0, y0: 0, x1: 115, y1: 210 },
            { what: 'the guide', x0: 0, y0: vh - 170, x1: 150, y1: vh },
          ];
          const targets = [];
          const walk = (o) => {
            if (!o.visible || o.alpha === 0 || o.renderable === false) return;
            if ((o.eventMode === 'static' || o.eventMode === 'dynamic') && !o.destroyed) {
              const b = o.getBounds();
              const box = { x0: b.x / s, y0: b.y / s, x1: (b.x + b.width) / s, y1: (b.y + b.height) / s };
              const w = box.x1 - box.x0,
                h = box.y1 - box.y0;
              // A whole-screen catcher (a drawing surface, a backdrop that takes taps) is not a target to measure.
              if (w * h > 0 && !(w > vw * 0.7 && h > vh * 0.5)) targets.push(box);
            }
            for (const c of o.children ?? []) walk(c);
          };
          for (const c of neo.scene.stage?.children ?? []) walk(c);
          const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
          const wrong = { small: 0, outside: 0, chrome: 0 };
          let bad = 0,
            smallest = Infinity;
          for (const t of targets) {
            const side = Math.min(t.x1 - t.x0, t.y1 - t.y0);
            smallest = Math.min(smallest, side);
            const small = side < 99,
              outside = t.x0 < -1 || t.y0 < -1 || t.x1 > vw + 1 || t.y1 > vh + 1,
              chrome = keepOut.some((k) => hit(t, k));
            if (small) wrong.small++;
            if (outside) wrong.outside++;
            if (chrome) wrong.chrome++;
            if (small || outside || chrome) bad++;
          }
          return {
            view: `${Math.round(vw)} × ${Math.round(vh)}`,
            targets: targets.length,
            bad,
            wrong,
            smallest: targets.length ? Math.round(smallest) : null,
          };
        });
        // A game that takes touches on the whole screen (a drag surface, a scene of moving things) has nothing to measure:
        // its screenshot is the evidence.
        const verdict =
          found.targets === 0
            ? 'look'
            : found.bad === 0
              ? 'fits'
              : found.bad <= 3
                ? 'small fix'
                : 'needs a layout';
        await p.screenshot({ path: `${dir}/${id}.jpg`, type: 'jpeg', quality: 60 });
        rows.push({ id, level, verdict, ...found, errors: [...pageErrors] });
        log(
          `Upright sweep: ${id} level ${level}: ${verdict} (${found.targets} targets, ${found.bad} wrong, smallest ${found.smallest})`,
        );
      }
      await writeFile(`${dir}/sweep.json`, JSON.stringify(rows, null, 2));
      // The contact sheet: every screenshot at a third of its size, grouped by verdict, each labelled with its numbers.
      const order = ['fits', 'small fix', 'needs a layout', 'look', 'did not open'];
      const html = order
        .map((v) => {
          const list = rows.filter((r) => r.verdict === v);
          return `<h2>${v} (${list.length})</h2><div class="g">${list
            .map(
              (r) =>
                `<figure><img src="${r.id}.jpg"><figcaption><b>${r.id}</b> ${r.level}<br>${r.targets} targets, ${r.bad} wrong, min ${r.smallest ?? '–'}</figcaption></figure>`,
            )
            .join('')}</div>`;
        })
        .join('');
      await writeFile(
        `${dir}/contact-sheet.html`,
        `<style>body{font:12px system-ui;margin:8px}.g{display:flex;flex-wrap:wrap;gap:6px}figure{margin:0;width:130px}img{width:130px;height:281px;object-fit:cover;border:1px solid #999}figcaption{line-height:1.2}h2{margin:10px 0 4px}</style>${html}`,
      );
      // On the phone's own page (a second page in this browser cannot be captured): the sweep is over by now.
      const sheet = p;
      await sheet.goto(pathToFileURL(resolve(`${dir}/contact-sheet.html`)).href);
      const tall = await sheet.evaluate(() => document.documentElement.scrollHeight);
      await sheet.setViewportSize({ width: 1400, height: Math.min(tall, 16_000) });
      await sheet.screenshot({ path: `${dir}/contact-sheet.jpg`, type: 'jpeg', quality: 70 });
      const tally = order.map((v) => `${rows.filter((r) => r.verdict === v).length} ${v}`).join(', ');
      log(
        `Upright sweep: ${rows.length} early-school games: ${tally}; contact sheet in ${dir}/contact-sheet.jpg`,
      );
    } finally {
      await phone.close();
    }
  }

  return { phoneGames, uprightGames, uprightSweep };
}
