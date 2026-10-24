import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, pickFirst, tap, screenshot, finished, next }) {
/** Welcome a New Friend at the root (RW07 slices 1–3): Continue, the page, the three steps, leaving mid-step, reload, the ending, the bed. */
async function welcomeFlow() {
  await page.goto(new URL('/', process.env.GAME_URL || 'http://127.0.0.1:5173').href); await ready();
  await scene('ChooserScene');
  await page.evaluate(() => {
    kit.store.data.creatures = { owned: [{ id: 'pip0', species: 'sprout', name: 'Clover', look: { color: 'pink', worn: [] }, metAt: 'start' }], companion: 'pip0' };
    kit.store.data.profile.band = 'preschool';
    kit.store.keepCreation({ kind: 'tune', cols: 4, rows: 3, notes: [{ col: 0, row: 0 }, { col: 1, row: 1 }] });
    kit.store.save(); kit.store.flush(); neo.go.start();
  });
  await pickFirst(); await scene('HomeScene');
  const treehouse = await page.evaluate(() => JSON.stringify(kit.store.data.creations));
  const said = () => page.evaluate(async () => {
    const { voice } = await import('/src/audio/voice.ts');
    if (!voice.__said) { const say = voice.say.bind(voice); voice.__said = []; voice.say = (line, ...rest) => { voice.__said.push(line); return say(line, ...rest); }; }
    return voice.__said;
  });
  await said();
  assert.ok(await page.evaluate(() => !!neo.scene.cont), 'Continue is drawn for preschool');
  await tap('neo.scene.cont'); await scene('ProjectScene');
  await page.waitForFunction(() => neo.scene.raised === 'pretty', null, { timeout: 15000 });
  assert.deepEqual((await said()).filter((l) => l.startsWith('welcome.')), ['welcome.invite', 'welcome.ask.pretty']);
  assert.equal(await page.evaluate(() => neo.scene.newcomer.species), 'river');
  // Yummy: Pet Kitchen 2, one wrong cut (halves for four), then quarters.
  const kitchenLevel = await page.evaluate(() => kit.store.stats('pet-kitchen').level);
  await tap("neo.scene.cards.find(c => c.step === 'yummy').node"); await page.waitForTimeout(200);
  await tap("neo.scene.cards.find(c => c.step === 'yummy').play");
  await page.waitForFunction(() => neo.scene.constructor.name === 'GameScene' && !neo.switching && neo.scene.mod.id === 'pet-kitchen', null, { timeout: 20000 });
  assert.deepEqual(await page.evaluate(() => [neo.scene.band, neo.scene.level, neo.scene.story, kit.store.data.projects.welcome.band, kit.store.data.projects.welcome.newcomer]), ['preschool', 2, { project: 'welcome', step: 'yummy', level: 2 }, 'preschool', 'river']);
  await page.waitForTimeout(500);
  await page.evaluate(async () => {
    const g = neo.scene.game;
    kit.tapOn(g.cuts[0]); await kit.sleep(450);
    kit.tapOn(g.serve); await kit.sleep(500);
    if (g.misses !== 1) throw new Error(`halves for four should miss once, got ${g.misses}`);
    kit.tapOn(g.recut); await kit.sleep(500); kit.tapOn(g.cuts[1]); await kit.sleep(500);
    for (let i = 0; i < g.pieces.length; i++) { const p = g.plates[i % g.plates.length].getGlobalPosition(); await kit.dragTo(g.pieces[i].node, { x: p.x, y: p.y + 40 * neo.view.scale }, 18); await kit.sleep(220); }
    kit.tapOn(g.serve);
  });
  await finished('pet-kitchen');
  assert.equal(await page.evaluate(() => kit.store.stats('pet-kitchen').level), kitchenLevel, 'a project round does not move the game level');
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }); await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => !!neo.scene.after.next), false, 'no next level in a project round');
  await tap('neo.scene.after.home'); await scene('ProjectScene');
  assert.deepEqual(await page.evaluate(() => kit.store.data.projects.welcome.steps), ['yummy']);
  await page.waitForFunction(() => neo.scene.raised === 'pretty', null, { timeout: 15000 });
  assert.ok((await said()).includes('welcome.done.yummy'));
  // Song (slice 2): Song Maker 2, below the band's range, as the stated exception. A one-note song keeps nothing and hums.
  const songLevel = await page.evaluate(() => kit.store.stats('song-maker').level);
  const playSong = async () => {
    await tap("neo.scene.cards.find(c => c.step === 'song').node"); await page.waitForTimeout(300);
    await tap("neo.scene.cards.find(c => c.step === 'song').play");
    await page.waitForFunction(() => neo.scene.constructor.name === 'GameScene' && !neo.switching && neo.scene.mod.id === 'song-maker', null, { timeout: 20000 });
    assert.deepEqual(await page.evaluate(() => [neo.scene.band, neo.scene.level, neo.scene.game.plan.mode]), ['preschool', 2, 'free']);
    await page.waitForTimeout(600);
  };
  await playSong();
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0, creation: { kind: 'tune', cols: 6, rows: 4, notes: [{ col: 0, row: 0 }] } }));
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }); await page.waitForTimeout(500);
  await tap('neo.scene.after.home'); await scene('ProjectScene');
  await page.waitForFunction(() => neo.scene.raised === 'pretty', null, { timeout: 15000 });
  assert.ok((await said()).includes('welcome.done.song-hum'));
  assert.deepEqual(await page.evaluate(() => [kit.store.data.projects.welcome.steps, kit.store.data.projects.welcome.results.song ?? null]), [['yummy', 'song'], null]);
  // Make it again, tapping the jellies: her tune is kept on the project and shown on the card.
  await playSong();
  const lit = await page.evaluate(async () => {
    const g = neo.scene.game;
    for (let i = 0; i < g.plan.notes; i++) { kit.tapOn(g.beads[(i * 5) % g.beads.length]); await kit.sleep(260); }
    return g.beads.filter((b) => b.lit).length;
  });
  await finished('song-maker');
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 25000 }); await page.waitForTimeout(500);
  await tap('neo.scene.after.home'); await scene('ProjectScene');
  assert.equal(await page.evaluate(() => kit.store.data.projects.welcome.results.song?.notes.length), lit);
  assert.equal(await page.evaluate(() => kit.store.stats('song-maker').level), songLevel, 'the out-of-range song round does not move the game level');
  await page.waitForFunction(async () => (await import('/src/audio/voice.ts')).voice.__said.includes('welcome.done.song'), null, { timeout: 15000 });
  await page.waitForFunction(() => neo.scene.raised === 'pretty', null, { timeout: 15000 });
  await page.waitForTimeout(800);
  await screenshot('welcome-landscape');
  // Pretty: Stamp Studio 3, left by Home mid-round: nothing stored, the page speaks no done line.
  await tap("neo.scene.cards.find(c => c.step === 'pretty').play");
  await page.waitForFunction(() => neo.scene.constructor.name === 'GameScene' && !neo.switching && neo.scene.mod.id === 'stamp-studio', null, { timeout: 20000 });
  assert.equal(await page.evaluate(() => neo.scene.level), 3);
  await page.waitForTimeout(600);
  const home = await page.evaluate(() => { const p = neo.scene.home.getGlobalPosition(); return { x: p.x, y: p.y }; });
  await page.mouse.move(home.x, home.y); await page.mouse.down(); await page.waitForTimeout(900); await page.mouse.up();
  await scene('ProjectScene');
  assert.equal(await page.evaluate(() => neo.scene.from ?? null), null);
  assert.deepEqual(await page.evaluate(() => kit.store.data.projects.welcome.steps), ['yummy', 'song']);
  // Reload: the chooser, Home, Continue, and the unfinished step comes up.
  await page.waitForTimeout(400);
  await page.reload(); await ready(); await scene('ChooserScene');
  await said();
  await pickFirst(); await scene('HomeScene');
  await tap('neo.scene.cont'); await scene('ProjectScene');
  await page.waitForFunction(() => neo.scene.raised === 'pretty', null, { timeout: 15000 });
  await tap("neo.scene.cards.find(c => c.step === 'pretty').play");
  await page.waitForFunction(() => neo.scene.constructor.name === 'GameScene' && !neo.switching && neo.scene.mod.id === 'stamp-studio', null, { timeout: 20000 });
  await page.waitForTimeout(600);
  const made = await page.evaluate(async () => {
    const g = neo.scene.game;
    for (let i = 0; i < 3; i++) { const p = g.paper.toGlobal({ x: 120 + i * 180, y: 130 + (i % 2) * 170 }); kit.tap(p.x, p.y); await kit.sleep(250); }
    const stamps = g.stamps.map((s) => ({ ...s.data }));
    kit.tapOn(g.finish);
    return stamps.length;
  });
  assert.equal(made, 3);
  await finished('stamp-studio');
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 25000 }); await page.waitForTimeout(500);
  await tap('neo.scene.after.home'); await scene('ProjectScene');
  assert.equal(await page.evaluate(() => kit.store.data.projects.welcome.ended), false);
  const w = await page.evaluate(() => kit.store.data.projects.welcome);
  assert.deepEqual(w.steps, ['pretty', 'yummy', 'song']);
  assert.equal(w.results.pretty.stamps.length, 3);
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data.creations)), treehouse, 'the treehouse slots are unchanged');
  // The ending (slice 3): the last step's done line, the newcomer arrives, her tune plays, then the names.
  assert.ok((await said()).includes('welcome.done.pretty'));
  const naming = () => page.waitForFunction(() => neo.scene.constructor.name === 'ProjectScene' && neo.scene.ending === 'naming', null, { timeout: 30000 }).then(() => page.waitForTimeout(400));
  await naming();
  assert.ok((await said()).includes('welcome.here'));
  assert.deepEqual(await page.evaluate(() => [neo.scene.names.map((n) => n.name), neo.scene.cards.some((c) => c.node.visible), neo.scene.arrow.visible]), [['Pebble', 'Ripple', 'Bubbles'], false, false]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await screenshot('welcome-ending-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  // Leaving at the names adopts no one; Continue plays the ending again from the start.
  await tap('neo.scene.home'); await scene('HomeScene');
  assert.deepEqual(await page.evaluate(() => [kit.store.data.projects.welcome.ended, kit.store.data.creatures.owned.length]), [false, 1]);
  await tap('neo.scene.cont'); await scene('ProjectScene');
  await naming();
  await tap('neo.scene.names[1].node');
  assert.deepEqual(await page.evaluate(() => [neo.scene.chosen, neo.scene.arrow.visible]), ['Ripple', true]);
  await tap('neo.scene.arrow'); await scene('HomeScene');
  assert.ok((await said()).includes('welcome.joined'));
  const ripple = await page.evaluate(() => kit.store.data.creatures.owned.find((o) => o.metAt === 'project:welcome'));
  assert.deepEqual([ripple.species, ripple.name], ['river', 'Ripple']);
  assert.deepEqual(await page.evaluate(() => [kit.store.data.projects.welcome.ended, kit.store.data.creatures.companion, kit.store.data.creatures.owned.length, neo.scene.cont]), [true, 'pip0', 2, null]);
  // Creature play: the bed with her picture, and Ripple asleep in it, who wakes to her tune.
  await page.evaluate(() => neo.go.room()); await scene('PlayScene');
  await page.waitForTimeout(500);
  assert.deepEqual(await page.evaluate(() => [!!neo.scene.bed, neo.scene.sleeper?.species, neo.scene.pet.species]), [true, 'river', 'sprout']);
  await page.evaluate(() => kit.tapOn(neo.scene.bed, 0, 55 * neo.view.scale));
  await page.waitForFunction(() => neo.scene.singing, null, { timeout: 5000 });
  await page.waitForFunction(() => !neo.scene.singing, null, { timeout: 20000 });
  await page.evaluate(() => kit.tapOn(neo.scene.bed, 0, -60 * neo.view.scale)); await page.waitForTimeout(300);
  assert.equal((await said()).at(-1), 'welcome.bed');
  await screenshot('welcome-bed-landscape');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data.creations)), treehouse, 'the treehouse slots are still unchanged');
  // Reload: Friends lists Ripple; Come with me makes Ripple the companion, and the bed waits empty.
  await page.waitForTimeout(400);
  await page.reload(); await ready(); await scene('ChooserScene');
  await said();
  await pickFirst(); await scene('HomeScene');
  assert.equal(await page.evaluate(() => neo.scene.cont), null, 'no Continue after the ending');
  await page.evaluate(() => neo.go.project()); await scene('ProjectScene');
  await scene('HomeScene');
  await page.evaluate(() => neo.go.friends()); await scene('FriendsScene');
  assert.equal(await page.evaluate(() => neo.scene.cards.children.length), 2);
  await tap('neo.scene.cards.children[1]');
  assert.equal(await page.evaluate(() => neo.scene.stageFriend.species), 'river');
  await tap('neo.scene.come'); await scene('PlayScene');
  assert.deepEqual(await page.evaluate(() => [neo.scene.pet.species, !!neo.scene.bed, neo.scene.sleeper]), ['river', true, null]);
  await page.evaluate(() => neo.go.hub()); await scene('HomeScene');
  assert.equal(await page.evaluate(() => neo.scene.pet.species), 'river', 'the guide is the newcomer');
  // A pre-K profile hears the pre-K ask and has no bed; a toddler has no Continue.
  await page.evaluate(async () => {
    const { selectPlayer } = await import('/src/app/players.ts');
    await selectPlayer(kit.store.addProfile());
    kit.store.meet('glider', 'Wisp', 'purple', 'start');
    kit.store.data.profile.band = 'prek';
    neo.go.hub();
  });
  await scene('HomeScene');
  assert.equal(await page.evaluate(() => kit.store.data.creatures.owned.some((o) => o.metAt === 'project:welcome')), false);
  await tap('neo.scene.cont'); await scene('ProjectScene');
  await page.waitForFunction(() => neo.scene.raised === 'pretty', null, { timeout: 15000 });
  await tap("neo.scene.cards.find(c => c.step === 'yummy').node"); await page.waitForTimeout(200);
  assert.equal((await said()).at(-1), 'welcome.ask.yummy-prek');
  assert.equal(await page.evaluate(() => neo.scene.newcomer.species), 'river');
  await tap('neo.scene.home'); await scene('HomeScene');
  await page.evaluate(() => neo.go.room()); await scene('PlayScene');
  assert.equal(await page.evaluate(() => neo.scene.bed), null, 'no bed for another profile');
  await page.evaluate(() => { kit.store.data.profile.band = 'toddler'; neo.go.hub(); }); await scene('HomeScene');
  assert.equal(await page.evaluate(() => neo.scene.cont), null, 'no Continue for a toddler');
  assert.equal(errors.length, 0, errors.join('\n'));
  log('Welcome: Continue → invitation → yummy (one wrong cut) → done line → song: one note keeps nothing and hums → song again with tapped jellies, tune kept, level unmoved → pretty left mid-round stores nothing → reload → pretty finished, picture kept on the project, treehouse unchanged → ending: arrival, names; leave at naming adopts no one → Continue replays → Ripple → Home without Continue → bed with picture, Ripple wakes to her tune → reload → Friends → Come with me → guide is Ripple, bed empty; pre-K ask, no bed; toddler has no Continue');
}

return { welcomeFlow };
}
