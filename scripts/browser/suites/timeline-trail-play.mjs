import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function timelineTrailPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('timeline-trail').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { line: [...g.line], loose: [...g.loose], glowing: g.tally.glowing, rows: g.layoutNow?.rows.length ?? 0, busy: g.busy, finished: neo.scene.finished === true }; });
  const ready = async () => { await page.waitForFunction(() => neo.scene.game?.layoutNow && !neo.scene.game.busy, null, { timeout: 15000 }); await page.waitForTimeout(300); };
  /** Drag the loose card `stage` so that it lands on gap `gap` (the card rides 40 above the finger). */
  const dragTo = async (stage, gap) => {
    await page.evaluate(async ({ stage, gap }) => {
      const g = neo.scene.game;
      const c = g.cards.find((k) => k.stage === stage && !k.hung);
      const at = g.gapNodes[gap].getGlobalPosition();
      await kit.dragTo(c.node, { x: at.x, y: at.y + 40 }, 14);
    }, { stage, gap });
    await page.waitForTimeout(600);
  };
  const validGap = (stage) => page.evaluate((stage) => neo.scene.game.line.filter((s) => s < stage).length, stage);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 2: two cards hang; the loose card in a wrong gap slides back (one miss); Show me lights its gap (one hint); the valid gap finishes.
  await launch('timeline-trail', 2);
  await ready();
  let s = await state();
  assert.equal(s.line.length, 2, 'level 2 opens with two cards hung');
  assert.equal(s.loose.length, 1, 'and one loose card');
  const stage2 = s.loose[0];
  const valid2 = await validGap(stage2);
  const wrong2 = (valid2 + 1) % 3;
  await dragTo(stage2, wrong2);
  s = await state();
  assert.deepEqual(s.line.length, 2, 'a wrong gap leaves the line as it was');
  assert.deepEqual(await tally(), [1, 0], 'a wrong gap counts one miss');
  await dragTo(stage2, wrong2);
  assert.deepEqual(await tally(), [1, 0], 'the same card in the same wrong gap again counts nothing more');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(300);
  s = await state();
  assert.equal(s.glowing, stage2, 'Show me lights the loose card');
  assert.deepEqual(await tally(), [1, 1], 'Show me counts one hint');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(200);
  assert.deepEqual(await tally(), [1, 1], 'a second Show me on the same card counts nothing more');
  await screenshot('timeline-trail-2-landscape');
  await dragTo(stage2, valid2);
  await finished('timeline-trail');
  assert.deepEqual(await score(), [1, 1], 'level 2 saved 1 miss, 1 hint');

  // Level 3: a tap says the picture (free); hang the cards oldest first; a portrait look at the two-row line; finish 0/0.
  await launch('timeline-trail', 3);
  await ready();
  s = await state();
  assert.equal(s.line.length, 1, 'level 3 opens with the first card hung');
  assert.equal(s.loose.length, 3, 'and three loose cards');
  await page.evaluate(() => { const g = neo.scene.game; const c = g.cards.find((k) => !k.hung); kit.tapOn(c.node); });
  await page.waitForTimeout(500);
  s = await state();
  assert.equal(s.line.length, 1, 'a tap on a loose card hangs nothing');
  assert.deepEqual(await tally(), [0, 0], 'and counts nothing');
  for (let i = 0; i < 3; i++) {
    s = await state();
    const stage = Math.min(...s.loose);
    const gap = await validGap(stage);
    await dragTo(stage, gap);
    if (i === 1) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
      s = await state();
      assert.equal(s.line.length, 3, 'three cards hung');
      assert.equal(s.rows, 2, 'the portrait line of three cards and four gaps wraps into two rows');
      await screenshot('timeline-trail-3-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(600);
    }
  }
  await finished('timeline-trail');
  assert.deepEqual(await score(), [0, 0], 'level 3 saved 0 misses, 0 hints');
  log('Timeline Trail 2 and 3: a wrong gap once (one miss), Show me twice (one hint), the valid gap; a free tap, three drags oldest first, a two-row portrait line at three hung, passed');
}
return { timelineTrailPlay };
}
