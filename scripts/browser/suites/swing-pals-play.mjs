import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  async function paintTheBeat() {
    await page.setViewportSize({ width: 390, height: 844 });
    await launch('swing-pals', 9);
    const before = await page.evaluate(() => ({
      upright: neo.scene.game.view.upright,
      stickers: kit.store.data.stickers.length,
      paper: neo.scene.game.trace.seconds,
      tick: neo.scene.game.tick.visible,
    }));
    assert.deepEqual([before.upright, before.paper, before.tick], [true, 0, false]);
    const push = async () => {
      const point = await page.evaluate(() => {
        const g = neo.scene.game;
        const { x, w } = g.layout.paper;
        const point = g.ctx.stage.toGlobal({ x: x + w / 2, y: g.layout.seatY + 90 });
        const canvas = document.querySelector('canvas').getBoundingClientRect();
        return { x: point.x + canvas.left, y: point.y + canvas.top };
      });
      await page.touchscreen.tap(point.x, point.y);
    };
    await push();
    await page.waitForFunction(() => neo.scene.game.trace.seconds > 0.2);
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForFunction(() => neo.scene.game.trace.sections[0]?.seconds >= 6);
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
    const tapNode = async (name) => {
      const point = await page.evaluate((name) => {
        const g = neo.scene.game;
        const point = (name === 'tick' ? g.tick : g.hooks.get(name)).getGlobalPosition();
        const canvas = document.querySelector('canvas').getBoundingClientRect();
        return { x: point.x + canvas.left, y: point.y + canvas.top };
      }, name);
      await page.touchscreen.tap(point.x, point.y);
    };
    await tapNode('short');
    await page.waitForFunction(() => neo.scene.game.swing.hook === 'short' && !neo.scene.game.move);
    const sampleCount = await page.evaluate(() => neo.scene.game.trace.sections[0].dots.length);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForFunction(() => !neo.scene.game.view.upright);
    assert.equal(await page.evaluate(() => neo.scene.game.trace.sections[0].dots.length), sampleCount);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => neo.scene.game.view.upright);
    await push();
    await page.waitForFunction(() => neo.scene.game.trace.sections[1]?.seconds >= 3);
    await tapNode('tick');
    await page.waitForFunction(() => !!neo.scene.game.reveal);
    await page.waitForTimeout(680);
    await screenshot('swing-pals-9-painting-portrait');
    await finished('swing-pals');
    await page.waitForFunction(() => !!neo.scene.after?.keep);
    await page.waitForTimeout(850);
    assert.equal(await page.evaluate(() => kit.store.creations.picture.current), null);
    assert.deepEqual(
      await page
        .evaluate(() => ({
          stickers: kit.store.data.stickers.length,
          found: kit.store.data.journal.found.includes('swing-pals:longer-slower'),
          record: kit.store.stats('swing-pals').history.at(-1),
        }))
        .then(({ stickers, found, record }) => [stickers, found, record.misses, record.hints]),
      [before.stickers + 1, true, 0, 1],
      'one sticker, the rope comparison and no misses with one requested hint',
    );
    const expected = await page.evaluate(() => neo.scene.game.reveal.picture);
    await tap('neo.scene.after.keep');
    await page.waitForFunction(() => !!kit.store.creations.picture.current);
    assert.deepEqual(await page.evaluate(() => kit.store.creations.picture.current), expected);
    assert.equal(new Set(expected.marks.map((mark) => mark.color)).size, 2);
    await page.evaluate(() => neo.go.room());
    await scene('RoomScene');
    await page.waitForFunction(() => neo.scene.takePicture?.visible);
    assert.deepEqual(errors, [], 'page errors');
    log(
      'Swing Pals 9: push, requested help, rope change, rotation, picture reveal, comparison, one sticker and optional Keep',
    );
  }

  /**
   * Swing Pals 10 upright (SWING_LEVELS=10): a requested hint lights the answer once; a tap on the pointed friend only
   * repeats the question; a guess that does not meet first is watched and named, never a miss; the rest are guessed
   * right; one sticker, no misses, one hint.
   */
  async function rowOfThree() {
    await page.setViewportSize({ width: 390, height: 844 });
    await launch('swing-pals', 10);
    const idle = () =>
      page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, {
        timeout: 30000,
      });
    await idle();
    await page.waitForTimeout(400);
    const n = await page.evaluate(() => kit.store.data.stickers.length);
    assert.equal(await page.evaluate(() => neo.scene.game.view.upright), true, 'played upright');
    const tapFriend = async (i) => {
      const p = await page.evaluate((i) => {
        const g = neo.scene.game;
        const q = g.ctx.stage.toGlobal(g.friendNodes[i].position);
        const c = document.querySelector('canvas').getBoundingClientRect();
        return { x: q.x + c.left, y: q.y + c.top };
      }, i);
      await page.evaluate(({ x, y }) => kit.tap(x, y), p);
      await page.waitForTimeout(200);
    };
    const line = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        const r = g.row;
        const p = r.hooks[r.pointed];
        const answer = r.hooks.indexOf(p === 'short' ? 'long' : 'short');
        return { pointed: r.pointed, answer, other: [0, 1, 2].find((k) => k !== r.pointed && k !== answer) };
      });
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.hints, neo.scene.game.hintLit]),
      [1, true],
      'a requested hint lights the answer once',
    );
    let l = await line();
    await tapFriend(l.pointed);
    assert.equal(await page.evaluate(() => neo.scene.game.guess), null, 'the pointed friend is not a guess');
    await tapFriend(l.other);
    assert.equal(await page.evaluate(() => neo.scene.game.guess), l.other, 'the tap is her guess');
    await page.waitForFunction(() => neo.scene.game.released, null, { timeout: 5000 });
    await page.waitForTimeout(2300);
    await screenshot('swing-pals-10-portrait');
    await page.waitForFunction(() => neo.scene.finished || neo.scene.game.line === 1, null, {
      timeout: 30000,
    });
    for (let guard = 0; guard < 6; guard++) {
      if (await page.evaluate(() => neo.scene.finished || neo.scene.game.finished)) break;
      await idle();
      await page.waitForTimeout(200);
      l = await line();
      await tapFriend(l.answer);
      const at = await page.evaluate(() => neo.scene.game.line);
      await page.waitForFunction((at) => neo.scene.finished || neo.scene.game.line !== at, at, {
        timeout: 30000,
      });
    }
    await page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });
    const record = await page.evaluate(() => kit.store.stats('swing-pals').history.at(-1));
    assert.deepEqual(
      [record.misses, record.hints],
      [0, 1],
      'level 10: a guess that did not meet first is no miss; one hint',
    );
    assert.deepEqual(errors, [], 'page errors');
    log(
      'Swing Pals 10 upright: hint lit once, pointed tap repeats the question, a guess that missed is named, one sticker',
    );
  }

  /** Swing Pals by touch: level 1 pushed to every bell by taps; level 6 with one wrong hook (one miss) and a requested glow (one hint); level 3 upright; level 7 upright with a wrong guess (never a miss) and a lit rope (one hint), filing the journal's longer-rope entry; level 8 with one wrong hook. */
  async function swingPalsPlay() {
    if (process.env.SWING_LEVELS === '9') return paintTheBeat();
    if (process.env.SWING_LEVELS === '10') return rowOfThree();
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return { busy: g.busy, misses: g.misses, hints: g.hints, line: g.line, glow: g.glowHook };
      });
    const idle = () =>
      page.waitForFunction(() => neo.scene.finished || (neo.scene.game && !neo.scene.game.busy), null, {
        timeout: 20000,
      });
    const tapAt = async (x, y) => {
      const p = await page.evaluate(({ x, y }) => neo.scene.game.ctx.stage.toGlobal({ x, y }), { x, y });
      await page.evaluate(({ x, y }) => kit.tap(x, y), p);
    };
    const tapHook = async (hook) => {
      const p = await page.evaluate((hook) => {
        const g = neo.scene.game;
        return g.layout.columns[1].pivot[hook];
      }, hook);
      await idle();
      await page.waitForTimeout(120);
      await tapAt(p.x, p.y);
      await page.waitForTimeout(250);
      await idle();
    };
    // U7 R4: a right answer's line never holds the next pair. The given lines are stretched to at least 4 s, so the
    // next pair or race opening sooner shows the line no longer gates it; level 8's request waits for the line.
    const stretch = (ids) =>
      page.evaluate((ids) => {
        const g = neo.scene.game;
        const say = g.ctx.say.bind(g.ctx);
        g.heardLines = [];
        g.ctx.say = (id, vars) => {
          const line = say(id, vars);
          if (!ids.includes(id)) return line;
          const rec = { at: performance.now(), line: g.line };
          g.heardLines.push(rec);
          const watch = () => {
            if (rec.opens !== undefined) return;
            if (!g.busy && g.line !== rec.line) {
              rec.opens = performance.now() - rec.at;
              rec.waiting = g.unasked;
            } else if (performance.now() - rec.at < 10000) requestAnimationFrame(watch);
          };
          void Promise.resolve().then(watch);
          return Promise.all([line, kit.sleep(4000)]).then(() => undefined);
        };
      }, ids);
    /** Every stretched line but the round's last (heard out before the finale) let the next pair in within 2.5 s. */
    const heard = async (label, wantWaiting = false) => {
      const recs = await page.evaluate(() => neo.scene.game.heardLines.slice(0, -1));
      if (
        !recs.length ||
        recs.some((r) => r.opens === undefined || r.opens > 2500 || (wantWaiting && !r.waiting))
      )
        throw new Error(`R4: ${label}'s right line held the next pair: ${JSON.stringify(recs)}`);
      log(
        `Swing Pals ${label} R4: the next pair opened ${recs.map((r) => Math.round(r.opens)).join(', ')} ms in`,
      );
    };
    /** The round is over once its last line is done, while that line is heard out before the finale. */
    const roundOver = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return neo.scene.finished || !g || g.finished || g.line >= g.round.lines.length;
      });
    const filed = () =>
      page.evaluate(() => kit.store.data.journal.found.includes('swing-pals:longer-slower'));
    const sticker = (n) =>
      page.waitForFunction((n) => kit.store.data.stickers.length === n + 1, n, { timeout: 30000 });

    // Level 1: every tap pushes at once; four taps a friend ring the bell. No misses or hints.
    await launch('swing-pals', 1);
    await idle();
    let n = await page.evaluate(() => kit.store.data.stickers.length);
    for (let guard = 0; guard < 60 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
      const z = await page.evaluate(() => {
        const g = neo.scene.game;
        return g && !g.busy ? g.layout.columns[0].zone : null;
      });
      if (z) await tapAt(z.x + z.w / 2, z.y + z.h * 0.55);
      await page.waitForTimeout(600);
    }
    await sticker(n);
    let st = await state();
    assert.deepEqual([st.misses, st.hints], [0, 0], 'level 1 has no misses or hints');
    assert.equal(await filed(), false, 'one rope on level 1 files no journal entry');

    // Level 6: a hook that is neither the start nor the right one parts (one miss); a requested hint glows (one hint).
    await launch('swing-pals', 6);
    await idle();
    n = await page.evaluate(() => kit.store.data.stickers.length);
    const first = await page.evaluate(() => {
      const g = neo.scene.game,
        l = g.pairLine;
      return { right: l.petHook, start: l.hook };
    });
    const wrong = ['short', 'middle', 'long'].find((h) => h !== first.right && h !== first.start);
    await tapHook(wrong);
    st = await state();
    assert.deepEqual([st.misses, st.hints, st.line], [1, 0, 0], 'a wrong hook parts and counts one miss');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(150);
    st = await state();
    assert.deepEqual([st.hints, st.glow], [1, first.right], 'a requested hint glows the right hook once');
    await page.evaluate(() => neo.scene.game.askForHint());
    assert.equal((await state()).hints, 1, 'asking again under the glow counts nothing');
    await stretch(['swing-pals.big-same', 'swing-pals.together']);
    for (let guard = 0; guard < 6 && !(await roundOver()); guard++) {
      const right = await page.evaluate(() => neo.scene.game.pairLine.petHook);
      await tapHook(right);
    }
    await sticker(n);
    st = await state();
    assert.deepEqual([st.misses, st.hints], [1, 1]);
    await heard('level 6');

    // Level 3 upright: two swings, short and long, one screenshot.
    await page.setViewportSize({ width: 768, height: 1024 });
    await launch('swing-pals', 3);
    await idle();
    await page.waitForTimeout(400);
    for (const i of [0, 1]) {
      const z = await page.evaluate((i) => neo.scene.game.layout.columns[i].zone, i);
      await tapAt(z.x + z.w / 2, z.y + z.h * 0.55);
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(500);
    await screenshot('swing-pals-3-portrait');
    // Level 7 upright: a requested hint lights the shorter rope (one hint, once); a wrong guess is named, never a miss.
    await launch('swing-pals', 7);
    await idle();
    await page.waitForTimeout(400);
    n = await page.evaluate(() => kit.store.data.stickers.length);
    await stretch(['swing-pals.first-yes', 'swing-pals.first-named']);
    const ROPES = ['short', 'middle', 'long'];
    const quickSide = () =>
      page.evaluate((ROPES) => {
        const h = neo.scene.game.race.hooks;
        return ROPES.indexOf(h[0]) < ROPES.indexOf(h[1]) ? 0 : 1;
      }, ROPES);
    const tapFriend = async (i) => {
      await idle();
      await page.waitForTimeout(150);
      const p = await page.evaluate((i) => {
        const q = neo.scene.game.friendNodes[i].position;
        return { x: q.x, y: q.y };
      }, i);
      await tapAt(p.x, p.y);
      await page.waitForTimeout(250);
    };
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.evaluate(() => neo.scene.game.askForHint());
    st = await page.evaluate(() => ({ hints: neo.scene.game.hints, lit: neo.scene.game.hintLit }));
    assert.deepEqual(st, { hints: 1, lit: true }, 'a requested hint lights the shorter rope once');
    const q = await quickSide();
    await tapFriend(q === 0 ? 1 : 0);
    assert.equal(await page.evaluate(() => neo.scene.game.guess), q === 0 ? 1 : 0, 'the tap is her guess');
    await page.waitForTimeout(1200);
    await screenshot('swing-pals-7-portrait');
    await page.waitForFunction(() => neo.scene.finished || neo.scene.game.line === 1, null, {
      timeout: 30000,
    });
    for (let guard = 0; guard < 6 && !(await roundOver()); guard++) {
      await tapFriend(await quickSide());
      await page.waitForFunction(
        (line) => neo.scene.finished || neo.scene.game.line !== line,
        await page.evaluate(() => neo.scene.game.line),
        { timeout: 30000 },
      );
    }
    await sticker(n);
    st = await state();
    assert.deepEqual([st.misses, st.hints], [0, 1], 'level 7: a wrong guess is no miss; one hint');
    assert.equal(await filed(), true, 'level 7 files "a longer rope swings slower" in the journal');
    await heard('level 7');
    await page.setViewportSize({ width: 1024, height: 768 });

    // Level 8: a hook that misses the asked-for beat (not the start) is one miss; then the right hook for each request.
    await launch('swing-pals', 8);
    await idle();
    n = await page.evaluate(() => kit.store.data.stickers.length);
    const right8 = () =>
      page.evaluate(() => {
        const l = neo.scene.game.pairLine;
        return l.request === 'twice' ? 'short' : l.request === 'half' ? 'long' : l.petHook;
      });
    await stretch(['swing-pals.twice-yes', 'swing-pals.half-yes', 'swing-pals.together']);
    const r0 = await right8();
    const start8 = await page.evaluate(() => neo.scene.game.pairLine.hook);
    await tapHook(['short', 'middle', 'long'].find((h) => h !== r0 && h !== start8));
    st = await state();
    assert.deepEqual([st.misses, st.hints, st.line], [1, 0, 0], 'level 8: a wrong hook counts one miss');
    for (let guard = 0; guard < 6 && !(await roundOver()); guard++) await tapHook(await right8());
    await sticker(n);
    st = await state();
    assert.deepEqual([st.misses, st.hints], [1, 0]);
    await heard('level 8', true);
    assert.deepEqual(errors, [], 'page errors');
    log(
      'Swing Pals: level 1 by taps, level 6 with a wrong hook and a requested hint, level 3 upright, level 7 upright with a wrong guess and a hint, level 8 with a wrong hook',
    );
  }

  return { swingPalsPlay };
}
