import assert from 'node:assert/strict';

export async function homeTunes({ page, errors, log, ready, scene, pickFirst, tap, screenshot }) {
  const playRoom = async () => {
    await tap('neo.scene.play');
    await scene('PlayScene');
  };
  const openComparison = async () => {
    await tap('neo.scene.plaque');
    await page.waitForFunction(() => !!neo.scene.comparison);
    await page.evaluate(() => {
      window.tuneLights = [];
      const comparison = neo.scene.comparison;
      for (const key of ['onDisplay', 'otherTune']) {
        const plaque = comparison[key].plaque;
        const light = plaque.lightColumn.bind(plaque);
        plaque.lightColumn = (column) => {
          tuneLights.push([key, column]);
          light(column);
        };
      }
    });
  };
  const lights = () => page.evaluate(() => tuneLights);
  const pitches = () => page.evaluate(() => tunePitches);
  const hear = (key) => tap(`neo.scene.comparison.${key}`);
  const beat = (key, column) =>
    page.waitForFunction(
      ([key, column]) => tuneLights.some(([k, c]) => k === key && c === column),
      [key, column],
      {
        timeout: 5000,
      },
    );
  const record = () =>
    page.evaluate(() =>
      JSON.stringify([
        kit.store.creations,
        kit.store.data.stickers,
        kit.store.data.games,
        kit.store.data.journal,
      ]),
    );

  await page.goto(new URL('/', process.env.GAME_URL || 'http://127.0.0.1:5173').href);
  await ready();
  await scene('ChooserScene');
  await page.evaluate(async () => {
    const { sfx } = await import('/src/audio/sfx.ts');
    const marimba = sfx.marimba.bind(sfx);
    window.tunePitches = [];
    sfx.marimba = (step, gain) => {
      tunePitches.push(step);
      marimba(step, gain);
    };
    window.otherTune = {
      kind: 'tune',
      cols: 8,
      rows: 3,
      notes: [
        { col: 0, row: 2 },
        { col: 2, row: 2 },
        { col: 7, row: 0 },
      ],
    };
    window.displayTune = {
      kind: 'tune',
      cols: 8,
      rows: 3,
      notes: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 4, row: 1 },
        { col: 7, row: 1 },
      ],
    };
    kit.store.meet('sprout', 'Clover', 'pink', 'start');
    kit.store.data.profile.band = 'preschool';
    kit.store.keepCreation(otherTune);
    neo.go.start();
  });
  await pickFirst();
  await scene('HomeScene');
  await playRoom();
  await tap('neo.scene.plaque');
  assert.equal(
    await page.evaluate(() => neo.scene.comparison),
    null,
    'one tune plays straight from the plaque',
  );
  await page.waitForFunction(() => neo.scene.singing);
  await page.waitForFunction(() => !neo.scene.singing, null, { timeout: 12000 });
  assert.equal((await pitches()).length, 3, 'the single-tune shortcut plays its three notes');

  await tap('neo.scene.home');
  await scene('HomeScene');
  await page.evaluate(() => {
    kit.store.keepCreation(displayTune);
    tunePitches.length = 0;
  });
  const before = await record();
  await playRoom();
  await openComparison();
  assert.deepEqual(await pitches(), [], 'opening the panel is silent');
  await tap('neo.scene.home');
  await tap('neo.scene.toy.ball');
  assert.deepEqual(
    await page.evaluate(() => [neo.scene.constructor.name, neo.scene.toy.throws]),
    ['PlayScene', 0],
    'the scrim blocks the room controls',
  );
  await hear('onDisplay');
  await beat('onDisplay', 0);
  await hear('otherTune');
  const switched = await lights();
  assert.deepEqual(switched.at(-1), ['onDisplay', -1], 'switching clears the first grid immediately');
  await beat('otherTune', 0);
  await page.setViewportSize({ width: 768, height: 1024 });
  await screenshot('tune-comparison-portrait');
  await beat('otherTune', 7);
  await page.waitForFunction(() => !neo.scene.comparison.active);
  const finished = await lights();
  assert.deepEqual(
    finished.slice(switched.length),
    [...Array.from({ length: 8 }, (_, i) => ['otherTune', i]), ['otherTune', -1]],
    'only the selected grid advances through its actual columns after switching and rotation',
  );
  const heard = await pitches();
  assert.equal(
    heard.length,
    4,
    'only the first note of the interrupted tune and the three notes of the selected tune sound',
  );
  assert.equal(heard[1], heard[2], 'the second tune repeats its opening pitch after a rest');
  assert.equal(heard[0], heard[3], 'the second tune ends on the first tune’s opening pitch');
  assert.notEqual(heard[0], heard[1], 'the two tunes have different opening pitches');

  await hear('otherTune');
  await page.waitForFunction(
    () => tuneLights.filter(([key, col]) => key === 'otherTune' && col === 0).length === 2,
  );
  await page.keyboard.press('Escape');
  await page.getByRole('dialog', { name: 'Paused' }).waitFor();
  const paused = await lights();
  await page.waitForTimeout(550);
  assert.deepEqual(await lights(), paused, 'pause holds the highlight');
  await page.keyboard.press('Escape');
  await page.getByRole('dialog', { name: 'Paused' }).waitFor({ state: 'hidden' });
  await tap('neo.scene.comparison.close');
  assert.equal(await page.evaluate(() => neo.scene.comparison), null);
  const closed = await lights();
  const notesAtClose = await pitches();
  await page.waitForTimeout(950);
  assert.deepEqual(await lights(), closed, 'closing releases the playback grid');
  assert.deepEqual(await pitches(), notesAtClose, 'closing prevents later notes');
  assert.equal(
    await record(),
    before,
    'listening leaves creations, stickers, progress and journal unchanged',
  );

  await page.setViewportSize({ width: 1024, height: 768 });
  await page.evaluate(() => {
    kit.store.undoCreation('tune');
    neo.go.hub();
  });
  await scene('HomeScene');
  await playRoom();
  await openComparison();
  assert.deepEqual(
    await page.evaluate(() => neo.scene.comparison.onDisplay.tune),
    await page.evaluate(() => otherTune),
    'Undo swaps which tune is on display',
  );
  await hear('onDisplay');
  await beat('onDisplay', 0);
  await page.evaluate(() => neo.go.hub());
  await scene('HomeScene');
  const left = await pitches();
  await page.waitForTimeout(950);
  assert.deepEqual(await pitches(), left, 'leaving the scene prevents later notes');

  await page.evaluate(() => kit.store.takeDownCreation('tune'));
  await playRoom();
  const empty = await record();
  await tap('neo.scene.plaque');
  assert.deepEqual(await page.evaluate(() => [neo.scene.singing, neo.scene.comparison]), [false, null]);
  assert.equal(await record(), empty, 'a taken-down tune stays hidden and saved');
  await tap('neo.scene.home');
  await scene('HomeScene');
  await tap('neo.scene.who');
  await scene('ChooserScene');
  await page.evaluate(async () => {
    const { selectPlayer } = await import('/src/app/players.ts');
    await selectPlayer(kit.store.addProfile());
    kit.store.meet('river', 'Pebble', 'blue', 'start');
    kit.store.data.profile.band = 'preschool';
    neo.go.hub();
  });
  await scene('HomeScene');
  await playRoom();
  await tap('neo.scene.plaque');
  assert.deepEqual(await page.evaluate(() => kit.store.creations.tune), { current: null, previous: null });
  assert.deepEqual(await page.evaluate(() => [neo.scene.singing, neo.scene.comparison]), [false, null]);
  assert.equal(errors.length, 0, errors.join('\n'));
  log(
    'Home tunes: one-tune shortcut, two grids, switch, rotation, replay, pause, close, scene exit, undo, hidden tune and profile isolation',
  );
}
