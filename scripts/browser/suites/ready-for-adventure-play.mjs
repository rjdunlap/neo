import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
/**
 * The ghost finger's bot plays every touch game's demonstration to the end (the touch version of `couchgames`'s "the bot finishes
 * a round"): at the game's first and last level, within the time a demonstration gets before it replays (75 seconds for a finger), with no page error.
 * `FINGER_ONLY=bubble-pop,shape-sorter` picks games.
 */
/** Ready for Adventure: level 1 (pack the requested prop, parade); level 3 in portrait (an early pack, a requested hint with its assisted tap, the rest by drags). */
async function readyForAdventurePlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('ready-for-adventure').history.at(-1); return [r.misses, r.hints]; });
  const st = () => page.evaluate(() => { const s = neo.scene.game.state; return { misses: s.misses, hints: s.hints, glow: s.glow, props: { ...s.props }, loose: [...s.loose] }; });
  const objOf = (k) => `neo.scene.game.objs.find((o) => o.key === '${k}').node`;
  const drag = (k, to) => page.evaluate(async ([k, to]) => {
    const g = neo.scene.game, node = g.objs.find((o) => o.key === k).node;
    const dest = to === 'bag' ? g.bagNode : g.objs.find((o) => o.key === to).node;
    const p = dest.getGlobalPosition();
    await kit.dragTo(node, { x: p.x, y: p.y + 40 * neo.view.scale }, 18);
  }, [k, to]);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await launch('ready-for-adventure', 1);
  await page.waitForTimeout(800);
  const want = await page.evaluate(() => neo.scene.game.state.round.request[0]);
  await drag(`prop:${want}`, 'bag');
  await finished('ready-for-adventure');
  assert.deepEqual(await score(), [0, 0]);
  await launch('ready-for-adventure', 3);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  await screenshot('ready-for-adventure-3-portrait');
  await drag('prop:flag', 'bag');
  await page.waitForTimeout(700);
  let a = await st();
  assert.equal(a.misses, 1); assert.equal(a.props.flag, 'bare');
  await page.evaluate(() => neo.scene.game.askForHint());
  a = await st();
  assert.equal(a.hints, 1); assert.ok(a.glow);
  await page.evaluate((k) => kit.tapOn(eval(k)), objOf(a.glow === 'flag' ? 'part:ribbon' : 'part:beater'));
  await page.waitForTimeout(900);
  a = await st();
  assert.equal(a.props[a.glow ?? 'flag'] === 'bare', false);
  await page.waitForFunction(() => neo.scene.game.state.props.flag !== 'bare' || neo.scene.game.state.props.drum !== 'bare');
  for (let i = 0; i < 4; i++) {
    const n = await page.evaluate(() => { const s = neo.scene.game.state; return { f: s.props.flag, d: s.props.drum }; });
    if (n.f === 'bare') await drag('part:ribbon', 'prop:flag');
    else if (n.f === 'ready') await drag('prop:flag', 'bag');
    else if (n.d === 'bare') await drag('part:beater', 'prop:drum');
    else if (n.d === 'ready') await drag('prop:drum', 'bag');
    await page.waitForTimeout(700);
  }
  await finished('ready-for-adventure');
  assert.deepEqual(await score(), [1, 1]);
  await page.setViewportSize({ width: 1024, height: 768 });
  log('Ready for Adventure 1 and 3: pack, early pack, requested hint with assist, drags, parade, portrait, saved score passed');
}

return { readyForAdventurePlay };
}
