import { selectValue } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, log, ready, scene, tap, screenshot, launch, finished, useCompanion }) {
  async function fourth() {
    const only = process.env.FOURTH_ONLY;
    if (only !== undefined)
      selectValue(
        only,
        ['song', 'puzzle', 'weather', 'sink', 'sink7', 'sink-fresh', 'sink10'],
        'FOURTH_ONLY',
      );
    // Song Maker: free play loops, copying by shadows, a card, a pattern, and by ear.
    if (!only || only === 'song')
      for (let level = 1; level <= 7; level++) {
        await launch('song-maker', level);
        await page.waitForTimeout(600);
        await page.evaluate(async () => {
          const g = neo.scene.game;
          if (g.plan.mode === 'free') {
            for (let i = 0; i < g.plan.notes; i++) {
              kit.tapOn(g.beads[(i * 5) % g.beads.length]);
              await kit.sleep(220);
            }
            return;
          }
          if (!(await kit.until(() => !g.listening, 15000))) throw new Error('Tune never finished');
          const isNote = (b) => g.song.notes.some((n) => n.col === b.note.col && n.row === b.note.row);
          const wrong = g.beads.find(
            (b) => !isNote(b) && !b.given && g.song.notes.some((n) => n.col === b.note.col),
          );
          for (let i = 0; i < 2; i++) {
            kit.tapOn(wrong);
            await kit.sleep(250);
          }
          if (g.hints !== 1) throw new Error('Song hint missing');
        });
        if ([1, 5, 6, 7].includes(level)) await screenshot(`song-maker-${level}`);
        await page.evaluate(async () => {
          const g = neo.scene.game;
          for (const n of [...g.remaining]) {
            kit.tapOn(g.beads.find((b) => b.note.col === n.col && b.note.row === n.row));
            await kit.sleep(250);
          }
        });
        await finished('song-maker');
        const r = await page.evaluate(() => {
          const r = kit.store.stats('song-maker').history.at(-1);
          return [r.misses, r.hints];
        });
        assert.deepEqual(r, level <= 2 ? [0, 0] : [2, 1], `song ${level} score`);
        log(`Song Maker ${level}: loop, mistakes, hint, saved round and sticker passed`);
      }

    // Puzzle Pals: exploring off the frame is free; a wrong place is a gentle miss.
    if (!only || only === 'puzzle')
      for (const level of process.env.PUZZLE_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6, 7]) {
        await launch('puzzle-pals', level);
        await page.waitForTimeout(600);
        await page.evaluate(() => {
          window.slotAt = (p) => {
            const g = neo.scene.game;
            return {
              x: g.board.x + (600 / g.plan.cols) * (p.col + 0.5) * g.scale,
              y: g.board.y + (420 / g.plan.rows) * (p.row + 0.5) * g.scale + 40,
            };
          };
        });
        await page.evaluate(async () => {
          const g = neo.scene.game;
          const waiting = g.pieces.filter((p) => !p.placed);
          await kit.dragTo(waiting[0].node, { x: 200, y: 140 });
          await kit.sleep(600);
          if (g.misses !== 0) throw new Error('Drop off the frame counted as a miss');
          const other = waiting.find((p) => p !== waiting[0]);
          if (other)
            for (let i = 0; i < 2; i++) {
              await kit.dragTo(waiting[0].node, slotAt(other.piece));
              await kit.sleep(600);
            }
        });
        if (level > 1)
          await page.evaluate(async () => {
            const g = neo.scene.game;
            const { hintPiece, whereWords } = await import('/src/games/puzzle-pals/logic.ts');
            const expected = hintPiece(
              g.plan,
              g.pieces.filter((p) => p.placed).map((p) => p.piece),
            );
            if (JSON.stringify(g.hinted?.piece) !== JSON.stringify(expected))
              throw new Error('Hint does not choose the next useful piece');
            if (g.hints !== 1 || g.glow.eventMode !== 'none')
              throw new Error('Hint accounting or touch clearance is wrong');
            const pos = whereWords(g.plan, g.hinted.piece);
            if (!['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left', 'right'].includes(pos))
              throw new Error('First hint is not a corner');
          });
        if (level === 7) {
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(500);
          await screenshot('puzzle-pals-7-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(500);
        }
        await page.evaluate(async () => {
          const g = neo.scene.game;
          for (const p of g.pieces.filter((p) => !p.placed)) {
            await kit.dragTo(p.node, slotAt(p.piece));
            await kit.sleep(450);
            if (!p.placed) throw new Error('Piece rejected its own place');
          }
        });
        await page.waitForTimeout(900);
        if (level === 4) await screenshot('puzzle-pals-alive');
        await finished('puzzle-pals');
        const r = await page.evaluate(() => {
          const r = kit.store.stats('puzzle-pals').history.at(-1);
          return [r.misses, r.hints];
        });
        assert.deepEqual(r, level === 1 ? [0, 0] : [2, 1], `puzzle ${level} score`);
        log(
          `Puzzle Pals ${level}: exploring, mistakes, hint, the picture coming alive, and a sticker passed`,
        );
      }

    // Weather Wardrobe: free weather play, then dressing and packing.
    // WARDROBE_SPECIES=river|glider dresses that species instead of the hatched sprout (RW05 slice 2b: only what it can wear).
    if (process.env.WARDROBE_SPECIES && (!only || only === 'weather'))
      await useCompanion(process.env.WARDROBE_SPECIES);
    if (!only || only === 'weather')
      for (const level of [1, 2, 3, 4, 5, 6, 8]) {
        await launch('weather-wardrobe', level);
        await page.waitForTimeout(700);
        await page.evaluate(async () => {
          const g = neo.scene.game;
          if (g.plan.mode === 'play') {
            // Every touch answers: the grass bursts and a worn item says its name, neither changing the weather.
            await kit.until(() => g.worn.size === 2, 3000);
            kit.tap(120, innerHeight - 40);
            await kit.sleep(150);
            if (!g.bursts.length || g.weather !== 'sunny') throw new Error('Wardrobe grass did not answer');
            const [item, [worn]] = [...g.worn][0];
            const at = worn.toGlobal(g.wornCenters.get(item));
            kit.tap(at.x, at.y);
            await kit.sleep(300);
            if (g.named !== 1 || g.weather !== 'sunny') throw new Error('Wardrobe worn item was not named');
            // Seven sky taps end free play once all four weathers have shown (wind came last, slice 7).
            for (let i = 0; i < 7; i++) {
              kit.tap(500, 200);
              await kit.sleep(600);
            }
            if (!g.done) throw new Error('Wardrobe free play did not end after seven sky taps');
            return;
          }
          const wrong = g.options.find((o) => !g.outfit.needed.includes(o.item));
          for (let i = 0; i < (g.plan.mode === 'try' ? 1 : 2); i++) {
            kit.tapOn(wrong.node);
            await kit.sleep(100);
            if (!g.busy) throw new Error('No misfit shown');
            await kit.until(() => !g.busy, 3000);
            await kit.sleep(50);
          }
          if (g.plan.mode === 'try' ? g.hints !== 0 || g.misses !== 0 : g.hints !== 1)
            throw new Error('Wardrobe hint/miss accounting wrong');
        });
        if ([1, 4, 6, 8].includes(level)) await screenshot(`weather-wardrobe-${level}`);
        await page.evaluate(async () => {
          const g = neo.scene.game;
          for (let step = 0; !g.done && step < 30; step++) {
            await kit.until(() => !g.busy || g.done, 15000);
            if (g.done) break;
            const o = g.options.find((o) => !o.used && g.outfit.needed.includes(o.item));
            if (o) kit.tapOn(o.node);
            await kit.sleep(450);
          }
        });
        await finished('weather-wardrobe');
        const r = await page.evaluate(() => {
          const r = kit.store.stats('weather-wardrobe').history.at(-1);
          return [r.misses, r.hints];
        });
        assert.deepEqual(r, level === 1 || level === 8 ? [0, 0] : [2, 1], `wardrobe ${level} score`);
        log(`Weather Wardrobe ${level}: weather, dressing, mistakes, hint, saved round and sticker passed`);
      }

    // Sink or Float: guesses are never misses; wrong sorts are tested in the water. Level 7 (FOURTH_ONLY=sink7 alone):
    // flat and leaky clay sink as experiments, the boat glows after them (one hint), the second lump floats by controller keys.
    // FOURTH_ONLY=sink-fresh plays levels 4 and 6 on rounds that hold one of the fresh things, with a portrait of the tank.
    const fresh = { 4: ['feather', 'marble'], 6: ['log', 'ice', 'paperclip'] };
    if (!only || only === 'sink' || only === 'sink7' || only === 'sink-fresh')
      for (const level of only === 'sink7'
        ? [7]
        : only === 'sink-fresh'
          ? [4, 6]
          : (process.env.SINK_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6, 7])) {
        for (let tries = 0; ; tries++) {
          await launch('sink-float', level);
          await page.waitForTimeout(700);
          if (only !== 'sink-fresh') break;
          const things = await page.evaluate(() => neo.scene.game.items.map((i) => i.thing));
          if (things.some((t) => fresh[level].includes(t))) {
            log(`Sink or Float ${level} round: ${things.join(', ')}`);
            break;
          }
          if (tries > 12) throw new Error(`no fresh thing at level ${level}`);
        }
        if (level === 12) {
          // The lap level (SINK_LEVELS=12): a portrait of the one big thing waiting over the water.
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(500);
          await screenshot('sink-float-12-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(300);
        }
        const boatAt = await page.evaluate(async () => {
          const g = neo.scene.game;
          if (g.plan.mode === 'shape') {
            const tile = (s) => g.tiles.find((t) => t.shape === s).node;
            for (const s of ['flat', 'leaky']) {
              await kit.until(() => g.choosing, 30000);
              await kit.sleep(100);
              kit.tapOn(tile(s));
              await kit.sleep(300);
            }
            await kit.until(() => g.choosing, 30000);
            if (g.sunk !== 2 || g.hints !== 1 || g.misses !== 0)
              throw new Error(`clay trials: sunk ${g.sunk}, hints ${g.hints}, misses ${g.misses}`);
            return -1;
          }
          const floats = { duck: 1, boat: 1, ball: 1, feather: 1, leaf: 1, apple: 1, log: 1, ice: 1 };
          const basket = (f) => ({
            x: neo.view.w * 0.87,
            y: (f ? neo.view.h * 0.3 : neo.view.h * 0.56) + 40,
          });
          if (g.plan.mode === 'hold') {
            // Level 12, the lap level: one big thing waits over the water; a touch anywhere drops it at once, a touch on the
            // water splashes, and the next thing comes only because she touched.
            const at = (x, y) => {
              const p = g.ctx.stage.toGlobal({ x, y });
              kit.tap(p.x, p.y);
            };
            if (!(await kit.until(() => g.holding, 5000))) throw new Error('nothing held over the water');
            const first = g.holding;
            await kit.sleep(2500);
            if (g.holding !== first || first.done) throw new Error('the held thing dropped by itself');
            at(neo.view.w * 0.5, neo.view.h * 0.9);
            if (!first.done || g.holding)
              throw new Error('a touch on the counter did not drop the held thing');
            const t = g.tank;
            at((t.l + t.r) / 2, (t.surface + t.bottom) / 2);
            if (g.items.filter((i) => i.done).length !== 1)
              throw new Error('a touch on the water dropped another thing');
            if (!(await kit.until(() => g.holding && g.holding !== first, 3000)))
              throw new Error('the next thing never came after her drop');
            for (let k = 1; k < g.items.length; k++) {
              if (!(await kit.until(() => g.holding, 3000))) throw new Error(`thing ${k + 1} never came`);
              at(neo.view.w * 0.5, neo.view.h * 0.9);
              await kit.sleep(250);
            }
            return;
          }
          if (g.plan.mode === 'drop' || g.plan.mode === 'say') {
            for (const i of [...g.items]) {
              kit.tapOn(i.node);
              await kit.sleep(450);
            }
            return;
          }
          if (g.plan.mode === 'guess') {
            for (let k = 0; k < g.items.length; k++) {
              await kit.until(() => g.guessing || g.finished, 20000);
              if (g.finished) break;
              const t0 = performance.now();
              kit.tapOn(g.floatButton);
              await kit.sleep(300);
              await kit.until(() => g.guessing || g.finished || g.current > k, 20000);
              // U7 R4: the reaction to her guess (2.4 s when muted) never holds the next thing. The splash (up to
              // about 2 s), the water's own line (2.4 s, held) and a 0.4 s beat; with the reaction awaited, 7 s.
              const took = performance.now() - t0;
              if (k === 0 && took > 5600)
                throw new Error(`the next thing waited ${Math.round(took)} ms after a guess`);
            }
            return;
          }
          for (let i = 0; i < 2; i++) {
            const wrong = g.items.find((i) => !i.done);
            await kit.dragTo(wrong.node, basket(!floats[wrong.thing]));
            await kit.sleep(300);
            await kit.until(() => !g.busy, 20000);
          }
          for (const i of g.items.filter((i) => !i.done)) {
            await kit.dragTo(i.node, basket(!!floats[i.thing]));
            await kit.sleep(450);
          }
        });
        if (boatAt === -1) {
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(400);
          await screenshot('sink-float-7-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(400);
          await page.evaluate(async () => {
            const g = neo.scene.game;
            kit.tapOn(g.tiles.find((t) => t.shape === 'boat').node);
            await kit.until(() => g.experiment === 1 && g.choosing, 40000);
          });
          // Island keys reach control() only on couch levels (controllerLevels), so drive the three-tile ring directly.
          await page.evaluate(async () => {
            const g = neo.scene.game;
            const { idle } = await import('/src/engine/controller.ts');
            const press = (f) => {
              const c = idle();
              f(c.players[0]);
              g.control(c, 0.016);
            };
            for (let i = 0; i < 2; i++) press((p) => (p.direction = 2));
            for (let i = 0; i < g.experiments[1].order.indexOf('boat'); i++) press((p) => (p.direction = 0));
            press((p) => (p.action = true));
          });
          await page.waitForFunction(() => neo.scene.game.clayShape === 'boat', null, { timeout: 5000 });
        }
        await page.waitForTimeout(1000);
        if (only === 'sink-fresh' && level === 6) {
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(500);
          await screenshot('sink-float-fresh-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(300);
        } else if ([2, 3, 5].includes(level)) await screenshot(`sink-float-${level}`);
        await finished('sink-float');
        const r = await page.evaluate(() => {
          const r = kit.store.stats('sink-float').history.at(-1);
          return [r.misses, r.hints];
        });
        assert.deepEqual(
          r,
          level === 4 || level === 5 ? [2, 1] : level === 7 ? [0, 1] : [0, 0],
          `sink ${level} score`,
        );
        log(`Sink or Float ${level}: splashes, guesses, sorting, saved round and sticker passed`);
      }

    // Sink or Float 10, Salty or fresh (FOURTH_ONLY=sink10 alone): part 1 watched, then a tank tap before the eggs settle is
    // ignored, two wrong tanks on the first egg question bring the glow (one hint), the other questions answered right, the
    // last (the duck) through the two-tank ring by direct control() calls. Portrait with the eggs settled, then landscape.
    if (only === 'sink10') {
      await launch('sink-float', 10);
      await page.waitForTimeout(700);
      await page.evaluate(async () => {
        const g = neo.scene.game;
        for (let i = 0; i < 3; i++) {
          await kit.until(() => g.phase === 'shake' && !g.busy, 20000);
          kit.tapOn(g.shaker);
          await kit.sleep(200);
        }
        await kit.until(() => g.phase === 'duck' && !g.busy && g.tray.visible, 30000);
        kit.tapOn(g.tray);
        await kit.until(() => g.wet.length === 2 && g.wet.every((w) => w.settled), 10000);
      });
      await screenshot('sink-float-10-ducks');
      await page.evaluate(async () => {
        const g = neo.scene.game;
        await kit.until(() => g.phase === 'egg' && !g.busy && g.tray.visible, 30000);
        kit.tapOn(g.tray);
        await kit.sleep(300);
        await kit.until(() => g.phase === 'test' && !g.busy && g.tray.visible, 40000);
        if (g.misses || g.hints) throw new Error(`part 1 scored: ${g.misses} misses, ${g.hints} hints`);
      });
      const early = await page.evaluate(async () => {
        const g = neo.scene.game;
        kit.tapOn(g.tray);
        await kit.sleep(500);
        // The eggs are still falling: a tank tap now does nothing.
        const wrongTank = g.round.questions[0].salty === 'left' ? 1 : 0;
        const a = g.areas[wrongTank].hitArea;
        const p = g.areas[wrongTank].toGlobal({ x: a.x + a.width / 2, y: a.y + a.height / 2 });
        if (g.phase !== 'test') throw new Error(`eggs settled too soon: ${g.phase}`);
        kit.tap(p.x, p.y);
        await kit.sleep(300);
        return { before: { phase: g.phase, misses: g.misses } };
      });
      assert.equal(early.before.misses, 0, 'an early tank tap is ignored');
      await page.waitForFunction(() => neo.scene.game.phase === 'answer' && !neo.scene.game.busy, null, {
        timeout: 20000,
      });
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(600);
      await screenshot('sink-float-10-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(600);
      await screenshot('sink-float-10-landscape');
      const r = await page.evaluate(async () => {
        const g = neo.scene.game;
        const tapTank = (i) => {
          const a = g.areas[i].hitArea;
          const p = g.areas[i].toGlobal({ x: a.x + a.width / 2, y: a.y + a.height / 2 });
          kit.tap(p.x, p.y);
        };
        const sideIndex = () => (g.round.questions[g.question].salty === 'left' ? 0 : 1);
        for (let k = 0; k < 2; k++) {
          tapTank(1 - sideIndex());
          await kit.sleep(300);
          await kit.until(() => !g.explaining, 15000);
          await kit.sleep(300);
        }
        const afterWrong = { misses: g.misses, hints: g.hints };
        for (let q = 0; q < g.round.questions.length; q++) {
          await kit.until(() => g.phase === 'answer' && !g.busy && g.question === q, 40000);
          if (q === g.round.questions.length - 1) {
            // The duck question, through the two-tank ring.
            const { idle } = await import('/src/engine/controller.ts');
            const press = (f) => {
              const c = idle();
              f(c.players[0]);
              g.control(c, 0.016);
            };
            press((p) => (p.direction = sideIndex() === 1 ? 0 : 2));
            press((p) => (p.action = true));
          } else tapTank(sideIndex());
          await kit.sleep(400);
          if (q < g.round.questions.length - 1) {
            await kit.until(() => (g.phase === 'test' && g.tray.visible && !g.busy) || g.finished, 40000);
            if (!g.finished) {
              kit.tapOn(g.tray);
            }
          }
        }
        return afterWrong;
      });
      assert.deepEqual(r, { misses: 2, hints: 1 }, 'two wrong tanks: two misses and one hint');
      await finished('sink-float');
      const score = await page.evaluate(() => {
        const r = kit.store.stats('sink-float').history.at(-1);
        return [r.misses, r.hints];
      });
      assert.deepEqual(score, [2, 1], 'sink 10 score');
      log(
        'Sink or Float 10: part 1, an ignored early tap, two misses and the glow, the ring on the duck question, to the sticker passed',
      );
      return;
    }

    if (only) return;

    // All four start at lap, so Puddle Lagoon shows them, and progress survives a reload.
    await page.waitForTimeout(500);
    const ids = ['song-maker', 'puzzle-pals', 'weather-wardrobe', 'sink-float'];
    const progress = await page.evaluate(
      (ids) => ids.map((id) => ({ id, plays: kit.store.stats(id).plays })),
      ids,
    );
    await page.reload();
    await ready();
    assert.deepEqual(
      await page.evaluate((ids) => ids.map((id) => ({ id, plays: kit.store.stats(id).plays })), ids),
      progress,
    );
    await page.evaluate(() => neo.go.place('lap'));
    await scene('PlaceScene');
    const lap = await page.evaluate(() => neo.scene.landmarks.map((l) => l.mod.id));
    for (const id of ids) assert.ok(lap.includes(id), id);
    log('Puddle Lagoon shows all four, and saved progress survives a reload');
  }

  return { fourth };
}
