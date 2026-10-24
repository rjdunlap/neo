import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, chooserEnter, screenshot, finished, memory }) {
async function couchPlay() {
  await page.addInitScript(() => {
    window.couchPads = [];
    Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true });
  });
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  // Full entry with keyboard; no developer route is needed.
  await chooserEnter(); await scene('CouchScene');
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter', { delay: 120 }); // held across a frame: the scene samples input once per frame
  // A trip starts with a choice: together (shared lanterns) or face-off (a winner at each stop).
  await page.locator('[data-mode]').first().waitFor();
  assert.deepEqual(await page.locator('[data-mode]').evaluateAll(n => n.map(x => x.dataset.mode)), ['together', 'faceoff', 'course']);
  await screenshot('couch-mode-choice');
  await page.keyboard.press('Enter', { delay: 120 });
  await page.locator('[data-game]').first().waitFor();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).party.mode), 'together');
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  await makePads(); await page.waitForTimeout(150);
  const press = async (button, player = 0) => {
    await page.evaluate(({button, player}) => { couchPads[player].buttons[button] = { pressed: true, value: 1 }; }, {button, player});
    await page.waitForTimeout(100);
    await page.evaluate(({button, player}) => { couchPads[player].buttons[button] = { pressed: false, value: 0 }; }, {button, player});
    await page.waitForTimeout(100);
  };
  const menu = async () => {
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'menu');
    await page.waitForTimeout(400);
  };
  const names = { 'penguin-slide': 'Penguin Slide', 'bouncy-launch': 'Bouncy Launch', 'bounce-back': 'Bounce Back', 'memory-match': 'Memory Match', 'rhythm-neighbors': 'Rhythm Neighbors' };
  const pick = async id => {
    await menu();
    for (let i = 0; i < 10; i++) {
      if (await page.evaluate(id => document.activeElement?.dataset.game === id, id)) break;
      await press(15);
    }
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.game), id);
    await press(0);
    await page.waitForFunction(() => !neo.switching && ['intro', 'card', 'game'].includes(neo.scene.screen));
  };
  // The first time a game is chosen it is explained: name, goal, controller diagram and a bot playing a real round.
  const explained = async id => {
    assert.equal(await page.locator('.couch-how-screen h1').innerText(), names[id]);
    assert.equal(await page.locator('.couch-how-screen svg.pad').count(), 1, 'controller diagram');
    assert.ok(await page.locator('.couch-rows li').count() >= 1, 'control rows');
    assert.ok((await page.locator('.couch-goal').innerText()).length > 20, 'goal sentence');
    await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 20000 });
    assert.ok(await page.locator('.pad .on').count() >= 1, 'the diagram lights with what the bot presses');
    await screenshot(`couch-intro-${id}`);
    // The bot finishes a real round through the same control() path a controller uses.
    await page.waitForFunction(() => neo.scene.demo?.done === true, null, { timeout: 60000 });
    assert.equal(await page.evaluate(() => neo.scene.screen), 'intro');
    assert.equal(errors.length, 0, errors.join('\n'));
  };
  let looked = false;
  const choose = async id => {
    await pick(id);
    let screen = await page.evaluate(() => neo.scene.screen);
    if (screen === 'intro') {
      await explained(id);
      if (!looked) {
        // Back is "never mind": the game is unchosen and nothing is marked explained.
        looked = true;
        await press(1);
        await menu();
        assert.equal(await page.getByRole('button', { name: /^Resume / }).count(), 0);
        assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).seen), []);
        await pick(id);
        assert.equal(await page.evaluate(() => neo.scene.screen), 'intro');
        await page.waitForTimeout(450); // a new scene ignores input for its first moments
      }
      await press(0);
      assert.ok((await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).seen)).includes(id), 'Play marks the game explained');
    } else assert.equal(screen, 'card', 'an explained game shows a name card');
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(450);
    return screen;
  };
  // A bot plays the real round through control(), at the level the trip actually schedules.
  const botRound = () => page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 90000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish its round');
  });
  // Bounce Back with two controllers connected: the pet no longer fills in for the left paddle (a second player is
  // there), so a bot that only plays the right one rallies badly. Drive both paddles through the sticks instead.
  const twoPaddleRound = async () => {
    await makePads(); await page.waitForTimeout(150);
    await page.evaluate(async () => {
      const g = neo.scene.game, b = g.box;
      const { predictY } = await import('/src/games/bounce-back/logic.ts');
      const start = performance.now();
      while (!g.finished && neo.scene.game === g && performance.now() - start < 90000) {
        for (const [i, side] of ['right', 'left'].entries()) {
          const face = side === 'right' ? b.x1 - 46 : b.x0 + 46;
          const target = predictY(g.ball.x, g.ball.y, g.ball.vx, g.ball.vy, face, b.y0 + 26, b.y1 - 26);
          const delta = target - g.targets[side];
          couchPads[i].axes[1] = Math.abs(delta) < 10 ? 0 : Math.sign(delta);
        }
        await kit.sleep(16);
      }
      couchPads[0].axes[1] = couchPads[1].axes[1] = 0;
      if (!g.finished) throw new Error('two-paddle rally did not finish');
    });
  };
  // A face-off stop at Bounce Back: Player 1 aims away from the other paddle while Player 2 holds still, so the first to five goals is Player 1's.
  const duelRound = async () => {
    await makePads(); await page.waitForTimeout(150);
    await page.evaluate(async () => {
      const g = neo.scene.game, b = g.box;
      if (!g.versus) throw new Error('a face-off stop is not a versus round');
      const { predictY, paddleForLanding, farWall } = await import('/src/games/bounce-back/logic.ts');
      const start = performance.now();
      while (!g.finished && neo.scene.game === g && performance.now() - start < 120000) {
        const geo = g.aim(g.speed());
        const arrive = predictY(g.ball.x, g.ball.y, g.ball.vx, g.ball.vy, geo.faceX, geo.top, geo.bottom);
        const want = g.ball.vx > 0 ? paddleForLanding(arrive, farWall(g.paddles.left, geo), geo).y : (b.y0 + b.y1) / 2;
        const delta = want - g.targets.right;
        couchPads[0].axes[1] = Math.abs(delta) < 10 ? 0 : Math.sign(delta);
        await kit.sleep(16);
      }
      couchPads[0].axes[1] = couchPads[1].axes[1] = 0;
      if (!g.finished) throw new Error('the face-off did not finish');
    });
  };
  await screenshot('couch-chooser');
  const order = await page.locator('[data-game]').evaluateAll(nodes => nodes.map(n => n.dataset.game));
  // Offers survive a reload and the existing child save remains unchanged.
  await page.reload(); await ready(); await chooserEnter(); await menu();
  assert.deepEqual(await page.locator('[data-game]').evaluateAll(nodes => nodes.map(n => n.dataset.game)), order);
  await makePads(); await page.waitForTimeout(150);
  await page.setViewportSize({ width: 768, height: 1024 });
  await screenshot('couch-chooser-portrait');
  assert.equal(await page.evaluate(() => document.querySelector('.couch').scrollWidth > window.innerWidth), false);
  await page.setViewportSize({ width: 1024, height: 768 });

  const ids = ['penguin-slide', 'bouncy-launch', 'bounce-back', 'penguin-slide', 'bounce-back', 'bouncy-launch'];
  for (const [stop, id] of ids.entries()) {
    await choose(id);
    if (stop === 0) {
      const before = await page.evaluate(() => JSON.stringify(neo.scene.game.puzzle));
      await page.reload(); await ready(); await chooserEnter(); await menu();
      await page.getByRole('button', { name: 'Resume Penguin Slide', exact: true }).click();
      await page.waitForFunction(() => !neo.switching && neo.scene.game && !neo.scene.game.busy);
      assert.equal(await page.evaluate(() => JSON.stringify(neo.scene.game.puzzle)), before);
      await makePads(); await page.waitForTimeout(150);
    }
    if (id === 'penguin-slide') {
      if (stop === 0) {
        // Wander to the supported hint, then undo through the controller adapter.
        for (let k = 0; k < 15; k++) {
          await page.waitForFunction(() => !neo.scene.game.busy);
          const dir = await page.evaluate(async () => {
            const g = neo.scene.game; if (g.hinting) return -1;
            const S = await import('/src/games/penguin-slide/logic.ts');
            return [0,1,2,3].find(d => { const s = S.slide(g.puzzle, g.at, d); return s.passed.length && (g.have | S.eaten(g.puzzle, s.passed)) !== (1 << g.puzzle.fish.length) - 1; }) ?? -1;
          });
          if (dir < 0) break;
          await press([15, 13, 14, 12][dir]);
        }
        await page.waitForFunction(() => !neo.scene.game.busy);
        assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
        const history = await page.evaluate(() => neo.scene.game.history.length);
        await press(2); await page.waitForTimeout(300);
        assert.equal(await page.evaluate(() => neo.scene.game.history.length), history - 1);
      }
      if (stop === 3) await botRound();
      else for (let move = 0; move < 70; move++) {
        await page.waitForFunction(() => neo.scene.screen !== 'game' || !neo.scene.game.busy || neo.scene.game.finished, null, {timeout:20000});
        if (await page.evaluate(() => neo.scene.screen !== 'game' || neo.scene.game.finished)) break;
        const dir = await page.evaluate(async () => { const S = await import('/src/games/penguin-slide/logic.ts'); const g = neo.scene.game; return S.solve(g.puzzle, g.at, g.have, g.blocks).first; });
        await press(dir < 0 ? 2 : [15,13,14,12][dir]);
        await page.waitForTimeout(300);
      }
    } else if (id === 'bouncy-launch') {
      const shot = async target => {
        await page.waitForFunction(() => !neo.scene.game.flying);
        // Feedback steers only the synthetic stick; it never sets game state or calls launch().
        await page.evaluate(async target => {
          const g = neo.scene.game;
          const start = performance.now();
          while (Math.abs(g.controllerPower - target) > 0.012 && performance.now() - start < 5000) {
            couchPads[0].axes[0] = Math.sign(target - g.controllerPower);
            await kit.sleep(16);
          }
          couchPads[0].axes[0] = 0;
        }, target);
        await press(0);
        await page.waitForFunction(() => !neo.scene.game?.flying || neo.scene.screen !== 'game', null, {timeout:20000});
      };
      if (stop === 1) {
        const off = await page.evaluate(() => neo.scene.game.targets[0] === 0 ? .95 : .02);
        await shot(off); await shot(off);
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2,1]);
        await screenshot('couch-launch-hint');
      }
      if (stop === 5) await botRound();
      else for (let n = 0; n < 3; n++) {
        const target = await page.evaluate(() => (neo.scene.game.targets[neo.scene.game.shot] + .5) / 5);
        await shot(target);
      }
    } else {
      if (stop === 2) {
        await page.evaluate(() => { couchPads[0].axes[1] = 1; couchPads[1].axes[1] = -1; });
        await page.waitForTimeout(300);
        assert.ok(await page.evaluate(() => neo.scene.game.paddles.right > neo.scene.game.paddles.left + 150));
        await page.evaluate(() => { couchPads[0].axes[1] = couchPads[1].axes[1] = 0; });
        await press(9);
        assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
        const ball = await page.evaluate(() => ({ ...neo.scene.game.ball }));
        await page.waitForTimeout(450);
        assert.deepEqual(await page.evaluate(() => ({ ...neo.scene.game.ball })), ball);
        // "How to play" is available from pause, leaves the paused round untouched, and Start returns to the pause menu.
        await page.getByRole('button', { name: 'How to play', exact: true }).click();
        await page.waitForFunction(() => neo.scene.screen === 'howto');
        assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Bounce Back');
        assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.couch-game-help')).display), 'none');
        await screenshot('couch-howto-from-pause');
        await page.waitForTimeout(450);
        assert.deepEqual(await page.evaluate(() => ({ ...neo.scene.game.ball })), ball);
        await press(9);
        await page.waitForFunction(() => neo.scene.screen === 'pause');
        assert.equal(await page.locator('.couch-how-screen').count(), 0);
        await screenshot('couch-paused'); await press(0);
        await page.evaluate(() => window.dispatchEvent(new Event('blur')));
        assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
        await press(0);
        await page.evaluate(() => { couchPads[0] = null; });
        await page.waitForTimeout(150);
        assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
        await makePads(); await page.waitForTimeout(150); await press(0);
      }
      await page.evaluate(async (keyboard) => {
        const g = neo.scene.game, b = g.box;
        const { predictY } = await import('/src/games/bounce-back/logic.ts');
        const down = new Set();
        const key = (code, pressed) => { if (pressed === down.has(code)) return; if (pressed) down.add(code); else down.delete(code); window.dispatchEvent(new KeyboardEvent(pressed ? 'keydown' : 'keyup', {code, bubbles:true})); };
        if (keyboard) { couchPads[0].axes[1] = couchPads[1].axes[1] = 0; }
        const start = performance.now();
        while (!g.finished && performance.now() - start < 120000) {
          for (const [i, side] of ['right','left'].entries()) {
            const face = side === 'right' ? b.x1 - 46 : b.x0 + 46;
            let target = predictY(g.ball.x, g.ball.y, g.ball.vx, g.ball.vy, face, b.y0 + 26, b.y1 - 26);
            if (!keyboard && side === 'right' && g.misses < 2) target = target < (b.y0+b.y1)/2 ? b.y1 : b.y0;
            const delta = target - g.targets[side], y = Math.abs(delta) < 10 ? 0 : Math.sign(delta);
            if (keyboard) { key(i === 0 ? 'ArrowUp' : 'KeyW', y < 0); key(i === 0 ? 'ArrowDown' : 'KeyS', y > 0); }
            else couchPads[i].axes[1] = y;
          }
          await kit.sleep(16);
        }
        for (const code of [...down]) key(code, false);
        couchPads[0].axes[1] = couchPads[1].axes[1] = 0;
        if (!g.finished) throw new Error('controller rally did not finish');
      }, stop === 4);
    }
    await menu();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
    assert.equal(saved.party.rounds.length, stop + 1);
    assert.equal(Object.values(saved.stickers).reduce((n,s) => n + s.count, 0), stop + 1);
    assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'couch play leaves all child state unchanged');
    log(`Couch stop ${stop+1}: ${id}, controller/keyboard completion, separate sticker and lantern saved`);
  }
  // The finale: lanterns rise and light, the six stops are recapped, the first finished trip earns the keepsake once.
  await page.waitForFunction(() => neo.scene.finaleStage?.lanterns.length === 6 && neo.scene.finaleStage.lanterns.every(l => l.lit), null, { timeout: 20000 });
  assert.equal(await page.locator('.couch-stop').count(), 6, 'the finale recaps six stops');
  assert.equal(await page.locator('.couch-score').count(), 0, 'a Together trip has no scoreboard');
  assert.equal(await page.locator('.couch-keepsake.fresh strong').innerText(), 'Lantern Night');
  assert.equal(await page.evaluate(async () => { const { swatch } = await import('/src/art/palette.ts'); return neo.scene.finaleStage.lanterns.every(l => l.color.fill === swatch.yellow.fill); }), true, 'every Together lantern is gold');
  assert.ok((await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).keepsake.at)) > 0, 'the keepsake is dated');
  await screenshot('couch-trip-complete');
  // Finishing a trip opens the next tier of games, and says which.
  assert.match(await page.locator('.couch-unlocked').innerText(), /Memory Match, Rhythm Neighbors/);
  assert.match(await page.locator('.couch-teaser').innerText(), /Finish another trip to open 2 more games/, 'the next tier is announced by size, not by name');
  const saved = await page.evaluate(() => localStorage.getItem('neo.couch.v1'));
  assert.equal(JSON.parse(saved).trips, 1);
  await page.reload(); await ready(); await chooserEnter(); await menu();
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), saved, 'reload never duplicates trip or stickers');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'settings'); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Couch backup', exact: true }).click();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download couch backup', exact: true }).click();
  await (await download).saveAs('test-results/couch-backup.json');
  await page.locator('input[type=file]').setInputFiles('test-results/couch-backup.json'); await menu();
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), saved, 'backup round trip');
  await page.getByRole('button', { name: 'Back to start', exact: true }).click(); await scene('ChooserScene');
  await makePads(); await page.waitForTimeout(150); await press(0); // suppressed until release on first observation
  if (await page.evaluate(() => neo.scene.constructor.name === 'ChooserScene')) await press(0);
  await menu();
  assert.deepEqual(errors, []);
  log('Couch: six stops, two puzzle levels, launch misses/hints, two independent paddles, pause/blur/disconnect/reconnect, portrait, child isolation, seeded resume, backup and controller entry from the chooser passed');

  // A face-off trip: each player plays their own board, a reload between turns changes nothing,
  // equal scores tie, and a team game scores for both. Two stops are enough to prove the rules.
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const stickers = async () => Object.values((await stored()).stickers).reduce((n, s) => n + s.count, 0);
  await makePads(); await page.waitForTimeout(150);
  const stickersBefore = await stickers();
  await page.getByRole('button', { name: 'Start another trip', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'mode');
  await page.locator('[data-mode="faceoff"]').click();
  await menu();
  assert.equal((await stored()).party.mode, 'faceoff');
  assert.equal((await stored()).trips, 1, 'starting another trip keeps the trips already finished');

  // Two more games are open now: three of the five are offered, the new ones are marked, and Shuffle is free.
  const offeredIds = () => page.locator('[data-game]').evaluateAll(n => n.map(x => x.dataset.game));
  const offeredNow = await offeredIds();
  assert.equal(offeredNow.length, 3);
  assert.equal(await page.locator('.couch-new').count(), offeredNow.filter(id => ['memory-match', 'rhythm-neighbors'].includes(id)).length, 'NEW marks only unexplained unlocked games');
  assert.equal(await page.getByRole('button', { name: 'Shuffle the choices', exact: true }).count(), 1);
  await screenshot('couch-unlocked-chooser');
  await page.reload(); await ready(); await chooserEnter(); await menu();
  await makePads(); await page.waitForTimeout(150);
  assert.deepEqual(await offeredIds(), offeredNow, 'a reload shows the same three');
  const offer = async id => {
    for (let i = 0; i < 25 && !(await offeredIds()).includes(id); i++) {
      await page.getByRole('button', { name: 'Shuffle the choices', exact: true }).click();
      await page.waitForTimeout(450);
    }
    assert.ok((await offeredIds()).includes(id), `${id} can be offered`);
  };
  const reshuffled = async () => { const now = await offeredIds(); await page.reload(); await ready(); await chooserEnter(); await menu(); await makePads(); await page.waitForTimeout(150); assert.deepEqual(await offeredIds(), now, 'shuffled choices survive a reload'); };
  await offer('penguin-slide'); await reshuffled();

  await choose('penguin-slide');
  const firstBoard = await page.evaluate(() => JSON.stringify(neo.scene.game.puzzle));
  assert.match(await page.locator('.couch-hud strong').innerText(), /Player 1/);
  await botRound();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'turn');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Player 2, you’re up!');
  assert.equal((await stored()).party.rounds.length, 0, 'one turn does not settle the stop');
  assert.ok((await stored()).party.turn, 'the first turn is kept');
  assert.equal(await stickers(), stickersBefore, 'no sticker until the stop is settled');
  await screenshot('couch-turn-card');
  // How to play is on the turn card too, and Back returns to it with the first player's turn still kept.
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'intro');
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'turn');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Player 2, you’re up!');
  assert.ok((await stored()).party.turn, 'looking at How to play keeps the first turn');

  // Leave and come back between the two turns.
  await page.reload(); await ready(); await chooserEnter(); await menu();
  await makePads(); await page.waitForTimeout(150);
  await page.getByRole('button', { name: /^Resume Penguin Slide · Player 2/ }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'turn');
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(450);
  assert.notEqual(await page.evaluate(() => JSON.stringify(neo.scene.game.puzzle)), firstBoard, 'the second player has a fresh board');
  assert.match(await page.locator('.couch-hud strong').innerText(), /Player 2/);
  await botRound();
  await menu();
  let save = await stored();
  assert.equal(save.party.rounds.length, 1);
  assert.equal(save.party.turn, null);
  assert.deepEqual(save.party.rounds[0].scores, [0, 0], 'the solver bot takes no extra slides');
  assert.equal(save.party.rounds[0].winner, 'tie');
  assert.equal(await stickers(), stickersBefore + 1, 'one sticker for the stop, not one per turn');
  assert.match(await page.locator('.couch-result').innerText(), /Player 1: 0, Player 2: 0 .*a tie, you both score a point/);
  await screenshot('couch-faceoff-result');

  await offer('bounce-back');
  await choose('bounce-back');
  await duelRound();
  await menu();
  save = await stored();
  assert.equal(save.party.rounds[1].winner, 0);
  assert.equal(save.party.rounds[1].scores[0], 5);
  assert.ok(save.party.rounds[1].scores[1] < 5);
  assert.match(await page.locator('.couch-tally').innerText(), /Player 1: 2 · Player 2: 1/);
  assert.equal(await stickers(), stickersBefore + 2);

  // A face-off on one shared board: the players alternate, a match earns another turn, and both see the same cards.
  await offer('memory-match');
  assert.equal(await page.locator('.couch-card-memory-match .couch-new').count(), 1, 'a new game is marked until it has been explained');
  await choose('memory-match');
  assert.match(await page.locator('.couch-hud strong').innerText(), /Memory Match/);
  await screenshot('couch-memory-faceoff');
  await botRound();
  await menu();
  save = await stored();
  const memory = save.party.rounds[2];
  assert.equal(memory.id, 'memory-match');
  assert.equal(memory.scores[0] + memory.scores[1], 6, 'every pair is won by someone');
  assert.equal(memory.winner, memory.scores[0] === memory.scores[1] ? 'tie' : memory.scores[0] > memory.scores[1] ? 0 : 1);
  assert.equal(await stickers(), stickersBefore + 3);
  assert.ok(save.seen.includes('memory-match'));

  // A team stop in a newly opened game, played on the beat by its bot.
  await offer('rhythm-neighbors');
  await choose('rhythm-neighbors');
  await botRound();
  await menu();
  save = await stored();
  assert.equal(save.party.rounds[3].winner, 'team');
  assert.equal(await stickers(), stickersBefore + 4);
  await page.reload(); await ready(); await chooserEnter(); await menu();
  assert.equal(await page.locator('.couch-new').count(), 0, 'nothing is new once both have been explained');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'face-off play leaves all child state unchanged');
  // A finished face-off trip: a scoreboard, lanterns in the colors of whoever took each stop, and nobody named a loser.
  const rounds = [['penguin-slide', 0], ['bouncy-launch', 1], ['bumper-garden', 'team'], ['penguin-slide', 'tie'], ['bouncy-launch', 0], ['bumper-garden', 'team']].map(([id, winner], i) => ({ id, seed: 10 + i, level: id === 'penguin-slide' ? 4 : 3, misses: 0, hints: 0, winner, ...(id === 'bumper-garden' ? {} : { scores: winner === 'tie' ? [1, 1] : winner === 0 ? [0, 2] : [2, 0] }) }));
  await page.evaluate((rounds) => localStorage.setItem('neo.couch.v1', JSON.stringify({ version: 3, trips: 2, stickers: { 'penguin-slide': { count: 3, seed: 5 } }, seen: ['memory-match', 'rhythm-neighbors'], keepsake: { at: 1760000000000 }, party: { seed: 31, mode: 'faceoff', reroll: 0, turn: null, selected: null, rounds } })), rounds);
  await page.reload(); await ready(); await chooserEnter(); await menu();
  await page.waitForFunction(() => neo.scene.finaleStage?.lanterns.every(l => l.lit), null, { timeout: 20000 });
  assert.equal(await page.locator('.couch-score-side').count(), 2);
  assert.deepEqual(await page.locator('.couch-score-side b').allInnerTexts(), ['5', '4'], 'a tie and both team stops score for both players');
  assert.equal(await page.locator('.couch-score-side.lead').count(), 1);
  assert.match(await page.locator('.couch-head .couch-intro').innerText(), /^Player 1 wins 5 to 4, and you both lit all six lanterns!$/);
  assert.equal(await page.locator('.couch-keepsake.fresh').count(), 0, 'the keepsake is only new the first time');
  assert.deepEqual(await page.evaluate(async () => { const { swatch } = await import('/src/art/palette.ts'); const name = (c) => c.fill === swatch.blue.fill ? 'p1' : c.fill === swatch.pink.fill ? 'p2' : c.fill === swatch.yellow.fill ? 'both' : '?'; return neo.scene.finaleStage.lanterns.map(l => name(l.color)); }), ['p1', 'p2', 'both', 'both', 'p1', 'both']);
  assert.doesNotMatch(await page.locator('.couch-sheet').innerText(), /lost|loser/i);
  await screenshot('couch-faceoff-finale');
  // Leaving the finale by starting another trip tears the sky down and nothing is saved by looking at it.
  const before = await page.evaluate(() => localStorage.getItem('neo.couch.v1'));
  await page.getByRole('button', { name: 'Start another trip', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'mode');
  assert.equal(await page.evaluate(() => neo.scene.finaleStage), null);
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), before, 'choosing a mode writes nothing until a mode is chosen');
  assert.deepEqual(errors, []);
  log('Couch face-off and unlocks: unlock announcement, NEW marks, shuffle, separate boards per turn, shared-board alternation, tie and team scoring, one sticker per stop, finale scoreboard and lantern colors, child isolation passed');
}

return { couchPlay };
}
