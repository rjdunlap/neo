import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function caravanDaysPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('caravan-days').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => { const t = neo.scene.game.tally; return [t.misses, t.hints]; });
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 40000 }); await page.waitForTimeout(150); };
  const tapOn = async (expr) => { await page.evaluate((expr) => kit.tapOn(Function(`return (${expr})`)()), expr); await page.waitForTimeout(150); };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  // CARAVAN_FROM=4 skips levels 1–3 (unchanged), CARAVAN_FROM=6 levels 1–5, and plays only the levels built later.
  const from = Number(process.env.CARAVAN_FROM ?? 1);
  if (from <= 3) await levelsOneToThree();
  if (from <= 5) await levelsFourFive();
  await levelsSixSeven();
  log('Caravan Days: passed');

  async function levelsOneToThree() {
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

  async function levelsFourFive() {
  const logic = '/src/games/caravan-days/logic.ts';
  // Level 4: Go before picking counts nothing; a decoy and Go (one miss, the camel back at the same oasis with the same good); asked-for help (one hint); then the right goods to the city on both roads; a portrait screenshot.
  await launch('caravan-days', 4);
  await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.walkedIn), true, 'the camel walks in to oasis 1');
  await tapOn('neo.scene.game.goNode'); await page.waitForTimeout(200);
  assert.deepEqual(await tally(), [0, 0], 'Go before picking counts nothing');
  const hint4 = () => page.evaluate(async (logic) => { const { swapHint } = await import(logic); const g = neo.scene.game; return neo.scene.finished ? null : { road: g.roadIndex, h: swapHint(g.swapRoad, g.swap) }; }, logic);
  let h = await hint4();
  const decoy = 1 - h.h.side;
  await tapOn(`neo.scene.game.offerNodes[${decoy}]`);
  const picked = await page.evaluate(() => neo.scene.game.swap.carried);
  await tapOn('neo.scene.game.goNode'); await settle();
  assert.deepEqual(await tally(), [1, 0], 'a good the next stop does not want is one miss');
  assert.deepEqual(await page.evaluate(() => ({ ...neo.scene.game.swap })), { at: 1, carried: picked }, 'the camel is back at oasis 1 with the same good');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(200);
  assert.deepEqual(await tally(), [1, 1], 'asked-for help is one hint');
  let shot4 = false;
  for (let guard = 0; guard < 30; guard++) {
    h = await hint4();
    if (!h) break;
    if (!h.h) { await settle(); continue; }
    if (h.road === 1 && !shot4) {
      shot4 = true;
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
      await screenshot('caravan-days-4-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
    }
    if ('go' in h.h) { await tapOn('neo.scene.game.goNode'); await settle(); }
    else await tapOn(`neo.scene.game.offerNodes[${h.h.side}]`);
  }
  await finished('caravan-days');
  assert.deepEqual(await score(), [1, 1], 'level 4 saved 1 miss, 1 hint');

  // Level 5: Go before looking counts nothing; the smaller load sent (one miss, home again, look cleared); asked-for help (one hint); then the better load at both named stops (it reverses); a portrait screenshot.
  await launch('caravan-days', 5);
  await settle();
  await tapOn('neo.scene.game.goNode'); await page.waitForTimeout(200);
  assert.deepEqual(await tally(), [0, 0], 'Go before looking counts nothing');
  const info5 = () => page.evaluate(async (logic) => { const { better, nextWorthMove } = await import(logic); const g = neo.scene.game; return neo.scene.finished ? null : { c: g.roadIndex, better: better(g.plan, g.roadIndex), move: nextWorthMove(g.plan, g.roadIndex, g.worth, g.seen) }; }, logic);
  let w = await info5();
  const firstBetter = w.better;
  await tapOn(`neo.scene.game.loadNodes[${1 - w.better}]`);
  await tapOn('neo.scene.game.goNode'); await settle();
  assert.deepEqual(await tally(), [1, 0], 'the smaller load is one miss');
  assert.equal(await page.evaluate(() => neo.scene.game.worth.looked), null, 'home again, nothing chosen');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(200);
  assert.deepEqual(await tally(), [1, 1], 'asked-for help is one hint');
  let shot5 = false;
  for (let guard = 0; guard < 20; guard++) {
    w = await info5();
    if (!w) break;
    if (w.c === 1 && !shot5) {
      shot5 = true;
      assert.notEqual(w.better, firstBetter, 'the better load reverses at the other end of the road');
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
      await screenshot('caravan-days-5-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
    }
    if ('go' in w.move) { await tapOn('neo.scene.game.goNode'); await settle(); }
    else await tapOn(`neo.scene.game.loadNodes[${w.move.load}]`);
  }
  await finished('caravan-days');
  assert.deepEqual(await score(), [1, 1], 'level 5 saved 1 miss, 1 hint');
  log('Caravan Days 4–5: Go before picking free, a decoy (miss), help (hint), the right goods on both roads (1/1); Go before looking free, the smaller load (miss), help (hint), the better load reversing between cases (1/1); portrait screenshots, passed');
  }

  async function levelsSixSeven() {
  const logic = '/src/games/caravan-days/logic.ts';
  // Level 6: Go before both is free; the slower road with a wrong card (one miss, home again, road and card kept); asked-for help (one hint);
  // then that slower road's right count is accepted (either road); the second map by the ghost-finger moves; a portrait screenshot.
  await launch('caravan-days', 6);
  await settle();
  await tapOn('neo.scene.game.goNode'); await page.waitForTimeout(200);
  assert.deepEqual(await tally(), [0, 0], 'Go before a road and a card counts nothing');
  const info6 = () => page.evaluate(async (logic) => { const { days, quicker, nextPassMove } = await import(logic); const g = neo.scene.game; if (neo.scene.finished) return null; const m = g.passMap; return { c: g.roadIndex, slow: quicker(m) === 'pass' ? 'sand' : 'pass', days: { pass: days(m, 'pass'), sand: days(m, 'sand') }, move: nextPassMove(m, g.pass) }; }, logic);
  let p6 = await info6();
  const slowBand = p6.slow === 'pass' ? 0 : 1;
  const right = p6.days[p6.slow];
  const wrong = right === 3 ? 7 : right - 1;
  await tapOn(`neo.scene.game.bandNodes[${slowBand}]`);
  await tapOn(`neo.scene.game.cardNodes[${[3, 4, 5, 6, 7].indexOf(wrong)}]`);
  await tapOn('neo.scene.game.goNode'); await settle();
  assert.deepEqual(await tally(), [1, 0], 'a wrong day count is one miss');
  assert.deepEqual(await page.evaluate(() => ({ ...neo.scene.game.pass })), { road: p6.slow, guess: wrong }, 'the road and card stay set');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(200);
  assert.deepEqual(await tally(), [1, 1], 'asked-for help is one hint');
  await tapOn(`neo.scene.game.cardNodes[${[3, 4, 5, 6, 7].indexOf(right)}]`);
  await tapOn('neo.scene.game.goNode'); await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.roadIndex), 1, 'the slower road with its right count is accepted');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('caravan-days-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  for (let guard = 0; guard < 10; guard++) {
    p6 = await info6();
    if (!p6) break;
    if ('go' in p6.move) { await tapOn('neo.scene.game.goNode'); await settle(); }
    else if ('road' in p6.move) await tapOn(`neo.scene.game.bandNodes[${p6.move.road === 'pass' ? 0 : 1}]`);
    else await tapOn(`neo.scene.game.cardNodes[${[3, 4, 5, 6, 7].indexOf(p6.move.card)}]`);
  }
  await finished('caravan-days');
  assert.deepEqual(await score(), [1, 1], 'level 6 saved 1 miss, 1 hint');

  // Level 7: Done with no wells is free; one well leaves a stretch too long (one miss); asked-for help (one hint); a fewest
  // placement plus one extra well works (not a miss); the second road by the ghost-finger moves; a portrait screenshot.
  await launch('caravan-days', 7);
  await settle();
  await tapOn('neo.scene.game.goNode'); await page.waitForTimeout(200);
  assert.deepEqual(await tally(), [0, 0], 'Done with no wells counts nothing');
  const info7 = () => page.evaluate(async (logic) => { const { checkWells, minimalPlacements, nextWellMove } = await import(logic); const g = neo.scene.game; if (neo.scene.finished) return null; const r = g.wellRoad; return { c: g.roadIndex, sites: r.sites, wells: g.wells.slice(), min: minimalPlacements(r)[0], ok: checkWells(r, g.wells).ok, move: nextWellMove(r, g.wells) }; }, logic);
  let w7 = await info7();
  await tapOn('neo.scene.game.siteNodes[0]');
  await tapOn('neo.scene.game.goNode'); await settle();
  assert.deepEqual(await tally(), [1, 0], 'a stretch longer than a day is one miss');
  assert.deepEqual(await page.evaluate(() => neo.scene.game.wells.slice()), [w7.sites[0]], 'the wells stay where she put them');
  await page.evaluate(() => neo.scene.game.askForHint()); await page.waitForTimeout(200);
  assert.deepEqual(await tally(), [1, 1], 'asked-for help is one hint');
  const extra = w7.sites.find((s) => !w7.min.includes(s));
  const want = [...w7.min, extra];
  for (const s of w7.sites) {
    const has = (await page.evaluate(() => neo.scene.game.wells.slice())).includes(s);
    if (has !== want.includes(s)) await tapOn(`neo.scene.game.siteNodes[${w7.sites.indexOf(s)}]`);
  }
  await tapOn('neo.scene.game.goNode'); await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.roadIndex), 1, 'a road that works with an extra well ends the road');
  assert.deepEqual(await tally(), [1, 1], 'an extra well is not a miss');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('caravan-days-7-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  for (let guard = 0; guard < 20; guard++) {
    w7 = await info7();
    if (!w7) break;
    if ('done' in w7.move) { await tapOn('neo.scene.game.goNode'); await settle(); }
    else await tapOn(`neo.scene.game.siteNodes[${w7.sites.indexOf(w7.move.site)}]`);
  }
  await finished('caravan-days');
  assert.deepEqual(await score(), [1, 1], 'level 7 saved 1 miss, 1 hint');
  log('Caravan Days 6–7: Go before both free, the slower road with a wrong count (miss), help (hint), its right count accepted, portrait (1/1); Done empty free, one well too far apart (miss), help (hint), a fewest placement plus an extra accepted, portrait (1/1), passed');
  }
}
return { caravanDaysPlay };
}
