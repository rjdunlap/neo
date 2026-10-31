import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function puppetStagePlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('puppet-stage').history.at(-1); return [r.misses, r.hints]; });
  const state = () => page.evaluate(() => neo.scene.game.state);
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 40000 }); await page.waitForTimeout(150); };
  const tapFloor = async (k) => { await page.evaluate((k) => { const g = neo.scene.game, l = g.layoutNow; const p = g.floorSurface.toGlobal({ x: l.stand.min + (0.15 + 0.35 * k) * (l.stand.max - l.stand.min), y: l.floorTouch.y }); kit.tap(p.x, p.y); }, k); await page.waitForTimeout(500); };
  const tapPuppet = async (p) => { await page.evaluate((p) => kit.tapOn(neo.scene.game.puppetNodes.get(p), 0, -60), p); await page.waitForTimeout(220); };
  const tapBubble = async (w) => { await page.evaluate((w) => kit.tapOn(neo.scene.game.bubbleNodes.get(w)), w); await page.waitForTimeout(220); };
  const asked = (s) => page.evaluate(async (s) => { const { askedPuppet } = await import('/src/games/puppet-stage/logic.ts'); return askedPuppet(s.ask, s.puppets); }, s);
  const voiceOf = (p) => page.evaluate(async (p) => { const { BASE_VOICE, WAY_VOICE } = await import('/src/games/puppet-stage/logic.ts'); return BASE_VOICE[p] ?? WAY_VOICE[p]; }, p);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1 (toddler): three touches on the floor each raise the nearest parked puppet, which says hello in its own voice;
  // the third pop sends the oldest down; a drag moves a puppet; a curtain and the tassel are free; Bow ends the round with 0/0.
  await launch('puppet-stage', 1, 'Mia', 'toddler');
  await settle();
  let s = await state();
  assert.deepEqual([s.standing, s.pops, s.bowShown], [[], 0, false]);
  await tapFloor(0);
  s = await state();
  assert.equal(s.standing.length, 1, 'a touch on the floor raised a puppet');
  assert.equal(s.pops, 1);
  const first = s.standing[0];
  const hello = s.spoken.at(-1);
  assert.equal(hello.id, `ps.hello.${first}`, 'it said hello');
  assert.deepEqual([hello.pitch, hello.rate], [(await voiceOf(first)).pitch, (await voiceOf(first)).rate], 'in its own voice');
  await tapFloor(2);
  s = await state();
  assert.equal(s.standing.length, 2, 'two puppets stand');
  assert.notEqual(s.standing[1], first);
  await tapFloor(1);
  s = await state();
  assert.equal(s.standing.length, 2, 'a third touch keeps two standing');
  assert.equal(s.standing.includes(first), false, 'the longest-standing one went down');
  assert.deepEqual([s.pops, s.bowShown], [3, true], 'Bow appears after three pops');
  const [xs, mover] = await page.evaluate(() => { const g = neo.scene.game; const p = g.standing[1]; return [g.puppetNodes.get(p).x, p]; });
  await page.evaluate(async (p) => { const g = neo.scene.game, n = g.puppetNodes.get(p); const a = n.toGlobal({ x: 0, y: -60 }); const b = n.toGlobal({ x: -120, y: -60 }); await kit.drag(kit.line([a.x, a.y], [b.x, b.y], 12)); }, mover);
  await page.waitForTimeout(400);
  const xAfter = await page.evaluate((p) => neo.scene.game.puppetNodes.get(p).x, mover);
  assert.ok(Math.abs(xAfter - xs) >= 60, `the drag moved the puppet (${xs} -> ${xAfter})`);
  await page.evaluate(() => kit.tapOn(neo.scene.game.curtainNodes[0], 55, 60));
  await page.waitForTimeout(700);
  s = await state();
  assert.equal(s.curtainsClosed, true, 'a tap on a curtain closes both');
  await page.evaluate(() => kit.tapOn(neo.scene.game.curtainNodes[0], 55, 60));
  await page.waitForTimeout(700);
  await page.evaluate(() => kit.tapOn(neo.scene.game.tasselNode));
  await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual([s.curtainsClosed, s.night, s.misses, s.hints], [false, true, 0, 0], 'curtains open again, night backdrop, nothing counted');
  await screenshot('puppet-stage-1-landscape');
  await page.evaluate(() => kit.tapOn(neo.scene.game.bowNode));
  await finished('puppet-stage');
  assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

  // Level 2 (preschool): the pair rises and says hello; the first ask is by name. The other puppet is a miss (it says who it is,
  // in its voice); a second miss glows the asked one (one hint); then the asked puppet talks. The last two asks are by voice,
  // each preceded by both hellos; finish 2/1.
  await launch('puppet-stage', 2, 'Mia', 'preschool');
  await settle();
  s = await state();
  assert.equal(s.standing.length, 2, 'the pair is up');
  assert.equal(s.ask.kind, 'name');
  const wanted = await asked(s);
  const other = s.puppets.find((p) => p !== wanted);
  await tapPuppet(other);
  await settle();
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.glow], [1, 0, null], 'the other puppet is one miss, no glow yet');
  assert.equal(s.spoken.at(-1).id, `ps.im.${other}`, 'it said who it is');
  await tapPuppet(other);
  await settle();
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.glow], [2, 1, wanted], 'the second miss glows the asked puppet: one hint');
  await tapPuppet(wanted);
  await settle();
  s = await state();
  assert.equal(s.askIndex, 1, 'the asked puppet talked and the next ask is open');
  assert.equal(s.spoken.find((x) => x.id === `ps.talk.${wanted}`)?.pitch, (await voiceOf(wanted)).pitch, 'it talked in its own voice');
  let sawVoice = false;
  for (let i = 1; i < 4; i++) {
    s = await state();
    assert.equal(s.askIndex, i);
    if (s.ask.kind === 'voice') {
      sawVoice = true;
      const hellos = s.spoken.slice(-3).map((x) => x.id);
      assert.ok(s.puppets.every((p) => hellos.includes(`ps.hello.${p}`)), `both hellos before a voice ask (${hellos})`);
    }
    await tapPuppet(await asked(s));
    await settle();
  }
  assert.equal(sawVoice, true, 'preschool asks by voice');
  await finished('puppet-stage');
  assert.deepEqual(await score(), [2, 1], 'level 2 saved 2 misses, 1 hint');

  // Level 3 (pre-K): the puppet says its line; the first bubble tap is a free try (the line in that preset, nothing counted);
  // a wrong bubble is a miss and still plays the line that way; the asked bubble moves on. Portrait screenshot with the bubbles; finish 1/0.
  await launch('puppet-stage', 3, 'Mia', 'prek');
  await settle();
  s = await state();
  assert.deepEqual([s.standing.length, s.freeTried, s.ask], [1, false, s.asks[0]]);
  assert.equal(s.spoken.at(-1).id, s.line, 'the puppet said its line');
  await tapBubble('big');
  await settle();
  s = await state();
  assert.deepEqual([s.freeTried, s.misses, s.askIndex], [true, 0, 0], 'the first bubble is a free try');
  assert.equal(s.spoken.at(-1).pitch, (await voiceOf('big')).pitch, 'said the big way');
  const wrong = ['sleepy', 'tiny', 'big'].find((w) => w !== s.ask.way);
  await tapBubble(wrong);
  await settle();
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.askIndex], [1, 0, 0], 'a wrong bubble is one miss');
  assert.equal(s.spoken.at(-1).rate, (await voiceOf(wrong)).rate, 'and still plays the line that way');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('puppet-stage-3-portrait');
  for (let i = 0; i < 4; i++) {
    s = await state();
    assert.equal(s.askIndex, i);
    await tapBubble(s.ask.way);
    await settle();
  }
  await finished('puppet-stage');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');
  log('Puppet Stage 1–3: three pops with hellos in each voice, the oldest down, a drag, curtains and tassel free, Bow 0/0; the other puppet twice (2/1, glow), voice asks after both hellos; free try, a wrong bubble (1/0), portrait bubbles; passed');
}
return { puppetStagePlay };
}
