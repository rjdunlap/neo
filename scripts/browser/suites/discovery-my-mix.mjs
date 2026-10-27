import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, finished, next, profiles }) {
/** D5a: Make my mix, the grown-up's table held open on the mix spot (`DISCOVERY_ONLY=my-mix`). */
async function discoveryMyMix() {
  const live = () => page.evaluate(async () => {
    const { mixMemory } = await import('/src/app/discovery.ts');
    const s = mixMemory.live(kit.store.data);
    return s ? { ids: [...s.ids], states: s.state.items.map(i => i.state) } : null;
  });
  const lineup = () => page.evaluate(() => neo.scene.mix.table?.lineup ?? null);
  const said = () => page.evaluate(() => (window.__said ??= []).splice(0));
  const reset = () => page.evaluate(async () => {
    const { discoveryMemory, mixMemory } = await import('/src/app/discovery.ts'); discoveryMemory.clear(); mixMemory.forget();
    kit.store.data.games = {}; kit.store.data.stickers = [];
    kit.store.entry.birth = null; kit.store.entry.startBand = 'lap'; kit.store.data.profile.band = 'lap';
    kit.store.data.settings.howToCards = true; kit.store.data.settings.placeLayout = 'path';
    neo.go.place('lap');
  });
  // Scrolled to the start first, and a frame later read where the spot was drawn (hit tests use the last rendered frame).
  const spot = async () => {
    await page.evaluate(() => { neo.scene.scroll = 0; });
    await page.waitForTimeout(120);
    return page.evaluate(() => { const p = neo.scene.mixSpot.node.toGlobal({ x: 0, y: -70 }); return [p.x, p.y]; });
  };
  const holdSpot = async () => {
    await scene('PlaceScene'); await page.waitForTimeout(300);
    const [x, y] = await spot();
    const ev = (type) => page.evaluate(([type, x, y]) => document.querySelector('canvas').dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true, buttons: type === 'pointerup' ? 0 : 1 })), [type, x, y]);
    // Held on scene time (headless frames run slower than the wall clock): nothing yet early, then the table, finger still down.
    await ev('pointerdown'); await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => !!neo.scene.mix.table), false, 'no table before 0.6 s');
    await page.waitForFunction(() => !!neo.scene.mix.table, null, { timeout: 5000 });
    await ev('pointerup'); await page.waitForTimeout(250);
    assert.equal(await live(), null, 'the lift after the hold starts no mix');
  };
  const tapPool = async (id) => {
    await page.evaluate((id) => { const t = neo.scene.mix.table.poolTile(id); if (!t) throw Error(`No pool tile ${id}`); kit.tapOn(t); }, id);
    await page.waitForTimeout(260);
  };
  const dragSlot = async (p, dx, dy) => {
    await page.evaluate(async ([p, dx, dy]) => {
      const t = neo.scene.mix.table.slotAt(p), a = t.getGlobalPosition();
      const k = neo.view.scale ?? 1;
      await kit.drag(kit.line([a.x, a.y], [a.x + dx * k, a.y + dy * k], 14), 1, 24);
    }, [p, dx, dy]);
    await page.waitForTimeout(400);
  };
  const stopCard = (id, n) => page.waitForFunction(([id, n]) => !neo.switching && neo.scene.mod?.id === id && !!neo.scene.helpCard && !neo.scene.game && neo.scene.helpCard.stopTiles.length === n, [id, n]);
  await page.evaluate(() => { const speak = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = (u) => { (window.__said ??= []).push(u.text); speak(u); }; });

  // 1–2. A toddler-age grown-up holds the mix spot: the table opens on Little surprises, no session.
  await reset();
  await holdSpot();
  assert.deepEqual(await lineup(), ['bubble-pop', 'sing-along-barn', 'fill-dump']);
  await screenshot('my-mix-table-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
  await screenshot('my-mix-table-portrait');
  const fits = await page.evaluate(() => { const v = neo.view; return neo.scene.mix.table.targets().every(b => b.w >= 100 && b.x >= 0 && b.y >= 0 && b.x + b.w <= v.w && b.y + b.h <= v.h); });
  assert.ok(fits, 'portrait table targets inside the view');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  // 3. A new game, Bubble Pop again: five, one a repeat. One more: "That's five", still five.
  const other = await page.evaluate(() => neo.scene.mix.table.poolTiles.map(t => t.id).find(id => !['bubble-pop', 'sing-along-barn', 'fill-dump'].includes(id)));
  await said();
  await tapPool(other); await tapPool('bubble-pop');
  assert.deepEqual(await lineup(), ['bubble-pop', 'sing-along-barn', 'fill-dump', other, 'bubble-pop']);
  await tapPool(other);
  assert.equal((await lineup()).length, 5);
  const heard = await said();
  if (heard.length) assert.equal(heard.at(-1), "That's five. Take one out first.");
  // 4. The last stop to the front, Sing-Along Barn off the row: four, in the new order.
  await dragSlot(4, -584, 0);
  assert.deepEqual(await lineup(), ['bubble-pop', 'bubble-pop', 'sing-along-barn', 'fill-dump', other]);
  await dragSlot(2, 0, 220);
  assert.deepEqual(await lineup(), ['bubble-pop', 'bubble-pop', 'fill-dump', other]);
  // 5. Play: stop 0's card with a four-tile row. Skip it, play and finish the next stop: the result shows the third.
  await page.evaluate(() => kit.tapOn(neo.scene.mix.table.playButton));
  await stopCard('bubble-pop', 4);
  assert.deepEqual((await live()).ids, ['bubble-pop', 'bubble-pop', 'fill-dump', other]);
  await page.evaluate(() => kit.tapOn(neo.scene.helpCard.skipButton));
  await stopCard('bubble-pop', 4);
  assert.deepEqual((await live()).states, ['skipped', 'upcoming', 'upcoming', 'upcoming']);
  await page.evaluate(() => { const card = neo.scene.helpCard, buttons = card.body.children.flatMap(c => c.children ?? []).filter(c => c.radius === 62); kit.tapOn(buttons[0]); });
  await page.waitForFunction(() => !!neo.scene.game && !neo.scene.helpCard);
  await page.evaluate(async () => {
    for (let guard = 0; guard < 600 && !neo.scene.finished; guard++) {
      const intent = neo.scene.game.autotouch?.();
      if (intent && 'tap' in intent) { const p = intent.tap.on.toGlobal({ x: intent.tap.x ?? 0, y: intent.tap.y ?? 0 }); kit.tap(p.x, p.y); }
      await kit.sleep(130);
    }
    if (!neo.scene.finished) throw Error('Touch round did not finish');
  });
  await page.waitForFunction(() => !neo.switching && neo.scene.resultReady && neo.scene.mixControls?.tile.visible);
  assert.equal(await page.evaluate(() => neo.scene.mixControls.next), 2);
  // 6. Home: Fill and Dump's card; its Back (Explore) ends the mix. The spot plays the same four again.
  await tap('neo.scene.after.home');
  await stopCard('fill-dump', 4);
  await page.evaluate(() => { const c = neo.scene.helpCard.body.children[0]; kit.tapOn(c.children.find(b => b.radius === 52)); });
  await scene('PlaceScene');
  assert.equal(await live(), null);
  await page.waitForTimeout(300);
  { const [x, y] = await spot(); await page.evaluate(([x, y]) => kit.tap(x, y), [x, y]); }
  await stopCard('bubble-pop', 4);
  assert.deepEqual((await live()).ids, ['bubble-pop', 'bubble-pop', 'fill-dump', other]);
  // 7. Another player and back: the spot plays Little surprises.
  await page.evaluate(async () => {
    const { selectPlayer } = await import('/src/app/players.ts');
    const first = kit.store.profiles[0].id;
    await selectPlayer(kit.store.addProfile());
    await selectPlayer(first);
    kit.store.data.profile.band = 'lap'; kit.store.data.settings.howToCards = true; kit.store.data.settings.placeLayout = 'path';
    neo.go.place('lap');
  });
  await scene('PlaceScene'); await page.waitForTimeout(300);
  { const [x, y] = await spot(); await page.evaluate(([x, y]) => kit.tap(x, y), [x, y]); }
  await stopCard('bubble-pop', 3);
  assert.deepEqual((await live()).ids, ['bubble-pop', 'sing-along-barn', 'fill-dump']);
  log(`Make my mix D5a: hold opens the table, add/repeat/full, drag to reorder and off the row, Play a four-stop mix (Skip, play, result tile at stop 3), Explore keeps the lineup, another player resets it (added ${other})`);
}

return { discoveryMyMix };
}
