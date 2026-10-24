import { selectValue } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, context, log, scene, tap, screenshot, launch, finished, batch, next }) {
async function arcade() {
  if (process.env.PARADE_STEERING === '1') {
    await launch('duckling-parade', 2);
    await page.waitForTimeout(400);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const check = (ok, message) => { if (!ok) throw new Error(message); };
      const send = (type, id = 41, x = 900, y = 290, buttons = 1, receiver = document.querySelector('canvas')) => {
        const p = g.ctx.stage.toGlobal({ x, y });
        receiver.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', bubbles: true, clientX: p.x, clientY: p.y, buttons }));
      };
      const target = () => JSON.stringify(g.target);
      send('pointerdown', 41, 900, 200);
      send('pointermove', 41, 2000, -100);
      check(g.target.x === g.field(neo.view).x1 && g.target.y === g.field(neo.view).y0, 'Destination must clamp to meadow');
      check(g.destination.visible && g.destination.eventMode === 'none' && g.destination.x === g.target.x && g.destination.y === g.target.y, 'Immediate noninteractive destination ring missing');
      send('pointerup', 41);
      check(g.steering === null, 'Normal release retained pointer');
      const tapped = target(), start = { x: g.mama.x, y: g.mama.y };
      send('pointermove', 41, 400, 350);
      check(target() === tapped, 'Released pointer still steers');
      await kit.sleep(150);
      check(Math.hypot(g.mama.x - start.x, g.mama.y - start.y) > 10, 'Tap release stopped walking');
      for (const type of ['pointercancel', 'lostpointercapture', 'pointerout']) {
        send('pointerdown');
        send(type, 99, 400, 350, 0, window);
        check(g.steering === 41, 'Unrelated pointer cancelled leader');
        const before = target();
        send(type, 41, 400, 350, 0, window);
        check(g.steering === null && !g.destination.visible && target() === before, `${type} did not clear finger/cue while retaining destination`);
        send('pointermove');
        check(target() === before, `${type}: stale move changed destination`);
        send('pointerup');
      }
      send('pointerdown');
      send('pointermove', 41, 400, 350, 0);
      check(g.steering === null, 'Swallowed mouse/touch release retained leader');
      send('pointerup');
      for (const [receiver, type] of [[window, 'blur'], [document, 'visibilitychange']]) {
        send('pointerdown');
        receiver.dispatchEvent(new Event(type));
        check(g.steering === null && !g.destination.visible, `${type} retained finger/cue`);
        send('pointerup');
      }
      send('pointerdown', 41);
      send('pointerdown', 42, 600, 300);
      const latest = target();
      send('pointermove', 41, 400, 350);
      send('pointerup', 41);
      check(g.steering === 42 && target() === latest, 'Old finger displaced newest leader');
      send('pointerup', 42, 600, 300, 0, window);
      check(g.steering === null, 'Release outside canvas retained leader');
      for (const id of [41, 42, 43]) send('pointerdown', id);
      const beforePalm = target();
      send('pointerdown', 44, 400, 350);
      check(g.steering === 43 && target() === beforePalm, 'Palm rejection changed');
      for (const id of [41, 42, 43, 44]) send('pointerup', id);
      send('pointerdown'); send('pointerup');
      await kit.sleep(1000);
      check(!g.destination.visible, 'Destination cue did not fade');
      window.paradeOld = g;
    });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const g = neo.scene.game;
      const p = g.ctx.stage.toGlobal({ x: neo.view.w - 250, y: neo.view.h * 0.4 });
      kit.tap(p.x, p.y);
    });
    await screenshot('duckling-parade-steering-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await launch('duckling-parade', 2);
    await page.evaluate(() => {
      const g = window.paradeOld;
      if (!g.destroyed || g.steering !== null || g.destination.visible || g.ground.eventNames().length) throw new Error('Destroyed parade retained input/cue');
      delete window.paradeOld;
    });
    log('Duckling Parade: clamped/fading cue, tap walking, cancellation/lost release, newest finger, palm rejection, portrait and destroy passed');
  }
  // Duckling Parade: walk Mama Duck by tapping the grass; wrong ducklings, extras and the pond.
  await page.evaluate(() => {
    window.walkTo = async (x, y) => {
      const g = neo.scene.game;
      const p = neo.scene.game.mama.parent.toGlobal({ x, y: y - 30 });
      kit.tap(p.x, p.y);
      await kit.until(() => Math.hypot(g.mama.x - g.target.x, g.mama.y - g.target.y) < 3 || g.busy, 8000);
    };
    window.fetchDuck = async (d) => {
      const g = neo.scene.game;
      const stillWanted = () => g.plan.mode !== 'pattern' || g.round.pattern[g.line.length] === d.color;
      if (!stillWanted()) return; // Another duck joined while Mama walked; choose the newly needed color.
      await walkTo(d.critter.x, d.critter.y);
      if (!await kit.until(() => d.state === 'line' || !stillWanted(), 3000)) throw new Error(`Duckling ${d.color} would not join: mama ${Math.round(neo.scene.game.mama.x)},${Math.round(neo.scene.game.mama.y)} target ${Math.round(neo.scene.game.target.x)},${Math.round(neo.scene.game.target.y)} duck ${Math.round(d.critter.x)},${Math.round(d.critter.y)} ${d.state} level ${neo.scene.level} busy ${neo.scene.game.busy} home ${neo.scene.game.homeCount} line ${neo.scene.game.line.length}`);
    };
    window.goHome = async () => {
      const g = neo.scene.game;
      await walkTo(g.pondAt.x - 40, g.pondAt.y);
      await kit.until(() => g.busy, 3000);
      await kit.until(() => !g.busy || g.finished, 20000);
    };
  });
  const only = process.env.ARCADE_ONLY;
  if (only !== undefined) selectValue(only, ['scoop', 'roundup', 'launch'], 'ARCADE_ONLY');
  const paradeLevels = process.env.ARCADE_LEVELS?.split(',').map(Number) ?? Array.from({ length: 11 }, (_, i) => i + 1);
  for (const level of paradeLevels.filter((n) => n >= 1 && n <= 11)) {
    if (only && only !== 'parade') continue;
    await launch('duckling-parade', level);
    await page.waitForTimeout(500);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const loose = () => g.ducklings.filter((d) => d.state === 'loose');
      const joinable = (d) => d.state === 'loose' && (g.plan.mode === 'pattern' ? d.color === g.round.pattern[g.line.length] : !g.round.want || d.color === g.round.want);
      if (neo.scene.level === 6) {
        // Separate the refusal approach from eligible pickups, so a random
        // meadow cannot collect part of the later partial-delivery fixture.
        // Restore ducks picked up at spawn before this fixture was installed.
        for (const d of g.line.splice(0)) d.state = 'loose';
        g.trail.length = 0;
        for (const d of loose()) {
          d.home = joinable(d) ? { fx: 0.55, fy: 0.85 } : { fx: 0.15, fy: 0.2 };
          d.critter.position.copyFrom(g.spotAt(d.home));
        }
        await kit.sleep(50);
      }
      // Stop on a duckling that can't join yet: two gentle misses light up the right ones.
      // The wrong duckling farthest from any right one, approached from the far side, so no right
      // one joins first (which would rightly spend the tap).
      const gap = (d) => Math.min(...loose().filter(joinable).map((j) => Math.hypot(j.critter.x - d.critter.x, j.critter.y - d.critter.y)));
      const wrong = loose().filter((d) => !joinable(d)).sort((a, b) => gap(b) - gap(a))[0];
      if (wrong) {
        const j = loose().filter(joinable).sort((a, b) => Math.hypot(a.critter.x - wrong.critter.x, a.critter.y - wrong.critter.y) - Math.hypot(b.critter.x - wrong.critter.x, b.critter.y - wrong.critter.y))[0];
        const away = j ? Math.atan2(wrong.critter.y - j.critter.y, wrong.critter.x - j.critter.x) : Math.PI;
        g.mama.position.set(wrong.critter.x + Math.cos(away) * 95, wrong.critter.y + Math.sin(away) * 95); g.target.x = g.mama.x; g.target.y = g.mama.y; g.trail.length = 0;
        await walkTo(wrong.critter.x, wrong.critter.y);
        await kit.until(() => g.misses > 0, 3000);
        await kit.sleep(3800);
        if (g.misses < 2) {
          await walkTo(wrong.critter.x, wrong.critter.y);
          await kit.until(() => g.misses >= 2, 3000);
        }
        if (g.misses !== 2 || g.hints !== 1) throw new Error(`Refusals: ${g.misses} misses, ${g.hints} hints, level ${neo.scene.level}, line ${g.line.map((d) => d.color)}, wrong ${wrong.color} ${wrong.state}, near ${g.ducklings.filter((d) => d !== wrong && Math.hypot(d.critter.x - wrong.critter.x, d.critter.y - wrong.critter.y) < 150).map((d) => d.color + d.state)}`);
        if (!g.ducklings.some((d) => d.glow.visible)) throw new Error('No hint glow');
        await walkTo(g.mama.x, g.mama.y - 160);
      }
      if (g.plan.mode === 'tap') {
        for (const d of [...g.ducklings]) if (d.state === 'loose') await fetchDuck(d);
        if (!await kit.until(() => g.finished, 20000)) throw new Error('Lap parade never went home');
        return;
      }
      if (neo.scene.level === 6) {
        // Keep the first trip separate from the remaining wanted-color ducks. This
        // fixture changes only meadow positions; collection and arrivals use real taps.
        const wanted = loose().filter(joinable);
        if (g.line.length) throw new Error('Partial-delivery fixture needs an empty line');
        for (const d of loose()) {
          d.home = joinable(d) ? { fx: 0.35, fy: 0.85 } : { fx: 0.05, fy: 0.1 };
        }
        wanted[0].home = { fx: 0.55, fy: 0.15 };
        for (const d of loose()) d.critter.position.copyFrom(g.spotAt(d.home));
        g.mama.position.set(wanted[0].critter.x - 120, wanted[0].critter.y);
        g.target.x = g.mama.x; g.target.y = g.mama.y; g.trail.length = 0;
        const speech = [];
        const say = g.ctx.say.bind(g.ctx);
        g.ctx.say = (id, values) => { speech.push({ id, values }); return say(id, values); };
        await kit.sleep(50); // Render the moved fixture before hit-testing.
        await fetchDuck(wanted[0]);
        if (g.line.length !== 1) throw new Error('First trip must contain one duckling');
        await goHome();
        if (g.homeCount !== 1 || g.finished || g.misses !== 2 || g.hints !== 1) throw new Error('Partial trip changed accounting or finished early');
        for (const d of wanted.slice(1)) if (d.state === 'loose') await fetchDuck(d);
        const batch = g.line.length;
        if (batch !== g.round.target) throw new Error(`Expected ${g.round.target} in second batch, got ${batch}`);
        await goHome();
        if (!await kit.until(() => g.finished, 15000)) throw new Error('Partial/extras parade unfinished');
        const extra = speech.find((s) => s.id === 'parade.extra');
        if (extra?.values.count !== 1 + batch || extra.values.n !== g.round.target) throw new Error('Extra speech must name combined total, not second batch');
        const { SCRIPT } = await import('/src/content/voice-script.ts');
        if (!SCRIPT['parade.extra'].every((s) => s.includes('{count} ducklings altogether') && s.includes('{n} in the pond'))) throw new Error('Extra speech lost total/pond distinction');
        if (g.homeCount !== g.round.target || wanted.filter((d) => d.state === 'loose').length !== 1) throw new Error('Extra duckling did not return to meadow');
        return;
      }
      // Counting levels: bring one too many, and the extra hops back out.
      const want = g.round.target !== undefined ? g.round.target + 1 : g.round.pattern ? g.round.pattern.length : g.ducklings.filter((d) => !g.round.want || d.color === g.round.want).length;
      for (let guard = 0; g.line.length < want && guard < 20; guard++) {
        const d = loose().filter(joinable).sort((a, b) => Math.hypot(a.critter.x - g.mama.x, a.critter.y - g.mama.y) - Math.hypot(b.critter.x - g.mama.x, b.critter.y - g.mama.y))[0];
        if (!d) break;
        await fetchDuck(d);
      }
      await goHome();
      if (!await kit.until(() => g.finished, 15000)) throw new Error(`Parade unfinished: ${g.homeCount} home, line ${g.line.length}`);
    });
    await page.evaluate(() => { const g = neo.scene.game; if (g.steering !== null || g.destination.visible) throw new Error('Finished parade retained steering/cue'); });
    await screenshot(`duckling-parade-${level}`);
    await finished('duckling-parade');
    const r = await page.evaluate(() => { const r = kit.store.stats('duckling-parade').history.at(-1); return [r.misses, r.hints]; });
    const expected = { tap: [0, 0], walk: [0, 0], count: [1, 0], color: [2, 1], colorCount: [3, 1], pattern: [2, 1] }[mode];
    assert.deepEqual(r, expected, `parade ${level} score`);
    log(`Duckling Parade ${level} (${mode}): walking, joining, pond, saved score and sticker passed`);
  }

  // Scoop Shop: wrong flavors and extra scoops bounce back; two lead to a glowing tub; memory peeks.
  const scoopLevels = process.env.ARCADE_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6, 10, 11, 12, 13];
  for (const level of (!only || only === 'scoop') ? scoopLevels : []) {
    await launch('scoop-shop', level);
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    if ([10, 11, 12, 13].includes(level)) {
      await page.waitForFunction(() => !neo.scene.game.busy && !!neo.scene.game.cone);
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      await screenshot(`scoop-shop-${level}-portrait`);
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
    }
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'customer') {
        if ([...g.tubs.values()].some(t => t.visible)) throw new Error('Customer match exposed tubs');
        for (let c = 0; c < 3; c++) {
          if (!await kit.until(() => g.customerIndex === c && !g.busy && g.cone, 15000)) throw new Error('Customer match not ready');
          await kit.sleep(80);
          const choice = g.choices[c];
          const waiting = g.guests[1 - choice.match];
          const tapSide = (side, picture = false) => { const at = g.guests[side].toGlobal({ x: 0, y: picture ? -420 : -150 }); kit.tap(at.x, at.y); };
          if (g.cone.colors.join() !== choice.scoop) throw new Error('Wrong prepared cone');
          const original = [g.misses, g.hints];
          kit.tapOn(g.cone, 0, -12); await kit.sleep(350);
          if (g.misses !== original[0] || g.hints !== original[1]) throw new Error('Cone exploration counted');
          if (c === 0) {
            tapSide(1 - choice.match); await kit.sleep(700);
            tapSide(1 - choice.match, true); await kit.sleep(700);
            if (g.misses !== 2 || g.hints !== 1 || !g.hinted || !g.tubGlow.context.instructions.length) throw new Error('Customer hint accounting/glow');
          }
          tapSide(choice.match, c % 2 === 0);
          if (!await kit.until(() => g.customerIndex > c || g.finished, 15000)) throw new Error('Matching customer did not eat');
          if (c < 2 && !g.guests.includes(waiting)) throw new Error('Unserved customer left');
        }
        return;
      }
      const tap = async (color) => { await kit.until(() => !g.busy, 8000); kit.tapOn(g.tubs.get(color), 0, -20); await kit.sleep(150); await kit.until(() => !g.busy || g.customerIndex >= g.orders.length, 8000); };
      for (let c = 0; c < g.orders.length; c++) {
        await kit.until(() => g.customerIndex === c && !g.busy && g.cone, 8000);
        const order = g.order;
        if (c === 0 && g.plan.mode !== 'memory') {
          // Tapping the customer says the order again: free, never a miss or a hint.
          kit.tapOn(g.customer, 0, -80);
          await kit.sleep(300);
          if (g.misses || g.hints) throw new Error(`Scoop customer tap counted: ${g.misses} ${g.hints}`);
        }
        if (c === 0 && g.plan.mode === 'free' && g.plan.max > 1) {
          // A second tap while a scoop is in the air wobbles its tub and adds nothing.
          kit.tapOn(g.tubs.get(g.flavors[0]), 0, -20);
          await kit.sleep(250);
          kit.tapOn(g.tubs.get(g.flavors[1]), 0, -20);
          await kit.until(() => !g.busy, 8000);
          if (g.cone.colors.length !== 1) throw new Error(`Scoop tap during flight: ${g.cone.colors.length} scoops`);
        }
        if (c === 0 && g.plan.mode !== 'free') {
          const wrong = g.flavors.find((f) => !order.scoops.includes(f)) ?? g.flavors.find((f) => f !== order.scoops[0]);
          await tap(wrong); await tap(wrong);
          if (g.misses !== 2 || g.hints !== 1 || g.cone.colors.length !== (order.start ?? 0) || !g.tubGlow.context.instructions.length) throw new Error(`Scoop hint: ${g.misses} ${g.hints}`);
        }
        if (c === 1 && g.plan.mode === 'memory') {
          await kit.until(() => g.hidden, 8000);
          kit.tapOn(g.customer, 0, -80);
          await kit.until(() => !g.hidden, 3000);
          await kit.until(() => g.hidden, 10000);
          if (g.hints !== 2) throw new Error('Peek not counted');
        }
        if (g.plan.start && g.cone.colors.length !== order.start) throw new Error('Missing prefilled scoops');
        if (g.plan.mode === 'mixed') {
          // Alternate which colour is filled first; a saturated colour must bounce before the other is complete.
          const rows = (await import('/src/games/scoop-shop/logic.ts')).scoopCounts(order);
          const row = rows[c % 2];
          for (let i = 0; i < row.count; i++) await tap(row.color);
          if (c === 1) {
            const n = g.cone.colors.length;
            await tap(row.color);
            if (g.cone.colors.length !== n || g.misses !== 3) throw new Error('Extra colour count stayed on cone');
          }
        }
        const want = g.plan.mode === 'free' ? Array(g.plan.max).fill(g.flavors[0]) : null;
        for (let guard = 0; guard < 8 && g.order === order && !g.busy; guard++) {
          const next = want ? want[guard] : (await import('/src/games/scoop-shop/logic.ts')).nextNeeded(order, g.cone.colors);
          if (!next) break;
          await tap(next);
        }
        await kit.until(() => g.customerIndex > c || g.finished, 15000);
      }
    });
    await screenshot(`scoop-shop-${level}`);
    await finished('scoop-shop');
    const r = await page.evaluate(() => { const r = kit.store.stats('scoop-shop').history.at(-1); return [r.misses, r.hints]; });
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1, 'one sticker per Scoop Shop round');
    assert.deepEqual(r, mode === 'free' ? [0, 0] : mode === 'memory' ? [2, 2] : mode === 'mixed' ? [3, 1] : [2, 1], `scoop ${level} score`);
    log(`Scoop Shop ${level} (${mode}): orders, bounced scoops, hint glow${mode === 'memory' ? ', peeking' : ''}, saved score and sticker passed`);
  }

  // Roundup: a real finger shoos each animal through a gate; wrong pens and extras hop back out.
  await page.evaluate(() => {
    const canvas = () => document.querySelector('canvas');
    const touch = (type, x, y) => canvas().dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true, buttons: type === 'pointerup' ? 0 : 1 }));
    /** Keep a finger behind the animal and walk it to the gate of pen `i`, then through. */
    window.herdInto = async (a, i, ms = 14000) => {
      const g = neo.scene.game;
      const r = g.pens[i].rect;
      const t0 = performance.now();
      let down = false;
      while (a.state === 'loose' && performance.now() - t0 < ms) {
        const c = a.critter;
        const outside = c.x < r.x - 50 || Math.abs(c.y - (r.y + r.h / 2)) > r.h * 0.2;
        const goal = outside && !(c.x > r.x - 70 && Math.abs(c.y - (r.y + r.h / 2)) < r.h * 0.2) ? { x: r.x - 60, y: r.y + r.h / 2 } : { x: r.x + 80, y: r.y + r.h / 2 };
        const dx = goal.x - c.x, dy = goal.y - c.y, d = Math.hypot(dx, dy) || 1;
        const f = neo.scene.game.touch.parent.toGlobal({ x: c.x - (dx / d) * 95, y: c.y - 30 - (dy / d) * 95 });
        touch(down ? 'pointermove' : 'pointerdown', f.x, f.y);
        down = true;
        await kit.sleep(30);
      }
      if (down) { const f = neo.scene.game.touch.parent.toGlobal({ x: 200, y: 200 }); touch('pointerup', f.x, f.y); }
      await kit.sleep(200);
    };
    /** Come along: hold a finger just ahead of the herd and walk it to the gate, then inside. */
    window.leadHerd = async (ms = 20000) => {
      const g = neo.scene.game;
      const { leadGoal } = await import('/src/games/roundup/logic.ts');
      const r = g.pens[0].rect;
      const t0 = performance.now();
      let down = false;
      for (let L; (L = g.animals.filter((a) => a.state === 'loose')).length && performance.now() - t0 < ms;) {
        const c = { x: L.reduce((s, a) => s + a.critter.x, 0) / L.length, y: L.reduce((s, a) => s + a.critter.y, 0) / L.length };
        const goal = leadGoal(c, r);
        const dx = goal.x - c.x, dy = goal.y - c.y, d = Math.hypot(dx, dy) || 1, ahead = 160;
        const f = g.touch.parent.toGlobal({ x: c.x + (dx / d) * ahead, y: c.y - 30 + (dy / d) * ahead });
        touch(down ? 'pointermove' : 'pointerdown', f.x, f.y);
        down = true;
        await kit.sleep(30);
      }
      if (down) { const f = g.touch.parent.toGlobal({ x: 200, y: 200 }); touch('pointerup', f.x, f.y); }
      await kit.sleep(200);
    };
  });
  const roundupLevels = (only === 'roundup' ? process.env.ARCADE_LEVELS?.split(',').map(Number) : undefined) ?? [1, 11, 10, 2, 3, 4, 5, 6, 7, 8, 9, 12];
  // Come along plays twice: led by a finger at lap, then left alone at toddler so the drift brings the herd home.
  const roundupPlays = roundupLevels.flatMap((level) => level === 11 ? [[11, 'lap'], [11, 'toddler']] : [[level]]);
  for (const [level, playBand] of (!only || only === 'roundup') ? roundupPlays : []) {
    await launch('roundup', level, 'Mia', playBand);
    const stickersBefore = await page.evaluate(() => kit.store.data.stickers.length);
    await page.waitForTimeout(600);
    if (level === 12) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
      await screenshot('roundup-12-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
    }
    if (level === 3) {
      // Two shepherds: two fingers each shoo with their own ring; a cancelled touch and a palm add no stray shoo.
      const two = await page.evaluate(async () => {
        const g = neo.scene.game;
        const canvas = document.querySelector('canvas');
        const fire = (type, id, p, on = canvas) => on.dispatchEvent(new PointerEvent(type, { clientX: p.x, clientY: p.y, pointerId: id, pointerType: 'touch', bubbles: true, cancelable: true, buttons: type === 'pointerdown' || type === 'pointermove' ? 1 : 0 }));
        const toScreen = (x, y) => g.touch.parent.toGlobal({ x, y });
        const a = g.animals.find((x) => x.state === 'loose');
        const far = { x: g.field().x0 + 20, y: g.field().y1 - 10 };
        // Finger 21 parks far away; finger 22 lands just left of the animal, so only the second finger can move it.
        fire('pointerdown', 21, toScreen(far.x, far.y));
        const near = { x: a.critter.x - 70, y: a.critter.y - 30 };
        fire('pointerdown', 22, toScreen(near.x, near.y));
        await kit.sleep(60);
        fire('pointermove', 22, toScreen(near.x + 2, near.y));
        await kit.sleep(60);
        const tracked = g.fingers.size, positioned = [...g.fingers.values()].filter(Boolean).length;
        const rings = g.fingerRing.context.instructions.filter((i) => i.action === 'stroke').length;
        const x0 = a.critter.x;
        await kit.sleep(400);
        const moved = a.critter.x - x0;
        // A cancelled touch is dropped (Pixi never forwards pointercancel), and lifting one finger leaves the other shooing.
        window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 21, pointerType: 'touch' }));
        fire('pointercancel', 21, toScreen(far.x, far.y));
        const afterCancel = g.fingers.size;
        // A palm: three more contacts make four on the glass, and the fourth is ignored.
        for (const id of [31, 32, 33]) fire('pointerdown', id, toScreen(far.x + id, far.y - 40));
        const withPalm = g.fingers.size;
        for (const id of [22, 31, 32, 33]) fire('pointerup', id, toScreen(far.x, far.y));
        await kit.sleep(60);
        return { tracked, positioned, rings, moved, afterCancel, withPalm, left: g.fingers.size };
      });
      if (two.tracked !== 2 || two.positioned !== 2 || two.rings !== 2 || !(two.moved > 20) || two.afterCancel !== 1 || two.withPalm !== 3 || two.left !== 0) throw new Error(`Roundup two shepherds: ${JSON.stringify(two)}`);
      log(`roundup two shepherds: ${JSON.stringify(two)}`);
    }
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const loose = () => g.animals.filter((a) => a.state === 'loose');
      const speech = [];
      const say = g.ctx.say.bind(g.ctx), instruct = g.ctx.instruct.bind(g.ctx);
      g.ctx.say = (id, values) => { speech.push({ id, values }); return say(id, values); };
      g.ctx.instruct = (id, values) => { speech.push({ id, values }); return instruct(id, values); };
      g.start();
      const { SCRIPT } = await import('/src/content/voice-script.ts');
      const instruction = speech.at(-1);
      const spoken = SCRIPT[instruction.id][0].replace(/\{(\w+)\}/g, (_, key) => instruction.values[key]);
      const { PLURAL, PLACE, animalsFor } = await import('/src/games/roundup/logic.ts');
      for (const { pen } of g.pens) {
        const word = g.plan.sequential ? pen.kind : pen.target === undefined ? PLURAL[pen.kind] : animalsFor(pen.kind, pen.target);
        if (!spoken.includes(word) || (g.pens.length === 2 && !g.herd.fair && !pen.size && !spoken.includes(PLACE[pen.kind]))) throw new Error(`Wrong instruction: ${spoken}`);
      }
      if (g.plan.mode === 'tap') {
        // A lap tap on the grass or the sign answers, and is never a miss or a hint.
        const grass = g.touch.parent.toGlobal({ x: neo.view.w / 2, y: neo.view.h * 0.22 });
        kit.tap(grass.x, grass.y); await kit.sleep(600);
        kit.tapOn(g.pens[0].sign); await kit.sleep(600);
        if (g.misses || g.hints || g.animals.some((a) => a.state !== 'loose')) throw new Error(`Lap grass/sign tap: ${g.misses} ${g.hints}`);
        // Layouts vary per round, so neighbours' tap circles can overlap: either one hopping home is right.
        for (let k = 0; k < 8 && loose().length; k++) {
          const n = loose().length;
          kit.tapOn(loose()[0].critter, 0, -40);
          await kit.until(() => loose().length < n && g.animals.every((a) => a.state !== 'hopping'), 4000);
        }
      } else if (g.plan.mode === 'follow') {
        if (g.animals.length !== 3 || loose().length !== 3 || g.pens.length !== 1 || g.plan.gate !== 0.8) throw new Error('Come along must start with three loose animals and one wide pen');
        if (g.ctx.band === 'lap') {
          await leadHerd();
          if (!g.finished && loose().length) throw new Error(`Come along: ${loose().length} still loose after leading`);
        } else {
          // Nobody touches: fifteen idle seconds start the drift, which brings everyone home for one hint.
          g.sinceProgress = 14.8;
          await kit.until(() => g.drifting && g.hinting, 1500);
          if (g.hints !== 1 || !loose()[0].glow.visible) throw new Error('Come along drift hint missing');
          await kit.until(() => g.finished, 25000);
          if (g.pens[0].inside !== 3 || g.misses || g.hints !== 1) throw new Error(`Come along drift finish: ${g.pens[0].inside}/${g.misses}/${g.hints}`);
        }
      } else if (g.plan.sequential) {
        if (g.animals.length !== 2 || loose().length !== 1 || g.animals[1].critter.visible) throw new Error('Shoo one must start with exactly one visible loose animal');
        if (g.plan.gate !== 0.8 || g.plan.fleeRadius !== 190) throw new Error('Shoo one gate/steering changed');
        await herdInto(loose()[0], 0);
        if (g.finished || g.pens[0].inside !== 1 || g.misses || g.hints) throw new Error('First success finished early or added support');
        await kit.until(() => loose().length === 1 && !g.busy, 3000);
        if (g.animals[0].state !== 'penned' || !g.animals[1].critter.visible || g.sinceProgress > 1) throw new Error('Second animal did not get fresh support');
        // Advance idle time only; the real update loop must show and account for both forms of help.
        g.sinceProgress = 9.8;
        await kit.until(() => g.hinting, 1500);
        if (g.hints !== 1 || !loose()[0].glow.visible || !g.pens[0].glow.context.instructions.length) throw new Error('Ten-second animal/gate glow missing');
        g.sinceProgress = 19.8;
        await kit.until(() => g.finished, 5000);
        if (g.pens[0].inside !== 2 || g.misses !== 0 || g.hints !== 2) throw new Error(`Shoo one supported finish: ${g.pens[0].inside}/${g.misses}/${g.hints}`);
      } else {
        if (g.plan.mode === 'sort') {
          // Twice into the wrong pen: two gentle misses and a glow.
          for (let k = 0; k < 2; k++) {
            const a = loose().find((x) => x.kind === g.pens[0].pen.kind);
            await herdInto(a, 1);
            await kit.until(() => a.state === 'loose', 3000);
            await kit.sleep(2100);
          }
          if (g.misses !== 2 || g.hints < 1) throw new Error(`Wrong pens: ${g.misses} ${g.hints}`);
          if (speech.find((s) => s.id === 'herd.wrongpen')?.values.pen !== g.pens[1].pen.kind) throw new Error('Wrong-pen speech names another kind');
        }
        if (g.plan.mode === 'size') {
          if (g.bell.visible || g.animals.length !== 6 || !spoken.includes('Big pigs') || !spoken.includes('Little pigs')) throw new Error('Size instruction or cast missing');
          for (const a of g.animals) {
            const scale = a.size === 'little' ? 0.22 : 0.32;
            if (Math.abs(a.critter.scale.y - scale) > 0.001 || Math.abs(a.critter.hitArea.radius * scale - 85) > 0.001 || a.critter.hitArea.y !== -120) throw new Error('Size scale or centred forgiving hit area missing');
            if (g.pens[g.needs(a)].pen.size !== a.size) throw new Error('Hint/bot targeted wrong size');
          }
          // Two actual wrong gate crossings; keep neighbours out of the route.
          const wrong = loose().find((a) => a.size === 'big');
          for (let k = 0; k < 2; k++) {
            for (const a of loose()) { a.critter.x = 280; a.wander.next = 20; a.wander.x = 280; }
            const r = g.pens[1].rect;
            wrong.critter.position.set(r.x - 60, r.y + r.h / 2);
            wrong.vx = wrong.vy = 0;
            await kit.sleep(60);
            await herdInto(wrong, 1);
            await kit.until(() => wrong.state === 'loose', 3000);
            await kit.sleep(2100);
          }
          if (g.misses !== 2 || g.hints !== 1 || g.pens.some((p) => p.inside)) throw new Error('Size rejection or hint accounting incorrect');
          if (!speech.some((s) => s.id === 'herd.wrongsize' && s.values.size === 'little' && s.values.needed === 'big') || !speech.some((s) => s.id === 'herd.sizehint')) throw new Error('Size feedback missing');
          if (!loose().every((a) => a.glow.visible) || !g.pens.every((p) => p.glow.context.instructions.length)) throw new Error('Size hint glows missing');
        }
        if (g.plan.mode === 'sortStay') {
          if (!spoken.includes('cows stay on the grass') || g.bell.visible) throw new Error('Outsider instruction or finish rule missing');
          // Isolate each gate crossing from neighbours, then use the ordinary finger steering.
          const outsider = loose().find((a) => a.kind === g.herd.stay);
          for (let k = 0; k < 2; k++) {
            for (const a of loose()) {
              a.critter.x = 280; a.wander.next = 20; a.wander.x = 280;
            }
            const r = g.pens[k].rect;
            outsider.critter.position.set(r.x - 60, r.y + r.h / 2);
            outsider.vx = outsider.vy = 0;
            await kit.sleep(60);
            await herdInto(outsider, k);
            await kit.until(() => outsider.state === 'loose', 3000);
            await kit.sleep(2100);
          }
          if (g.misses !== 2 || g.hints !== 1 || !speech.some((s) => s.id === 'herd.stayout' && s.values.outsiders === 'cows')) throw new Error('Outsider misses or feedback incorrect');
          if (g.animals.some((a) => a.kind === g.herd.stay && (a.glow.visible || g.needs(a) !== -1))) throw new Error('Outsider was offered as a hint');
          if (!loose().filter((a) => a.kind !== g.herd.stay).every((a) => a.glow.visible)) throw new Error('Needed animals did not glow');
          if (!g.pens.every((p) => p.glow.context.instructions.length)) throw new Error('Needed gates did not glow');
        }
        if (g.plan.mode === 'fair') {
          if (!spoken.includes('same number') || !g.bell.visible || g.pens[0].pen.kind !== g.pens[1].pen.kind || ![6, 8].includes(g.animals.length)) throw new Error('Make it fair setup');
          if (g.pens.some((p) => p.pen.target !== undefined)) throw new Error('Make it fair sign must show no number');
          // Some in one pen and none in the other: a miss, the empty pen named, and nobody hops out.
          // Isolate each crossing so the ordinary steering takes exactly one in.
          const isolate = async (k) => {
            const one = loose()[0];
            for (const a of loose()) { a.critter.x = 280; a.wander.next = 20; a.wander.x = 280; }
            const rk = g.pens[k].rect;
            one.critter.position.set(rk.x - 60, rk.y + rk.h / 2);
            one.vx = one.vy = 0;
            await kit.sleep(60);
            await herdInto(one, k);
          };
          while (g.pens[0].inside < 2 && loose().length) await isolate(0);
          const first = g.pens.map((p) => p.inside);
          if (first[1] === 0) {
            kit.tapOn(g.bell); await kit.sleep(300);
            await kit.until(() => !g.busy, 8000);
            if (g.misses !== 1 || !speech.some((s) => s.id === 'herd.fairempty') || g.pens[0].inside !== first[0]) throw new Error(`Empty pen bell: ${g.misses} ${g.pens.map((p) => p.inside)}`);
            // One in the other pen: unequal, so the pet says both counts and the extras leave the fuller pen.
            await isolate(1);
            const second = g.pens.map((p) => p.inside);
            if (second[0] === second[1]) throw new Error(`Second pen setup came out level: ${second}`);
            {
              kit.tapOn(g.bell); await kit.sleep(300);
              await kit.until(() => !g.busy, 10000);
              const unfair = speech.find((s) => s.id === 'herd.unfair');
              if (g.misses !== 2 || !unfair || unfair.values.more !== Math.max(...second) || unfair.values.less !== Math.min(...second)) throw new Error(`Unequal bell: ${g.misses} ${JSON.stringify(unfair)}`);
              if (g.pens[0].inside !== g.pens[1].inside) throw new Error(`Extras did not leave the fuller pen: ${g.pens.map((p) => p.inside)}`);
              if (g.hints < 1) throw new Error('Two wrong bells must glow the emptier pen');
              // Level pens with animals still loose are a right answer: idle help wiggles only the bell and trots nobody in.
              const level = g.pens.map((p) => p.inside);
              g.sinceProgress = 29.8;
              await kit.sleep(1500);
              if (g.pens.some((p, i) => p.inside !== level[i]) || loose().some((a) => a.glow.visible) || g.pens.some((p) => p.glow.context.instructions.length)) throw new Error(`Idle help unbalanced level pens: ${g.pens.map((p) => p.inside)}`);
            }
          }
        }
        if (g.plan.prefilled) {
          const p = g.pens[0];
          if (![4, 5].includes(p.pen.target) || ![1, 2, 3].includes(p.pen.start) || p.inside !== p.pen.start || loose().length !== 6) throw new Error('Fill it up initial counts');
          if (!spoken.includes(`${p.inside} are in`) || !spoken.includes('Put in the rest')) throw new Error(`Fill instruction: ${spoken}`);
          if (!g.animals.filter((a) => a.state === 'penned').every((a) => a.pen === 0 && a.critter.x > p.rect.x)) throw new Error('Prefill was not placed inside');
          // Too few: count from one, then name the current remainder. Two wrong bells add one hint.
          for (let k = 0; k < 2; k++) {
            speech.length = 0;
            kit.tapOn(g.bell); await kit.sleep(300);
            await kit.until(() => !g.busy, 10000);
            const counts = speech.filter((s) => s.id === 'count').map((s) => s.values.n);
            if (JSON.stringify(counts) !== JSON.stringify(Array.from({ length: p.inside }, (_, i) => i + 1))) throw new Error(`Recount: ${counts}`);
            if (!speech.some((s) => s.id === 'herd.more' && s.values.n === p.pen.target - p.inside)) throw new Error('Wrong spoken remainder');
          }
          if (g.misses !== 2 || g.hints !== 1 || !loose().every((a) => a.glow.visible)) throw new Error(`Fill support: ${g.misses}/${g.hints}`);
          // An idle hint after a new arrival must use the present count, not the prefill.
          const a = loose()[0];
          await herdInto(a, 0);
          if (p.inside < p.pen.target) {
            speech.length = 0;
            g.sinceProgress = 14.8;
            await kit.until(() => g.hinting && !g.recounting, 10000);
            if (!speech.some((s) => s.id === 'herd.more' && s.values.n === p.pen.target - p.inside)) throw new Error('Hint reused the initial remainder');
          }
        }
        if (g.plan.mode === 'count') {
          // One too many, then the bell: the extra hops back out.
          while (g.pens[0].inside <= g.pens[0].pen.target && loose().length) await herdInto(loose()[0], 0);
          kit.tapOn(g.bell); await kit.sleep(300);
          await kit.until(() => !g.busy, 8000);
          if (g.misses !== (g.plan.prefilled ? 3 : 1) || g.pens[0].inside !== g.pens[0].pen.target) throw new Error(`Extra not noticed: ${g.misses} ${g.pens[0].inside}`);
        }
        // Shooing can sweep a neighbor in too; the bell sends extras back out, so herd and ring until right.
        for (let round = 0; round < 4 && !g.finished; round++) {
          for (let guard = 0; guard < 20 && !g.finished; guard++) {
            const a = loose().find((x) => g.needs(x) >= 0);
            if (!a) break;
            await herdInto(a, g.needs(a));
          }
          if (!g.bell.visible) break;
          kit.tapOn(g.bell); await kit.sleep(300);
          await kit.until(() => !g.busy || g.finished, 10000);
        }
      }
      if (!await kit.until(() => g.finished, 8000)) throw new Error(`Roundup unfinished: ${g.pens.map((p) => p.inside).join(',')}`);
      if (g.plan.mode === 'sortStay') {
        // A cow swept into a gate beside the last pig can still be finishing its hop back out.
        await kit.until(() => g.animals.filter((a) => a.kind === g.herd.stay).every((a) => a.state === 'loose'), 2000);
        if (!g.animals.filter((a) => a.kind === g.herd.stay).every((a) => a.state === 'loose')) throw new Error('Cows did not stay on the grass');
        if (g.pens.some((p) => p.inside !== 2)) throw new Error('Required pen incomplete');
        if (!speech.some((s) => s.id === 'herd.staydone') || speech.some((s) => s.id === 'herd.done')) throw new Error('Completion speech must include the outsiders');
      }
      if (g.plan.mode === 'fair') {
        await kit.until(() => speech.some((s) => s.id === 'herd.fairdone'), 6000);
        const done = speech.find((s) => s.id === 'herd.fairdone');
        if (!done || g.pens[0].inside !== g.pens[1].inside || done.values.n !== g.pens[0].inside || speech.some((s) => s.id === 'herd.done')) throw new Error(`Fair finish: ${g.pens.map((p) => p.inside)} ${JSON.stringify(done)}`);
      }

    });
    await screenshot(`roundup-${level}${playBand ? `-${playBand}` : ''}`);
    await finished('roundup');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickersBefore + 1, 'one Roundup sticker per whole round');
    const r = await page.evaluate(() => { const r = kit.store.stats('roundup').history.at(-1); return [r.misses, r.hints]; });
    log(`Roundup ${level} (${mode}): score ${r}`);
    // Herding speed varies, so an idle hint may add to the two wrong-pen misses' hint.
    if (mode === 'sort') assert.ok(r[0] === 2 && r[1] >= 1, `roundup sort score ${r}`);
    if (mode === 'size') assert.ok(r[0] >= 2 && r[1] >= 1, `roundup size score ${r}`);
    if (mode === 'sortStay') assert.ok(r[0] >= 2 && r[1] >= 1, `roundup outsiders score ${r}`);
    if (mode === 'count') assert.ok(r[0] >= 1, 'roundup count misses');
    if (mode === 'fair') assert.ok(r[0] >= 2 && r[1] >= 1, `roundup fair score ${r}`);
    if (mode === 'tap') assert.deepEqual(r, [0, 0], 'roundup tap score');
    if (level === 10) assert.deepEqual(r, [0, 2], 'roundup Shoo one supported score');
    if (level === 11) assert.deepEqual(r, playBand === 'lap' ? [0, 0] : [0, 1], `roundup Come along ${playBand} score`);
    log(`Roundup ${level} (${mode}): herding, gates, pens, saved score and sticker passed`);
  }

  // Bouncy Launch: real pull-and-let-go drags; short and long landings, the hint ring, and comparing.
  await page.evaluate(() => {
    window.fling = async (f) => {
      const g = neo.scene.game;
      const { pullFor } = await import('/src/games/bouncy-launch/logic.ts');
      await kit.until(() => !g.flying, 10000);
      const d = pullFor(f) / Math.SQRT2;
      const p = g.pet.getGlobalPosition();
      await kit.drag(kit.line([p.x, p.y - 80], [p.x - d, p.y - 80 + d], 10), 1, 16);
      await kit.until(() => g.flying, 2000);
      await kit.until(() => !g.flying, 10000);
    };
  });
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= Number(process.env.TO_LEVEL || 7) && (!only || only === 'launch'); level++) {
    await launch('bouncy-launch', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    if (level === 12) {
      await page.waitForFunction(() => neo.scene.game.planetPhase === 'choose' && !neo.scene.game.flying);
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      assert.ok(await page.evaluate(async () => {
        const g = neo.scene.game, { pullFor } = await import('/src/games/bouncy-launch/logic.ts');
        return Math.abs(g.pullNow() - pullFor(g.pairs[g.shot].base)) < 0.01 && g.flagNumbers.children[0]?.text === '1' && !g.pads.some(p => p.visible);
      }), 'Planet Hop portrait keeps fixed pull, numbered home flag and clear regions');
      await screenshot('bouncy-launch-12-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
      // Request help through the real pause sheet, then deliberately predict the opposite side.
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Show a hint', exact: true }).click();
      await page.evaluate(async () => {
        const g = neo.scene.game;
        if (g.hints !== 1 || !g.predictionRing.context.instructions.length) throw new Error('Planet help must ring and count once');
        const { planetBotLanding } = await import('/src/games/bouncy-launch/logic.ts');
        while (!g.finished) {
          if (!await kit.until(() => g.finished || (g.planetPhase === 'choose' && !g.flying), 15000)) throw new Error('No planet choice');
          if (g.finished) break;
          const pair = g.pairs[g.shot];
          const f = g.shot === 0 ? (pair.planet === 'light' ? pair.base / 2 : pair.base * 2) : planetBotLanding(pair);
          kit.tapOn(g.planetInput, g.landX(f), g.strip.y - 160);
          if (!g.predictionRing.context.instructions.length) throw new Error('Prediction needs immediate ring');
          await kit.until(() => g.planetPhase !== 'choose' || g.finished, 3000);
        }
        if (g.shot !== 3 || g.misses !== 0 || g.hints !== 1 || g.observedPulls.length) throw new Error('Planet accounting or journal observation');
      });
      await finished('bouncy-launch');
      const result = await page.evaluate(() => { const h = kit.store.stats('bouncy-launch').history.at(-1); return [h.misses, h.hints]; });
      assert.deepEqual(result, [0, 1]);
      log('Bouncy Launch 12: three pairs, different guess, pause hint, portrait, no misses and one sticker passed');
      continue;
    }
    if (level === 9) {
      // Between two flights: taps during the watched pulls do nothing; two flags, two rings, then a pick; a wrong pick is no miss.
      await page.evaluate(async () => {
        const g = neo.scene.game;
        await kit.until(() => g.flying, 15000);
        kit.tapOn(g.pads[0]);
        await kit.sleep(300);
        if (g.prediction !== undefined) throw new Error('A pad tap during a watched pull must not pick');
      });
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      await page.waitForFunction(() => neo.scene.game.betweenStep === 2 && !neo.scene.game.flying, null, { timeout: 30000 });
      assert.ok(await page.evaluate(async () => {
        const g = neo.scene.game, { pullFor, padAt } = await import('/src/games/bouncy-launch/logic.ts');
        const t = g.betweens[g.shot];
        return Math.abs(g.pullNow() - pullFor(padAt(t.mid))) < 0.01 && g.flagNumbers.children.map((n) => n.text).join() === `${t.low + 1},${t.high + 1}` && g.compareRing.context.instructions.length > 0;
      }), 'portrait keeps the middle pull, both numbered flags and the two pull rings');
      await screenshot('bouncy-launch-9-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
      await page.evaluate(async () => {
        const g = neo.scene.game;
        while (!g.finished) {
          if (!await kit.until(() => g.finished || (g.betweenStep === 2 && !g.flying), 30000)) throw new Error('No middle pull to pick');
          if (g.finished) break;
          const t = g.betweens[g.shot];
          if (g.flagNumbers.children.map((n) => n.text).join() !== `${t.low + 1},${t.high + 1}`) throw new Error('Both watched flights need their numbered flags');
          // The first pick deliberately lands on a flag's cloud instead; it is explained, never a miss.
          kit.tapOn(g.pads[g.shot === 0 ? t.low : t.mid]);
          await kit.until(() => g.flying, 4000);
          await kit.until(() => !g.flying || g.finished, 15000);
        }
        if (g.shot !== 3 || g.misses !== 0 || g.hints !== 0 || g.observedPulls.length) throw new Error(`Between accounting or journal: ${g.shot} ${g.misses} ${g.hints} ${g.observedPulls.length}`);
      });
      await finished('bouncy-launch');
      const result = await page.evaluate(() => { const h = kit.store.stats('bouncy-launch').history.at(-1); return [h.misses, h.hints]; });
      assert.deepEqual(result, [0, 0]);
      log('Bouncy Launch 9: watched pulls ignore taps, two flags and rings, a different guess, portrait, no misses and one sticker passed');
      continue;
    }
    if (level === 6) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      assert.ok(await page.evaluate(async () => {
        const g = neo.scene.game, { pullFor, padAt } = await import('/src/games/bouncy-launch/logic.ts');
        return Math.abs(g.pullNow() - pullFor(padAt(g.targets[g.shot]))) < 0.01;
      }), 'portrait keeps the shown prediction pull');
      await screenshot('bouncy-launch-6-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
    }
    if (level === 7) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      assert.ok(await page.evaluate(() => { const g = neo.scene.game, p = g.friend.getGlobalPosition(); return g.friend.visible && p.x > 0 && p.x < neo.view.w && !g.pads.some((pad) => pad.visible); }), 'portrait keeps the friend on the grass and the clouds hidden');
      await screenshot('bouncy-launch-7-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
    }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { padAt } = await import('/src/games/bouncy-launch/logic.ts');
      if (g.plan.mode === 'tap') {
        for (let i = 0; i < g.plan.shots; i++) { await kit.until(() => !g.flying, 10000); kit.tapOn(g.pet, 0, -60); await kit.until(() => g.flying, 2000); }
        return;
      }
      if (g.plan.mode === 'predict') {
        while (!g.finished) {
          await kit.until(() => !g.flying, 10000);
          if (g.shot > 0) {
            const numerals = [...new Set(g.targets.slice(0, g.shot))].map((n) => String(n + 1));
            if (g.flagNumbers.children.map((n) => n.text).join() !== numerals.join()) throw new Error('Watched flights need retained numbered flags');
            if (!g.lastArc.context.instructions.length || g.lastFlight !== padAt(g.targets[g.shot - 1])) throw new Error('Previous flight trace missing');
          }
          if (g.finished) break;
          const n = g.targets[g.shot];
          if (g.pads.some((p, i) => !p.children.some((c) => c.text === String(i + 1)))) throw new Error('Prediction clouds need visible numerals');
          // First prediction deliberately differs; it still completes without a miss.
          kit.tapOn(g.pads[g.shot === 0 ? (n + 1) % 5 : n]);
          await kit.until(() => g.flying, 4000);
        }
        return;
      }
      if (g.plan.mode === 'free') {
        // Wrong-way and short pulls reply without grading an unfinished gesture.
        for (const [dx, dy] of [[60, -60], [5, 5]]) {
          const p = g.pet.getGlobalPosition();
          await kit.drag(kit.line([p.x, p.y - 80], [p.x + dx, p.y - 80 + dy], 8), 1, 16);
          await kit.sleep(500);
        }
        if (g.flying || g.shot !== 0 || g.misses || g.hints || g.emptyPulls !== 2 || !g.pullArrow.context.instructions.length) throw new Error('Empty pulls need an unscored arrow');
        // Cancellation returns the pet without launching or counting a try.
        const p = g.pet.getGlobalPosition();
        const c = document.querySelector('canvas'), rect = c.getBoundingClientRect();
        const pos = (x, y) => ({ clientX: rect.left + x, clientY: rect.top + y, pointerId: 73, pointerType: 'touch', bubbles: true });
        c.dispatchEvent(new PointerEvent('pointerdown', pos(p.x, p.y - 80)));
        c.dispatchEvent(new PointerEvent('pointermove', pos(p.x - 70, p.y - 10)));
        c.dispatchEvent(new PointerEvent('pointercancel', pos(p.x - 70, p.y - 10)));
        await kit.sleep(500);
        if (g.flying || g.shot || g.emptyPulls !== 2 || g.grab) throw new Error('Cancelled pull launched or counted');
        for (const f of [0.2, 0.9, 0.5, 0.7]) await fling(f);
        return;
      }
      if (g.plan.mode === 'compare') {
        await fling(0.5);
        let first = true;
        while (!g.finished) {
          const want = g.ask === 'farther' ? Math.min(1, g.last + 0.3) : Math.max(0, g.last - 0.3);
          // One wrong-way flight on the first ask.
          await fling(first ? (g.ask === 'farther' ? Math.max(0, g.last - 0.2) : Math.min(1, g.last + 0.2)) : want);
          if (first) {
            if (!g.compareRing.context.instructions.length || !g.lastArc.context.instructions.length || Math.abs(g.last - 0.5) > 0.001) throw new Error(`Compare evidence: ring=${g.compareRing.context.instructions.length} arc=${g.lastArc.context.instructions.length} last=${g.last}`);
            const age = g.arcAge, alpha = g.lastArc.alpha;
            g.update(1);
            if (!(g.lastArc.alpha < alpha && g.arcAge > age)) throw new Error('Flight trace must fade');
            const v = neo.view;
            g.resize(v);
            if (!g.compareRing.context.instructions.length || !g.flag.context.instructions.length) throw new Error('Resize lost comparison evidence');
            await fling(g.ask === 'farther' ? g.last - 0.2 : g.last + 0.2);
            if (g.misses !== 2 || g.hints !== 1 || !g.hinting) throw new Error('Compare preview hint accounting changed');
          }
          first = false;
        }
        return;
      }
      if (g.plan.mode === 'friend') {
        // Two misses light the pull ring; each next flight is corrected from the last, then every friend is fed.
        const spot = g.spots[0];
        // Miss toward the roomy side so a clamped flight at the strip's end cannot land inside the window.
        const side = spot > 0.5 ? -1 : 1;
        await fling(spot + side * 0.3); await fling(spot + side * 0.25);
        if (g.misses !== 2 || g.hints !== 1 || !g.hinting || g.shot !== 0) throw new Error(`Friend hint: ${g.misses} ${g.hints} ${g.shot}`);
        while (!g.finished && g.shot < g.spots.length) await fling(g.spots[g.shot]);
        return;
      }
      // Star and number levels: two misses light the pull ring, then hit every cloud.
      const t0 = g.targets[0];
      const off = t0 === 0 ? 0.95 : 0.03;
      await fling(off); await fling(off);
      if (g.misses !== 2 || g.hints !== 1 || !g.hinting) throw new Error(`Launch hint: ${g.misses} ${g.hints}`);
      while (!g.finished && g.shot < g.targets.length) await fling(padAt(g.targets[g.shot]));
    });
    await screenshot(`bouncy-launch-${level}`);
    await finished('bouncy-launch');
    const r = await page.evaluate(() => { const r = kit.store.stats('bouncy-launch').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, { tap: [0, 0], free: [0, 0], star: [2, 1], number: [2, 1], compare: [2, 1], predict: [0, 0], friend: [2, 1] }[mode], `launch ${level} score`);
    log(`Bouncy Launch ${level} (${mode}): pulls, flights, landings, saved score and sticker passed`);
  }
}

return { arcade };
}
