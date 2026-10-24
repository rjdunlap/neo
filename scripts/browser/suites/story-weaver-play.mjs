import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
/** Story Weaver: level 1 played by the ghost finger's rule (0/0); level 2 with a friend, the owl's question and "That's my story" (0/0); level 3 with sad chosen, a free unfitting reason, a counted one, the star hint, then a fitting reason (1/1); a portrait screenshot of level 3. */
async function storyWeaverPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('story-weaver').history.at(-1); return [r.misses, r.hints]; });
  const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 30000 }); await page.waitForTimeout(150); };
  const botTap = () => page.evaluate(async () => { const i = neo.scene.game.autotouch(0); if (i?.tap) await kit.tapOn(i.tap.on); return !!i; });
  const botUntil = async (done) => {
    for (let i = 0; i < 40; i++) {
      await settle();
      if (await page.evaluate(done)) return;
      await botTap();
    }
    throw new Error('Story Weaver bot did not reach its goal');
  };
  const tapTwice = (id) => page.evaluate(async (id) => {
    const g = neo.scene.game;
    await kit.tapOn(g.tiles.find((t) => t.id === id).node);
    await kit.sleep(300);
    await kit.tapOn(g.tiles.find((t) => t.id === id).node);
  }, id);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await launch('story-weaver', 1);
  await botUntil(() => neo.scene.finished || neo.scene.game.finished);
  await finished('story-weaver');
  assert.deepEqual(await score(), [0, 0]);
  await launch('story-weaver', 2);
  await settle();
  await tapTwice(await page.evaluate(() => neo.scene.game.tiles[0].id));
  await settle();
  await page.evaluate(() => kit.tapOn(neo.scene.game.buttons.read));
  await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.round.owlAsk), 'where', 'the owl asks about the first missing part');
  await page.evaluate(() => kit.tapOn(neo.scene.game.buttons.mine));
  await finished('story-weaver');
  assert.deepEqual(await score(), [0, 0], "the owl's question and That's my story are never a miss");
  await launch('story-weaver', 3);
  await botUntil(() => neo.scene.game.round.active === 'feeling' && neo.scene.game.round.phase === 'build');
  await tapTwice('sad');
  await settle();
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(800);
  await screenshot('story-weaver-3-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  const ending = await page.evaluate(() => neo.scene.game.round.story.ending);
  await tapTwice(ending);
  await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.round.misses), 0, 'the first reason that does not fit is free');
  await tapTwice(ending);
  await settle();
  assert.equal(await page.evaluate(() => neo.scene.game.round.misses), 1, 'a second reason that does not fit counts one miss');
  await page.evaluate(() => kit.tapOn(neo.scene.game.buttons.hint));
  await settle();
  const [hints, glowing, problem] = await page.evaluate(() => { const r = neo.scene.game.round; return [r.hints, r.glowing(), r.story.problem]; });
  assert.deepEqual([hints, glowing], [1, [problem]], 'the star glows only the problem for sad, one hint');
  await botUntil(() => neo.scene.finished || neo.scene.game.finished);
  await finished('story-weaver');
  assert.deepEqual(await score(), [1, 1]);
  log("Story Weaver 1, 2 and 3: bot story, owl question, That's my story, free and counted reasons, star hint, saved scores, level-3 portrait passed");
}
return { storyWeaverPlay };
}
