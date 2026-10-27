import { selectValue } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, log, ready, scene, tap, screenshot, launch, finished, next }) {
async function originals() {
  const only = process.env.ORIGINALS_ONLY;
  if (only !== undefined) selectValue(only, ['bubbles', 'scenes', 'jelly', 'peekaboo', 'ducks', 'shapes', 'fill', 'garden'], 'ORIGINALS_ONLY');
  const score = (id) => page.evaluate((id) => { const r = kit.store.stats(id).history.at(-1); return [r.misses, r.hints]; }, id);
  const portrait = async (on) => { await page.setViewportSize(on ? { width: 768, height: 1024 } : { width: 1024, height: 768 }); await page.waitForTimeout(300); };

  // Bubble Pop: moving bubbles tapped where they are, two wrong pops in a row, then the glow.
  // BUBBLE_LEVELS=13 plays only the counting-sequence level 13; levels 10 and 11 (pairs) are the `bonds` case.
  const bubbleLevels = process.env.BUBBLE_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14];
  for (const level of bubbleLevels) {
    if (only && only !== 'bubbles') break;
    if (level === 9 || level === 13) await portrait(true);
    await launch('bubble-pop', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const v = () => g.view;
      const live = () => g.bubbles.filter((b) => !b.popped && !b.rainbow && b.y > b.r + 110 && b.y < v().h - b.r - 10 && b.x > b.r && b.x < v().w - b.r);
      const right = (b) => g.right(b);
      // Two misses in a row on a wrong bubble well clear of any right one.
      if (g.plan.mode !== 'free') {
        // A spot on a wrong bubble that is out of reach of every right one (allowing for drift before the tap lands).
        const spot = (b) => {
          for (const [dx, dy] of [[0, 0], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7], [0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]]) {
            const p = { x: b.x + dx * b.r, y: b.y + dy * b.r };
            if (g.bubbles.every((o) => o === b || o.popped || !right(o) || Math.hypot(o.x - p.x, o.y - p.y) > o.r * 1.2 + 30)) return p;
          }
        };
        for (let k = 0; k < 2; k++) {
          let at;
          await kit.until(() => live().some((b) => !right(b) && (at = spot(b))), 30000);
          if (!at) throw new Error(`Bubble: no wrong bubble to tap; target ${g.target}, view ${g.view.w}x${g.view.h}, bubbles ${g.bubbles.map((b) => `${b.color}${b.popped ? '!' : ''}@${Math.round(b.x)},${Math.round(b.y)}`).join(' ')}`);
          const p = g.layer.toGlobal(at);
          kit.tap(p.x, p.y); await kit.sleep(350);
        }
        if (g.misses !== 2 || g.hints !== 1 || !g.bubbles.some((b) => !b.popped && right(b) && b.glow > 0)) throw new Error(`Bubble hint: ${g.misses} ${g.hints}`);
      }
      if (g.plan.mode === 'count') {
        // A wrong bubble drifting over the right one: a finger on both pops the right one, no miss.
        const want = g.bubbles.find((b) => right(b));
        const over = g.bubbles.find((b) => !b.popped && !right(b));
        const saved = [want.vx, want.vy, over.vx, over.vy];
        want.vx = want.vy = over.vx = over.vy = 0;
        want.position.set(g.view.w / 2, g.view.h / 2);
        over.position.set(want.x + want.r * 0.9, want.y);
        g.layer.addChild(over);
        await kit.sleep(100); // hit-testing uses the transforms from the last drawn frame
        const at = g.layer.toGlobal({ x: want.x + want.r * 0.5, y: want.y });
        kit.tap(at.x, at.y); await kit.sleep(300);
        if (g.misses !== 2 || !want.popped || g.nextNumber !== g.run[1]) throw new Error(`Bubble overlap: ${g.misses} ${want.popped} ${g.nextNumber}`);
        [over.vx, over.vy] = saved.slice(2);
      }
      for (let guard = 0; guard < 400 && g.phase === 'play'; guard++) {
        const b = live().find(right);
        if (b) kit.tapOn(b);
        await kit.sleep(b ? 160 : 120);
      }
      // The rainbow bubble floats up; pop it.
      await kit.until(() => g.bubbles.some((b) => b.rainbow && b.y < v().h - 150), 6000);
      const rainbow = g.bubbles.find((b) => b.rainbow);
      kit.tapOn(rainbow);
    });
    await screenshot(`bubble-pop-${level}`);
    await finished('bubble-pop');
    assert.deepEqual(await score('bubble-pop'), mode === 'free' ? [0, 0] : [2, 1], `bubbles ${level} score`);
    if (level === 9 || level === 13) await portrait(false);
    log(`Bubble Pop ${level} (${mode}): moving taps, mistakes, hint, rainbow, saved score and sticker passed`);
  }

  // Bubble Pop's scenes: a round draws one of four (shore, bath, night, sea); each is shown with plain bubbles and with five colors.
  if (!only || only === 'bubbles' || only === 'scenes') {
    for (const scenery of ['shore', 'bath', 'night', 'sea']) {
      for (const level of [2, 6]) {
        let found = false;
        for (let tries = 0; tries < 60 && !found; tries++) {
          await launch('bubble-pop', level);
          found = await page.evaluate((want) => neo.scene.game.backdrop.scene === want, scenery);
        }
        assert.ok(found, `Bubble Pop: a ${scenery} round turned up at level ${level}`);
        await page.waitForTimeout(2600);
        assert.equal(await page.evaluate(() => neo.scene.game.backdrop.children.every((c) => c.eventMode === 'none' || c.eventMode === 'passive' || c.constructor.name === 'Backdrop')), true, `${scenery}: the scene takes no touches`);
        await screenshot(`bubble-pop-scene-${scenery}-${level}`);
      }
    }
    log('Bubble Pop scenes: shore, bath, night and sea each shown at level 2 and 6, taking no touches');
  }

  // Jelly Drums: free play notes, then copying tunes with two wrong jellies and the slow replay.
  for (let level = 1; level <= 10 && (!only || only === 'jelly'); level++) {
    await launch('jelly-drums', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const hit = async (i) => { kit.tapOn(g.jellies[i], 0, -50); await kit.sleep(140); };
      if (g.plan.mode === 'free') { for (let n = 0; n < g.plan.goal; n++) await hit(n % 5); return; }
      if (g.plan.mode === 'wake') { for (let n = 0; n < g.plan.goal; n++) { kit.tap(300 + (n * 97) % 400, 300); await kit.sleep(140); } return; }
      const turn = () => kit.until(() => g.phase === 'turn' || g.phase === 'done', 20000);
      for (let t = 0; t < g.plan.goal; t++) {
        await turn();
        if (t === 0) {
          // The listen-again button replays the tune for free: no miss, no hint.
          kit.tapOn(g.again); await kit.until(() => g.phase === 'listen', 2000); await turn();
          if (g.misses !== 0 || g.hints !== 0) throw new Error(`Jelly listen-again counted: ${g.misses} ${g.hints}`);
          for (let k = 0; k < 2; k++) { await turn(); await hit((g.tune[0] + 1) % 5); }
          await turn();
          if (g.misses !== 2 || g.hints !== 1 || g.jellies[g.tune[0]].glowLeft <= 0) throw new Error(`Jelly hint: ${g.misses} ${g.hints}`);
        }
        const tune = [...g.tune];
        for (const i of tune) await hit(i);
        await kit.until(() => g.phase !== 'turn', 3000);
      }
    });
    await screenshot(`jelly-drums-${level}`);
    await finished('jelly-drums');
    assert.deepEqual(await score('jelly-drums'), mode !== 'echo' ? [0, 0] : [2, 1], `jelly ${level} score`);
    log(`Jelly Drums ${level} (${mode}): notes, tunes, mistakes, slow replay, hint, saved score and sticker passed`);
  }

  // Peekaboo Barn: tapping hiding places; wrong friends say hello and hide again.
  const peekLevels = process.env.PEEK_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6, 7, 8, 16];
  for (const level of peekLevels.filter((n) => (n >= 1 && n <= 8 || n === 16) && (!only || only === 'peekaboo'))) {
    await launch('peekaboo-barn', level);
    if (level === 1) await page.evaluate(async () => {
      const g = neo.scene.game;
      await kit.until(() => !g.busy, 10000);
      await kit.until(() => g.nudgeCount > 0, 7500);
      if (g.done || g.hints || g.misses) throw new Error('idle nudge changed round accounting');
      const s = g.spots[0];
      kit.tapOn(s, 0, -110);
      await kit.sleep(450);
      if (s.pose !== 'out' || s.opening.amount < 0.99) throw new Error('cover did not open with the touch');
    });
    if (level === 16) await page.evaluate(async () => {
      const g = neo.scene.game;
      await kit.until(() => !g.busy, 10000);
      if (g.spots.length !== 1) throw new Error('One door has more than one house');
      // Quiet for six seconds: it opens by itself, and that does not count.
      await kit.until(() => g.spots[0].pose !== 'hidden', 9000);
      if (g.done) throw new Error('self-opening counted toward the round');
      await kit.until(() => g.spots[0].pose === 'hidden', 6000);
      // Touch far from the house: it still opens, and that does count.
      const far = g.ctx.stage.toGlobal({ x: g.view.w - 60, y: 80 });
      kit.tap(far.x, far.y);
      await kit.sleep(450);
      if (g.spots[0].pose !== 'out' || g.done !== 1) throw new Error('a touch anywhere did not open the door');
    });
    if (level === 5) {
      await portrait(true);
      await screenshot('peekaboo-barn-5-portrait');
      await portrait(false);
      await page.evaluate(async () => {
        const g = neo.scene.game;
        await kit.until(() => !g.busy, 10000);
        const [a, b] = g.spots;
        const x = (a.x + b.x) / 2;
        const y = a.y - 110 * a.scale.x;
        if (a.x - 130 * a.scale.x < 150) throw new Error('cover overlaps pet corner');
        const point = g.ctx.stage.toGlobal({ x: x - 1, y });
        kit.tap(point.x, point.y);
        await kit.sleep(100);
        if (a.pose !== 'out' || b.pose === 'out') throw new Error('neighbor tap picked the farther cover');
      });
      // The tap above may be right or wrong; start a fresh round for the standard accounting proof.
      await launch('peekaboo-barn', level);
    }
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const tapSpot = async (s) => { kit.tapOn(s, 0, -110); await kit.sleep(300); };
      if (g.plan.mode === 'free') {
        for (let guard = 0; guard < 200 && !g.finished; guard++) {
          const s = g.spots.find((s) => s.pose === 'hidden');
          if (s) await tapSpot(s); else await kit.sleep(200);
        }
        return;
      }
      const ready = () => kit.until(() => !g.busy || g.finished, 15000);
      for (let q = 0; q < g.plan.goal; q++) {
        await ready();
        if (q === 0) {
          const wrong = g.spots.find((s) => s.animal !== g.target);
          await tapSpot(wrong); await ready(); await tapSpot(wrong); await ready();
          const right = g.spots.find((s) => s.animal === g.target);
          if (g.misses !== 2 || g.hints !== 1 || !right.hint) throw new Error(`Peekaboo hint: ${g.misses} ${g.hints}`);
        }
        const before = g.done;
        await tapSpot(g.spots.find((s) => s.animal === g.target));
        await kit.until(() => g.done > before, 3000);
      }
    });
    await screenshot(`peekaboo-barn-${level}`);
    await finished('peekaboo-barn');
    assert.deepEqual(await score('peekaboo-barn'), mode === 'free' ? [0, 0] : [2, 1], `peekaboo ${level} score`);
    log(`Peekaboo Barn ${level} (${mode}): finding, remembering, mistakes, wiggle hint, saved score and sticker passed`);
  }

  // Duck Pond: tapping ducks in, stopping at a number, and answering on lily pads.
  const duckTop = await page.evaluate(async () => (await import('/src/games/duck-pond/logic.ts')).PLANS.length);
  const duckLevels = process.env.DUCK_LEVELS?.split(',').map(Number) ?? Array.from({ length: duckTop }, (_, i) => i + 1);
  for (const level of duckLevels.filter((n) => n >= 1 && n <= duckTop && (!only || only === 'ducks'))) {
    if (level === 9 || level === duckTop) await portrait(true);
    await launch('duck-pond', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.waitForFunction(() => !neo.scene.game.busy);
    await page.waitForFunction(() => [...neo.scene.game.bank, ...neo.scene.game.swimmers].every((d) =>
      d.critter.craft.children.some((c) => c.texture?.width === 451)));
    const duckTargets = await page.evaluate(() => [...neo.scene.game.bank, ...neo.scene.game.swimmers].map((d) =>
      [d.hitArea.x, d.hitArea.y, d.hitArea.radius]));
    assert(duckTargets.every(([x, y, radius]) => x === 0 && y === -46 && radius === (mode === 'bye' ? 53 : 72)), 'Duck sprite preserves hit circles');
    if (level === duckTop) await screenshot(`duck-pond-${level}-illustrated-portrait`);
    const revealShot = mode === 'hide' ? (async () => {
      await page.waitForFunction(() => neo.scene.game.round === 0 && neo.scene.game.signText.text.includes('=') && neo.scene.game.swimmers.every((d) => d.critter.visible), null, { timeout: 60000 });
      await screenshot(`duck-pond-${level}-reveal-portrait`);
    })() : null;
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const ready = () => kit.until(() => !g.busy || g.finished, 20000);
      const tapDuck = async () => { const d = g.bank.find((d) => !d.resting); kit.tapOn(d, 0, -46); await kit.sleep(380); };
      for (let r = 0; r < g.plan.rounds; r++) {
        await ready();
        if (g.plan.mode === 'along') { while (g.bank.length && !g.busy) await tapDuck(); await kit.until(() => g.round > r || g.finished, 15000); continue; }
        if (g.plan.mode === 'bye') {
          const before = g.swimmers.length;
          let lost = 0;
          for (let tries = 0; g.swimmers.length && !g.busy && tries < 12; tries++) { const n = g.swimmers.length; kit.tapOn(g.swimmers[0], 0, -46); await kit.sleep(450); if (g.swimmers.length === n) { lost++; window.__lost = (window.__lost || '') + JSON.stringify([tries, n, g.busy, g.swimmers.map((d) => [Math.round(d.x), Math.round(d.y), d.swimming])]); } }
          if (lost) throw new Error(`Bye-bye ducks: ${lost} taps did nothing ${window.__lost}`);
          if (g.swimmers.length > 0 && !g.busy) throw new Error('Bye-bye ducks: a duck stayed ' + g.swimmers.length + ' ' + g.busy + ' ' + g.swimmers.map((d) => Math.round(d.x) + ',' + Math.round(d.y)).join(' '));
          await kit.until(() => g.round > r || g.finished, 20000);
          if (before !== 5) throw new Error(`Bye-bye ducks began with ${before}`);
          continue;
        }
        if (g.plan.mode === 'make') {
          const want = g.want;
          while (g.swimmers.length < want && !g.busy) await tapDuck();
          if (g.swimmers.length !== want || !g.bank.every((d) => d.resting)) throw new Error(`Ducks made ${g.swimmers.length} of ${want}`);
          await kit.until(() => g.round > r || g.finished, 15000);
          continue;
        }
        await kit.until(() => g.pads.length === 3 && !g.busy, 10000);
        await kit.sleep(700); // the pads grow in from nothing
        if (r === 0) {
          const wrong = g.pads.find((p) => p.value !== g.answer);
          for (let k = 0; k < 2; k++) { kit.tapOn(wrong); await kit.sleep(500); await ready(); }
          if (g.misses !== 2 || g.hints !== 1 || !g.pads.find((p) => p.value === g.answer).glowing) throw new Error(`Duck hint: ${g.misses} ${g.hints}`);
        }
        if (g.plan.mode === 'hide' && g.swimmers.filter((d) => !d.critter.visible).length !== g.answer) throw new Error('Hidden count differs from answer');
        kit.tapOn(g.pads.find((p) => p.value === g.answer));
        if (g.plan.mode === 'hide') {
          await kit.until(() => g.swimmers.every((d) => d.critter.visible) && g.signText.text.includes('='), 20000);
          const { HIDING_SLOTS, numberSentence } = await import('/src/games/duck-pond/logic.ts');
          if (g.signText.text !== numberSentence(g.want - g.answer, g.answer)) throw new Error('Wrong whole-part sentence');
          if (g.swimmers.some((d, i) => d.pondOffset[0] !== HIDING_SLOTS[i][0] || d.pondOffset[1] !== HIDING_SLOTS[i][1])) throw new Error('Reveal left a duck under the bridge');
        }
        await kit.until(() => g.round > r || g.finished, 20000);
      }
    });
    if (revealShot) await revealShot;
    await screenshot(`duck-pond-${level}`);
    await finished('duck-pond');
    assert.deepEqual(await score('duck-pond'), mode === 'along' || mode === 'make' || mode === 'bye' ? [0, 0] : [2, 1], `ducks ${level} score`);
    if (level === 9 || level === duckTop) await portrait(false);
    log(`Duck Pond ${level} (${mode}): counting along, stopping at a number, answers, mistakes, hint, saved score and sticker passed`);
  }

  // Shape Sorter: pieces dragged into holes, two wrong holes, then the right hole glows.
  const shapeLevels = process.env.SHAPE_LEVELS?.split(',').map(Number) ?? Array.from({ length: 8 }, (_, i) => i + 1);
  // Level 9, the tap-in entry, plays once at lap and once at toddler (in portrait), where it opens the ladder.
  // Level 10 (Round or square) is toddler's; 11 (Big, middle, little) plays in portrait for its wider three-size lid.
  const shapeRuns = shapeLevels.filter((n) => n >= 1 && n <= 14 && (!only || only === 'shapes')).flatMap((n) => (n === 9 ? [[9, 'lap'], [9, 'toddler']] : n === 10 ? [[10, 'toddler']] : [[n, undefined]]));
  for (const [level, shapeBand] of shapeRuns) {
    const upright = level === 8 || level === 11 || level === 12 || level === 14 || (level === 9 && shapeBand === 'toddler');
    if (upright) await portrait(true);
    await launch('shape-sorter', level, 'Mia', shapeBand);
    await page.waitForTimeout(400);
    const shapeStickers = await page.evaluate(() => kit.store.data.stickers.length);
    if (level === 12 || level === 14) await screenshot(`shape-sorter-${level}-start-portrait`);
    if (level === 9 && shapeBand === 'toddler') await screenshot('shape-sorter-9-start-portrait');
    const holes = await page.evaluate(async () => {
      const g = neo.scene.game;
      // Pieces ride above the finger, so aim the finger just below the hole.
      const into = async (piece, hole) => { await kit.dragTo(piece.view, g.box.toGlobal({ x: hole.x, y: hole.y + 40 }), 12); await kit.sleep(450); };
      // By kind (a clue), or the piece's own hole: its kind and, at the sized level, its size.
      const { fits } = await import('/src/games/shape-sorter/logic.ts');
      const holeFor = (k) => g.box.holes.find((h) => (typeof k === 'string' ? h.kind === k : fits(h, k)));
      if (g.plan.turning) {
        const { turnFits, turnNext } = await import('/src/games/shape-sorter/logic.ts');
        const p = g.pieces.find((p) => p.kind !== 'circle');
        const angle = p.view.rotation;
        // A second finger cannot steal the tap, and cancellation submits neither a turn nor a drop.
        const global = p.view.getGlobalPosition();
        p.view.emit('pointerdown', { pointerId: 301, global });
        p.view.emit('pointerdown', { pointerId: 302, global });
        p.view.emit('globalpointermove', { pointerId: 302, global: { x: global.x + 200, y: global.y } });
        if (p.tapStart?.pointerId !== 301 || p.tapMoved) throw new Error('Shape turn: second finger stole the tap');
        window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 301 }));
        await kit.sleep(500);
        if (p.drag.dragging || p.view.rotation !== angle || g.misses || g.hints) throw new Error('Shape turn: cancellation changed play');
        // A real tap advances one notch for free, leaving the piece at its floor spot.
        const pos = { x: p.view.x, y: p.view.y };
        kit.tapOn(p.view); await kit.sleep(200);
        if (Math.abs(p.view.rotation - turnNext(angle)) > 1e-6 || p.view.x !== pos.x || p.view.y !== pos.y || g.misses) throw new Error('Shape turn: tap must turn one notch in place');
        // Keep turning until off-fit again so two right-hole orientation misses can teach and align.
        for (let n = 0; turnFits(p.kind, p.view.rotation) && n < 12; n++) { kit.tapOn(p.view); await kit.sleep(180); }
        const wrong = g.box.holes.find((h) => !fits(h, p));
        await into(p, wrong); await into(p, wrong);
        if (g.misses !== 2 || g.hints !== 1 || !holeFor(p).glow.visible) throw new Error('Shape turn: wrong-hole support');
        await into(p, holeFor(p));
        if (g.misses !== 3 || g.hints !== 1 || !g.pieces.includes(p) || Math.hypot(p.view.x - (g.box.x + holeFor(p).x), p.view.y - (g.box.y + holeFor(p).y)) > 1) throw new Error('Shape turn: misaligned piece must wait at its hole');
        await into(p, holeFor(p));
        if (g.misses !== 4 || g.hints !== 2 || !turnFits(p.kind, p.view.rotation) || !g.pieces.includes(p)) throw new Error('Shape turn: second orientation miss must self-align once');
        // Tapping while it waits on a hole must turn rather than accidentally swallow it.
        kit.tapOn(p.view); await kit.sleep(200);
        if (!g.pieces.includes(p) || g.misses !== 4) throw new Error('Shape turn: a tap on the hole posted the piece');
        for (let guard = 0; guard < 30 && g.pieces.length; guard++) {
          const next = g.pieces[0];
          if (!turnFits(next.kind, next.view.rotation)) { kit.tapOn(next.view); await kit.sleep(180); }
          else await into(next, holeFor(next));
        }
        if (g.pieces.length) throw new Error('Shape turn: tap then carry did not finish');
        return g.box.holes.length;
      }
      if (g.plan.clue) {
        await kit.until(() => g.clueReady || g.finished, 10000);
        let checkedHint = false;
        while (g.pieces.length) {
          await kit.until(() => g.clueReady || g.finished, 10000);
          if (g.finished) break;
          if (!checkedHint) {
            const wrong = g.pieces.find((p) => p.kind !== g.asked);
            // Its own hole first: it fits but is not the one asked for, so it is named and comes back (a miss); then the asked hole.
            await into(wrong, holeFor(wrong.kind));
            if (g.misses !== 1 || !g.pieces.includes(wrong)) throw new Error('Shape clue: a fitting but unasked shape comes back as one miss');
            await into(wrong, holeFor(g.asked));
            if (g.misses !== 2 || g.hints !== 1 || !holeFor(g.asked).glow.visible) throw new Error(`Shape clue hint: ${g.misses} ${g.hints}`);
            checkedHint = true;
          }
          const asked = g.asked;
          await into(g.pieces.find((p) => p.kind === asked), holeFor(asked));
          await kit.until(() => g.clueReady || g.finished, 10000);
        }
        return g.box.holes.length;
      }
      if (g.plan.everyTouch) {
        // Every touch answers and none counts: the box giggles, the floor wiggles the nearest piece, a far drop plops and the box leans.
        kit.tapOn(g.box, 0, 40); await kit.sleep(300);
        if (!(g.box.yum > 0)) throw new Error('Shape 1: a tap on the box gulps');
        const p0 = g.pieces[0];
        const at = g.layer.toGlobal({ x: p0.view.x + 30, y: p0.view.y - 60 }); kit.tap(at.x, at.y); await kit.sleep(100);
        if (!g.pieces.some((p) => p.wiggle > 0)) throw new Error('Shape 1: a floor tap wiggles a piece');
        await kit.dragTo(p0.view, g.box.toGlobal({ x: -g.box.w, y: g.box.lidH + 200 }), 12); await kit.sleep(150);
        if (!(g.box.leanLeft > 0)) throw new Error('Shape 1: a far drop leans the box');
        await kit.sleep(500);
        if (g.misses || g.hints || g.pieces.length !== 3) throw new Error(`Shape 1: touches are free: ${g.misses} ${g.hints} ${g.pieces.length}`);
      }
      if (g.plan.tapIn) {
        // A tap on a piece hops it into the hole by itself; the last one goes in by a drag, which still works.
        for (const n of [2, 1]) {
          kit.tapOn(g.pieces[0].view); await kit.sleep(900);
          if (g.pieces.length !== n) throw new Error(`Shape 9: a tap puts a piece in (${g.pieces.length} left)`);
        }
      }
      if (g.box.holes.length > 1) {
        const piece = g.plan.attribute === 'count' ? g.pieces.find((p) => fits(g.box.holes.find((h) => h.attribute === 4), p)) : g.pieces[0];
        const wrong = g.box.holes.find((h) => !fits(h, piece));
        await into(piece, wrong); await into(piece, wrong);
        if (g.misses !== 2 || g.hints !== 1 || !holeFor(piece).glow.visible) throw new Error(`Shape hint: ${g.misses} ${g.hints}`);
        if (g.plan.attribute === 'count') {
          // Wrong drops on a four-corner shape light its four dots in order; the shared target accepts either kind.
          const { CORNERS } = await import('/src/games/shape-sorter/logic.ts');
          const fours = g.pieces.filter((p) => CORNERS[p.kind] === 4);
          if (new Set(fours.map((p) => p.kind)).size < 2 || new Set(fours.map(holeFor)).size !== 1) throw new Error('Shape count: need two kinds sharing 4');
          const target = holeFor(piece);
          if (target.dots.length) {
            g.box.update(0.01);
            if (target.dots[0].alpha !== 1 || target.dots.at(-1).alpha !== 0.18) throw new Error('Shape count: dots must light in order');
          }
        }
      }
      for (let guard = 0; guard < 20 && g.pieces.length; guard++) { const p = g.pieces[0]; await into(p, holeFor(p)); }
      return g.box.holes.length;
    });
    await screenshot(`shape-sorter-${level}${shapeBand ? `-${shapeBand}` : ''}`);
    await finished('shape-sorter');
    assert.deepEqual(await score('shape-sorter'), level === 12 ? [4, 2] : holes > 1 ? [2, 1] : [0, 0], `shapes ${level} score`);
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), shapeStickers + 1, 'one shape sticker');
    if (upright) await portrait(false);
    log(`Shape Sorter ${level}${shapeBand ? ` (${shapeBand})` : ''}: dragging into holes, wrong holes, glow hint, saved score and sticker passed`);
  }

  // Fill and Dump: a basket tipped out and scooped back by taps; then filled to a stated number, a wrong check twice, and the glow.
  const fillLevels = (process.env.FILL_LEVELS || '1,2,3,4,5,6,7').split(',').map(Number);
  for (const level of (!only || only === 'fill' ? fillLevels : [])) {
    if (level === 4) await portrait(true);
    await launch('fill-dump', level);
    await page.waitForTimeout(400);
    if (level === 5) {
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const hit = async (on, y = 0) => { kit.tapOn(on, 0, y); await kit.sleep(300); };
        const pull = async (amount) => {
          const a = g.jug.toGlobal({ x: 0, y: 0 });
          const b = g.jug.toGlobal({ x: amount * 240, y: 0 });
          await kit.drag(kit.line([a.x, a.y], [b.x, b.y])); await kit.sleep(150);
        };
        await hit(g.tick);
        if (g.state.misses) throw new Error('An empty pour check is a reminder');
        await pull(1.25);
        if (Math.abs(g.state.cup - 1) > 0.001 || Math.abs(g.state.tray - 0.25) > 0.001) throw new Error('Overflow must be caught');
        await hit(g.tick); await hit(g.tick);
        if (g.state.misses !== 2 || g.state.hints !== 1) throw new Error('Pour hint accounting');
      });
      await portrait(true); await screenshot('fill-dump-5-portrait');
      await page.evaluate(async () => {
        const g = neo.scene.game;
        for (let guard = 0; guard < 20 && !g.state.done; guard++) {
          const intent = g.autotouch();
          if (intent?.tap) kit.tapOn(intent.tap.on, intent.tap.x || 0, intent.tap.y || 0);
          else if (intent?.drag) {
            const a = intent.drag.on.toGlobal({ x: intent.drag.x || 0, y: intent.drag.y || 0 });
            const b = intent.to.on.toGlobal({ x: intent.to.x || 0, y: intent.to.y || 0 });
            await kit.drag(kit.line([a.x, a.y], [b.x, b.y]));
          }
          await kit.sleep(300);
        }
        if (!g.state.done) throw new Error('Pour supported completion');
      });
      await finished('fill-dump');
      assert.deepEqual(await score('fill-dump'), [2, 1]);
      await portrait(false);
      log('Fill and Dump 5: pour displacement, caught overflow, two wrong checks, one hint, resize, recovery, three cups and one sticker passed');
      continue;
    }
    if (level === 7) {
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const hit = async (on, y = 0) => { kit.tapOn(on, 0, y); await kit.sleep(300); };
        const pull = async (amount) => {
          const a = g.jug.toGlobal({ x: 0, y: -60 });
          const b = g.jug.toGlobal({ x: amount * 240 + 1, y: -60 });
          await kit.drag(kit.line([a.x, a.y], [b.x, b.y])); await kit.sleep(150);
        };
        await hit(g.cup, -60); // A smaller-container guess is free.
        if (g.state.misses || g.state.phase !== 'pour') throw new Error('Capacity guess must be free');
        await pull(0.4); await hit(g.tick);
        if (g.state.phase !== 'pour' || g.state.misses) throw new Error('Partial experiments are free');
        await hit(g.tray); // Return the partial experiment.
        await pull(2);
        if (Math.abs(g.state.cup - 1) > 0.001 || Math.abs(g.state.tray - 1) > 0.001) throw new Error('Capacity spill evidence');
        await hit(g.tick);
        await hit(g.cup, -60); await hit(g.cup, -60);
        if (g.state.misses !== 2 || g.state.hints !== 1 || !g.state.helped) throw new Error('Capacity supported answer accounting');
        // A re-pour preserves both the water and the existing one-hint accounting.
        await hit(g.tray); await pull(2); await hit(g.tick);
        if (g.state.hints !== 1 || Math.abs(g.state.jug + g.state.cup + g.state.tray - 2) > 0.001) throw new Error('Capacity re-pour conservation');
      });
      await portrait(true); await screenshot('fill-dump-7-portrait'); await portrait(false);
      await page.evaluate(async () => {
        const g = neo.scene.game;
        for (let guard = 0; guard < 16 && !g.state.done; guard++) {
          const intent = g.autotouch();
          if (intent?.tap) kit.tapOn(intent.tap.on, intent.tap.x || 0, intent.tap.y || 0);
          else if (intent?.drag) {
            const a = intent.drag.on.toGlobal({ x: intent.drag.x || 0, y: intent.drag.y || 0 });
            const b = intent.to.on.toGlobal({ x: intent.to.x || 0, y: intent.to.y || 0 });
            await kit.drag(kit.line([a.x, a.y], [b.x, b.y]));
          }
          await kit.sleep(300);
        }
        if (!g.state.done || g.state.round !== 3) throw new Error('Capacity three-pair completion');
      });
      await finished('fill-dump');
      assert.deepEqual(await score('fill-dump'), [2, 1]);
      log('Fill and Dump 7: free prediction/partial pour/re-pour, conserved spill, two wrong answers, one evidence hint, portrait and three pairs passed');
      continue;
    }
    if (level === 6) {
      // Full and empty: the grass is free, two taps on the wrong basket are two misses and glow the right one, then the requests finish.
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const idle = () => kit.until(() => !g.busy, 8000);
        const hit = async (side) => { kit.tapOn(g.baskets[side].front, 0, -75); await kit.sleep(300); };
        await idle();
        kit.tapOn(g.floor, neo.view.w - 30, neo.view.h - 30); await kit.sleep(200);
        if (g.state.misses) throw new Error('Full and empty: the grass is never wrong');
        const right = g.autotouch().tap.on === g.baskets[0].front ? 0 : 1;
        await hit(1 - right); await hit(1 - right);
        if (g.state.misses !== 2 || g.state.hints !== 1 || g.glow?.side !== right) throw new Error(`Full and empty hint: ${g.state.misses} ${g.state.hints} ${g.glow?.side}`);
      });
      await portrait(true); await screenshot('fill-dump-6-portrait'); await portrait(false);
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const idle = () => kit.until(() => !g.busy, 8000);
        for (let guard = 0; guard < 12 && !g.state.done; guard++) {
          await idle();
          const intent = g.autotouch();
          if (intent) { kit.tapOn(intent.tap.on, intent.tap.x, intent.tap.y); await kit.sleep(300); }
        }
        if (!g.state.done || g.state.misses !== 2) throw new Error(`Full and empty finish: ${JSON.stringify(g.state)}`);
      });
      await finished('fill-dump');
      assert.deepEqual(await score('fill-dump'), [2, 1]);
      log('Fill and Dump 6: free grass, two wrong baskets, one glow hint, four alternating requests and one sticker passed');
      continue;
    }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const idle = () => kit.until(() => !g.busy && g.flying === 0, 8000);
      const hit = async (obj, dy = 0) => { kit.tapOn(obj, 0, dy); await kit.sleep(250); };
      const basket = () => hit(g.basket.front, -75);
      const outside = () => g.pieces.find((p) => !g.state.inside[p.i]);
      const ground = () => kit.tapOn(g.floor, neo.view.w - 15, neo.view.h - 15);
      if (g.state.target === null) {
        const before = JSON.stringify(g.state);
        await kit.until(() => g.invitation?.target === 'basket', 7500);
        if (JSON.stringify(g.state) !== before) throw new Error('Idle basket invitation must be unscored');
        ground(); await idle();
        if (g.state.dumps !== 1 || g.invitation) throw new Error('Ground tips the full basket and clears its invitation');
        await kit.until(() => typeof g.invitation?.target === 'number', 7500);
        if (g.state.misses || g.state.hints) throw new Error('Idle fruit invitation must be unscored');
        const at = { x: neo.view.w - 15, y: neo.view.h - 15 };
        const nearest = g.pieces.filter((p) => !g.state.inside[p.i]).sort((a, b) =>
          Math.hypot(g.spots[a.i].x - at.x, g.spots[a.i].y - at.y) - Math.hypot(g.spots[b.i].x - at.x, g.spots[b.i].y - at.y))[0].i;
        ground();
        if (!g.state.inside[nearest] || g.invitation) throw new Error('Ground scoops nearest fruit and clears its invitation');
        for (let guard = 0; guard < 60 && !g.state.done; guard++) {
          await idle();
          if (guard % 2 === 0) { ground(); await kit.sleep(250); }
          else if (g.state.order.length === g.state.plan.pieces) await basket();
          else await hit(outside().view);
        }
        if (!g.state.done || g.state.misses || g.state.hints) throw new Error(`Fill tip-out: ${JSON.stringify(g.state)}`);
      } else {
        const n = g.state.target;
        const before = JSON.stringify(g.state);
        ground();
        if (JSON.stringify(g.state) !== before || g.floor.eventMode === 'static') throw new Error('Counting ignores ground taps');
        await hit(g.tick); // nothing in yet: said again, no miss
        if (g.state.misses) throw new Error('Fill: an empty check is not a miss');
        const extrasShown = () => g.sign.extras.getLocalBounds().width > 0;
        if (!g.sign || g.sign.x === 0 || extrasShown()) throw new Error('Fill: the count sign starts beside the basket with no extras');
        for (let k = 0; k <= n; k++) { await idle(); await hit(outside().view); }
        await idle();
        if (!extrasShown()) throw new Error('Fill: one piece too many hangs below the count sign');
        await hit(g.tick); await hit(g.tick);
        if (g.state.misses !== 2 || g.state.hints !== 1 || g.glow?.target !== 'basket') throw new Error(`Fill hint: ${g.state.misses} ${g.state.hints} ${g.glow?.target}`);
        await basket(); await idle();
        if (g.state.order.length !== n) throw new Error('Fill: the basket takes one back out');
        if (extrasShown()) throw new Error('Fill: the extra dot leaves with the piece');
        await hit(g.tick);
      }
    });
    await screenshot(`fill-dump-${level}`);
    await finished('fill-dump');
    assert.deepEqual(await score('fill-dump'), level <= 2 ? [0, 0] : [2, 1], `fill ${level} score`);
    if (level === 4) await portrait(false);
    log(`Fill and Dump ${level}: tipping, scooping, counting, the check, glow hint, saved score and sticker passed`);
  }

  // Color Garden: fruit and balloons dragged into baskets, including the edge of a crowded basket.
  for (const level of (!only || only === 'garden') ? (process.env.GARDEN_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6, 7, 8, 9]) : []) {
    if (level === 6 || level === 9) await portrait(true);
    await launch('color-garden', level);
    await page.waitForTimeout(400);
    if (level === 9) {
      assert.equal(await page.evaluate(() => neo.scene.game.plan.tap), true, 'Level 9 is a tap entry');
      await screenshot('color-garden-9-portrait');
    }
    const baskets = await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.tap) {
        if (g.items.length !== 4 || g.baskets.length !== 2) throw new Error('Garden tap deal');
        for (const i of g.items) {
          if (i.drag || i.view.hitArea.radius * i.view.scale.x < 50) throw new Error('Garden tap target or drag');
        }
        // Basket/background touches are free; rapid taps and a repeated tap cannot place twice.
        await kit.tapOn(g.baskets[0]);
        const targets = g.items.map(i => ({ view: i.view, basket: g.baskets.find(b => b.key === i.key) }));
        const first = g.items[0];
        await kit.tapOn(first.view);
        await kit.tapOn(first.view);
        for (const i of [...g.items]) await kit.tapOn(i.view);
        await kit.until(() => g.sorted === 4);
        if (g.misses || g.hints || g.baskets.some(b => b.glowing)) throw new Error('Garden tap is not free exploration');
        for (const { view, basket } of targets) if (view.parent !== basket.inside) throw new Error('Fruit hopped to another color');
        for (const b of g.baskets) for (const v of b.inside.children) {
          if (v.eventMode !== 'none') throw new Error('Sorted fruit still accepts taps');
        }
        return 0;
      }
      const into = async (item, basket, dx = 0) => { await kit.dragTo(item.view, basket.parent.toGlobal({ x: basket.x + dx, y: basket.y - 20 }), 12); await kit.sleep(450); };
      const basketFor = (color) => g.baskets.find((b) => b.key === color);
      if (g.baskets.length > 1) {
        const item = g.items[0];
        const wrong = g.baskets.find((b) => b.key !== item.key);
        await into(item, wrong); await into(item, wrong);
        if (g.misses !== 2 || g.hints !== 1 || !basketFor(item.key).glowing) throw new Error(`Garden hint: ${g.misses} ${g.hints}`);
      }
      if (g.baskets.length === 6) {
        // Right at the edge of a basket, leaning toward its neighbour: it still lands in that basket.
        const item = g.items.find((i) => { const k = g.baskets.indexOf(basketFor(i.key)); return k > 0; });
        const basket = basketFor(item.key);
        const before = g.sorted;
        await into(item, basket, -(basket.w / 2 - 6));
        if (g.sorted !== before + 1 || g.misses !== 2) throw new Error(`Garden edge drop: ${g.sorted} ${g.misses}`);
      }
      for (let guard = 0; guard < 20 && g.items.length; guard++) { const i = g.items[0]; await into(i, basketFor(i.key)); }
      return g.baskets.length;
    });
    await screenshot(`color-garden-${level}`);
    await finished('color-garden');
    assert.deepEqual(await score('color-garden'), baskets > 1 ? [2, 1] : [0, 0], `garden ${level} score`);
    if (level === 6 || level === 9) await portrait(false);
    log(level === 9 ? 'Color Garden 9: rapid taps, own baskets, inert repeated/basket taps, zero misses/hints, saved score and sticker passed' : `Color Garden ${level}: dragging into baskets, crowded edges, wrong baskets, glow hint, saved score and sticker passed`);
  }

  // Everything played above survives a reload.
  await page.reload(); await ready();
  const saved = await page.evaluate(() => ['bubble-pop', 'jelly-drums', 'peekaboo-barn', 'duck-pond', 'shape-sorter', 'color-garden'].map((id) => [id, kit.store.stats(id).history.length]));
  const want = { 'bubble-pop': 12, 'jelly-drums': 10, 'peekaboo-barn': 9, 'duck-pond': 9, 'shape-sorter': 8, 'color-garden': 9 };
  for (const [id, n] of saved) if (!only) assert.ok(n >= want[id], `${id} history after reload: ${n}`);
  log(`Original six: round history after reload ${saved.map(([id, n]) => `${id} ${n}`).join(', ')}`);
}

return { originals };
}
