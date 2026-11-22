import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  /** Vine Snip by touch: levels 1, 3, 4 and 5, then level 6 (Where will it land?). `VINE_LEVELS=6` runs only level 6. */
  async function vineSnipPlay() {
    const only = process.env.VINE_LEVELS?.split(',').map(Number);
    if (!only || only.some((l) => l < 6)) await earlier();
    if (!only || only.includes(6)) await where();
  }

  async function earlier() {
    const state = () => page.evaluate(() => neo.scene.game.state);
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('vine-snip').history.at(-1);
        return [r.misses, r.hints];
      });
    const tapStage = (p) =>
      page.evaluate((p) => {
        const q = neo.scene.game.layer.parent.toGlobal(p);
        kit.tap(q.x, q.y);
      }, p);
    const ready = (i, phase) =>
      page.waitForFunction(
        ([i, phase]) => {
          const g = neo.scene.game;
          return g.index === i && g.phase === phase && !g.busy;
        },
        [i, phase],
        { timeout: 15000 },
      );
    const fed = (i) =>
      page.waitForFunction((i) => neo.scene.game.index > i || neo.scene.game.finished, i, { timeout: 15000 });
    // Tap the swinging vine near its anchor when the swing is `target` seconds into its beat.
    const tapAt = (target) =>
      page.evaluate(
        (target) =>
          new Promise((done) => {
            const g = neo.scene.game;
            const step = () => {
              const s = g.state;
              if (s.phase === 'swing' && !g.busy) {
                const d = Math.abs(((((s.offset - target) % s.beat) + s.beat * 1.5) % s.beat) - s.beat / 2);
                if (d < 0.025) {
                  const q = g.layer.parent.toGlobal(s.vineAt);
                  kit.tap(q.x, q.y);
                  return done(s.offset);
                }
              }
              requestAnimationFrame(step);
            };
            step();
          }),
        target,
      );
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 1: a tap anywhere on the board snips the one vine, and each friend munches.
    await launch('vine-snip', 1, 'Mia', 'preschool');
    for (let i = 0; i < 3; i++) {
      await ready(i, 'rest');
      const s = await state();
      assert.equal(s.fruit.x > 0 && s.alive.length, 1, 'one vine at level 1');
      if (i === 0) {
        await page.evaluate(() => neo.scene.game.askForHint());
        const h = await state();
        assert.deepEqual(
          [h.hints, h.glow],
          [0, true],
          'Show a hint at level 1 glows the vine and counts nothing',
        );
      }
      await tapStage({ x: s.fruit.x + 160, y: s.fruit.y + 60 });
      await fed(i);
    }
    await finished('vine-snip');
    assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

    // Level 3 in portrait: a snip at the far turnaround misses (early), a requested hint glows the arc, then timed snips feed all three.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('vine-snip', 3, 'Mia', 'school');
    await ready(0, 'swing');
    let s = await state();
    assert.equal(s.friend.kind, 'duck', 'the authored first line');
    assert.ok(
      s.windows.some(([a, b]) => b - a >= 0.4),
      'a window of at least 0.4 s',
    );
    await tapAt(0);
    await page.waitForFunction(() => neo.scene.game.phase === 'miss', null, { timeout: 8000 });
    await ready(0, 'swing');
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.alive],
      [1, 0, [true]],
      'a missed drop counts once and the vine grows back',
    );
    await page.evaluate(() => neo.scene.game.askForHint());
    s = await state();
    assert.deepEqual([s.hints, s.glow], [1, true], 'a requested hint glows the arc and counts');
    await page.waitForTimeout(500);
    await screenshot('vine-snip-3-portrait-hint');
    for (let i = 0; i < 3; i++) {
      await ready(i, 'swing');
      s = await state();
      await tapAt(s.at);
      await fed(i);
    }
    await finished('vine-snip');
    assert.deepEqual(await score(), [1, 1], 'level 3 saved 1 miss, 1 hint');

    // Level 4 in portrait: the authored lemon on three vines with Pig on the right; a requested hint glows the vine to keep.
    await launch('vine-snip', 4, 'Mia', 'school');
    await ready(0, 'rest');
    s = await state();
    assert.deepEqual(
      [s.friend.kind, s.hangs[0].vines.length, s.hangs[0].keep],
      ['pig', 3, 2],
      'the authored three-vine line, keep the right vine',
    );
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(500);
    await screenshot('vine-snip-4-portrait-keep');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);

    // Level 5: keeping the wrong vine misses with the wrong-side line, Grow back is free, then both friends are fed.
    await launch('vine-snip', 5, 'Mia', 'school');
    await ready(0, 'rest');
    s = await state();
    assert.deepEqual(
      [s.hangs.length, s.hangs[0].friend.kind, s.hangs[1].friend.kind, s.hangs[0].keep, s.hangs[1].keep],
      [2, 'dog', 'cat', 0, 1],
      'two apples, Dog keeps left, Cat keeps right',
    );
    await tapStage(s.hangs[0].vines[0]);
    await page.waitForFunction(() => neo.scene.game.phase === 'swing', null, { timeout: 4000 });
    await page.waitForTimeout(300);
    s = await state();
    await tapStage(s.hangs[0].vines[1]);
    await page.waitForFunction(() => neo.scene.game.phase === 'miss', null, { timeout: 8000 });
    await ready(0, 'rest');
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.hangs[0].alive],
      [1, 0, [true, true]],
      'a wrong-side keep misses once and its vines grow back',
    );
    await tapStage(s.hangs[1].vines[1]);
    await page.waitForFunction(() => neo.scene.game.phase === 'swing', null, { timeout: 4000 });
    await page.evaluate(() => {
      const p = neo.scene.game.growBtn.getGlobalPosition();
      kit.tap(p.x, p.y);
    });
    await page.waitForFunction(() => neo.scene.game.phase === 'rest', null, { timeout: 4000 });
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.hangs[1].alive],
      [1, 0, [true, true]],
      'Grow back regrows the vines and costs nothing',
    );
    for (const k of [0, 1]) {
      await page.waitForFunction(() => !neo.scene.game.busy && neo.scene.game.phase === 'rest', null, {
        timeout: 15000,
      });
      s = await state();
      await tapStage(s.hangs[k].vines[1 - s.hangs[k].keep]);
      await page.waitForFunction(() => neo.scene.game.phase === 'swing' && !neo.scene.game.busy, null, {
        timeout: 4000,
      });
      s = await state();
      await tapAt(s.at);
      await page.waitForFunction(
        (k) => neo.scene.game.state.hangs[k].phase === 'fed' || neo.scene.game.index > 0,
        k,
        { timeout: 15000 },
      );
    }
    // The second line: both fruits fed by the solved plan. U7d batch 26 (R4): `vine-snip.munch` is stretched to 4 s, and
    // the first fed fruit's line no longer holds the other fruit; the line's last munch is still heard out.
    await page.evaluate(() => {
      const g = neo.scene.game;
      const say = g.ctx.say.bind(g.ctx);
      window.__starts = {};
      window.__munch = [];
      g.ctx.say = (id, vars) => {
        const line = say(id, vars);
        window.__starts[id] = performance.now();
        if (id !== 'vine-snip.munch') return line;
        window.__munch.push(performance.now());
        return Promise.all([line, kit.sleep(4000)]).then(() => undefined);
      };
    });
    let open = null;
    for (const k of [0, 1]) {
      await page.waitForFunction(
        () => neo.scene.game.index === 1 && !neo.scene.game.busy && neo.scene.game.phase === 'rest',
        null,
        { timeout: 15000 },
      );
      s = await state();
      await tapStage(s.hangs[k].vines[1 - s.hangs[k].keep]);
      await page.waitForFunction(() => neo.scene.game.phase === 'swing' && !neo.scene.game.busy, null, {
        timeout: 4000,
      });
      s = await state();
      await tapAt(s.at);
      await page.waitForFunction(
        (k) => neo.scene.game.state.hangs[k].phase === 'fed' || neo.scene.game.finished,
        k,
        { timeout: 15000 },
      );
      if (k === 0) {
        await page.waitForFunction(() => !neo.scene.game.busy && neo.scene.game.phase === 'rest', null, {
          timeout: 2500,
        });
        open = await page.evaluate(() => performance.now() - window.__munch[0]);
      }
    }
    await finished('vine-snip');
    const heard = await page.evaluate(() => window.__starts['vine-snip.done'] - window.__munch.at(-1));
    assert.ok(open < 1500, `R4: the first fed fruit's munch held the other fruit (${Math.round(open)} ms)`);
    assert.ok(heard >= 3900, `R4: the line's last munch was cut (${Math.round(heard)} ms)`);
    assert.deepEqual(await score(), [1, 0], 'level 5 saved 1 miss, 0 hints');
    log(
      `Vine Snip 1, 3, 4 and 5: level 1 a requested hint glowed the vine and counted nothing, three taps anywhere fed every friend 0/0; level 3 portrait, a snip at the far turnaround missed, a requested hint glowed the arc, then three timed snips fed every friend 1/1; level 4 portrait three vines with the keep glow; level 5 a wrong-side keep missed, Grow back was free, both lines fed 1/0; R4 the other fruit open ${Math.round(open)} ms into a 4 s munch, the last munch heard out; passed`,
    );
  }

  /**
   * Level 6 on a sideways phone with the words shown: guess the left leaf on the rightward pass and the right leaf on the
   * leftward pass, Snip before a guess, one Show a hint, one Replay, then Finish for one sticker with 0 misses and 1 hint.
   */
  async function where() {
    const state = () => page.evaluate(() => neo.scene.game.state);
    const tap = (p) => page.evaluate((p) => kit.tap(p.x, p.y), p);
    const stage = (want) =>
      page.waitForFunction(
        (want) => {
          const s = neo.scene.game.state;
          return s.stage === want && !s.waiting;
        },
        want,
        { timeout: 15000 },
      );
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
      kit.store.data.settings.showWords = true;
    });
    const before = await page.evaluate(() => kit.store.stats('vine-snip').history.length);
    await launch('vine-snip', 6, 'Mia', 'school');
    await stage('hold');
    let s = await state();
    assert.deepEqual(
      [s.level, s.pass, s.dir, s.where.kind, s.where.friends],
      [6, 0, 1, 'orange', ['bunny', 'duck']],
      'the authored first round: an orange heading right',
    );
    // Snip before a guess: a soft "Pick a leaf first", nothing counted, still holding.
    await tap(s.snip);
    await page.waitForTimeout(300);
    s = await state();
    assert.deepEqual([s.stage, s.hints, s.misses], ['hold', 0, 0], 'Snip before a guess counts nothing');
    // Show a hint replays the approach after its words, once counted.
    await page.evaluate(() => neo.scene.game.askForHint());
    s = await state();
    assert.deepEqual(
      [s.stage, s.hints],
      ['approach', 1],
      'a hint during the hold counts once and replays the approach',
    );
    await stage('hold');
    await page.waitForTimeout(700);
    await screenshot('vine-snip-6-phone-hold');
    // Opposite guess: the left leaf, though it heads right.
    s = await state();
    await tap(s.leaves[0]);
    await page.waitForTimeout(300);
    await tap(s.leaves[1]);
    await page.waitForTimeout(300);
    await tap(s.leaves[0]);
    s = await state();
    assert.deepEqual(s.guesses, [-1, null], 'the paw print moves and stays on the last leaf');
    await tap(s.snip);
    await stage('approach');
    s = await state();
    assert.deepEqual(
      [s.pass, s.dir, s.misses],
      [1, -1, 0],
      'it landed right, no miss; the second pass heads left',
    );
    await stage('hold');
    s = await state();
    await tap(s.leaves[1]);
    await page.waitForTimeout(300);
    await tap(s.snip);
    await page.waitForFunction(
      () => neo.scene.game.state.stage === 'compare' && neo.scene.game.state.buttons,
      null,
      {
        timeout: 20000,
      },
    );
    s = await state();
    assert.deepEqual(
      [s.guesses, s.hints, s.misses],
      [[-1, 1], 1, 0],
      'both guesses kept, one hint, no misses',
    );
    await screenshot('vine-snip-6-phone-compare');
    await tap(s.replay);
    await page.waitForFunction(() => neo.scene.game.state.stage === 'replay', null, { timeout: 3000 });
    await page.waitForFunction(
      () => neo.scene.game.state.stage === 'compare' && neo.scene.game.state.buttons,
      null,
      {
        timeout: 10000,
      },
    );
    s = await state();
    await tap(s.finish);
    await finished('vine-snip');
    const after = await page.evaluate(() => {
      const h = kit.store.stats('vine-snip').history;
      return { n: h.length, last: h.at(-1) };
    });
    assert.equal(after.n, before + 1, 'one round saved');
    assert.deepEqual(
      [after.last.level, after.last.misses, after.last.hints],
      [6, 0, 1],
      'level 6 saved 0 misses, 1 hint',
    );
    await page.evaluate(() => {
      kit.store.data.settings.showWords = false;
    });
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Vine Snip 6 on an 844×390 phone with words: Snip before a guess counted nothing, a hint replayed the approach and counted once, opposite guesses on both passes, Replay, Finish saved 0 misses and 1 hint; passed',
    );
  }
  return { vineSnipPlay };
}
