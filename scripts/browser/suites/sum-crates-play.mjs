import assert from 'node:assert/strict';

export function createSuite({ page, finished, screenshot, launch }) {
  /** Sum Crates by touch: level 1 with a full wrong stack (one miss), the same stack again (free), a changed wrong stack (second miss, one glow hint), a requested hint, then the finish; level 3 with a hint and the answer. `SUMCRATES_ONLY=upright` runs the 390×844 phone check (touch context, crates sized, a screenshot of each level). */
  async function sumCratesPlay() {
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });
    const wait = (ms = 150) => page.waitForTimeout(ms);
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          misses: g.misses,
          hints: g.hints,
          fill: g.fill.slice(),
          solution: g.board.solution.slice(),
          finished: g.finished,
          selected: g.selected,
        };
      });
    /** Tap a crate, then a tray fruit: the fruit goes in. */
    const put = async (at, v) => {
      await page.evaluate((at) => kit.tapOn(neo.scene.game.crates[at]), at);
      await wait();
      await page.evaluate((v) => kit.tapOn(neo.scene.game.tray[v - 1]), v);
      await wait();
    };
    const crateList = (s) => s.solution.map((v, at) => (v > 0 ? at : -1)).filter((at) => at >= 0);

    /** The level on an upright 390 × 844 phone: upright view, crates of 100 units or more (level 3: 64), one screenshot. */
    const upright = async (level) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await launch('sum-crates', level);
      await wait(400);
      const [up, cell] = await page.evaluate(() => [neo.view.upright, neo.scene.game.cell]);
      assert.equal(up, true);
      assert.ok(cell >= (level === 3 ? 64 : 100), `crates are ${cell} units`);
      await screenshot(`sum-crates-portrait-${level}`);
      await page.setViewportSize({ width: 1024, height: 768 });
    };

    if (process.env.SUMCRATES_ONLY === 'upright') {
      await upright(1);
      await upright(3);
      return;
    }

    // Level 1: two lines cross.
    await launch('sum-crates', 1);
    await wait(400);
    let s = await state();
    const crates = crateList(s);
    assert.ok(crates.length >= 4 && crates.length <= 5, `level 1 has ${crates.length} crates`);
    const wrong = new Map(crates.map((at) => [at, (s.solution[at] % 5) + 1]));
    for (const [at, v] of wrong) await put(at, v);
    s = await state();
    assert.equal(s.fill.filter((v) => v > 0).length, crates.length);
    assert.equal(s.misses, 1, 'a full wrong stack is one miss');
    // Lift one fruit and put the same one back: the identical stack judged again is free.
    const first = crates[0];
    await put(first, wrong.get(first));
    assert.equal((await state()).misses, 1, 'the same full stack judged again is free');
    // Change one crate to another wrong fruit: judged again (second miss, the glow hint comes by itself).
    const other = (wrong.get(first) % 5) + 1;
    const keep = s.solution[first];
    const alt = other === keep ? (other % 5) + 1 : other;
    await put(first, alt);
    s = await state();
    assert.equal(s.misses, 2, 'a changed full wrong stack is judged again');
    assert.equal(s.hints, 1, 'two misses bring one glow hint');
    await page.evaluate(() => kit.tapOn(neo.scene.game.hintButton));
    await wait(200);
    assert.equal((await state()).hints, 2, 'a requested hint is counted once');
    for (const at of crates) {
      s = await state();
      if (s.fill[at] !== s.solution[at]) await put(at, s.solution[at]);
    }
    await wait(300);
    assert.equal((await state()).finished, true);
    await finished('sum-crates');

    // Level 3: the grown-up level, five rows and fruit up to 9; the answer in two taps a crate, no misses.
    await launch('sum-crates', 3);
    await wait(400);
    s = await state();
    const crates3 = crateList(s);
    assert.equal(crates3.length, 10);
    await page.evaluate(() => kit.tapOn(neo.scene.game.hintButton));
    await wait(200);
    assert.equal((await state()).hints, 1);
    for (const at of crates3) await put(at, s.solution[at]);
    await wait(300);
    s = await state();
    assert.equal(s.finished, true);
    assert.equal(s.misses, 0);
    await finished('sum-crates');
  }
  return { sumCratesPlay };
}
