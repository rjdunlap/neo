import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
/** Bond Beads: level 1 with a drag link, a tap-tap link and a tapped-off link, then every tray held (0/0); level 2 with two wrong Checks (a repeat in between counts nothing), Show a hint (still one hint), a portrait screenshot, then both cards (2/1). */
async function bondBeadsPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('bond-beads').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => [neo.scene.game.tally.misses, neo.scene.game.tally.hints]);
  const links = () => page.evaluate(() => neo.scene.game.bench.links.length);
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 25000 }); await page.waitForTimeout(250); };
  /** Carry bead a onto bead b. */
  const carry = (a, b) => page.evaluate(async ([a, b]) => { const g = neo.scene.game; await kit.dragTo(g.beadNodes[a], g.beadNodes[b].getGlobalPosition()); }, [a, b]);
  /** A pair of beads that can be linked now, or null. */
  const freePair = () => page.evaluate(async () => {
    const { canLink } = await import('/src/games/bond-beads/logic.ts');
    const b = neo.scene.game.bench;
    for (let i = 0; i < b.kinds.length; i++) for (let j = i + 1; j < b.kinds.length; j++) if (canLink(b.kinds, b.links, i, j)) return [i, j];
    return null;
  });
  /** Tap the middle of the first link. */
  const tapLink = () => page.evaluate(() => {
    const g = neo.scene.game; const [a, b] = g.bench.links[0]; const p = g.layoutNow.beads;
    const at = g.linkLayer.toGlobal({ x: (p[a].x + p[b].x) / 2, y: (p[a].y + p[b].y) / 2 }); kit.tap(at.x, at.y);
  });
  /** Do what the ghost finger would do, until the round ends. */
  const playOut = async () => {
    for (let i = 0; i < 40; i++) {
      await settle();
      if (await page.evaluate(() => neo.scene.finished || neo.scene.game.finished)) return;
      await page.evaluate(async () => {
        const g = neo.scene.game; const t = g.autotouch(0);
        if (!t) return;
        if ('drag' in t) await kit.dragTo(t.drag.on, t.to.on.getGlobalPosition());
        else if (t.tap.on === g.linkLayer) { const p = g.linkLayer.toGlobal({ x: t.tap.x, y: t.tap.y }); kit.tap(p.x, p.y); }
        else kit.tapOn(t.tap.on);
      });
    }
  };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await launch('bond-beads', 1);
  await settle();
  let pair = await freePair();
  await carry(pair[0], pair[1]); await settle();
  assert.equal(await links(), 1, 'carrying a bead onto another links them');
  await tapLink(); await settle();
  assert.equal(await links(), 0, 'tapping a link breaks it');
  await page.evaluate(() => neo.scene.game.undoButton.press()); await settle();
  assert.equal(await links(), 1, 'Undo brings the link back');
  await page.evaluate(() => kit.tapOn(neo.scene.game.againButton)); await settle();
  assert.equal(await links(), 0, 'Start again takes every link apart');
  pair = await freePair();
  await page.evaluate(([a, b]) => { const g = neo.scene.game; kit.tapOn(g.beadNodes[a]); }, pair); await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.selected), pair[0], 'a tap selects a bead');
  await page.evaluate(([a, b]) => { const g = neo.scene.game; kit.tapOn(g.beadNodes[b]); }, pair); await settle();
  assert.equal(await links(), 1, 'a second tap links the pair');
  await playOut();
  await finished('bond-beads');
  assert.deepEqual(await score(), [0, 0]);

  await launch('bond-beads', 2);
  await settle();
  pair = await freePair();
  await carry(pair[0], pair[1]); await settle();
  await page.evaluate(() => kit.tapOn(neo.scene.game.checkButton)); await settle();
  assert.deepEqual(await tally(), [1, 0], 'a wrong Check is one miss');
  await page.evaluate(() => kit.tapOn(neo.scene.game.checkButton)); await settle();
  assert.deepEqual(await tally(), [1, 0], 'the same build checked again counts nothing');
  pair = await freePair();
  if (pair) await carry(pair[0], pair[1]); else await tapLink();
  await settle();
  await page.evaluate(() => kit.tapOn(neo.scene.game.checkButton)); await settle();
  assert.deepEqual(await tally(), [2, 1], 'a second wrong build is a miss and lights the glow (one hint)');
  await page.evaluate(() => neo.scene.game.askForHint()); await settle();
  assert.deepEqual(await tally(), [2, 1], 'Show a hint after the glow counts nothing more');
  await playOut();
  await finished('bond-beads');
  assert.deepEqual(await score(), [2, 1]);

  // Level 3: two built shapes open on the table; Check at once is a miss; Start again returns to the opening shapes.
  await launch('bond-beads', 3);
  await settle();
  const opening = await links();
  assert.ok(opening >= 3, 'level 3 opens with built shapes on the table');
  assert.equal(await page.evaluate(() => neo.scene.game.steps[0].requests[0].length), 2, 'the level 3 card asks for two shapes');
  await page.evaluate(() => kit.tapOn(neo.scene.game.checkButton)); await settle();
  assert.deepEqual(await tally(), [1, 0], 'checking the opening shapes is one miss');
  await tapLink(); await settle();
  assert.equal(await links(), opening - 1, 'tapping a link breaks one of the opening links');
  await page.evaluate(() => kit.tapOn(neo.scene.game.againButton)); await settle();
  assert.equal(await links(), opening, 'Start again restores the opening shapes');
  await playOut();
  await finished('bond-beads');
  assert.deepEqual(await score(), [1, 0]);

  // Level 4: seven loose beads with two cards; a wrong Check, Show a hint, portrait screenshot, then both ways.
  await launch('bond-beads', 4);
  await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.bench.kinds.length), 7, 'the first set has seven beads');
  assert.equal(await links(), 0, 'level 4 opens with loose beads');
  pair = await freePair();
  await carry(pair[0], pair[1]); await settle();
  await page.evaluate(() => kit.tapOn(neo.scene.game.checkButton)); await settle();
  assert.deepEqual(await tally(), [1, 0], 'a wrong Check at level 4 is one miss');
  await page.evaluate(() => neo.scene.game.askForHint()); await settle();
  assert.deepEqual(await tally(), [1, 1], 'Show a hint counts one hint');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(900);
  await screenshot('bond-beads-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  // Play the first shape out and see the card fade it before the second.
  for (let i = 0; i < 20; i++) {
    await settle();
    if (await page.evaluate(() => !!neo.scene.game.first)) break;
    await page.evaluate(async () => {
      const g = neo.scene.game; const t = g.autotouch(0);
      if (!t) return;
      if ('drag' in t) await kit.dragTo(t.drag.on, t.to.on.getGlobalPosition());
      else if (t.tap.on === g.linkLayer) { const p = g.linkLayer.toGlobal({ x: t.tap.x, y: t.tap.y }); kit.tap(p.x, p.y); }
      else kit.tapOn(t.tap.on);
    });
  }
  assert.ok(await page.evaluate(() => !!neo.scene.game.first), 'after the first shape matches, the set goes on to the other shape');
  assert.ok(await links() > 0, 'the beads keep their links into the second shape');
  await screenshot('bond-beads-4-second');
  await playOut();
  await finished('bond-beads');
  assert.deepEqual(await score(), [1, 1]);
  log('Bond Beads 1–4: drag link, tap break, Undo, Start again, tap-tap link, trays held; two misses, repeat Check ignored, glow hint, cards matched; level 3 opening shapes, miss, Start again, rebuilt; level 4 seven beads, miss, hint, portrait, first shape faded, both ways passed');
}

return { bondBeadsPlay };
}
