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

  // Level 3: big units first on every task (between marks on the ribbon and parcel: no miss; exact 3:3 on the jugs),
  // then little; one wrong comparison on the first task (a miss), Help once on the second's comparison (a hint).
  await launch('measuring-post', 3, 'Mia', 'school');
  const answer = () => page.evaluate(() => { const g = neo.scene.game; const [l, r] = g.current.objects.map((o) => o.quantity); return l === r ? 1 : l > r ? 0 : 2; });
  const tapUnit = (size) => page.evaluate((size) => kit.tapOn(neo.scene.game.unitPads.get(size)), size);
  for (let task = 0; task < 3; task++) {
    await phase('tool'); await tapTool(await right());
    await phase('unit');
    assert.equal(await page.evaluate(() => neo.scene.game.comparePads.some((p) => p.visible)), false, 'no comparing before a common unit');
    await tapUnit('big');
    const exact = await page.evaluate(() => neo.scene.game.current.attribute === 'capacity');
    if (!exact) { await phase('between'); await phase('unit'); await tapUnit('little'); }
    await phase('answer');
    if (task === 0) {
      await screenshot('measuring-post-3-landscape');
      await page.evaluate((i) => kit.tapOn(neo.scene.game.comparePads[i]), ((await answer()) + 1) % 3);
      await page.waitForTimeout(450);
      assert.equal(await page.evaluate(() => neo.scene.game.misses), 1, 'a wrong comparison is one miss');
    }
    if (task === 1) { await page.evaluate(() => kit.tapOn(neo.scene.game.helpButton)); await page.waitForTimeout(450); }
    await page.evaluate((i) => kit.tapOn(neo.scene.game.comparePads[i]), await answer());
  }
  await finished('measuring-post');
  assert.deepEqual(await score(), [1, 1], 'level 3 saved 1 miss, 1 hint: big units between marks is exploration');
  log('Measuring Post 3: big units between marks no miss, jugs 3:3 exact, little for both, wrong comparison 1 miss, Help 1 hint, 1/1; passed');
  log('Measuring Post 1 and 2: level 1 ribbon first, wrong tool a miss, taps while measuring inert, Send x3 1/0; level 2 portrait Help shows then picks (1 hint), two wrong rows glow (1 hint), last asks bigger, 2/2; passed');
}
return { measuringPostPlay };
}
