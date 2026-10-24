import { selectValue } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished, next }) {
async function shortlistBatch() {
  const only = process.env.SHORTLIST_ONLY;
  if (only !== undefined) selectValue(only, ['tower', 'lasso', 'says', 'owls'], 'SHORTLIST_ONLY');
  const fromLevel = Number(process.env.FROM_LEVEL || 1);
  const score = (id) => page.evaluate((id) => { const r = kit.store.stats(id).history.at(-1); return [r.misses, r.hints]; }, id);
  const idle = async (n) => {
    await page.waitForFunction((n) => { const g = neo.scene.game; return neo.scene.finished || (g.index === n && !g.busy); }, n, { timeout: 30000 });
    await page.waitForTimeout(150);
  };
  const counts = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);
  // A canvas point for logical (x, y).
  const at = (x, y) => page.evaluate(({ x, y }) => { const s = neo.view.scale; const r = document.querySelector('canvas').getBoundingClientRect(); return [r.left + x * s, r.top + y * s]; }, { x, y });

  if (!only || only === 'tower') for (let level = fromLevel; level <= Number(process.env.TO_LEVEL || 6); level++) {
    if (level === 6 && process.env.TOWER_SEED) await page.evaluate(seed => { window.towerRandom = Math.random; Math.random = () => seed / 2 ** 31; }, Number(process.env.TOWER_SEED));
    await launch('block-tower', level);
    if (level === 6 && process.env.TOWER_SEED) await page.evaluate(() => { Math.random = window.towerRandom; delete window.towerRandom; });
    const savedTower = await page.evaluate(() => [kit.store.data.stickers.length, kit.store.stats('block-tower').history.length]);
    if (level === 6) {
      const directions = await page.evaluate(() => neo.scene.game.reachRounds.map(r => r.direction));
      assert.deepEqual([...directions].sort(), [-1, 1]);
      log(`Block Tower reach order: ${directions.join(',')}`);
    }
    if (level === 4 || level === 5) await page.setViewportSize({ width: 768, height: 1024 });
    const { rounds, mode } = await page.evaluate(() => ({ rounds: neo.scene.game.rounds.length, mode: neo.scene.game.plan.mode }));
    if (mode === 'flag' || mode === 'match') {
      const heights = await page.evaluate(() => neo.scene.game.rounds.map(r => r.bear ?? r.target));
      assert.equal(new Set(heights).size, 3, 'three different seeded reference heights');
    }
    for (let n = 0; n < rounds; n++) {
      await idle(n);
      if (mode === 'tumble' || mode === 'friend') {
        // Lap play: a tap anywhere stacks, up to the friend's height, then knocks it all down.
        while (!(await page.evaluate(() => neo.scene.game.full))) { const [x, y] = await at(300, 200); await page.mouse.click(x, y); await page.waitForTimeout(260); }
        assert.equal(await page.evaluate(() => neo.scene.game.stack.length), await page.evaluate(() => neo.scene.game.round.target));
        await page.waitForFunction(() => !neo.scene.game.busy);
        if (n === 0) await screenshot(`block-tower-${level}`);
        const [x, y] = await at(300, 200); await page.mouse.click(x, y);
      } else if (mode === 'flag' || mode === 'match') {
        const want = await page.evaluate(() => neo.scene.game.round.target);
        const bin = async (k) => { for (let i = 0; i < k; i++) { await tap('neo.scene.game.bin'); await page.waitForTimeout(150); } };
        if (n === 0) {
          // One too many, then one too few: two explained misses, a counted hint.
          await bin(want + 1);
          await tap('neo.scene.game.bell'); await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
          const top = await page.evaluate(() => { const h = neo.scene.game.towerHit.hitArea; return [h.x + h.width / 2, h.y + 40]; });
          for (let k = 0; k < 2; k++) { const [x, y] = await at(top[0], top[1] + k * 62); await page.mouse.click(x, y); await page.waitForTimeout(350); }
          assert.equal(await page.evaluate(() => neo.scene.game.stack.length), want - 1, 'tapping the tower takes the top block off');
          await tap('neo.scene.game.bell'); await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 40000 });
          assert.deepEqual(await counts(), [2, 1]);
          await screenshot(`block-tower-${level}`);
          await bin(1);
        } else await bin(want);
        assert.equal(await page.evaluate(() => neo.scene.game.stack.length), want);
        await tap('neo.scene.game.bell');
      } else if (mode === 'stand') {
        const frozen = await page.evaluate(() => JSON.stringify(neo.scene.game.stand));
        const saved = await page.evaluate(() => [kit.store.data.stickers.length, kit.store.stats('block-tower').history.length]);
        await tap(`neo.scene.game.standTowers[${n === 1 ? 'neo.scene.game.stand.stands' : '1 - neo.scene.game.stand.stands'}][1]`);
        await page.waitForFunction(() => neo.scene.game.observation.phase === 'result', null, { timeout: 30000 });
        assert.deepEqual(await counts(), [0, 0]);
        if (n === 0 || n === 2) {
          if (n === 0) await screenshot('block-tower-5-result-portrait');
          await tap('neo.scene.game.watchAgain');
          // Resize while replay releases; the retained evidence follows the logical view.
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForFunction(() => neo.scene.game.observation.phase === 'result', null, { timeout: 30000 });
          assert.equal(await page.evaluate(() => JSON.stringify(neo.scene.game.stand)), frozen);
          assert.equal(await page.evaluate(() => neo.scene.game.index), n);
          assert.deepEqual(await page.evaluate(() => [kit.store.data.stickers.length, kit.store.stats('block-tower').history.length]), saved);
          await page.setViewportSize({ width: 768, height: 1024 });
        }
        await tap('neo.scene.game.continueStand');
        if (n === 2) {
          await finished('block-tower');
          assert.deepEqual(await page.evaluate(() => [kit.store.data.stickers.length, kit.store.stats('block-tower').history.length]), saved.map(v => v + 1));
        }
      } else {
        // Reach: a topple and a full short stack, top revision, then symmetric solutions on both edges.
        const drop = async (slot) => {
          await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
          const [k, edge, top, direction] = await page.evaluate(() => { const g = neo.scene.game; return [g.placed.length, g.edge, g.tableTop, g.reachRound.direction]; });
          const target = await at(edge + direction * (slot * 104) / 8, top - k * 62 + 40);
          await page.evaluate(async (target) => { const t = neo.scene.game.tray.find((t) => t.x === null); await kit.dragTo(t.node, { x: target[0], y: target[1] }, 12); }, target);
          await page.waitForTimeout(500);
        };
        if (n === 0) {
          // Audit the landing window, cancelled releases, resize and top-only lifting before scored trials.
          assert.deepEqual(await page.evaluate(() => {
            const g = neo.scene.game;
            return [-12, 8, 9, 10].map((x) => g.slot(g.reachScreen(x), g.tableTop));
          }), [-12, 8, 8, 8], 'live drop and ghost share the solver domain');
          assert.deepEqual(await page.evaluate(() => {
            const g = neo.scene.game, t = g.tray[0];
            t.node.emit('pointerdown', { pointerId: 81, global: t.node.getGlobalPosition() });
            t.node.position.set(g.reachScreen(-3), g.tableTop);
            window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 81 }));
            return [t.x, t.drag.dragging, g.misses, g.hints];
          }), [null, false, 0, 0], 'cancel over table returns to tray without committing or scoring');
          await page.waitForTimeout(500);
          assert.deepEqual(await page.evaluate(async () => {
            const g = neo.scene.game;
            await kit.dragTo(g.tray[0].node, { x: g.reachScreen(-3), y: g.tableTop + 40 }, 12);
            neo.paused = true; // Freeze the real landing tween to inspect the brief input window.
            const first = g.tray[0], second = g.tray[1];
            second.node.emit('pointerdown', { pointerId: 82, global: second.node.getGlobalPosition() });
            first.node.emit('pointerdown', { pointerId: 83, global: first.node.getGlobalPosition() });
            return [g.busy, first.drag.dragging, second.drag.dragging, g.placed.length];
          }), [true, false, false, 1], 'neither a second drop nor a top lift interrupts landing');
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.evaluate(() => { neo.paused = false; });
          await idle(n);
          assert.ok(await page.evaluate(() => {
            const g = neo.scene.game, t = g.placed[0];
            return t.node.x === g.reachScreen(-3) && t.node.y === g.tableTop && t.drag.enabled;
          }), 'landing relayouts against the resized table before controls reopen');
          // Simulate an existing next-placement hint; lifting invalidates it and returns only the top.
          assert.deepEqual(await page.evaluate(async () => {
            const g = neo.scene.game, t = g.placed[0];
            g.hintGhost.visible = true;
            const p = t.node.getGlobalPosition();
            t.node.emit('pointerdown', { pointerId: 84, global: p });
            const cleared = !g.hintGhost.visible;
            t.node.position.set(g.view.w - 200, g.floor + 30);
            t.node.emit('pointerup', { pointerId: 84 });
            await kit.sleep(500);
            return [cleared, g.placed.length, g.misses, g.hints];
          }), [true, 0, 0, 0], 'top lift clears stale help and returns the block without a miss');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(200);
          await drop(3);
          await page.waitForFunction(() => !neo.scene.game.busy && neo.scene.game.placed.length === 0);
          await drop(-3); await drop(-3); // Stable, full, short stack: a different explained miss.
          await idle(n); // Its spoken explanation finishes before constructive help appears.
          assert.deepEqual(await counts(), [2, 1]);
          assert.ok(await page.evaluate(() => neo.scene.game.glowTop), 'impossible prefix highlights the actual top block');
          await page.evaluate(async () => { const g = neo.scene.game; await kit.dragTo(g.placed.at(-1).node, { x: g.view.w - 200, y: g.floor + 70 }, 12); });
          await page.waitForTimeout(500);
          // Repeating help after revision keeps the task's hint counted once.
          await page.evaluate(() => neo.scene.game.reachHint());
          assert.deepEqual(await counts(), [2, 1]);
          assert.ok(await page.evaluate(() => neo.scene.game.hintGhost.visible), 'a glowing place for the next block');
          await screenshot(`block-tower-${level}`);
        }
        if (await page.evaluate(() => neo.scene.game.reachRound.direction === -1)) {
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(200);
          assert.ok(await page.evaluate(() => { const g = neo.scene.game; return !g.hintGhost.visible || (g.hintGhost.x === g.reachScreen(g.hintSlot) && g.hintGhost.y === g.tableTop - g.placed.length * 62); }), 'hint follows the resized table');
          await screenshot('block-tower-6-left-portrait');
        }
        const way = await page.evaluate(async () => { const g = neo.scene.game; return (await import('/src/games/block-tower/logic.ts')).finish(g.placed.map(t => t.x), g.reachRound); });
        for (const slot of way) await drop(slot);
      }
    }
    await finished('block-tower');
    assert.deepEqual(await page.evaluate(() => [kit.store.data.stickers.length, kit.store.stats('block-tower').history.length]), savedTower.map(v => v + 1));
    assert.deepEqual(await score('block-tower'), mode === 'flag' || mode === 'match' || mode === 'reach' ? [2, 1] : [0, 0]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Block Tower ${level} (${mode}): ${{ tumble: 'stack and tumble', friend: 'as tall as a friend', flag: 'up to the flag, too tall and too short explained, counted hint', match: "compared with Duck's tower, explained misses, counted hint", stand: 'both predictions unscored, frozen first/third replay and resize, explicit Continue, one sticker', reach: 'topples explained, glowing hint place, star reached' }[mode]}, saved score and sticker passed`);
  }

  if (!only || only === 'lasso') {
    // Loops are drawn like a finger would: around a chosen group, checked to hold exactly that group.
    await page.evaluate(async () => {
      const { inside } = await import('/src/games/lasso-loops/logic.ts');
      const hull = (pts) => {
        const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
        const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
        const half = (list) => { const h = []; for (const q of list) { while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop(); h.push(q); } return h; };
        return half(p).slice(0, -1).concat(half([...p].reverse()).slice(0, -1));
      };
      const around = (pts) => hull(pts.flatMap((q) => Array.from({ length: 8 }, (_, k) => ({ x: q.x + 26 * Math.cos((k * Math.PI) / 4), y: q.y + 26 * Math.sin((k * Math.PI) / 4) }))));
      window.lasso = {
        loop(n) {
          const g = neo.scene.game; const free = g.free;
          for (const seed of free) {
            const group = [...free].sort((a, b) => Math.hypot(a.x - seed.x, a.y - seed.y) - Math.hypot(b.x - seed.x, b.y - seed.y)).slice(0, n);
            const poly = around(group.map((f) => ({ x: f.x, y: f.y })));
            if (free.filter((f) => inside(poly, f.position)).length === n) return poly;
          }
          throw new Error(`No loop of ${n}`);
        },
        async draw(poly) {
          const s = neo.view.scale; const r = document.querySelector('canvas').getBoundingClientRect();
          const pts = [...poly, poly[0]];
          const path = pts.flatMap((p, i) => (i ? kit.line([pts[i - 1].x, pts[i - 1].y], [p.x, p.y], 4).slice(1) : [[p.x, p.y]])).map(([x, y]) => [r.left + x * s, r.top + y * s]);
          await kit.drag(path, 1, 4); await kit.sleep(250);
        },
      };
    });
    for (let level = fromLevel; level <= Number(process.env.TO_LEVEL || 6); level++) {
      await launch('lasso-loops', level);
      if (level >= 4) await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
      if (level === 6) {
        assert.deepEqual(await page.evaluate(() => neo.scene.mod.levels('school')), { min: 3, max: 6 });
        await tap('neo.scene.game.guessCards.find((c) => Math.abs(c.value - neo.scene.game.round.fireflies) >= 10)');
        await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
        assert.deepEqual(await counts(), [0, 0]);
        assert.equal(await page.evaluate(() => neo.scene.game.jars.filter((j) => j.visible).length), 1);
      }
      const jars = await page.evaluate(() => neo.scene.game.jars.length);
      for (let j = 0; j < jars; j++) {
        await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.game.finished, null, { timeout: 30000 });
        if (await page.evaluate(() => neo.scene.game.finished || !neo.scene.game.free.length)) break;
        const want = await page.evaluate(() => neo.scene.game.jar.want || 2);
        if (level === 6 && j === 1) {
          const before = await counts();
          await screenshot('lasso-loops-6-guess-sign');
          await tap('neo.scene.game.guessCards.find((c) => Math.abs(c.value - neo.scene.game.round.fireflies) < 10)');
          await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
          assert.deepEqual(await counts(), before);
          assert.equal(await page.evaluate(() => { const g = neo.scene.game; return g.guessSign.visible && g.guessNumber.text === String(g.guess) && Math.abs(g.guess - g.round.fireflies) < 10; }), true);
          assert.equal(await page.evaluate(() => neo.scene.game.jars.every((j) => j.visible)), true);
        }
        if (j === 0 && level > 1) {
          // Two loops with one too many: gentle misses, then rings around a group that fits.
          for (let k = 0; k < 2; k++) {
            await page.evaluate(async (n) => lasso.draw(lasso.loop(n)), want + 1);
            await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
          }
          assert.deepEqual(await counts(), [2, 1]);
          assert.equal(await page.evaluate(() => neo.scene.game.flies.filter((f) => f.ring.visible).length), want);
          if (level !== 6) await screenshot(`lasso-loops-${level}`);
        }
        await page.evaluate(async (n) => lasso.draw(lasso.loop(n)), want);
        await page.waitForFunction((j) => { const g = neo.scene.game; return g.index > j || g.finished || g.pads.length > 0; }, j, { timeout: 30000 });
      }
      if (level >= 3) {
        // How many in all? A wrong number is counted aloud the way the jars show it.
        await page.waitForFunction(() => neo.scene.game.pads.length === 3 && !neo.scene.game.busy, null, { timeout: 30000 });
        if (level !== 6) await screenshot(`lasso-loops-${level}-question`);
        await tap('neo.scene.game.pads.find((p) => p.value !== neo.scene.game.round.answer)');
        await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 40000 });
        await tap('neo.scene.game.pads.find((p) => p.value === neo.scene.game.round.answer)');
      }
      await finished('lasso-loops');
      assert.deepEqual(await score('lasso-loops'), level === 1 ? [0, 0] : level === 2 ? [2, 1] : [3, 1]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log(`Lasso Loops ${level}: loops drawn around fireflies${level > 1 ? ', wrong-sized loops explained, ringed hint' : ''}${level >= 3 ? ', how-many question with a counted miss' : ''}, saved score and sticker passed`);
    }
  }
  const saysTop = await page.evaluate(async () => (await import('/src/games/pet-says/logic.ts')).PLANS.length);
  if (!only || only === 'says') for (let level = fromLevel; level <= saysTop; level++) {
    // Nothing is judged: the pet moves, and a grown-up taps the arrow. Tapping the big pet shows the move again.
    await launch('pet-says', level);
    if (level === 3) await page.setViewportSize({ width: 768, height: 1024 });
    const turns = await page.evaluate(() => neo.scene.game.turns.length);
    assert.equal(await page.evaluate(() => neo.scene.pet.visible), false, 'the big pet stands in for the corner guide');
    for (let n = 0; n < turns; n++) {
      await page.waitForFunction((n) => { const g = neo.scene.game; return g.index === n && !g.busy && g.next.visible; }, n, { timeout: 40000 });
      if (level === 2 && n === 0) {
        await page.evaluate(() => neo.scene.game.update(10));
        assert.equal(await page.evaluate(() => neo.scene.game.nudged), true, 'idle wait points out the arrow');
        assert.equal(await page.evaluate(() => neo.scene.game.index), 0, 'the nudge never advances co-play');
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
      }
      if (n === 1) {
        await tap('neo.scene.game.mover.pet');
        if (level !== 5) assert.equal(await page.evaluate(() => neo.scene.game.next.visible), false, 'showing the move again');
        await page.waitForFunction(() => !neo.scene.game.busy && neo.scene.game.next.visible, null, { timeout: 40000 });
        await screenshot(`pet-says-${level}`);
      }
      await page.waitForTimeout(250);
      await tap('neo.scene.game.next');
    }
    await finished('pet-says');
    assert.deepEqual(await score('pet-says'), [0, 0]);
    assert.equal(await page.evaluate(() => neo.scene.pet.visible), false);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Pet Says ${level} (${await page.evaluate(() => neo.scene.game.plan.mode)}): moves shown and repeated, grown-up arrow, saved round and sticker passed`);
  }

  if (!only || only === 'owls') for (let level = fromLevel; level <= 4; level++) {
    await launch('owl-walk', level);
    if (level === 2) await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
    // An owl tapped before a card is turned over just says to turn one over.
    await tap('neo.scene.game.owls[0].critter');
    assert.equal(await page.evaluate(() => neo.scene.game.owls[0].spot), -1);
    const nestTap = '({ getGlobalPosition: () => neo.scene.game.nest.toGlobal({ x: 0, y: -120 }) })';
    let wrong = false;
    for (let t = 0; t < 60 && !(await page.evaluate(() => neo.scene.game.finished)); t++) {
      await page.waitForFunction(() => { const g = neo.scene.game; return g.finished || (!g.busy && g.turn === 'child'); }, null, { timeout: 40000 });
      if (await page.evaluate(() => neo.scene.game.finished)) break;
      await tap('neo.scene.game.deck');
      await page.waitForFunction(() => neo.scene.game.card && !neo.scene.game.busy, null, { timeout: 20000 });
      if (level === 1 && t === 1) {
        // The owl is on a stone now: tapping it (what the old game taught) is not a miss, only a reminder to tap the stone.
        const before = await counts();
        await tap('neo.scene.game.owls[0].critter');
        await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
        assert.deepEqual(await counts(), before, 'her own owl, tapped on its stone, is not a miss');
      }
      // Which owl moves, where it lands, a stone of another color, and (on the levels that ask) an owl that hops less.
      const plan = await page.evaluate(async () => {
        const L = await import('/src/games/owl-walk/logic.ts'); const g = neo.scene.game; const spots = g.owls.map((o) => o.spot);
        const mode = g.plan.mode;
        const best = mode === 'one' ? [0] : mode === 'turns' ? [L.owlOf(g.path, spots, 0)] : L.farthest(g.path, spots, g.card);
        const owl = best[0];
        const worse = g.owls.findIndex((o, i) => !best.includes(i) && o.spot < g.path.length);
        const to = L.hop(g.path, spots, owl, g.card);
        const other = g.path.findIndex((c, s) => c !== g.card && s > spots[owl] && s !== to);
        return { mode, owl, worse, to, home: to >= g.path.length, other, before: spots[owl] };
      });
      const stone = plan.home ? nestTap : `neo.scene.game.stones[${plan.to}]`;
      if (plan.mode === 'choose' || plan.mode === 'farthest') {
        const onlyOne = await page.evaluate(() => neo.scene.game.moving().length === 1);
        if (!onlyOne) {
          if (plan.mode === 'farthest' && !wrong && plan.worse >= 0) {
            // A shorter hop is a gentle miss with both numbers said; the second brings a glow on the farthest owl.
            wrong = true;
            for (let k = 0; k < 2; k++) { await tap(`neo.scene.game.owls[${plan.worse}].critter`); await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 }); }
            assert.deepEqual(await counts(), [2, 1]);
            assert.ok(await page.evaluate((b) => neo.scene.game.owls[b].glow.visible, plan.owl));
            await screenshot(`owl-walk-${level}`);
          } else if (plan.mode === 'choose' && !wrong && plan.worse >= 0) {
            // Choosing an owl is free: picking one that hops less, then changing her mind, is never a miss.
            wrong = true;
            await tap(`neo.scene.game.owls[${plan.worse}].critter`); await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
            assert.equal(await page.evaluate(() => neo.scene.game.selected !== null), true, JSON.stringify(await page.evaluate((w) => { const g = neo.scene.game; return { w, sel: g.selected, busy: g.busy, turn: g.turn, card: g.card, owls: g.owls.map((o) => [o.critter.x, o.critter.y, o.spot]), lastTap: g.lastTap, now: performance.now() }; }, plan.worse)));
            assert.deepEqual(await counts(), [0, 0]);
          }
          await tap(`neo.scene.game.owls[${plan.owl}].critter`);
          await page.waitForFunction((o) => neo.scene.game.selected === o, plan.owl, { timeout: 20000 });
        }
      } else if (level === 1 && !wrong && plan.other >= 0) {
        // A stone of another color is a gentle miss naming what was touched; the second brings a glow on the right stone.
        wrong = true;
        for (let k = 0; k < 2; k++) { await tap(`neo.scene.game.stones[${plan.other}]`); await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 }); }
        assert.deepEqual(await counts(), [2, 1]);
        assert.ok(await page.evaluate(() => neo.scene.game.hintGlow.visible));
        await screenshot(`owl-walk-${level}-hint`);
      } else if (t === 1) await screenshot(`owl-walk-${level}`);
      await tap(stone);
      await page.waitForFunction(({ b, before }) => neo.scene.game.owls[b].spot !== before, { b: plan.owl, before: plan.before }, { timeout: 20000 });
    }
    await finished('owl-walk');
    assert.ok(await page.evaluate(() => neo.scene.game.owls.every((o) => o.spot >= neo.scene.game.path.length)), 'every owl is home');
    assert.deepEqual(await score('owl-walk'), level === 1 || level === 4 ? [2, 1] : [0, 0]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Owl Walk Home ${level}: cards turned, the stone tapped for the owl to hop to${level > 1 ? ', the pet taking turns' : ''}${level === 1 ? ', a stone of another color explained with a glow' : ''}${level === 4 ? ', shorter hops explained with a glow' : ''}, everyone home, saved score and sticker passed`);
  }
}

return { shortlistBatch };
}
