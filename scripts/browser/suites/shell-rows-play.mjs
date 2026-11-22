import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  const state = () => page.evaluate(() => neo.scene.game.state);
  const until = async (fn, arg) => page.waitForFunction(fn, arg, { timeout: 40000 });
  // Her turn, with the last frame drawn so hit-testing sees the squares.
  const turn = async () => {
    await until(() => neo.scene.finished || neo.scene.game.state.phase === 'turn');
    await page.waitForTimeout(250);
  };
  const tap = async (i) => {
    await page.evaluate((i) => kit.tapOn(neo.scene.game.squares[i]), i);
    await page.waitForTimeout(150);
  };
  const score = () =>
    page.evaluate(() => {
      const r = kit.store.stats('shell-rows').history.at(-1);
      return [r.misses, r.hints];
    });
  /** The game's own rules, asked in the page. */
  const rules = (fn, arg) =>
    page.evaluate(
      async ({ src, arg }) => {
        const m = await import('/src/games/shell-rows/logic.ts');
        return new Function('m', 'arg', `return (${src})(m, arg);`)(m, arg);
      },
      { src: fn.toString(), arg },
    );

  async function shellRowsPlay() {
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    // SHELL_LEVELS=4,5 plays only the listed parts (1 and 3 are one part each; 4 and 5 below).
    const only = process.env.SHELL_LEVELS?.split(',').map(Number);
    const wants = (l) => !only || only.includes(l);

    if (wants(1) || wants(3)) await levelsOneAndThree();
    if (wants(4)) await levelFour();
    if (wants(5)) await levelFive();
  }

  async function levelsOneAndThree() {
    const emptyWrong = (s, not = []) =>
      s.board.findIndex((v, i) => v === null && i !== s.right && !not.includes(i));
    const full = (s) => s.board.findIndex((v) => v !== null);

    // Level 1 (pre-K): a full square counts nothing; one wrong square (the pet takes the gap, the board rewinds), a second
    // (the glow, one hint), then the right square moves on to the next position; the other two straight.
    await launch('shell-rows', 1, 'Mia', 'prek');
    await turn();
    let s = await state();
    assert.equal(s.index, 0);
    const before = s.board.slice();
    await tap(full(s));
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.phase], [0, 0, 'turn'], 'a full square counts nothing');
    await tap(emptyWrong(s));
    s = await state();
    assert.equal(s.phase, 'replay', "a wrong square plays the pet's reply");
    assert.deepEqual([s.misses, s.hints], [1, 0]);
    await until(
      () => neo.scene.game.state.reply && neo.scene.game.state.board.filter((v) => v === 'pebble').length > 2,
    );
    s = await state();
    assert.equal(s.reply.pebble, s.right, 'at level 1 the pet takes her gap');
    await turn();
    s = await state();
    assert.deepEqual(s.board, before, 'the board rewinds to her turn');
    await tap(emptyWrong(s));
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.glowing],
      [2, 1, true],
      'a second wrong square lights the glow: one hint',
    );
    await turn();
    await screenshot('shell-rows-1-glow');
    s = await state();
    await tap(s.right);
    await until(() => neo.scene.finished || neo.scene.game.state.index === 1);
    s = await state();
    assert.deepEqual(
      [s.index, s.misses, s.hints, s.glowing],
      [1, 2, 1, false],
      'the right square moves on; the glow does not carry',
    );
    for (let k = 1; k < 3; k++) {
      await turn();
      s = await state();
      await tap(s.right);
      await until((k) => neo.scene.finished || neo.scene.game.state.index > k, k);
    }
    await finished('shell-rows');
    assert.deepEqual(await score(), [2, 1], 'level 1 saved 2 misses, 1 hint');

    // Level 3 (school), portrait: the block is a miss and the pet takes her three; then the right square, to the sticker.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('shell-rows', 3, 'Mia', 'school');
    await turn();
    s = await state();
    const block = s.board.findIndex(
      (v, i) =>
        v === null &&
        i !== s.right &&
        (() => {
          const L = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
          ];
          return L.some(
            (l) =>
              l.includes(i) &&
              l.filter((j) => s.board[j] === 'pebble').length === 2 &&
              l.every((j) => j === i || s.board[j] === 'pebble'),
          );
        })(),
    );
    assert.ok(block >= 0, 'level 3 has a block square');
    await tap(block);
    await until(
      () =>
        neo.scene.game.state.reply &&
        neo.scene.game.state.board.filter((v) => v === 'pebble').length >
          neo.scene.game.state.board.filter((v) => v === 'shell').length - 1,
    );
    await page.waitForTimeout(300);
    s = await state();
    assert.equal(s.reply.pebble, s.right, 'the block: the pet takes the three she could have had');
    await screenshot('shell-rows-3-portrait-replay');
    await turn();
    for (let k = 0; k < 3; k++) {
      await turn();
      s = await state();
      await tap(s.right);
      await until((k) => neo.scene.finished || neo.scene.game.state.index > k, k);
    }
    await finished('shell-rows');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');
    log(
      'Shell Rows 1 and 3: level 1 a full square free, two wrong squares with the reply and rewind, the glow (2/1); portrait level 3 the block answered by the pet taking her three (1/0); passed',
    );
  }
  // Level 4 (school), upright phone: a square making one row (the pet stops it), a second wrong square (the glow, one
  // hint), then a fork square: the pet stops one row and her third shell slides into the other; two more forks finish.
  async function levelFour() {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    await launch('shell-rows', 4, 'Mia', 'school');
    await turn();
    let s = await state();
    const before = s.board.slice();
    const { oneRow, quiet, forks } = await rules((m, b) => {
      const forks = m.forkSquares(b);
      const wrong = m.empties(b).filter((i) => !forks.includes(i));
      const rows = wrong.filter((i) => m.winsFor(m.place(b, i, 'shell'), 'shell').length === 1);
      return { oneRow: rows[0], quiet: wrong.find((i) => i !== rows[0]), forks };
    }, s.board);
    assert.deepEqual(forks, [s.right], 'the authored opening has one fork square, the glow');
    await tap(oneRow);
    s = await state();
    assert.deepEqual(
      [s.phase, s.misses, s.hints],
      ['replay', 1, 0],
      'a one-row square is a miss and a replay',
    );
    await until(() => neo.scene.game.state.reply && neo.scene.game.state.board.filter((v) => v).length === 6);
    s = await state();
    assert.equal(
      await rules((m, a) => m.winsFor(m.place(a.b, a.w, 'shell'), 'shell')[0], { b: before, w: oneRow }),
      s.reply.pebble,
      'the pet stops her one row',
    );
    await turn();
    s = await state();
    assert.deepEqual(s.board, before, 'the board rewinds to her turn');
    await tap(quiet);
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.glowing],
      [2, 1, true],
      'a second wrong square: the glow, one hint',
    );
    await turn();
    await tap(s.right);
    // Mid follow-through: her fork shell, the pet's block and her third shell sliding in.
    await until(() => neo.scene.game.state.board.filter((v) => v).length >= 6);
    await page.waitForTimeout(700);
    await screenshot('shell-rows-4-fork-phone');
    await until(() => neo.scene.finished || neo.scene.game.state.index === 1);
    s = await state();
    assert.deepEqual([s.index, s.misses, s.hints, s.glowing], [1, 2, 1, false], 'a fork square moves on');
    for (let k = 1; k < 3; k++) {
      await turn();
      s = await state();
      // Any fork square is right: take the last one in the list, not necessarily the glow's.
      const fs = await rules((m, b) => m.forkSquares(b), s.board);
      await tap(fs.at(-1));
      await until((k) => neo.scene.finished || neo.scene.game.state.index > k, k);
    }
    await finished('shell-rows');
    assert.deepEqual(await score(), [2, 1], 'level 4 saved 2 misses, 1 hint');
    log(
      'Shell Rows 4 (upright phone): one row stopped, the glow, a fork followed through, any fork accepted (2/1); passed',
    );
  }

  // Level 5 (school), upright phone: a match lost on purpose (the pet's three is one miss and rewinds to her turning
  // point), then played out to a tie (or, if this seed allows none, a win) for the sticker.
  async function levelFive() {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    await launch('shell-rows', 5, 'Mia', 'school');
    await turn();
    const seed = await page.evaluate(() => neo.scene.game.round.seed);
    /** Her moves from `moves` to a match ending in one of `want`, the pet answering with its own rule. */
    const line = (moves, want) =>
      rules(
        (m, { moves, seed, want }) => {
          const go = (ms) => {
            const b = m.boardAfter(ms);
            for (const i of m.empties(b)) {
              const a = [...ms, i];
              const ab = m.boardAfter(a);
              if (m.wonLine(ab, 'shell')) {
                if (want.includes('win')) return [i];
                continue;
              }
              if (!m.empties(ab).length) {
                if (want.includes('tie')) return [i];
                continue;
              }
              const p = m.petMove(ab, seed);
              if (m.wonLine(m.boardAfter([...a, p]), 'pebble')) {
                if (want.includes('loss')) return [i];
                continue;
              }
              const rest = go([...a, p]);
              if (rest) return [i, ...rest];
            }
            return null;
          };
          return go(moves);
        },
        { moves, seed, want },
      );
    const play = async (mine) => {
      for (const i of mine) {
        await turn();
        await tap(i);
        await until(() => neo.scene.game.state.phase !== 'turn' || neo.scene.finished);
      }
    };
    const losing = await line([], ['loss']);
    assert.ok(losing, 'some line loses to this pet');
    await play(losing);
    await until(() => neo.scene.game.state.misses === 1);
    await page.waitForTimeout(500);
    await screenshot('shell-rows-5-pet-three-phone');
    await until(() => neo.scene.game.state.phase === 'turn');
    let s = await state();
    assert.ok(s.moves.length < losing.length * 2, 'the board went back');
    assert.equal(s.moves.length % 2, 0, 'back on her turn');
    assert.deepEqual([s.misses, s.hints], [1, 0], "the pet's three is one miss");
    const end = (await line(s.moves, ['tie'])) ?? (await line(s.moves, ['win']));
    assert.ok(end, 'the game can still end well');
    await play(end);
    await finished('shell-rows');
    s = await state();
    assert.deepEqual(await score(), [1, 0], 'level 5 saved 1 miss, 0 hints');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    log(
      `Shell Rows 5 (upright phone): a lost match rewound to its turning point (1 miss), then a ${s.ending}; passed`,
    );
  }

  return { shellRowsPlay };
}
