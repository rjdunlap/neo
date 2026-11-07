import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function measuringPostPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('measuring-post').history.at(-1); return [r.misses, r.hints]; });
  const phase = (p) => page.waitForFunction((p) => neo.scene.game?.phase === p, p, { timeout: 12000 });
  const right = () => page.evaluate(() => { const g = neo.scene.game; return ({ length: 'rope', mass: 'balance', capacity: 'cup' })[g.current.attribute]; });
  const wrong = () => page.evaluate(() => { const g = neo.scene.game; return ({ length: 'balance', mass: 'cup', capacity: 'rope' })[g.current.attribute]; });
  const tapTool = (tool) => page.evaluate((tool) => kit.tapOn(neo.scene.game.toolPads.get(tool)), tool);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1: the first question is the ribbon. One wrong tool (a miss), a tap during measuring does nothing, Send, then the rest.
  await launch('measuring-post', 1, 'Mia', 'school');
  await phase('tool');
  assert.equal(await page.evaluate(() => neo.scene.game.current.attribute), 'length', 'the first friend asks how long');
  await tapTool(await wrong());
  await page.waitForFunction(() => neo.scene.game.phase === 'tool' && neo.scene.game.misses === 1, null, { timeout: 8000 });
  await tapTool(await right());
  await phase('measure');
  await tapTool('rope');
  assert.equal(await page.evaluate(() => neo.scene.game.phase), 'measure', 'tool taps while measuring do nothing');
  await phase('send');
  await screenshot('measuring-post-1-landscape');
  for (let task = 0; task < 3; task++) {
    if (task > 0) { await phase('tool'); await tapTool(await right()); }
    await phase('send');
    await page.evaluate(() => kit.tapOn(neo.scene.game.sendButton));
  }
  await finished('measuring-post');
  assert.deepEqual(await score(), [1, 0], 'level 1 saved 1 miss, 0 hints');

  // Level 2 in portrait: Help twice on the tool (one hint, then it picks), two wrong rows glow the answer (one more hint).
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await launch('measuring-post', 2, 'Mia', 'school');
  await phase('tool');
  await page.evaluate(() => kit.tapOn(neo.scene.game.helpButton));
  await page.waitForTimeout(450);
  await page.evaluate(() => kit.tapOn(neo.scene.game.helpButton));
  await phase('answer');
  assert.equal(await page.evaluate(() => neo.scene.game.tally.count), 1, 'Help shown then done on one step is one hint');
  await screenshot('measuring-post-2-portrait');
  const wrongRow = await page.evaluate(() => { const g = neo.scene.game; return g.current.records.findIndex((r) => r.unit.size !== g.current.ask); });
  for (let i = 0; i < 2; i++) { await page.evaluate((i) => kit.tapOn(neo.scene.game.answerPads[i]), wrongRow); await page.waitForTimeout(450); }
  assert.equal(await page.evaluate(() => neo.scene.game.tally.count), 2, 'two wrong rows glow the answer: one hint');
  for (let task = 0; task < 3; task++) {
    if (task > 0) { await phase('tool'); await tapTool(await right()); }
    await phase('answer');
    if (task === 2) assert.equal(await page.evaluate(() => neo.scene.game.current.ask), 'big', 'the last friend asks for the bigger units');
    await page.evaluate(() => { const g = neo.scene.game; kit.tapOn(g.answerPads[g.current.records.findIndex((r) => r.unit.size === g.current.ask)]); });
  }
  await finished('measuring-post');
  assert.deepEqual(await score(), [2, 2], 'level 2 saved 2 misses, 2 hints');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  log('Measuring Post 1 and 2: level 1 ribbon first, wrong tool a miss, taps while measuring inert, Send x3 1/0; level 2 portrait Help shows then picks (1 hint), two wrong rows glow (1 hint), last asks bigger, 2/2; passed');
}
return { measuringPostPlay };
}
