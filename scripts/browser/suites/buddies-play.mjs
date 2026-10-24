import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
async function buddiesPlay() {
  const wait = () => page.waitForFunction(() => !neo.scene.game.busy);
  const drag = async (friend, target) => {
    await page.evaluate(async ({ friend, target }) => {
      const g = neo.scene.game, from = g.friends[friend];
      const to = (target === 'park' ? g.parks[friend] : g.docks[target]).getGlobalPosition();
      await kit.dragTo(from, { x: to.x, y: to.y + 40 }, 24);
    }, { friend, target });
    await page.waitForTimeout(500);
  };
  // Level 3, two make one: a flat-then-flat spoon rolls right across, Help glows the far half, a cup there catches.
  const joined = async () => {
    await launch('shape-buddies', 3); await wait();
    const before = await page.evaluate(() => { const g = neo.scene.game, say = g.ctx.say; g.spoken = []; g.ctx.say = (id, ...args) => { g.spoken.push(id); return say(id, ...args); }; return kit.store.data.stickers.length; });
    await tap('neo.scene.game.tools[0]'); await drag(0, 'bridge');
    await tap('neo.scene.game.friends[1]'); await tap('neo.scene.game.tools[0]'); await drag(1, 'receiver');
    assert.deepEqual(await page.evaluate(() => neo.scene.game.round.state.friends.map(f => f.place)), ['bridge', 'receiver'], 'both halves take a friend');
    await tap('neo.scene.game.tryButton'); await wait();
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.round.phase, neo.scene.game.spoken.includes('buddies.joinCup'), neo.scene.game.misses]), ['edit', true, 0], 'flat then flat rolls across and is explained');
    await tap('neo.scene.game.helpButton');
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.hints, neo.scene.game.round.shown.has('receiver'), neo.scene.game.round.state.selected]), [1, true, 1], 'Help glows the far half');
    await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
    await screenshot('shape-buddies-3-portrait');
    await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
    await tap('neo.scene.game.tools[1]');
    await tap('neo.scene.game.tryButton'); await wait();
    assert.equal(await page.evaluate(() => neo.scene.game.round.phase), 'caught', 'a cup at the end catches');
    await tap('neo.scene.game.pot'); await finished('shape-buddies');
    assert.equal(await page.evaluate(() => neo.scene.game.spoken.includes('buddies.together')), true);
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('shape-buddies').history.at(-1); return [r.level, r.misses, r.hints]; }), [3, 0, 1]);
    assert.deepEqual(errors, []);
    log('Shape Buddies level 3: flat-then-flat explained with joinCup, Help glows the far half, a cup catches, carried together, one sticker, misses 0 and hints 1, portrait passed');
  };
  if (process.env.BUDDIES_ONLY === '3') return joined();
  await launch('shape-buddies', 1); await wait();
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  for (let n = 0; n < 2; n++) { await tap('neo.scene.game.tryButton'); await wait(); }
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 1]);
  await tap('neo.scene.game.helpButton');
  assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'same role does not charge twice');
  await tap('neo.scene.game.tools[2]'); await drag(0, 'bridge');
  await tap('neo.scene.game.friends[1]'); await tap('neo.scene.game.tools[1]');
  await drag(1, 'bridge');
  assert.equal(await page.evaluate(() => neo.scene.game.round.state.friends[1].place), 'park', 'occupied dock rejects the drop');
  await tap('neo.scene.game.tryButton'); await wait();
  await tap('neo.scene.game.helpButton');
  assert.equal(await page.evaluate(() => neo.scene.game.hints), 2);
  await drag(1, 'receiver');
  const construction = await page.evaluate(() => JSON.stringify(neo.scene.game.round.state));
  await tap('neo.scene.game.tryButton'); await wait();
  assert.equal(await page.evaluate(() => neo.scene.game.round.phase), 'caught');
  await tap('neo.scene.game.tryButton');
  assert.equal(await page.evaluate(() => JSON.stringify(neo.scene.game.round.state)), construction, 'replay preserves construction');
  await tap('neo.scene.game.tryButton'); await wait();
  await tap('neo.scene.game.undoButton');
  assert.equal(await page.evaluate(() => neo.scene.game.round.phase), 'edit');
  assert.equal(await page.evaluate(() => neo.scene.game.round.state.friends[1].place), 'park');
  await drag(1, 'receiver');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
  await screenshot('shape-buddies-1-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await tap('neo.scene.game.tryButton'); await wait();
  await tap('neo.scene.game.pot'); await finished('shape-buddies');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1);
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('shape-buddies').history.at(-1); return [r.misses, r.hints]; }), [0, 2]);
  // Swap the friends and use the other accepted bridge shape, in the other supported band.
  await page.evaluate(() => { kit.store.data.profile.band = 'school'; neo.go.game('shape-buddies', 'school'); });
  await page.waitForFunction(() => !neo.switching && !neo.scene.finished && neo.scene.game?.round?.phase === 'edit');
  await tap('neo.scene.game.tools[1]'); await drag(0, 'receiver');
  await tap('neo.scene.game.friends[1]'); await tap('neo.scene.game.tools[0]'); await drag(1, 'bridge');
  await tap('neo.scene.game.tryButton'); await wait(); await tap('neo.scene.game.pot'); await finished('shape-buddies');
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
  // Level 2, a step down: the flat bridge that worked at level 1 falls short; a slope reaches the low bank.
  await launch('shape-buddies', 2); await wait();
  const before2 = await page.evaluate(() => { const g = neo.scene.game, say = g.ctx.say; g.spoken = []; g.ctx.say = (id, ...args) => { g.spoken.push(id); return say(id, ...args); }; return kit.store.data.stickers.length; });
  await tap('neo.scene.game.tools[0]'); await drag(0, 'bridge');
  await tap('neo.scene.game.friends[1]'); await tap('neo.scene.game.tools[1]'); await drag(1, 'receiver');
  await tap('neo.scene.game.tryButton'); await wait();
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.round.phase, neo.scene.game.spoken.includes('buddies.stepFlat'), neo.scene.game.misses]), ['edit', true, 0], 'flat bridge falls short at the step and is explained');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
  await screenshot('shape-buddies-2-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await tap('neo.scene.game.friends[0]'); await tap('neo.scene.game.tools[2]');
  await tap('neo.scene.game.tryButton'); await wait();
  assert.equal(await page.evaluate(() => neo.scene.game.round.phase), 'caught', 'a slope reaches the low bank');
  await tap('neo.scene.game.pot'); await finished('shape-buddies');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before2 + 1);
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('shape-buddies').history.at(-1); return [r.level, r.misses, r.hints]; }), [2, 0, 0]);
  // Leave during a running trace, then return through the normal land route.
  await launch('shape-buddies', 1); await tap('neo.scene.game.tryButton');
  await page.evaluate(() => neo.go.land('tinker-lab')); await scene('LandScene'); await page.waitForTimeout(700);
  assert.deepEqual(errors, []);
  await joined();
  log('Shape Buddies: experiments, role hints, both bridge shapes/identities/bands, occupied dock, replay, caught-seed undo, portrait, one sticker, level 2 flat-falls-short then slope, and interrupted run passed');
}

return { buddiesPlay };
}
