import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function vineSnipPlay() {
  const state = () => page.evaluate(() => neo.scene.game.state);
  const score = () => page.evaluate(() => { const r = kit.store.stats('vine-snip').history.at(-1); return [r.misses, r.hints]; });
  const tapStage = (p) => page.evaluate((p) => { const q = neo.scene.game.layer.parent.toGlobal(p); kit.tap(q.x, q.y); }, p);
  const ready = (i, phase) => page.waitForFunction(([i, phase]) => { const g = neo.scene.game; return g.index === i && g.phase === phase && !g.busy; }, [i, phase], { timeout: 15000 });
  const fed = (i) => page.waitForFunction((i) => neo.scene.game.index > i || neo.scene.game.finished, i, { timeout: 15000 });
  // Tap the swinging vine near its anchor when the swing is `target` seconds into its beat.
  const tapAt = (target) => page.evaluate((target) => new Promise((done) => {
    const g = neo.scene.game;
    const step = () => {
      const s = g.state;
      if (s.phase === 'swing' && !g.busy) {
        const d = Math.abs(((((s.offset - target) % s.beat) + s.beat * 1.5) % s.beat) - s.beat / 2);
        if (d < 0.025) { const q = g.layer.parent.toGlobal(s.vineAt); kit.tap(q.x, q.y); return done(s.offset); }
      }
      requestAnimationFrame(step);
    };
    step();
  }), target);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1: a tap anywhere on the board snips the one vine, and each friend munches.
  await launch('vine-snip', 1, 'Mia', 'preschool');
  for (let i = 0; i < 3; i++) {
    await ready(i, 'rest');
    const s = await state();
    assert.equal(s.fruit.x > 0 && s.alive.length, 1, 'one vine at level 1');
    await tapStage({ x: s.fruit.x + 160, y: s.fruit.y + 60 });
    await fed(i);
  }
  await finished('vine-snip');
  assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

  // Level 3 in portrait: a snip at the far turnaround misses (early), a requested hint glows the arc, then timed snips feed all three.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await launch('vine-snip', 3, 'Mia', 'school');
  await ready(0, 'swing');
  let s = await state();
  assert.equal(s.friend.kind, 'duck', 'the authored first line');
  assert.ok(s.windows.some(([a, b]) => b - a >= 0.4), 'a window of at least 0.4 s');
  await tapAt(0);
  await page.waitForFunction(() => neo.scene.game.phase === 'miss', null, { timeout: 8000 });
  await ready(0, 'swing');
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.alive], [1, 0, [true]], 'a missed drop counts once and the vine grows back');
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
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  log('Vine Snip 1 and 3: level 1 three taps anywhere fed every friend 0/0; level 3 portrait, a snip at the far turnaround missed, a requested hint glowed the arc, then three timed snips fed every friend 1/1; passed');
}
return { vineSnipPlay };
}
