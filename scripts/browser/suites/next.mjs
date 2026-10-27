import { selectValue } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, log, ready, scene, tap, screenshot, launch, finished, encoreTricks }) {
async function next() {
  const only = process.env.NEXT_ONLY;
  if (only !== undefined) selectValue(only, ['seesaw', 'doctor', 'bumper', 'tricks'], 'NEXT_ONLY');
  const score = (id) => page.evaluate((id) => { const r = kit.store.stats(id).history.at(-1); return [r.misses, r.hints]; }, id);

  // Seesaw Balance: friends, blocks, weights and presents dragged onto the trays and off again.
  await page.evaluate(() => {
    window.seesaw = {
      /** Drag a thing so it lands on a tray (it rides 40 above the finger). */
      async onto(item, side) {
        const g = neo.scene.game, top = g.trayTop(side), p = g.layer.toGlobal({ x: top.x, y: top.y + 20 });
        await kit.dragTo(item.node, p, 12); await kit.sleep(250);
      },
      /** Drag a thing off its tray, back down to the grass. */
      async off(item) {
        const g = neo.scene.game, p = g.layer.toGlobal({ x: item.ground.x, y: g.view.h - 80 });
        await kit.dragTo(item.node, p, 12); await kit.sleep(250);
      },
      async idle() { const g = neo.scene.game; await kit.until(() => (!g.busy && g.items.length > 0) || g.finished, 15000); await kit.sleep(150); },
    };
  });
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 7 && (!only || only === 'seesaw'); level++) {
    if (level === 6) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('seesaw-balance', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { ways, other, total } = await import('/src/games/seesaw-balance/logic.ts');
      const loose = () => g.items.filter((i) => !i.fixed && !i.inWagon);
      const empty = () => other(g.round.fixedSide);
      for (let r = 0; r < g.rounds.length; r++) {
        await seesaw.idle();
        if (g.index !== r) throw new Error(`Seesaw round ${g.index} not ${r}`);
        const first = r === 0;
        const mode = g.plan.mode;
        if (mode === 'up' || mode === 'heavy') {
          if (first) {
            // Two mistakes: the same side as the rider (up), or a friend too light to lift it (heavy).
            for (let k = 0; k < 2; k++) {
              const wrong = mode === 'up' ? loose()[0] : loose().find((i) => i.thing.weight < g.round.answer);
              await seesaw.onto(wrong, mode === 'up' ? g.round.fixedSide : empty()); await seesaw.idle();
            }
            if (g.misses !== 2 || g.hints !== 1) throw new Error(`Seesaw ${mode} hint: ${g.misses} ${g.hints}`);
          }
          await seesaw.onto(loose().find((i) => i.thing.weight > g.round.answer), empty());
        } else if (mode === 'level' || mode === 'mystery') {
          const blocks = () => loose().filter((i) => !i.side);
          const need = total(g.round.fixed), answer = g.round.answer;
          if (first) {
            // A block on the friend's own side is sent back with a word, never a miss; one taken off again is fine too.
            await seesaw.onto(blocks()[0], g.round.fixedSide);
            await seesaw.onto(blocks()[0], empty()); await seesaw.off(loose().find((i) => i.side));
            if (g.misses !== 0 || loose().some((i) => i.side)) throw new Error(`Seesaw blocks: ${g.misses}`);
          }
          // One block at a time: it levels exactly when there are enough, so it never tips too far.
          for (let k = 0; k < need; k++) await seesaw.onto(blocks()[0], empty());
          if (mode === 'mystery') {
            await kit.until(() => g.pads.length === 3 && !g.busy, 10000); await kit.sleep(400);
            if (first) {
              const wrong = g.pads.find((p) => p.value !== answer);
              for (let k = 0; k < 2; k++) { kit.tapOn(wrong); await kit.sleep(300); await kit.until(() => !g.busy, 15000); }
              if (g.misses !== 2 || g.hints !== 1 || !g.pads.find((p) => p.value === answer).glowing) throw new Error(`Seesaw mystery hint: ${g.misses} ${g.hints}`);
            }
            kit.tapOn(g.pads.find((p) => p.value === answer));
          }
        } else if (mode === 'heaviest') {
          // Compare two presents freely (never a miss), then the wagon.
          const presents = loose(), before = g.misses;
          await seesaw.onto(presents[0], 'left'); await seesaw.onto(presents[1], 'right');
          if (g.misses !== before || presents.filter((p) => p.side).length !== 2) throw new Error('Seesaw: comparing counted as a miss');
          const wagon = () => g.layer.toGlobal({ x: g.wagon.x, y: g.wagon.y - 20 });
          if (first) {
            for (let k = 0; k < 2; k++) { await kit.dragTo(loose().find((i) => i.thing.weight !== g.round.answer).node, wagon(), 12); await kit.sleep(300); }
            if (g.misses !== 2 || g.hints !== 1) throw new Error(`Seesaw heaviest hint: ${g.misses} ${g.hints}`);
          }
          await kit.dragTo(loose().find((i) => i.thing.weight === g.round.answer).node, wagon(), 12);
        } else if (mode === 'parts') {
          const n = g.round.answer;
          if (first) {
            // Pile on weights (never exactly level) until it is too heavy twice, then clear the tray. One pass in
            // weight order can't always get there (for 7: 4, skip 3, 2, skip 1), so an overload comes off and goes on again.
            let overs = 0;
            for (let guard = 0; overs < 2 && guard < 12; guard++) {
              const on = total(loose().filter((i) => i.side).map((i) => i.thing));
              const item = loose().filter((i) => !i.side).sort((a, b) => b.thing.weight - a.thing.weight).find((i) => on + i.thing.weight !== n);
              if (!item) break;
              await seesaw.onto(item, empty());
              if (on + item.thing.weight > n && ++overs < 2) await seesaw.off(item);
            }
            if (g.misses !== 2 || g.hints !== 1) throw new Error(`Seesaw parts hint: ${g.misses} ${g.hints}`);
            for (const item of loose().filter((i) => i.side)) { if (g.busy) break; await seesaw.off(item); }
          }
          if (!g.busy) {
            const way = ways(n, loose().map((i) => i.thing.weight))[0];
            for (const w of way) await seesaw.onto(loose().find((i) => !i.side && i.thing.weight === w), empty());
          }
        }
        await kit.until(() => g.index > r || g.finished, 15000);
      }
    }, level);
    await screenshot(`seesaw-balance-${level}`);
    await finished('seesaw-balance');
    assert.deepEqual(await score('seesaw-balance'), mode === 'level' ? [0, 0] : [2, 1], `seesaw ${level} score`);
    if (level === 6) await page.setViewportSize({ width: 1024, height: 768 });
    log(`Seesaw Balance ${level} (${mode}): tipping, balancing, comparing, mistakes, hint, saved score and sticker passed`);
  }

  // Teddy Doctor: boo-boos tapped, then tools dragged onto the body part that needs them.
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 8 && (!only || only === 'doctor'); level++) {
    if (level === 4 || level === 5 || level === 7) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('teddy-doctor', level);
    await page.waitForTimeout(400);
    await page.waitForFunction(() => !neo.scene.game.busy);
    if (level === 7) await screenshot('teddy-doctor-7-pair-portrait');
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    // Check-ups are three of five steps (the scale and the height chart among them); the log names the ones played.
    const steps = await page.evaluate(() => neo.scene.game.rounds.map((r) => r.steps.join('>')).filter(Boolean).join(', '));
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { CURE, CHECK_PART, allowedChecks } = await import('/src/games/teddy-doctor/logic.ts');
      const idle = () => kit.until(() => (!g.busy && g.patient) || g.finished, 15000);
      // A tool rides 40 above the finger, so aim the finger just below the body part.
      const use = async (tool, part) => {
        const t = g.tools.find((t) => t.tool === tool), p = g.partAt(part);
        await kit.dragTo(t.node, g.toolLayer.toGlobal({ x: p.x, y: p.y + 40 }), 12); await kit.sleep(300);
      };
      const check = (what) => { if (g.misses !== 2 || g.hints !== 1) throw new Error(`Doctor ${what} hint: ${g.misses} ${g.hints}`); };
      for (let r = 0; r < g.rounds.length; r++) {
        await idle();
        const first = r === 0, round = g.round, mode = g.plan.mode;
        if (mode === 'choose') {
          if (first) {
            for (let k = 0; k < 2; k++) { kit.tapOn(g.friend, 0, -130); await kit.sleep(350); await idle(); }
            check('choose');
            g.drawGlow();
            if (!g.choosing) throw new Error('Wrong friend advanced patient');
          }
          if (Math.abs(g.patient.x - g.friend.x) < 400) throw new Error('Friends too close');
          kit.tapOn(g.patient, 0, -130); await kit.sleep(500); await idle();
          kit.tapOn(g.scrapes[0].node); await kit.sleep(350);
        } else if (mode === 'rules') {
          if (first) {
            const wrong = round.steps.find((t) => !allowedChecks(round, g.done).includes(t));
            for (let k = 0; k < 2; k++) { await use(wrong, CHECK_PART[wrong]); await idle(); }
            check('rules');
          }
          while (g.index === r && g.step < 3) {
            await idle();
            if (g.index !== r || g.finished || g.step >= 3) break;
            const options = allowedChecks(round, g.done);
            const tool = options[options.length - 1];
            await use(tool, CHECK_PART[tool]);
          }
        } else if (mode === 'play') {
          // A touch on the patient far from every boo-boo (the side of the body) still bandages one.
          if (first) {
            const n = g.scrapes.length, side = g.patient.toGlobal({ x: -150, y: -130 });
            kit.tap(side.x, side.y); await kit.sleep(350);
            if (g.scrapes.length !== n - 1) throw new Error(`Doctor far tap left ${g.scrapes.length} of ${n}`);
          }
          for (const s of [...g.scrapes]) { kit.tapOn(s.node); await kit.sleep(350); }
        } else if (mode === 'part') {
          if (first) {
            for (let k = 0; k < 2; k++) { await use('bandage', g.scrapes[1].part); await idle(); }
            check('part');
          }
          while (g.scrapes.length && g.index === r) { await idle(); if (g.index !== r) break; await use('bandage', g.scrapes[0].part); }
        } else if (mode === 'tool' || mode === 'clue') {
          const cure = CURE[round.ailment].tool;
          if (first) {
            await use(g.tools.find((t) => t.tool !== cure).tool, round.part); await idle();
            // Tool mode: any wrong tool. Clue mode: the right tool in the wrong place.
            if (mode === 'tool') await use(g.tools.find((t) => t.tool !== cure).tool, round.part);
            else await use(cure, round.part === 'feet' ? 'head' : 'feet');
            await idle(); check(mode);
          }
          await use(cure, round.part);
        } else {
          if (first) {
            for (let k = 0; k < 2; k++) { await use(round.steps[1], CHECK_PART[round.steps[1]]); await idle(); }
            check(mode);
          }
          for (const step of round.steps) { await idle(); await use(step, CHECK_PART[step]); }
        }
        await kit.until(() => g.index > r || g.finished, 15000);
      }
    });
    await screenshot(`teddy-doctor-${level}`);
    await finished('teddy-doctor');
    assert.deepEqual(await score('teddy-doctor'), mode === 'play' ? [0, 0] : [2, 1], `doctor ${level} score`);
    if (level === 4 || level === 5 || level === 7) await page.setViewportSize({ width: 1024, height: 768 });
    log(`Teddy Doctor ${level} (${mode}${steps ? `: ${steps}` : ''}): boo-boos, body parts, tools, check-ups, mistakes, hint, saved score and sticker passed`);
  }

  // Bumper Garden: launching, then flipping like a finger: tap a side as the ladybug comes down to it.
  const bumperLevels = process.env.BUMPER_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6, 8, 9].filter(l => l >= Number(process.env.FROM_LEVEL || 1));
  const bumperTables = process.env.BUMPER_TABLES?.split(',') ?? [null];
  for (const table of bumperTables) for (const level of (!only || only === 'bumper') ? bumperLevels : []) {
    if (level === 1 || level === 5 || level === 8 || level === 9) await page.setViewportSize({ width: 768, height: 1024 });
    if (table) await page.evaluate(async ({ table, level }) => {
      const { bumperGarden } = await import('/src/games/bumper-garden/index.ts');
      const { pickTable, planFor, TABLE_IDS } = await import('/src/games/bumper-garden/logic.ts');
      const { Rng } = await import('/src/engine/random.ts');
      if (!TABLE_IDS.includes(table)) throw new Error(`Unknown bumper table ${table}`);
      let seed = 1;
      for (; seed < 100; seed++) {
        const rng = new Rng(seed); planFor(level, rng);
        if (pickTable(rng) === table) break;
      }
      if (seed === 100) throw new Error(`No seed for bumper ${table}`);
      // Inject a known round RNG only in this isolated context; production still picks by ctx.rng.
      const create = bumperGarden.create;
      bumperGarden.create = ctx => { bumperGarden.create = create; return create({ ...ctx, rng: new Rng(seed) }); };
    }, { table, level });
    await launch('bumper-garden', level);
    if (table) assert.equal(await page.evaluate(() => neo.scene.game.table), table);
    await page.waitForTimeout(level === 8 ? 2000 : 400);
    if (table || level === 6 || level === 8 || level === 9) await screenshot(`bumper-garden-${table ? `${table}-` : ''}${level}`);
    if (level === 8) await page.evaluate(() => {
      // Not this color: the asked color sleeps, is never wanted, and bumping one only chimes.
      const g = neo.scene.game;
      const sleepy = g.flowers.findIndex(f => f.sleepy);
      if (sleepy < 0 || !g.plan.not) throw new Error('Bumper 8: no sleepy flower');
      if (g.flowers.some((f, i) => f.sleepy === g.wanted(i))) throw new Error('Bumper 8: a sleepy flower is wanted, or an awake one is not');
      const before = { misses: g.misses, hints: g.hints };
      g.bumped(sleepy);
      if (g.flowers[sleepy].bloomed || g.misses !== before.misses || g.hints !== before.hints) throw new Error('Bumper 8: a sleepy bump changed progress');
    });
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const result = await page.evaluate(async () => {
      const g = neo.scene.game;
      const { FLIPPER, TABLE } = await import('/src/games/bumper-garden/logic.ts');
      if (g.plan.start) {
        const { orderNumbers } = await import('/src/games/bumper-garden/logic.ts');
        const sequence = orderNumbers(g.plan);
        const pictured = g.numberStrip.children.filter(c => typeof c.text === 'string').map(c => Number(c.text));
        if (JSON.stringify(pictured) !== JSON.stringify(sequence) || g.next !== sequence[0]) throw new Error('Bumper sequence strip/start mismatch');
        const wrong = g.flowers.findIndex(f => f.bumper.number !== null && f.bumper.number !== g.next);
        const before = { next: g.next, misses: g.misses, hints: g.hints };
        g.bumped(wrong); // The physics may bump an out-of-order flower; it only chimes.
        if (g.next !== before.next || g.misses !== before.misses || g.hints !== before.hints || g.flowers[wrong].bloomed) throw new Error('Out-of-order bump changed progress');
      }
      const flipNear = () => {
        const b = g.ball;
        if (g.state !== 'flying' || b.vy <= 0 || b.y < FLIPPER.y - 90) return;
        if (b.x < TABLE.w / 2) kit.tap(150, innerHeight * 0.45); else kit.tap(innerWidth - 150, innerHeight * 0.45);
      };
      const t0 = performance.now();
      if (g.plan.mode === 'spring') {
        while (!g.finished && performance.now() - t0 < 120000) {
          if (g.state === 'held') { kit.tap(innerWidth / 2, innerHeight * 0.4); await kit.sleep(300); }
          await kit.sleep(100);
        }
        return { launches: g.launches };
      }
      if (g.plan.mode !== 'bloom') {
        // Hands off, and each launch steered onto a path that (in simulation) blooms nothing wanted: two such
        // shots are gentle misses, and the second brings the glow and an aimed launch.
        const { flight, launchVelocity, LAUNCH } = await import('/src/games/bumper-garden/logic.ts');
        const miss = () => { for (let a = -0.42; a <= 0.42; a += 0.02) if (!flight(g.world, a, 25).hits.some((i) => i < g.bumpers.length && g.wanted(i))) return a; return null; };
        while (!g.finished && g.hints === 0 && performance.now() - t0 < 150000) {
          await kit.until(() => g.state === 'flying' || g.finished, 10000);
          const a = miss();
          if (a !== null && g.ball.y > LAUNCH.y - 40) Object.assign(g.ball, { x: LAUNCH.x, y: LAUNCH.y, ...launchVelocity(a) });
          await kit.until(() => g.state === 'held' || g.finished, 40000);
        }
        if (!g.finished && (g.misses < 2 || !g.hinting)) throw new Error(`Bumper hint: ${g.misses} ${g.hints}`);
      }
      while (!g.finished && performance.now() - t0 < 240000) { flipNear(); await kit.sleep(30); }
      if (!g.finished) throw new Error(`Bumper never finished: next ${g.next}, bloomed ${g.flowers.filter((f) => f.bloomed).length}`);
      return { launches: g.launches, misses: g.misses, hints: g.hints };
    });
    if (level !== 6 && level !== 8 && level !== 9) await screenshot(`bumper-garden-${level}`);
    await finished('bumper-garden');
    const r = await score('bumper-garden');
    if (mode === 'spring' || mode === 'bloom') assert.deepEqual(r, [0, 0], `bumper ${level} score`);
    else assert.ok(r[0] >= 2 && r[1] >= 1 && r[0] === result.misses && r[1] === result.hints, `bumper ${level} score ${r}`);
    if (level === 1 || level === 5 || level === 8 || level === 9) await page.setViewportSize({ width: 1024, height: 768 });
    log(`Bumper Garden ${table ?? 'random'} ${level} (${mode}): ${result.launches} launches, flips, blooms, score ${r}, saved score and sticker passed`);
  }

  // Quick Tricks: a show of three tricks, two gentle misses in each, then the right move and the arrow.
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 3 && (!only || only === 'tricks'); level++) {
    if (level === 3) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('quick-tricks', level);
    await page.waitForTimeout(400);
    const counted = await page.evaluate(async () => {
      const g = neo.scene.game;
      const { friendsFor, reaches } = await import('/src/games/quick-tricks/logic.ts');
      const ready = (trick) => kit.until(() => (g.trick === trick && !g.busy && !g.waiting) || g.finished, 20000);
      // Things ride 40 above the finger: aim the finger 40 below where they should land.
      const drag = async (node, x, y) => { await kit.dragTo(node, g.layer.toGlobal({ x, y: y + 40 }), 12); await kit.sleep(450); };
      const next = async () => { await kit.until(() => g.waiting, 15000); kit.tapOn(g.next); await kit.sleep(500); };
      const check = (what, misses, hints) => { if (g.misses !== misses || g.hints !== hints) throw new Error(`Tricks ${what}: ${g.misses} ${g.hints}`); };

      // Umbrella Up: held too low in front of the friends (or, with two friends, the small leaf), then up high.
      await ready('umbrella');
      const { top } = g.rainSpan, offsets = friendsFor(g.plan), mid = g.cx + offsets.reduce((a, b) => a + b, 0) / offsets.length;
      const big = g.leaves.at(-1);
      await drag(big.node, mid, top + 160);
      if (g.plan.friends === 2) await drag(g.leaves[0].node, g.cx + offsets[0], top - 40); else await drag(big.node, mid, top + 160);
      check('umbrella', 2, 1);
      await drag(big.node, mid, top - 40);
      await next();

      // Sock Gobbler: two socks that are not the partner, then the partner.
      await ready('socks');
      const m = g.monster, wrongs = g.socks.filter((s) => !(s.sock.color === g.held.color && s.sock.pattern === g.held.pattern));
      await drag(wrongs[0].node, m.x, m.y - 110); await drag(wrongs[wrongs.length - 1].node, m.x, m.y - 110);
      check('socks', 4, 2);
      await drag(g.socks.find((s) => !wrongs.includes(s)).node, m.x, m.y - 110);
      await next();

      // Bridge Stretch: let go short twice (a miss from level 2), or try two short planks; then all the way.
      await ready('bridge');
      const [l, r] = g.banks, y = g.bankY;
      const short = g.plan.bridge === 'stretch' ? 0 : 2;
      if (g.plan.bridge === 'stretch') {
        for (let k = 0; k < 2; k++) { await drag(g.handle.node, l + 150, y); await kit.until(() => !g.springing, 3000); }
        check('bridge short', g.plan.countShort ? 6 : 4, g.plan.countShort ? 3 : 2);
        await drag(g.handle.node, r + 70, y);
      } else {
        for (const p of g.planks.filter((p) => !reaches(p.length))) await drag(p.node, g.cx, y);
        check('bridge planks', 6, 3);
        await drag(g.planks.find((p) => reaches(p.length)).node, g.cx, y);
      }
      await next();
      await kit.until(() => g.finished, 15000);
      return [g.misses, g.hints, short];
    });
    await screenshot(`quick-tricks-${level}`);
    await finished('quick-tricks');
    assert.deepEqual(await score('quick-tricks'), counted.slice(0, 2), `tricks ${level} score`);
    if (level === 3) await page.setViewportSize({ width: 1024, height: 768 });
    log(`Quick Tricks ${level}: umbrella, socks, bridge, mistakes, hints, the arrow between tricks, score ${counted.slice(0, 2)}, saved score and sticker passed`);
  }
  if (!only || only === 'tricks') await encoreTricks();
}

return { next };
}
