import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
// Levels 4–6: free edits and Show it count nothing; two failed Sends on a sign are two misses and one hint (the glow).
async function signPlay(level) {
  await launch('read-do', level);
  await page.waitForFunction(() => neo.scene.game?.busy === false);
  log(`Read & Do ${level} signs: ${await page.evaluate(() => neo.scene.game.signs.map(s => s.words.join(' ')).join(' / '))}`);
  if (level !== 5) {
    // Toggle the capital on and back off: free.
    await tap('neo.scene.game.words[0]');
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => neo.scene.game.marks.capital), true);
    await tap('neo.scene.game.words[0]');
    await page.waitForTimeout(250);
  }
  await tap('neo.scene.game.show');
  await page.waitForFunction(() => neo.scene.game.busy === false);
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
  for (let attempt = 0; attempt < 2; attempt++) {
    await tap('neo.scene.game.send');
    await page.waitForFunction(() => neo.scene.game.busy === false);
  }
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]), [2, 1, true]);
  await screenshot(`read-do-${level}-hint`);
  if (level === 6) {
    // Tap the stamp, then the socket: the stop lands on the end; the capital is still missing.
    await tap('neo.scene.game.stop');
    await page.waitForTimeout(700);
    assert.equal(await page.evaluate(() => neo.scene.game.selected), true);
    await tap('neo.scene.game.socket');
    await page.waitForTimeout(400);
    assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), { capital: false, stop: true });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(350);
    await screenshot('read-do-6-portrait');
  }
  await page.evaluate(async () => {
    const g = neo.scene.game;
    for (let guard = 0; guard < 1000 && !g.finished; guard++) {
      const intent = g.autotouch();
      if (intent?.tap) kit.tapOn(intent.tap.on);
      else if (intent?.drag) { kit.tapOn(intent.drag.on); await kit.sleep(700); kit.tapOn(intent.to.on); }
      await kit.sleep(100);
    }
  });
  await finished('read-do');
  assert.deepEqual(await page.evaluate(() => {
    const r = kit.store.stats('read-do').history.at(-1); return [r.misses, r.hints];
  }), [2, 1]);
  await page.setViewportSize({ width: 1024, height: 768 });
  log(`Read & Do ${level}: free toggle and Show it, two failed Sends, one hint, completion and sticker passed`);
}
async function readDoPlay() {
  const levels = (process.env.READ_LEVELS || '1,2,3').split(',').map(Number);
  for (const level of levels) {
    if (level >= 4) { await signPlay(level); continue; }
    await launch('read-do', level);
    await page.waitForFunction(() => neo.scene.game?.busy === false);
    log(`Read & Do ${level} signs: ${await page.evaluate(() => neo.scene.game.tasks.map(t => t.words.join(' ')).join(' / '))}`);
    // Word and whole-sign support use real input and do not count as hints or misses.
    await tap('neo.scene.game.words[0]');
    await page.waitForTimeout(300);
    await tap('neo.scene.game.replay');
    await page.waitForFunction(() => neo.scene.game.busy === false);
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
    for (let attempt = 0; attempt < 2; attempt++) {
      await tap('neo.scene.game.choices.find(c => JSON.stringify(c.choice) !== JSON.stringify(neo.scene.game.task.answer)).node');
      await page.waitForFunction(() => neo.scene.game.busy === false);
    }
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]), [2, 1, true]);
    await screenshot(`read-do-${level}-hint`);
    if (level === 3) {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(350);
      await screenshot('read-do-3-portrait');
    }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let guard = 0; guard < 1000 && !g.finished; guard++) {
        const intent = g.autotouch();
        if (intent) kit.tapOn(intent.tap.on);
        await kit.sleep(100);
      }
    });
    await finished('read-do');
    assert.deepEqual(await page.evaluate(() => {
      const r = kit.store.stats('read-do').history.at(-1); return [r.misses, r.hints];
    }), [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Read & Do ${level}: word replay, whole sign, two misses, one hint, completion and sticker passed`);
  }
  // Leaving during an awaited action and returning builds a fresh playable round.
  await launch('read-do', 3);
  await page.waitForFunction(() => neo.scene.game.busy === false);
  await tap('neo.scene.game.choices[0].node');
  await page.evaluate(() => neo.go.land('story-grove'));
  await scene('LandScene');
  await page.waitForTimeout(500);
  assert.equal(errors.length, 0, errors.join('\n'));
}

return { readDoPlay };
}
