import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, screenshot }) {
/**
 * The level arrows on the intro card: held for a moment (a tap is not enough), they step the level within her band, and the card's
 * "this level" line, its steps and its demonstration follow. An arrow at an end is dimmed. Play builds the round at the chosen level,
 * and finishing it moves her saved level there; a grown-up's pin stays where it was. A game with one level has no arrows.
 */
async function howToLevelPick() {
  const goGame = async (id, band) => {
    await page.evaluate(({ id, band }) => neo.go.game(id, band), { id, band });
    await page.waitForFunction((id) => !neo.switching && neo.scene.constructor.name === 'GameScene' && neo.scene.mod.id === id && !!neo.scene.helpCard, id);
    await page.waitForTimeout(300);
  };
  const arrows = () => page.evaluate(() => {
    const out = [];
    const walk = (o) => { if (o.constructor.name === 'HoldButton') { const p = o.getGlobalPosition(); out.push({ x: p.x, y: p.y, alpha: o.alpha, mode: o.eventMode }); } else for (const c of o.children ?? []) walk(c); };
    walk(neo.scene.helpCard.body);
    return out.sort((a, b) => a.x - b.x);
  });
  const play = () => page.evaluate(() => {
    let found = null;
    const walk = (o) => { if (o.constructor.name === 'RoundButton') { const p = o.getGlobalPosition(); if (!found || p.x > found.x) found = { x: p.x, y: p.y }; } else for (const c of o.children ?? []) walk(c); };
    walk(neo.scene.helpCard.body);
    return found;
  });
  const card = () => page.evaluate(() => { const c = neo.scene.helpCard; return { n: c.info.levelNumber, level: c.info.level, steps: [...c.info.steps], round: neo.scene.level }; });
  const hold = async (a, ms = 700) => { await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up(); await page.waitForTimeout(250); };
  const describe = (id, level) => page.evaluate(async ({ id, level }) => (await import('/src/games/registry.ts')).gameById(id).describeLevel(level), { id, level });

  await ready();
  await page.evaluate(() => {
    kit.store.data.profile.band = 'toddler'; kit.store.data.profile.name = 'Mia';
    kit.store.data.settings.howToCards = true;
    kit.store.stats('bubble-pop').level = 3; kit.store.stats('bubble-pop').pinned = null;
  });

  // --- Arrows beside "this level", for a game with more than one level in her band (Bubble Pop plays 1–6 for a toddler).
  await goGame('bubble-pop', 'toddler');
  let c = await card();
  assert.equal(c.n, 3); assert.equal(c.round, 3);
  assert.deepEqual(c.steps, ['Tap a bubble to pop it.'], 'level 3 says only how to pop any bubble');
  let [left, right] = await arrows();
  assert.ok(left && right && left.x < right.x, 'an arrow each side');
  assert.equal(left.alpha, 1); assert.equal(right.alpha, 1);
  await page.waitForTimeout(400);
  await screenshot('howto-level-pick');
  await page.mouse.click(right.x, right.y); await page.waitForTimeout(300);
  assert.equal((await card()).n, 3, 'a tap on an arrow does nothing: it is held');
  await page.evaluate(() => { window.__first = neo.scene.helpCard.intro.demo; });
  await hold(right);
  c = await card();
  assert.equal(c.n, 4); assert.equal(c.round, 4, 'the round will be built at the chosen level');
  assert.equal(c.level, await describe('bubble-pop', 4), 'the "this level" line follows');
  assert.match(c.steps[0], /color/, 'and so do the steps');
  assert.equal(await page.evaluate(() => window.__first.dead), true, 'the old demonstration is gone');
  assert.equal(await page.evaluate(() => neo.scene.helpCard.intro.demo !== window.__first && !neo.scene.helpCard.intro.demo.dead), true, 'a new one plays the new level');
  assert.equal(await page.evaluate(() => neo.scene.helpCard.intro.demo.opts.level), 4, 'at that level');
  [left, right] = await arrows();
  await hold(left);
  assert.equal((await card()).n, 3, 'the left arrow goes back');
  // Up to the end of her band: the right arrow is dimmed there and does nothing.
  for (let i = 0; i < 3; i++) { [, right] = await arrows(); await hold(right); }
  c = await card();
  assert.equal(c.n, 6, 'the top of her band');
  [left, right] = await arrows();
  assert.ok(right.alpha < 1 && right.mode === 'none', 'the arrow at the end is dimmed');
  await hold(right);
  assert.equal((await card()).n, 6, 'and stays put');
  // Back to 4, then Play: the round is built at 4, and finishing it keeps 4 as her level.
  for (let i = 0; i < 2; i++) { [left] = await arrows(); await hold(left); }
  assert.equal((await card()).n, 4);
  const go = await play();
  await page.mouse.click(go.x, go.y);
  await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
  assert.equal(await page.evaluate(() => neo.scene.level), 4, 'the round plays the chosen level');
  assert.equal(await page.evaluate(() => kit.store.stats('bubble-pop').level), 3, 'her saved level has not moved yet: nothing is saved by looking');
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  assert.equal(await page.evaluate(() => { const s = kit.store.stats('bubble-pop'); return [s.level, s.history.at(-1).level]; }).then((x) => x.join()), '4,4', 'finishing it moves her level to the chosen one');

  // --- A grown-up's pin stays where it was; the chosen level is for this round.
  await page.evaluate(() => { kit.store.pin('bubble-pop', 5); neo.go.hub(); }); await scene('MapScene');
  await goGame('bubble-pop', 'toddler');
  assert.equal((await card()).n, 5, 'the pin sets the level on the card');
  [left] = await arrows(); await hold(left);
  assert.equal((await card()).n, 4);
  await page.mouse.click((await play()).x, (await play()).y);
  await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
  assert.equal(await page.evaluate(() => neo.scene.level), 4);
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  assert.equal(await page.evaluate(() => kit.store.stats('bubble-pop').pinned), 5, 'the pin is not moved');
  await page.evaluate(() => { kit.store.pin('bubble-pop', null); neo.go.hub(); }); await scene('MapScene');

  // --- A game with one level in her band has nothing to choose.
  await goGame('quick-tricks', 'toddler');
  assert.deepEqual(await arrows(), [], 'no arrows when there is one level');
  // Leaving without Play changes nothing about her level.
  await page.evaluate(() => neo.scene.helpCard.intro.back());
  await scene('PlaceScene');

  // --- The "?" card in a round shows the level but cannot change it.
  await page.evaluate(() => { kit.store.stats('duck-pond').level = 2; });
  await page.evaluate(() => neo.go.game('duck-pond', 'toddler', undefined, true));
  await page.waitForFunction(() => !neo.switching && neo.scene.mod?.id === 'duck-pond' && !neo.scene.helpCard);
  await page.evaluate(() => neo.scene.openHelp()); await page.waitForTimeout(200);
  assert.deepEqual(await arrows(), [], 'the card opened in a round has no arrows');
  assert.equal((await card()).n, 2);
  assert.deepEqual(errors, []);
  log('How-to level arrows: held to step, within her band, card + steps + demo follow, Play builds that level, finishing keeps it, a pin stays, one-level games and the "?" card have none');
}

return { howToLevelPick };
}
