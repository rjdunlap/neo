import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function ruleMachinePlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('rule-machine').history.at(-1); return [r.misses, r.hints]; });
  const state = () => page.evaluate(() => neo.scene.game.state);
  const until = async (fn, arg) => page.waitForFunction(fn, arg, { timeout: 40000 });
  // The pads are built when the question opens; hit-testing uses the last frame, so let them render before a tap.
  const askOpen = async () => { await until(() => neo.scene.finished || neo.scene.game.state.phase === 'predict'); await page.waitForTimeout(250); };
  const tapPad = async (i) => { await page.evaluate((i) => kit.tapOn(neo.scene.game.padNodes[i]), i); await page.waitForTimeout(250); };
  const wrongOf = (s) => [0, 1, 2].find((i) => i !== s.right);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1 (pre-K): three walkers go through by themselves; the first prediction is free even when wrong, the second
  // counts: two wrong pictures (two misses, the glow, one hint), then the right one. The second machine goes straight.
  await launch('rule-machine', 1, 'Mia', 'prek');
  await askOpen();
  let s = await state();
  assert.equal(s.rows.length, 3, 'three walkers made three rows');
  assert.equal(s.counted, false);
  await tapPad(wrongOf(s));
  s = await state();
  assert.deepEqual([s.misses, s.hints], [0, 0], 'the first guess on a new machine is free');
  await until(() => neo.scene.game.state.phase === 'predict' && neo.scene.game.state.asked === 1);
  s = await state();
  assert.equal(s.counted, true);
  await tapPad(wrongOf(s));
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.glowing, s.phase], [1, 0, false, 'predict'], 'a counted wrong: a miss, the pictures stay');
  await tapPad(wrongOf(s));
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.glowing], [2, 1, true], 'the second wrong lights the glow: one hint');
  await screenshot('rule-machine-1-glow');
  await tapPad(s.right);
  await until(() => neo.scene.finished || neo.scene.game.state.machine === 1);
  for (let k = 0; k < 2; k++) { await askOpen(); s = await state(); await tapPad(s.right); await until((k) => neo.scene.finished || neo.scene.game.state.asked > k || neo.scene.game.state.phase !== 'predict', k); await page.waitForTimeout(200); }
  await finished('rule-machine');
  assert.deepEqual(await score(), [2, 1], 'level 1 saved 2 misses, 1 hint');

  // Level 2 (school), portrait: send four cars to each machine; one wrong pad after two rows (one miss), the rest right.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await launch('rule-machine', 2, 'Mia', 'school');
  let wrongDone = false;
  for (let m = 0; m < 2; m++) {
    for (let k = 0; k < 4; k++) {
      await until(() => neo.scene.game.state.phase === 'feed');
      s = await state();
      const slot = [0, 1, 2, 3, 4].find((i) => !s.fed.includes(i));
      await page.evaluate((slot) => kit.tapOn(neo.scene.game.cars[slot], 0, -40), slot);
      await askOpen();
      s = await state();
      assert.equal(s.options[s.right], s.tray[slot] + s.rule.b, 'the right pad is what the rule gives');
      if (m === 0 && k === 2 && !wrongDone) {
        assert.equal(s.counted, true, 'two rows on the table: the third prediction counts');
        await screenshot('rule-machine-2-portrait');
        await tapPad(wrongOf(s));
        s = await state();
        assert.deepEqual([s.misses, s.hints, s.phase], [1, 0, 'predict'], 'one wrong pad: a miss, the pads stay');
        wrongDone = true;
      }
      await tapPad(s.right);
      await until(([n, mm]) => neo.scene.finished || neo.scene.game.state.rows.length > n || neo.scene.game.state.machine > mm, [s.rows.length, m]);
    }
  }
  await finished('rule-machine');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  assert.deepEqual(await score(), [1, 0], 'level 2 saved 1 miss, 0 hints');
  log('Rule Machine 1 and 2: level 1 a free first guess, two counted wrongs and the glow (2/1); portrait level 2 one wrong pad after two rows (1/0); passed');
}
return { ruleMachinePlay };
}
