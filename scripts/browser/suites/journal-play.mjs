import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, tap, screenshot, launch, finished }) {
async function journalPlay() {
  await page.evaluate(() => { kit.store.data.stickers = []; kit.store.data.journal = { found: [], seen: 0 }; });
  const found = () => page.evaluate(() => [...kit.store.data.journal.found]);
  // Real Sink or Float play (drop level): every thing she watches go into the water is a discovery.
  await launch('sink-float', 1); await page.waitForTimeout(900);
  const things = await page.evaluate(() => neo.scene.game.items.map((i) => i.thing));
  for (let i = 0; i < things.length; i++) { await page.evaluate((i) => kit.tapOn(neo.scene.game.items[i].node), i); await page.waitForTimeout(700); }
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 40000 }); await page.waitForTimeout(900);
  assert.deepEqual((await found()).sort(), things.map((t) => `sink-float:${t}`).sort());
  assert.equal(await page.evaluate(() => neo.scene.discovered.length), things.length, 'the end of the round shows what is new');
  await screenshot('journal-new');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), 1, 'one sticker as always');
  // The treehouse button twinkles; opening the journal marks everything as looked at.
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => neo.scene.journalButton.children.length), 3, 'a twinkle on the journal button');
  await tap('neo.scene.journalButton'); await scene('JournalScene'); await page.waitForTimeout(500);
  const view = () => page.evaluate(() => ({ page: neo.scene.page, found: neo.scene.cards.filter((c) => c.found).length, twinkles: neo.scene.cards.filter((c) => c.sparkle).length, seen: kit.store.data.journal.seen }));
  assert.deepEqual(await view(), { page: 0, found: things.length, twinkles: things.length, seen: things.length });
  await screenshot('journal-page-one');
  // A card she has not found names the exact action; a found card says what she saw and how she found it.
  const detail = () => page.evaluate(() => ({ observation: neo.scene.detail.children[1].text, source: neo.scene.detail.children[2].text }));
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => !c.found && c.node.visible).node)); await page.waitForTimeout(300);
  assert.deepEqual(await detail(), { observation: 'Not found yet.', source: await page.evaluate(() => {
    const e = neo.scene.selected;
    return `In Sink or Float, Put the ${e.key} into the water.`;
  }) });
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => c.found && c.node.visible).node)); await page.waitForTimeout(300);
  assert.match((await detail()).observation, /float|sink/i);
  assert.match((await detail()).source, /^Found in Sink or Float when the .* went into the water\.$/);
  // Page two holds the animals; the green arrow goes to the game that shows the chosen one, at a band that game plays.
  await tap('neo.scene.next'); await page.waitForTimeout(400);
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => c.entry.id === 'animal-snack:cow').node)); await page.waitForTimeout(300);
  assert.deepEqual(await detail(), { observation: 'Not found yet.', source: 'In Animal Snack, Let the cow eat hay.' });
  await page.evaluate(() => { kit.store.data.profile.band = 'school'; });
  await tap('neo.scene.play'); await scene('GameScene');
  assert.deepEqual(await page.evaluate(() => [neo.scene.mod.id, neo.scene.band, neo.scene.origin]), ['animal-snack', 'preschool', { journal: true }]);
  // Holding home comes back to the journal, not to a place.
  await page.mouse.move(62, 62); await page.mouse.down();
  await scene('JournalScene'); await page.mouse.up();
  // Real Animal Snack play (munch level): each animal seen eating is a discovery.
  await launch('animal-snack', 1); await page.waitForTimeout(900);
  const friends = await page.evaluate(() => neo.scene.game.friends.map((f) => f.name));
  for (let i = 0; i < 6; i++) {
    await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 15000 });
    await page.evaluate((i) => kit.tapOn(neo.scene.game.friends[i % neo.scene.game.friends.length].node, 0, -120), i); await page.waitForTimeout(300);
  }
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 40000 }); await page.waitForTimeout(900);
  const all = await found();
  assert.deepEqual(all.filter((id) => id.startsWith('animal-snack:')).sort(), friends.map((f) => `animal-snack:${f}`).sort());
  assert.equal(await page.evaluate(() => neo.scene.discovered.length), friends.length);
  assert.equal(all.length, things.length + friends.length, 'nothing found twice');
  // Back in the journal it opens where the new things are.
  await page.evaluate(() => neo.go.journal()); await scene('JournalScene'); await page.waitForTimeout(500);
  assert.deepEqual(await view(), { page: 1, found: things.length + friends.length, twinkles: friends.length, seen: things.length + friends.length });
  await screenshot('journal-page-two');
  assert.match((await detail()).observation, /eats|chews/, 'the strip starts on the first new thing');
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => c.found && c.entry.game === 'animal-snack').node)); await page.waitForTimeout(300);
  assert.match((await detail()).observation, /eats|chews/);
  assert.match((await detail()).source, /^Found in Animal Snack when the .* ate .+\.$/);
  // Photo Safari files only the action words in successful photos.
  await launch('photo-safari', 1); await page.waitForTimeout(700);
  await page.evaluate(async () => {
    const g = neo.scene.game;
    for (let p = 0; p < g.plan.photos; p++) {
      await kit.until(() => g.photos === p && !g.busy && g.actors.length, 15000);
      kit.tapOn(g.actors[p % g.actors.length], 0, -60);
      await kit.until(() => g.photos > p, 10000);
    }
  });
  await finished('photo-safari');
  const safari = await page.evaluate(() => [...neo.scene.game.photographed].map((action) => `photo-safari:${action}`).sort());
  assert.deepEqual((await found()).filter((id) => id.startsWith('photo-safari:')).sort(), safari);
  // Seesaw Balance files each balance rule only after a tray change makes it visible.
  await launch('seesaw-balance', 3); await page.waitForTimeout(500);
  await page.evaluate(async () => {
    const g = neo.scene.game;
    for (let r = 0; r < g.rounds.length; r++) {
      await kit.until(() => g.index === r && !g.busy && g.items.length, 15000);
      const side = g.round.fixedSide === 'left' ? 'right' : 'left';
      for (let k = 0; k < g.round.answer; k++) {
        const block = g.items.find((i) => !i.fixed && !i.side);
        const top = g.trayTop(side), to = g.layer.toGlobal({ x: top.x, y: top.y + 20 });
        await kit.dragTo(block.node, to, 12); await kit.sleep(250);
      }
    }
  });
  await finished('seesaw-balance');
  assert.deepEqual((await found()).filter((id) => id.startsWith('seesaw-balance:')).sort(), ['seesaw-balance:equal-level', 'seesaw-balance:heavy-down']);
  // Bouncy Launch files the distance rule after two plainly different real pull-and-release launches.
  await launch('bouncy-launch', 2); await page.waitForTimeout(500);
  await page.evaluate(async () => {
    const g = neo.scene.game, { pullFor } = await import('/src/games/bouncy-launch/logic.ts');
    for (const f of [0.2, 0.9, 0.5, 0.7]) {
      await kit.until(() => !g.flying, 10000);
      const d = pullFor(f) / Math.SQRT2, p = g.pet.getGlobalPosition();
      await kit.drag(kit.line([p.x, p.y - 80], [p.x - d, p.y - 80 + d], 10), 1, 16);
      await kit.until(() => g.flying, 2000); await kit.until(() => !g.flying, 10000);
    }
  });
  await finished('bouncy-launch');
  assert.deepEqual((await found()).filter((id) => id.startsWith('bouncy-launch:')), ['bouncy-launch:bigger-pull']);
  const expanded = await found();
  const expandedNew = expanded.length - all.length;
  // The new discoveries occupy page three; each card still names the exact observation that revealed it.
  await page.evaluate(() => neo.go.journal()); await scene('JournalScene'); await page.waitForTimeout(500);
  assert.deepEqual(await view(), { page: 2, found: expanded.length, twinkles: expandedNew, seen: expanded.length });
  await screenshot('journal-page-three');
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => c.entry.id === 'seesaw-balance:equal-level').node)); await page.waitForTimeout(300);
  assert.deepEqual(await detail(), { observation: 'When both sides have the same weight, the seesaw stays level.', source: 'Found in Seesaw Balance when both sides weighed the same and the seesaw became level.' });
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => c.entry.id === 'bouncy-launch:bigger-pull').node)); await page.waitForTimeout(300);
  assert.match((await detail()).source, /bigger pull sent the pet farther/);
  // A reload keeps everything and nothing twinkles any more.
  await page.evaluate(() => kit.store.flush()); await page.waitForTimeout(400);
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.journal()); await scene('JournalScene'); await page.waitForTimeout(500);
  assert.deepEqual(await found(), expanded);
  assert.equal((await view()).twinkles, 0);
  // Portrait: the cards stay clear of the strip, and the room's buttons clear of each other.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => { const strip = neo.scene.detail.getBounds(); return neo.scene.cards.filter((c) => c.node.visible).every((c) => { const b = c.node.getBounds(); return b.y + b.height < strip.y; }); }), 'cards clear the strip');
  await screenshot('journal-portrait');
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => { const bs = [neo.scene.journalButton, neo.scene.flip, neo.scene.tidyButton].map((b) => b.getBounds()); return bs.every((a, i) => bs.every((b, j) => i === j || a.x + a.width <= b.x || b.x + b.width <= a.x)); }), 'the buttons do not overlap');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Journal: Sink or Float, Animal Snack, Photo Safari, Seesaw Balance and Bouncy Launch file only observations actually seen in a finished round; the end of the round shows what is new and gives one sticker; the treehouse button twinkles until she opens the journal; every unfound card names the exact revealing action and every found card remembers it, while the green arrow opens the game at a band it plays; all three pages, a reload and portrait stay clear');
}

return { journalPlay };
}
