import { selectValue } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, context, log, ready, scene, tap, screenshot, launch, finished }) {
async function batch() {
  const only = process.env.BATCH_ONLY;
  if (only !== undefined) selectValue(only, ['monsters', 'pegs', 'salon', 'garden', 'helpers', 'eggs', 'safari', 'bounce'], 'BATCH_ONLY');
  // Word Monsters: sounds, finding letters, first sounds and building words by dragging.
  for (let level = 1; level <= 6 && (!only || only === 'monsters'); level++) {
    await launch('word-monsters', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const ready = () => kit.until(() => !g.busy || g.finished, 10000);
      if (g.plan.mode === 'play') {
        for (let i = 0; i < g.plan.rounds; i++) { await ready(); kit.tapOn(g.monsters[i % g.monsters.length]); await kit.sleep(250); }
        return;
      }
      const building = g.plan.mode === 'build' || g.plan.mode === 'spell';
      for (let q = 0; q < g.questions.length; q++) {
        await kit.until(() => g.index === q && !g.busy, 10000);
        const question = g.question;
        const want = () => (building ? question.answer[g.filled] : question.answer);
        const monster = (l) => g.monsters.find((m) => !m.placed && m.letter === l);
        const act = async (m) => {
          if (!building) { kit.tapOn(m); await kit.sleep(450); return; }
          const slot = g.top.parent.toGlobal({ x: g.top.x + (g.filled - 1) * 150, y: g.top.y + 106 + 40 });
          await kit.dragTo(m, slot, 10); await kit.sleep(500);
        };
        if (q === 0) {
          // Two wrong answers: a gentle miss each, then the right monster glows.
          const wrong = g.monsters.find((m) => m.letter !== want() && !question.answer.slice(g.filled).startsWith(m.letter));
          await act(wrong); await act(wrong);
          if (g.misses !== 2 || g.hints !== 1 || !monster(want()).glow.visible) throw new Error(`Monster hint: ${g.misses} ${g.hints}`);
        }
        if (!building) { await act(monster(want())); continue; }
        while (g.filled < question.answer.length && g.question === question) await act(monster(want()));
      }
    });
    await screenshot(`word-monsters-${level}`);
    await finished('word-monsters');
    const r = await page.evaluate(() => { const r = kit.store.stats('word-monsters').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'play' ? [0, 0] : [2, 1], `monsters ${level} score`);
    log(`Word Monsters ${level} (${mode}): sounds, choices, mistakes, hint, saved score and sticker passed`);
  }

  // Peg Garden: tap to drop; aim by dragging. Shots are chosen by simulating the real physics.
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= Number(process.env.TO_LEVEL || 7) && (!only || only === 'pegs'); level++) {
    await launch('peg-garden', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { simulate } = await import('/src/engine/ball.ts');
      const { aimAt, aimVelocity, AIM_LIMIT, BOARD } = await import('/src/games/peg-garden/logic.ts');
      const board = g.board;
      const screen = (x, y) => board.toGlobal({ x, y });
      const done = () => kit.until(() => !g.ball, 15000);
      const drop = async (x) => { await done(); const p = screen(x, 30); kit.tap(p.x, p.y); await kit.until(() => g.ball, 2000); await done(); };
      // Aim: find an angle whose simulated path touches what we want, then drag the launcher there.
      const shoot = async (good, want) => {
        await done();
        // A shot meant to hit aims as the ghost finger does, at an angle whose neighbours hit too (aimed pearls step by frame).
        let best = want === undefined ? 0 : aimAt(g.world, want, 0) ?? 0;
        for (let a = -AIM_LIMIT; want === undefined && a <= AIM_LIMIT; a += 0.01) {
          const { hits } = simulate({ x: BOARD.w / 2, y: 40, ...aimVelocity(a), r: BOARD.ball }, g.world, BOARD.h, 6, 1 / 30);
          if (good(hits)) { best = a; break; }
        }
        const p = screen(BOARD.w / 2 + Math.sin(best) * 300, 40 + Math.cos(best) * 300);
        const q = screen(BOARD.w / 2 + Math.sin(best) * 310, 40 + Math.cos(best) * 310);
        await kit.drag([[p.x, p.y], [q.x, q.y]], 1, 30);
        await kit.until(() => g.ball, 2000); await done();
      };
      if (g.plan.mode === 'drop') {
        // A tap in the sea beside the board drops a pearl from the nearest ledge point, and a tap while it falls is the next pearl.
        const sea = screen(-120, 300);
        kit.tap(sea.x, sea.y);
        await kit.until(() => g.ball, 2000);
        if (g.ball.x !== BOARD.ball) throw new Error(`Peg sea tap at ${g.ball.x}`);
        const mid = screen(BOARD.w / 2, 30);
        kit.tap(mid.x, mid.y);
        await kit.sleep(100);
        if (g.queued !== BOARD.w / 2) throw new Error(`Peg queued ${g.queued}`);
        await kit.until(() => g.shots >= 1 && g.ball, 15000);
        for (let i = 2; i < g.plan.count; i++) await drop(60 + i * 110);
        return;
      }
      if (g.plan.mode === 'bloom' || g.plan.mode === 'big') {
        for (let guard = 0; guard < 40 && !g.finished; guard++) { const b = g.buds.find((b) => !b.bloomed); if (!b) break; await drop(b.x); }
        return;
      }
      if (g.plan.mode === 'color') {
        // Drop far from the orange flowers until two shots in a row bloom none: then the arrow hint.
        const specials = g.buds.filter((b) => b.spot.kind === 'special');
        const far = [...g.buds].filter((b) => b.spot.kind === 'plain').sort((a, b) => Math.min(...specials.map((s) => Math.abs(s.x - b.x))) - Math.min(...specials.map((s) => Math.abs(s.x - a.x))));
        for (let k = 0; k < 12 && !g.hinting && !g.finished; k++) await drop(far[k % 3].x);
        if (!g.finished && (!g.hinting || g.hints !== 1)) throw new Error(`Peg color hint: ${g.misses} ${g.hints}`);
        // The hint shows where to act: a ring on the ledge, and a tap anywhere lets the pearl go there; a tap while it falls adds nothing.
        if (!g.finished && g.hintX === null) throw new Error('Peg color hint has no ledge ring');
        for (let guard = 0; guard < 40 && !g.finished; guard++) { const b = g.buds.find((b) => b.spot.kind === 'special' && !b.bloomed); if (!b) break; await drop(b.x); }
        return;
      }
      if (g.plan.mode === 'plant') {
        // Plant a bud: a free look, two runs with a bud on a place that misses, then the hint and the hinted place.
        const { plantRun, plantings } = await import('/src/games/peg-garden/logic.ts');
        const run = async () => { await done(); const p = screen(g.dropX, 40); kit.tap(p.x, p.y); await kit.until(() => g.ball, 2000); await done(); await kit.sleep(400); };
        // A seed rides 40 units over the finger, so the finger lets go 40 below the place.
        const plant = async (seed, place) => {
          const from = screen(seed.bud.x, seed.bud.y);
          const to = screen(g.places[place].x, g.places[place].y + 40);
          await kit.drag(kit.line([from.x, from.y], [to.x, to.y], 12), 1, 20);
          await kit.sleep(400);
          if (seed.place !== place) throw new Error(`Peg plant: seed went to ${seed.place}, not ${place}`);
        };
        // Only the pearl button lets it go: a tap in the water does nothing.
        const water = screen(BOARD.w / 2, 330);
        kit.tap(water.x, water.y);
        await kit.sleep(300);
        if (g.ball) throw new Error('Peg plant: a tap in the water dropped a pearl');
        await run();
        if (g.misses !== 0) throw new Error(`Peg plant: a free look counted ${g.misses}`);
        const spots = g.fixed.map((b) => b.spot);
        const wrong = plantings(g.places.length).find((ix) => ix.length && plantRun(spots, ix.map((i) => g.places[i]), g.dropX) !== g.friendCup);
        if (!wrong) throw new Error('Peg plant: no planting misses');
        for (let k = 0; k < wrong.length; k++) await plant(g.seeds[k], wrong[k]);
        await run();
        await run();
        if (g.misses !== 2 || g.hints !== 1 || !g.hinting) throw new Error(`Peg plant hint: ${g.misses} ${g.hints}`);
        await kit.sleep(600);
        if (g.seeds.some((q) => q.place !== null && q.place !== g.hintPlace)) throw new Error('Peg plant: a stray seed stayed after the hint');
        if (!g.seeds.some((q) => q.place === g.hintPlace)) await plant(g.seeds.find((q) => q.place === null), g.hintPlace);
        await run();
        // The finish follows the praise line; a run that missed would have counted a third miss.
        await kit.until(() => g.finished || g.misses > 2, 8000).catch(() => {});
        if (!g.finished) throw new Error(`Peg plant: the hinted place did not reach the cup (misses ${g.misses})`);
        if (!g.path.length) throw new Error('Peg plant: no faint trail after a run');
        return;
      }
      if (g.plan.mode === 'cup') {
        // Into the cup: aim with the landing table, as the ghost finger does. Two shots into another cup, then the hint, then hits.
        const { aimInto } = await import('/src/games/peg-garden/logic.ts');
        const into = async (cup) => {
          await done();
          const a = aimInto(g.world, g.table, cup);
          if (a === null) throw new Error(`Peg cup ${cup} unreachable`);
          const p = screen(BOARD.w / 2 + Math.sin(a) * 300, 40 + Math.cos(a) * 300);
          const q = screen(BOARD.w / 2 + Math.sin(a) * 310, 40 + Math.cos(a) * 310);
          await kit.drag([[p.x, p.y], [q.x, q.y]], 1, 30);
          await kit.until(() => g.ball, 2000);
          await done();
        };
        // Each shot into another cup is a miss with its count said.
        for (let k = 0; k < 2; k++) { const before = g.misses; await into(g.dots.findIndex((d) => d !== g.target)); if (g.misses !== before + 1) throw new Error(`Peg cup wrong shot counted ${g.misses - before}`); }
        if (g.misses !== 2 || g.hints !== 1 || !g.hinting) throw new Error(`Peg cup hint: ${g.misses} ${g.hints}`);
        for (let guard = 0; guard < 8 && !g.finished; guard++) {
          if (g.target === undefined) { await kit.sleep(300); continue; }
          const goal = g.goal;
          await into(g.dots.indexOf(g.target));
          await done();
          await kit.until(() => g.goal > goal || g.finished, 4000);
        }
        if (!g.path.length) throw new Error('Peg cup: no faint trail after a shot');
        return;
      }
      // A cancelled aim (a system gesture, a palm) lets nothing go.
      await done();
      const at = screen(BOARD.w / 2, 300);
      const press = (type) => document.querySelector('canvas').dispatchEvent(new PointerEvent(type, { clientX: at.x, clientY: at.y, pointerId: 9, pointerType: 'touch', bubbles: true, cancelable: true, buttons: 1 }));
      press('pointerdown');
      await kit.sleep(100);
      if (g.aiming !== 9) throw new Error(`Peg aim did not start: ${g.aiming}`);
      press('pointercancel');
      await kit.sleep(300);
      if (g.aiming !== null || g.ball) throw new Error('Peg cancelled aim fired or stayed');
      // Number and order: two shots that miss the target, then the full-path hint, then hits.
      const isTarget = (i) => g.buds[i].spot.kind === g.target;
      for (let k = 0; k < 2; k++) await shoot((hits) => !hits.some(isTarget));
      if (g.misses < 2 || g.hints !== 1) throw new Error(`Peg hint: ${g.misses} ${g.hints}`);
      for (let guard = 0; guard < 10 && !g.finished; guard++) {
        // Only the asked number opens; the others the pearl touches wait their turn.
        const others = g.buds.filter((b) => typeof b.spot.kind === 'number' && !g.targets.slice(0, g.goal + 1).includes(b.spot.kind));
        await shoot(null, g.buds.findIndex((b) => b.spot.kind === g.target));
        if (!g.finished && others.some((b) => b.bloomed)) throw new Error(`Peg: a number not yet asked for opened: ${others.filter((b) => b.bloomed).map((b) => b.spot.kind)} targets ${g.targets} goal ${g.goal} finished ${g.finished}`);
      }
      // The last shot's path stays as faint dots until the next one.
      if (!g.path.length) throw new Error('Peg: no faint trail after a shot');
    });
    if (!await page.evaluate(() => neo.scene.game.finished)) await page.waitForTimeout(2000);
    await screenshot(`peg-garden-${level}`);
    await finished('peg-garden');
    const r = await page.evaluate(() => { const r = kit.store.stats('peg-garden').history.at(-1); return [r.misses, r.hints]; });
    log(`Peg Garden ${level} (${mode}): score ${r}`);
    if (mode === 'drop' || mode === 'bloom' || mode === 'big') assert.deepEqual(r, [0, 0], `pegs ${level} score`);
    else assert.ok(r[0] >= 2 && r[1] === 1, `pegs ${level} score ${r}`);
    log(`Peg Garden ${level} (${mode}): drops, aiming, blooms, hint, saved score and sticker passed`);
  }

  // Fluffy Salon: real strokes through the fur with each tool, requests, and the mirror.
  await page.evaluate(() => {
    window.salon = {
      async pick(tool) { const g = neo.scene.game; kit.tapOn(g.buttons.find((b) => b.tool === tool)); await kit.sleep(250); },
      /** Brush back and forth across the whole head of fur. */
      async zigzag() {
        const g = neo.scene.game;
        const b = g.hair.getBounds();
        const request = g.request;
        for (let y = b.y + 10; y < b.y + b.height && g.request === request && !g.busy; y += 26) {
          const row = [];
          for (let x = b.x; x <= b.x + b.width; x += 18) row.push([x, y]);
          await kit.drag(row, 1, 6);
        }
      },
      /** Snip close to the head, following its curve. */
      async cutShort() {
        const g = neo.scene.game;
        const request = g.request;
        for (const r of [150, 140]) {
          if (g.request !== request || g.busy) return;
          const pts = [];
          for (let a = -Math.PI; a <= 0; a += 0.08) { const p = g.hair.toGlobal({ x: Math.cos(a) * r, y: -122 + Math.sin(a) * r }); pts.push([p.x, p.y]); }
          await kit.drag(pts, 1, 8);
        }
      },
      async style(look) {
        const g = neo.scene.game;
        const { needs, toolFor } = await import('/src/games/fluffy-salon/logic.ts');
        // Stop when the request moves on, or the next request's fur gets this one's tool (no progress, so the quiet-time hint).
        const request = g.request;
        for (let i = 0; i < 12; i++) {
          const fix = needs(look, g.strands);
          if (!fix || g.busy || g.request !== request) return;
          const tool = toolFor(fix);
          if (g.tool !== tool) await salon.pick(tool);
          if (tool === 'cut') await salon.cutShort(); else await salon.zigzag();
        }
      },
    };
  });
  for (let level = 1; level <= (process.env.TO_LEVEL ? Number(process.env.TO_LEVEL) : 12) && (!only || only === 'salon'); level++) {
    if (process.env.FROM_LEVEL && level < Number(process.env.FROM_LEVEL)) continue;
    if (level >= 9) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('fluffy-salon', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    if (level === 11 || level === 12) {
      await screenshot(`fluffy-salon-${level}-portrait`);
      await page.evaluate(async (level) => {
        const g = neo.scene.game;
        const { needs, toolFor, strokePath, stats, colorTargets } = await import('/src/games/fluffy-salon/logic.ts');
        window.salonBatchRewards = kit.store.data.stickers.length;
        const beforeLove = [];
        let reversal = false;
        const say = g.ctx.say.bind(g.ctx);
        g.ctx.say = (id, vars) => {
          if (id === 'salon.love') beforeLove.push(JSON.stringify(g.strands));
          return say(id, vars);
        };
        const instruct = g.ctx.instruct.bind(g.ctx);
        g.ctx.instruct = (id, vars) => {
          if (id === 'salon.actually') {
            reversal = true;
            if (JSON.stringify(g.strands) !== beforeLove[0]) throw new Error('Changed request reset the loved hair');
            if (!needs(g.look, g.strands)) throw new Error('Changed request was already met');
            if (vars.look !== g.look.length && vars.look !== g.look.curl) throw new Error('Changed request spoke another attribute');
          }
          return instruct(id, vars);
        };
        const check = async () => {
          kit.tapOn(g.mirror); await kit.sleep(400);
          if (!await kit.until(() => !g.busy || g.finished, 10000)) throw new Error('Mirror stayed busy');
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        };
        const stroke = async (tool, look, back = false) => {
          await salon.pick(tool);
          const corners = strokePath(tool, back, look);
          const path = corners.slice(1).flatMap((p, j) => kit.line([corners[j].x, corners[j].y], [p.x, p.y], 20)).map(([x, y]) => { const q = g.hair.toGlobal({ x, y }); return [q.x, q.y]; });
          await kit.drag(path, 1, 12);
        };
        // Cancellation ends a contact before another pointer movement can alter the fur.
        const p = g.hair.toGlobal(g.an[10]);
        const canvas = document.querySelector('canvas');
        canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: p.x, clientY: p.y, pointerId: 1, pointerType: 'touch', bubbles: true }));
        const cancelled = JSON.stringify(g.strands);
        window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 }));
        canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: p.x, clientY: p.y, pointerId: 1, bubbles: true }));
        if (g.pointer !== null || JSON.stringify(g.strands) !== cancelled) throw new Error('Cancelled pointer kept styling');
        await kit.sleep(100);
        for (let r = 0; r < g.requests.length; r++) {
          if (!await kit.until(() => g.request === r && !g.busy, 10000)) throw new Error('Request did not open');
          const look = g.look;
          // Both requests at 12 get independent retry/support checks, including the reversing tool.
          await check(); await check();
          if (g.misses !== (r + 1) * 2 || g.hints !== r + 1) throw new Error('Support did not count once per request');
          if (!g.buttons.find(b => b.tool === toolFor(needs(look, g.strands))).glow.visible) throw new Error('Missing tool did not glow');
          if (level === 11) {
            // Painting the whole head with just one asked color is not sufficient.
            await stroke(look.colors[0], undefined);
            if (stats(g.strands).share(look.colors[0]) < 0.8 || needs(look, g.strands) !== look.colors[1]) throw new Error('A single color completed a two-color ask');
            await check();
            if (g.oldGlow !== look.colors[1] || !g.buttons.find(b => b.tool === look.colors[1]).glow.visible) throw new Error('Hint did not follow the missing color');
            const reserved = g.strands.filter((s, i) => s.color === look.colors[0] && !colorTargets(look, g.strands, look.colors[1]).includes(i)).length;
            if (reserved < Math.ceil(g.strands.length * 0.35)) throw new Error('Hint asked to erase the other required color');
          }
          for (let n = 0; needs(look, g.strands) && n < 20; n++) await stroke(toolFor(needs(look, g.strands)), look, n % 2 === 1);
          if (needs(look, g.strands)) throw new Error(`Unmet request ${r}`);
          if (level === 11) {
            await kit.sleep(100);
            if (g.buttons.some(b => b.glow.visible)) throw new Error('A correct two-color style still glows');
            // Revising a correct but unchecked style keeps this request's existing support, rather than charging it again.
            await stroke(look.colors[0], undefined);
            await check();
            if (g.hints !== 1 || g.misses !== 4) throw new Error('Repainting charged the same request hint twice');
            for (let n = 0; needs(look, g.strands) && n < 20; n++) await stroke(toolFor(needs(look, g.strands)), look, n % 2 === 1);
            if (needs(look, g.strands)) throw new Error('Repainted style could not finish with support');
          }
          if (g.finished || kit.store.data.stickers.length !== salonBatchRewards) throw new Error('Reward before the last mirror');
          await check();
        }
        if (!g.finished || (level === 12 && !reversal)) throw new Error('Did not complete both stages');
      }, level);
      await finished('fluffy-salon');
      const proof = await page.evaluate(() => ({ score: kit.store.stats('fluffy-salon').history.at(-1), rewards: kit.store.data.stickers.length - salonBatchRewards }));
      assert.deepEqual([proof.score.misses, proof.score.hints, proof.rewards], level === 11 ? [4, 1, 1] : [4, 2, 1]);
      log(`Fluffy Salon ${level}: real strokes, truthful support, retained reversal, cancellation and one reward passed`);
      continue;
    }
    if (level >= 9) {
      await screenshot(`fluffy-salon-${level}-portrait`);
      await page.evaluate(async (level) => {
        const g = neo.scene.game;
        const { needs, toolFor, strokePath } = await import('/src/games/fluffy-salon/logic.ts');
        const beforeRewards = kit.store.data.stickers.length;
        window.salonPairRewards = beforeRewards;
        window.salonPairLines = [];
        const say = g.ctx.say.bind(g.ctx);
        g.ctx.say = (id, vars) => { salonPairLines.push({ id, vars }); return say(id, vars); };
        const idle = async () => { if (!await kit.until(() => !g.busy || g.finished, 8000)) throw new Error('Pair stayed busy'); };
        const check = async () => { kit.tapOn(g.mirror); await kit.sleep(350); await idle(); };
        const select = async (i) => { kit.tapOn(g.seats[i].card); await kit.sleep(400); if (g.selected !== i) throw new Error('Card did not select its own customer'); };
        // Right customer first: the starting request, hair and support of the other head must stay untouched.
        if (level === 9) await select(1);
        const first = g.selected;
        const untouched = JSON.stringify(g.seats[1 - first].strands);
        await check(); await check();
        if (g.misses !== 2 || g.hints !== 1 || !g.buttons.some(b => b.glow.visible)) throw new Error('Pair mirror support did not count two misses / one hint');
        if (level === 10 && !g.comparison.context.instructions.length) throw new Error('No comparison drawing at mirror look');
        if (level === 9) {
          await select(0);
          if (g.buttons.some(b => b.glow.visible)) throw new Error('Hint leaked to other customer');
          await select(1);
        }
        // A cancelled contact must never style on a later move without a fresh down.
        const s = g.seat;
        const p = s.hair.toGlobal(g.an[10]);
        const canvas = document.querySelector('canvas');
        canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: p.x, clientY: p.y, pointerId: 1, pointerType: 'touch', bubbles: true }));
        const beforeCancel = JSON.stringify(s.strands);
        window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 }));
        canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: p.x, clientY: p.y, pointerId: 1, bubbles: true }));
        if (g.pointer !== null || JSON.stringify(s.strands) !== beforeCancel) throw new Error('Cancelled pointer kept styling');
        await kit.sleep(100);
        window.salonPairSnapshotReady = true;
        const order = level === 9 ? [1, 0] : [0];
        for (const i of order) {
          await select(i);
          const seat = g.seats[i];
          const look = g.requests[level === 10 ? 0 : i].look;
          for (let n = 0; needs(look, seat.strands) && n < 20; n++) {
            const tool = toolFor(needs(look, seat.strands));
            kit.tapOn(g.buttons.find(b => b.tool === tool));
            await kit.sleep(250);
            const corners = strokePath(tool, n % 2 === 1);
            const path = corners.slice(1).flatMap((p, j) => kit.line([corners[j].x, corners[j].y], [p.x, p.y], 20)).map(([x, y]) => { const q = seat.hair.toGlobal({ x, y }); return [q.x, q.y]; });
            await kit.drag(path, 1, 12);
          }
          if (needs(look, seat.strands)) throw new Error(`Unmet pair request ${i}: ${needs(look, seat.strands)}`);
          if (i === first && JSON.stringify(g.seats[1 - first].strands) !== untouched) throw new Error('A stroke edited the other customer');
          await check();
          if (!seat.done) throw new Error('Mirror did not accept its own completed request');
          if (level === 9 && i === 1 && g.finished) throw new Error('Finished before both customers');
        }
        if (!g.finished) throw new Error('Pair did not finish');
        if (level === 10 && !salonPairLines.some(l => l.id === 'salon.compare-more' && l.vars.direction === g.requests[0].look.comparison.direction)) throw new Error('Comparison hint named the wrong direction');
      }, level);
      await screenshot(`fluffy-salon-${level}-mirror-portrait`);
      await finished('fluffy-salon');
      const proof = await page.evaluate(() => ({ score: kit.store.stats('fluffy-salon').history.at(-1), rewards: kit.store.data.stickers.length - salonPairRewards }));
      assert.deepEqual([proof.score.misses, proof.score.hints, proof.rewards], [2, 1, 1]);
      log(`Fluffy Salon ${level}: real strokes, separate requests/support, mirror retries, cancellation and single reward passed`);
      continue;
    }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'pat') {
        if (g.buttons.length || g.mirror.visible) throw new Error('Pat the fluff has buttons or an early mirror');
        for (let i = 0; i < 40 && !g.mirror.visible; i++) await salon.zigzag();
        if (!await kit.until(() => g.mirror.visible, 5000)) throw new Error('No floof mirror');
        if (g.mirror.radius !== 70) throw new Error('The pat mirror is not big');
        await kit.sleep(500);
        kit.tapOn(g.mirror);
        return;
      }
      if (g.plan.mode === 'play' || g.plan.mode === 'tools' || g.plan.mode === 'snip') {
        // A pat off the fur, low on the left of the touch area, is answered (a giggle and a wobble) and changes no strand.
        const before = JSON.stringify(g.strands);
        const p = g.touch.toGlobal({ x: 190, y: neo.view.h - 160 });
        kit.tap(p.x, p.y);
        await kit.sleep(300);
        if (g.lastPat < 0 || JSON.stringify(g.strands) !== before) throw new Error('A pat off the fur was not answered');
        for (const tool of g.plan.mode === 'snip' ? ['grow', 'cut'] : g.plan.mode === 'play' ? ['grow', 'pink'] : ['grow', 'curl', 'blue', 'cut']) {
          await salon.pick(tool);
          if (tool === 'cut') await salon.cutShort(); else await salon.zigzag();
        }
        if (!await kit.until(() => g.mirror.visible, 30000)) throw new Error('No mirror');
        if (!g.invited) throw new Error('The mirror appeared without an invitation');
        await kit.sleep(500);
        kit.tapOn(g.mirror);
        return;
      }
      // A friend in the chair (levels 3–5, seeded) keeps the corner guide and is named in the lines; her pet sends the guide out.
      if ((g.customer !== null) !== neo.scene.pet.visible) throw new Error('The corner guide does not match who is in the chair');
      if (g.customer && !g.who) throw new Error('A friend in the chair has no name');
      if (g.plan.mode === 'color') {
        if (g.buttons.length !== 5 || g.buttons.some((b) => b.radius < 54) || g.mirror.visible) throw new Error('Pink, please has more than the five big bottles, or a mirror');
      }
      for (let r = 0; r < g.requests.length; r++) {
        await kit.until(() => g.request === r && !g.busy, 10000);
        const look = g.look;
        if (r === 0 && g.plan.mode === 'color') {
          // Two wrong bottles: each paints (no miss) and is named once; after the second the asked bottle glows (one hint).
          const wrong = g.buttons.filter((b) => b.tool !== look.color).slice(0, 2);
          for (const b of wrong) { await salon.pick(b.tool); await salon.zigzag(); await kit.sleep(300); }
          if (g.misses !== 0 || g.hints !== 1 || !g.buttons.find((b) => b.tool === look.color).glow.visible) throw new Error(`Pink, please naming: ${g.misses} ${g.hints}`);
          if (!g.strands.some((s) => s.color === wrong[1].tool)) throw new Error('A wrong bottle did not paint');
        }
        if (r === 0 && g.plan.mode !== 'ask' && g.plan.mode !== 'color') {
          // Checking the mirror too soon: two gentle "almost"s, then the right tool glows.
          for (let k = 0; k < 2; k++) { kit.tapOn(g.mirror); await kit.sleep(500); await kit.until(() => !g.busy, 8000); }
          if (g.misses !== 2 || g.hints !== 1 || !g.buttons.some((b) => b.glow.visible)) throw new Error(`Salon hint: ${g.misses} ${g.hints}`);
        }
        await salon.style(look);
        // One request at a time and Pink, please have no mirror: it never appears, so it never invites a miss.
        if ((g.plan.mode === 'ask' || g.plan.mode === 'color') && g.mirror.visible) throw new Error('The mirror showed at a self-checking request');
        if (g.plan.mode !== 'ask' && g.plan.mode !== 'color') { await kit.until(() => !g.busy, 8000); kit.tapOn(g.mirror); }
        await kit.until(() => g.request > r || g.finished, 15000);
      }
    });
    await screenshot(`fluffy-salon-${level}`);
    await finished('fluffy-salon');
    const r = await page.evaluate(() => { const r = kit.store.stats('fluffy-salon').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'two' || mode === 'match' ? [2, 1] : mode === 'color' ? [0, 1] : [0, 0], `salon ${level} score`);
    log(`Fluffy Salon ${level} (${mode}): tools, requests, mirror, hint, saved score and sticker passed`);
  }

  // Sound Garden: singers, listening questions with wrong answers, and echoing rhythms on the drum.
  const soundLevels = process.env.SOUND_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  for (const level of (!only || only === 'garden') ? soundLevels : []) {
    if ([7, 8, 9, 10].includes(level)) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('sound-garden', level);
    if (level === 7) {
      await page.waitForFunction(() => !neo.scene.game.busy);
      assert.ok(await page.evaluate(() => {
        const g = neo.scene.game;
        return g.tiles.length === 3 && g.tiles.every((t, i) => t.width >= 100 && t.x - 130 >= 0 && t.x + 130 <= neo.view.w && (!i || t.x - g.tiles[i - 1].x >= 260));
      }), 'three full-size, separate choices fit in portrait');
      await screenshot('sound-garden-7-portrait');
    }
    await page.waitForTimeout(600);
    if (level === 8 && only === 'garden') await screenshot('sound-garden-8-portrait');
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    if (level === 9 || level === 10) {
      await page.waitForFunction(() => !neo.scene.game.busy);
      await screenshot(`sound-garden-${level}-portrait`);
    }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const ready = () => kit.until(() => !g.busy || g.finished, 15000);
      if (g.plan.mode === 'sing' || g.plan.mode === 'copy') {
        const { pitchY } = await import('/src/games/sound-garden/pitch-logic.ts');
        await ready();
        const note = async (step) => {
          const a = g.pad.toGlobal({ x: g.x, y: pitchY(g.step, g.top, g.bottom) });
          const b = g.pad.toGlobal({ x: g.x, y: pitchY(step, g.top, g.bottom) });
          await kit.drag(kit.line([a.x, a.y], [b.x, b.y], 8));
          await kit.sleep(100);
          if (g.step !== step || g.heardStep !== step) throw new Error('Shown and heard pitches differ');
        };
        // Cancellation and a second finger cannot add a note or steal the first finger.
        const global = g.pad.toGlobal({ x: g.x, y: pitchY(4, g.top, g.bottom) });
        const before = g.played;
        g.pad.emit('pointerdown', { pointerId: 301, global });
        g.pad.emit('pointerdown', { pointerId: 302, global });
        if (g.pointer !== 301) throw new Error('Second finger stole pitch drag');
        window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 301 }));
        if (g.played !== before || g.pointer !== null) throw new Error('Cancelled drag committed');
        if (!g.copy) {
          await note(2); await note(7);
          for (let i = 2; i < 12; i++) await note(2 + i % 6);
          if (g.misses || g.hints) throw new Error('Creative pitches counted as errors');
        } else {
          const replayPoint = g.replay.toGlobal({ x: g.modelX, y: g.model.y });
          kit.tap(replayPoint.x, replayPoint.y);
          if (!g.busy) throw new Error('Replay bird did not answer');
          await kit.sleep(150); await ready();
          if (g.misses || g.hints) throw new Error('Replay counted as a hint');
          for (let k = 0; k < 2; k++) {
            await note(4); await note(4); await ready();
          }
          if (g.misses !== 2 || g.hints !== 1 || !g.help) throw new Error('Missing stem hint');
          for (let q = 0; q < g.shapes.length; q++) {
            await ready();
            // A different starting note and interval with the right direction must work.
            const target = q === 0 ? [3, 7] : g.shapes[q];
            for (const step of target) await note(step);
            await kit.until(() => g.index > q || g.finished, 10000);
          }
        }
        return;
      }
      if (g.plan.big) {
        if (g.singers.filter(s => s.node.visible).length !== 1 || g.singers[0].node.width < 200) throw new Error('Missing big singer');
        // Check the exclusion without pressing shell buttons; their actual routes stay shell-owned.
        for (const [x,y] of [[20,20], [neo.view.w-20,20], [40,neo.view.h-40]]) {
          if (g.bigPad.hitArea.contains(x,y)) throw new Error('Lap pad overlaps a corner');
        }
        for (let i = 0; i < 12; i++) {
          const before = g.played;
          // Grass edges and quick repeated taps must sound, including during handoffs.
          const point = g.bigPad.toGlobal({ x: i % 2 ? neo.view.w - 25 : neo.view.w / 2, y: i % 2 ? neo.view.h - 25 : neo.view.h / 2 });
          kit.tap(point.x, point.y);
          await kit.sleep(90);
          if (g.played !== before + 1) throw new Error('Big friend swallowed a tap');
          if (!g.finished && !g.singers[Math.floor(g.played / 4)].node.visible) throw new Error('Missing four-tap handoff');
        }
        if (g.misses || g.hints) throw new Error('Creative taps counted as errors');
        return;
      }
      if (g.plan.mode === 'play') {
        for (let i = 0; i < g.plan.rounds; i++) { kit.tapOn(g.singers[i % g.singers.length].node); await kit.sleep(300); }
        return;
      }
      if (g.plan.mode === 'echo') {
        const { GAP_SECONDS } = await import('/src/games/sound-garden/logic.ts');
        const tapRhythm = async (r) => {
          for (let i = 0; i <= r.length; i++) { kit.tapOn(g.drum, 0, -40); if (i < r.length) await kit.sleep(GAP_SECONDS[r[i]] * 1000); }
        };
        for (let q = 0; q < g.rhythms.length; q++) {
          await kit.until(() => g.index === q && !g.busy, 15000);
          const r = g.rhythms[q];
          if (q === 0) {
            if (g.dotCount !== r.length + 1 || g.rhythmHint.alpha !== 1) throw new Error('Visible knocks missing before the first tap');
            // Listening again is free and restores every dot.
            kit.tapOn(g.woodpecker, 0, -120); await kit.sleep(300); await ready();
            if (g.misses || g.hints || g.dotCount !== r.length + 1) throw new Error('Replay changed echo accounting');
            // Two echoes with an extra tap: gentle misses, then per-tap drum lights.
            for (let k = 0; k < 2; k++) { await tapRhythm([...r, 'S']); await kit.until(() => g.busy, 4000); await ready(); }
            if (g.misses !== 2 || g.hints !== 1 || !g.echoHelp) throw new Error(`Echo hint: ${g.misses} ${g.hints}`);
            await kit.sleep(50);
            if (!g.drumGlow.visible) throw new Error('Hint does not light the first tap');
          }
          if (q === 0) {
            for (let i = 0; i <= r.length; i++) {
              if (!await kit.until(() => g.drumGlow.visible, 1200)) throw new Error('Missing next-tap hint');
              kit.tapOn(g.drum, 0, -40);
              await kit.sleep(30);
              if (g.drumGlow.visible) throw new Error('Hint did not clear on tap');
            }
          } else await tapRhythm(r);
          if (!await kit.until(() => g.treeAwake, 8000)) throw new Error('The echoed rhythm did not wake the tree');
          if (g.rhythmHint.alpha > 0.01) throw new Error('Dots did not fade after the first tap');
          await kit.until(() => g.index > q || g.finished, 15000);
        }
        return;
      }
      for (let q = 0; q < g.questions.length; q++) {
        await kit.until(() => g.index === q && !g.busy, 15000);
        const right = g.tiles.find((t) => t.answer === g.question.answer);
        const wrong = g.tiles.find((t) => t !== right);
        if (q === 0) {
          for (let k = 0; k < 2; k++) { kit.tapOn(wrong); await kit.sleep(300); await ready(); }
          if (g.misses !== 2 || g.hints !== 1 || !right.glow.visible) throw new Error(`Garden hint: ${g.misses} ${g.hints}`);
          kit.tapOn(g.bush); await kit.sleep(300); await ready();
        }
        kit.tapOn(right);
        await kit.until(() => g.index > q || g.finished, 15000);
      }
    });
    await screenshot(`sound-garden-${level}`);
    await finished('sound-garden');
    const r = await page.evaluate(() => { const r = kit.store.stats('sound-garden').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'play' || mode === 'sing' ? [0, 0] : [2, 1], `garden ${level} score`);
    log(`Sound Garden ${level} (${mode}): sounds, answers, mistakes, hint, saved score and sticker passed`);
    if ([7, 8, 9, 10].includes(level)) await page.setViewportSize({ width: 1024, height: 768 });
  }

  // Little Helpers: tap the fruit to send helpers one by one; the whistle checks the count. HELPERS_LEVELS=2,5,9 picks levels.
  // Level 9 (Whistle when it's full) plays in portrait: an early whistle and a helper past full are never counted.
  for (const level of (process.env.HELPERS_LEVELS || '1,2,3,4,5').split(',').map(Number).filter(() => !only || only === 'helpers')) {
    if (level === 9) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('little-helpers', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const settle = () => kit.until(() => !g.busy && !g.helpers.some((h) => h.moving), 10000);
      const send = async (n) => { for (let i = 0; i < n; i++) { kit.tapOn(g.fruitNode, 0, -30); await kit.sleep(260); } await kit.sleep(400); };
      for (let q = 0; q < g.fruits.length; q++) {
        await kit.until(() => g.index === q && !g.busy, 15000);
        await settle();
        const f = g.fruit;
        if (!g.whistle.visible && g.plan.mode === 'tap' && q === 0) {
          // Level 1: a touch on the sky sends a helper too, and touches while it is carried only make helpers hop.
          kit.tapOn(g.field, neo.view.w * 0.3, 140);
          await kit.until(() => g.busy, 5000);
          for (let i = 0; i < 3; i++) { kit.tapOn(g.field, neo.view.w * 0.5, neo.view.h - 30); await kit.sleep(250); }
          await kit.until(() => g.index > q || g.finished, 15000);
          if (g.misses !== 0) throw new Error(`Sky and busy touches counted: ${g.misses}`);
          continue;
        }
        if (!g.whistle.visible) {
          if (g.plan.mode === 'two' && q === 0) {
            // The rings fill as each helper grabs on.
            if (g.emptyRings?.parent == null) throw new Error('Level 2 badge has no rings');
          }
          await send(f.need); await kit.until(() => g.index > q || g.finished, 15000); continue;
        }
        if (g.plan.mode === 'whistle') {
          if (q === 0 || f.need > 1) {
            // Not full yet: an early whistle blinks the empty rings and counts nothing.
            if (f.need > 1) { await send(1); kit.tapOn(g.whistle); await kit.sleep(400); await settle(); await send(f.need - 1); }
            else await send(f.need);
            // A helper past full bounces off and walks back.
            await send(1); await settle();
            if (g.carrying.length !== f.need || g.misses !== 0 || g.hints !== 0) throw new Error(`Level 9 counted: ${g.carrying.length}/${f.need} ${g.misses} ${g.hints}`);
          } else await send(f.need);
          await settle();
          kit.tapOn(g.whistle);
          await kit.until(() => g.index > q || g.finished, 15000);
          continue;
        }
        if (q === 0) {
          // A whistle before anyone is sent and a touch on the grass are answered, never counted.
          if (f.already === 0) { kit.tapOn(g.whistle); await kit.sleep(300); }
          kit.tapOn(g.field, neo.view.w * 0.5, neo.view.h - 30); await kit.sleep(300); await settle();
          if (g.misses !== 0 || g.carrying.length !== f.already) throw new Error(`Empty whistle or grass counted: ${g.misses} ${g.carrying.length}`);
          // One too many, then the whistle: an extra walks back. Then too few: too heavy.
          await send(f.need - f.already + 1);
          kit.tapOn(g.whistle); await kit.sleep(300); await settle();
          if (g.carrying.length !== f.need) throw new Error(`Extras not sent back: ${g.carrying.length} of ${f.need}`);
          const h = g.carrying.at(-1); kit.tapOn(h, 0, -24); await kit.sleep(300); await settle();
          kit.tapOn(g.whistle); await kit.sleep(300); await settle();
          if (g.misses !== 2 || g.hints !== 1) throw new Error(`Helper hint: ${g.misses} ${g.hints}`);
          await send(1);
        } else {
          await send(f.need - f.already);
        }
        await settle();
        kit.tapOn(g.whistle);
        await kit.until(() => g.index > q || g.finished, 15000);
      }
    });
    await screenshot(`little-helpers-${level}`);
    await finished('little-helpers');
    const r = await page.evaluate(() => { const r = kit.store.stats('little-helpers').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'tap' || mode === 'two' || mode === 'whistle' ? [0, 0] : [2, 1], `helpers ${level} score`);
    log(`Little Helpers ${level} (${mode}, ${await page.evaluate(() => neo.scene.game?.place ?? 'done')}): sending, take-backs, whistle, hint, saved score and sticker passed`);
    if (level === 9) await page.setViewportSize({ width: 1024, height: 768 });
  }

  // Egg Catch: a finger steers the basket under falling eggs; route levels flip the gates.
  for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter((n) => n >= Number(process.env.FROM_LEVEL || 1) && n <= Number(process.env.TO_LEVEL || 11) && (!only || only === 'eggs'))) {
    if (level >= 8) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('egg-catch', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    if (['predict', 'pair', 'repair', 'flipflop'].includes(mode)) {
      // Distinct routing interactions share two supported misses, then a clean completion.
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const { exitFor } = await import('/src/games/egg-catch/logic.ts');
        const ready = () => g.plan.mode === 'predict' ? g.waiting : g.paired ? g.pairReady && !g.rolling : g.held && !g.rolling;
        await kit.until(ready, 12000);
        if (g.misses || g.hints) throw new Error('the pet preview must be free');
        if (g.plan.mode === 'repair' && (g.traceExit === null || !g.traceArt.context.instructions.length)) throw new Error('missing failed trace');
        for (let attempt = 0; attempt < 2; attempt++) {
          await kit.sleep(350);
          if (g.plan.mode === 'predict') kit.tapOn(g.exits.children[(exitFor(g.gates) + 1) % 4], 0, -20);
          else {
            if (g.plan.mode === 'repair') {
              const wrong = g.traceExit;
              // The unchanged failed run deliberately lands in the same hay.
              if (exitFor(g.gates) !== wrong) throw new Error('repair retry changed its board');
            }
            kit.tapOn(g.goButton);
            await kit.until(() => g.rolling, 2000);
            if (g.plan.mode === 'flipflop') {
              const start = g.gates[0];
              await kit.until(() => g.gates[0] !== start, 4000);
              const gates = [...g.gates];
              kit.tapOn(g.gateHits[1]);
              await kit.sleep(300);
              if (g.gates.some((x, i) => x !== gates[i])) throw new Error('gate touch changed an active pair');
            }
          }
          await kit.until(() => g.misses === attempt + 1 && ready(), 20000);
          if (g.plan.mode !== 'predict' && g.routed !== 0) throw new Error('failed run must keep its board');
        }
        if (!g.hinting || g.hints !== 1 || !g.gateArt.context.instructions.length) throw new Error('two misses must give one visible hint');
      });
      await screenshot(`egg-catch-${level}-hint-portrait`);
    }
    if (mode === 'lane') {
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const first = g.callingLane;
        await kit.sleep(1800);
        if (g.falling.length || g.misses || g.callingLane !== first) throw new Error('hen did not wait for a lane choice');
        const wrong = (first + 1) % 4;
        const x = g.laneX(wrong);
        // Wide targets: tap well away from the centre, first on the shelf, then near the hay.
        const a = g.touch.toGlobal({ x: x + 85, y: 110 }); kit.tap(a.x, a.y);
        await kit.sleep(250);
        if (g.basket.x !== x || g.falling.length || g.misses !== 1) throw new Error('wrong lane must hop, teach once and keep the egg');
        const b = g.touch.toGlobal({ x: x - 85, y: g.floor - 40 }); kit.tap(b.x, b.y);
        await kit.sleep(250);
        if (g.misses !== 2 || g.hints !== 1 || !g.hinting || !g.laneGlow.context.instructions.length) throw new Error('two wrong lanes must light one hint');
      });
      await screenshot('egg-catch-8-hint-portrait');
    }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const canvas = document.querySelector('canvas');
      const touch = (type, x, y) => canvas.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 9, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true, buttons: type === 'pointerup' ? 0 : 1 }));
      if (g.plan.mode === 'lane') {
        for (let i = 0; i < 5; i++) {
          const lane = g.callingLane;
          const p = g.touch.toGlobal({ x: g.laneX(lane) + (i % 2 ? -85 : 85), y: g.floor - 40 }); kit.tap(p.x, p.y);
          await kit.until(() => g.caughtCount > i, 5000);
          if (g.caughtCount < 5 && g.callingLane === lane) throw new Error('calling hen repeated');
        }
        return;
      }
      if (g.plan.mode === 'tap') {
        for (let i = 0; i < g.plan.eggs; i++) {
          await kit.until(() => !g.falling.some((f) => !f.done), 8000);
          await kit.sleep(300);
          kit.tapOn(g.hens[i % g.hens.length], 0, -50);
          await kit.until(() => g.caughtCount > i || g.finished, 8000);
        }
        return;
      }
      if (g.plan.mode === 'catch' || g.plan.mode === 'brown') {
        const y = g.basket.getGlobalPosition().y;
        let down = false;
        const t0 = performance.now();
        while (!g.finished && performance.now() - t0 < 90000) {
          const live = g.falling.filter((f) => !f.done).sort((a, b) => b.t - a.t);
          // Miss the first two brown eggs on purpose (move away), then catch every brown one.
          const target = live.find((f) => f.egg.shell === 'brown');
          let x = g.basket.x;
          if (target) x = g.misses < 2 && g.hints === 0 ? (target.x < neo.view.w / 2 ? neo.view.w - 100 : 180) : target.x;
          else { const white = live[0]; if (white) x = white.x < neo.view.w / 2 ? neo.view.w - 100 : 180; }
          const p = g.basket.parent.toGlobal({ x, y: 0 });
          touch(down ? 'pointermove' : 'pointerdown', p.x, y);
          down = true;
          await kit.sleep(60);
        }
        touch('pointerup', 10, y);
        return;
      }
      if (['predict', 'pair', 'repair', 'flipflop'].includes(g.plan.mode)) {
        const { exitFor, pairGateToFlip, routeTouch, repairTarget } = await import('/src/games/egg-catch/logic.ts');
        const started = performance.now();
        while (!g.finished && performance.now() - started < 180000) {
          const ready = () => g.plan.mode === 'predict' ? g.waiting : g.paired ? g.pairReady && !g.rolling : g.held && !g.rolling;
          if (!await kit.until(() => ready() || g.finished, 12000)) throw new Error('routing board did not become ready');
          if (g.finished) break;
          await kit.sleep(350);
          if (g.plan.mode === 'predict') {
            const n = g.routed;
            kit.tapOn(g.exits.children[exitFor(g.gates)], 0, -20);
            await kit.until(() => g.routed !== n || g.finished, 12000);
          } else {
            let gate;
            if (g.paired) gate = pairGateToFlip(g.pairBoards[g.routed], g.gates);
            else {
              const action = routeTouch(g.gates, repairTarget(g.repairBoards[g.routed]));
              gate = action === 'go' ? null : action;
            }
            if (gate !== null) { kit.tapOn(g.gateHits[gate]); await kit.sleep(300); continue; }
            const n = g.caughtCount;
            kit.tapOn(g.goButton);
            await kit.until(() => g.caughtCount > n || g.finished, 20000);
          }
        }
        if (!g.finished) throw new Error('routing round exceeded its bounded play check');
        return;
      }
      // Routing: two eggs sent the wrong way (gates set away from the target), then the right way. Each egg waits for the arrow.
      const { gatesFor } = await import('/src/games/egg-catch/logic.ts');
      const t0 = performance.now();
      let lastRouted = -1;
      while (!g.finished && performance.now() - t0 < 120000) {
        if (g.routed !== lastRouted) {
          lastRouted = g.routed;
          await kit.until(() => g.held || g.finished, 8000);
          if (g.finished) break;
          if (g.plan.singleGate && (g.gateHits.length !== 1 || g.exits.children.length !== 2)) throw new Error('one gate board must have exactly two exits');
          // No clock: after a long look the egg is still waiting at the top.
          if (g.routed === 0) { await kit.sleep(4500); if (!g.held || g.passed !== 0) throw new Error('egg rolled without the arrow'); }
          if (g.plan.singleGate && g.hinting) {
            if (g.misses !== 2 || g.hints !== 1 || !g.gateArt.context.instructions.length) throw new Error('single gate hint accounting');
          }
          const egg = g.eggs[g.routed % g.eggs.length];
          const exit = g.plan.mode === 'sort' && egg.shell === 'white' ? g.target.nest : g.target.basket;
          const want = [...g.gates];
          for (const { gate, right } of gatesFor(exit, g.plan.singleGate)) want[gate] = right;
          if (g.misses < 2 && g.hints === 0) want[0] = !want[0];
          for (let i = 0; i < g.gateHits.length; i++) if (g.gates[i] !== want[i]) { kit.tapOn(g.gateHits[i]); await kit.sleep(300); }
          kit.tapOn(g.goButton);
          await kit.until(() => !g.held, 3000);
        }
        await kit.sleep(100);
      }
    });
    await screenshot(`egg-catch-${level}`);
    await finished('egg-catch');
    const r = await page.evaluate(() => { const r = kit.store.stats('egg-catch').history.at(-1); return [r.misses, r.hints]; });
    log(`Egg Catch ${level} (${mode}): score ${r}`);
    if (mode === 'tap') assert.deepEqual(r, [0, 0], 'eggs tap score');
    else assert.ok(r[0] >= 2 && r[1] === 1, `eggs ${level} score ${r}`);
    log(`Egg Catch ${level} (${mode}): eggs, basket, gates, hatching, hint, saved score and sticker passed`);
    if (level >= 8) await page.setViewportSize({ width: 1024, height: 768 });
  }

  // Mail Carrier: deliver each letter; a wrong mailbox hands it back.
  for (const level of [1, 2, 3, 4, 5, 10, 9, 12, 11].filter((l) => !process.env.MAIL_LEVELS || process.env.MAIL_LEVELS.split(',').map(Number).includes(l))) {
    if (only && only !== 'mail') break;
    if (level === 11) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('mail-carrier', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    if (level === 11) {
      const targets = await page.evaluate(() => neo.scene.game.houses.map((h) => ({ diameter: 220 * h.scale.x, x: h.x, y: h.y })));
      assert.equal(targets.length, 8, 'portrait keeps four houses per side');
      for (const t of targets) assert.ok(t.diameter >= 100, 'portrait target at least 100 logical units');
      await screenshot('mail-carrier-11-portrait');
    }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let q = 0; q < g.letters.length; q++) {
        await kit.until(() => g.index === q && !g.busy, 15000);
        const right = g.letter;
        if (q === 0 && g.plan.mode === 'drop') {
          // A touch off the houses answers for free: the envelope wiggles and a flag waves.
          kit.tapOn(g.envelope, 0, -140);
          let wiggled = false;
          let waved = false;
          await kit.until(() => { wiggled ||= g.envelope.rotation !== 0; waved ||= g.houses.some((h) => h.flag.rotation !== 0); return wiggled && waved; }, 1000);
          if (!wiggled || !waved) throw new Error(`Mail off-house touch: wiggle ${wiggled}, wave ${waved}`);
          if (!(await kit.until(() => g.envelope.rotation === 0 && g.houses.every((h) => h.flag.rotation === 0), 2000))) throw new Error('Mail wave did not settle');
          // Six quiet seconds bring the invitation back, with a wave.
          g.idle = 6;
          if (!(await kit.until(() => g.houses.some((h) => h.flag.rotation !== 0), 1000))) throw new Error('Mail idle invitation did not wave');
          if (g.misses || g.hints) throw new Error(`Mail free touches counted: ${g.misses} ${g.hints}`);
        }
        if (q === 0 && g.plan.mode !== 'drop') {
          const wrongs = g.plan.mode === 'sides' ? [g.houses.find((h) => h.house.number % 2 !== right.house.number % 2), g.houses.find((h) => h !== right && h.house.number % 2 === right.house.number % 2)] : [g.houses.find((h) => h !== right)];
          for (let k = 0; k < 2; k++) { kit.tapOn(wrongs[k % wrongs.length], 0, -60); await kit.sleep(300); await kit.until(() => !g.busy, 8000); }
          if (g.misses !== 2 || g.hints !== 1 || !right.glow.visible) throw new Error(`Mail hint: ${g.misses} ${g.hints}`);
        }
        kit.tapOn(g.plan.mode === 'drop' ? g.houses[q % g.houses.length] : right, 0, -60);
        await kit.until(() => g.index > q || g.finished, 15000);
      }
    });
    await screenshot(`mail-carrier-${level}`);
    await finished('mail-carrier');
    const r = await page.evaluate(() => { const r = kit.store.stats('mail-carrier').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'drop' ? [0, 0] : [2, 1], `mail ${level} score`);
    log(`Mail Carrier ${level} (${mode}): letters, mailboxes, mistakes, hint, saved score and sticker passed`);
    if (level === 11) await page.setViewportSize({ width: 1024, height: 768 });
  }

  // Photo Safari: photograph the asked-for animal; a wrong photo names what it caught.
  const safariLevels = process.env.SAFARI_LEVELS?.split(',').map(Number)
    ?? Array.from({ length: 7 }, (_, i) => i + 1).filter((l) => l >= Number(process.env.FROM_LEVEL || 1) && l <= Number(process.env.TO_LEVEL || 7));
  for (const level of safariLevels.filter(() => !only || only === 'safari')) {
    await launch('photo-safari', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    if (mode === 'tell') {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(400);
      await screenshot(`photo-safari-${level}-tell-portrait`);
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
    }
    if (level === 5 || level === 7) {
      assert.deepEqual(await page.evaluate(() => {
        const g = neo.scene.game, t = g.target.sighting;
        return [g.scene.sightings.filter((s) => s.action === t.action).length, g.scene.sightings.filter((s) => s.spot === t.spot).length];
      }), [2, 2]);
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(400);
      await screenshot(`photo-safari-${level}-portrait`);
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
    }
    const safariPlay = page.evaluate(async () => {
      const g = neo.scene.game;
      for (let p = 0; p < g.plan.photos; p++) {
        await kit.until(() => g.photos === p && !g.busy && g.actors.length, 15000);
        const right = g.target ?? g.actors[p % g.actors.length];
        if (g.plan.mode === 'tell') {
          const { fewestChips, sameChip, fits } = await import('/src/games/photo-safari/logic.ts');
          if (p === 0) {
            kit.tapOn(g.tellButton); await kit.sleep(200);
            kit.tapOn(right, 0, -60); await kit.sleep(200);
            if (g.misses || g.photos || g.chosen.length) throw new Error('Empty Tell/animal tap must be free');
            const shared = g.chips.find((c) => { const f = fits([c.chip], g.scene.sightings); return f.includes(g.scene.target) && f.length === 2; });
            kit.tapOn(shared); await kit.sleep(200);
            const chosen = JSON.stringify(g.chosen);
            for (let k = 0; k < 2; k++) {
              kit.tapOn(g.tellButton); await kit.until(() => !g.busy, 10000); await kit.sleep(200);
              if (JSON.stringify(g.chosen) !== chosen) throw new Error('Under-informative words must stay');
            }
            if (g.misses !== 2 || g.hints !== 1 || !g.chips.some((c) => c.glow.visible)) throw new Error('Tell hint missing');
            // Every interactive card and Tell retain at least 100 logical units and clear the pet.
            if (g.chips.some((c) => c.x < 225 || c.hitArea.width < 100 || c.hitArea.height < 100)) throw new Error('Tell tray targets');
          }
          const solver = fewestChips(g.scene);
          for (const chip of solver) if (!g.chosen.some((k) => sameChip(k, chip))) {
            kit.tapOn(g.chips.find((c) => sameChip(c.chip, chip))); await kit.sleep(200);
          }
          kit.tapOn(g.tellButton);
          await kit.until(() => g.photos > p, 10000);
          continue;
        }
        if (g.plan.mode === 'changed') {
          // The first tap, on the camera or any animal, photographs the meadow and is never a miss.
          if (g.cameraButton.hitArea.width < 100 || g.cameraButton.hitArea.height < 100) throw new Error('Camera target');
          const before = g.misses;
          if (p === 0) kit.tapOn(g.actors[0], 0, -60); else kit.tapOn(g.cameraButton);
          await kit.until(() => g.phase === 'find' && !g.busy, 10000);
          if (g.misses !== before || !g.pinned.children.length) throw new Error('Meadow photo must be free and pinned');
          const changed = g.target;
          const was = g.scene.before[g.scene.target], now = changed.sighting;
          if ((was.action !== now.action) === (was.spot !== now.spot)) throw new Error('Exactly one thing changes');
          if (p === 0) {
            const wrong = g.actors.find((a) => a !== changed);
            for (let k = 0; k < 2; k++) { kit.tapOn(wrong, 0, -60); await kit.sleep(600); }
            if (g.misses !== 2 || g.hints !== 1 || !changed.glow.visible) throw new Error(`Changed hint: ${g.misses} ${g.hints}`);
            window.__safariShot = true;
            await kit.until(() => !window.__safariShot, 20000);
          }
          kit.tapOn(changed, 0, -60);
          await kit.until(() => g.photos > p, 10000);
          continue;
        }
        if (g.plan.mode === 'true') {
          kit.tapOn(right, 0, -60);
          await kit.until(() => g.phase === 'judge' && !g.busy, 10000);
          if (g.thumbs.some((b) => b.hitArea.width < 100 || b.hitArea.height < 100)) throw new Error('Thumb targets');
          const good = g.thumbs[g.scene.truthy ? 0 : 1], bad = g.thumbs[g.scene.truthy ? 1 : 0];
          if (p === 0) {
            for (let k = 0; k < 2; k++) { kit.tapOn(bad); await kit.sleep(200); await kit.until(() => !g.busy, 10000); }
            if (g.misses !== 2 || g.hints !== 1 || !good.children[0].visible) throw new Error(`Judge hint: ${g.misses} ${g.hints}`);
            window.__safariShot = true;
            await kit.until(() => !window.__safariShot, 20000);
          }
          kit.tapOn(good);
          await kit.until(() => g.photos > p, 10000);
          continue;
        }
        if (p === 0 && g.target) {
          const wrong = g.actors.find((a) => a !== right && (!['both', 'clues'].includes(g.plan.mode) || a.sighting.spot === right.sighting.spot));
          for (let k = 0; k < 2; k++) { kit.tapOn(wrong, 0, -60); await kit.sleep(600); }
          if (g.misses !== 2 || g.hints !== 1 || !right.glow.visible) throw new Error(`Safari hint: ${g.misses} ${g.hints}`);
        }
        kit.tapOn(right, 0, -60);
        await kit.until(() => g.photos > p, 10000);
      }
    });
    if (mode === 'changed' || mode === 'true') {
      // The new screens in portrait: the pinned meadow photo or the held photo and thumbs, with the hint showing.
      await page.waitForFunction(() => window.__safariShot, null, { timeout: 30000 });
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      await screenshot(`photo-safari-${level}-portrait`);
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
      await page.evaluate(() => { window.__safariShot = false; });
    }
    await safariPlay;
    await screenshot(`photo-safari-${level}`);
    await finished('photo-safari');
    const r = await page.evaluate(() => { const r = kit.store.stats('photo-safari').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'snap' ? [0, 0] : [2, 1], `safari ${level} score`);
    log(`Photo Safari ${level} (${mode}): photos, wrong snaps, hint, album, saved score and sticker passed`);
  }

  // Bounce Back: a child finger tracks the ball (after two misses on purpose); a grown-up finger on the left.
  for (let level = Number(process.env.BOUNCE_FROM || 1); level <= 11 && (!only || only === 'bounce'); level++) {
    await launch('bounce-back', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { predictY, paddleForLanding, farWall, ZONES } = await import('/src/games/bounce-back/logic.ts');
      const canvas = document.querySelector('canvas');
      const touch = (type, id, x, y) => canvas.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: id, pointerType: 'touch', isPrimary: id === 21, bubbles: true, cancelable: true, buttons: type === 'pointerup' ? 0 : 1 }));
      const at = (x, y) => g.touch.parent.toGlobal({ x, y });
      const b = g.box;
      if (g.plan.mode === 'together') {
        // A grown-up's finger on the left moves the pink paddle, and the pet steps aside.
        const p = at(b.x0 + 80, b.y0 + 100);
        touch('pointerdown', 22, p.x, p.y);
        await kit.sleep(500);
        if (g.petFace.visible || Math.abs(g.paddles.left - (b.y0 + 100)) > 120) throw new Error('Grown-up paddle not in control');
        touch('pointerup', 22, p.x, p.y);
      }
      let down = false;
      const t0 = performance.now();
      while (!g.finished && performance.now() - t0 < 120000) {
        const ball = g.ball;
        const face = b.x1 - 46;
        let y = ball.vx > 0 ? predictY(ball.x, ball.y, ball.vx, ball.vy, face, b.y0 + 26, b.y1 - 26) : (b.y0 + b.y1) / 2;
        // Stars: strike the ball off-center so it heads for the star.
        if (g.plan.mode === 'stars' && ball.vx > 0) {
          const angle = Math.max(-0.85, Math.min(0.85, Math.atan2(g.starAt.y - y, face - g.starAt.x)));
          y -= (angle / 0.85) * (g.plan.paddle / 2) * 0.9;
        }
        // Color and goal levels: aim at the called zone, or at the end of the wall away from the pet.
        if (ball.vx > 0 && (g.plan.mode === 'color' || g.plan.mode === 'sequence') && g.wantZone >= 0) {
          const geo = g.aim(g.speed());
          y = paddleForLanding(y, geo.top + ((g.wantZone + 0.5) / ZONES.length) * (geo.bottom - geo.top), geo).y;
        } else if (ball.vx > 0 && (g.plan.mode === 'goal' || g.plan.mode === 'versus')) {
          const geo = g.aim(g.speed());
          y = paddleForLanding(y, farWall(g.paddles.left, geo), geo).y;
        }
        // Miss the first two on purpose: hold the paddle at the far end.
        if (g.misses < 2 && g.hints === 0 && ball.vx > 0) y = y < (b.y0 + b.y1) / 2 ? b.y1 - 20 : b.y0 + 20;
        const p = at(b.x1 - 120, y);
        touch(down ? 'pointermove' : 'pointerdown', 21, p.x, p.y);
        down = true;
        await kit.sleep(40);
      }
      touch('pointerup', 21, 0, 0);
    });
    await screenshot(`bounce-back-${level}`);
    await finished('bounce-back');
    const r = await page.evaluate(() => { const r = kit.store.stats('bounce-back').history.at(-1); return [r.misses, r.hints]; });
    // The goal levels score a win by margin: two goals against is one miss.
    assert.deepEqual(r, level === 7 || level === 8 ? [1, 1] : [2, 1], `bounce ${level} score`);
    log(`Bounce Back ${level} (${mode}): rally, pet and grown-up paddles, misses, hint, saved score and sticker passed`);
  }

  // Dot Link: drag real lines through dots; wrong colors, short/long chains and open lines are gentle misses.
  // Level 11 (Find my buddy): a line that is not the wiggling pair shakes and stays (one miss); `DOTS_LEVELS=11` plays only it.
  const dotLevels = process.env.DOTS_LEVELS ? process.env.DOTS_LEVELS.split(',').map(Number) : [1, 2, 3, 4, 5, 6, 11];
  for (const level of dotLevels) {
    if (only && only !== 'dots') break;
    await launch('dot-link', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { findLine, findSquare } = await import('/src/games/dot-link/logic.ts');
      const at = (c) => { const p = g.board.toGlobal({ x: c.c * 108, y: c.r * 108 }); return [p.x, p.y]; };
      const ready = () => kit.until(() => !g.busy || g.finished, 8000);
      const draw = async (cells) => {
        await ready();
        const pts = [];
        cells.forEach((c, i) => {
          if (i) { const [a, b] = [at(cells[i - 1]), at(c)]; pts.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); }
          pts.push(at(c));
        });
        await kit.drag(pts, 1, 40);
        await kit.sleep(150);
        await ready();
      };
      const p = g.plan;
      if (p.mode === 'buddy') {
        const same = (a, b) => a.r === b.r && a.c === b.c;
        const { pairs } = await import('/src/games/dot-link/logic.ts');
        await ready();
        const other = pairs(g.grid).find((q) => !q.every((c) => g.buddy.some((b) => same(b, c))));
        const before = JSON.stringify(g.grid);
        await draw(other);
        if (g.misses !== 1 || g.hints !== 0 || g.progress !== 0 || JSON.stringify(g.grid) !== before) throw new Error(`Buddy miss: ${g.misses} ${g.hints} ${g.progress}`);
        for (let guard = 0; guard < 12 && !g.finished; guard++) { await ready(); await draw([...g.buddy]); }
        return;
      }
      if (p.mode === 'tap') {
        for (let i = 0; i < p.goal; i++) { await ready(); const [x, y] = at({ r: i % p.rows, c: i % p.cols }); kit.tap(x, y); await kit.sleep(200); }
        return;
      }
      // Two misses first where the level can have them.
      if (p.mode !== 'pair') {
        for (let k = 0; k < 2; k++) {
          const other = p.mode === 'color' ? g.palette.find((c) => c !== g.target && findLine(g.grid, 2, c)) : undefined;
          const short = findLine(g.grid, 2, other);
          await draw(short.slice(0, 2));
        }
        if (g.misses !== 2 || g.hints !== 1) throw new Error(`Dot hint: ${g.misses} ${g.hints}`);
      }
      for (let guard = 0; guard < 40 && !g.finished; guard++) {
        await ready();
        if (p.mode === 'square') { const sq = findSquare(g.grid); await draw([...sq, sq[0]]); continue; }
        const want = p.mode === 'chain' ? p.length : 2;
        const line = (p.mode === 'color' && (findLine(g.grid, 4, g.target) || findLine(g.grid, 3, g.target))) || findLine(g.grid, want, g.target);
        await draw(line.slice(0, Math.max(want, p.mode === 'color' ? line.length : want)));
      }
    });
    await screenshot(`dot-link-${level}`);
    await finished('dot-link');
    const r = await page.evaluate(() => { const r = kit.store.stats('dot-link').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'tap' || mode === 'pair' ? [0, 0] : mode === 'buddy' ? [1, 0] : [2, 1], `dots ${level} score`);
    log(`Dot Link ${level} (${mode}): lines, pops, falls, mistakes, hint, saved score and sticker passed`);
  }
}

return { batch };
}
