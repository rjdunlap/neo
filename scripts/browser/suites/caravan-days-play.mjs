import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function caravanDaysPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('caravan-days').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => { const t = neo.scene.game.tally; return [t.misses, t.hints]; });
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 40000 }); await page.waitForTimeout(150); };
  const tapOn = async (expr) => { await page.evaluate((expr) => kit.tapOn(Function(`return (${expr})`)()), expr); await page.waitForTimeout(150); };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1: a bale tap while the camel stands only wobbles; kneel, every bale on (one off and on again), the camel walks and drinks; nothing counts.
  await launch('caravan-days', 1);
  await settle();
  const bales = await page.evaluate(() => neo.scene.game.plan.bales);
  assert.ok(bales >= 2 && bales <= 4, 'two to four bales');
  await tapOn('neo.scene.game.baleNodes[0]');
  let load = await page.evaluate(() => ({ ...neo.scene.game.load }));
  assert.deepEqual([load.phase, load.on.filter(Boolean).length], ['standing', 0], 'a bale tap while standing changes nothing');
  await tapOn('neo.scene.game.camelNode');
  load = await page.evaluate(() => ({ ...neo.scene.game.load }));
  assert.equal(load.phase, 'kneeling', 'the camel kneels');
  await tapOn('neo.scene.game.camelNode');
  load = await page.evaluate(() => ({ ...neo.scene.game.load }));
  assert.equal(load.phase, 'kneeling', 'a camel tap with bales on the ground only asks for one more');
  for (let i = 0; i < bales; i++) await tapOn(`neo.scene.game.baleNodes[${i}]`);
  await tapOn('neo.scene.game.baleNodes[0]');
  load = await page.evaluate(() => ({ ...neo.scene.game.load }));
  assert.equal(load.on.filter(Boolean).length, bales - 1, 'a loaded bale hops back off');
  await page.waitForTimeout(400);
  await tapOn('neo.scene.game.baleNodes[0]');
  await page.waitForTimeout(400);
  load = await page.evaluate(() => ({ ...neo.scene.game.load }));
  assert.equal(load.on.filter(Boolean).length, bales, 'every bale is on');
  await screenshot('caravan-days-1-landscape');
  await tapOn('neo.scene.game.camelNode');
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => neo.scene.game.load.phase), 'walking', 'the loaded camel walks');
  await finished('caravan-days');
  assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

  // Level 2: the far oasis twice (a miss each, the glow after the second: one hint), then the near one; the second road right away.
  await launch('caravan-days', 2);
  await settle();
  const far = async () => page.evaluate(async () => { const { reachable } = await import('/src/games/caravan-days/logic.ts'); return 1 - reachable(neo.scene.game.road); });
  let f = await far();
  await tapOn(`neo.scene.game.stopNodes[${f}]`); await settle();
  assert.deepEqual(await tally(), [1, 0], 'the far water is one miss, no glow yet');
  assert.equal(await page.evaluate(() => neo.scene.game.roadIndex), 0, 'still the first road');
  await tapOn(`neo.scene.game.stopNodes[${f}]`); await settle();
  assert.deepEqual(await tally(), [2, 1], 'the second miss glows (one hint)');
  assert.equal(await page.evaluate(() => neo.scene.game.tallies.glowing), true, 'the near water glows');
  await tapOn(`neo.scene.game.stopNodes[${1 - f}]`); await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.roadIndex), 1, 'the drink moved to the second road');
  f = await far();
  await tapOn(`neo.scene.game.stopNodes[${1 - f}]`);
  await finished('caravan-days');
  assert.deepEqual(await score(), [2, 1], 'level 2 saved 2 misses, 1 hint');

  // Level 3: the city straight from home wobbles; a plan across the 3-sun leg and Go (one miss, the camel back at its last flag), the same again (the glow, one hint), then the safe plan; the second map straight through; a portrait screenshot.
  await launch('caravan-days', 3);
  await settle();
  const info = async () => page.evaluate(async () => { const { safePlan } = await import('/src/games/caravan-days/logic.ts'); const g = neo.scene.game; const m = g.map; return { home: m.home, city: m.city, long: m.long, branches: m.branches, legs: m.legs, safe: safePlan(m), plan: g.state.plan, walked: g.state.walked }; });
  let m = await info();
  const longBranch = m.branches[m.long];
  await tapOn(`neo.scene.game.stopNodes[${m.city}]`);
  m = await info();
  assert.deepEqual(m.plan, [], 'the city is not flagged straight from home');
  await tapOn('neo.scene.game.goNode'); await page.waitForTimeout(200);
  assert.deepEqual(await tally(), [0, 0], 'Go before the city counts nothing');
  const longPlan = [...longBranch, m.city];
  for (const stop of longPlan) await tapOn(`neo.scene.game.stopNodes[${stop}]`);
  m = await info();
  assert.deepEqual(m.plan, longPlan, 'the long branch is flagged to the city');
  await tapOn('neo.scene.game.goNode'); await settle();
  m = await info();
  assert.deepEqual(await tally(), [1, 0], 'the over-long leg is one miss');
  const legIndex = longPlan.findIndex((stop, i) => { const from = i === 0 ? m.home : longPlan[i - 1]; return m.legs.some((l) => l.a === from && l.b === stop && l.suns === 3); });
  assert.deepEqual(m.plan, longPlan.slice(0, legIndex), 'the flags before the over-long leg stay');
  assert.equal(m.walked, legIndex, 'the camel stands at the last flag before it');
  for (const stop of longPlan.slice(legIndex)) await tapOn(`neo.scene.game.stopNodes[${stop}]`);
  await tapOn('neo.scene.game.goNode'); await settle();
  assert.deepEqual(await tally(), [2, 1], 'the second over-long Go glows (one hint)');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('caravan-days-3-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  for (let guard = 0; guard < 30; guard++) {
    const s = await page.evaluate(async () => { const { nextPlanMove } = await import('/src/games/caravan-days/logic.ts'); const g = neo.scene.game; if (neo.scene.finished) return { done: true }; return { done: false, map: g.roadIndex, move: nextPlanMove(g.map, g.state) }; });
    if (s.done) break;
    if ('go' in s.move) { await tapOn('neo.scene.game.goNode'); await settle(); }
    else await tapOn(`neo.scene.game.stopNodes[${s.move.stop}]`);
  }
  await finished('caravan-days');
  assert.deepEqual(await score(), [2, 1], 'level 3 saved 2 misses, 1 hint');
  log('Caravan Days 1–3: kneel, load and walk (0/0), the far water twice then the near one (2/1), the long branch twice then the safe plan (2/1), a portrait screenshot, passed');
}
return { caravanDaysPlay };
}
