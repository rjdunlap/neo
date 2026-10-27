import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, finished }) {
/** Frozen Discovery D1b: ordinary rounds, pictured choice, normal intro and retained origin. */
async function discoveryDirectNext() {
  assert.equal(process.env.DISCOVERY_ONLY, 'direct-next', 'Use DISCOVERY_ONLY=direct-next');
  const offer = () => page.waitForFunction(() => !neo.switching && neo.scene.resultReady && neo.scene.discovery?.tile.visible);
  const id = () => page.evaluate(() => neo.scene.discovery?.id ?? null);
  const progress = () => page.evaluate(() => JSON.stringify({ games: kit.store.data.games, stickers: kit.store.data.stickers, creations: kit.store.data.creations }));
  const tapChoice = async (key) => {
    await page.evaluate(key => { const b = neo.scene.discovery[key], p = b.toGlobal({ x: 56, y: 56 }); kit.tap(p.x, p.y); }, key);
    await page.waitForTimeout(180);
  };
  const play = async () => {
    // Use the actual card's green Play target, never invoke the game or its finish callback.
    await page.evaluate(() => { const card = neo.scene.helpCard, buttons = card.body.children.flatMap(c => c.children ?? []).filter(c => c.radius === 62); if (buttons.length !== 1) throw Error('Missing intro Play'); kit.tapOn(buttons[0]); });
    await page.waitForFunction(() => !!neo.scene.game && !neo.scene.helpCard);
  };
  const complete = () => page.evaluate(async () => {
    for (let guard = 0; guard < 600 && !neo.scene.finished; guard++) {
      const intent = neo.scene.game.autotouch?.();
      if (intent && 'tap' in intent) { const p = intent.tap.on.toGlobal({ x: intent.tap.x ?? 0, y: intent.tap.y ?? 0 }); kit.tap(p.x, p.y); }
      await kit.sleep(130);
    }
    if (!neo.scene.finished) throw Error('Touch round did not finish');
  });
  const synthetic = async ({ band = 'lap', current = 'bubble-pop', story = false, creation = false } = {}) => {
    await page.evaluate(({ band, current, story, creation }) => {
      kit.store.data.profile.band = band; kit.store.entry.birth = null; kit.store.entry.startBand = band;
      kit.store.data.settings.howToCards = false;
      neo.go.game(current, band, story ? { step: 'blanket', level: 1 } : undefined, false, { land: 'bubble-beach' });
      window.discoveryCreation = creation;
    }, { band, current, story, creation });
    await page.waitForFunction(() => !neo.switching && !!neo.scene.game && !neo.scene.finished);
    await page.evaluate(() => neo.scene.finish({ misses: 2, hints: 1, ...(window.discoveryCreation ? { creation: { kind: 'picture', stamps: [{ kind: 'star', color: 'blue', x: .5, y: .5, size: .2, turns: 0 }] }, discoveries: ['sink-float:rock'] } : {}) }));
    await page.waitForFunction(() => neo.scene.resultReady);
  };
  await page.evaluate(async () => {
    const { discoveryMemory } = await import('/src/app/discovery.ts'); discoveryMemory.clear();
    kit.store.data.games = {}; kit.store.data.stickers = [];
    kit.store.entry.birth = null; kit.store.entry.startBand = 'lap'; kit.store.data.profile.band = 'lap';
    kit.store.data.settings.howToCards = true;
    neo.go.game('bubble-pop', 'lap', undefined, false, { land: 'bubble-beach' });
  });
  await page.waitForFunction(() => !neo.switching && neo.scene.helpCard && neo.scene.level === 15);
  assert.equal(await page.evaluate(() => neo.scene.game), null);
  await play(); await complete(); await offer();
  assert.equal(await id(), 'sing-along-barn');
  assert.deepEqual(await page.evaluate(() => [kit.store.data.games['bubble-pop'].plays, kit.store.data.stickers.length]), [1, 1]);
  const first = await progress();
  await tapChoice('another'); assert.equal(await id(), 'fill-dump'); assert.equal(await progress(), first);
  await tapChoice('another'); assert.equal(await id(), 'sing-along-barn'); assert.equal(await progress(), first);
  // Controller hides the offer; the touch that returns cannot itself press it.
  await page.keyboard.press('ArrowRight', { delay: 120 });
  assert.equal(await page.evaluate(() => neo.scene.discovery.tile.visible), false);
  await page.mouse.move(88, 80); await page.mouse.down(); await page.waitForTimeout(160);
  assert.equal(await page.evaluate(() => neo.scene.discovery.tile.visible), false);
  await page.mouse.up(); await offer(); assert.equal(await id(), 'sing-along-barn');
  // Cancellation and release without a fresh down never launch.
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    for (const type of ['pointerdown', 'pointercancel', 'pointerup']) canvas.dispatchEvent(new PointerEvent(type, { clientX: 88, clientY: 80, pointerId: 31, pointerType: 'touch', bubbles: true }));
  });
  assert.equal(await id(), 'sing-along-barn');
  await page.mouse.move(88, 80); await page.mouse.down(); await page.waitForTimeout(200);
  assert.equal(await id(), 'sing-along-barn');
  await page.mouse.up();
  // A second tap during the transition must not press the new card's Play.
  await page.mouse.click(88, 80);
  await page.waitForFunction(() => !neo.switching && neo.scene.mod?.id === 'sing-along-barn');
  assert.deepEqual(await page.evaluate(() => [neo.scene.level, !!neo.scene.helpCard, neo.scene.game === null, kit.store.data.stickers.length]), [1, true, true, 1]);
  await play(); await complete(); await offer();
  assert.deepEqual(await page.evaluate(() => [kit.store.data.games['sing-along-barn'].plays, kit.store.data.stickers.length]), [1, 2]);
  await tap('neo.scene.after.home'); await scene('LandScene');
  assert.equal(await page.evaluate(() => neo.scene.land.id), 'bubble-beach');
  log('Discovery: Bubble Pop 15 → Barn 1 → Bubble Beach, ordinary rewards, full intro, canceled/held/double input');

  // Other branches share the actual result UI, with a synthetic result to avoid replaying game rules.
  await synthetic({ creation: true }); await offer();
  const shown = await id();
  await tap('neo.scene.after.heart'); assert.equal(await page.evaluate(() => kit.store.isFavorite('bubble-pop')), true); assert.equal(await id(), shown);
  const pending = await progress(); await tapChoice('another'); assert.equal(await progress(), pending);
  await page.evaluate(() => { window.keepCalls = 0; const keep = kit.store.keepCreation.bind(kit.store); window.restoreKeep = () => { kit.store.keepCreation = keep; }; kit.store.keepCreation = (...args) => { window.keepCalls++; return keep(...args); }; });
  await tap('neo.scene.after.keep'); await page.waitForTimeout(450); await tap('neo.scene.after.keep');
  assert.equal(await page.evaluate(() => window.keepCalls), 1);
  await page.evaluate(() => window.restoreKeep());
  const stable = await id(), settled = await progress();
  await screenshot('discovery-direct-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(220);
  assert.equal(await id(), stable); assert.equal(await progress(), settled);
  assert.deepEqual(await page.evaluate(() => {
    const s = neo.scene, v = neo.view;
    return [s.discovery.tile.x === 32 && s.discovery.tile.y === 24, s.resultSticker.y === v.h * .33, s.after.keep.y === v.h * .33, s.after.home.y === v.h * .72, s.resultStar.x === v.w / 2];
  }), [true, true, true, true, true]);
  await screenshot('discovery-direct-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(180);
  // Again is the same level; Next level is the next in the nonnumeric lap order.
  const level = await page.evaluate(() => neo.scene.level);
  await tap('neo.scene.after.again'); await page.waitForFunction(() => !neo.switching && !neo.scene.finished);
  assert.equal(await page.evaluate(() => neo.scene.level), level);
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 })); await offer();
  assert.equal(await id(), stable === 'sing-along-barn' ? 'fill-dump' : 'sing-along-barn');
  await tap('neo.scene.after.next'); await page.waitForFunction(() => !neo.switching && !neo.scene.finished);
  assert.deepEqual(await page.evaluate(() => [neo.scene.mod.id, neo.scene.level]), ['bubble-pop', 1]);
  // A target pin changed after display belongs to that target's full card.
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 })); await offer();
  if (await id() !== 'sing-along-barn') await tapChoice('another');
  await page.evaluate(() => { kit.store.stats('sing-along-barn').pinned = 2; kit.store.data.settings.howToCards = true; });
  await tapChoice('tile'); await page.waitForFunction(() => !neo.switching && neo.scene.mod.id === 'sing-along-barn');
  assert.deepEqual(await page.evaluate(() => [neo.scene.level, !!neo.scene.helpCard, neo.scene.game === null]), [2, true, true]);
  await page.evaluate(() => neo.scene.leave()); await scene('LandScene');
  await synthetic({ band: 'toddler', current: 'sing-along-barn' }); await offer();
  if (await id() !== 'bubble-pop') await tapChoice('another');
  await page.evaluate(() => { kit.store.stats('bubble-pop').pinned = 5; kit.store.data.settings.howToCards = true; });
  await tapChoice('tile'); await page.waitForFunction(() => !neo.switching && neo.scene.mod.id === 'bubble-pop');
  assert.deepEqual(await page.evaluate(() => [neo.scene.band, neo.scene.level, neo.scene.game === null]), ['toddler', 5, true]);
  await page.evaluate(() => neo.scene.leave()); await scene('LandScene');
  await synthetic({ creation: true }); await offer();
  const unkept = await page.evaluate(() => JSON.stringify(kit.store.data.creations));
  await tapChoice('tile'); await page.waitForFunction(() => !neo.switching && !neo.scene.finished);
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data.creations)), unkept);
  await synthetic(); await offer();
  await page.evaluate(async () => {
    const { gameById } = await import('/src/games/registry.ts');
    const mod = gameById(neo.scene.discovery.id); window.invalidMod = mod; window.oldInputs = mod.inputs; mod.inputs = ['controller'];
    // In the same task, before a frame can revalidate: the old picture may only recover.
    const before = neo.scene; before.chooseDiscovery(before.discovery.id); if (neo.scene !== before || before.navigating) throw Error('Invalid picture launched');
  });
  assert.notEqual(await id(), await page.evaluate(() => window.invalidMod.id));
  await page.evaluate(async () => {
    const { gameById } = await import('/src/games/registry.ts'); const other = gameById(neo.scene.discovery.id);
    window.invalidOther = other; window.otherInputs = other.inputs; other.inputs = ['controller'];
  });
  await page.waitForFunction(() => !neo.scene.discovery);
  assert.equal(await page.evaluate(() => !!neo.scene.after.again && !!neo.scene.after.home), true);
  await page.evaluate(() => { window.invalidMod.inputs = window.oldInputs; window.invalidOther.inputs = window.otherInputs; });
  for (const options of [{ band: 'preschool' }, { story: true }, { current: 'peekaboo-barn' }]) {
    await synthetic(options); assert.equal(await id(), null);
  }
  await synthetic(); await offer();
  await page.evaluate(() => { window.staleDiscovery = neo.scene; kit.store.reset(); window.afterReset = JSON.stringify(kit.store.data); window.staleDiscovery.chooseDiscovery(window.staleDiscovery.discovery.id); window.staleDiscovery.finish({ misses: 0, hints: 0 }); });
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), await page.evaluate(() => window.afterReset));
  await page.evaluate(() => neo.go.hub()); await scene('MapScene');
  log('Discovery: result controls, Keep, stable resize, live pins, invalid/empty offers, exclusions and reset guards');
  assert.deepEqual(errors, []);
}

return { discoveryDirectNext };
}
