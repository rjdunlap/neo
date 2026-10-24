import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, finished, next }) {
/** D2b: Little surprises, the three-game mix from the lap home spot (`DISCOVERY_ONLY=mix`). */
async function discoveryMix() {
  const mixState = () => page.evaluate(async () => {
    const { mixMemory } = await import('/src/app/discovery.ts');
    return mixMemory.live(kit.store.data)?.state.items.map(i => i.state) ?? null;
  });
  const play = async () => {
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
  const mixOffer = () => page.waitForFunction(() => !neo.switching && neo.scene.resultReady && neo.scene.mixControls?.tile.visible);
  const tapTile = async (key) => {
    await page.evaluate(key => { const p = neo.scene.mixControls[key].toGlobal({ x: 56, y: 56 }); kit.tap(p.x, p.y); }, key);
    await page.waitForTimeout(220);
  };
  const sheet = () => page.waitForFunction(() => !neo.switching && neo.scene.constructor.name === 'PlaceScene' && !!neo.scene.mix.sheet);
  const said = () => page.evaluate(() => (window.__said ??= []).splice(0));
  const stopCard = (id) => page.waitForFunction((id) => !neo.switching && neo.scene.mod?.id === id && !!neo.scene.helpCard && !neo.scene.game && neo.scene.helpCard.stopTiles.length === 3, id);
  const reset = (cards) => page.evaluate(async (cards) => {
    const { discoveryMemory, mixMemory } = await import('/src/app/discovery.ts'); discoveryMemory.clear(); mixMemory.end();
    kit.store.data.games = {}; kit.store.data.stickers = [];
    kit.store.entry.birth = null; kit.store.entry.startBand = 'lap'; kit.store.data.profile.band = 'lap';
    kit.store.data.settings.howToCards = cards; kit.store.data.settings.placeLayout = 'path';
    neo.go.place('lap');
  }, cards);
  const tapMixSpot = async () => {
    await scene('PlaceScene');
    assert.deepEqual(await page.evaluate(() => [!!neo.scene.mixSpot, neo.scene.mixSpot.node.x < neo.scene.landmarks[0].node.x]), [true, true]);
    await page.evaluate(() => { const s = neo.scene; s.scroll = 0; const p = s.mixSpot.node.toGlobal({ x: 0, y: -70 }); kit.tap(p.x, p.y); });
  };
  // Spoken lines, read from the device speech the app hands them to.
  await page.evaluate(() => { const speak = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = (u) => { (window.__said ??= []).push(u.text); speak(u); }; });

  // D3, cards on: the next-up stop's own card is the preview, with the stop row and Skip; one Play.
  await reset(true);
  await tapMixSpot();
  await stopCard('bubble-pop');
  assert.deepEqual(await page.evaluate(() => [neo.scene.constructor.name, !!neo.scene.game, !!neo.scene.helpCard.skipButton]), ['GameScene', false, true]);
  assert.deepEqual(await mixState(), ['upcoming', 'upcoming', 'upcoming']);
  await page.waitForTimeout(400); await said();
  // A stop tile speaks its title and launches nothing; the header picture repeats the title.
  await page.evaluate(() => kit.tapOn(neo.scene.helpCard.stopTiles[1])); await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(() => [neo.scene.mod.id, !!neo.scene.game]), ['bubble-pop', false]);
  await page.evaluate(() => { const p = neo.scene.helpCard.titleSpot.toGlobal({ x: 82, y: 70 }); kit.tap(p.x, p.y); }); await page.waitForTimeout(300);
  const heard = await said();
  if (heard.length) assert.ok(heard.includes('Sing along.') && heard.at(-1) === 'Bubbles!', `stop tile and title tap speak: ${heard}`);
  await screenshot('mix-stop-card-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(250);
  await screenshot('mix-stop-card-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(250);
  await play(); await complete(); await mixOffer();
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), 1);
  // The result's blue Home: Sing-Along Barn's card, Bubble Pop's tile wearing its sticker.
  await tap('neo.scene.after.home');
  await stopCard('sing-along-barn');
  assert.deepEqual(await page.evaluate(() => neo.scene.helpCard.stopTiles.map(t => t.item.state)), ['played', 'upcoming', 'upcoming']);
  // Skip on the card: Fill and Dump's card. Its Back ends the mix at the home spot, the sheet closed.
  await page.evaluate(() => kit.tapOn(neo.scene.helpCard.skipButton));
  await stopCard('fill-dump');
  assert.deepEqual(await mixState(), ['played', 'skipped', 'upcoming']);
  await page.evaluate(() => { const c = neo.scene.helpCard.body.children[0]; kit.tapOn(c.children.find(b => b.radius === 52)); });
  await scene('PlaceScene');
  assert.deepEqual(await page.evaluate(() => [neo.scene.mix.sheet, kit.store.data.stickers.length, kit.store.data.games['sing-along-barn']?.plays ?? 0]), [null, 1, 0]);
  assert.equal(await mixState(), null);
  log('Little surprises D3: stop card from the mix spot, tile and title speak, Home to the next card, Skip on a card, Back ends the mix');

  // Cards off: the D2a sheet is the preview, as before.
  await reset(false);
  await tapMixSpot();
  await sheet();
  assert.deepEqual(await mixState(), ['upcoming', 'upcoming', 'upcoming']);
  // A tile speaks its title and launches nothing.
  await page.evaluate(() => kit.tapOn(neo.scene.mix.sheet.tileAt(1))); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => neo.scene.constructor.name), 'PlaceScene');
  await screenshot('mix-preview-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(250);
  await screenshot('mix-preview-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(250);
  await tap('neo.scene.mix.sheet.playButton');
  await page.waitForFunction(() => !neo.switching && neo.scene.mod?.id === 'bubble-pop' && !!neo.scene.game && neo.scene.level === 15);
  await complete(); await mixOffer();
  assert.deepEqual(await page.evaluate(() => [neo.scene.discovery, neo.scene.mixControls.next, kit.store.data.stickers.length]), [null, 1, 1]);
  await screenshot('mix-result-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(250);
  await screenshot('mix-result-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(250);
  await tapTile('skip');
  await page.waitForFunction(() => neo.scene.mixControls?.next === 2);
  assert.deepEqual(await mixState(), ['played', 'skipped', 'upcoming']);
  await tapTile('tile');
  await page.waitForFunction(() => !neo.switching && neo.scene.mod?.id === 'fill-dump' && !!neo.scene.game);
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  await mixOffer();
  assert.equal(await page.evaluate(() => neo.scene.mixControls.next), null);
  await tapTile('tile');
  await sheet();
  assert.deepEqual(await page.evaluate(() => [neo.scene.mix.sheet.ending, kit.store.data.stickers.length, kit.store.data.games['bubble-pop'].plays, kit.store.data.games['fill-dump'].plays, kit.store.data.games['sing-along-barn']?.plays ?? 0]), [true, 2, 1, 1, 0]);
  assert.deepEqual(await mixState(), ['played', 'skipped', 'played']);
  log('Little surprises: preview, Bubble Pop 15 → Skip Barn → Fill and Dump → ending, one sticker per round, no D1b offer');
  // Again mix, then corner Home mid-round: the preview again at the same stop; Back ends the mix with no stat change.
  await tap('neo.scene.mix.sheet.againButton');
  await page.waitForFunction(() => !neo.switching && neo.scene.mod?.id === 'bubble-pop' && !!neo.scene.game);
  const before = await page.evaluate(() => JSON.stringify(kit.store.data.games));
  await page.evaluate(() => neo.scene.leave());
  await sheet();
  assert.deepEqual(await mixState(), ['upcoming', 'upcoming', 'upcoming']);
  await tap('neo.scene.mix.sheet.backButton');
  assert.deepEqual(await page.evaluate(() => [neo.scene.mix.sheet, JSON.stringify(kit.store.data.games)]), [null, before]);
  assert.equal(await mixState(), null);
  // The next ordinary Bubble Pop result shows D1b's offer again.
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; neo.go.game('bubble-pop', 'lap', undefined, false, { place: 'lap' }); });
  await page.waitForFunction(() => !neo.switching && !!neo.scene.game && !neo.scene.finished);
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  await page.waitForFunction(() => neo.scene.resultReady && neo.scene.discovery?.tile.visible);
  assert.equal(await page.evaluate(() => neo.scene.mixControls), null);
  log('Little surprises: Again mix, Home back to the preview, Back ends it, D1b returns afterwards');
  assert.deepEqual(errors, []);
}

return { discoveryMix };
}
