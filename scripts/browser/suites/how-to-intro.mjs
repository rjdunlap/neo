import { selectNames } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot }) {
/**
 * Every time a game is opened it explains itself: the how-to card fills the screen with a big Play and a Back, the round is not
 * built until Play, and a game with a bot also plays a demonstration round in a window. A story request, "again" after a round
 * and the parent switch skip it. Every game's card fits the screen, with large buttons, in landscape and portrait.
 */
async function howToIntro() {
  const games = await page.evaluate(async () => (await import('/src/games/registry.ts')).GAMES.map((g) => ({ id: g.id, band: g.bands.at(-1) })));
  const ids = selectNames(process.env.HOWTO_ONLY, games.map(g => g.id), 'HOWTO_ONLY');
  const picked = games.filter(g => ids.includes(g.id));
  const view = () => page.evaluate(() => ({ w: neo.view.w, h: neo.view.h }));
  const goGame = async (id, band, story, again) => {
    await page.evaluate(({ id, band, story, again }) => neo.go.game(id, band, story, again), { id, band, story, again });
    await page.waitForFunction((id) => !neo.switching && neo.scene.constructor.name === 'GameScene' && neo.scene.mod.id === id, id);
  };
  const intro = () => page.evaluate(() => ({ open: !!neo.scene.helpCard, intro: !!neo.scene.helpCard?.intro, game: !!neo.scene.game }));
  const demo = () => page.evaluate(() => { const d = neo.scene.helpCard?.intro?.demo; return d ? { bot: d.hasBot, lit: d.lit.size, dead: d.dead, mode: d.root.eventMode, age: d.age } : null; });
  /** The card's buttons: the tap point of each in screen pixels, and its size in logical units (the 100-unit rule is in those). */
  const buttons = () => page.evaluate(() => {
    const out = [], k = neo.view.scale;
    const walk = (o) => { if (o.constructor.name === 'RoundButton') { const b = o.getBounds(), p = o.getGlobalPosition(); out.push({ x: p.x, y: p.y, w: b.width / k, h: b.height / k, bottom: b.y + b.height }); } else for (const c of o.children ?? []) walk(c); };
    walk(neo.scene.helpCard.body); // the card's own buttons, not the ones inside a demonstration's game
    return out.sort((a, b) => a.x - b.x);
  });
  // The card shows a demonstration for a game with a ghost finger (`touchDemo`) and, until it has one, for a couch game (the controller's).
  const { withBot, touchBots, couchBots, textOnly } = await page.evaluate(async () => {
    const { islandDemo } = await import('/src/content/demos.ts'); const { demoFor } = await import('/src/couch/catalog.ts'); const { GAMES } = await import('/src/games/registry.ts');
    const ids = GAMES.filter((g) => islandDemo(g, 1, g.bands[0])).map((g) => g.id);
    return { withBot: ids, touchBots: GAMES.filter((g) => g.touchDemo).map((g) => g.id), couchBots: GAMES.filter((g) => demoFor(g.id)).map((g) => g.id), textOnly: GAMES.find((g) => !ids.includes(g.id))?.id ?? null };
  });
  assert.equal(couchBots.length, 23, 'twenty-three island games can also be played with a controller');
  assert.deepEqual([...withBot].sort(), [...new Set([...touchBots, ...couchBots])].sort(), 'a demonstration for a game with a ghost finger or a controller bot, and for no other');
  await page.evaluate(() => {
    kit.store.data.profile.band = 'toddler'; kit.store.data.profile.name = 'Mia';
    kit.store.data.settings.howToCards = true;
  });

  // --- The card, Play and Back, and no round until Play.
  await goGame('bubble-pop', 'toddler');
  assert.deepEqual(await intro(), { open: true, intro: true, game: false }, 'opening a game shows the how-to card and builds no round');
  assert.equal(!!(await demo()), withBot.includes('bubble-pop'), 'a demonstration exactly when the game has a bot');
  assert.match(await page.evaluate(() => neo.scene.helpCard.info.goal), /./);
  let [back, play] = await buttons();
  assert.ok(play && back && play.w >= 100 && back.w >= 100 && play.w > back.w, `Play and Back are large (Play ${play?.w}, Back ${back?.w}), Play the biggest`);
  assert.ok(play.x > back.x, 'Play sits to the right of Back');
  await page.waitForTimeout(500);
  await screenshot('howto-intro-landscape');
  // A tap on the backdrop (or the empty card) is not Play, not Back and not a way out.
  await page.mouse.click(30, 700); await page.waitForTimeout(300);
  await page.mouse.click(512, 120); await page.waitForTimeout(300);
  assert.deepEqual(await intro(), { open: true, intro: true, game: false }, 'stray taps do nothing');
  // Back leaves without a round, and the next visit shows the card again.
  await page.mouse.click(back.x, back.y); await scene('PlaceScene');
  await goGame('bubble-pop', 'toddler');
  assert.equal((await intro()).open, true, 'the card comes every time');
  [back, play] = await buttons();
  await page.mouse.click(play.x, play.y);
  await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
  // The grown-up tip for the youngest bands appears after Play, centered at the top, and never over the home button.
  await page.waitForFunction(() => !!neo.scene.tip);
  assert.deepEqual(await page.evaluate(() => ({ x: neo.scene.tip.x, y: neo.scene.tip.y, w: neo.view.w })), { x: 512, y: 16, w: 1024 }, 'the tip is placed at the top centre');
  assert.equal(await page.evaluate(() => neo.scene.tip.getBounds().x > 62 + 44), true, 'the tip stays clear of the home button');
  await page.waitForTimeout(900);
  assert.equal(await page.evaluate(() => neo.scene.seconds < 2), true, 'the round clock starts at Play, not when the card opened');
  assert.deepEqual(errors, []);
  // Reading the card is not a hint and changes no progress.
  assert.equal(await page.evaluate(() => kit.store.data.games['bubble-pop']?.plays ?? 0), 0);
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), 0);
  // Holding "?" still opens the plain card in a round (no Play, a check to close it).
  await page.evaluate(() => neo.scene.openHelp());
  assert.deepEqual(await intro(), { open: true, intro: false, game: true }, 'the hold-to-open card is the same card without Play');
  await page.evaluate(() => neo.scene.closeHelp());

  // --- Opened again, from the place, the card comes again; "again" straight after a round does not.
  await goGame('bubble-pop', 'toddler');
  assert.deepEqual(await intro(), { open: true, intro: true, game: false }, 'a game she has played shows its card again');
  await goGame('bubble-pop', 'toddler', undefined, true);
  assert.deepEqual(await intro(), { open: false, intro: false, game: true }, '"again" after a round goes straight to the next round');

  // --- A story request, and the parent switch.
  await goGame('bubble-pop', 'toddler', { step: 'blanket', level: 1 });
  assert.deepEqual(await intro(), { open: false, intro: false, game: true }, 'a story request goes straight to its round');
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await goGame('duck-pond', 'toddler');
  assert.deepEqual(await intro(), { open: false, intro: false, game: true }, 'the switch turns the cards off');
  await page.evaluate(() => { kit.store.data.settings.howToCards = true; neo.go.hub(); }); await scene('MapScene');
  // The switch is on the grown-up panel, kept in the save.
  await page.evaluate(async () => { const { openParentPanel } = await import('/src/parent/panel.ts'); openParentPanel(() => {}); });
  await page.locator('#p-howto').waitFor();
  assert.equal(await page.locator('#p-howto').isChecked(), true, 'the switch shows its setting');
  await page.locator('#p-howto').uncheck();
  assert.equal(await page.evaluate(() => kit.store.data.settings.howToCards), false, 'the switch is saved');
  await page.locator('#p-howto').check();
  assert.equal(await page.evaluate(() => kit.store.data.settings.howToCards), true);
  await page.locator('[data-done]').click(); await scene('MapScene');

  // --- From a place, tapping a game opens its card.
  await page.evaluate(() => neo.go.place('toddler')); await scene('PlaceScene');
  await page.waitForTimeout(700);
  await page.evaluate(() => { const l = neo.scene.landmarks.find((l) => { const x = l.node.getGlobalPosition().x; return x > 250 && x < 800; }); kit.tapOn(l.node, 0, -60); });
  await scene('GameScene');
  assert.equal((await intro()).intro, true, 'a game tapped on the trail shows its card');

  // --- A game with a bot: a demonstration plays in a window, nothing touched reaches it, and it goes when the card does. The controller's
  // highlight is the stopgap for a couch game with no ghost finger yet; the rest of this block is the same for a finger (it waits for the hand).
  // A game that takes only a controller opens couch play from the island, so it has no card to watch here.
  const byTouch = await page.evaluate(async () => { const { GAMES, playsByTouch } = await import('/src/games/registry.ts'); return GAMES.filter(playsByTouch).map((g) => g.id); });
  const controllerOnly = couchBots.filter((id) => !touchBots.includes(id) && byTouch.includes(id));
  const watched = [...controllerOnly.slice(0, 2), ...touchBots.filter((id) => !controllerOnly.includes(id)).slice(0, Math.max(1, 2 - controllerOnly.length))];
  const lit = (id) => controllerOnly.includes(id) ? () => neo.scene.helpCard.intro.demo.lit.size > 0 : () => neo.scene.helpCard.intro.demo.finger?.hand.visible;
  for (const id of watched) {
    const band = await page.evaluate(async (id) => (await import('/src/games/registry.ts')).gameById(id).bands.at(-1), id);
    await goGame(id, band);
    assert.deepEqual(await intro(), { open: true, intro: true, game: false }, `${id}: the card, with no round built`);
    let d = await demo();
    assert.deepEqual({ bot: d.bot, dead: d.dead, mode: d.mode }, { bot: true, dead: false, mode: 'none' }, `${id}: the demonstration is a bot in a window that takes no touches`);
    await page.waitForFunction(lit(id), null, { timeout: 30000 });
    // Taps on the window do nothing: the card stays, and the demonstration's game is not a real one.
    const win = await page.evaluate(() => { const b = neo.scene.helpCard.intro.demo.root.getBounds(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
    await page.mouse.click(win.x, win.y); await page.waitForTimeout(300);
    assert.deepEqual(await intro(), { open: true, intro: true, game: false }, `${id}: a tap in the demonstration window does nothing`);
    await page.waitForTimeout(1500);
    assert.ok((await demo()).age > 1, `${id}: the demonstration keeps running`);
    if (id === watched[0]) { await page.waitForTimeout(500); await screenshot('howto-demo-landscape'); }
    assert.deepEqual(errors, [], `${id}: page errors`);
    // Back takes the demonstration with it.
    await page.evaluate(() => { window.__demo = neo.scene.helpCard.intro.demo; });
    [back, play] = await buttons();
    await page.mouse.click(back.x, back.y); await scene('PlaceScene');
    assert.equal(await page.evaluate(() => window.__demo.dead), true, `${id}: Back destroys the demonstration`);
    // Play too, and the real round is the real game.
    await goGame(id, band);
    await page.evaluate(() => { window.__demo = neo.scene.helpCard.intro.demo; });
    [back, play] = await buttons();
    await page.mouse.click(play.x, play.y);
    await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
    assert.equal(await page.evaluate(() => window.__demo.dead), true, `${id}: Play destroys the demonstration`);
    assert.deepEqual(errors, [], `${id}: page errors after Play`);
  }

  // --- The ghost finger: a drawn hand (a mouse pointer on a desktop) plays the demonstration into the game's own handlers, and leaves nothing behind.
  if (touchBots.length) {
    const ghostId = touchBots.includes('shape-sorter') ? 'shape-sorter' : touchBots[0];
    const lastBand = await page.evaluate(async (id) => (await import('/src/games/registry.ts')).gameById(id).bands.at(-1), ghostId);
    const pointer = () => page.evaluate(() => neo.scene.helpCard.intro.demo.pointer);
    const hushed = () => page.evaluate(() => kit.audio.hushed);
    await goGame(ghostId, lastBand);
    assert.equal(await pointer(), 'mouse', `${ghostId}: the page has only seen a mouse, so the demonstration shows a mouse pointer`);
    assert.equal(await hushed(), true, `${ghostId}: effects sit lower while a demonstration plays`);
    await page.waitForFunction(() => neo.scene.helpCard.intro.demo.finger?.hand.visible, null, { timeout: 30000 });
    assert.equal(await page.evaluate(() => neo.scene.helpCard.intro.demo.root.eventMode), 'none', `${ghostId}: nothing she touches reaches the demonstration's game`);
    // A touch, and the demonstration becomes a finger.
    await page.evaluate(() => kit.tap(30, 700)); await page.waitForTimeout(300);
    assert.equal((await intro()).intro, true, `${ghostId}: a touch on the backdrop does nothing`);
    await goGame(ghostId, lastBand);
    assert.equal(await pointer(), 'finger', `${ghostId}: after a touch the demonstration shows a finger`);
    // The demonstration's drag must leave the one-at-a-time drag lock free: after Play, a real drag works.
    if (ghostId === 'shape-sorter') {
      await page.waitForFunction(() => neo.scene.helpCard.intro.demo.game.placed >= 1, null, { timeout: 40000 });
      const [, go] = await buttons();
      await page.mouse.click(go.x, go.y);
      await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
      assert.equal(await hushed(), false, `${ghostId}: Play gives the effects back`);
      await page.waitForTimeout(600);
      const before = await page.evaluate(() => neo.scene.game.pieces.length);
      await page.evaluate(async () => {
        const g = neo.scene.game, p = g.pieces[0], hole = g.box.holes.find((h) => h.kind === p.kind);
        const to = g.box.toGlobal({ x: hole.x, y: hole.y + 40 }); // a held piece rides 40 units above the finger
        await kit.dragTo(p.view, to);
      });
      await page.waitForFunction((n) => neo.scene.game.pieces.length === n - 1, before, { timeout: 5000 });
      assert.deepEqual(errors, [], `${ghostId}: page errors`);
    } else {
      const [, go] = await buttons();
      await page.mouse.click(go.x, go.y);
      await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
    }
    log(`How-to ghost finger: ${touchBots.length} games with one; ${ghostId} showed a mouse pointer, then a finger after a touch, left effects lowered only while it played, and a real drag worked after Play`);
  }

  // --- Every game's card fits the screen with large buttons, in landscape and portrait, a demonstration in the games that have a bot, and leaving it is clean.

  let tallest = { id: '', bottom: 0 };
  for (const [name, size] of [['landscape', { width: 1024, height: 768 }], ['portrait', { width: 768, height: 1024 }]]) {
    await page.setViewportSize(size); await page.waitForTimeout(400);
    for (const g of picked) {
      // HOWTO_LEVEL=6: measure the card at that level (a pin, so the intro builds it) instead of her saved one.
      if (process.env.HOWTO_LEVEL) await page.evaluate(({ id, level }) => { kit.store.stats(id).pinned = level; }, { id: g.id, level: Number(process.env.HOWTO_LEVEL) });
      await goGame(g.id, g.band);
      const { w, h } = await view();
      const fit = await page.evaluate(() => { const b = neo.scene.helpCard.body.getBounds(); return { x: b.x, y: b.y, r: b.x + b.width, b: b.y + b.height }; });
      assert.ok(fit.x >= -1 && fit.y >= -1 && fit.r <= size.width + 1 && fit.b <= size.height + 1, `${g.id} ${name}: the card fits the screen (${JSON.stringify(fit)} in ${size.width} by ${size.height}; logical ${w} by ${h})`);
      if (fit.b - fit.y > tallest.bottom && !withBot.includes(g.id)) tallest = { id: g.id, bottom: fit.b - fit.y };
      const [b, p] = await buttons();
      assert.ok(b.w >= 100 && p.w >= 100, `${g.id} ${name}: Play and Back are at least 100 units across (${b.w}, ${p.w})`);
      assert.ok(p.bottom <= size.height && b.bottom <= size.height, `${g.id} ${name}: the buttons are on screen`);
      assert.equal((await intro()).game, false, `${g.id}: no round has been built behind the card`);
      const d = await demo();
      assert.equal(!!d, withBot.includes(g.id), `${g.id} ${name}: a demonstration exactly when the game has a bot`);
      if (d) {
        const box = await page.evaluate(() => { const r = neo.scene.helpCard.intro.demo.root, b = r.getBounds(); return { x: b.x, y: b.y, r: b.x + b.width, b: b.y + b.height, w: b.width }; });
        assert.ok(box.x >= 0 && box.y >= 0 && box.r <= size.width + 1 && box.b <= size.height + 1, `${g.id} ${name}: the demonstration window is on screen (${JSON.stringify(box)})`);
        assert.ok(box.w >= 240, `${g.id} ${name}: the demonstration window is big enough to watch (${box.w}px)`);
      }
      assert.deepEqual(errors, [], `${g.id} ${name}: page errors`);
    }
    log(`How-to intro ${name}: ${picked.length} games' cards fit, with large Play and Back and a demonstration window for each of the games with a bot`);
  }
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
  const demoId = watched[0];
  await goGame(demoId, await page.evaluate(async (id) => (await import('/src/games/registry.ts')).gameById(id).bands.at(-1), demoId));
  await page.waitForFunction(lit(demoId), null, { timeout: 30000 });
  await page.waitForTimeout(600);
  await screenshot('howto-demo-portrait');
  if (tallest.id) {
    await goGame(tallest.id, picked.find((g) => g.id === tallest.id).band);
    await page.waitForTimeout(400);
    await screenshot('howto-intro-portrait-tallest');
  }
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  // Turning the screen with the card open keeps it laid out, and Play still starts the round.
  const [, go] = await buttons();
  await page.mouse.click(go.x, go.y);
  await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
  assert.deepEqual(errors, []);
  log(`How-to intro: the card every time with Play and Back, stray taps ignored, a demonstration (touch-proof, destroyed with the card) for the ${withBot.length} games with a bot, "again", a story request and the parent switch skip it, tallest text-only card (${tallest.id}) passed`);
}

return { howToIntro };
}
