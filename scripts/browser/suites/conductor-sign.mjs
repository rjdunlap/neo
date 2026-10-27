import assert from 'node:assert/strict';

export function createSuite({ page, log, ready, scene, tap, screenshot, launch, finished }) {
async function conductorSign() {
  await launch('little-conductor', 3);
  await page.waitForFunction(() => neo.scene.game.ready, null, { timeout: 20000 });
  const before = await page.evaluate(() => kit.store.data.stickers.length);
  const req = () => page.evaluate(() => ({ ...neo.scene.game.requests, wants: neo.scene.game.round.requests }));
  const settled = () => page.waitForFunction(() => { const g = neo.scene.game; return !g.playing && !g['busy'] && !g['answering']; }, null, { timeout: 15000 });
  const { wants } = await req();
  const other = wants[0] === 'turtle' ? 'rabbit' : 'turtle';
  // Check with nothing picked: the pads wiggle, nothing is counted.
  await tap('neo.scene.game.done');
  let r = await req();
  assert.equal(r.choice, null); assert.equal(r.misses, 0); assert.equal(r.hints, 0);
  // A pad tap auditions the half at that pace; the wrong one, checked, is one miss and stays picked.
  await tap(`neo.scene.game.pads.${other}`);
  await page.waitForFunction(() => neo.scene.game.playing, null, { timeout: 5000 });
  await settled();
  await tap('neo.scene.game.done');
  r = await req();
  assert.equal(r.misses, 1); assert.equal(r.choice, other); assert.equal(r.phrase, 0);
  await settled();
  // A requested hint: the asked-for pad glows and the band previews it; counted once for this half.
  await page.evaluate(() => neo.scene.game.askForHint());
  await page.evaluate(() => neo.scene.game.askForHint());
  assert.equal((await req()).hints, 1);
  await settled();
  await screenshot('little-conductor-3-portrait');
  await tap(`neo.scene.game.pads.${wants[0]}`);
  await settled();
  await tap('neo.scene.game.done');
  await page.waitForFunction(() => neo.scene.game.requests.phrase === 1, null, { timeout: 15000 });
  await settled();
  await tap(`neo.scene.game.pads.${wants[1]}`);
  await settled();
  await tap('neo.scene.game.done');
  await finished('little-conductor');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('little-conductor').history.at(-1); return [r.level, r.misses, r.hints, kit.store.data.stickers.length]; }), [3, 1, 1, before + 1]);
  log('Little Conductor 3: Check with no pick, a wrong Check, a requested hint, both halves matched and one sticker passed');
}

return { conductorSign };
}
