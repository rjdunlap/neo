import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  async function lanternTouchPlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          busy: g.busy,
          index: g.index,
          ponds: g.ponds.length,
          lit: g.lit.filter(Boolean).length,
          presses: g.presses,
          hinted: g.hinted,
          misses: g.misses,
          hints: g.hints,
          n: g.n,
        };
      });
    const idle = () =>
      page.waitForFunction(
        () => {
          const g = neo.scene.game;
          return !g.busy || (g.waiting && !g.replaying) || neo.scene.finished;
        },
        null,
        { timeout: 15000 },
      );
    /** Tap the lantern a fewest-press way wants next, with a real touch on the pond. */
    const tapNext = async () => {
      await idle();
      // A lit pond waits for Next pond.
      if (await page.evaluate(() => neo.scene.game.waiting)) {
        await tap('neo.scene.game.nextButton');
        await page.waitForTimeout(150);
        return;
      }
      await page.evaluate(async () => {
        const g = neo.scene.game,
          { hintFor } = await import('/src/games/lantern-lights/logic.ts');
        const at = g.center(hintFor(g.lit, g.n, g.cursor, g.mask)),
          p = g.board.toGlobal(at);
        kit.tap(p.x, p.y);
      });
      await page.waitForTimeout(150);
    };
    const solveAll = async () => {
      for (let guard = 0; guard < 400 && !(await page.evaluate(() => neo.scene.finished)); guard++)
        await tapNext();
    };
    // Level 3 alone under LANTERN_ONLY=3: a named hint, the pond lit, Show me a short way (fewest presses, nothing counted,
    // a portrait screenshot mid-replay), Next pond, to the sticker.
    if (process.env.LANTERN_ONLY === '3') {
      await launch('lantern-lights', 3);
      await idle();
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      assert.equal((await state()).n, 4);
      await page.evaluate(() => {
        const g = neo.scene.game,
          say = g.ctx.say;
        g.spoken = [];
        g.ctx.say = (id, ...args) => {
          g.spoken.push(id);
          return say(id, ...args);
        };
      });
      const kind = await page.evaluate(async () => {
        const g = neo.scene.game,
          { solve } = await import('/src/games/lantern-lights/logic.ts');
        return solve(g.lit, g.n).best.length === 1 ? 'lantern.hint-one' : 'lantern.hint-many';
      });
      await tap('neo.scene.game.hintButton');
      await page.waitForTimeout(300);
      let st = await state();
      assert.deepEqual([st.hints, st.hinted !== null], [1, true]);
      assert.deepEqual(
        await page.evaluate(() => neo.scene.game.spoken.filter((id) => id.startsWith('lantern.hint'))),
        [kind],
        'the hint names its kind',
      );
      for (let guard = 0; guard < 40; guard++) {
        await idle();
        if (await page.evaluate(() => neo.scene.game.waiting)) break;
        await tapNext();
      }
      const vis = await page.evaluate(() => {
        const g = neo.scene.game;
        return [g.shortButton.visible, g.nextButton.visible, g.hintButton.visible, g.index];
      });
      assert.deepEqual(
        vis,
        [true, true, false, 0],
        'the lit pond shows the two buttons in place of the three',
      );
      const par = await page.evaluate(() => neo.scene.game.pond.par);
      const presses = (await state()).presses;
      await page.evaluate(() => {
        const g = neo.scene.game;
        g.replayPresses = 0;
        g.watch = setInterval(() => {
          if (g.ring !== null && g.ring !== g.lastRing) g.replayPresses++;
          g.lastRing = g.ring;
        }, 50);
      });
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      await tap('neo.scene.game.shortButton');
      await page.waitForFunction(
        () =>
          neo.scene.game.replaying && neo.scene.game.lit.some((on) => !on) && neo.scene.game.ring !== null,
        null,
        { timeout: 5000 },
      );
      await page.waitForTimeout(700);
      await screenshot('lantern-lights-3-replay-portrait');
      await page.waitForFunction(() => !neo.scene.game.replaying, null, { timeout: 20000 });
      const after = await page.evaluate(() => {
        const g = neo.scene.game;
        clearInterval(g.watch);
        return {
          rings: g.replayPresses,
          lit: g.lit.every(Boolean),
          presses: g.presses,
          hints: g.hints,
          waiting: g.waiting,
          buttons: [g.shortButton.visible, g.nextButton.visible],
        };
      });
      assert.deepEqual(
        after,
        { rings: par, lit: true, presses, hints: 1, waiting: true, buttons: [true, true] },
        `the replay presses par ${par} lanterns and counts nothing`,
      );
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
      await tap('neo.scene.game.nextButton');
      await page.waitForTimeout(200);
      await page.waitForFunction(() => neo.scene.game.index === 1 && !neo.scene.game.busy, null, {
        timeout: 15000,
      });
      await solveAll();
      await finished('lantern-lights');
      assert.equal(
        await page.evaluate(() => kit.store.data.stickers.length),
        before + 1,
        'one sticker at level 3',
      );
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('lantern-lights').history.at(-1);
          return [r.misses, r.hints];
        }),
        [0, 1],
      );
      assert.deepEqual(errors, []);
      log(
        `Lantern Lights level 3: a named hint (${kind}), the pond lit, Show me a short way in ${par} presses counting nothing, Next pond, one sticker passed`,
      );
      return;
    }
    // Level 9 alone under LANTERN_ONLY=9: lily-pad ponds. The pads are named once; a tap on a pad counts nothing and flips
    // nothing; a hint never rings a pad; a portrait screenshot; to the sticker.
    if (process.env.LANTERN_ONLY === '9') {
      await launch('lantern-lights', 9);
      await idle();
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      const shape = await page.evaluate(() => {
        const g = neo.scene.game;
        return {
          n: g.n,
          pads: g.mask.filter((on) => !on).length,
          sizes: g.ponds.map((p) => p.mask.filter(Boolean).length),
          same: g.ponds[0].mask.join() === g.ponds[1].mask.join(),
        };
      });
      assert.equal(shape.n, 5);
      assert.ok(shape.pads > 0, `pads on the pond: ${JSON.stringify(shape)}`);
      assert.equal(shape.same, false, 'two different shapes in a round');
      const lit0 = await page.evaluate(() => neo.scene.game.lit.slice());
      await page.evaluate(() => {
        const g = neo.scene.game,
          pad = g.mask.indexOf(false),
          p = g.board.toGlobal(g.center(pad));
        kit.tap(p.x, p.y);
      });
      await page.waitForTimeout(400);
      let st = await state();
      assert.equal(st.presses, 0, 'a tap on a pad is not a press');
      assert.deepEqual(
        await page.evaluate(() => neo.scene.game.lit.slice()),
        lit0,
        'a tap on a pad flips nothing',
      );
      await tap('neo.scene.game.hintButton');
      await page.waitForTimeout(300);
      st = await state();
      assert.deepEqual([st.hints, st.hinted !== null], [1, true]);
      assert.equal(
        await page.evaluate(() => neo.scene.game.mask[neo.scene.game.hinted]),
        true,
        'the hint rings a lantern',
      );
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      const counts = await page.evaluate(() => neo.scene.game.score.text + ' / ' + neo.scene.game.sub.text);
      assert.match(
        counts,
        new RegExp(`of ${25 - shape.pads} lit`),
        `the count is of lanterns, not pads: ${counts}`,
      );
      await screenshot('lantern-lights-9-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
      await solveAll();
      await finished('lantern-lights');
      assert.equal(
        await page.evaluate(() => kit.store.data.stickers.length),
        before + 1,
        'one sticker at level 9',
      );
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('lantern-lights').history.at(-1);
          return [r.misses, r.hints];
        }),
        [0, 1],
      );
      assert.deepEqual(errors, []);
      log(
        `Lantern Lights level 9: lily pads (${shape.pads} on the first pond, ${shape.sizes.join(' and ')} lanterns), a pad tap counting nothing, a hint on a lantern, one sticker passed`,
      );
      return;
    }
    // The school opening, alone under LANTERN_ONLY=school: level 1 with presses past the fewest plus six (the nudge toward
    // Hint once, no miss), a hint, then to the sticker; then level 2 to the sticker. Lanterns and buttons at least 100.
    if (process.env.LANTERN_ONLY === 'school') {
      const fit = () =>
        page.evaluate(() => {
          const g = neo.scene.game,
            s = neo.view.scale,
            out = [];
          if (g.cell < 100) out.push(`cell ${g.cell}`);
          const buttons = [
            ['undo', g.undoButton],
            ['hint', g.hintButton],
            ['again', g.againButton],
          ].map(([k, b]) => {
            const r = b.getBounds();
            return [
              k,
              Math.round(r.x / s),
              Math.round(r.y / s),
              Math.round(r.width / s),
              Math.round(r.height / s),
            ];
          });
          for (const [k, , , w, h] of buttons) if (w < 100 || h < 100) out.push(`${k} ${w}x${h}`);
          return {
            out,
            view: `${neo.view.w}x${neo.view.h}`,
            cell: g.cell,
            pond: [g.board.x, g.board.y, g.n * g.cell],
            buttons,
          };
        });
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
      await launch('lantern-lights', 1, 'Mia', 'school');
      await idle();
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      assert.equal((await state()).n, 3);
      const f = await fit();
      assert.deepEqual(f.out, [], `school level 1 ${f.view}`);
      log(
        `school level 1 at ${f.view}: cell ${f.cell}, pond ${f.pond}, buttons ${JSON.stringify(f.buttons)}`,
      );
      await page.evaluate(() => {
        const g = neo.scene.game,
          say = g.ctx.say;
        g.spoken = [];
        g.ctx.say = (id, ...args) => {
          g.spoken.push(id);
          return say(id, ...args);
        };
      });
      // One lantern pressed again and again: never the pond's two-lantern answer, so it never lights.
      const pressCorner = (times) =>
        page.evaluate(async (times) => {
          const g = neo.scene.game,
            p = g.board.toGlobal(g.center(0));
          for (let i = 0; i < times; i++) {
            kit.tap(p.x, p.y);
            await new Promise((r) => setTimeout(r, 150));
          }
        }, times);
      await pressCorner(7);
      let st = await state(),
        said = await page.evaluate(() => neo.scene.game.spoken.slice());
      assert.equal(st.presses, 7);
      assert.ok(!said.includes('lantern.stuck-school'), `no nudge before the fewest plus six: ${said}`);
      await pressCorner(3);
      st = await state();
      said = await page.evaluate(() => neo.scene.game.spoken.slice());
      assert.equal(st.presses, 10);
      assert.deepEqual(
        said.filter((id) => id === 'lantern.stuck-school'),
        ['lantern.stuck-school'],
        `the nudge once at 8: ${said}`,
      );
      assert.deepEqual([st.misses, st.hints], [0, 0], 'the nudge counts nothing');
      await tap('neo.scene.game.hintButton');
      await page.waitForTimeout(300);
      st = await state();
      assert.deepEqual([st.hints, st.hinted !== null], [1, true]);
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      const fp = await fit();
      assert.deepEqual(fp.out, [], `school level 1 ${fp.view}`);
      await screenshot('lantern-lights-school-1-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
      await solveAll();
      await finished('lantern-lights');
      assert.equal(
        await page.evaluate(() => kit.store.data.stickers.length),
        before + 1,
        'one sticker at school level 1',
      );
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('lantern-lights').history.at(-1);
          return [r.misses, r.hints];
        }),
        [0, 1],
      );
      await launch('lantern-lights', 2, 'Mia', 'school');
      await idle();
      const before2 = await page.evaluate(() => kit.store.data.stickers.length);
      st = await state();
      assert.equal(st.n, 3);
      assert.equal(await page.evaluate(() => neo.scene.game.pond.par), 4);
      await solveAll();
      await finished('lantern-lights');
      assert.equal(
        await page.evaluate(() => kit.store.data.stickers.length),
        before2 + 1,
        'one sticker at school level 2',
      );
      assert.deepEqual(errors, []);
      log(
        'Lantern Lights school opening: level 1 (the nudge once at 8 presses, no miss, a hint) and level 2 to the sticker, 100-unit targets passed',
      );
      return;
    }
    // Level 8 (a 6 by 6 pond): a hint, then to the sticker; upright the counts share one line above the pond, clear of it.
    await launch('lantern-lights', 8);
    await idle();
    const before8 = await page.evaluate(() => kit.store.data.stickers.length);
    assert.equal((await state()).n, 6);
    await tap('neo.scene.game.hintButton');
    assert.equal((await state()).hints, 1);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    const counts = await page.evaluate(() => {
      const g = neo.scene.game,
        b = g.score.getBounds(),
        w = g.n * g.cell;
      return {
        text: g.score.text,
        sub: g.sub.visible,
        cell: g.cell,
        gap: g.board.y - 18 - (b.y + b.height) / neo.view.scale,
        top: b.y / neo.view.scale,
        left: b.x / neo.view.scale,
        right: (b.x + b.width) / neo.view.scale,
        vw: neo.view.w,
        pondRight: g.board.x + w,
      };
    });
    assert.match(
      counts.text,
      /press.* · \d+ of 36 lit/,
      `one line of counts upright: ${JSON.stringify(counts)}`,
    );
    assert.equal(counts.sub, false);
    assert.ok(
      counts.gap > 0 && counts.left > 130 && counts.right < counts.vw - 130 && counts.cell >= 64,
      `the counts sit above the pond, between the corner buttons: ${JSON.stringify(counts)}`,
    );
    await screenshot('lantern-lights-8-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.equal(
      await page.evaluate(() => neo.scene.game.sub.visible),
      true,
      'sideways the counts sit beside the pond',
    );
    await solveAll();
    await finished('lantern-lights');
    assert.equal(
      await page.evaluate(() => kit.store.data.stickers.length),
      before8 + 1,
      'one sticker at level 8',
    );
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('lantern-lights').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 1],
    );
    log(
      'Lantern Lights level 8: a 6 by 6 pond, one hint, the counts above the pond upright, one sticker passed',
    );
    if (process.env.LANTERN_ONLY === '8') {
      assert.deepEqual(errors, []);
      return;
    }
    // Level 1 (first): a tap that is not in the answer is free and can be taken back; a hint counts once; start over; then light every pond.
    await launch('lantern-lights', 1);
    await idle();
    const stickers = await page.evaluate(() => kit.store.data.stickers.length);
    let st = await state();
    assert.equal(st.n, 3);
    const before = st.lit;
    await page.evaluate(() => {
      const g = neo.scene.game,
        p = g.board.toGlobal(g.center(g.n * g.n - 1));
      kit.tap(p.x, p.y);
    });
    await page.waitForTimeout(400);
    st = await state();
    assert.equal(st.presses, 1, 'a tap on a lantern is one press');
    await tap('neo.scene.game.undoButton');
    await page.waitForTimeout(400);
    st = await state();
    assert.equal(st.lit, before, 'undo puts the lanterns back');
    assert.equal(st.misses, 0);
    await tap('neo.scene.game.hintButton');
    st = await state();
    assert.deepEqual([st.hints, st.hinted !== null], [1, true]);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await screenshot('lantern-lights-1-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    await tap('neo.scene.game.againButton');
    await page.waitForTimeout(500);
    await solveAll();
    await finished('lantern-lights');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1);
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('lantern-lights').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 1],
    );
    // Level 6 (last): the biggest pond, solved by touch alone, no help.
    await launch('lantern-lights', 6);
    await idle();
    assert.ok((await state()).n >= 4);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await screenshot('lantern-lights-6-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    await screenshot('lantern-lights-6-landscape');
    await solveAll();
    await finished('lantern-lights');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('lantern-lights').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 0],
    );
    // Opening it from Lantern Lake plays it here, by touch; leaving mid-round is quiet.
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
      neo.go.land('lantern-lake');
    });
    await scene('LandScene');
    await page.evaluate(() => neo.go.game('lantern-lights', 'grownup', undefined, false, 'lantern-lake'));
    await scene('GameScene');
    await idle();
    await tapNext();
    await page.evaluate(() => neo.go.land('lantern-lake'));
    await scene('LandScene');
    await page.waitForTimeout(700);
    // (A puzzle that takes only a controller would open its couch puzzle-shelf course from the island; Pond Conga, the last, now plays by touch.)
    await page.evaluate(() => neo.go.hub());
    await scene('MapScene');
    assert.deepEqual(errors, []);
    log(
      'Lantern Lights touch: first and last level, a free tap and undo, one hint, start over, one sticker each, portrait and leaving mid-round passed',
    );
  }

  return { lanternTouchPlay };
}
