import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function sortingMachinePlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('sorting-machine').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.run && !neo.scene.game.busy), null, { timeout: 20000 }); await page.waitForTimeout(200); };
  const tapOn = async (expr) => { await page.evaluate((expr) => kit.tapOn(Function(`return (${expr})`)()), expr); await page.waitForTimeout(200); };
  const card = async (i) => { await tapOn(`neo.scene.game.cardNodes[${i}]`); };
  const send = async () => { await tapOn('neo.scene.game.sendButton'); await settle(); };
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { sent: [...g.sent], results: [...g.results], failing: [...g.failing], picker: g.pickerOpen, glow: g.tally.glowing, finished: neo.scene.finished === true }; });
  const asked = () => page.evaluate(() => neo.scene.game.brief.target.prop);
  const fixtures = () => page.evaluate(() => neo.scene.game.brief.fixtures.map((f) => [f.p, f.q]));
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1: the door answers the fixed sensor; Done waits for both friends; nothing counts.
  await launch('sorting-machine', 1);
  await settle();
  const two = await fixtures();
  assert.equal(two.length, 2, 'two fixtures at level 1');
  await card(0); await send();
  let s = await state();
  assert.deepEqual(s.results, [two[0][0] === 1, null], 'the first run leaves its door mark');
  await tapOn('neo.scene.game.doneButton'); await page.waitForTimeout(400);
  s = await state();
  assert.equal(s.finished, false, 'a dim Done does not end the round');
  await card(1); await send();
  s = await state();
  assert.deepEqual(s.results, [two[0][0] === 1, two[1][0] === 1], 'both door marks, one open and one shut');
  assert.ok(s.results.includes(true) && s.results.includes(false), 'level 1 shows an open and a shut door');
  await tapOn('neo.scene.game.doneButton');
  await finished('sorting-machine');
  assert.deepEqual(await score(), [0, 0], 'level 1 counts nothing');

  // Level 2: an incomplete Check is free; a wrong sensor fails on both mixed friends (one miss); a second wrong Check lights the glow (one hint);
  // Help runs a telling friend then installs the sensor (two hints); Check passes.
  await launch('sorting-machine', 2);
  await settle();
  const four = await fixtures();
  assert.equal(four.length, 4, 'four fixtures at level 2');
  const want = await asked();
  await tapOn('neo.scene.game.checkButton'); await page.waitForTimeout(400);
  assert.deepEqual(await tally(), [0, 0], 'Check with an empty slot counts nothing');
  await card(0); await send();
  s = await state();
  assert.deepEqual(s.results, [null, null, null, null], 'an incomplete run leaves no door mark');
  const wrong = await page.evaluate((want) => neo.scene.game.brief.candidates.findIndex((c) => c !== want), want);
  await tapOn('neo.scene.game.slotNode'); await page.waitForTimeout(300);
  assert.equal((await state()).picker, true, 'the slot opens its picker');
  await tapOn(`neo.scene.game.pickNodes[${wrong}]`); await page.waitForTimeout(300);
  assert.equal((await state()).picker, false, 'a pick closes the picker');
  await tapOn('neo.scene.game.checkButton'); await settle();
  s = await state();
  assert.deepEqual(await tally(), [1, 0], 'a complete wrong machine: one miss');
  assert.equal(s.failing.length, 2, 'the other sensor fails on exactly the two mixed friends');
  assert.ok(s.failing.every((i) => four[i][0] !== four[i][1]), 'the failing friends are the mixed ones');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('sorting-machine-2-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await tapOn('neo.scene.game.slotNode'); await page.waitForTimeout(300);
  await tapOn(`neo.scene.game.pickNodes[${wrong}]`); await page.waitForTimeout(300);
  await tapOn('neo.scene.game.checkButton'); await settle();
  s = await state();
  assert.deepEqual(await tally(), [2, 1], 'the second miss lights the glow and counts one hint');
  assert.equal(s.glow, true, 'the slot glows after two misses');
  await page.evaluate(() => neo.scene.game.askForHint()); await settle();
  assert.deepEqual(await tally(), [2, 2], 'Help runs a telling friend: one hint');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(400);
  assert.deepEqual(await tally(), [2, 3], 'Help installs the sensor: one more hint');
  assert.equal(await page.evaluate(() => neo.scene.game.graph.prop), want, 'the installed sensor is the one the sign asks for');
  assert.equal((await state()).finished, false, 'installing never ends the round by itself');
  await tapOn('neo.scene.game.checkButton');
  await finished('sorting-machine');
  assert.deepEqual(await score(), [2, 3]);
  log('Sorting Machine 1 and 2: both doors and a free Done, an incomplete Check, a wrong sensor twice (glow), Help twice, portrait, passed');
}
return { sortingMachinePlay };
}
