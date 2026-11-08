import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function puppetStagePlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('puppet-stage').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () => page.evaluate(() => neo.scene.game.state);
    const settle = async () => {
      await page.waitForTimeout(250);
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 40000 });
      await page.waitForTimeout(150);
    };
    const tapFloor = async (k) => {
      await page.evaluate((k) => {
        const g = neo.scene.game,
          l = g.layoutNow;
        const p = g.floorSurface.toGlobal({
          x: l.stand.min + (0.15 + 0.35 * k) * (l.stand.max - l.stand.min),
          y: l.floorTouch.y,
        });
        kit.tap(p.x, p.y);
      }, k);
      await page.waitForTimeout(500);
    };
    const tapPuppet = async (p) => {
      await page.evaluate((p) => kit.tapOn(neo.scene.game.puppetNodes.get(p), 0, -60), p);
      await page.waitForTimeout(220);
    };
    const tapBubble = async (w) => {
      await page.evaluate((w) => kit.tapOn(neo.scene.game.bubbleNodes.get(w)), w);
      await page.waitForTimeout(220);
    };
    const asked = (s) =>
      page.evaluate(async (s) => {
        const { askedPuppet } = await import('/src/games/puppet-stage/logic.ts');
        return askedPuppet(s.ask, s.puppets);
      }, s);
    const voiceOf = (p) =>
      page.evaluate(async (p) => {
        const { BASE_VOICE, WAY_VOICE } = await import('/src/games/puppet-stage/logic.ts');
        return BASE_VOICE[p] ?? WAY_VOICE[p];
      }, p);
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

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
    assert.deepEqual(
      [hello.pitch, hello.rate],
      [(await voiceOf(first)).pitch, (await voiceOf(first)).rate],
      'in its own voice',
    );
    await tapFloor(2);
    s = await state();
    assert.equal(s.standing.length, 2, 'two puppets stand');
    assert.notEqual(s.standing[1], first);
    await tapFloor(1);
    s = await state();
    assert.equal(s.standing.length, 2, 'a third touch keeps two standing');
    assert.equal(s.standing.includes(first), false, 'the longest-standing one went down');
    assert.deepEqual([s.pops, s.bowShown], [3, true], 'Bow appears after three pops');
    const [xs, mover] = await page.evaluate(() => {
      const g = neo.scene.game;
      const p = g.standing[1];
      return [g.puppetNodes.get(p).x, p];
    });
    await page.evaluate(async (p) => {
      const g = neo.scene.game,
        n = g.puppetNodes.get(p);
      const a = n.toGlobal({ x: 0, y: -60 });
      const b = n.toGlobal({ x: -120, y: -60 });
      await kit.drag(kit.line([a.x, a.y], [b.x, b.y], 12));
    }, mover);
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
    assert.deepEqual(
      [s.curtainsClosed, s.night, s.misses, s.hints],
      [false, true, 0, 0],
      'curtains open again, night backdrop, nothing counted',
    );
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
    assert.deepEqual(
      [s.misses, s.hints, s.glow],
      [2, 1, wanted],
      'the second miss glows the asked puppet: one hint',
    );
    await tapPuppet(wanted);
    await settle();
    s = await state();
    assert.equal(s.askIndex, 1, 'the asked puppet talked and the next ask is open');
    assert.equal(
      s.spoken.find((x) => x.id === `ps.talk.${wanted}`)?.pitch,
      (await voiceOf(wanted)).pitch,
      'it talked in its own voice',
    );
    let sawVoice = false;
    for (let i = 1; i < 4; i++) {
      s = await state();
      assert.equal(s.askIndex, i);
      if (s.ask.kind === 'voice') {
        sawVoice = true;
        const hellos = s.spoken.slice(-3).map((x) => x.id);
        assert.ok(
          s.puppets.every((p) => hellos.includes(`ps.hello.${p}`)),
          `both hellos before a voice ask (${hellos})`,
        );
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
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(800);
    await screenshot('puppet-stage-3-portrait');
    for (let i = 0; i < 4; i++) {
      s = await state();
      assert.equal(s.askIndex, i);
      await tapBubble(s.ask.way);
      await settle();
    }
    await finished('puppet-stage');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');
    log(
      'Puppet Stage 1–3: three pops with hellos in each voice, the oldest down, a drag, curtains and tassel free, Bow 0/0; the other puppet twice (2/1, glow), voice asks after both hellos; free try, a wrong bubble (1/0), portrait bubbles; passed',
    );
  }

  // Levels 4–6, the story cards: drives the puppets with real drags (peek to mark, mark to mark) and taps.
  async function puppetStoryPlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('puppet-stage').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () => page.evaluate(() => neo.scene.game.state);
    const settle = async () => {
      await page.waitForTimeout(250);
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 40000 });
      await page.waitForTimeout(150);
    };
    // Bring a puppet up from its peek (or walk it) to a mark of the place (0 left, 1 right), with a real drag.
    const walk = async (p, place) => {
      await page.evaluate(
        async ([p, place]) => {
          const g = neo.scene.game,
            l = g.layoutNow,
            cast = g.plan.story.cast;
          const standing = g.standing.includes(p);
          const from = standing
            ? g.puppetNodes.get(p).toGlobal({ x: 0, y: -60 })
            : g.peekNodes[cast.indexOf(p)].toGlobal({ x: 0, y: 0 });
          const { freeMark } = await import('/src/games/puppet-stage/logic.ts');
          const others = g.standing.filter((q) => q !== p).map((q) => g.puppetNodes.get(q).x);
          const x = l.marks[place][freeMark(place, l.places[place], others, l) ?? 0];
          const to = g.ctx.stage.toGlobal({ x, y: l.stage.floor - 60 });
          await kit.drag(kit.line([from.x, from.y], [to.x, to.y], 14));
        },
        [p, place],
      );
      await page.waitForTimeout(450);
    };
    const tapPuppet = async (p) => {
      await page.evaluate((p) => kit.tapOn(neo.scene.game.puppetNodes.get(p), 0, -100), p);
      await page.waitForTimeout(250);
    };
    const placeIndex = (name) =>
      page.evaluate((name) => neo.scene.game.plan.story.places.indexOf(name), name);
    const scenes = () => page.evaluate(() => neo.scene.game.plan.scenes);
    const act = async (sc) => {
      await walk(sc.puppet, await placeIndex(sc.place));
      await tapPuppet(sc.puppet);
      await settle();
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 4 (pre-K): three bobs off the card's place are free (the puppet just speaks) and the third glows the scene (one hint);
    // then the scene ticks and the puppets bow: 0/1.
    await launch('puppet-stage', 4, 'Mia', 'prek');
    await settle();
    let s = await state();
    assert.deepEqual(
      [s.level, s.scenes, s.done, s.standing],
      [4, 1, 0, []],
      'one card, the cast waits at the peeks',
    );
    let sc = (await scenes())[0];
    const wrongPlace = 1 - (await placeIndex(sc.place));
    await walk(sc.puppet, wrongPlace);
    s = await state();
    assert.equal(s.standing.includes(sc.puppet), true, 'the drag from the peek raised the puppet');
    assert.notEqual(s.where[sc.puppet], sc.place, 'standing at the other place');
    for (let i = 0; i < 3; i++) {
      await tapPuppet(sc.puppet);
      await settle();
    }
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.done], [0, 1, 0], 'three off-card bobs: no miss, one hint');
    assert.deepEqual(s.storyGlow, { puppet: sc.puppet, place: sc.place }, 'the puppet and its place glow');
    await act(sc);
    await finished('puppet-stage');
    assert.deepEqual(await score(), [0, 1], 'level 4 saved 0 misses, 1 hint');

    // Level 5 (school): the second card's scene acted first is a miss twice (the second glows), then both cards in order: 2/1.
    await launch('puppet-stage', 5, 'Mia', 'school');
    await settle();
    const two = await scenes();
    // Card 2's puppet is the other cast puppet in every story; bring it to its place and bob it before card 1.
    await walk(two[1].puppet, await placeIndex(two[1].place));
    await tapPuppet(two[1].puppet);
    await settle();
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.done], [1, 0, 0], 'acting card 2 first is one miss');
    await tapPuppet(two[1].puppet);
    await settle();
    s = await state();
    assert.deepEqual([s.misses, s.hints], [2, 1], 'the second early bob glows card 1: one hint');
    assert.deepEqual(s.storyGlow, { puppet: two[0].puppet, place: two[0].place });
    await act(two[0]);
    s = await state();
    assert.deepEqual([s.done, s.storyGlow], [1, null], 'card 1 acted, the glow gone');
    await tapPuppet(two[1].puppet);
    await settle(); // already at its place: now it is the scene
    await finished('puppet-stage');
    assert.deepEqual(await score(), [2, 1], 'level 5 saved 2 misses, 1 hint');

    // Level 6 (school, portrait): act card 1, tap The end early (a miss; the puzzled friend says what it waited for; Bow shows),
    // then the other two scenes to the cheer, and Bow: 1/0.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('puppet-stage', 6, 'Mia', 'school');
    await settle();
    const three = await scenes();
    s = await state();
    assert.deepEqual([s.endShown, s.bowShown], [false, false], 'The end waits for a first scene');
    await act(three[0]);
    s = await state();
    assert.deepEqual([s.done, s.endShown], [1, true], 'after the first scene The end shows');
    await screenshot('puppet-stage-6-portrait');
    await page.evaluate(() => kit.tapOn(neo.scene.game.endNode));
    await settle();
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.ended, s.bowShown, s.done],
      [1, 0, true, true, 1],
      'an early end is one miss and Bow shows',
    );
    await act(three[1]);
    await act(three[2]);
    s = await state();
    assert.deepEqual([s.done, s.endShown, s.bowShown], [3, false, true], 'all three acted: the cheer, Bow');
    await page.evaluate(() => kit.tapOn(neo.scene.game.bowNode));
    await finished('puppet-stage');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [1, 0], 'level 6 saved 1 miss, 0 hints');
    log(
      'Puppet Stage 4–6: three off-card bobs glow (0/1); card 2 first twice (2/1, glow); card 1, an early The end (1/0, Bow), the rest to the cheer; real drags from the peeks; passed',
    );
  }
  return { puppetStagePlay, puppetStoryPlay };
}
