import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, tap, screenshot, finished }) {
async function picnicStory() {
  const picnic = () => page.waitForFunction(() => neo.scene.constructor.name === 'PicnicScene' && !neo.switching && !neo.scene.busy, null, { timeout: 30000 });
  const story = () => page.evaluate(() => JSON.parse(JSON.stringify(kit.store.picnic)));
  const stickers = () => page.evaluate(() => kit.store.data.stickers.length);
  await page.evaluate(() => { kit.store.data.profile.band = 'prek'; kit.store.data.world.band = 'prek'; kit.store.retellStory(); });
  const before = await stickers();
  // The picnic stands on the island map, open to every age like the places.
  await page.evaluate(() => neo.go.hub()); await scene('MapScene');
  await tap('neo.scene.picnic'); await picnic();
  assert.equal(await page.evaluate(() => neo.scene.puzzle.blankets.length), 3);
  await screenshot('picnic-start');

  // The blanket, right here: the request, two wrong blankets explained, a glow, then Juniper's.
  await tap("neo.scene.requests.find(r => r.step === 'blanket').button");
  const wrong = await page.evaluate(() => { const p = neo.scene.puzzle; return p.blankets.map((_, i) => i).filter((i) => i !== p.target); });
  for (const i of wrong) { await tap(`neo.scene.hung.find(h => h.index === ${i}).node`); await page.waitForTimeout(200); }
  assert.equal(await page.evaluate(() => neo.scene.wrongs), 2);
  assert.ok(await page.evaluate(() => { const p = neo.scene.puzzle; return neo.scene.hung.find((h) => h.index === p.target).node.glow.visible; }), 'Juniper\'s blanket glows');
  await tap('neo.scene.hung.find(h => h.index === neo.scene.puzzle.target).node'); await picnic();
  assert.deepEqual(await story(), { steps: ['blanket'], ended: false, keepsake: false });
  assert.ok(await page.evaluate(() => !!neo.scene.ground && !neo.scene.puzzle), 'the blanket is spread on the grass');
  assert.equal(await stickers(), before, 'the blanket step is not a game round and gives no sticker');

  // Left halfway: a reload resumes with the blanket down and the other two to do.
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.hub()); await scene('MapScene');
  await tap('neo.scene.picnic'); await picnic();
  assert.deepEqual(await story(), { steps: ['blanket'], ended: false, keepsake: false });
  assert.ok(await page.evaluate(() => !!neo.scene.ground && neo.scene.hung.length === 0));
  assert.deepEqual(await page.evaluate(() => neo.scene.requests.map((r) => r.glow.visible)), [false, true, false], 'the next request glows');

  // Sandwiches: a Pet Kitchen round at the story's level, which leaves Pet Kitchen's own level alone.
  const kitchenLevel = await page.evaluate(() => kit.store.stats('pet-kitchen').level);
  await tap("neo.scene.requests.find(r => r.step === 'sandwiches').button");
  await page.waitForFunction(() => neo.scene.constructor.name === 'GameScene' && !neo.switching && neo.scene.mod.id === 'pet-kitchen', null, { timeout: 20000 });
  assert.deepEqual(await page.evaluate(() => [neo.scene.band, neo.scene.level, neo.scene.story]), ['prek', 3, { step: 'sandwiches', level: 3 }]);
  const kitchenRound = async () => {
    await page.waitForTimeout(500);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      kit.tapOn(g.cuts[0]); await kit.sleep(450);
      if (g.pieces.length < g.plates.length) { kit.tapOn(g.recut); await kit.sleep(500); kit.tapOn(g.cuts[1]); await kit.sleep(500); }
      for (let i = 0; i < g.pieces.length; i++) { const p = g.plates[i % g.plates.length].getGlobalPosition(); await kit.dragTo(g.pieces[i].node, { x: p.x, y: p.y + 40 * neo.view.scale }, 18); await kit.sleep(220); }
      kit.tapOn(g.serve);
    });
    await finished('pet-kitchen');
  };
  await kitchenRound();
  assert.deepEqual((await story()).steps, ['blanket', 'sandwiches']);
  assert.equal(await page.evaluate(() => kit.store.stats('pet-kitchen').level), kitchenLevel, 'a story round does not move the game level');
  assert.equal(await stickers(), before + 1);
  // "Again" plays the same story round: one more sticker, nothing done twice.
  const after = (button) => page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }).then(() => page.waitForTimeout(500)).then(() => tap(`neo.scene.after.${button}`));
  await after('again');
  await page.waitForFunction(() => neo.scene.constructor.name === 'GameScene' && !neo.switching && !neo.scene.finished && neo.scene.story?.step === 'sandwiches', null, { timeout: 20000 });
  await kitchenRound();
  assert.deepEqual(await story(), { steps: ['blanket', 'sandwiches'], ended: false, keepsake: false });
  assert.equal(await stickers(), before + 2, 'one sticker per round, and the story adds none');
  // The basket goes back to the picnic, where the plates arrive.
  await after('home');
  await picnic();
  assert.equal(await page.evaluate(() => [neo.scene.from, neo.scene.plates.length].join()), 'sandwiches,4');

  // The journal recaps what's done and its green arrow goes straight to the invitation.
  await tap('neo.scene.journalButton'); await page.waitForTimeout(400);
  assert.deepEqual(await page.evaluate(() => neo.scene.journal.rows.map((r) => !!r.change)), [true, true, false]);
  assert.equal(await page.evaluate(() => !!neo.scene.journal.retell), false);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
  await screenshot('picnic-journal-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  await tap('neo.scene.journal.go');
  await page.waitForFunction(() => neo.scene.constructor.name === 'GameScene' && !neo.switching && neo.scene.mod.id === 'jelly-drums', null, { timeout: 20000 });
  assert.deepEqual(await page.evaluate(() => [neo.scene.level, neo.scene.story.step]), [5, 'invitation']);
  // Two wrong jellies first: help counts in the round's score but reaches the same ending.
  await page.evaluate(async () => {
    const g = neo.scene.game;
    const hit = async (i) => { kit.tapOn(g.jellies[i], 0, -50); await kit.sleep(140); };
    const turn = () => kit.until(() => g.phase === 'turn' || g.phase === 'done', 20000);
    for (let t = 0; t < g.plan.goal; t++) {
      await turn();
      if (t === 0) { for (let k = 0; k < 2; k++) { await turn(); await hit((g.tune[0] + 1) % 5); } await turn(); }
      for (const i of [...g.tune]) await hit(i);
      await kit.until(() => g.phase !== 'turn', 3000);
    }
  });
  await finished('jelly-drums');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('jelly-drums').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
  await after('home');
  // Friends arrive, then the picnic: the song, and Juniper's photo, kept.
  await page.waitForFunction(() => neo.scene.constructor.name === 'PicnicScene' && !!neo.scene.photo, null, { timeout: 40000 });
  await page.waitForTimeout(500);
  await screenshot('picnic-finale');
  await picnic();
  assert.deepEqual(await story(), { steps: ['blanket', 'sandwiches', 'invitation'], ended: true, keepsake: true });
  assert.equal(await stickers(), before + 3);

  // After a reload the picnic is still set, calm, with the photo in the journal and a way to tell it again.
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.picnic()); await picnic();
  assert.deepEqual(await page.evaluate(() => [!!neo.scene.ground, neo.scene.plates.length, neo.scene.friends.length, neo.scene.photo]), [true, 4, 3, null]);
  await tap('neo.scene.journalButton'); await page.waitForTimeout(400);
  assert.deepEqual(await page.evaluate(() => [!!neo.scene.journal.go, !!neo.scene.journal.retell]), [false, true]);
  await screenshot('picnic-journal-done');
  await tap('neo.scene.journal.retell'); await picnic();
  assert.deepEqual(await story(), { steps: [], ended: false, keepsake: true }, 'retelling keeps the photo');
  assert.equal(await page.evaluate(() => neo.scene.hung.length), 3);
  assert.equal(await stickers(), before + 3, 'retelling gives nothing extra');

  // Early school needs the place as well as the stripes.
  await page.evaluate(() => { kit.store.data.profile.band = 'school'; neo.go.picnic(); }); await picnic();
  assert.equal(await page.evaluate(() => neo.scene.puzzle.withPlace), true);
  await tap("neo.scene.requests.find(r => r.step === 'blanket').button");
  const decoy = await page.evaluate(async () => { const { whyNot } = await import('/src/content/picnic.ts'); const p = neo.scene.puzzle; return p.blankets.findIndex((_, i) => whyNot(p, i) === 'place'); });
  await tap(`neo.scene.hung.find(h => h.index === ${decoy}).node`);
  assert.equal(await page.evaluate(() => neo.scene.wrongs), 1, 'a striped blanket in the wrong place is a gentle miss');
  await screenshot('picnic-school');
  await page.evaluate(() => { kit.store.data.profile.band = 'prek'; });
  assert.equal(errors.length, 0, errors.join('\n'));
  log('Windy Picnic: map entry, blanket clues and glow, resume after reload, story rounds at story levels without moving game levels, one sticker per round, journal recap and next arrow, finale and keepsake, reload, retelling, early-school place clue passed');
}

return { picnicStory };
}
