import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function blockTopplePlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('block-topple').history.at(-1); return [r.misses, r.hints]; });
  const ready = (i) => page.waitForFunction((i) => { const g = neo.scene.game; return g.lineIndex === i && !g.busy && !g.finished; }, i, { timeout: 15000 });
  const settled = () => page.waitForFunction(() => { const g = neo.scene.game; return g.finished || !g.busy; }, null, { timeout: 15000 });
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { line: g.lineIndex, misses: g.misses, hints: g.hints, hinted: g.hinted, ghost: g.ghost.visible, standing: g.standing.slice(), friend: g.line.stacks[0].friend, hill: !!g.line.hill }; });
  // Put a finger on the ball, pull back by `pull` (the reverse of the launch), and let go; null pulls the solver's shot.
  const shoot = (pull) => page.evaluate(async (pull) => {
    const g = neo.scene.game;
    const p = pull ?? g.solution();
    const a = (p.angle * Math.PI) / 180;
    const from = g.board.toGlobal({ x: 230, y: 400 });
    const to = g.board.toGlobal({ x: 230 - Math.cos(a) * p.length, y: 400 + Math.sin(a) * p.length });
    await kit.drag(kit.line([from.x, from.y], [to.x, to.y], 12));
  }, pull);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1: the solver's pull tips each of the three towers; nothing counts.
  await launch('block-topple', 1, 'Mia', 'preschool');
  for (let i = 0; i < 3; i++) {
    await ready(i);
    if (i === 0) assert.equal((await state()).friend, 'bunny', 'the authored first line');
    await shoot(null);
    await page.waitForFunction((i) => neo.scene.game.lineIndex > i || neo.scene.game.finished, i, { timeout: 15000 });
  }
  await finished('block-topple');
  assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

  // Level 3 in portrait: a short shot and a flat shot into the hill are two misses, the dotted path shows, then the tip.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await launch('block-topple', 3, 'Mia', 'school');
  await ready(0);
  let s = await state();
  assert.deepEqual([s.friend, s.hill], ['duck', true], 'the authored first line has the duck behind a hill');
  await shoot({ angle: 45, length: 40 });
  await settled();
  s = await state();
  assert.deepEqual([s.misses, s.hinted], [1, false], 'a short shot is one miss');
  await shoot({ angle: 12, length: 160 });
  await settled();
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.hinted, s.ghost], [2, 1, true, true], 'a flat shot into the hill is the second miss, and the dotted path shows');
  await page.waitForTimeout(400);
  await screenshot('block-topple-3-portrait-hint');
  for (let i = 0; i < 3; i++) {
    await ready(i);
    await shoot(null);
    await page.waitForFunction((i) => neo.scene.game.lineIndex > i || neo.scene.game.finished, i, { timeout: 15000 });
  }
  await finished('block-topple');
  assert.deepEqual(await score(), [2, 1], 'level 3 saved 2 misses, 1 hint');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  log('Block Topple 1 and 3: level 1 three solver pulls tipped every tower 0/0; level 3 portrait, a short shot and a hill shot missed, the dotted path showed, then three tips 2/1; passed');
}
return { blockTopplePlay };
}
