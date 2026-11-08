import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished, next }) {
  async function encoreTricks() {
    for (let level = Math.max(4, Number(process.env.FROM_LEVEL || 4)); level <= 6; level++) {
      await launch('quick-tricks', level);
      if (level === 6) {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(350);
      }
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const drop = async (node, x, y) => {
          await kit.dragTo(node, g.layer.toGlobal({ x, y: y + 40 }), 18);
          await kit.sleep(500);
        };
        const next = async () => {
          if (!g.waiting) throw new Error('Encore not waiting');
          kit.tapOn(g.next);
          await kit.sleep(550);
        };
        // Parcel orientation: two unsuccessful fits, then real quarter turns and a drop.
        for (let k = 0; k < 2; k++) await drop(g.parcel, g.target.x, g.target.y);
        const { fitsParcel } = await import('/src/games/quick-tricks/second-logic.ts');
        for (let turns = 0; !fitsParcel(g.plan.shape, g.turns, g.round.turn); turns++) {
          if (turns > 3) throw new Error('Parcel did not turn');
          kit.tapOn(g.turn);
          await kit.sleep(450);
        }
        await drop(g.parcel, g.target.x, g.target.y);
        await next();
        // Setting places: no yellow arrow (the last bowl wins by itself), so a tap where it was is free; a bowl on a filled place is free too.
        if (g.submit.visible) throw new Error('Yellow arrow shown at the picnic');
        for (let k = 0; k < 2; k++) {
          kit.tapOn(g.submit);
          await kit.sleep(500);
        }
        const filled = g.seats.find((s) => s.filled);
        if (filled) await drop(g.bowl, filled.node.x, filled.node.y);
        if (g.misses !== 2 || g.hints !== 1) throw new Error(`Encore picnic scores ${g.misses}/${g.hints}`);
        for (const s of g.seats.filter((s) => !s.filled)) await drop(g.bowl, s.node.x, s.node.y);
        if (g.friends.length !== g.plan.friends || new Set(g.kinds).size !== g.kinds.length)
          throw new Error('Picnic friends are not distinct critters');
        await next();
        // Part-whole berries: count the starting berries, add, undo an extra, then serve.
        for (let k = 0; k < 2; k++) {
          kit.tapOn(g.submit);
          await kit.sleep(500);
        }
        const need = g.plan.total - g.berries;
        for (let k = 0; k < need + 1; k++) {
          kit.tapOn(g.berry);
          await kit.sleep(450);
        }
        kit.tapOn(g.undo);
        await kit.sleep(500);
        kit.tapOn(g.submit);
        await kit.sleep(500);
        if (g.misses !== 4 || g.hints !== 2) throw new Error(`Encore scores ${g.misses}/${g.hints}`);
      });
      await screenshot(`quick-tricks-encore-${level}`);
      await tap('neo.scene.game.next');
      // The cast takes a bow before the round ends.
      await page.waitForFunction(
        () => neo.scene.game.finished && neo.scene.game.friends.length === neo.scene.game.plan.friends,
      );
      if (level === 6) await screenshot('quick-tricks-encore-bow');
      await finished('quick-tricks');
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('quick-tricks').history.at(-1);
          return [r.level, r.misses, r.hints];
        }),
        [level, 4, 2],
      );
      await page.setViewportSize({ width: 1024, height: 768 });
      log(
        `Quick Tricks ${level}: parcel turns, picnic places with no yellow arrow, berry totals, undo, hints, the bow and one saved sticker passed`,
      );
    }
    const from = Number(process.env.FROM_LEVEL || 1),
      to = Number(process.env.TO_LEVEL || 9);
    if (from <= 7 && to >= 7) await twoAtOnce();
    if (from <= 8 && to >= 8) await tinyShow();
    if (to >= 9) await thirdShow();
  }

  // Level 7, Two at once (portrait): leaves kept partly up, both up with someone wet (the move line and the glow, one hint), the fix;
  // two wrong socks (the glow), both pairs; the long plank on the narrow gap, the middle one bumping the wide gap, the fix; the bow.
  async function twoAtOnce() {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(350);
    await launch('quick-tricks', 7);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const drop = async (node, x, y) => {
        await kit.dragTo(node, g.layer.toGlobal({ x, y: y + 40 }), 18);
        await kit.sleep(500);
      };
      const ready = async () => {
        await kit.until(() => !g.busy, 8000);
      };
      const next = async () => {
        await kit.until(() => g.waiting, 8000);
        kit.tapOn(g.next);
        await kit.sleep(600);
      };
      const { friendsFor, leafPlan } = await import('/src/games/quick-tricks/logic.ts');
      await ready();
      if (g.friends.length !== 3 || g.leaves.length !== 2)
        throw new Error('Two at once does not show three friends and two leaves');
      const f = friendsFor(g.plan),
        top = g.rainSpan.top - 40;
      // The wide leaf over only the friend on their own, the small one over one of the pair: both kept, no miss, then the move line and the glow.
      await drop(g.leaves[1].node, g.cx + f[2], top);
      if (g.up[1] === null || g.misses !== 0)
        throw new Error(`A leaf over one friend was not kept freely (${g.up}, ${g.misses})`);
      await drop(g.leaves[0].node, g.cx + f[0], top);
      if (g.up.some((u) => u === null) || g.misses !== 0 || g.hints !== 1 || !g.hinted)
        throw new Error(`Both leaves up with someone wet: ${g.up} ${g.misses}/${g.hints}`);
    });
    await screenshot('quick-tricks-two-at-once');
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const drop = async (node, x, y) => {
        await kit.dragTo(node, g.layer.toGlobal({ x, y: y + 40 }), 18);
        await kit.sleep(500);
      };
      const ready = async () => {
        await kit.until(() => !g.busy, 8000);
      };
      const next = async () => {
        await kit.until(() => g.waiting, 8000);
        kit.tapOn(g.next);
        await kit.sleep(600);
      };
      const { leafPlan } = await import('/src/games/quick-tricks/logic.ts');
      const top = g.rainSpan.top - 40;
      for (const s of leafPlan(g.plan))
        if (g.up[s.leaf] !== s.x && !g.waiting) await drop(g.leaves[s.leaf].node, g.cx + s.x, top);
      if (g.misses !== 0 || g.hints !== 1) throw new Error(`Umbrella scores ${g.misses}/${g.hints}`);
      if (!(await kit.until(() => g.waiting, 8000)))
        throw new Error(
          `Umbrella not done: up ${g.up}, plan ${JSON.stringify(leafPlan(g.plan))}, busy ${g.busy}, trick ${g.trick}`,
        );
      await next();
      await ready();
      // Two wrong socks bring the glow; then both partners.
      const { partnerOf } = await import('/src/games/quick-tricks/logic.ts');
      const m = g.monster,
        at = [m.x, m.y - 110];
      const wrong = g.socks.filter((s) => partnerOf(g.heldTwo, g.paired, s.sock) < 0);
      for (const s of wrong.slice(0, 2)) await drop(s.node, ...at);
      if (g.misses !== 2 || g.hints !== 2 || !g.hinted)
        throw new Error(`Socks scores ${g.misses}/${g.hints}`);
      for (const s of g.socks.filter((s) => partnerOf(g.heldTwo, g.paired, s.sock) >= 0))
        await drop(s.node, ...at);
      if (!g.paired.every(Boolean)) throw new Error('Socks not both paired');
      await next();
      await ready();
      // The long plank on the narrow gap, then the middle one bumps the wide gap (a miss); lift the long one over, then the middle one.
      const L = g.planks.map((p) => p.length),
        order = [...L].sort((a, b) => a - b).map((l) => L.indexOf(l)),
        [, mid, long] = order;
      const gapX = (i) => {
        const [lo, hi] = g.gap(i);
        return (lo + hi) / 2;
      };
      await drop(g.planks[long].node, gapX(0), g.bankY);
      if (g.onGaps[0] !== long) throw new Error('The long plank did not lie on the narrow gap');
      await drop(g.planks[mid].node, gapX(1), g.bankY);
      if (g.misses !== 3 || g.onGaps[1] !== null)
        throw new Error(`Middle plank on the wide gap: ${g.misses}`);
      await drop(g.planks[long].node, gapX(1), g.bankY);
      if (g.onGaps[0] !== null || g.onGaps[1] !== long)
        throw new Error(`Lifting the long plank: ${g.onGaps}`);
      await drop(g.planks[mid].node, gapX(0), g.bankY);
      if (g.misses !== 3 || g.hints !== 2) throw new Error(`Bridge scores ${g.misses}/${g.hints}`);
    });
    await page.waitForFunction(() => neo.scene.game.waiting, null, { timeout: 10000 });
    await tap('neo.scene.game.next');
    await page.waitForFunction(() => neo.scene.game.finished && neo.scene.game.friends.length === 3);
    await finished('quick-tricks');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('quick-tricks').history.at(-1);
        return [r.level, r.misses, r.hints];
      }),
      [7, 3, 2],
    );
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Quick Tricks 7: leaves kept partly up, the move line and glow, two wrong socks and the glow, a plank lifted to the other gap, the bow and one saved sticker passed',
    );
  }

  // Level 8, A tiny show (toddler, portrait): two tricks only; a leaf dropped in front of the friend floats up and keeps them dry,
  // a stretch let go short springs back free, one let go just past halfway snaps across; nothing counts; the bow without the monster.
  async function tinyShow() {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(350);
    await launch('quick-tricks', 8, 'Mia', 'toddler');
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const drop = async (node, x, y) => {
        await kit.dragTo(node, g.layer.toGlobal({ x, y: y + 40 }), 18);
        await kit.sleep(500);
      };
      const next = async () => {
        await kit.until(() => g.waiting, 8000);
        kit.tapOn(g.next);
        await kit.sleep(600);
      };
      await kit.until(() => g.trick === 'umbrella' && !g.busy, 10000);
      if (g.tricks.join() !== 'umbrella,bridge' || g.leaves.length !== 1)
        throw new Error(`Tiny show tricks ${g.tricks}`);
      // In front of the friend, well below their head: dry at once.
      await drop(g.leaves[0].node, g.friends[0].x + 30, g.rainSpan.top + 90);
      if (!(await kit.until(() => g.waiting, 8000)))
        throw new Error('A leaf in front of the friend did not keep them dry');
      if (Math.abs(g.leaves[0].node.x - g.friends[0].x) > 2)
        throw new Error('The leaf did not float up over the friend');
      await next();
      await kit.until(() => g.trick === 'bridge' && !g.busy, 10000);
      const [l] = g.banks,
        y = g.bankY;
      // Short of halfway: springs back, free.
      await drop(g.handle.node, l + 100, y);
      await kit.until(() => !g.springing, 3000);
      if (g.waiting || g.misses !== 0)
        throw new Error(`Short stretch: waiting ${g.waiting}, misses ${g.misses}`);
      // Just past halfway: it snaps across.
      await drop(g.handle.node, l + 200, y);
      if (!(await kit.until(() => g.waiting, 8000)))
        throw new Error(`A stretch past halfway did not snap across (length ${g.bridgeLength})`);
      if (g.misses !== 0 || g.hints !== 0) throw new Error(`Tiny show scores ${g.misses}/${g.hints}`);
    });
    await page.waitForFunction(() => neo.scene.game.waiting, null, { timeout: 10000 });
    await tap('neo.scene.game.next');
    await page.waitForFunction(() => neo.scene.game.finished && neo.scene.game.friends.length === 1);
    await page.waitForTimeout(700);
    await screenshot('quick-tricks-tiny-show-bow');
    await finished('quick-tricks');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('quick-tricks').history.at(-1);
        return [r.level, r.misses, r.hints];
      }),
      [8, 0, 0],
    );
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Quick Tricks 8: a leaf dropped in front of the friend kept them dry, a short stretch sprang back free, one past halfway snapped across, no misses, the bow and one saved sticker passed',
    );
  }

  // Level 9, The third show (pre-K, portrait): the crank let go mid-turn keeps its progress, then pops the friend at three turns;
  // an overfilled cup is no miss and is tipped out; two loops around the wrong number are two misses and bring the glow; the bow.
  async function thirdShow() {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(350);
    await launch('quick-tricks', 9, 'Mia', 'prek');
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { halfTurns, cupTarget } = await import('/src/games/quick-tricks/third-logic.ts');
      const { demoLoop } = await import('/src/games/lasso-loops/logic.ts');
      if (g.constructor.name !== 'ThirdShow' || g.amounts.halves !== 6)
        throw new Error('Level 9 at pre-K is not the third show asking three turns');
      const turn = async (turns, from) => {
        const pts = [];
        for (let i = 0; i <= Math.round(turns * 36); i++) {
          const a = from + (i * Math.PI * 2) / 36;
          pts.push(g.handle.toGlobal({ x: 130 * Math.cos(a), y: 130 * Math.sin(a) }));
        }
        await kit.drag(
          pts.map((p) => [p.x, p.y]),
          1,
          24,
        );
        await kit.sleep(300);
      };
      await turn(1.3, g.armAngle);
      if (g.popped || halfTurns(g.crank) < 2)
        throw new Error(`Crank let go mid-turn: ${halfTurns(g.crank)} half turns, popped ${g.popped}`);
      window.__qt9 = halfTurns(g.crank);
    });
    await screenshot('quick-tricks-third-crank');
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { halfTurns, cupTarget } = await import('/src/games/quick-tricks/third-logic.ts');
      const { demoLoop } = await import('/src/games/lasso-loops/logic.ts');
      const turn = async (turns, from) => {
        const pts = [];
        for (let i = 0; i <= Math.round(turns * 36); i++) {
          const a = from + (i * Math.PI * 2) / 36;
          pts.push(g.handle.toGlobal({ x: 130 * Math.cos(a), y: 130 * Math.sin(a) }));
        }
        await kit.drag(
          pts.map((p) => [p.x, p.y]),
          1,
          24,
        );
        await kit.sleep(300);
      };
      // The let-go progress is still there: the rest of the three turns pops the friend.
      await turn(1.9, g.armAngle);
      if (!(await kit.until(() => g.popped && g.next.visible, 10000)))
        throw new Error(`No pop after three turns (${halfTurns(g.crank)} half turns)`);
      kit.tapOn(g.next);
      await kit.sleep(700);
      // The cups: one overfill (no miss), tipped out, then each cup poured to its line.
      const pourBy = async (dx) => {
        const a = g.jug.getGlobalPosition(),
          b = g.jug.parent.toGlobal({ x: g.jug.x + dx, y: g.jug.y });
        await kit.drag(kit.line([a.x, a.y], [b.x, b.y], 16), 1, 24);
        await kit.sleep(400);
      };
      await pourBy((cupTarget(g.cups) + 0.2) * 240);
      if (g.score.misses !== 0 || g.cups.overfills !== 1 || g.cups.round !== 0)
        throw new Error(`Overfill scored ${g.score.misses}, overfills ${g.cups.overfills}`);
      kit.tapOn(g.cup, 0, -100);
      await kit.sleep(400);
      if (g.cups.cup !== 0 || Math.abs(g.cups.jug + g.cups.tray - 3) > 1e-6)
        throw new Error('Tipping out lost water');
      for (let k = 0; k < 8 && !g.waiting; k++) {
        if (g.cups.jug < cupTarget(g.cups) - g.cups.cup && g.cups.tray > 0) {
          kit.tapOn(g.tray);
          await kit.sleep(400);
          continue;
        }
        await pourBy((cupTarget(g.cups) - g.cups.cup) * 240);
      }
      if (!g.waiting || g.score.misses !== 0 || g.score.hints !== 0)
        throw new Error(`Cups: waiting ${g.waiting}, ${g.score.misses}/${g.score.hints}`);
      kit.tapOn(g.next);
      await kit.sleep(700);
      // The fireflies: two loops around four (we need three) are two misses; the second brings the glow.
      const loopAround = async (n) => {
        const free = g.flies.filter((f) => !f.caught);
        const m = demoLoop(
          free.map((f) => ({ x: f.x, y: f.y })),
          n,
          34,
        );
        if (!m) throw new Error(`No loop around ${n}`);
        const c = [...m.loop, m.loop[0]].map((p) => g.layer.toGlobal(p));
        const pts = [];
        for (let i = 1; i < c.length; i++)
          pts.push(...kit.line([c[i - 1].x, c[i - 1].y], [c[i].x, c[i].y], 12));
        await kit.drag(pts, 1, 16);
        await kit.until(() => !g.busy, 8000);
        await kit.sleep(300);
      };
      await loopAround(4);
      await loopAround(4);
      if (g.score.misses !== 2 || g.score.hints !== 1 || g.hinted.length !== 3)
        throw new Error(`Loops: ${g.score.misses}/${g.score.hints}, glow ${g.hinted.length}`);
      await loopAround(3);
      if (!(await kit.until(() => g.waiting, 8000)))
        throw new Error('Three fireflies did not go into the jar');
    });
    await page.waitForFunction(() => neo.scene.game.next.visible, null, { timeout: 10000 });
    await tap('neo.scene.game.next');
    await finished('quick-tricks');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('quick-tricks').history.at(-1);
        return [r.level, r.misses, r.hints];
      }),
      [9, 2, 1],
    );
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Quick Tricks 9: the crank let go mid-turn kept its progress and popped the friend at three turns, an overfilled cup was no miss and tipped out, two wrong loops and the glow, the bow and one saved sticker passed',
    );
  }

  return { encoreTricks };
}
