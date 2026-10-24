import { selectValue } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, log, ready, scene, tap, screenshot, launch, finished, useCompanion }) {
async function fourth() {
  const only = process.env.FOURTH_ONLY;
  if (only !== undefined) selectValue(only, ['song', 'puzzle', 'weather', 'sink', 'sink7'], 'FOURTH_ONLY');
  // Song Maker: free play loops, copying by shadows, a card, a pattern, and by ear.
  if (!only || only === 'song') for (let level = 1; level <= 7; level++) {
    await launch('song-maker', level);
    await page.waitForTimeout(600);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'free') { for (let i = 0; i < g.plan.notes; i++) { kit.tapOn(g.beads[(i * 5) % g.beads.length]); await kit.sleep(220); } return; }
      if (!await kit.until(() => !g.listening, 15000)) throw new Error('Tune never finished');
      const isNote = (b) => g.song.notes.some((n) => n.col === b.note.col && n.row === b.note.row);
      const wrong = g.beads.find((b) => !isNote(b) && !b.given && g.song.notes.some((n) => n.col === b.note.col));
      for (let i = 0; i < 2; i++) { kit.tapOn(wrong); await kit.sleep(250); }
      if (g.hints !== 1) throw new Error('Song hint missing');
    });
    if ([1, 5, 6, 7].includes(level)) await screenshot(`song-maker-${level}`);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (const n of [...g.remaining]) { kit.tapOn(g.beads.find((b) => b.note.col === n.col && b.note.row === n.row)); await kit.sleep(250); }
    });
    await finished('song-maker');
    const r = await page.evaluate(() => { const r = kit.store.stats('song-maker').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, level <= 2 ? [0, 0] : [2, 1], `song ${level} score`);
    log(`Song Maker ${level}: loop, mistakes, hint, saved round and sticker passed`);
  }

  // Puzzle Pals: exploring off the frame is free; a wrong place is a gentle miss.
  if (!only || only === 'puzzle') for (const level of process.env.PUZZLE_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6, 7]) {
    await launch('puzzle-pals', level);
    await page.waitForTimeout(600);
    await page.evaluate(() => { window.slotAt = (p) => { const g = neo.scene.game; return { x: g.board.x + (600 / g.plan.cols) * (p.col + 0.5) * g.scale, y: g.board.y + (420 / g.plan.rows) * (p.row + 0.5) * g.scale + 40 }; }; });
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const waiting = g.pieces.filter((p) => !p.placed);
      await kit.dragTo(waiting[0].node, { x: 200, y: 140 }); await kit.sleep(600);
      if (g.misses !== 0) throw new Error('Drop off the frame counted as a miss');
      const other = waiting.find((p) => p !== waiting[0]);
      if (other) for (let i = 0; i < 2; i++) { await kit.dragTo(waiting[0].node, slotAt(other.piece)); await kit.sleep(600); }
    });
    if (level > 1) await page.evaluate(async () => {
      const g = neo.scene.game;
      const { hintPiece, whereWords } = await import('/src/games/puzzle-pals/logic.ts');
      const expected = hintPiece(g.plan, g.pieces.filter((p) => p.placed).map((p) => p.piece));
      if (JSON.stringify(g.hinted?.piece) !== JSON.stringify(expected)) throw new Error('Hint does not choose the next useful piece');
      if (g.hints !== 1 || g.glow.eventMode !== 'none') throw new Error('Hint accounting or touch clearance is wrong');
      const pos = whereWords(g.plan, g.hinted.piece);
      if (!['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left', 'right'].includes(pos)) throw new Error('First hint is not a corner');
    });
    if (level === 7) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
      await screenshot('puzzle-pals-7-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
    }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (const p of g.pieces.filter((p) => !p.placed)) { await kit.dragTo(p.node, slotAt(p.piece)); await kit.sleep(450); if (!p.placed) throw new Error('Piece rejected its own place'); }
    });
    await page.waitForTimeout(900);
    if (level === 4) await screenshot('puzzle-pals-alive');
    await finished('puzzle-pals');
    const r = await page.evaluate(() => { const r = kit.store.stats('puzzle-pals').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, level === 1 ? [0, 0] : [2, 1], `puzzle ${level} score`);
    log(`Puzzle Pals ${level}: exploring, mistakes, hint, the picture coming alive, and a sticker passed`);
  }

  // Weather Wardrobe: free weather play, then dressing and packing.
  // WARDROBE_SPECIES=river|glider dresses that species instead of the hatched sprout (RW05 slice 2b: only what it can wear).
  if (process.env.WARDROBE_SPECIES && (!only || only === 'weather')) await useCompanion(process.env.WARDROBE_SPECIES);
  if (!only || only === 'weather') for (const level of [1, 2, 3, 4, 5, 6, 8]) {
    await launch('weather-wardrobe', level);
    await page.waitForTimeout(700);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'play') {
        // Every touch answers: the grass bursts and a worn item says its name, neither changing the weather.
        await kit.until(() => g.worn.size === 2, 3000);
        kit.tap(120, innerHeight - 40); await kit.sleep(150);
        if (!g.bursts.length || g.weather !== 'sunny') throw new Error('Wardrobe grass did not answer');
        const [item, [worn]] = [...g.worn][0];
        const at = worn.toGlobal(g.wornCenters.get(item));
        kit.tap(at.x, at.y); await kit.sleep(300);
        if (g.named !== 1 || g.weather !== 'sunny') throw new Error('Wardrobe worn item was not named');
        for (let i = 0; i < 6; i++) { kit.tap(500, 200); await kit.sleep(600); }
        return;
      }
      const wrong = g.options.find((o) => !g.outfit.needed.includes(o.item));
      for (let i = 0; i < (g.plan.mode === 'try' ? 1 : 2); i++) { kit.tapOn(wrong.node); await kit.sleep(100); if (!g.busy) throw new Error('No misfit shown'); await kit.until(() => !g.busy, 3000); await kit.sleep(50); }
      if (g.plan.mode === 'try' ? g.hints !== 0 || g.misses !== 0 : g.hints !== 1) throw new Error('Wardrobe hint/miss accounting wrong');
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
    const r = await page.evaluate(() => { const r = kit.store.stats('weather-wardrobe').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, level === 1 || level === 8 ? [0, 0] : [2, 1], `wardrobe ${level} score`);
    log(`Weather Wardrobe ${level}: weather, dressing, mistakes, hint, saved round and sticker passed`);
  }

  // Sink or Float: guesses are never misses; wrong sorts are tested in the water. Level 7 (FOURTH_ONLY=sink7 alone):
  // flat and leaky clay sink as experiments, the boat glows after them (one hint), the second lump floats by controller keys.
  if (!only || only === 'sink' || only === 'sink7') for (const level of only === 'sink7' ? [7] : [1, 2, 3, 4, 5, 6, 7]) {
    await launch('sink-float', level);
    await page.waitForTimeout(700);
    const boatAt = await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'shape') {
        const tile = (s) => g.tiles.find((t) => t.shape === s).node;
        for (const s of ['flat', 'leaky']) { await kit.until(() => g.choosing, 30000); await kit.sleep(100); kit.tapOn(tile(s)); await kit.sleep(300); }
        await kit.until(() => g.choosing, 30000);
        if (g.sunk !== 2 || g.hints !== 1 || g.misses !== 0) throw new Error(`clay trials: sunk ${g.sunk}, hints ${g.hints}, misses ${g.misses}`);
        return -1;
      }
      const floats = { duck: 1, boat: 1, ball: 1, leaf: 1, apple: 1 };
      const basket = (f) => ({ x: neo.view.w * 0.87, y: (f ? neo.view.h * 0.3 : neo.view.h * 0.56) + 40 });
      if (g.plan.mode === 'drop' || g.plan.mode === 'say') { for (const i of [...g.items]) { kit.tapOn(i.node); await kit.sleep(450); } return; }
      if (g.plan.mode === 'guess') {
        for (let k = 0; k < g.items.length; k++) {
          await kit.until(() => g.guessing || g.finished, 20000);
          if (g.finished) break;
          kit.tapOn(g.floatButton); await kit.sleep(300);
          await kit.until(() => g.guessing || g.finished || g.current > k, 20000);
        }
        return;
      }
      for (let i = 0; i < 2; i++) {
        const wrong = g.items.find((i) => !i.done);
        await kit.dragTo(wrong.node, basket(!floats[wrong.thing])); await kit.sleep(300);
        await kit.until(() => !g.busy, 20000);
      }
      for (const i of g.items.filter((i) => !i.done)) { await kit.dragTo(i.node, basket(!!floats[i.thing])); await kit.sleep(450); }
    });
    if (boatAt === -1) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
      await screenshot('sink-float-7-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
      await page.evaluate(async () => { const g = neo.scene.game; kit.tapOn(g.tiles.find((t) => t.shape === 'boat').node); await kit.until(() => g.experiment === 1 && g.choosing, 40000); });
      // Island keys reach control() only on couch levels (controllerLevels), so drive the three-tile ring directly.
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const { idle } = await import('/src/engine/controller.ts');
        const press = (f) => { const c = idle(); f(c.players[0]); g.control(c, 0.016); };
        for (let i = 0; i < 2; i++) press((p) => (p.direction = 2));
        for (let i = 0; i < g.experiments[1].order.indexOf('boat'); i++) press((p) => (p.direction = 0));
        press((p) => (p.action = true));
      });
      await page.waitForFunction(() => neo.scene.game.clayShape === 'boat', null, { timeout: 5000 });
    }
    await page.waitForTimeout(1000);
    if ([2, 3, 5].includes(level)) await screenshot(`sink-float-${level}`);
    await finished('sink-float');
    const r = await page.evaluate(() => { const r = kit.store.stats('sink-float').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, level === 4 || level === 5 ? [2, 1] : level === 7 ? [0, 1] : [0, 0], `sink ${level} score`);
    log(`Sink or Float ${level}: splashes, guesses, sorting, saved round and sticker passed`);
  }

  if (only) return;

  // All four start at lap, so Puddle Lagoon shows them, and progress survives a reload.
  await page.waitForTimeout(500);
  const ids = ['song-maker', 'puzzle-pals', 'weather-wardrobe', 'sink-float'];
  const progress = await page.evaluate((ids) => ids.map((id) => ({ id, plays: kit.store.stats(id).plays })), ids);
  await page.reload(); await ready();
  assert.deepEqual(await page.evaluate((ids) => ids.map((id) => ({ id, plays: kit.store.stats(id).plays })), ids), progress);
  await page.evaluate(() => neo.go.place('lap')); await scene('PlaceScene');
  const lap = await page.evaluate(() => neo.scene.landmarks.map((l) => l.mod.id));
  for (const id of ids) assert.ok(lap.includes(id), id);
  log('Puddle Lagoon shows all four, and saved progress survives a reload');
}

return { fourth };
}
