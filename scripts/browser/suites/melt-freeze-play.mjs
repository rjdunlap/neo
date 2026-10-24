import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function meltFreezePlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('melt-freeze').history.at(-1); return [r.misses, r.hints]; });
  const tally = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 20000 }); await page.waitForTimeout(200); };
  const tool = async (which) => { await page.evaluate((which) => kit.tapOn(which === 'sun' ? neo.scene.game.sunButton : neo.scene.game.snowButton), which); await settle(); };
  const state = () => page.evaluate(() => neo.scene.game.things.map((t) => t.state));
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1: the ice cube; a repeated sun is a no-change, never counted.
  await launch('melt-freeze', 1);
  await settle();
  assert.deepEqual(await state(), ['solid']);
  await tool('sun');
  assert.deepEqual(await state(), ['melted'], 'the sun melts the ice');
  await tool('sun');
  assert.deepEqual(await state(), ['melted'], 'a second sun changes nothing');
  await tool('snow');
  await finished('melt-freeze');
  assert.deepEqual(await score(), [0, 0], 'level 1 has nothing to get wrong');

  // Level 3: the authored requests; the wrong tool is one miss each, Show a hint counts once, the right tool finishes.
  await launch('melt-freeze', 3);
  await settle();
  assert.deepEqual(await page.evaluate(() => neo.scene.game.round.requests.map((r) => [r.thing, r.to])), [['ice', 'melted'], ['butter', 'solid'], ['chocolate', 'melted']], 'the authored first round');
  await tool('snow');
  assert.deepEqual(await tally(), [1, 0], 'the snowflake on hard ice: one miss');
  await page.evaluate(() => neo.scene.game.askForHint());
  await page.waitForTimeout(300);
  assert.deepEqual(await tally(), [1, 1], 'Show a hint counts one');
  await page.evaluate(() => neo.scene.game.askForHint());
  await page.waitForTimeout(300);
  assert.deepEqual(await tally(), [1, 1], 'a second hint on the same request counts nothing more');
  await tool('sun');
  assert.equal(await page.evaluate(() => neo.scene.game.round.index), 1, 'the ice request is met');
  await tool('snow');
  await tool('sun');
  await finished('melt-freeze');
  assert.deepEqual(await score(), [1, 1]);

  // Level 4: two trays; the sun melts two of four and the snowflake hardens them again; a portrait screenshot of the tray.
  await launch('melt-freeze', 4);
  await settle();
  assert.deepEqual(await page.evaluate(() => neo.scene.game.things.map((t) => t.id)), ['ice', 'butter', 'stone', 'spoon'], 'the authored first tray');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await tool('sun');
  assert.deepEqual(await state(), ['melted', 'melted', 'solid', 'solid'], 'two melt, two stay');
  await screenshot('melt-freeze-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await tool('snow');
  await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.tray), 1, 'the second tray arrives after both tools');
  await tool('snow');
  await tool('sun');
  await finished('melt-freeze');
  assert.deepEqual(await score(), [0, 0], 'level 4 counts nothing');
  const found = await page.evaluate(() => kit.store.data.journal.found.filter((k) => k.startsWith('melt-freeze:')).sort());
  assert.deepEqual(found, ['melt-freeze:butter', 'melt-freeze:chocolate', 'melt-freeze:ice', 'melt-freeze:stays'], 'the journal has every changer and the things that stayed');
  log('Melt and Freeze 1, 3 and 4: ice melts and freezes, a wrong tool and one counted hint, two trays, portrait, journal entries passed');
}
return { meltFreezePlay };
}
