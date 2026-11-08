import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  async function singBarnPlay() {
    const tapNotes = (n) =>
      page.evaluate(async (n) => {
        for (let i = 0; i < n; i++) {
          kit.tap(512, 300);
          await kit.sleep(130);
        }
      }, n);
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          idx: g.idx,
          total: g.song.length,
          phase: g.phase,
          singer: g.singer,
          order: [...g.order],
          placed: [...g.placed],
        };
      });
    // Each round draws one of ten songs from its seed; relaunch until the round sings the one under test.
    const launchTune = async (level, id) => {
      const seen = [];
      for (let k = 0; k < 60; k++) {
        await launch('sing-along-barn', level);
        seen.push(await page.evaluate(() => neo.scene.game.tune.id));
        if (seen.at(-1) === id) return;
      }
      assert.fail(`no ${id} round in 60 launches: ${seen.join(' ')}`);
    };
    const roundResult = () =>
      page.evaluate(() => {
        const r = kit.store.stats('sing-along-barn').history.at(-1);
        return [r.misses, r.hints];
      });
    // The tunes with their own notes (batch sing-along-barn 1): a Wheels on the Bus round at level 1, then the ten-card
    // chooser upright at level 5, choosing Twinkle. `SING_ONLY=tunes` runs only this part.
    async function tunesPlay() {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(300);
      // Wheels, level 1: "The wheels on the bus go round and round, all through the town" (13), then "The <friend> on the bus says <sound> x3, all through the town" (13); the friend sounds on each.
      await launchTune(1, 'wheels');
      const song = await page.evaluate(() =>
        neo.scene.game.song.map((n) => ({ s: n.syllable, a: n.answers, m: n.midi })),
      );
      assert.equal(song.length, 13 + 13);
      const friend = (await state()).order[0];
      assert.equal(song[14].s, friend, 'the friend is named mid-line');
      assert.equal(song.filter((n) => n.a).length, 3, 'the friend sounds on each of its three sounds');
      await tapNotes(25);
      await page.waitForTimeout(200);
      await tapNotes(1);
      await finished('sing-along-barn');
      assert.deepEqual(await roundResult(), [0, 0]);
      // Level 5 upright: ten song cards in two rows of five, each at least 100 units, none touching, all on screen; the star card sings Twinkle.
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);
      await launch('sing-along-barn', 5);
      await page.waitForTimeout(2000);
      const cards = await page.evaluate(() =>
        neo.scene.game.tuneCards.map((c) => ({
          x: c.x - 110 * c.scale.x,
          y: c.y - 100 * c.scale.y,
          w: 220 * c.scale.x,
          h: 200 * c.scale.y,
        })),
      );
      const view = await page.evaluate(() => ({ w: neo.view.w, h: neo.view.h }));
      assert.equal(cards.length, 10);
      assert.equal(new Set(cards.map((c) => c.y)).size, 2, 'two rows');
      for (const [k, c] of cards.entries()) {
        assert.ok(c.w >= 100 && c.h >= 100, `card ${k} is ${c.w} by ${c.h}`);
        assert.ok(
          c.x >= 0 && c.x + c.w <= view.w && c.y >= 0 && c.y + c.h <= view.h,
          `card ${k} is on screen`,
        );
        for (const d of cards.slice(0, k))
          assert.ok(
            c.x >= d.x + d.w || d.x >= c.x + c.w || c.y >= d.y + d.h || d.y >= c.y + c.h,
            `card ${k} touches another`,
          );
      }
      await screenshot('sing-along-barn-5-ten-cards-portrait');
      await page.evaluate(() => kit.tapOn(neo.scene.game.tuneCards[8]));
      await page.waitForTimeout(1800);
      assert.equal(await page.evaluate(() => neo.scene.game.tune.id), 'twinkle');
      await tapNotes(14);
      await page.waitForFunction(() => neo.scene.game.phase === 'invite', null, { timeout: 5000 });
      await page.waitForTimeout(600);
      for (const a of ['cow', 'pig', 'duck']) {
        await page.evaluate((a) => kit.tapOn(neo.scene.game.friends.get(a), 0, -66), a);
        await page.waitForTimeout(300);
        await tapNotes(14);
        if (a !== 'duck') {
          await page.waitForFunction(() => neo.scene.game.phase === 'invite', null, { timeout: 5000 });
          await page.waitForTimeout(600);
        }
      }
      await finished('sing-along-barn');
      assert.deepEqual(await roundResult(), [0, 0]);
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(300);
      assert.deepEqual(errors, []);
      log(
        'Sing-Along Barn tunes: a Wheels on the Bus round at level 1 (friend named mid-line, three sounds), ten cards in two rows upright at level 5, Twinkle chosen and sung through three verses, one sticker each, no misses or hints',
      );
    }
    if (process.env.SING_ONLY === 'tunes') return tunesPlay();
    // Level 7 *Finish the line* (batch sing-along-barn 2) at toddler, upright: the song stops before each friend's last word
    // and its picture waits by the door; mashing through the pause wobbles the picture, then a touch sings the word.
    // `SING_ONLY=finish` runs only this part.
    async function finishPlay() {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);
      await launch('sing-along-barn', 7, 'Mia', 'toddler');
      const game = () =>
        page.evaluate(() => {
          const g = neo.scene.game;
          return {
            idx: g.idx,
            paused: g.pausedAt !== null,
            picture: g.picture.visible,
            tune: g.tune.id,
            gap: g.plan.gap,
          };
        });
      const gaps = await page.evaluate(() => neo.scene.game.song.flatMap((n, i) => (n.gap ? [i] : [])));
      let g = await game();
      assert.ok(
        ['buns', 'rain', 'itsy', 'twinkle'].includes(g.tune) && g.gap,
        `level 7 sings a gap tune: ${g.tune}`,
      );
      assert.equal(gaps.length, 2, 'a gap in each of the two verses');
      await tapNotes(gaps[0]);
      g = await game();
      assert.deepEqual(
        [g.idx, g.paused, g.picture],
        [gaps[0], true, true],
        'the song waits before the first word, its picture out',
      );
      // Mashing: three fast taps inside the pause only wobble the picture; the taps after it sing the word and go on.
      await tapNotes(3);
      assert.equal((await game()).idx, gaps[0], 'a tap the moment the song stops does not skip the word');
      await tapNotes(6);
      g = await game();
      assert.ok(
        g.idx > gaps[0] && g.idx < gaps[1] && !g.paused,
        `mashing sings the word and carries on (at ${g.idx})`,
      );
      await tapNotes(gaps[1] - g.idx);
      await page.waitForTimeout(600);
      g = await game();
      assert.deepEqual([g.idx, g.paused], [gaps[1], true], "the second friend's verse waits too");
      const box = await page.evaluate(() => {
        const b = neo.scene.game.picture.getBounds();
        return { x: b.x, y: b.y, r: b.x + b.width, b: b.y + b.height, w: neo.view.w, h: neo.view.h };
      });
      assert.ok(
        box.x >= 0 && box.r <= box.w && box.y >= 0 && box.b <= box.h,
        `the picture is on screen: ${JSON.stringify(box)}`,
      );
      await screenshot('sing-along-barn-7-picture-portrait');
      await tapNotes(1);
      await finished('sing-along-barn');
      assert.deepEqual(await roundResult(), [0, 0]);
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(300);
      assert.deepEqual(errors, []);
      log(
        `Sing-Along Barn level 7 at toddler upright (${g.tune}): a pause before each friend's last word with its picture on screen, three fast taps held, then mashing sang through, one sticker, no misses or hints`,
      );
    }
    if (process.env.SING_ONLY === 'finish') return finishPlay();
    // Level 1: the farm picks one animal; every tap is the next note, mashing fast still sings it, and nothing can be wrong.
    await launchTune(1, 'macdonald');
    const stickers = await page.evaluate(() => kit.store.data.stickers.length);
    let st = await state();
    assert.deepEqual([st.phase, st.total, st.order.length], ['sing', 12 + 13, 1]);
    await tapNotes(12);
    st = await state();
    assert.equal(st.idx, 12);
    assert.equal(st.singer, st.order[0], 'the first friend comes out for the first verse');
    await tapNotes(4);
    await page.waitForTimeout(700);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await screenshot('sing-along-barn-1-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    await tapNotes(8);
    st = await state();
    assert.deepEqual(
      [st.idx, st.singer, st.placed],
      [24, st.order[0], []],
      'one note is left of the last "O"',
    );
    await tapNotes(1);
    await finished('sing-along-barn');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1);
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('sing-along-barn').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 0],
    );
    // Hot Cross Buns, level 2: two friends, a six-note opening, then "One a penny, two a penny, hot cross buns" for each; a friend answers on "buns" and has its moment at the door before the next comes out.
    await launchTune(2, 'buns');
    st = await state();
    assert.deepEqual([st.phase, st.total, st.order.length], ['sing', 6 + 2 * 11, 2]);
    await tapNotes(6);
    st = await state();
    assert.equal(st.singer, st.order[0], 'the first friend comes out after the opening');
    await tapNotes(3);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await screenshot('sing-along-barn-2-buns-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    await tapNotes(7);
    st = await state();
    assert.deepEqual(
      [st.idx, st.singer],
      [16, st.order[0]],
      'the last "buns" of the first verse is still to come',
    );
    await tapNotes(1);
    await page.waitForTimeout(150);
    assert.equal((await state()).singer, st.order[0], 'the friend answers at the door first');
    await page.waitForTimeout(900);
    assert.equal((await state()).singer, st.order[1], 'then the second friend comes out');
    await tapNotes(11);
    await finished('sing-along-barn');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('sing-along-barn').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 0],
    );
    // Mary Had a Little Lamb, level 1: a thirteen-note opening, then "little lamb, little lamb, its fleece was white as snow"; the friend answers on the last "lamb".
    await launchTune(1, 'mary');
    assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 13 + 12]);
    await tapNotes(24);
    await page.waitForTimeout(200);
    await tapNotes(1);
    await finished('sing-along-barn');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('sing-along-barn').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 0],
    );
    // Au Clair de la Lune, level 1: an eleven-note opening, then "Prête-moi ta plume, pour écrire un mot" for the friend, who answers on "mot".
    await launchTune(1, 'clair');
    assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 11 + 12]);
    await tapNotes(22);
    await page.waitForTimeout(200);
    await tapNotes(1);
    await finished('sing-along-barn');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('sing-along-barn').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 0],
    );
    // Rain, Rain, Go Away, level 1: a twelve-note opening, then "Rain, rain, go away, we want to play" for the friend, who answers on "play".
    await launchTune(1, 'rain');
    assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 12 + 9]);
    await tapNotes(20);
    await page.waitForTimeout(200);
    await tapNotes(1);
    await finished('sing-along-barn');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('sing-along-barn').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 0],
    );
    // The Itsy Bitsy Spider, level 1: a thirteen-note opening, then "climbed up the water spout" for the friend, who answers on "spout".
    await launchTune(1, 'itsy');
    assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 13 + 6]);
    await tapNotes(18);
    await page.waitForTimeout(200);
    await tapNotes(1);
    await finished('sing-along-barn');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('sing-along-barn').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 0],
    );
    // Bounce High, Bounce Low, level 1: a ten-note opening to Shiloh, then "bounce the ball to the <friend>", who answers on its name.
    await launchTune(1, 'bounce');
    assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 10 + 10]);
    await tapNotes(19);
    await page.waitForTimeout(200);
    await tapNotes(1);
    await finished('sing-along-barn');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('sing-along-barn').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 0],
    );
    // Ring Around the Rosie, level 1: a thirteen-note opening, then "Ashes, ashes, we all fall down" for the friend, who answers on "down".
    await launchTune(1, 'ring');
    assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 13 + 8]);
    await tapNotes(20);
    await page.waitForTimeout(200);
    await tapNotes(1);
    await finished('sing-along-barn');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('sing-along-barn').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 0],
    );
    await tunesPlay();
    // Level 3: she asks two friends in (a second tap on the same friend does nothing), then they sing in the order she chose.
    await launchTune(3, 'macdonald');
    assert.equal((await state()).phase, 'invite');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(700);
    await screenshot('sing-along-barn-3-invite-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    // A friend is touched at its body, a little above its feet.
    for (const a of ['cat', 'cat', 'dog']) {
      await page.evaluate((a) => kit.tapOn(neo.scene.game.friends.get(a), 0, -66), a);
      await page.waitForTimeout(300);
    }
    await page.waitForFunction(
      () =>
        neo.scene.game.phase === 'sing' &&
        neo.scene.game.placed.length === 2 &&
        neo.scene.game.tapLayer.eventMode === 'static',
      null,
      { timeout: 8000 },
    );
    st = await state();
    assert.deepEqual(st.order, ['cat', 'dog']);
    assert.equal(st.total, 12 + 2 * 13);
    assert.equal(
      await page.evaluate(() => ['pig', 'duck', 'cow'].some((a) => neo.scene.game.friends.get(a).visible)),
      false,
      'the friends not asked in have left',
    );
    await screenshot('sing-along-barn-3-invited');
    await tapNotes(12 + 8);
    st = await state();
    assert.equal(st.singer, 'cat');
    await tapNotes(5);
    st = await state();
    assert.deepEqual(
      [st.idx, st.singer],
      [25, 'dog'],
      'the first verse is over: cat goes back to the bottom row and dog comes out',
    );
    await tapNotes(st.total - st.idx - 3);
    // Leave on the last notes: the finale must not fire after the scene is gone.
    await page.evaluate(() => neo.go.land('music-mountain'));
    await scene('LandScene');
    await page.waitForTimeout(900);
    // Level 4: the opening, then she picks who sings each verse; the song only grows by the friend picked, a stray tap while choosing does nothing, and the round ends after the third verse.
    await launchTune(4, 'macdonald');
    const stickers4 = await page.evaluate(() => kit.store.data.stickers.length);
    st = await state();
    assert.deepEqual([st.phase, st.total, st.order.length], ['sing', 12, 0]);
    await tapNotes(12);
    await page.waitForFunction(
      () => neo.scene.game.phase === 'invite' && neo.scene.game.tapLayer.eventMode === 'none',
      null,
      { timeout: 5000 },
    );
    await page.waitForTimeout(600);
    assert.equal(
      await page.evaluate(() =>
        ['cow', 'pig', 'duck', 'cat', 'dog'].every((a) => neo.scene.game.friends.get(a).visible),
      ),
      true,
      'all five friends are offered first',
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(700);
    await screenshot('sing-along-barn-4-pick-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await tapNotes(2);
    assert.equal((await state()).idx, 12, 'a tap anywhere while choosing does not sing');
    await page.evaluate(() => kit.tapOn(neo.scene.game.friends.get('duck'), 0, -66));
    await page.waitForTimeout(300);
    st = await state();
    assert.deepEqual([st.phase, st.order, st.singer, st.total], ['sing', ['duck'], 'duck', 25]);
    await tapNotes(13);
    await page.waitForFunction(() => neo.scene.game.phase === 'invite', null, { timeout: 5000 });
    await page.waitForTimeout(700);
    assert.equal(
      await page.evaluate(() =>
        ['cow', 'pig', 'cat', 'dog'].every((a) => neo.scene.game.friends.get(a).visible),
      ),
      true,
      'the four friends not yet chosen are offered',
    );
    await page.evaluate(() => kit.tapOn(neo.scene.game.friends.get('duck'), 0, -66));
    await page.waitForTimeout(300);
    assert.equal((await state()).phase, 'invite', 'a friend who has sung only says hello');
    await page.evaluate(() => kit.tapOn(neo.scene.game.friends.get('cat'), 0, -66));
    await page.waitForTimeout(300);
    st = await state();
    assert.deepEqual([st.phase, st.order, st.singer, st.total], ['sing', ['duck', 'cat'], 'cat', 38]);
    await tapNotes(13);
    await page.waitForFunction(() => neo.scene.game.phase === 'invite', null, { timeout: 5000 });
    await page.waitForTimeout(700);
    await page.evaluate(() => kit.tapOn(neo.scene.game.friends.get('pig'), 0, -66));
    await page.waitForTimeout(300);
    st = await state();
    assert.deepEqual([st.phase, st.order, st.total], ['sing', ['duck', 'cat', 'pig'], 51]);
    await tapNotes(13);
    await finished('sing-along-barn');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers4 + 1);
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('sing-along-barn').history.at(-1);
        return [r.misses, r.hints];
      }),
      [0, 0],
    );
    assert.deepEqual(errors, []);
    log(
      'Sing-Along Barn: levels 1, 3 and 4 (Old MacDonald) and Hot Cross Buns, Mary Had a Little Lamb and Ring Around the Rosie rounds, the eight-card chooser upright at level 5, one sticker with no misses or hints, tap-per-note song order, chosen friends in her order (all at once, then one verse at a time), portrait and leaving mid-song passed',
    );
  }

  return { singBarnPlay };
}
