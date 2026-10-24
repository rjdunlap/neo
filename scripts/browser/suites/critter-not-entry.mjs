import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished }) {
/** Story Theater: creative choices are free; only a watched show can take a bow. */
/** Marble Jump: real taps, both ladder ends, revision, hint, portrait and one sticker. */
async function critterNotEntry() {
  await launch('critter-crossing', 8);
  await page.waitForFunction(() => !!neo.scene.game.round && !neo.scene.game.busy);
  const before = await page.evaluate(() => kit.store.data.stickers.length);
  assert.deepEqual(await page.evaluate(() => {
    const g = neo.scene.game;
    return [g.plan.mode, g.round.gate.kind, g.hidden, g.bulb.visible];
  }), ['visible', 'not', false, false]);
  await screenshot('critter-not-entry-landscape');
  // The same refused critter returns to its bank spot; two misses offer supported completion.
  for (let i = 0; i < 2; i++) {
    await page.evaluate(async () => {
      const { passes } = await import('/src/games/critter-crossing/logic.ts');
      const g = neo.scene.game, s = g.slots.find(s => !passes(s.c, g.round.gate));
      const p = s.node.toGlobal({ x: 0, y: -120 }); kit.tap(p.x, p.y);
    });
    await page.waitForFunction(n => !neo.scene.game.busy && neo.scene.game.misses === n, i + 1, { timeout: 12000 });
  }
  assert.deepEqual(await page.evaluate(() => {
    const g = neo.scene.game;
    return [g.misses, g.hints, g.hinting?.kind, g.hinting?.slot.state];
  }), [2, 1, 'test', 'waiting']);
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(300);
  await screenshot('critter-not-entry-portrait');
  await page.evaluate(async () => {
    const { passes } = await import('/src/games/critter-crossing/logic.ts');
    const g = neo.scene.game;
    for (let guard = 0; guard < 15 && !neo.scene.finished; guard++) {
      if (!await kit.until(() => !g.busy || neo.scene.finished, 15000)) throw new Error('crossing stayed busy');
      if (neo.scene.finished) break;
      const s = g.slots.find(s => s.state === 'waiting' && passes(s.c, g.round.gate));
      if (!s) throw new Error('no passing critter');
      const p = s.node.toGlobal({ x: 0, y: -120 }); kit.tap(p.x, p.y);
      await kit.sleep(200);
    }
  });
  await finished('critter-crossing');
  assert.deepEqual(await page.evaluate(() => {
    const r = kit.store.stats('critter-crossing').history.at(-1);
    return [r.level, r.misses, r.hints, kit.store.data.stickers.length];
  }), [8, 2, 1, before + 1]);
  await page.setViewportSize({ width: 1024, height: 768 });
  log('Critter Crossing 8: visible slash sign, two refused taps, passing-critter hint, two rounds and one sticker passed');
}

return { critterNotEntry };
}
